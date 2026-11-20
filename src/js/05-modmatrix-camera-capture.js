var KEYMAP='awsedftgyhujkolp';
document.addEventListener('keydown',function(e){
  if(e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
  var ae=document.activeElement;if(ae&&(ae.tagName==='SELECT'||ae.tagName==='TEXTAREA'||(ae.tagName==='INPUT'&&ae.type!=='range'&&ae.type!=='checkbox')))return;
  if($('#t-pad').classList.contains('active')){var pi='1234qwerasdfzxcv'.indexOf(e.key.toLowerCase());if(pi>=0){trigPad(pi,0.9);recPad(pi,0.9);selectPad(pi);}return;}
  var i=KEYMAP.indexOf(e.key.toLowerCase());if(i<0)return;
  if(document.activeElement&&document.activeElement.tagName==='INPUT'&&document.activeElement.type!=='range')return;
  noteOn('k'+e.key.toLowerCase(),12*(octave+1)+i,0.8);
});
document.addEventListener('keyup',function(e){if(ctx)noteOff('k'+e.key.toLowerCase());});

/* ---------- surse de modulație ---------- */
var src={lfo:0,padX:0,padY:0,finger:0,modw:0,tilt:0,roll:0,camMot:0,camLum:0};
var SRC=[['lfo','LFO'],['padX','Pad X'],['padY','Pad Y'],['finger','Key position'],['modw','Mod wheel'],['tilt','Tilt'],['roll','Roll'],['camMot','Cam motion'],['camLum','Cam brightness']];
var DST=['Cutoff','Pitch','Level','Reverb','Grain'];
var MX=[[0,0,0,0,0],[0,0,0,0,50],[50,0,0,0,0],[25,0,0,0,0],[50,0,0,0,0],[50,0,0,0,0],[0,25,0,0,0],[50,0,0,0,25],[0,0,0,50,0]];
var CYCLE=[0,25,50,100,-50];
function buildMatrix(){
  var m=$('#mx'),h='<span></span>';
  DST.forEach(function(d){h+='<span class="h">'+d+'</span>';});
  SRC.forEach(function(s,r){h+='<span class="s">'+s[1]+'</span>';DST.forEach(function(d,c){h+='<button data-r="'+r+'" data-c="'+c+'" aria-label="'+s[1]+' to '+d+'"></button>';});});
  m.innerHTML=h;
  $$('#mx button').forEach(function(b){
    paintCell(b);
    b.addEventListener('click',function(){var r=+b.getAttribute('data-r'),c=+b.getAttribute('data-c');var i=CYCLE.indexOf(MX[r][c]);MX[r][c]=CYCLE[(i+1)%CYCLE.length];paintCell(b);markDirty();});
  });
  var sl=$('#srcList'),sh='';
  SRC.forEach(function(s){sh+='<div class="srow"><span>'+s[1]+'</span><span class="meter"><i data-m="'+s[0]+'"></i></span></div>';});
  sl.innerHTML=sh;
}
function paintCell(b){var v=MX[+b.getAttribute('data-r')][+b.getAttribute('data-c')];b.setAttribute('aria-label',SRC[+b.getAttribute('data-r')][1]+' to '+DST[+b.getAttribute('data-c')]+': '+(v?v+'%':'off'));b.textContent=v?(v>0?v:'−'+(-v)):'+';b.classList.toggle('on',v>0);b.classList.toggle('neg',v<0);}

/* pad XY */
var xy=$('#xy'),xyId=null;
function xyMove(e){var r=xy.getBoundingClientRect();var x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1);src.padX=x*2-1;src.padY=(0.5-y)*2;var d=$('#xydot');d.style.left=(x*100)+'%';d.style.top=(y*100)+'%';}
xy.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();xyId=e.pointerId;xy.setPointerCapture(e.pointerId);xyMove(e);});
xy.addEventListener('pointermove',function(e){if(e.pointerId===xyId)xyMove(e);});
xy.addEventListener('pointerup',function(e){if(e.pointerId===xyId)xyId=null;});

/* camera */
var vid=$('#vid'),cam={on:false,stream:null,prev:null,url:null};
var ccv=document.createElement('canvas');ccv.width=40;ccv.height=30;var cctx=ccv.getContext('2d',{willReadFrequently:true});
function camStop(){
  cam.on=false;if(cam.stream){cam.stream.getTracks().forEach(function(t){t.stop();});cam.stream=null;}
  try{vid.pause();}catch(e){}vid.srcObject=null;vid.removeAttribute('src');if(cam.url){URL.revokeObjectURL(cam.url);cam.url=null;}
  vid.style.display='none';src.camMot=0;src.camLum=0;cam.prev=null;$('#camState').textContent='off';$('#camOff').hidden=true;
}
function camStart(label){cam.on=true;vid.style.display='block';$('#camState').textContent=label;$('#camOff').hidden=false;}
$('#camLive').addEventListener('click',function(){
  ensureAudio();
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Live camera isn’t available in this view. Use Import video — you can shoot a clip directly.',5000);return;}
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:320},height:{ideal:240}},audio:false}).then(function(s){
    camStop();cam.stream=s;vid.srcObject=s;vid.muted=true;return vid.play().then(function(){camStart('live');});
  }).catch(function(){toast('Live camera isn’t available in this view. Use Import video — you can shoot a clip directly.',5000);});
});
$('#camUp').addEventListener('click',function(){ensureAudio();});
$('#f-VID').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;e.target.value='';
  camStop();cam.url=URL.createObjectURL(f);vid.src=cam.url;vid.loop=true;vid.muted=true;
  vid.play().then(function(){camStart(f.name.replace(/\.[^.]+$/,''));}).catch(function(){toast('This video format isn’t supported.');});
});
$('#camOff').addEventListener('click',camStop);
function camAnalyze(){
  if(!cam.on||vid.readyState<2)return;
  try{cctx.drawImage(vid,0,0,40,30);}catch(e){return;}
  var d=cctx.getImageData(0,0,40,30).data,n=1200,lum=new Float32Array(n),sum=0,diff=0;
  for(var i=0;i<n;i++){var y=(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2])/255;lum[i]=y;sum+=y;if(cam.prev)diff+=Math.abs(y-cam.prev[i]);}
  cam.prev=lum;
  src.camLum=src.camLum*0.85+(sum/n)*0.15;
  src.camMot=src.camMot*0.7+clamp(diff/n*12,0,1)*0.3;
}

/* mișcare */
var mot={base:null,last:0};
function onOri(e){
  if(e.beta==null)return;mot.last=performance.now();
  if(!mot.base){mot.base={b:e.beta,g:e.gamma};$('#motState').textContent='active';}
  src.tilt=clamp((e.beta-mot.base.b)/35,-1,1);src.roll=clamp((e.gamma-mot.base.g)/35,-1,1);
}
function motBlocked(){$('#motState').textContent='unavailable';toast('Motion sensors aren’t available in this view. The XY pad covers the same controls.',5000);}
$('#motOn').addEventListener('click',function(){
  ensureAudio();
  var go=function(){window.addEventListener('deviceorientation',onOri);mot.base=null;mot.last=0;$('#motState').textContent='starting…';setTimeout(function(){if(!mot.last)motBlocked();},1600);};
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      DeviceOrientationEvent.requestPermission().then(function(r){if(r==='granted')go();else motBlocked();}).catch(motBlocked);
    }else go();
  }catch(e){motBlocked();}
});
$('#motCal').addEventListener('click',function(){mot.base=null;src.tilt=0;src.roll=0;});

/* ---------- captură și încărcare ---------- */
var capture=null;
var CAPBTN={ECHO:'#echoNoLbl',IR:'#capIR',PAD:'#padRec',BB:'#bbRec',CAB:'#cabRec'},CAPLBL={IR:'● Capture IR',PAD:'● Record to pad',BB:'● Beatbox',CAB:'● Capture cab',A:'● Record sample',B:'● Record sample'};
function capBtn(target){return CAPBTN[target]?$(CAPBTN[target]):$('[data-cap="'+target+'"]');}
function setCapUI(target,on){var b=capBtn(target);if(!b)return;b.classList.toggle('live',on);b.textContent=on?'■ Stop':(CAPLBL[target]||'● Record');}
function startCapture(target){
  if(!ensureAudio())return;
  if(capture){var same=capture.target===target;stopCapture();if(same)return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){micBlocked(target);return;}
  var gst=null;navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(stream){gst=stream;
    var s=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1),mute=ctx.createGain();mute.gain.value=0;
    var chunks=[];
    proc.onaudioprocess=function(ev){chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));};
    s.connect(proc);proc.connect(mute);mute.connect(ctx.destination);
    var max={IR:3,PAD:4,BB:8,CAB:1.5,IDEA:ID.mode==='memo'?60:ID.mode==='hum'?Math.min(70,Math.max(30,16*bandN()*stepDur()+5)):30}[target]||10;
    capture={target:target,stream:stream,s:s,proc:proc,mute:mute,chunks:chunks,t0:performance.now(),timer:setTimeout(stopCapture,max*1000)};
    setCapUI(target,true);
    if(target!=='ECHO'&&target!=='IDEA')toast({IR:'Listening — clap now.',BB:'Recording — beatbox now (max 8 s).',PAD:'Recording — max 4 s.'}[target]||'Recording — max 10 s.',2200);
  }).catch(function(){if(gst&&!(capture&&capture.stream===gst))gst.getTracks().forEach(function(t){t.stop();});micBlocked(target);});
}
function stopCapture(){
  var c=capture;if(!c)return;capture=null;clearTimeout(c.timer);
  try{c.s.disconnect();c.proc.disconnect();c.mute.disconnect();}catch(e){}
  c.stream.getTracks().forEach(function(t){t.stop();});
  var len=0;c.chunks.forEach(function(ch){len+=ch.length;});
  var data=new Float32Array(len),o=0;c.chunks.forEach(function(ch){data.set(ch,o);o+=ch.length;});
  setCapUI(c.target,false);
  handleAudio(data,ctx.sampleRate,c.target,c.target==='IR'?'Captured room':c.target==='BB'?'Beatbox':'Capture '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
}
function micBlocked(target){if(target==='ECHO'){echoDenied();return;}if(target==='IDEA'){ideaBlocked();return;}
  toast('Microphone access is blocked in this view. Use Import to load a recording from your device.',5500);
}
function decodeAB(ab){return new Promise(function(res,rej){var p=ctx.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej);});}
function toMono(b){var n=b.length,d=new Float32Array(n);for(var ch=0;ch<b.numberOfChannels;ch++){var c=b.getChannelData(ch);for(var i=0;i<n;i++)d[i]+=c[i]/b.numberOfChannels;}return d;}
function upload(target,file){
  if(!file||!ensureAudio())return;
  toast('Importing…',1500);
  file.arrayBuffer().then(decodeAB).then(function(b){
    handleAudio(toMono(b),b.sampleRate,target,file.name.replace(/\.[^.]+$/,'').slice(0,28));
  }).catch(function(){toast('Unsupported file. Try WAV, MP3 or M4A.');});
}
['A','B'].forEach(function(k){
  $('[data-cap="'+k+'"]').addEventListener('click',function(){startCapture(k);});
  $('[data-up="'+k+'"]').addEventListener('click',function(){ensureAudio();});
  $('#f-'+k).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';upload(k,f);});
});
$('#capIR').addEventListener('click',function(){startCapture('IR');});
$$('[data-oct]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-oct'),s=slots[k],d=+b.getAttribute('data-d');if(!s||!s.det||!s.buf||s.stock)return;var r=s.root*Math.pow(2,d);if(r<16||r>8000)return;
  s.root=r;s.conf=1;if(k==='A'&&typeof morphRoot!=='undefined'&&!morphBuf)morphRoot=r;slotUI(k);updateMorph();if(typeof morphMode!=='undefined'&&morphMode!=='blend'&&slots.A.buf&&slots.B.buf)scheduleMorph();markDirty();toast('Source '+k+' now plays as '+nname(ftom(r))+' on the keys.',1800);});});
['BB','PAD'].forEach(function(k){$('#f-'+k).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';upload(k,f);});});
$('#bbRec').addEventListener('click',function(){startCapture('BB');});
$('#padRec').addEventListener('click',function(){startCapture('PAD');});
$('#bbUp').addEventListener('click',function(){ensureAudio();});$('#padUp').addEventListener('click',function(){ensureAudio();});
$('#upIR').addEventListener('click',function(){ensureAudio();});
$('#f-IR').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';upload('IR',f);});

/* ── Sound-to-Instrument analysis (capture → playable instrument) ── */
/* DC removal + 30 Hz 2nd-order high-pass. Captured/imported sounds only. */
function capClean(d,sr){
  var n=d.length,i,m=0,x;for(i=0;i<n;i++){x=d[i];if(!(x>-1e9&&x<1e9)){d[i]=0;continue;}m+=x;}m/=n||1;
  var w=2*Math.PI*30/sr,cs=Math.cos(w),al=Math.sin(w)/1.41421356,a0=1+al,b0=(1+cs)/2/a0,b1=-(1+cs)/a0,a1=-2*cs/a0,a2=(1-al)/a0,x1=0,x2=0,y1=0,y2=0,y;
  for(i=0;i<n;i++){x=d[i]-m;y=b0*x+b1*x1+b0*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;d[i]=y;}
  return d;
}
/* Loudness for captured sounds: RMS of the loud part (50 ms blocks within 20 dB of the loudest) → −18 dBFS, peak never above 0.9. */
function normCap(d,sr){
  var n=d.length,H=Math.max(1,Math.round(sr*0.05)),nb=Math.max(1,Math.floor(n/H)),ms=new Float32Array(nb),pe=0,pk=0,i,b,s,a;
  for(i=0;i<n;i++){a=Math.abs(d[i]);if(!(a<1e9)){d[i]=0;continue;}if(a>pk)pk=a;}
  if(!(pk>0))return d;
  for(b=0;b<nb;b++){s=0;var e=Math.min(n,b*H+H);for(i=b*H;i<e;i++)s+=d[i]*d[i];ms[b]=s/(e-b*H);if(ms[b]>pe)pe=ms[b];}
  var acc=0,c=0;for(b=0;b<nb;b++)if(ms[b]>pe*0.01){acc+=ms[b];c++;}
  var rms=Math.sqrt(c?acc/c:pe),g=rms>0?0.1259/rms:1;if(pk*g>0.9)g=0.9/pk;
  for(i=0;i<n;i++)d[i]*=g;return d;
}
/* Trim: noise floor = quietest 100 ms; start = first block 12 dB over the floor, minus 5 ms; end = last 20 ms window over floor+6 dB / peak−60 dB. */
function trim(d,sr){
  var n=d.length,pk=0,i,b,s;for(i=0;i<n;i++){var a=Math.abs(d[i]);if(a>pk)pk=a;}
  if(pk<0.003)return null;
  var H=Math.max(1,Math.round(sr*0.0025)),nb=Math.floor(n/H);if(nb<20)return null;
  var e=new Float32Array(nb),pe=0;for(b=0;b<nb;b++){s=0;for(i=b*H;i<b*H+H;i++)s+=d[i]*d[i];e[b]=s/H;if(e[b]>pe)pe=e[b];}
  var wl=Math.min(40,nb),acc=0,fl=1e9;for(b=0;b<nb;b++){acc+=e[b];if(b>=wl)acc-=e[b-wl];if(b>=wl-1&&acc<fl)fl=acc;}
  fl=Math.min(Math.max(fl/wl,1e-9,pe*1e-7),pe*1e-3);
  var on=fl*16,off=Math.max(fl*4,pe*1e-6),sb=0,eb=nb-1;
  while(sb<nb-1&&!(e[sb]>on&&(e[sb]+e[Math.min(nb-1,sb+1)]+e[Math.min(nb-1,sb+2)]+e[Math.min(nb-1,sb+3)])>on*2))sb++;
  acc=0;var last=-1;for(b=0;b<nb;b++){acc+=e[b];if(b>=8)acc-=e[b-8];if(acc>off*8)last=b;}
  if(last<0)return null;eb=last;
  var s0=Math.max(0,sb*H-Math.floor(sr*0.005)),e0=Math.min(n,(eb+1)*H+Math.floor(sr*0.05));
  e0=Math.min(e0,s0+Math.floor(sr*12));
  if(e0-s0<sr*0.05)return null;
  var out=d.slice(s0,e0),fi=Math.floor(sr*0.002),fo=Math.min(Math.floor(sr*0.015),out.length>>2);
  for(i=0;i<fi&&i<out.length;i++)out[i]*=i/fi;
  for(i=0;i<fo;i++)out[out.length-1-i]*=i/fo;
  return out;
}
/* YIN cumulative-mean-normalised difference of x[o..] for lags 1..T (window W) into cm[]. */
function yinCM(x,o,W,T,cm){
  var t,j,s,df,run=0;cm[0]=1;
  for(t=1;t<=T;t++){s=0;for(j=0;j<W;j++){df=x[o+j]-x[o+j+t];s+=df*df;}cm[t]=s;}
  for(t=1;t<=T;t++){run+=cm[t];cm[t]=run>0?cm[t]*t/run:1;}
}
/* Pitch of a note: YIN on up to 32 frames of the sustain, two resolutions (full rate for 340–4200 Hz, ÷D for 29–1000 Hz),
   median of the confident frames. Returns {hz,midi,cents,conf} or null when there is no clear pitch. */
function detectPitchEx(d,sr){
  var n=d.length,i,j,k,t;
  var D=Math.max(1,Math.round(sr/11025)),srd=sr/D;
  var hiMin=Math.max(2,Math.floor(sr/4200)),hiMax=Math.ceil(sr/340),WH=Math.round(sr*0.023),needH=WH+hiMax+3;
  if(n<needH)return null;
  var loMin=Math.max(3,Math.floor(srd/1000)),loMax=Math.ceil(srd/29);
  loMax=Math.min(loMax,Math.floor((n/D-4)/2.3));var useLo=loMax>loMin+8,WL=Math.round(loMax*1.3),ndl=WL+loMax+3,needL=useLo?(ndl+1)*D:0;
  var FL=Math.max(needH,needL);
  /* sustain region: from 20 ms after the loudest 10 ms block (first second) to where the level falls 30 dB */
  var H=Math.max(1,Math.round(sr*0.01)),nb=Math.floor(n/H),pe=0,pb=0,b,s,ev=new Float32Array(nb);
  for(b=0;b<nb;b++){s=0;for(i=b*H;i<b*H+H;i++)s+=d[i]*d[i];ev[b]=s;if(s>pe&&b*H<sr){pe=s;pb=b;}}
  if(pe/H<1e-6)return null;
  var eb=pb;for(b=pb;b<nb;b++)if(ev[b]>pe*1e-3)eb=b;
  var ra=Math.min((pb+2)*H,Math.max(0,n-FL)),rb=Math.max(ra,Math.min(n,(eb+1)*H)-FL);
  var NF=Math.max(1,Math.min(32,Math.floor((rb-ra)/(FL/4))+1));
  var cmH=new Float32Array(hiMax+3),cmL=useLo?new Float32Array(loMax+3):null,xd=useLo?new Float32Array(ndl):null,fs=[],nv=0,inv=1/(2*D);
  for(var f=0;f<NF;f++){
    var o=NF>1?Math.round(ra+(rb-ra)*f/(NF-1)):ra,cand=[],en=0;
    for(j=0;j<WH;j+=4)en+=d[o+j]*d[o+j];if(en*4/WH<pe/H*1e-4)continue;nv++;
    yinCM(d,o,WH,hiMax+1,cmH);
    for(t=2;t<=hiMax;t++)if(cmH[t]<0.45&&cmH[t]<cmH[t-1]&&cmH[t]<=cmH[t+1]){var a1=cmH[t-1],b1=cmH[t],c1=cmH[t+1],den=a1-2*b1+c1,p=den?0.5*(a1-c1)/den:0;if(p>1)p=1;if(p<-1)p=-1;cand.push([(t+p)/sr,b1-0.25*(a1-c1)*p,1]);}
    if(useLo){
      for(k=0;k<ndl;k++){s=0;var q=o+k*D;for(j=0;j<2*D;j++)s+=d[q+j]||0;xd[k]=s*inv;}
      yinCM(xd,0,WL,loMax+1,cmL);
      for(t=loMin;t<=loMax;t++)if(cmL[t]<0.45&&cmL[t]<cmL[t-1]&&cmL[t]<=cmL[t+1]){a1=cmL[t-1];b1=cmL[t];c1=cmL[t+1];den=a1-2*b1+c1;p=den?0.5*(a1-c1)/den:0;if(p>1)p=1;if(p<-1)p=-1;cand.push([(t+p)/srd,b1-0.25*(a1-c1)*p,0]);}
    }
    if(!cand.length)continue;
    cand.sort(function(x,y){return x[0]-y[0];});
    var dm=1;for(k=0;k<cand.length;k++)if(cand[k][1]<dm)dm=cand[k][1];
    var pick=null;for(k=0;k<cand.length;k++)if(cand[k][1]<=dm+0.07){pick=cand[k];break;}
    if(!pick||pick[1]>0.3||pick[0]*sr<hiMin)continue;
    if(!pick[2])for(k=0;k<cand.length;k++)if(cand[k][2]&&Math.abs(cand[k][0]/pick[0]-1)<0.03){pick=[cand[k][0],pick[1],1];break;}
    fs.push([Math.log(1/pick[0]),pick[1]]);
  }
  if(!nv||fs.length<Math.max(1,Math.ceil(nv*0.25)))return null;
  fs.sort(function(x,y){return x[0]-y[0];});
  var med=fs[fs.length>>1][0],ag=0,mv=0;for(k=0;k<fs.length;k++){if(Math.abs(fs[k][0]-med)<0.035){ag++;mv+=fs[k][1];}}
  var hz=Math.exp(med),conf=(ag/nv)*(1-mv/ag);
  if(ag<fs.length*0.5||conf<0.2||hz<28||hz>4300)return null;
  /* refine: mean of the agreeing frames */
  var m2=0;for(k=0;k<fs.length;k++)if(Math.abs(fs[k][0]-med)<0.035)m2+=fs[k][0];hz=Math.exp(m2/ag);
  var mf=69+12*Math.log(hz/440)/Math.LN2,mi=Math.round(mf);
  return {hz:hz,midi:mi,cents:Math.round((mf-mi)*100),conf:conf>1?1:conf};
}
function detectPitch(d,sr){var r=detectPitchEx(d,sr);detectPitch.conf=r?r.conf:0;return r?r.hz:null;}
/* Loop finder. Sustained sounds get a pitch-synchronous loop [ls,le,xf,r] (samples; r = similarity at the seam);
   decaying sounds return null and play as one-shots with their natural tail. P = period in samples (0 = unpitched). */
function findLoop(d,sr,P){
  var n=d.length,H=Math.max(1,Math.round(sr*0.02)),nb=Math.floor(n/H),i,b,s;
  if(n<sr*0.3||nb<12)return null;
  var L=new Float32Array(nb),srt=[];for(b=0;b<nb;b++){s=0;for(i=b*H;i<b*H+H;i+=2)s+=d[i]*d[i];L[b]=10*Math.log(s*2/H+1e-12)/Math.LN10;srt.push(L[b]);}
  srt.sort(function(x,y){return x-y;});var ref=srt[Math.floor(nb*0.75)]-5,best=0,ba=0,run=0;
  for(b=0;b<nb;b++){if(L[b]>ref){run++;if(run>best){best=run;ba=b-run+1;}}else run=0;}
  if(best*H<Math.max(sr*0.2,n*0.3))return null;
  var a=ba+Math.max(1,Math.round(best*0.15)),z=ba+best,m=z-a,sx=0,sy=0,sxx=0,sxy=0;if(m<5)return null;
  for(b=a;b<z;b++){sx+=b;sy+=L[b];sxx+=b*b;sxy+=b*L[b];}
  var slope=(m*sxy-sx*sy)/(m*sxx-sx*sx||1);
  if(-slope*m>5||L[z-1]<L[a]-7)return null;
  var lo=ba*H+Math.max(Math.round(sr*0.1),Math.round(best*H*0.15)),hi=Math.min(n,z*H)-Math.round(sr*0.03);
  var W=Math.round(Math.min(sr*0.04,Math.max(sr*0.008,P?2*P:sr*0.02))),W2=W>>1;
  if(lo<W+2)lo=W+2;if(hi+W2>=n)hi=n-W2-1;
  var span=hi-lo;if(span<Math.max(sr*0.12,P*6))return null;
  var st=Math.max(1,Math.floor(W/384));
  function sc(p,q){var xy=0,xx=0,yy=0,k,x,y;for(k=-W;k<W2;k+=st){x=d[p+k];y=d[q+k];xy+=x*y;xx+=x*x;yy+=y*y;}
    if(!(xx>0&&yy>0))return [-9,0];var r=xy/Math.sqrt(xx*yy);return [r-0.035*Math.abs(10*Math.log(xx/yy)/Math.LN10),r];}
  var bs=-9,bp=0,bq=0,br=0,NS=14,NE=56,u,v,p,q,k0,k1,r;
  for(u=0;u<NS;u++){p=Math.round(lo+span*0.35*u/(NS-1));
    var q0=Math.max(lo+span*0.6,p+Math.max(sr*0.1,P*4));if(q0>hi)continue;
    for(v=0;v<NE;v++){q=q0+(hi-q0)*v/(NE-1);if(P)q=p+Math.round((q-p)/P)*P;q=Math.round(q);if(q>hi||q<q0-P)continue;
      r=sc(p,q);var bias=r[0]+0.02*(q-p)/span;if(bias>bs){bs=bias;bp=p;bq=q;br=r[1];}}}
  if(bs<-8)return null;
  var R=P?Math.max(3,Math.round(P*0.08)):Math.round(sr*0.004),q1=bq;st=1;bs=-9;
  for(q=bq-R;q<=bq+R;q++){if(q>hi+R||q+W2>=n)continue;r=sc(bp,q);if(r[0]>bs){bs=r[0];q1=q;br=r[1];}}
  if(br<0)br=0;
  var xf=Math.round(br>0.85?Math.min(sr*0.03,Math.max(sr*0.006,2*P)):br>0.5?sr*0.04:sr*0.1);
  xf=Math.max(8,Math.min(xf,bp-1,(q1-bp)>>1));
  return [bp,q1,xf,Math.round(br*1000)/1000];
}
function handleAudio(data,sr,target,name){
  if(target==='ECHO'){echoDone(data,sr,name);return;}
  if(target==='IDEA'){ideaDone(data,sr);return;}
  if(target==='IR'){makeIR(data,sr,name);return;}
  if(target==='BB'){beatboxToKit(data,sr);return;}
  if(target==='CAB'){makeCabIR(data,sr);return;}
  var tr=trim(capClean(Float32Array.from(data),sr),sr);
  if(!tr){toast('Signal too quiet or too short. Move closer to the mic and try again.');return;}
  normCap(tr,sr);
  var buf=ctx.createBuffer(1,tr.length,sr);buf.getChannelData(0).set(tr);buf._cap=1;
  if(target==='PAD'){var pd=pads[padSel];pd.buf=buf;pd.name=name.slice(0,14);pd.cls='other';renderPads();selectPad(padSel);toast('Loaded onto pad '+(padSel+1)+'.');return;}
  var f=detectPitch(tr,sr),cf=detectPitch.conf;
  setSlot(target,buf,name,f||261.63,!!f,cf);
  toast(f?'Got it! Your sound plays as '+nname(ftom(f))+' on the keys.'+(cf<0.6?' Not fully sure of the octave: use Oct − / Oct + if it sounds off.':''):'Got it! This sound has no clear note, so it plays like percussion (C4 = original pitch).',3200);
}
function setSlot(k,buf,name,root,det,conf){
  var s=slots[k];var keepSrc=s.spkSrc;delete s.zones;delete s.stock;delete s.spkSrc;delete s.conf;if(!setSlot.keep){delete s.vtSrc;delete s.vt;delete s.vtOut;}if(conf!=null)s.conf=conf;s.buf=buf;s.name=name;s.root=root;s.det=det;if(setSlot.keep)s.spkSrc=keepSrc;slotUI(k);updateMorph();
  if(typeof morphMode!=='undefined'&&morphMode!=='blend'&&slots.A.buf&&slots.B.buf)scheduleMorph();markDirty();
}
function drawWave(cv,d){
  var dpr=window.devicePixelRatio||1,w=cv.clientWidth||300,h=cv.clientHeight||60;
  cv.width=w*dpr;cv.height=h*dpr;var g=cv.getContext('2d');g.scale(dpr,dpr);g.clearRect(0,0,w,h);
  g.fillStyle='#D4FF3A';var step=d.length/w;
  for(var x=0;x<w;x++){var mn=1,mx=-1,a=Math.floor(x*step),b=Math.floor((x+1)*step);for(var i=a;i<b;i+=4){var v=d[i];if(v<mn)mn=v;if(v>mx)mx=v;}if(mx<mn){mn=mx=0;}g.fillRect(x,(1-mx)*h/2,1,Math.max(1,(mx-mn)*h/2));}
}
function makeIR(data,sr,name){
  var pk=0,pi=0,i;for(i=0;i<data.length;i++){var a=Math.abs(data[i]);if(a>pk){pk=a;pi=i;}}
  if(pk<0.02){toast('No transient detected. Clap louder, in a quiet room.');return;}
  var st=Math.max(0,pi-Math.floor(sr*0.002)),n=Math.min(Math.floor(sr*3),data.length-st);
  if(n<sr*0.1){toast('Reverb tail too short. Try again.');return;}
  var ir=ctx.createBuffer(2,n,sr),L=ir.getChannelData(0),R=ir.getChannelData(1),fs=Math.floor(n*0.8);
  var lpn=0;for(i=0;i<n;i++){var f=i>fs?(n-i)/(n-fs):1;L[i]=data[st+i]/pk*f;lpn+=0.002*((Math.random()*2-1)-lpn);R[i]=L[i]*(i<sr*0.01?1:1+4*lpn);}
  var blk=Math.floor(sr*0.01),rt=null;
  for(var b=1;b*blk<n;b++){var m=0;for(var j=b*blk;j<Math.min(n,(b+1)*blk);j++){var v=Math.abs(L[j]);if(v>m)m=v;}if(m<0.0316){rt=b*0.01*2;break;}}
  N.conv.buffer=ir;
  $('#irName').textContent=name;$('#irRt').textContent=rt?'RT60 ≈ '+dec(rt,1)+' s':'RT60 > 3 s';
  toast('Impulse response captured. Reverb updated.');
}

/* ---------- export ---------- */
var wavRec=null,lastTake=null,recTimer=null;
function tapConnect(on){if(!N.tap||!N.clip||N.tapOn===on)return;N.tapOn=on;try{if(on)N.clip.connect(N.tap);else N.clip.disconnect(N.tap);}catch(e){}}
function stopRec(){
  var w=wavRec;if(!w)return;wavRec=null;clearInterval(recTimer);tapConnect(false);
  var r=$('#rec');r.classList.remove('on');r.innerHTML='● Rec<small>output</small>';
  if(!w.n){toast('Empty take.');return;}
  var L=new Float32Array(w.n),R=new Float32Array(w.n),o=0;
  for(var i=0;i<w.L.length;i++){L.set(w.L[i],o);R.set(w.R[i],o);o+=w.L[i].length;}
  var bytes=encodeWav([L,R],ctx.sampleRate);
  if(w.onDone){w.onDone(bytes);return;}
  if(lastTake&&lastTake.url)URL.revokeObjectURL(lastTake.url);
  lastTake={bytes:bytes,name:w.name,url:URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}))};
  $('#takeAudio').src=lastTake.url;
  $('#takeLen').textContent=dec(w.n/ctx.sampleRate,1)+' s · 24-bit / '+Math.round(ctx.sampleRate/1000*10)/10+' kHz';
  $('#take').classList.add('show');pushOverlay('take');setTimeout(function(){$('#takeSave').focus();},50);
}
$('#rec').addEventListener('click',function(){
  if(!ensureAudio())return;
  if(seq.bounce||stemsRunning){toast('An export is rendering — wait for it to finish or press Stop to cancel.');return;}
  if(wavRec){stopRec();return;}
  wavRec={L:[],R:[],n:0,t0:performance.now()};tapConnect(true);
  var r=$('#rec');r.classList.add('on');
  recTimer=setInterval(function(){if(wavRec)r.textContent='■ '+dec((performance.now()-wavRec.t0)/1000,1)+' s';},200);
});
$('#takeClose').addEventListener('click',function(){closeOverlay('take');});
$('#takeSave').addEventListener('click',function(){if(lastTake)saveWav(lastTake.bytes,(lastTake.name||'ecou-take')+'-'+stamp());});

/* ---------- bucla de modulație ---------- */
var scope=$('#scope'),sg=scope.getContext('2d'),sbuf=null;
function drawScope(){
  var dpr=window.devicePixelRatio||1,w=scope.clientWidth,h=scope.clientHeight;
  if(scope.width!==Math.round(w*dpr)){scope.width=Math.round(w*dpr);scope.height=Math.round(h*dpr);}
  if(!sbuf)sbuf=new Uint8Array(N.an.fftSize);N.an.getByteTimeDomainData(sbuf);
  sg.setTransform(dpr,0,0,dpr,0,0);sg.clearRect(0,0,w,h);sg.strokeStyle='#D4FF3A';sg.lineWidth=1.5;sg.beginPath();
  for(var i=0;i<sbuf.length;i+=4){var x=i/sbuf.length*w,y=sbuf[i]/255*h;if(i)sg.lineTo(x,y);else sg.moveTo(x,y);}
  sg.stroke();
}
var meters=null,frame=0;
function loop(ts){
  requestAnimationFrame(loop);
  var t=ts/1000;src.lfo=Math.sin(2*Math.PI*P.lfo.v*t);
  if((frame++&1)===0)camAnalyze();
  var m=[0,0,0,0,0];
  for(var r=0;r<SRC.length;r++){var s=src[SRC[r][0]];if(!s)continue;for(var c=0;c<5;c++){if(MX[r][c])m[c]+=MX[r][c]/100*s;}}
  if(ctx){
    var now=ctx.currentTime;
    var st=tracks[selTrack];if(st&&st.n)st.n.f.frequency.setTargetAtTime(normToHz(clamp(P.cutoff.v+m[0]*0.5,0,1)),now,0.03);
    var ps=clamp(m[1]*12+bend*2,-24,24);
    if(Math.abs(ps-pitchSemi)>0.003){pitchSemi=ps;var upd=function(v){if(v.ti!==selTrack)return;v.srcs.forEach(function(b){b.playbackRate.setTargetAtTime(b._base*Math.pow(2,ps/12),now,0.02);});};voices.forEach(upd);svoices.forEach(upd);}
    N.master.gain.setTargetAtTime(clamp(P.vol.v*(1+m[2]),0,1.2),now,0.03);
    var wet=clamp(P.space.v+m[3]*0.5,0,1);
    N.wet.gain.setTargetAtTime(wetGain(wet),now,0.05);
    grainPos=clamp(P.gpos.v+m[4]*0.5,0,1);
    drawScope();if(spatialOn)spUpdate();
  }
  if($('#t-mod').classList.contains('active')){
    if(!meters)meters=$$('[data-m]');
    meters.forEach(function(el){var v=Math.abs(src[el.getAttribute('data-m')]);el.style.width=Math.round(clamp(v,0,1)*100)+'%';});
  }
  if(ctx)padUiTick();
  if(capture&&capBtn(capture.target)){var b=capBtn(capture.target);b.textContent='■ Stop · '+dec((performance.now()-capture.t0)/1000,1)+' s';}
}

/* ---------- PADS ---------- */
