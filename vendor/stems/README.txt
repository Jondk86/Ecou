Stem splitter, loaded on demand by the Sheet music card (Split song / Split into 4 stems), never precached by sw.js.

Model: Spleeter 4-stems (vocals / drums / bass / other) by Deezer. Pretrained checkpoint 4stems.tar.gz from the
deezer/spleeter GitHub release v1.4.0; licence MIT (LICENSE-spleeter.txt, from the spleeter wheel on PyPI, whose
metadata says "License: MIT" for "the Deezer source separation library with pretrained models").
Converted by Ecou with convert-spleeter.py (TF checkpoint -> PyTorch U-Nets -> ONNX opset 17, one graph, outputs
y0..y3 = vocals, drums, bass, other; weights stored as float16 and cast to float32). The converter was checked on the
2-stems checkpoint against the independent sherpa-onnx export (difference -48/-73 dB, fp16 rounding).
spleeter4.fp16.onnx = cat spleeter4.fp16.onnx.part0 ... part7 (78,741,754 bytes), parts listed in manifest.json.

worker.js (Ecou, same licence as the app): STFT 4096/1024 Hann, magnitudes of bins 0-1023 in 512-frame segments,
ratio masks (power 2) with Spleeter's "average" extension above 11 kHz, inverse STFT; the last stem is mix minus the
others, so the stems always add back to the mixture. Segments of about 11.8 s, overlap-add with 1 s cross-fades.
Parts are cached part by part in Cache Storage 'ecou-stems-v2' (resumes after an interrupted download).
Runtime: ../ort (ONNX Runtime Web), WebGPU when available, otherwise WASM SIMD (threads when cross-origin isolated).

Licence of the pretrained 4-stem weights (checked 2026-11-23):
Deezer's own paper.md in github.com/deezer/spleeter states: "Spleeter source code and pre-trained models are available on github and distributed under a MIT license." (JOSS paper, doi:10.21105/joss.02154). Converted to ONNX (fp16) by the Ecou team; MIT notice in LICENSE-spleeter.txt.
