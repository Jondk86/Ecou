var tracks=[],selTrack=1,songSel=1,svoices=[],loadingSound=false;
var IKEYS=['morph','attack','release','cutoff','reso','gpos','gsize','gdens','gspray','gjit','fenv','fdec','glide','mono'];
function defTrack(name,kind,o){var t={name:name,kind:kind,vol:0.8,pan:0,mute:false,solo:false,rev:0.2,dly:0,fx:true,sound:null,n:null};for(var k in (o||{}))t[k]=o[k];return t;}
function defaultTracks(){return [defTrack('Drums','drums',{rev:0.1,vol:0.9}),defTrack('Keys 1','keys',{rev:0.3,dly:0.15,vol:0.6}),defTrack('Keys 2','keys',{rev:0.45,vol:0.45}),defTrack('Bass','keys',{rev:0.03,vol:0.85,fx:false})];}
tracks=defaultTracks();
function liveSound(){var s={slots:{A:slots.A,B:slots.B},engine:engine,loop:loopOn,morphMode:morphMode,morphBuf:morphBuf,morphRoot:morphRoot,fmP:fmP?fmP.slice():null};IKEYS.forEach(function(k){s[k]=P[k].v;});return s;}
function saveSound(ti){var s=liveSound();s.slots={A:Object.assign({},slots.A),B:Object.assign({},slots.B)};tracks[ti].sound=s;}
function slotUI(k){var s=slots[k];$('#name-'+k).textContent=s.name;$('#note-'+k).textContent=s.det?nname(ftom(s.root))+' · '+Math.round(s.root)+' Hz'+(s.conf!=null&&s.conf<0.6?' · unsure, check octave':''):'unpitched · mapped to C4';var oc=$('#oct-'+k);if(oc)oc.hidden=!(s.det&&s.buf&&!s.stock&&!s.zones);$('#dur-'+k).textContent=s.buf?dec(s.buf.duration,1)+' s':'';if(s.buf)drawWave($('#wave-'+k),s.buf.getChannelData(0));}
function loadSound(ti){
  var S=tracks[ti].sound;if(!S)return;loadingSound=true;
  slots={A:Object.assign({},S.slots.A),B:Object.assign({},S.slots.B)};
  engine=S.engine;fmP=S.fmP?S.fmP.slice():null;loopOn=!!S.loop;morphMode=S.morphMode||'blend';morphBuf=S.morphBuf||null;morphRoot=S.morphRoot||slots.A.root;
  IKEYS.forEach(function(k){if(S[k]!=null)setParam(k,S[k]);});
  slotUI('A');slotUI('B');
  $$('[data-engine]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-engine')===engine?'true':'false');});
  $('#loop').checked=loopOn;
  $$('[data-mm]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-mm')===morphMode?'true':'false');});
  $('#morphState').textContent=morphMode==='blend'?'Crossfade: both sources play, mixed by level.':(morphBuf?'Rendered.':'');
  updateMorph();loadingSound=false;renderStockChips();renderFM();
}
function selectTrack(ti){
  if(tracks[ti].kind!=='keys'||ti===selTrack){renderTrackSegs();return;}
  if(ctx){allOff();saveSound(selTrack);var o=tracks[selTrack];if(o.n){o.n.f.frequency.setTargetAtTime(normToHz(o.sound.cutoff),ctx.currentTime,0.02);o.n.f.Q.value=o.sound.reso;}}
  selTrack=ti;if(ctx)loadSound(ti);renderTrackSegs();
}
function buildTrackNode(t,i){
  var n={};n.trim=G(t.kind==='keys'?0.55:1);n.in=n.trim;
  var S=t.sound;n.f=BQ('lowpass',t.kind==='keys'&&S?normToHz(S.cutoff):20000,0.707);if(t.kind==='keys'&&S)n.f.Q.value=S.reso;
  n.af=BQ('lowpass',20000,0.707);n.av=G(1);n.ap=PAN(0);n.ar=G(1);n.ad=G(1);
  n.eqL=BQ('lowshelf',120,0.7);n.eqM=BQ('peaking',1000,0.8);n.eqH=BQ('highshelf',8000,0.7);n.cmp=ctx.createDynamicsCompressor();n.cmk=G(1);n.duck=G(1);
  var mv=mixVals(t);n.vol=G(mv.vol);n.pan=PAN(mv.pan);n.sr=G(mv.rev);n.sd=G(mv.dly);n.post=G(1);
  n.sp=ctx.createPanner();n.sp.panningModel='HRTF';n.sp.distanceModel='inverse';n.sp.refDistance=1;n.sp.maxDistance=50;n.sp.rolloffFactor=0.6;
  rigBuild(n,t.rig);n.trim.connect(n.f);n.f.connect(n.rigIn);n.rigOut.connect(n.af);n.af.connect(n.eqL);n.eqL.connect(n.eqM);n.eqM.connect(n.eqH);n.eqH.connect(n.cmp);n.cmp.connect(n.cmk);n.cmk.connect(n.duck);n.insIn=G(1);n.keyT=G(1);n.preM=G(mxOn(t,tracks.some(function(x){return x.solo;}))?1:0);n.insN=[];n.duck.connect(n.insIn);n.duck.connect(n.keyT);n.insIn.connect(n.av);n.am=G(1);n.av.connect(n.am);n.am.connect(n.preM);n.am.connect(n.vol);n.vol.connect(spatialOn?n.sp:n.pan);buildWidth(n);n.pan.connect(n.wIn);n.wOut.connect(n.ap);n.ap.connect(n.post);if(spatialOn)n.sp.connect(n.post);
  n.sr.connect(n.ar);n.ar.connect(N.revIn);n.sd.connect(n.ad);n.ad.connect(N.dlyIn);mxSendRoute(t,n);
  n.out=n.post;n.dest=null;t.n=n;trackRoute(i);applyStrip(t);if(!mxBulk)insBuild(t,i);if(!offlineRender&&N.mL){n.an=ctx.createAnalyser();n.an.fftSize=256;n.out.connect(n.an);n.anB=new Float32Array(256);}
}
/* stereo width: M/S matrix, 0 = mono, 1 = as is, 2 = wide; above 1 a short decorrelated side adds width to mono sources */
function buildWidth(n){n.wIn=G(1);n.wIn.channelCount=2;n.wIn.channelCountMode='explicit';n.wSp=ctx.createChannelSplitter(2);n.wMg=ctx.createChannelMerger(2);n.wOut=G(1);
  n.wLL=G(1);n.wRL=G(0);n.wLR=G(0);n.wRR=G(1);n.wIn.connect(n.wSp);n.wSp.connect(n.wLL,0);n.wSp.connect(n.wLR,0);n.wSp.connect(n.wRL,1);n.wSp.connect(n.wRR,1);
  n.wLL.connect(n.wMg,0,0);n.wRL.connect(n.wMg,0,0);n.wLR.connect(n.wMg,0,1);n.wRR.connect(n.wMg,0,1);n.wMg.connect(n.wOut);
  n.wHd=ctx.createDelay(0.05);n.wHd.delayTime.value=0.013;n.wHp=BQ('highpass',350,0.7);n.wHg=G(0);n.wHn=G(0);n.wIn.connect(n.wHd);n.wHd.connect(n.wHp);n.wHp.connect(n.wHg);n.wHp.connect(n.wHn);
  var mL=ctx.createChannelMerger(2),mR=ctx.createChannelMerger(2);n.wHg.connect(mL,0,0);n.wHn.connect(mR,0,1);mL.connect(n.wOut);mR.connect(n.wOut);}
function applyWidth(t,set){var n=t.n;if(!n||!n.wLL)return;var w=t.width==null?1:t.width,a=Math.min(w,1.4),d=(1+a)/2,x=(1-a)/2,h=Math.max(0,w-1)*0.32;
  set(n.wLL.gain,d);set(n.wRR.gain,d);set(n.wRL.gain,x);set(n.wLR.gain,x);set(n.wHg.gain,h);set(n.wHn.gain,-h);}
function buildTracks(){mxBulk=true;try{tracks.forEach(function(t,i){buildTrackNode(t,i);});}finally{mxBulk=false;}insRebuildAll();applyMix();spUpdate(true);}
function trackRoute(i){var t=tracks[i],n=t.n;if(!n)return;if(n.dest){try{n.out.disconnect(n.dest);}catch(e){}}n.dest=t.fx?N.chainIn:N.post;n.out.connect(n.dest);}
function mixVals(t){var any=tracks.some(function(x){return x.solo;}),on=any?t.solo:!t.mute;if(hasAuto(t,'vol')){if(t.volRef==null)t.volRef=t.vol||1;}else t.volRef=null;var A=function(k){return hasAuto(t,k)&&!aIsOvr(t,k);};return {vol:on?(A('vol')?t.vol/(t.volRef||1):t.vol):0,pan:A('pan')?0:t.pan,rev:A('rev')?1:t.rev,dly:A('dly')?1:t.dly};}
function applyMix(){
  if(!ctx)return;var any=tracks.some(function(t){return t.solo;}),now=ctx.currentTime;
  tracks.forEach(function(t){if(!t.n)return;var mv=mixVals(t);t.n.vol.gain.setTargetAtTime(mv.vol,now,0.02);if(t.n.pan.pan)t.n.pan.pan.setTargetAtTime(mv.pan,now,0.02);t.n.sr.gain.setTargetAtTime(mv.rev,now,0.02);if(!t._thr)t.n.sd.gain.setTargetAtTime(mv.dly,now,0.02);if(t.n.preM)t.n.preM.gain.setTargetAtTime(mxOn(t,any)?1:0,now,0.02);});
}
/* voices */
function soundOf(ti){return ti===selTrack?liveSound():tracks[ti].sound;}
function lgain(k,m){return k==='A'?Math.cos(m*Math.PI/2):Math.sin(m*Math.PI/2);}
function layerGain(k){return lgain(k,P.morph.v);}
function updateMorph(){
  $('#mA').textContent=slots.A.name;$('#mB').textContent=slots.B.name;
  if(!ctx)return;var now=ctx.currentTime;
  voices.forEach(function(v){v.layers.forEach(function(L){if(L.k!=='M')L.g.gain.setTargetAtTime(layerGain(L.k),now,0.02);});});
}
var renderOnly=null;
function makeVoice(ti,midi,vel,t,from){
  if(roSkip(ti))return null;var S=soundOf(ti),tr=tracks[ti];if(!S||!tr.n)return null;
  if(S.engine==='fm'||fm1Out(ti))return fmMakeVoice(ti,midi,vel,t);
  /* captured sounds: velocity also shapes tone (low-pass, 1.5 oct), attack and a vel^1.6 gain curve; stock sounds unchanged */
  var cs=S.engine==='sampler'&&!(S.morphMode&&S.morphMode!=='blend'&&S.morphBuf)&&['A','B'].some(function(k){var q=S.slots[k];return q&&q.buf&&q.buf._cap&&!q.zones;}),vk=cs?Math.pow(2,-1.5*(1-clamp(vel,0,1))):1,zid=0;
  var a=Math.max(0.003,cs?S.attack*(1-0.35*clamp(vel,0,1)):S.attack),gv=cs?Math.pow(clamp(vel,0,1),1.6):vel,env=ctx.createGain();env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(gv,t+a);env.connect(tr.n.in);
  var v={ti:ti,S:S,midi:midi,freq:mtof(midi),env:env,vel:vel,gv:gv,a:a,layers:[],srcs:[],next:t,t0:t,t1:1e9},into=env;
  if(S.fenv>0.001){var fb=Math.max(30,normToHz(S.cutoff)*vk),fs=Math.min(18000,fb*(1+S.fenv*24)),vf=BQ('lowpass',fs,0.9);vf.frequency.setValueAtTime(fs,t);vf.frequency.setTargetAtTime(fb,t,Math.max(0.01,(S.fdec||0.3)/3));vf.connect(env);into=vf;}
  else if(cs&&vk<0.97){var vl=BQ('lowpass',Math.max(200,16000*vk),0.707);vl.connect(env);into=vl;}
  if(S.morphMode&&S.morphMode!=='blend'&&S.morphBuf){var gm=G(1);gm.connect(into);v.layers.push({k:'M',g:gm,slot:{buf:S.morphBuf,root:S.morphRoot}});}
  else ['A','B'].forEach(function(k){var s=S.slots[k];if(!s||!s.buf)return;var lgv=lgain(k,S.morph);if(lgv<0.002&&(offlineRender||ti!==selTrack))return;var g=G(lgv);g.connect(into);v.layers.push({k:k,g:g,slot:s});});
  if(S.engine==='sampler'){
    var ps=ti===selTrack?pitchSemi:0;
    v.layers.forEach(function(L){
      var Z=zoneFor(L.slot,v.freq,v.vel),b=ctx.createBufferSource(),lb=S.loop?loopBuf(Z.buf,Z.det?Z.root:0):null;b.buffer=lb?lb.buf:Z.buf;b._base=v.freq/Z.root;var pb=Math.pow(2,ps/12);b.playbackRate.value=b._base*pb;
      if(from&&S.glide>0.002){b.playbackRate.setValueAtTime(b._base*pb*from/v.freq,t);b.playbackRate.setTargetAtTime(b._base*pb,t,S.glide/3);}
      if(lb){b.loop=true;b.loopStart=lb.ls;b.loopEnd=lb.le;}
      var dst=L.g;if(b._base>1.06){var aa=BQ('lowpass',Math.min(20000,0.45*Z.buf.sampleRate/b._base),0.707);aa.connect(L.g);dst=aa;}
      b.connect(dst);b.start(t);v.srcs.push(b);
    });
  }
  return v;
}
var loopCache=new WeakMap();
/* loop region 30–75 % of the sample, with an equal-power crossfade baked in so the jump back is seamless */
/* stock zones with precomputed points (buf._lp, from SMPM.l) use them; captured sounds (buf._cap): decaying → null (one-shot, natural tail); sustained → pitch-synchronous seam from findLoop */
function loopBuf(src,root){var c=loopCache.get(src);if(c!==undefined)return c;
  var lp=null,sr0=src.sampleRate;
  if(src._lp){var q=src._lp;lp=[Math.round(q[0]*sr0),Math.round(q[1]*sr0),Math.max(8,Math.round(q[2]*sr0)),q[3]?1:0];if(!(lp[1]<=src.length&&lp[0]-lp[2]>=0&&lp[1]-lp[2]>lp[0]))lp=null;}
  else if(src._cap){var P=root>20?sr0/root:0;lp=findLoop(src.getChannelData(0),sr0,P);if(!lp){loopCache.set(src,null);return null;}}
  if(lp){
    var L0=lp[0],L1=lp[1],X=lp[2],lin=lp[3]>0.85,cb=ctx.createBuffer(src.numberOfChannels,L1,sr0);
    for(var ch0=0;ch0<src.numberOfChannels;ch0++){var q0=src.getChannelData(ch0),q1=cb.getChannelData(ch0);q1.set(q0.subarray(0,L1));
      for(var j0=0;j0<X;j0++){var w0=(j0+0.5)/X,ga=lin?1-w0:Math.cos(w0*Math.PI/2),gb0=lin?w0:Math.sin(w0*Math.PI/2);q1[L1-X+j0]=q0[L1-X+j0]*ga+q0[L0-X+j0]*gb0;}}
    c={buf:cb,ls:L0/sr0,le:L1/sr0};loopCache.set(src,c);return c;}
  var sr=src.sampleRate,ls=Math.floor(src.length*0.3),le=Math.floor(src.length*0.75),xf=Math.min(Math.floor(sr*0.12),ls,Math.floor((le-ls)/2));
  var b=ctx.createBuffer(src.numberOfChannels,le,sr);
  for(var ch=0;ch<src.numberOfChannels;ch++){var s0=src.getChannelData(ch),d=b.getChannelData(ch);d.set(s0.subarray(0,le));
    for(var i=0;i<xf;i++){var w=(i+0.5)/xf,a=Math.cos(w*Math.PI/2),bb=Math.sin(w*Math.PI/2);d[le-xf+i]=s0[le-xf+i]*a+s0[ls-xf+i]*bb;}}
  c={buf:b,ls:ls/sr,le:le/sr};loopCache.set(src,c);return c;}
function releaseVoice(v,t){
  if(v.fm){fmRelease(v,t);return;}
  var r=Math.max(0.02,v.S.release),g=v.env.gain;v.t1=t;
  var gv=v.gv!=null?v.gv:v.vel,cur=t>=v.t0+v.a?gv:gv*Math.max(0,(t-v.t0)/v.a);
  g.cancelScheduledValues(t);g.setValueAtTime(cur,t);g.linearRampToValueAtTime(0,t+r);
  v.srcs.forEach(function(s){try{s.stop(t+r+0.05);}catch(e){}});
  if(offlineRender){offNodes.push({e:t+r+0.1,n:v.env});return;}
  setTimeout(function(){try{v.env.disconnect();}catch(e){}},Math.max(0,(t-ctx.currentTime+r+0.5))*1000);
}
var offNodes=[];
function noteOn(key,midi,vel){
  if(!ensureAudio())return;
  if(voices.has(key))noteOff(key);
  if(voices.size>=12)noteOff(voices.keys().next().value);
  var S0=soundOf(selTrack),from=null;if(S0&&S0.mono>=0.5){var pv=null;Array.from(voices.keys()).forEach(function(k){var o=voices.get(k);if(o&&o.ti===selTrack){pv=o;noteOff(k);}});if(pv)from=pv.freq;}
  var v=makeVoice(selTrack,midi,vel,ctx.currentTime,from);if(!v)return;
  voices.set(key,v);markKey(midi,true);recNoteOn(key,midi,vel);
}
function noteOff(key){
  var v=voices.get(key);if(!v)return;voices.delete(key);releaseVoice(v,ctx.currentTime);recNoteOff(key);
  var still=false;voices.forEach(function(o){if(o.midi===v.midi)still=true;});if(!still)markKey(v.midi,false);
}
function playNote(ti,midi,vel,t,dur){var S=soundOf(ti),from=null;if(S&&S.mono>=0.5){var pv=monoLast[ti];if(pv&&pv.t0<t&&pv.t1>=t-0.02){from=pv.freq;if(pv.t1>t)releaseVoice(pv,t);}}var v=makeVoice(ti,midi,vel,t,from);if(!v)return;svoices.push(v);releaseVoice(v,t+dur);if(S&&S.mono>=0.5)monoLast[ti]=v;}
function allOff(){Array.from(voices.keys()).forEach(noteOff);}
function grainTick(){
  if(!ctx)return;var now=ctx.currentTime,all=[];
  voices.forEach(function(v){all.push(v);});
  svoices=svoices.filter(function(v){return v.t1+4>now;});
  all=all.concat(svoices);
  all.forEach(function(v){
    if(v.S.engine!=='granular')return;
    if(v.next<now)v.next=now;if(v.next<v.t0)v.next=v.t0;
    var guard=0;
    while(v.next<now+0.12&&v.next<v.t1+v.S.release*0.9&&guard++<40){spawnGrains(v,v.next);v.next+=(1/v.S.gdens)*(0.75+0.5*Math.random());}
  });
}
function spawnGrains(v,t){
  var S=v.S,size=S.gsize,gp=v.ti===selTrack?grainPos:S.gpos,ps=v.ti===selTrack?pitchSemi:0;
  v.layers.forEach(function(L){
    var buf=L.slot.buf,dur=buf.duration;
    var jit=(Math.random()*2-1)*S.gjit;
    var rate=(v.freq/L.slot.root)*Math.pow(2,(ps*100+jit)/1200);
    var off=clamp(gp*dur+(Math.random()*2-1)*S.gspray*dur*0.25,0,Math.max(0,dur-0.02));
    var b=ctx.createBufferSource();b.buffer=buf;b.playbackRate.value=rate;
    var g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.55,t+size*0.5);g.gain.linearRampToValueAtTime(0,t+size);
    b.connect(g);g.connect(L.g);b.start(t,off);b.stop(t+size+0.02);
    if(offlineRender)offNodes.push({e:t+size+0.05,n:g});b.onended=function(){try{g.disconnect();}catch(e){}};
  });
}
/* demo sounds for all tracks */
function demoSounds(){
  var TP=2*Math.PI,glass={name:slots.A.name,buf:slots.A.buf,root:slots.A.root,det:true},choir={name:slots.B.name,buf:slots.B.buf,root:slots.B.root,det:true};
  var bass=synthBuf(1.6,function(t){var s=0,br=Math.exp(-t*3);for(var h=1;h<=24;h++){s+=Math.sin(TP*65.41*h*t)/h*Math.pow(br,h*0.25);}return s*Math.min(1,t*400)*Math.exp(-t*0.8);});
  function snd(A,B,o){var s={slots:{A:Object.assign({},A),B:Object.assign({},B)},engine:'sampler',loop:false,morphMode:'blend',morphBuf:null,morphRoot:A.root};IKEYS.forEach(function(k){s[k]=P[k].v;});for(var k in o)s[k]=o[k];return s;}
  tracks[1].sound=snd(glass,choir,{morph:0,attack:0.003,release:0.9,cutoff:0.85});
  tracks[2].sound=snd(choir,glass,{morph:0.15,attack:0.35,release:2.4,cutoff:0.7,loop:true});
  tracks[3].sound=snd({name:'Saw Bass',buf:bass,root:65.41,det:true},choir,{morph:0,attack:0.003,release:0.2,cutoff:0.55,reso:2});
  var rh=stockSlot('rhodes'),db=stockSlot('dub');if(rh){tracks[1].sound.slots.A=rh;Object.assign(tracks[1].sound,STOCK.rhodes.p);tracks[1].sound.morph=0;tracks[1].sound.loop=false;}
  if(db){tracks[3].sound.slots.A=db;Object.assign(tracks[3].sound,STOCK.dub.p);tracks[3].sound.morph=0;tracks[3].sound.loop=true;}
}
/* ---------- PATTERNS / TRANSPORT ---------- */
var patterns=[],curPat=0,song=[0],page=0,PATN='ABCDEFGH';
function noteArr(pt,ti){while(pt.notes.length<=ti)pt.notes.push([]);return pt.notes[ti];}
function KEYSI(){var o=[];tracks.forEach(function(t,i){if(t.kind==='keys')o.push(i);});return o;}
function newPattern(i,len){len=len||16;var d=[];for(var p=0;p<16;p++)d.push(new Array(64).fill(false));return {name:PATN[i],len:len,drums:d,notes:[[],[],[],[]]};}
function initPatterns(){patterns=[];for(var i=0;i<8;i++)patterns.push(newPattern(i,16));curPat=0;song=[0];page=0;bindPads();}
function bindPads(){var pt=patterns[curPat];pads.forEach(function(p,i){p.pat=pt.drums[i];});}
function patHas(pt){return pt.drums.some(function(a){return a.some(Boolean);})||pt.notes.some(function(n){return n.length;});}
function demoNotes(){
  var pt=patterns[0];
  pt.notes[3]=[{s:0,l:3,m:36,v:0.9},{s:6,l:2,m:36,v:0.8},{s:8,l:3,m:39,v:0.85},{s:12,l:3,m:43,v:0.85}];
  pt.notes[1]=[{s:0,l:2,m:72,v:0.7},{s:0,l:2,m:75,v:0.6},{s:0,l:2,m:79,v:0.6},{s:10,l:2,m:68,v:0.65},{s:10,l:2,m:72,v:0.55},{s:10,l:2,m:75,v:0.55}];
  pt.notes[2]=[{s:0,l:16,m:60,v:0.5},{s:0,l:16,m:67,v:0.45}];
}
var seq={src:'pattern',on:false,mode:'pattern',step:0,next:0,timer:null,songPos:0,pat:0,audPat:0,audStart:0,rec:false,quant:true,metro:false,bounce:false};
function stepDur(){return 60/P.bpm.v/4;}
function transportStart(mode){if(typeof bandRunning==='function'&&bandRunning())bandStop();
  if(!ensureAudio())return;if(seq.on)transportStop();
  if(mode)seq.mode=mode;seq.on=true;seq.songPos=0;
  if(seq.mode==='arrange'){arrBegin();seq.timer=setInterval(seqTick,25);seqTick();updTransportUI();return;}
  if(seq.mode==='song'&&!song.length)song=[curPat];
  seq.pat=seq.mode==='song'?song[0]:curPat;seq.step=0;seq.next=ctx.currentTime+0.08;seq.audStart=seq.next;seq.audPat=seq.pat;
  if(seq.mode==='song'&&seq.pat!==curPat)setPattern(seq.pat);
  seq.timer=setInterval(seqTick,25);seqTick();updTransportUI();
}
function transportStop(){
  if(seq.bounce){var w=wavRec;seq.bounce=false;wavRec=null;$('#bounceBtn').textContent='Export song (WAV)';toast('Export cancelled.');if(w&&w.onCancel)w.onCancel();}
  if(seq.mode==='arrange'&&ctx&&(seq.on||arr.rec))arrStopCleanup();
  if(seq.mode==='loops'&&seq.on)llStopped();
  seq.on=false;arr.jam=false;clearInterval(seq.timer);seq.timer=null;stepQ=[];curStep=-1;try{fmKillAll();}catch(e){}
  if(ctx){var now=ctx.currentTime;svoices.forEach(function(v){if(v.t0>now){v.srcs.forEach(function(s){try{s.stop(0);}catch(e){}});try{v.env.disconnect();}catch(e){}}else if(v.t1>now)releaseVoice(v,now);});svoices=[];
    padVoices.forEach(function(v){try{v.src.stop(now+0.02);}catch(e){}});}
  recFlush();updTransportUI();paintSteps();drawRoll();
}
function prevPlaying(){try{return !!((typeof VT!=='undefined')&&(VT.au||VT.tp));}catch(e){return false;}}
function prevStopAll(){try{VT.want=false;if(VT.au){vtStopAu();vtUI();vtNowUI(-1);if(typeof vmUI==='function')vmUI();}if(VT.tp)vtStopTP();}catch(e){}}
function transportToggle(mode){if(!mode&&prevPlaying()&&!seq.on&&!bandRunning()){prevStopAll();return;}if(prevPlaying())prevStopAll();if(!mode&&$('#t-gar').classList.contains('active')){garPlay();return;}if(seq.on){transportStop();return;}if(!mode){var st=document.getElementById('t-daw');if(st&&st.classList.contains('active'))mode='arrange';else if(seq.src==='arrange')mode='arrange';else if(seq.mode==='arrange')mode='pattern';}transportStart(mode);}
function seqTick(){
  if(seq.mode==='arrange'){arrTick();return;}
  if(seq.mode==='loops'){llTick();return;}
  var now=ctx.currentTime,look=0.12;
  while(seq.on&&seq.next<now+look){
    var pt=patterns[seq.pat],s=seq.step,t=seq.next,sd=stepDur();
    drumStep(pt,s,t,sd);
    for(var ti=1;ti<tracks.length;ti++){if(tracks[ti].kind!=='keys')continue;var ns=pt.notes[ti]||[];for(var j=0;j<ns.length;j++){var n=ns[j];if(n.s>=s&&n.s<s+1)playNote(ti,n.m,n.v,t+(n.s-s)*sd,Math.max(0.05,n.l*sd));}}
    if(seq.metro&&s%4===0)click(t,s===0);
    stepQ.push({s:s,t:t,pat:seq.pat});
    var sw=P.swing.v*sd*0.5;seq.next+=sd+(s%2===0?sw:-sw);seq.step++;
    if(seq.mode==='pattern'&&curPat!==seq.pat&&seq.step%16===0&&patterns[curPat]){seq.pat=curPat;seq.step=0;continue;}
    if(seq.step>=pt.len){
      seq.step=0;
      if(seq.mode==='song'){
        seq.songPos++;
        if(seq.songPos>=song.length){
          if(seq.bounce){seq.on=false;clearInterval(seq.timer);setTimeout(bounceDone,(seq.next-now+2.5)*1000);return;}
          seq.songPos=0;
        }
        seq.pat=song[seq.songPos];
      }
    }
  }
}
function click(t,acc){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=acc?1600:1100;g.gain.setValueAtTime(acc?0.35:0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.04);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+0.05);}
function padUiTick(){
  var now=ctx.currentTime;
  var padEls=flashQ.length&&flashQ[0].t<=now+0.01?$$('#pads .pad'):null;while(flashQ.length&&flashQ[0].t<=now+0.01){var f=flashQ.shift(),el=padEls[f.i];if(el){el.classList.add('hit');(function(e){setTimeout(function(){e.classList.remove('hit');},90);})(el);}}
  var moved=false;
  while(stepQ.length&&stepQ[0].t<=now+0.01){var q=stepQ.shift();curStep=q.s;if(q.s===0){var chg=seq.audPat!==q.pat;seq.audStart=q.t;seq.audPat=q.pat;if(chg)renderPatSegs();}moved=true;}
  if(moved){
    if(seq.on&&seq.mode==='song'&&seq.audPat!==curPat)setPattern(seq.audPat);
    if($('#t-pad').classList.contains('active'))paintStepCursor();
    if($('#t-song').classList.contains('active'))drawRoll();
  }
}
/* recording */
var recPend=new Map();
function recLatency(){return (ctx.outputLatency||0)+(ctx.baseLatency||0)+TRACKLAT;}
function recPosArr(){return arrPosNow()-(ctx.baseLatency||0);}
function recPos(){var pt=patterns[seq.audPat],pos=(ctx.currentTime-recLatency()-seq.audStart)/stepDur();return ((pos%pt.len)+pt.len)%pt.len;}
function recNoteOn(key,midi,vel){if(!seq.on||!seq.rec)return;if(seq.mode==='loops'){var tl=llRecAt(selTrack,llPosNow());if(tl)recPend.set(key,{m:midi,v:vel,s:tl.s,t0:ctx.currentTime,pat:tl.p,ti:selTrack});return;}if(seq.mode==='arrange'){var tg=jamTarget(selTrack,recPosArr());if(tg)recPend.set(key,{m:midi,v:vel,s:tg.s,t0:ctx.currentTime,pat:tg.p,ti:selTrack});return;}recPend.set(key,{m:midi,v:vel,s:recPos(),t0:ctx.currentTime,pat:seq.audPat,ti:selTrack});}
function recNoteOff(key){
  var r=recPend.get(key);if(!r)return;recPend.delete(key);
  var pt=patterns[r.pat],l=(ctx.currentTime-r.t0)/stepDur(),s=r.s;
  if(seq.quant){s=Math.round(s)%pt.len;l=Math.max(1,Math.round(l));}else l=Math.max(0.25,l);
  noteArr(pt,r.ti).push({s:Math.round(s*100)/100,l:Math.round(l*100)/100,m:r.m,v:Math.round(r.v*100)/100});markDirty();drawRoll();renderPatSegs();
}
function recFlush(){Array.from(recPend.keys()).forEach(recNoteOff);}
function recPad(i,vel,semi){if(!seq.on||!seq.rec)return;if(seq.mode==='loops'){llRecPad(i,vel==null?0.8:vel);return;}if(seq.mode==='arrange'){var tg=jamTarget(0,recPosArr());if(!tg)return;var pj=patterns[tg.p],sj=Math.round(tg.s)%pj.len;pj.drums[i][sj]=vel?Math.round(clamp(vel,0.05,1)*100)/100:true;if(semi){pj.locks=pj.locks||{};pj.locks[i+':'+sj]={p:semi,l:1,r:1};}markDirty();if(tg.p===curPat){paintSteps();renderPadDots();}return;}var pt=patterns[seq.audPat],s=Math.round(recPos())%pt.len;pt.drums[i][s]=vel?Math.round(clamp(vel,0.05,1)*100)/100:true;if(semi){pt.locks=pt.locks||{};pt.locks[i+':'+s]={p:semi,l:1,r:1};}markDirty();if(seq.audPat===curPat){paintSteps();renderPadDots();}}
/* pattern UI */
function setPattern(i){curPat=i;var pt=patterns[i];page=Math.min(page,pt.len/16-1);bindPads();renderPatSegs();renderPads();if(pads[padSel])selectPad(padSel);paintSteps();drawRoll();}
function renderPatSegs(){
  var qd=seq.on&&seq.mode==='pattern'&&seq.audPat!==curPat;
  $$('.patSeg').forEach(function(w){w.innerHTML=patterns.map(function(pt,i){var cl=(patHas(pt)?'has ':'')+(qd&&i===curPat?'queued ':'')+(seq.on&&seq.mode==='pattern'&&i===seq.audPat?'playing':'');return '<button data-pat="'+i+'" aria-pressed="'+(i===curPat)+'"'+(cl?' class="'+cl.trim()+'"':'')+(qd&&i===curPat?' title="starts at the next bar"':'')+'>'+pt.name+'</button>';}).join('');});
  $$('[data-pat]').forEach(function(b){b.addEventListener('click',function(){setPattern(+b.getAttribute('data-pat'));});});
  var pt=patterns[curPat];
  $$('[data-len]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-len')===pt.len?'true':'false');});
  $$('.pageSeg').forEach(function(w){var n=pt.len/16;w.hidden=n<2;var h='';for(var p=0;p<n;p++)h+='<button data-page="'+p+'" aria-pressed="'+(p===page)+'">Bar '+(p+1)+'</button>';w.innerHTML=h;});
  $$('[data-page]').forEach(function(b){b.addEventListener('click',function(){page=+b.getAttribute('data-page');renderPatSegs();paintSteps();drawRoll();});});
  $('#patInfo').textContent='Pattern '+pt.name+' · '+(pt.len/16)+' bar'+(pt.len>16?'s':'');
  renderSongUI();
}
function setPatLen(len){var pt=patterns[curPat];pt.len=len;pt.drums.forEach(function(a){while(a.length<64)a.push(false);});page=Math.min(page,len/16-1);bindPads();markDirty();renderPatSegs();paintSteps();drawRoll();renderPadDots();}
function copyPattern(){
  var src=patterns[curPat],j=-1;for(var q=1;q<8;q++){var i=(curPat+q)%8;if(!patHas(patterns[i])){j=i;break;}}if(j<0){toast('No empty pattern left — clear one first.');return;}
  var d=patterns[j];d.len=src.len;d.drums=src.drums.map(function(a){return a.slice();});d.notes=src.notes.map(function(n){return n.map(function(x){return Object.assign({},x);});});
  markDirty();setPattern(j);toast('Pattern '+src.name+' duplicated to '+d.name+'.');
}
function clearPattern(){var pt=patterns[curPat];pt.drums.forEach(function(a){a.fill(false);});pt.notes=[[],[],[],[]];markDirty();renderPatSegs();renderPads();selectPad(padSel);drawRoll();}
/* song arrangement */
function renderSongUI(){
  var w=$('#songList');if(!w)return;
  w.innerHTML=song.map(function(pi,k){return '<button data-song="'+k+'" aria-label="Remove '+patterns[pi].name+' at position '+(k+1)+'">'+patterns[pi].name+' <span aria-hidden="true">×</span></button>';}).join('')||'<span class="mu">Empty — add patterns below.</span>';
  $$('[data-song]').forEach(function(b){b.addEventListener('click',function(){if(b.getAttribute('data-armed')){song.splice(+b.getAttribute('data-song'),1);markDirty();renderSongUI();return;}$$('[data-song]').forEach(function(x){x.removeAttribute('data-armed');x.style.background='';});b.setAttribute('data-armed','1');b.style.background='var(--or)';b.style.color='var(--bg)';setTimeout(function(){if(b.isConnected){b.removeAttribute('data-armed');b.style.background='';b.style.color='';}},2500);});});
  var steps=song.reduce(function(a,pi){return a+patterns[pi].len;},0),sec=steps*stepDur();
  $('#songInfo').textContent=(steps/16)+' bar'+(steps/16===1?'':'s')+' · '+Math.floor(sec/60)+':'+String(Math.round(sec%60)).padStart(2,'0');
  $('#songAdd').textContent='+ Add pattern '+patterns[curPat].name;
}
/* track selector */
function renderTrackSegs(){
  $$('.trackSeg').forEach(function(w){var all=w.hasAttribute('data-all');
    w.innerHTML=tracks.map(function(t,i){if(t.kind==='audio'||(!all&&t.kind!=='keys'))return '';var on=all?i===songSel:i===selTrack;return '<button data-trk="'+i+'" aria-pressed="'+on+'">'+t.name+'</button>';}).join('');});
  $$('[data-trk]').forEach(function(b){b.addEventListener('click',function(){var i=+b.getAttribute('data-trk');if(b.parentNode.hasAttribute('data-all'))songSel=i;if(tracks[i].kind==='keys'){songSel=i;selectTrack(i);fitRoll();}renderTrackSegs();drawRoll();});});
  var ed=$('#editing');if(ed)ed.textContent='Editing track: '+tracks[selTrack].name;var kt=$('#kbTrack');if(kt)kt.textContent=tracks[selTrack].name;
  var isDr=tracks[songSel].kind==='drums';$('#rollWrap').hidden=isDr;$('#drumNote').hidden=!isDr;
}
/* piano roll */
var roll={base:48,nl:2,rows:20};
function fitRoll(){var ns=[];patterns.forEach(function(pt){ns=ns.concat(pt.notes[songSel]||[]);});if(ns.length){var lo=Math.min.apply(null,ns.map(function(n){return n.m;}));roll.base=clamp(Math.floor(lo/12)*12,12,96);}else roll.base=tracks[songSel].name==='Bass'?36:48;}
/* transport UI */
function updTransportUI(){
  var on=seq.on;$('#hPlay').textContent=on?'■':'▶';$('#hPlay').setAttribute('aria-label',on?'Stop':'Play');
  $('#trPlay').textContent=on?'■ Stop':'▶ Play';$('#seqPlay').textContent=on?'■ Stop':'▶ Play';
  updJam();try{lbRender();}catch(e){}
  $('#trRec').classList.toggle('live',seq.rec);$('#trRec').textContent=seq.rec?'● Recording notes':'● Record notes';
  $$('[data-mode]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-mode')===seq.mode?'true':'false');});
  $('#trInfo').textContent=Math.round(P.bpm.v)+' BPM'+(seq.on?' · playing '+(seq.mode==='song'?'song':'pattern '+patterns[curPat].name):'');
  if(!seq.bounce)$('#bounceBtn').textContent='Export song (WAV)';
  updDawTr();try{garUpd();}catch(e){}
}
/* bounce */
function bounceSong(onDone,onCancel){
  if(seq.bounce){toast('An export is already running — press Stop to cancel it.');return;}
  if(!ensureAudio())return;if(!song.length){toast('Add patterns to the arrangement first.');return;}
  if(wavRec)stopRec();transportStop();seq.bounce=true;
  wavRec={L:[],R:[],n:0,t0:performance.now(),name:'ecou-'+safeName(project.name)+(spatialOn?'-binaural':''),onDone:typeof onDone==='function'?onDone:null,onCancel:typeof onCancel==='function'?onCancel:null,bounce:true};$('#bounceBtn').textContent='Rendering in real time…';
  transportStart('song');
}
function bounceDone(){if(!seq.bounce)return;seq.bounce=false;seq.on=false;updTransportUI();stopRec();}
function safeName(s){return (s||'project').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'project';}
/* mixer UI */
function stripHtml(t,i){var v=stripVals(t);function sl(k,lbl,mn,mx,st,val,fmt){return '<label class="ctl"><span class="row"><span>'+lbl+'</span><output data-so="'+i+k+'">'+fmt(val)+'</output></span><input type="range" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+val+'" data-sk="'+k+'" data-t="'+i+'" aria-label="'+t.name+' '+lbl+'"></label>';}
  var dbf=function(x){return (x>0?'+':'')+dec(+x,1)+' dB';},on=v.eq.l||v.eq.m||v.eq.h||v.comp||v.duck||v.width!==1;
  return '<details class="strip"'+(on?' open':'')+'><summary>EQ · Comp · Width'+(i?' · Duck':'')+(on?' ●':'')+'</summary><div class="grid2">'+sl('width','Stereo width',0,2,0.05,v.width,function(x){return x<0.03?'mono':Math.round(x*100)+'%';})+'<span></span>'+sl('l','Low (120 Hz)',-12,12,0.5,v.eq.l,dbf)+sl('m','Mid',-12,12,0.5,v.eq.m,dbf)+sl('mf','Mid freq',200,5000,10,v.eq.mf||1000,function(x){return Math.round(x)+' Hz';})+sl('h','High (8 kHz)',-12,12,0.5,v.eq.h,dbf)+
    sl('comp','Compressor',0,1,0.01,v.comp,function(x){return x<0.01?'off':Math.round(x*100)+'%';})+sl('cmo','Comp output',-12,12,0.5,v.cmo,dbf)+
    (i?sl('duck','Duck depth (kick)',0,1,0.01,v.duck,function(x){return x<0.01?'off':'−'+dec(x*18,1)+' dB';})+sl('duckR','Duck release',0.04,1,0.01,v.duckR,function(x){return Math.round(x*1000)+' ms';}):'')+'</div><p class="note grl" data-gr="'+i+'"></p></details>';}
function renderMixer(){
  var w=$('#mixer');
  w.innerHTML=tracks.map(function(t,i){
    function sl(k,lbl,mn,mx,v,fmt){return '<label class="ctl"><span class="row"><span>'+lbl+'</span><output data-mo="'+i+k+'">'+fmt(v)+'</output></span><input type="range" min="'+mn+'" max="'+mx+'" step="0.01" value="'+v+'" data-mx="'+k+'" data-t="'+i+'" aria-label="'+t.name+' '+lbl+'"></label>';}
    return '<div class="fx" style="padding:10px;display:flex;flex-direction:column;gap:8px"><div class="row"><strong>'+t.name+'</strong><div class="row" style="gap:6px">'+
      '<button class="mv ms" data-mute="'+i+'" aria-pressed="'+t.mute+'" aria-label="Mute '+t.name+'">M</button><button class="mv ms" data-solo="'+i+'" aria-pressed="'+t.solo+'" aria-label="Solo '+t.name+'">S</button>'+
      '<label class="chk" style="min-height:0;gap:6px"><span class="mu">Insert FX</span><input type="checkbox" data-tfx="'+i+'"'+(t.fx?' checked':'')+'></label></div></div><div class="tm"><i data-meter="'+i+'"></i></div><div class="grid2">'+
      sl('vol','Volume',0,1.2,t.vol,fVolDb)+sl('pan','Pan',-1,1,t.pan,function(v){return Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);})+sl('rev','Reverb send',0,1,t.rev,fPct)+sl('dly','Delay send',0,1,t.dly,fPct)+'</div>'+stripHtml(t,i)+'</div>';
  }).join('');
  $$('[data-mx]').forEach(function(inp){inp.addEventListener('input',function(){var i=+inp.getAttribute('data-t'),k=inp.getAttribute('data-mx'),v=parseFloat(inp.value);tracks[i][k]=v;var o=$('[data-mo="'+i+k+'"]');o.textContent=k==='pan'?(Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100)):k==='vol'?fVolDb(v):fPct(v);ensureAudio();applyMix();markDirty();});});
  $$('[data-mute]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-mute')];t.mute=!t.mute;b.setAttribute('aria-pressed',t.mute);ensureAudio();applyMix();markDirty();});});
  $$('[data-sk]').forEach(function(inp){inp.addEventListener('input',function(){var i=+inp.getAttribute('data-t'),k=inp.getAttribute('data-sk'),v=+inp.value,t=tracks[i];t.eq=t.eq||{l:0,m:0,mf:1000,h:0};
    if(k==='comp'||k==='duck'||k==='cmo'||k==='duckR'||k==='width')t[k]=v;else t.eq[k]=v;var o=$('[data-so="'+i+k+'"]');if(o)o.textContent=k==='mf'?Math.round(v)+' Hz':k==='comp'?(v<0.01?'off':Math.round(v*100)+'%'):k==='duck'?(v<0.01?'off':'−'+dec(v*18,1)+' dB'):k==='duckR'?Math.round(v*1000)+' ms':k==='width'?(v<0.03?'mono':Math.round(v*100)+'%'):(v>0?'+':'')+dec(v,1)+' dB';if(k==='comp')t.compLegacy=false;ensureAudio();applyStrip(t);if(k==='comp')calibrateComp(i);else if(t.comp&&/^(l|m|mf|h)$/.test(k))calibrateComp.pend(i,1200);markDirty();});});
  $$('[data-solo]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-solo')];t.solo=!t.solo;b.setAttribute('aria-pressed',t.solo);ensureAudio();applyMix();markDirty();});});
  $$('[data-tfx]').forEach(function(c){c.addEventListener('change',function(){var i=+c.getAttribute('data-tfx');tracks[i].fx=c.checked;if(i===0)$('#padFx').checked=c.checked;ensureAudio();trackRoute(i);markDirty();});});
  mxRender();
}
/* ---------- MIX CONSOLE: channel strips, inserts, sends/returns, sidechain, LUFS targets, dub throw ---------- */
