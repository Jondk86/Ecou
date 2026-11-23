var TRX={parts:null,orig:null,name:'',bpm:120,mode:'melody',busy:false,dur:0,cancel:false,t0:0,sec:{start:0,len:60}};
var SCOREX=null;
var TRXSTEM={vocals:{n:'Vocals',k:'mel',clef:'treble'},bass:{n:'Bass',k:'mel',clef:'bass'},other:{n:'Other instruments',k:'poly',clef:'treble'},drums:{n:'Drums',k:'drum',clef:'perc'}};
function trxBase(){return new Promise(function(res){var u=new URL('vendor/basic-pitch/basicpitch.js',document.baseURI).href;fetch(u,{method:'HEAD'}).then(function(r){res(r.ok?new URL('./',document.baseURI).href:SMPALT);},function(){res(SMPALT);});});}
/* Note-detection worker. Runs Basic Pitch (Spotify, Apache-2.0) on ONNX Runtime Web (WASM SIMD) window by window with real progress,
   then turns the frame/onset maps into notes here, off the main thread, in linear time. The tfjs build is only a fallback.
   Modes: melody = one top voice (Viterbi path through the pitch map), bassline = lowest voice, poly = every note with
   harmonic-ghost removal, song = lead + chords + bass split of a full mix. */
function trxWorker(){
var NS=43844,OVL=7680,HOP=NS-OVL,NF=172,KEEP=142,SR=22050;
function ft(i){var w=Math.floor(i/KEEP);return (w*HOP+256*(i-w*KEEP))/SR;}
function runOrt(d,pcm,F,FR,ON,prog){
  importScripts(d.ort+'ort.min.js');var ort=self.ort;
  ort.env.wasm.wasmPaths=d.ort;ort.env.wasm.numThreads=self.crossOriginIsolated?Math.max(1,Math.min(4,(navigator.hardwareConcurrency||2)-1)):1;
  return ort.InferenceSession.create(d.ort+'nmp.onnx',{executionProviders:['wasm']}).then(function(sess){
    self.postMessage({t:'be',be:'ort'});
    var pad=new Float32Array(OVL/2+pcm.length);pad.set(pcm,OVL/2);var nW=F/KEEP,w=0,x=new Float32Array(NS);
    function step(){if(w>=nW)return Promise.resolve();x.fill(0);x.set(pad.subarray(w*HOP,Math.min(pad.length,w*HOP+NS)));
      return sess.run({'serving_default_input_2:0':new ort.Tensor('float32',x,[1,NS,1])}).then(function(o){var A=o['StatefulPartitionedCall:1'].data,B=o['StatefulPartitionedCall:2'].data;
        for(var f=15;f<NF-15;f++){var k=w*KEEP+f-15;FR.set(A.subarray(f*88,f*88+88),k*88);ON.set(B.subarray(f*88,f*88+88),k*88);}
        w++;prog(w/nW);return step();});}
    return step();});}
function runTf(d,pcm,F,FR,ON,prog){self.window=self;importScripts(d.lib);var BP=self.EcouBP,tf=BP.tf;
  return Promise.resolve().then(function(){return tf.setBackend('webgl');}).catch(function(){return false;}).then(function(){if(tf.getBackend()!=='webgl')return tf.setBackend('cpu');}).then(function(){return tf.ready();})
  .then(function(){self.postMessage({t:'be',be:'tfjs-'+tf.getBackend()});var bp=new BP.BasicPitch(d.model),k=0;
    return bp.evaluateModel(pcm,function(f,o){for(var i=0;i<f.length&&k<F;i++,k++){FR.set(f[i],k*88);ON.set(o[i],k*88);}},prog);});}
function ov(a,b){return Math.max(0,Math.min(a[1],b[1])-Math.max(a[0],b[0]));}
function peak(ON,F,t,q,th){var o=ON[t*88+q];return o>=th&&(t===0||ON[(t-1)*88+q]<=o)&&(t>=F-1||ON[(t+1)*88+q]<=o);}
/* every note: onset peaks extended while the frame map stays on (short dips bridged), plus long sustained regions without an onset */
function polyNotes(FR,ON,F,p){var out=[],cov=new Uint8Array(F),t,k;
  for(var q=p.lo;q<=p.hi;q++){cov.fill(0);
    for(t=0;t<F;t++){if(!peak(ON,F,t,q,p.on))continue;var o=ON[t*88+q],e=t+1,low=0;
      while(e<F){if(e>t+3&&peak(ON,F,e,q,p.on))break;if(FR[e*88+q]<p.fr){if(++low>=p.tol)break;}else low=0;e++;}
      var end=e-low;if(end-t<p.minLen)continue;var s=0;for(k=t;k<end;k++){s+=FR[k*88+q];cov[k]=1;}out.push([t,end,q,s/(end-t),o]);t=end-1;}
    if(p.sus){var r=-1;for(t=0;t<=F;t++){var h=t<F&&!cov[t]&&FR[t*88+q]>=p.sus;if(h&&r<0)r=t;else if(!h&&r>=0){if(t-r>=p.minLen*2){var s2=0;for(k=r;k<t;k++)s2+=FR[k*88+q];out.push([r,t,q,s2/(t-r),0]);}r=-1;}}}}
  return out;}
/* clean-up: merge re-triggered fragments, drop octave/12th ghosts of a much stronger lower note, loudness gate relative to the part, polyphony cap */
function clean(ns,c){ns.sort(function(a,b){return a[2]-b[2]||a[0]-b[0];});var m=[];
  ns.forEach(function(n){var l=m[m.length-1];if(l&&l[2]===n[2]&&n[0]-l[1]<=(c.gap||2)&&n[4]<0.7){var L=l[1]-l[0],N=n[1]-n[0];l[3]=(l[3]*L+n[3]*N)/(L+N);l[1]=Math.max(l[1],n[1]);}else m.push(n);});
  var by={};m.forEach(function(n){(by[n[2]]=by[n[2]]||[]).push(n);});
  m=m.filter(function(n){var len=n[1]-n[0];return ![12,19,24].some(function(dq){return (by[n[2]-dq]||[]).some(function(g){return ov(g,n)>=0.5*len&&n[3]<g[3]*(c.ghost||0.62);});});});
  var am=m.map(function(n){return n[3];}).sort(function(a,b){return b-a;}),p90=am.length?am[Math.floor(am.length*0.1)]:0,g=Math.max(c.gate||0,(c.rel||0)*p90);
  m=m.filter(function(n){return n[3]>=g;}).sort(function(a,b){return a[0]-b[0];});
  if(c.cap){var out=[],i=0;while(i<m.length){var j=i;while(j<m.length&&m[j][0]-m[i][0]<=4)j++;out=out.concat(m.slice(i,j).sort(function(a,b){return b[3]-a[3];}).slice(0,c.cap));i=j;}m=out.sort(function(a,b){return a[0]-b[0];});}
  return m;}
/* one voice: Viterbi over (pitch range + silence). hb>0 prefers the top voice, hb<0 the lowest. Same-pitch re-attacks split notes. */
function mono(FR,ON,F,p){var lo=p.lo,K=p.hi-lo+1,S=K+1,bk=new Uint8Array(F*S),pr=new Float32Array(S),cu=new Float32Array(S),em=new Float32Array(S),SW=p.sw||-5,SN=p.sn||-2.5,L=Math.log,t,k;
  for(t=0;t<F;t++){var mx=0,b=t*88,kt=-1;for(k=0;k<K;k++){var v=FR[b+lo+k];if(v>mx)mx=v;em[k]=v>=p.fr?L(v)+p.hb*k/K:-8;}for(k=0;k<K&&p.top;k++){v=FR[b+lo+k];if(v>=0.4&&v>=0.6*mx&&(p.hb<0?kt<0:true)&&!(lo+k>=12&&FR[b+lo+k-12]>v*1.2)&&!(lo+k>=19&&FR[b+lo+k-19]>v*1.2))kt=k;}if(kt>=0)em[kt]+=p.top||0;em[K]=L(Math.max(1e-3,1-mx));
    var b1=-1e9,i1=0;for(k=0;k<K;k++)if(pr[k]>b1){b1=pr[k];i1=k;}
    for(k=0;k<K;k++){var o=ON[b+lo+k],best=pr[k],bi=k,c=pr[K]+SN+3*o;if(c>best){best=c;bi=K;}if(i1!==k){c=b1+SW+4*o;if(c>best){best=c;bi=i1;}}cu[k]=best+em[k];bk[t*S+k]=bi;}
    var bs=pr[K],bsi=K;if(b1+SN>bs){bs=b1+SN;bsi=i1;}cu[K]=bs+em[K];bk[t*S+K]=bsi;
    var sw=pr;pr=cu;cu=sw;var mm=-1e9;for(k=0;k<S;k++)if(pr[k]>mm)mm=pr[k];for(k=0;k<S;k++)pr[k]-=mm;}
  var path=new Int16Array(F),st=K,m2=-1e9;for(k=0;k<S;k++)if(pr[k]>m2){m2=pr[k];st=k;}
  for(t=F-1;t>=0;t--){path[t]=st;st=bk[t*S+st];}
  var out=[],s0=0,cur=K;
  function close(e){if(cur<K&&e-s0>=p.minLen){var s=0,o=0,j;for(j=s0;j<e;j++)s+=FR[j*88+lo+cur];for(j=Math.max(0,s0-2);j<Math.min(F,s0+3);j++)o=Math.max(o,ON[j*88+lo+cur]);out.push([s0,e,lo+cur,s/(e-s0),o]);}}
  for(t=0;t<=F;t++){var sv=t<F?path[t]:-1,re=t<F&&sv===cur&&sv<K&&t-s0>=p.minLen&&peak(ON,F,t,lo+sv,p.on)&&ON[(t-1)*88+lo+sv]<ON[t*88+lo+sv];if(sv!==cur||re){close(t);s0=t;cur=sv;}}
  return clean(out,{gap:3,gate:p.gate||0.2,rel:p.rel||0.3,ghost:0.01});}
/* how many clear voices sound at once (harmonics of a lower note not counted): ~1 for a solo line, more for a band */
function polyN(FR,F){var n=0,fr=0;for(var t=0;t<F;t+=3){var c=0,b=t*88;for(var k=0;k<88;k++){var v=FR[b+k];if(v>=0.5&&!(k>=12&&FR[b+k-12]>=v)&&!(k>=19&&FR[b+k-19]>=v))c++;}if(c){n+=c;fr++;}}return fr?n/fr:0;}
function decode(FR,ON,F,mode,prm){function P(d){for(var k in prm)d[k]=prm[k];return d;}
  function conv(ns){return ns.map(function(n){var t=ft(n[0]);return [Math.round(t*1000)/1000,Math.round((ft(n[1])-t)*1000)/1000,n[2]+21,Math.round(n[3]*1000)/1000];});}
  var pn=polyN(FR,F),band=pn>1.35;self.postMessage({t:'pn',v:pn});
  if(mode==='melody')return conv(mono(FR,ON,F,P({lo:band?31:15,hi:80,hb:0.6,top:band?1.2:0,on:0.5,fr:0.25,minLen:5})));
  if(mode==='bassline')return conv(mono(FR,ON,F,P({lo:4,hi:34,hb:-0.6,top:1,on:0.45,fr:0.25,minLen:6})));
  if(mode==='song'){var lead=mono(FR,ON,F,P({lo:31,hi:75,hb:0.8,top:1.2,on:0.5,fr:0.3,minLen:6})),bass=mono(FR,ON,F,{lo:4,hi:31,hb:-0.8,top:1,on:0.45,fr:0.3,minLen:7}),both=lead.concat(bass);
    var other=clean(polyNotes(FR,ON,F,{lo:19,hi:72,on:0.5,fr:0.3,minLen:7,tol:8,sus:0.7}),{gate:0.15,rel:0.3,cap:4}).filter(function(n){return !both.some(function(m){return (n[2]-m[2])%12===0&&ov(m,n)>0.5*(n[1]-n[0]);});});
    return {lead:conv(lead),other:conv(other),bass:conv(bass)};}
  return conv(clean(polyNotes(FR,ON,F,P({lo:0,hi:87,on:0.5,fr:0.3,minLen:6,tol:8,sus:0.7})),P({gate:0.12,rel:0.2,cap:8})));}
self.onmessage=function(e){var d=e.data,pcm=d.pcm,nW=Math.ceil(pcm.length/HOP)||1,F=nW*KEEP,FR=new Float32Array(F*88),ON=new Float32Array(F*88),t0=Date.now();
  function prog(p){self.postMessage({t:'p',p:Math.min(1,p)});}
  var run;try{run=runOrt(d,pcm,F,FR,ON,prog);}catch(x){run=Promise.reject(x);}
  run.catch(function(err){self.postMessage({t:'be',be:'fallback',m:String(err&&err.message||err)});FR.fill(0);ON.fill(0);return runTf(d,pcm,F,FR,ON,prog);})
  .then(function(){var tm=Date.now();self.postMessage({t:'dec'});var out=decode(FR,ON,F,d.mode,d.prm||{});self.postMessage({t:'done',out:out,ms:[tm-t0,Date.now()-tm]});})
  .catch(function(err){self.postMessage({t:'err',m:String(err&&err.message||err)});});};
}
var TRXW='('+trxWorker.toString()+')();';

var trxWk=null,trxDm=null;
/* ---------- progress dialog ---------- */
function trxOv(show,title){var o=$('#trxOv');if(!o){o=document.createElement('div');o.id='trxOv';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Writing sheet music');
  o.innerHTML='<div class="trx-p"><b id="trxOvT">Writing the notes</b><span id="trxOvN"></span><div id="trxOvSec" hidden></div><div id="trxOvRun"><div class="trx-bar"><i id="trxOvB"></i></div><div class="row"><span id="trxOvS" class="mu">Reading the file…</span><span id="trxOvPc" class="mu"></span></div></div><button class="btn" id="trxOvC">Cancel</button></div>';document.body.appendChild(o);
  $('#trxOvC').addEventListener('click',trxCancel);}
  o.hidden=!show;if(title)$('#trxOvN').textContent=title;if(show){$('#trxOvSec').hidden=true;$('#trxOvRun').hidden=false;$('#trxOvT').textContent=TRX.mode==='stems'?'Splitting and writing the song':'Writing the notes';}}
function trxStep(t,f){$('#trxOvS').textContent=t;if(f!=null){$('#trxOvB').style.width=Math.round(f*100)+'%';$('#trxOvPc').textContent=Math.round(f*100)+'%';}}
function trxCancel(){if(trxWk){if(trxWk._rej)trxWk._rej(new Error('cancel'));trxWk.terminate();trxWk=null;}if(trxDm&&TRX.busy){if(trxDm._rej)trxDm._rej(new Error('cancel'));trxDm.terminate();trxDm=null;}TRX.cancel=true;TRX.busy=false;trxOv(false);if(TRX.prevSrc){try{TRX.prevSrc.stop();}catch(e){}}toast('Stopped.',1000);}
function trxPaint(){return new Promise(function(r){requestAnimationFrame(function(){setTimeout(r,40);});});}
function trxRes(buf,sr,ch){var len=Math.ceil(buf.duration*sr),oc=new OfflineAudioContext(ch,len,sr),s=oc.createBufferSource();s.buffer=buf;s.connect(oc.destination);s.start();return oc.startRendering();}
function trxFail(m){trxOv(false);TRX.busy=false;toast(m,4000);}
function trxMsg(e){var m=(e&&e.message)||'';if(m==='cancel')return;trxFail(m==='long'?'That recording is longer than 7 minutes. Trim it and try again.':m==='none'?'No clear notes were found. A solo instrument or voice works best.':m==='mem'?'This phone ran out of memory. Choose a shorter section and try again.':/download|manifest|Failed to fetch|NetworkError/i.test(m)?'The stem splitter could not be downloaded. Check the connection and try again; the parts that already arrived are kept.':m.indexOf('worker')===0||m.indexOf('model')===0||m.indexOf('demucs')===0?'The analysis stopped ('+m.replace(/^\w+: /,'')+'). Try a shorter section.':'This file could not be read. Try an MP3 or WAV.');}
/* ---------- note detection (Basic Pitch) ---------- */
function trxBP(buf,mode,f0,f1,label,opt){return trxRes(buf,22050,1).then(function(r22){return trxBase().then(function(base){return new Promise(function(res,rej){
  if(TRX.cancel){rej(new Error('cancel'));return;}
  var url=URL.createObjectURL(new Blob([TRXW],{type:'text/javascript'})),wk;try{wk=trxWk=new Worker(url);}catch(e){rej(new Error('worker'));return;}var t0=performance.now();wk._rej=rej;
  function end(){try{wk.terminate();}catch(x){}if(trxWk===wk)trxWk=null;URL.revokeObjectURL(url);}
  wk.onmessage=function(e){var d=e.data;if(d.t==='p'){var f=f0+(f1-f0)*0.97*d.p,el=(performance.now()-t0)/1000;trxStep(label+(d.p>0.05&&d.p<1?' · about '+trxDur(el/d.p*(1-d.p))+' left':''),f);}
    else if(d.t==='be'){TRX.be=d.be;}else if(d.t==='pn'){TRX.pn=d.v;}else if(d.t==='dec')trxStep('Writing the notes down…',f0+(f1-f0)*0.985);
    else if(d.t==='done'){TRX.ms=d.ms;end();res(d.out);}else if(d.t==='err'){end();rej(new Error('model: '+d.m));}};
  wk.onerror=function(e){end();rej(new Error('worker: '+(e.message||'error')));};var pcm=r22.getChannelData(0).slice();
  wk.postMessage({ort:base+'vendor/ort/',lib:base+'vendor/basic-pitch/basicpitch.js',model:base+'vendor/basic-pitch/model.json',pcm:pcm,mode:mode,prm:opt&&opt.prm},[pcm.buffer]);});});});}
function trxEv(ns){return ns.filter(function(e){return e[3]>0.05&&e[2]>=21&&e[2]<=108;}).map(function(e){return {t:e[0],d:e[1],m:e[2],a:e[3]};}).sort(function(a,b){return a.t-b.t;});}
/* ---------- drums: onsets split into kick, snare and hi-hat by where their energy sits ---------- */
function trxDrums(x,sr){var hop=Math.round(sr/100),n=Math.floor(x.length/hop),E=[new Float32Array(n),new Float32Array(n),new Float32Array(n)];
  function a1(f){return 1-Math.exp(-2*Math.PI*f/sr);}var aL=a1(120),aM1=a1(180),aM2=a1(3000),aH=a1(7000),lp=0,lp2=0,m1=0,m2=0,hp=0,sm=[0,0,0];
  for(var i=0;i<n;i++){var e=[0,0,0];for(var j=i*hop,k=j+hop;j<k;j++){var v=x[j];lp+=aL*(v-lp);lp2+=aL*(lp-lp2);m1+=aM1*(v-m1);m2+=aM2*(v-m2);hp+=aH*(v-hp);var mid=m2-m1,hi=v-hp;e[0]+=lp2*lp2;e[1]+=mid*mid;e[2]+=hi*hi;}
    for(var b=0;b<3;b++){sm[b]=sm[b]*0.4+e[b]*0.6;E[b][i]=sm[b];}}
  var PAD=[0,1,4],GAP=[8,8,6],ons=[[],[],[]];
  for(b=0;b<3;b++){var L=new Float32Array(n),F=new Float32Array(n),mx=1e-12;for(i=0;i<n;i++){L[i]=Math.log(1e-10+E[b][i]);mx=Math.max(mx,E[b][i]);}
    for(i=1;i<n;i++)F[i]=Math.max(0,L[i]-Math.max(L[i-1],L[Math.max(0,i-2)],L[Math.max(0,i-3)]));var last=-99;
    for(i=1;i<n-1;i++){if(F[i]<0.9||F[i]<F[i+1]||i-last<GAP[b])continue;var peak=0;for(k=i;k<Math.min(n,i+4);k++)peak=Math.max(peak,E[b][k]);if(peak<mx*0.03)continue;
      var lo=Math.max(0,i-50),hi2=Math.min(n,i+50),loc=0;for(k=lo;k<hi2;k++)loc=Math.max(loc,E[b][k]);if(peak<loc*0.08)continue;last=i;ons[b].push({i:i,a:Math.min(1,Math.sqrt(peak/mx))});}}
  var MX=[0,1,2].map(function(b){var m=1e-12;for(var q=0;q<n;q++)m=Math.max(m,E[b][q]);return m;});
  function pk(b,i){var p=0;for(var q=i;q<Math.min(n,i+4);q++)p=Math.max(p,E[b][q]);return Math.sqrt(p/MX[b]);}
  var all=[];[0,1,2].forEach(function(b){ons[b].forEach(function(o){all.push({i:o.i,b:b});});});all.sort(function(p,q){return p.i-q.i;});
  var cl=[];all.forEach(function(o){var c=cl[cl.length-1];if(c&&o.i-c.i<=3){c.bs[o.b]=1;}else{var bs=[0,0,0];bs[o.b]=1;cl.push({i:o.i,bs:bs});}});
  var out=[];cl.forEach(function(c){var p0=pk(0,c.i),p1=pk(1,c.i),p2=pk(2,c.i),t=c.i*hop/sr,kick=c.bs[0]&&p0>=0.3&&p0>=p1*0.8,snare=c.bs[1]&&p1>=0.3&&(p0<0.45||p1>p0*1.25);
    if(kick)out.push({t:t,pad:0,a:p0});if(snare)out.push({t:t,pad:1,a:p1});if(c.bs[2]&&!snare&&p2>=0.2)out.push({t:t,pad:4,a:p2});});
  return out.sort(function(p,q){return p.t-q.t;});}
/* ---------- the stem splitter (Spleeter 4-stems by Deezer, MIT; vendor/stems/, about 79 MB, fetched once) ---------- */
var STEMS_MB=79,STEMS_PARTS=8,STEMS_CACHE='ecou-stems-v2';
function stemsCached(){if(typeof caches==='undefined')return Promise.resolve(false);return caches.open(STEMS_CACHE).then(function(c){return c.keys();}).then(function(k){return k.length>=STEMS_PARTS;}).catch(function(){return false;});}
/* size warning before the first download (the overlay is already open) */
function stemsAsk(){return stemsCached().then(function(ok){if(ok||TRX.stAgreed)return;return new Promise(function(res,rej){var box=$('#trxOvSec'),title=$('#trxOvT').textContent;$('#trxOvRun').hidden=true;box.hidden=false;$('#trxOvT').textContent='Download the stem splitter?';
  box.innerHTML='<p class="note" style="margin:0">Splitting needs a one-time download of about '+STEMS_MB+' MB (Spleeter by Deezer, MIT licence). It stays on this phone and works offline afterwards. On mobile data it counts against your plan. If the download stops, it carries on where it left off next time.</p><div class="btns"><button class="btn" id="stAskNo">Not now</button><button class="btn primary" id="stAskGo">Download '+STEMS_MB+' MB</button></div>';
  $('#stAskNo').addEventListener('click',function(){box.hidden=true;rej(new Error('cancel'));trxCancel();});
  $('#stAskGo').addEventListener('click',function(){box.hidden=true;TRX.stAgreed=true;$('#trxOvT').textContent=title;$('#trxOvRun').hidden=false;res();});});});}
function trxDemucs(){if(trxDm&&trxDm._ready)return Promise.resolve(trxDm);var root=new URL('./',document.baseURI).href,base=root+'vendor/stems/';
  return fetch(base+'manifest.json').then(function(r){if(!r.ok)throw new Error('demucs: the stem splitter is only available on the published app');}).then(stemsAsk).then(function(){return new Promise(function(res,rej){
    try{trxDm=new Worker(base+'worker.js');}catch(e){rej(new Error('worker'));return;}trxDm._rej=rej;
    trxDm.onmessage=function(e){var d=e.data;if(d.t==='dl')trxStep(d.f<1?'Downloading the stem splitter (once) · '+Math.round(d.got/1e6)+' of '+Math.round(d.total/1e6)+' MB'+(d.resumed?' (resumed)':'')+'…':'Starting the stem splitter…',0.02+d.f*0.13);else if(d.t==='stage')trxStep('Starting the stem splitter…',0.15);
      else if(d.t==='ready'){trxDm._ready=true;trxDm._ep=d.ep;res(trxDm);}else if(d.t==='err')rej(new Error('demucs: '+d.m));};
    trxDm.onerror=function(e){rej(new Error('demucs: '+(e.message||'could not start')));};
    trxDm.postMessage({t:'init',base:base,ort:root+'vendor/ort/'});});});}
/* returns {vocals, drums, bass, other} as stereo 44.1 kHz AudioBuffers of the same length (aligned) */
function trxSplit(buf){return trxRes(buf,44100,2).then(function(b){return trxDemucs().then(function(w){return new Promise(function(res,rej){var t0=performance.now();w._rej=rej;
  trxStep(w._ep==='webgpu'?'Splitting into vocals, drums, bass and other…':'Splitting into vocals, drums, bass and other (no GPU here, so this takes a while)…',0.16);
  w.onmessage=function(e){var d=e.data;if(d.t==='p'){var el=(performance.now()-t0)/1000;trxStep('Splitting the stems'+(d.f>0.04?' · about '+trxDur(el/d.f*(1-d.f))+' left':'…'),0.16+d.f*0.49);}
    else if(d.t==='done'){var st={};d.names.forEach(function(nm,i){var s=d.stems[i],ab=ctx.createBuffer(2,s[0].length,44100);ab.getChannelData(0).set(s[0]);ab.getChannelData(1).set(s[1]);st[nm]=ab;});try{w.terminate();}catch(x){}trxDm=null;res(st);}else if(d.t==='err')rej(new Error(/memory|alloc|Out of/i.test(d.m)?'mem':'demucs: '+d.m));};
  var L=b.getChannelData(0).slice(),R=b.getChannelData(1).slice();w.postMessage({t:'run',L:L,R:R,overlap:1},[L.buffer,R.buffer]);});});});}
/* trxSplit, with a Retry box (overlay stays open) when the model download fails */
function stemsSplit(part){return trxSplit(part).catch(function(e){var m=(e&&e.message)||'';if(!/download|manifest|Failed to fetch|NetworkError/i.test(m))throw e;
  if(trxDm){try{trxDm.terminate();}catch(x){}trxDm=null;}if(TRX.cancel)throw new Error('cancel');
  return new Promise(function(res,rej){var box=$('#trxOvSec'),title=$('#trxOvT').textContent;$('#trxOvRun').hidden=true;box.hidden=false;$('#trxOvT').textContent='Download stopped';
    box.innerHTML='<p class="note" style="margin:0">The stem splitter could not be downloaded ('+m.replace(/^demucs: /,'').replace(/[<>&"]/g,'')+'). Check the connection and try again. The parts that already arrived are kept, so it carries on from there.</p><div class="btns"><button class="btn" id="stRetNo">Cancel</button><button class="btn primary" id="stRet">Retry</button></div>';
    $('#stRetNo').addEventListener('click',function(){box.hidden=true;rej(new Error('cancel'));trxCancel();});
    $('#stRet').addEventListener('click',function(){box.hidden=true;$('#trxOvT').textContent=title;$('#trxOvRun').hidden=false;res(stemsSplit(part));});});});}
var STEM_ORDER=[['vocals','Vocals'],['drums','Drums'],['bass','Bass'],['other','Other']];
/* keeps the current project (saved, listed in Open…) and starts an empty one */
function stemsNewProject(){return Promise.resolve(saveProject(true)).catch(function(){}).then(function(){resetProject();clearPatternsAll();setTimeout(histReset,0);});}
/* stems -> new audio tracks, all at the same step so they stay aligned; one track per frame so the page stays responsive.
   Never throws the result away: without enough free tracks they go into a new project. */
function stemsToTracks(st,name){var order=STEM_ORDER.filter(function(o){return st[o[0]];});
  var pre=MAXAUD-audioCount()<order.length?stemsNewProject().then(function(){TRX.stNewDone=true;}):Promise.resolve();
  return pre.then(function(){var s=dawSnap(daw.play),made=0;
    return order.reduce(function(p,o){return p.then(function(){return new Promise(function(r){setTimeout(function(){var b=st[o[0]],ti=addAudioTrack(o[1],true);if(ti>=0){newClip({type:'aud',ti:ti,s:s,off:0,dur:b.duration,buf:abufAdd(b),name:(name||'Song').slice(0,28)+' · '+o[1]});made++;}r();},0);});});},Promise.resolve())
    .then(function(){seq.src='arrange';updTransportUI();renderMixer();renderSpUI();renderDawHeads();renderInsp();dawNeed=true;markDirty();return made;});});}
/* after placing: open Song › Studio on the new stem tracks with the first stem clip selected */
function stemsShow(nm){var cs=daw.clips.filter(function(c){return c.type==='aud'&&c.name&&c.name.indexOf((nm||'Song').slice(0,28)+' · ')===0;});if(!cs.length)return;var c=cs[cs.length-STEM_ORDER.length]||cs[0];
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}window.scrollTo(0,0);
  showTab('t-daw');daw.sel=c.id;daw.lane=c.ti;daw.sx=Math.max(0,c.s-4);renderDawHeads();renderInsp();dawNeed=true;
  setTimeout(function(){var cv=$('#dawCv');if(cv&&cv.scrollIntoView)cv.scrollIntoView({block:'start'});window.scrollTo(0,0);},80);}
/* before a split: room for 4 tracks? if not, the user chooses a new project up front (or cancels) */
function stemsRoom(){var need=STEM_ORDER.length,free=MAXAUD-audioCount();TRX.stNewDone=false;if(free>=need)return Promise.resolve();
  return new Promise(function(res,rej){var box=$('#trxOvSec');$('#trxOvRun').hidden=true;box.hidden=false;$('#trxOvT').textContent='No room for 4 stems here';
    box.innerHTML='<p class="note" style="margin:0">This project uses '+audioCount()+' of '+MAXAUD+' audio tracks and the stems need '+need+'. Ecou can put them in a new project; this one is saved and stays in Open….</p><div class="btns"><button class="btn" id="stRmNo">Cancel</button><button class="btn primary" id="stRmNew">Put stems in a new project</button></div>';
    $('#stRmNo').addEventListener('click',function(){box.hidden=true;rej(new Error('cancel'));trxCancel();});
    $('#stRmNew').addEventListener('click',function(){box.hidden=true;$('#trxOvRun').hidden=false;res();});});}
function stemsFile(file){if(TRX.busy||!file)return;if(!ensureAudio())return;TRX.busy=true;TRX.cancel=false;var nm=(file.name||'Song').replace(/\.[^.]+$/,'');
  trxOv(true,nm);trxStep('Reading the file…',0.02);
  stemsRoom().then(function(){return file.arrayBuffer();}).then(function(ab){trxStep('Decoding the audio…',0.04);return smpDecode(ab);}).then(function(b){if(TRX.cancel)throw new Error('cancel');if(b.duration>420)throw new Error('long');
    return trxPickSection(b).then(function(sec){$('#trxOvT').textContent='Splitting into stems';return stemsSplit(trxCut(b,sec.start,sec.len));});})
  .then(function(st){if(TRX.cancel)throw new Error('cancel');trxStep('Placing the stems…',0.99);return stemsToTracks(st,nm);}).then(function(n){TRX.busy=false;trxOv(false);
    if(n)stemsShow(nm);
    if(n)toast('Vocals, drums, bass and other are on '+n+' aligned audio tracks'+(TRX.stNewDone?' in a new project (the previous one is in Open…)':'')+'. Tap a clip, then Send to… to make an instrument, transcribe it, open it in Vocal Studio or slice it.',6000);})
  .catch(function(e){TRX.busy=false;trxMsg(e);});}
/* ---------- any sound travels: a Studio clip -> instrument, sheet music, Vocal Studio, slicer ---------- */
function clipRegion(c,maxS,mono){var b=abuf[c.buf];if(!b)return null;var sr=b.sampleRate,a=Math.min(b.length-1,Math.max(0,Math.floor((c.off||0)*sr))),n=Math.max(1,Math.min(b.length-a,Math.floor(Math.min(c.dur,maxS||1e9)*sr)));
  var nc=mono?1:b.numberOfChannels,o=ctx.createBuffer(nc,n,sr);
  if(mono){var d=o.getChannelData(0);for(var ch=0;ch<b.numberOfChannels;ch++){var s=b.getChannelData(ch);for(var i=0;i<n;i++)d[i]+=s[a+i]/b.numberOfChannels;}}
  else for(var k=0;k<nc;k++)o.getChannelData(k).set(b.getChannelData(k).subarray(a,a+n));return o;}
function clipSend(c,to){if(!ensureAudio()||!c||c.type!=='aud')return;var nm=(c.name||'Clip').slice(0,40);
  if(to==='vs'){vtOpenClip(c);return;}
  if(to==='inst'){var r=clipRegion(c,6,true);if(!r)return;showTab('t-cap');handleAudio(r.getChannelData(0),r.sampleRate,'A',nm.slice(0,24));return;}
  if(to==='sl'){var q=clipRegion(c,30,true);if(!q)return;setSlot('B',q,nm.slice(0,24),261.63,false);showTab('t-cap');slOpen('B');return;}
  if(to==='trx'){var t=clipRegion(c,420,false);if(!t)return;var chs=[];for(var k=0;k<t.numberOfChannels;k++)chs.push(t.getChannelData(k));
    /* queued, not started: the Sheet music card opens with the clip loaded, the mode set, and one tap to start */
    var md=/drum/i.test(nm)?'song':/bass|vocal|voice|lead/i.test(nm)?'melody':'poly',bt=$('#trxMode [data-tm="'+md+'"]');if(bt&&!TRX.busy)bt.click();
    TRX.clipFile=new File([encodeWav(chs,t.sampleRate)],nm.replace(/[^\w\- ]+/g,' ').trim()+'.wav',{type:'audio/wav'});
    $('#trxClipN').textContent='Ready: “'+nm+'” ('+dec(t.duration,1)+' s from the Studio). Pick what to write above, then start.';$('#trxClipQ').hidden=false;
    showTab('t-song');setTimeout(function(){var q=$('#trxClipQ');if(q&&q.scrollIntoView)q.scrollIntoView({block:'center'});},60);}}
function clipSendRow(c){return '<div class="row"><span class="mu">Send to…</span></div><div class="btn3" style="grid-template-columns:repeat(2,1fr)"><button class="btn" id="ciToInst">Make instrument</button><button class="btn" id="ciToTrx">Transcribe</button><button class="btn" id="ciToVs">Vocal Studio</button><button class="btn" id="ciToSl">Slicer</button></div>';}
function clipSendBind(c){[['ciToInst','inst'],['ciToTrx','trx'],['ciToVs','vs'],['ciToSl','sl']].forEach(function(x){var e=$('#'+x[0]);if(e)e.addEventListener('click',function(){clipSend(c,x[1]);});});}
function trxDur(s){s=Math.round(s);return s<90?s+' s':Math.round(s/60)+' min';}
function trxRms(b){var d=b.getChannelData(0),s=0;for(var i=0;i<d.length;i+=4)s+=d[i]*d[i];return Math.sqrt(s/(d.length/4));}
function trxCut(b,start,len){var sr=b.sampleRate,a=Math.floor(start*sr),n=Math.min(b.length-a,Math.floor(len*sr)),o=ctx.createBuffer(b.numberOfChannels,Math.max(1,n),sr);for(var c=0;c<b.numberOfChannels;c++)o.getChannelData(c).set(b.getChannelData(c).subarray(a,a+n));return o;}
/* section picker shown before splitting a whole song */
function trxPickSection(b){return new Promise(function(res,rej){var box=$('#trxOvSec'),d=b.duration;$('#trxOvRun').hidden=true;box.hidden=false;$('#trxOvT').textContent='Choose a section';
  var L=Math.min(d,TRX.sec.len||60),S=0;box.innerHTML='<p class="note" style="margin:0">Splitting a song takes time on a phone, so start with a part of it. You can always run another part later.</p><div class="row"><span class="mu">Length</span><div class="seg" id="trxSL"><button data-sl="30">30 s</button><button data-sl="60">1 min</button><button data-sl="120">2 min</button><button data-sl="0">Whole</button></div></div><label class="ctl"><span class="row"><span>Start at</span><output id="trxSSo">0:00</output></span><input type="range" id="trxSS" min="0" max="'+Math.max(0,Math.floor(d-5))+'" step="1" value="0"></label><div class="btns"><button class="btn" id="trxSP">▶ Preview</button><button class="btn primary" id="trxSGo">Split and write</button></div>';
  function fmt(x){var m=Math.floor(x/60),s=Math.floor(x%60);return m+':'+(s<10?'0':'')+s;}
  function upd(){$$('#trxSL [data-sl]').forEach(function(x){var v=+x.getAttribute('data-sl');x.setAttribute('aria-pressed',(v||d)===L||(v===0&&L>=d));});$('#trxSSo').textContent=fmt(S)+' – '+fmt(Math.min(d,S+L));}
  $$('#trxSL [data-sl]').forEach(function(x){x.addEventListener('click',function(){var v=+x.getAttribute('data-sl');L=v?Math.min(v,d):d;if(!v)S=0;$('#trxSS').value=S;upd();});});
  $('#trxSS').addEventListener('input',function(){S=+this.value;if(S+L>d)L=Math.max(5,d-S);upd();});
  $('#trxSP').addEventListener('click',function(){if(TRX.prevSrc){try{TRX.prevSrc.stop();}catch(e){}TRX.prevSrc=null;this.textContent='▶ Preview';return;}var s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0,S,Math.min(L,12));TRX.prevSrc=s;var bt=this;bt.textContent='■ Stop';s.onended=function(){bt.textContent='▶ Preview';TRX.prevSrc=null;};});
  $('#trxSGo').addEventListener('click',function(){if(TRX.prevSrc){try{TRX.prevSrc.stop();}catch(e){}}TRX.sec={start:S,len:L};box.hidden=true;$('#trxOvRun').hidden=false;$('#trxOvT').textContent='Splitting and writing the song';res({start:S,len:L});});
  upd();});}
/* ---------- main flow ---------- */
function trxFile(file){
  if(TRX.busy||!file)return;if(!ensureAudio())return;TRX.busy=true;TRX.cancel=false;TRX.name=(file.name||'Recording').replace(/\.[^.]+$/,'');$('#trxRes').hidden=true;
  trxOv(true,TRX.name);trxStep('Reading the file…',0.02);var stems=TRX.mode==='stems';
  trxPaint().then(function(){return file.arrayBuffer();}).then(function(ab){trxStep('Decoding the audio…',0.04);return trxPaint().then(function(){return smpDecode(ab);});})
  .then(function(b){if(TRX.cancel)throw new Error('cancel');if(b.duration>420)throw new Error('long');
    if(!stems){TRX.orig=b;TRX.dur=b.duration;TRX.bpm=Math.round(detectBpm(b)||120);
      var md=TRX.mode;return trxBP(b,md,0.06,0.98,md==='song'?'Listening to the song…':'Listening for notes…').then(function(o){if(TRX.cancel)throw new Error('cancel');
        if(md==='song'){var parts=[];[['lead','Lead melody','mel','treble',o.lead],['other','Chords & other','poly',null,o.other],['bass','Bass','mel','bass',o.bass]].forEach(function(x){var ev=trxEv(x[4]);if(ev.length>2)parts.push({id:x[0],name:x[1],k:x[2],clef:x[3],ev:ev,buf:b,show:true,aud:true});});if(!parts.length)throw new Error('none');TRX.parts=parts;return;}
        var ev=trxEv(o);if(!ev.length)throw new Error('none');TRX.parts=[{id:'main',name:md==='poly'?'Piano':'Melody',k:md==='poly'?'poly':'mel',ev:ev,buf:b,show:true,aud:true}];});}
    return trxPickSection(b).then(function(sec){if(TRX.cancel)throw new Error('cancel');var part=trxCut(b,sec.start,sec.len);TRX.orig=part;TRX.dur=part.duration;TRX.bpm=Math.round(detectBpm(part)||detectBpm(b)||120);
      return stemsSplit(part).then(function(st){if(TRX.cancel)throw new Error('cancel');var parts=[],ref=trxRms(part)||1;
        var jobs=[['vocals',0.65,0.76,{}],['bass',0.76,0.84,{maxF:500}],['other',0.84,0.96,{}]].reduce(function(p,j){return p.then(function(){var S=TRXSTEM[j[0]],buf=st[j[0]];if(!buf||trxRms(buf)<ref*0.04)return;
          return trxBP(buf,S.k==='poly'?'poly':j[0]==='bass'?'bassline':'melody',j[1],j[2],'Writing '+S.n.toLowerCase()+'…',j[3]).then(function(ns){var ev=trxEv(ns);if(ev.length>2)parts.push({id:j[0],name:S.n,k:S.k,clef:S.clef,ev:ev,buf:buf,show:true,aud:true});});});},Promise.resolve());
        return jobs.then(function(){var db=st.drums;if(db&&trxRms(db)>ref*0.04){trxStep('Writing drums…',0.97);var ev=trxDrums(db.getChannelData(0),db.sampleRate);if(ev.length>3)parts.push({id:'drums',name:'Drums',k:'drum',clef:'perc',ev:ev,buf:db,show:true,aud:true});}
          if(!parts.length)throw new Error('none');var order=['vocals','other','bass','drums'];parts.sort(function(a,b){return order.indexOf(a.id)-order.indexOf(b.id);});TRX.parts=parts;});});});})
  .then(function(){trxGrid();trxStep('Done',1);TRX.busy=false;setTimeout(function(){trxOv(false);},500);trxShowRes();var c=$('#trxCard');if(c)c.scrollIntoView({block:'start'});})
  .catch(trxMsg).then(function(){var fi=$('#f-TRX');if(fi)fi.value='';});
}
/* ---------- quantize ---------- */
function trxMelody(ev){var out=[];ev.forEach(function(e){var last=out[out.length-1];if(last&&e.t<last.t+last.d-0.03){if(e.a>last.a*1.15&&Math.abs(e.t-last.t)<0.08)out[out.length-1]=e;else if(e.a>last.a*1.15){last.d=Math.max(0.05,e.t-last.t);out.push(e);}return;}out.push(e);});
  for(var i=0;i<out.length-1;i++)if(out[i].t+out[i].d>out[i+1].t)out[i].d=Math.max(0.05,out[i+1].t-out[i].t);return out;}
/* beat grid: tempo refined by phase coherence of all onsets (bass and kick weigh more), the bar line put where the strongest beats fall */
function trxOns(){var o=[];(TRX.parts||[]).forEach(function(p){if(!p.show)return;p.ev.forEach(function(e){var dr=p.k==='drum',w=(e.a||0.5)*(dr?(e.pad===0?2:1):Math.min(1.5,0.4+(e.d||0.2)));o.push([e.t,w,p.id==='bass'||(dr&&e.pad===0)?1:0]);});});return o;}
function trxCoh(o,bpm){var P=60/bpm,re=0,im=0;o.forEach(function(x){var a=2*Math.PI*x[0]/P;re+=x[1]*Math.cos(a);im+=x[1]*Math.sin(a);});return [Math.sqrt(re*re+im*im),Math.atan2(im,re)];}
function trxGrid(){var o=trxOns();if(o.length<8)return;var B=TRX.bpm||120,best=B,b0=trxCoh(o,B)[0],bv=b0;for(var b=B*0.99;b<=B*1.01;b+=0.05){var c=trxCoh(o,b)[0];if(c>bv){bv=c;best=b;}}if(bv>b0*1.08&&(TRX.dur||0)>=40)TRX.bpm=Math.round(best*10)/10;}  /* short clips: the coherence peak is too broad to trust */
function trxT0(){var o=trxOns(),tf=1e9;o.forEach(function(x){if(x[0]<tf)tf=x[0];});if(tf>1e8){TRX.t0=0;return 0;}
  var P=60/TRX.bpm,sd=P/4,bar=4*P,ph=trxCoh(o,TRX.bpm)[1]/(2*Math.PI)*P,sc=[0,0,0,0],r=0,i;ph=((ph%P)+P)%P;
  o.forEach(function(x){var k=Math.round((x[0]-ph)/P);if(Math.abs(x[0]-ph-k*P)<0.06)sc[((k%4)+4)%4]+=x[1]*(1+2*x[2]);});
  var low=0,all=0;o.forEach(function(x){all+=x[1];low+=x[1]*x[2];});if(low<=all*0.15){TRX.t0=tf;return tf;}  /* one melodic line, no bass/kick to find the bar: start the bar on the first note */
  var k1=Math.round((tf-ph)/P);r=((k1%4)+4)%4;
  if(low>all*0.15){var c1=sc[r];for(i=0;i<4;i++)if(sc[i]>sc[r]&&sc[i]>c1*1.3)r=i;}var t0=ph+r*P;t0-=bar*Math.ceil((t0-tf-sd*0.5)/bar);TRX.t0=t0;return t0;}
function trxQP(p){var sd=60/TRX.bpm/4,t0=TRX.t0,seen={},q=[];
  if(p.k==='drum'){p.ev.forEach(function(e){var s=Math.max(0,Math.round((e.t-t0)/sd)),k=s+':'+e.pad;if(seen[k])return;seen[k]=1;q.push({s:s,l:1,pad:e.pad,v:e.a});});return q;}
  var ev=p.k==='poly'?p.ev:trxMelody(p.ev);ev.forEach(function(e){var s=Math.max(0,Math.round((e.t-t0)/sd)),l=Math.max(1,Math.round(e.d/sd)),k=p.k==='poly'?s+':'+e.m:s;if(seen[k])return;seen[k]=1;q.push({s:s,l:Math.min(l,64),m:Math.round(e.m),v:clamp(0.4+e.a*0.6,0.3,1)});});
  if(p.k!=='poly'){for(var i=0;i<q.length-1;i++)if(q[i].s+q[i].l>q[i+1].s)q[i].l=Math.max(1,q[i+1].s-q[i].s);}return q.filter(function(n){return n.s<256*16;});}
/* notes of every shown pitched part (used by playback and the keyboard) */
function trxQuant(){trxT0();var all=[];(TRX.parts||[]).forEach(function(p){if(p.show&&p.k!=='drum')all=all.concat(trxQP(p));});return all.sort(function(a,b){return a.s-b.s;});}
function trxKey(list){var h=new Array(12).fill(0);list.forEach(function(x){h[x.m%12]+=x.l;});
  function corr(p,r){var mh=0,mp=0,i;for(i=0;i<12;i++){mh+=h[(i+r)%12];mp+=p[i];}mh/=12;mp/=12;var num=0,dh=0,dp=0;for(i=0;i<12;i++){var x=h[(i+r)%12]-mh,y=p[i]-mp;num+=x*y;dh+=x*x;dp+=y*y;}return num/Math.sqrt(dh*dp+1e-12);}
  var best=SKEYS[0],bv=-2;SKEYS.forEach(function(k){var nm=k[0].replace('m',''),r=TONIC[k[2]==='minor'?nm:k[0]],v=corr(k[2]==='minor'?KMIN:KMAJ,r);if(v>bv){bv=v;best=k;}});return best;}
function trxSd(){trxT0();var parts=[],keys={},names={},prog={},tis=[],drums=[],end=0,Q={};
  (TRX.parts||[]).forEach(function(p){if(!p.show)return;var q=trxQP(p);Q[p.id]=q;q.forEach(function(n){end=Math.max(end,n.s+n.l);});});
  var total=Math.max(16,Math.ceil(end/16)*16),pitched=[];
  function part(id,name,list,clef,pg){if(!list.length)return;keys[id]=list;names[id]=name;prog[id]=pg||0;tis.push(id);parts.push({ti:id,name:name,clef:clef,seg:segments(list,total,false)});}
  (TRX.parts||[]).forEach(function(p){if(!p.show)return;var q=Q[p.id];
    if(p.k==='drum'){drums=q.map(function(x){return {s:x.s,pad:x.pad};});parts.push({ti:0,name:'Drums',clef:'perc',drum:true,seg:segments(q.map(function(x){return {s:x.s,l:1,pad:x.pad};}),total,true)});return;}
    pitched=pitched.concat(q);var pg=p.id==='bass'?33:p.id==='vocals'?52:0;
    if(p.k==='poly'){part(p.id+'_h',p.id==='main'?'Right hand':p.name,q.filter(function(n){return n.m>=60;}),'treble',pg);part(p.id+'_l',p.id==='main'?'Left hand':p.name+' (low)',q.filter(function(n){return n.m<60;}),'bass',pg);}
    else{var avg=q.reduce(function(a,x){return a+x.m;},0)/Math.max(1,q.length);part(p.id,p.name,q,p.clef||(avg<55?'bass':'treble'),pg);}});
  var kv=$('#scoreKey').value,key=kv==='auto'?trxKey(pitched.length?pitched:[{m:60,l:1}]):SKEYS[+kv];
  return {S:{total:total,keys:keys,drums:drums},key:key,parts:parts,bars:total/16,tis:tis,names:names,prog:prog,bpm:TRX.bpm,title:TRX.name};}
function trxShowRes(){var all=trxQuant(),k=trxKey(all.length?all:[{m:60,l:1}]),n=0;(TRX.parts||[]).forEach(function(p){n+=p.ev.length;});$('#trxRes').hidden=false;$('#trxBpm').textContent=TRX.bpm;
  $('#trxInfo').textContent=n+' notes · '+k[0]+(k[2]==='minor'?'':' major');$('#trxName').textContent=TRX.name;
  var ap=$('#trxApprox'),mx=TRX.mode==='song'||TRX.mode==='stems',dens=0;if(!mx&&TRX.parts[0]){TRX.parts[0].ev.forEach(function(e){dens+=e.d;});dens/=Math.max(1,TRX.dur);}
  if(ap){var band=TRX.pn>1.35;ap.hidden=!(mx||band||dens>1.6||(TRX.parts[0]&&TRX.parts[0].ev.length>TRX.dur*5));ap.textContent=mx?'An approximation: a full song mixes many instruments, so some notes will be missing or wrong. The lead melody and the bass are usually the most reliable; tap a part above to show only that staff.':TRX.mode==='melody'?'Several instruments play here, so Ecou followed the top voice (usually the singer). Expect some wrong or missing notes. “Full song” writes lead, chords and bass separately.':'This sounds like several instruments at once, so the score is an approximation. For a produced song, try “Lead melody” or “Full song”.';}
  var w=$('#trxParts');w.hidden=TRX.parts.length<2;w.innerHTML='<span class="mu" style="font-size:12px;width:100%">On the score</span>'+TRX.parts.map(function(p,i){return '<button data-tp2="'+i+'" aria-pressed="'+!!p.show+'">'+p.name+' <small style="opacity:.7">'+p.ev.length+'</small></button>';}).join('');
  $$('#trxParts [data-tp2]').forEach(function(b){b.addEventListener('click',function(){var p=TRX.parts[+b.getAttribute('data-tp2')];if(p.show&&TRX.parts.filter(function(x){return x.show;}).length<2){toast('Keep at least one part on the score.',1400);return;}p.show=!p.show;b.setAttribute('aria-pressed',p.show);});});}
function trxProjUI(){var b=$('#trxProj');if(!b)return;var n=0;try{var S=collectSong();n=S.drums.length;Object.keys(S.keys).forEach(function(k){n+=S.keys[k].length;});}catch(e){}b.hidden=!n;}
function trxUse(fn){if(!TRX.parts){toast('Choose a recording first.');return;}SCOREX=trxSd;fn();}
var trxSrcs=[];
function trxListen(){if(!TRX.parts||!ensureAudio())return;var b=$('#trxPlay');if(trxSrcs.length){transportStop();trxSrcs=[];b.textContent='Listen';return;}
  var q=trxQuant(),sd=60/TRX.bpm/4,t0=ctx.currentTime+0.1,ti=KEYSI()[0]||1,end=0;q.forEach(function(n){playNote(ti,n.m,n.v*0.9,t0+n.s*sd,Math.max(0.08,n.l*sd));end=Math.max(end,n.s+n.l);});trxSrcs=[1];b.textContent='Stop';
  setTimeout(function(){if(trxSrcs.length){trxSrcs=[];b.textContent='Listen';}},(end*sd+1.5)*1000);}
function initTrx(){
  $('#f-TRX').addEventListener('change',function(){if(this.files&&this.files[0])trxFile(this.files[0]);});
  $$('#trxMode [data-tm]').forEach(function(b){b.addEventListener('click',function(){TRX.mode=b.getAttribute('data-tm');$$('#trxMode [data-tm]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});$('#trxPick').textContent=TRX.mode==='stems'?'Choose a song':'Choose a recording';$('#trxStemNote').hidden=TRX.mode!=='stems';$('#stemPick').hidden=TRX.mode!=='stems';});});
  $('#trxBpmDn').addEventListener('click',function(){TRX.bpm=Math.max(40,TRX.bpm-1);trxShowRes();});$('#trxBpmUp').addEventListener('click',function(){TRX.bpm=Math.min(240,TRX.bpm+1);trxShowRes();});
  $('#trxHalf').addEventListener('click',function(){TRX.bpm=Math.max(40,Math.round(TRX.bpm/2));trxShowRes();});$('#trxDbl').addEventListener('click',function(){TRX.bpm=Math.min(240,TRX.bpm*2);trxShowRes();});
  $('#trxView').addEventListener('click',function(){trxUse(openScore);});$('#trxPdf').addEventListener('click',function(){trxUse(exportPDF);});$('#trxXml').addEventListener('click',function(){trxUse(exportNotation);});
  $('#trxPlay').addEventListener('click',trxListen);
  $('#trxClipGo').addEventListener('click',function(){var f=TRX.clipFile;if(!f||TRX.busy)return;TRX.clipFile=null;$('#trxClipQ').hidden=true;if(TRX.mode==='stems')stemsFile(f);else trxFile(f);});
  $('#trxClipX').addEventListener('click',function(){TRX.clipFile=null;$('#trxClipQ').hidden=true;});
  $('#f-STEM').addEventListener('change',function(){var f=this.files[0];this.value='';stemsFile(f);});
  $('#trxProj').addEventListener('click',function(){SCOREX=null;openScore();});var ds=$('#dawScore');if(ds)ds.addEventListener('click',function(){SCOREX=null;openScore();});trxProjUI();
  if(window.IntersectionObserver)new IntersectionObserver(function(es){if(es[0].isIntersecting)trxProjUI();}).observe($('#trxCard'));
  /* lets the stem splitter use every CPU core on later visits (cross-origin isolation through a service worker) */
  if('serviceWorker' in navigator&&location.protocol==='https:'){try{navigator.serviceWorker.register('sw.js').catch(function(){});}catch(e){}}
}

/* ===================== RECORDED INSTRUMENTS =====================
   Multisampled recordings, loaded on demand from samples/. Until a set has loaded, the matching synthesized
   sound plays, then every track using it switches to the recording. Sources and licences: samples/CREDITS.md */
