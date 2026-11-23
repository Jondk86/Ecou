"""Spleeter TF checkpoint -> PyTorch U-Nets -> one ONNX (fp16 weights, fp32 compute).
usage: convert.py <ckpt_dir> <n_inst> <act: leaky|elu> <out.onnx> [verify_onnx_dir]"""
import sys, re, numpy as np, torch, torch.nn as nn, torch.nn.functional as Fn
import tensorflow as tf

ck, NI, ACT, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
r = tf.train.load_checkpoint(ck)
shapes = r.get_variable_to_shape_map()
names = sorted(k for k in shapes if not re.search(r'Adam|beta[12]_power|global_step', k))
print(len(names), names[:6])

def idx(prefix):  # e.g. conv2d -> {0: 'conv2d', 1: 'conv2d_1', ...}
    out = {}
    for k in names:
        m = re.match(r'^(?:.*/)?(' + prefix + r')(?:_(\d+))?/kernel$', k)
        if m: out[int(m.group(2) or 0)] = k[:-len('/kernel')]
    return out
CV, CT = idx('conv2d'), idx('conv2d_transpose')
BN = {}
for k in names:
    m = re.match(r'^(?:.*/)?(batch_normalization)(?:_(\d+))?/gamma$', k)
    if m: BN[int(m.group(2) or 0)] = k[:-len('/gamma')]
print('conv', len(CV), 'convT', len(CT), 'bn', len(BN))
g = lambda n: torch.tensor(r.get_tensor(n))

def act(x): return Fn.elu(x) if ACT == 'elu' else Fn.leaky_relu(x, 0.2)
def dact(x): return Fn.elu(x) if ACT == 'elu' else Fn.relu(x)

class UNet(nn.Module):
    def __init__(s, i):
        super().__init__()
        s.cw = [g(CV[7 * i + j] + '/kernel').permute(3, 2, 0, 1).contiguous() for j in range(7)]
        s.cb = [g(CV[7 * i + j] + '/bias') for j in range(7)]
        s.tw = [g(CT[6 * i + j] + '/kernel').permute(3, 2, 0, 1).contiguous() for j in range(6)]
        s.tb = [g(CT[6 * i + j] + '/bias') for j in range(6)]
        s.bn = [[g(BN[12 * i + j] + '/' + p) for p in ('gamma', 'beta', 'moving_mean', 'moving_variance')] for j in range(12)]
        for lst, nm in ((s.cw, 'cw'), (s.cb, 'cb'), (s.tw, 'tw'), (s.tb, 'tb')):
            for j, t in enumerate(lst): s.register_buffer(f'{nm}{j}', t)
        for j, q in enumerate(s.bn):
            for k, t in enumerate(q): s.register_buffer(f'bn{j}_{k}', t)
    def b(s, x, j):
        ga, be, mu, va = s.bn[j]
        return Fn.batch_norm(x, mu, va, ga, be, False, 0.0, 1e-3)
    def conv(s, x, j):  # 5x5 stride 2 'same'
        return Fn.conv2d(Fn.pad(x, (1, 2, 1, 2)), s.cw[j], s.cb[j], stride=2)
    def up(s, x, j):
        y = Fn.conv_transpose2d(x, s.tw[j], s.tb[j], stride=2)
        H, W = x.shape[2] * 2, x.shape[3] * 2
        return y[:, :, 1:1 + H, 1:1 + W]
    def forward(s, x):  # x (N,2,T,F)
        c = []; h = x
        for j in range(6):
            cj = s.conv(h, j); c.append(cj); h = act(s.b(cj, j))
        u = c[5]
        for j in range(5):
            u = s.b(dact(s.up(u, j)), 6 + j)
            u = torch.cat([c[4 - j], u], 1)
        u = s.b(dact(s.up(u, 5)), 11)
        m = torch.sigmoid(Fn.conv2d(Fn.pad(u, (3, 3, 3, 3)), s.cw[6], s.cb[6], dilation=2))
        return m * x

class All(nn.Module):
    def __init__(s):
        super().__init__(); s.nets = nn.ModuleList([UNet(i) for i in range(NI)])
    def forward(s, x):  # x (2,S,512,1024) like the sherpa-onnx models
        z = x.permute(1, 0, 2, 3)
        return tuple(n(z).permute(1, 0, 2, 3) for n in s.nets)

m = All().eval()
x = torch.rand(2, 1, 512, 1024) * 3
with torch.no_grad(): ys = m(x)
if len(sys.argv) > 5:  # check against sherpa-onnx 2-stem export
    import onnxruntime as ort
    for i, nm in enumerate(['vocals', 'accompaniment']):
        s = ort.InferenceSession(f'{sys.argv[5]}/{nm}.fp16.onnx', providers=['CPUExecutionProvider'])
        ref = s.run(None, {'x': x.numpy()})[0]; e = ys[i].numpy()
        print(nm, 'max abs diff', float(np.abs(ref - e).max()), 'ref max', float(np.abs(ref).max()),
              'rel err dB', 10 * np.log10(np.sum((ref - e) ** 2) / np.sum(ref ** 2)))
torch.onnx.export(m, (x,), OUT, input_names=['x'], output_names=[f'y{i}' for i in range(NI)], opset_version=17,
                  dynamic_axes={'x': {1: 'S'}, **{f'y{i}': {1: 'S'} for i in range(NI)}}, dynamo=False)
import onnx
from onnx import numpy_helper, helper, TensorProto
mo = onnx.load(OUT); gr = mo.graph; new = []; casts = []
for init in list(gr.initializer):
    a = numpy_helper.to_array(init)
    if a.dtype == np.float32 and a.size > 16:
        h = numpy_helper.from_array(a.astype(np.float16), init.name + '_h'); new.append(h)
        casts.append(helper.make_node('Cast', [init.name + '_h'], [init.name], to=TensorProto.FLOAT)); gr.initializer.remove(init)
gr.initializer.extend(new)
nodes = list(gr.node); del gr.node[:]; gr.node.extend(casts + nodes)
onnx.save(mo, OUT.replace('.onnx', '.fp16.onnx'))
import os; print('saved', os.path.getsize(OUT), os.path.getsize(OUT.replace('.onnx', '.fp16.onnx')))
