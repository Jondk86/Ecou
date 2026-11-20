var AMPM={
  clean:{name:'Clean combo',hp:60,k1:1.6,asym:0,k2:0,lp:9000,cab:'combo',trim:0},
  crunch:{name:'British crunch',hp:90,k1:7,asym:0.18,k2:1.5,lp:6500,cab:'4x12',trim:-6},
  higain:{name:'High-gain',hp:110,k1:22,asym:0.1,k2:9,lp:5200,cab:'4x12',trim:-11},
  bass:{name:'Bass amp',hp:30,k1:3.5,asym:0.05,k2:0,lp:4200,cab:'8x10',trim:-3},
  tube:{name:'Tube / tape',hp:35,k1:3,asym:0.35,k2:0,lp:14000,cab:'none',trim:-4}
};
var ampModel='crunch',cabCustom=null,cabName='',matchRef='';
var TMF=[31,63,125,250,500,1000,2000,4000,8000,16000];
function ampCurve(k,asym){var n=4096,c=new Float32Array(n);if(k<=0.01){for(var i=0;i<n;i++)c[i]=i/(n-1)*2-1;return c;}var nrm=Math.tanh(k*(1+asym));for(var j=0;j<n;j++){var x=j/(n-1)*2-1;c[j]=Math.tanh(k*(x+asym*x*x))/nrm;}return c;}
function cabIR(type){
  var sr=ctx.sampleRate,n=Math.floor(sr*0.045),b=ctx.createBuffer(1,n,sr),d=b.getChannelData(0);
  var lp={combo:5200,'4x12':4300,'8x10':3400}[type]||5000,hp={combo:90,'4x12':75,'8x10':45}[type]||80,res={combo:[[2600,0.5],[140,0.6]],'4x12':[[2200,0.7],[110,0.9],[3400,0.3]],'8x10':[[900,0.4],[70,1]]}[type]||[];
  var al=1-Math.exp(-2*Math.PI*lp/sr),ah=1-Math.exp(-2*Math.PI*hp/sr),l=0,l2=0,lo=0;
  for(var i=0;i<n;i++){var t=i/sr,x=(Math.random()*2-1)*Math.exp(-t*260);l+=al*(x-l);l2+=al*(l-l2);lo+=ah*(l2-lo);var y=l2-lo;
    res.forEach(function(r){y+=r[1]*0.15*Math.sin(2*Math.PI*r[0]*t)*Math.exp(-t*(r[0]<300?90:420));});d[i]=y;}
  var e=0;for(i=0;i<n;i++)e+=d[i]*d[i];var g=1/Math.sqrt(e+1e-12);for(i=0;i<n;i++)d[i]*=g*0.35;return b;
}
function updAmpCurves(){if(!ctx||!FX.amp)return;var M=AMPM[ampModel],gn=0.15+P.ampGain.v*1.7;FX.amp.sh1.curve=ampCurve(M.k1*gn,M.asym);FX.amp.sh2.curve=ampCurve(M.k2*gn,M.asym*0.5);}
function setAmpModel(id){
  if(!AMPM[id])return;ampModel=id;$$('[data-amp]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-amp')===id?'true':'false');});
  if(!ctx||!FX.amp)return;var m=FX.amp,M=AMPM[id],now=ctx.currentTime;
  m.hp.frequency.setTargetAtTime(M.hp,now,0.02);m.mid.frequency.setTargetAtTime(M.lp,now,0.02);updAmpCurves();if(m.trim)m.trim.gain.setTargetAtTime(dbg(M.trim||0),now,0.02);
  if(!cabCustom){if(M.cab==='none'){m.cabWet.gain.value=0;m.cabDry.gain.value=1;}else{m.cab.buffer=cabIR(M.cab);m.cabWet.gain.value=1;m.cabDry.gain.value=0;}cabName=M.cab==='none'?'No cabinet':M.cab+' cabinet';}
  var ci=$('#cabInfo');if(ci)ci.textContent=cabName;
}
function buildAmp(){
  var m=FX.amp;m.hp=BQ('highpass',80,0.707);m.pre=G(1);m.sh1=ctx.createWaveShaper();m.sh1.oversample='4x';m.mid=BQ('lowpass',7000,0.6);m.sh2=ctx.createWaveShaper();m.sh2.oversample='4x';
  m.bass=BQ('lowshelf',120);m.midf=BQ('peaking',650,0.8);m.treb=BQ('highshelf',2800);m.pres=BQ('highshelf',5500);
  m.cab=ctx.createConvolver();m.cab.normalize=false;m.cabWet=G(1);m.cabDry=G(0);m.master=G(0.5);
  m.in.connect(m.hp);m.hp.connect(m.pre);m.pre.connect(m.sh1);m.sh1.connect(m.mid);m.mid.connect(m.sh2);m.sh2.connect(m.bass);m.bass.connect(m.midf);m.midf.connect(m.treb);m.treb.connect(m.pres);
  m.dc=BQ('highpass',25,0.707);m.trim=G(1);m.pres.connect(m.dc);m.dc.connect(m.cab);m.cab.connect(m.cabWet);m.dc.connect(m.cabDry);m.cabWet.connect(m.trim);m.cabDry.connect(m.trim);m.trim.connect(m.master);m.master.connect(m.out);
  /* tone match */
  var t=FX.match;t.bands=TMF.map(function(f){return BQ('peaking',f,1.4);});t.target=TMF.map(function(){return 0;});
  var prev=t.in;t.bands.forEach(function(b){prev.connect(b);prev=b;});prev.connect(t.out);
  setAmpModel(ampModel);
}
function applyMatch(){if(!ctx||!FX.match)return;var now=ctx.currentTime;FX.match.bands.forEach(function(b,i){b.gain.setTargetAtTime(FX.match.target[i]*P.tmAmt.v,now,0.05);});renderMatchInfo();}
function renderMatchInfo(){var el=$('#matchInfo');if(!el)return;if(!matchRef){el.textContent='No reference yet.';return;}el.textContent='Matched to “'+matchRef+'”: '+TMF.map(function(f,i){var g=FX.match.target[i];return (f>=1000?f/1000+'k':f)+' '+(g>0?'+':'')+dec(g,1);}).join(' · ')+' dB';}
function bandSpectrum(d,sr){
  var N=4096,H=2048,win=new Float64Array(N),acc=new Float64Array(N/2+1),frames=0,i;for(i=0;i<N;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
  var lim=Math.min(d.length,sr*20);
  for(var s=0;s+N<=lim;s+=H){var re=new Float64Array(N),im=new Float64Array(N);for(i=0;i<N;i++)re[i]=d[s+i]*win[i];fft(re,im,false);for(i=0;i<=N/2;i++)acc[i]+=re[i]*re[i]+im[i]*im[i];frames++;}
  if(!frames)return null;
  return TMF.map(function(f){var lo=Math.max(1,Math.floor(f/Math.SQRT2*N/sr)),hi=Math.min(N/2,Math.ceil(f*Math.SQRT2*N/sr)),e=0,c=0;for(var k=lo;k<=hi;k++){e+=acc[k];c++;}return 10*Math.log10(e/Math.max(1,c)/frames+1e-12);});
}
function toneMatch(refData,sr,name){
  var S=slots.A;if(!S.buf){toast('Load a sound into Source A of the selected track first.');return;}
  var ref=bandSpectrum(refData,sr),src=bandSpectrum(S.buf.getChannelData(0),S.buf.sampleRate);
  if(!ref||!src){toast('Reference or source is too short to analyse (needs ~0.2 s).');return;}
  var valid=TMF.map(function(f){return f<sr/2*0.9;}),mr=0,ms=0,c=0;
  ref.forEach(function(v,i){if(valid[i]){mr+=v;ms+=src[i];c++;}});mr/=c;ms/=c;
  var raw=ref.map(function(v,i){return valid[i]?(v-mr)-(src[i]-ms):0;});
  FX.match.target=raw.map(function(v,i){var a=raw[i-1]!=null?raw[i-1]:v,b=raw[i+1]!=null?raw[i+1]:v;return valid[i]?Math.round(clamp(0.25*a+0.5*v+0.25*b,-9,9)*10)/10:0;});
  matchRef=name;fxOn.match=true;buildFxUI();routeFX();applyMatch();markDirty();
  toast('Tone matched to “'+name+'”. Tone Match is on in the insert chain.');
}
function makeCabIR(d,sr){
  var pk=0,pi=0,i;for(i=0;i<d.length;i++){var a=Math.abs(d[i]);if(a>pk){pk=a;pi=i;}}
  if(pk<0.02){toast('No transient detected. Clap louder, close to the speaker.');return;}
  var st=Math.max(0,pi-Math.floor(sr*0.001)),n=Math.min(Math.floor(sr*0.25),d.length-st),ir=ctx.createBuffer(1,n,sr),o=ir.getChannelData(0),e=0;
  for(i=0;i<n;i++){var f=i>n*0.5?(n-i)/(n*0.5):1;o[i]=d[st+i]*f;e+=o[i]*o[i];}
  var g=1/Math.sqrt(e+1e-12);for(i=0;i<n;i++)o[i]*=g*0.35;
  cabCustom=ir;FX.amp.cab.buffer=ir;FX.amp.cabWet.gain.value=1;FX.amp.cabDry.gain.value=0;cabName='Captured cabinet';
  var ci=$('#cabInfo');if(ci)ci.textContent=cabName;fxOn.amp=true;buildFxUI();routeFX();markDirty();toast('Cabinet captured. The Amp now uses it.');
}
/* live input */
var live=null;
function liveStart(){
  if(!ensureAudio())return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Live input isn’t available in this view. Use the full version (hosted ecou.html) in Chrome.',5500);return;}
  var gst=null;navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(stream){gst=stream;
    liveStop();var s=ctx.createMediaStreamSource(stream);N.liveIn=N.liveIn||G(1);N.liveIn.gain.value=P.liveGain.v;s.connect(N.liveIn);
    try{N.liveIn.disconnect();}catch(e){}N.liveIn.connect(N.chainIn);
    live={stream:stream,src:s};if(VTL.on)vtLiveAttach(live);var lat=Math.round(((ctx.baseLatency||0)+(ctx.outputLatency||0))*1000);
    $('#liveState').textContent='live'+(lat?' · ~'+lat+' ms output latency':'');$('#liveOn').disabled=true;$('#liveOff').disabled=false;
    toast('Input is live through the insert chain. Use headphones to avoid feedback.',4000);btMonHint();
  }).catch(function(){if(gst&&!(live&&live.stream===gst))gst.getTracks().forEach(function(t){t.stop();});toast('Microphone access is blocked in this view. Use the full version (hosted ecou.html) in Chrome.',5500);});
}
function liveStop(){if(!live)return;try{live.src.disconnect();}catch(e){}vtLiveDrop(live.vox);live.stream.getTracks().forEach(function(t){t.stop();});live=null;$('#liveState').textContent='off';$('#liveOn').disabled=false;$('#liveOff').disabled=true;}
function initAmp(){
  $('#liveOn').addEventListener('click',liveStart);$('#liveOff').addEventListener('click',liveStop);
  $('#f-CAB').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';upload('CAB',f);});
  $('#f-REF').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(!f||!ensureAudio())return;toast('Analysing reference…',1500);
    f.arrayBuffer().then(decodeAB).then(function(b){toneMatch(toMono(b),b.sampleRate,f.name.replace(/\.[^.]+$/,'').slice(0,28));}).catch(function(){toast('Unsupported file. Try WAV, MP3 or M4A.');});});
}

/* ---------- SHEET MUSIC ---------- */
