'use strict';
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
var NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function ftom(f){return 69+12*Math.log2(f/440);}
function nname(m){m=Math.round(m);return NN[((m%12)+12)%12]+(Math.floor(m/12)-1);}
function normToHz(n){return 40*Math.pow(450,n);}
function dec(v,d){return v.toFixed(d);}
function fHz(h){return h>=1000?dec(h/1000,1)+' kHz':Math.round(h)+' Hz';}
function fMs(s){return s<1?Math.round(s*1000)+' ms':dec(s,2)+' s';}
function fVolDb(v){return v<0.001?'−∞ dB':(v>=1?'+':'')+dec(20*Math.log10(v),1)+' dB';}
function fPct(v){return Math.round(v*100)+'%';}

var toastT;
function toast(msg,ms){var t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},Math.min(ms||2200,3200));}

/* ---------- parametri ---------- */
var P={
  morph:{label:'A ↔ B blend',v:0,min:0,max:1,fmt:function(v){return Math.round((1-v)*100)+' / '+Math.round(v*100);},on:function(){updateMorph();scheduleMorph();}},
  attack:{label:'Attack',v:0.005,min:0.002,max:3,log:true,fmt:fMs},
  release:{label:'Release',v:0.9,min:0.02,max:8,log:true,fmt:fMs},
  cutoff:{label:'Cutoff',v:0.85,min:0,max:1,fmt:function(v){return fHz(normToHz(v));}},
  space:{label:'Space',v:0.25,min:0,max:1,fmt:fPct},
  rvLo:{label:'Reverb low cut',v:160,min:20,max:800,log:true,fmt:fHz,on:function(v){if(N.rvHp)N.rvHp.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  rvPre:{label:'Pre-delay',v:0.02,min:0,max:0.15,fmt:fMs,on:function(v){if(N.rvPreD)N.rvPreD.delayTime.setTargetAtTime(v,ctx.currentTime,0.02);}},
  rvSize:{label:'Size / decay',v:1,min:0.4,max:2.5,log:true,fmt:function(v){return '×'+dec(v,2);},on:function(){verbResize();}},
  rvRet:{label:'Reverb return',v:0,min:-12,max:12,fmt:function(v){return (v>0?'+':'')+dec(v,1)+' dB';},on:function(){if(N.wet)N.wet.gain.setTargetAtTime(wetGain(P.space.v),ctx.currentTime,0.03);}},
  rvHi:{label:'Reverb high cut',v:9000,min:1500,max:18000,log:true,fmt:fHz,on:function(v){if(N.rvLp)N.rvLp.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  fenv:{label:'Filter envelope',v:0,min:0,max:1,fmt:fPct},
  fdec:{label:'Envelope decay',v:0.3,min:0.02,max:2,log:true,fmt:fMs},
  glide:{label:'Glide',v:0,min:0,max:0.5,fmt:function(v){return v<0.002?'off':fMs(v);}},
  mono:{label:'Voice mode',v:0,min:0,max:1,step:1,fmt:function(v){return v>=0.5?'Mono · legato':'Poly';}},
  reso:{label:'Resonance',v:0.8,min:0.1,max:18,fmt:function(v){return dec(v,1);},on:function(v){var t=tracks[selTrack];if(t&&t.n)t.n.f.Q.value=v;}},
  gpos:{label:'Scan position',v:0.2,min:0,max:1,fmt:fPct},
  gsize:{label:'Grain size',v:0.09,min:0.01,max:0.6,log:true,fmt:fMs},
  gdens:{label:'Density',v:22,min:2,max:90,step:1,fmt:function(v){return Math.round(v)+' / s';}},
  gspray:{label:'Spray',v:0.1,min:0,max:1,fmt:fPct},
  gjit:{label:'Pitch jitter',v:6,min:0,max:100,step:1,fmt:function(v){return '±'+Math.round(v)+' ct';}},
  lfo:{label:'LFO rate',v:0.4,min:0.05,max:12,log:true,fmt:function(v){return dec(v,2)+' Hz';}},
  bpm:{label:'Tempo',v:120,min:60,max:200,step:1,fmt:function(v){return Math.round(v)+' BPM';},on:function(){updDelayTime();},set:function(){try{updTransportUI();var e=document.getElementById('dawBpm');if(e)e.textContent=Math.round(P.bpm.v);dawNeed=true;}catch(e){}}},
  dtime:{label:'Delay time',v:0.33,min:0.03,max:1.5,log:true,fmt:fMs,on:function(){updDelayTime();}},
  dfb:{label:'Feedback',v:0.35,min:0,max:0.9,fmt:fPct,on:function(v){N.fb.gain.value=v;}},
  dmix:{label:'Delay return',v:0.7,min:0,max:1,fmt:fPct,on:function(v){N.dsend.gain.value=v*0.8*(MIX&&MIX.rBm?0:1);}},
  vol:{label:'Master',v:0.8,min:0,max:1.6,fmt:fPct},
  ceil:{label:'Limiter ceiling',v:-1,min:-3,max:-0.1,step:0.1,fmt:function(v){return dec(v,1)+' dBTP';},on:function(v){setCeil(v);}},
  swing:{label:'Swing',v:0,min:0,max:0.6,fmt:fPct},
  padLevel:{label:'Level',v:1,min:0,max:1.5,fmt:fPct,set:function(v){if(pads[padSel])pads[padSel].level=v;}},
  padTune:{label:'Tune',v:0,min:-24,max:24,step:1,fmt:fSt,set:function(v){if(pads[padSel])pads[padSel].tune=Math.round(v);}},
  padDecay:{label:'Decay',v:1,min:0,max:1,fmt:function(v){return v>=0.99?'Full':fMs(0.01+v*v*1.2);},set:function(v){if(pads[padSel])pads[padSel].decay=v;}},
  padPan:{label:'Pan',v:0,min:-1,max:1,step:0.01,fmt:function(v){return Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);},set:function(v){if(pads[padSel])pads[padSel].pan=v;}},
  /* EQ */
  eqHp:{label:'Low cut',v:20,min:20,max:1000,log:true,fmt:fHz,on:function(v){FX.eq.hp.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  eqLow:{label:'Low shelf',v:0,min:-15,max:15,step:0.1,fmt:fDb,on:function(v){FX.eq.ls.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  eqMidF:{label:'Mid freq',v:1000,min:150,max:8000,log:true,fmt:fHz,on:function(v){FX.eq.pk.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  eqMid:{label:'Mid gain',v:0,min:-15,max:15,step:0.1,fmt:fDb,on:function(v){FX.eq.pk.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  eqQ:{label:'Mid Q',v:0.9,min:0.3,max:8,log:true,fmt:function(v){return dec(v,2);},on:function(v){FX.eq.pk.Q.value=v;}},
  eqHigh:{label:'High shelf',v:0,min:-15,max:15,step:0.1,fmt:fDb,on:function(v){FX.eq.hs.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  eqLp:{label:'High cut',v:20000,min:1000,max:20000,log:true,fmt:fHz,on:function(v){FX.eq.lp.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  /* Compressor */
  cThr:{label:'Threshold',v:-18,min:-60,max:0,step:0.5,fmt:fDb,on:function(v){FX.comp.c.threshold.value=v;updCompMk();}},
  cRatio:{label:'Ratio',v:4,min:1,max:20,step:0.1,fmt:function(v){return dec(v,1)+':1';},on:function(v){FX.comp.c.ratio.value=v;updCompMk();}},
  cAtt:{label:'Attack',v:0.01,min:0.001,max:0.3,log:true,fmt:fMs,on:function(v){FX.comp.c.attack.value=v;}},
  cRel:{label:'Release',v:0.25,min:0.03,max:1.5,log:true,fmt:fMs,on:function(v){FX.comp.c.release.value=v;}},
  cMk:{label:'Makeup',v:2,min:0,max:24,step:0.5,fmt:fDb,on:function(){updCompMk();}},
  /* Drive */
  drive:{label:'Drive',v:0.4,min:0,max:1,fmt:fPct,on:function(v){setCurve(FX.drive.sh,driveCurve(v));FX.drive.post.gain.setTargetAtTime(dbg(1-14*Math.sqrt(v)),ctx.currentTime,0.02);}},
  dTone:{label:'Tone',v:6000,min:800,max:18000,log:true,fmt:fHz,on:function(v){FX.drive.tone.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  dMix:{label:'Mix',v:1,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.drive,v);}},
  /* Pitch shifter */
  psShift:{label:'Shift',v:7,min:-12,max:12,step:1,fmt:fSt,on:function(v){psSet(FX.pitch,v);}},
  psMix:{label:'Mix',v:0.5,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.pitch,v);}},
  /* Chorus */
  chRate:{label:'Rate',v:0.6,min:0.05,max:5,log:true,fmt:fRate,on:function(v){FX.chorus.osc.frequency.setTargetAtTime(v,ctx.currentTime,0.05);}},
  chDepth:{label:'Depth',v:0.5,min:0,max:1,fmt:fPct,on:function(v){FX.chorus.dg.gain.value=v*0.006;FX.chorus.dgi.gain.value=-v*0.006;}},
  chMix:{label:'Mix',v:0.5,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.chorus,v);}},
  /* Flanger */
  flRate:{label:'Rate',v:0.25,min:0.05,max:5,log:true,fmt:fRate,on:function(v){FX.flanger.osc.frequency.setTargetAtTime(v,ctx.currentTime,0.05);}},
  flDepth:{label:'Depth',v:0.7,min:0,max:1,fmt:fPct,on:function(v){FX.flanger.dg.gain.value=v*0.0035;}},
  flFb:{label:'Feedback',v:0.6,min:0,max:0.92,fmt:fPct,on:function(v){FX.flanger.fb.gain.value=v;}},
  flMix:{label:'Mix',v:0.5,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.flanger,v);}},
  /* Phaser */
  phRate:{label:'Rate',v:0.4,min:0.05,max:5,log:true,fmt:fRate,on:function(v){FX.phaser.osc.frequency.setTargetAtTime(v,ctx.currentTime,0.05);}},
  phDepth:{label:'Depth',v:0.7,min:0,max:1,fmt:fPct,on:function(v){FX.phaser.dg.gain.value=v*1100;}},
  phFb:{label:'Feedback',v:0.5,min:0,max:0.85,fmt:fPct,on:function(v){FX.phaser.fb.gain.value=v;}},
  phMix:{label:'Mix',v:0.5,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.phaser,v);}},
  /* Rotary */
  roMix:{label:'Mix',v:1,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.rotary,v);}},
  roBal:{label:'Horn ↔ drum',v:0.5,min:0,max:1,fmt:function(v){return Math.round((1-v)*100)+' / '+Math.round(v*100);},on:function(v){FX.rotary.hg.gain.value=1.2*(1-v)+0.2;FX.rotary.lg.gain.value=1.2*v+0.2;}},
  /* Lo-Fi */
  lfBits:{label:'Bit depth',v:6,min:2,max:12,step:1,fmt:function(v){return Math.round(v)+' bit';},on:function(v){setCurve(FX.lofi.sh,crushCurve(v));}},
  lfTone:{label:'Tone',v:5000,min:1000,max:18000,log:true,fmt:fHz,on:function(v){FX.lofi.tone.frequency.setTargetAtTime(v,ctx.currentTime,0.02);}},
  lfMix:{label:'Mix',v:1,min:0,max:1,fmt:fPct,on:function(v){setMix(FX.lofi,v);}},
  ampGain:{label:'Gain',v:0.5,min:0,max:1,fmt:fPct,on:function(){updAmpCurves();}},
  ampMaster:{label:'Master',v:0.6,min:0,max:1.5,fmt:fPct,on:function(v){FX.amp.master.gain.setTargetAtTime(v*0.8,ctx.currentTime,0.02);}},
  ampBass:{label:'Bass',v:0,min:-12,max:12,step:0.5,fmt:fDb,on:function(v){FX.amp.bass.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  ampMid:{label:'Middle',v:0,min:-12,max:12,step:0.5,fmt:fDb,on:function(v){FX.amp.midf.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  ampTreble:{label:'Treble',v:0,min:-12,max:12,step:0.5,fmt:fDb,on:function(v){FX.amp.treb.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  ampPres:{label:'Presence',v:0,min:-12,max:12,step:0.5,fmt:fDb,on:function(v){FX.amp.pres.gain.setTargetAtTime(v,ctx.currentTime,0.02);}},
  tmAmt:{label:'Amount',v:1,min:0,max:1,fmt:fPct,on:function(){applyMatch();}},
  liveGain:{label:'Input gain',v:1,min:0,max:4,fmt:fPct,on:function(v){if(N.liveIn)N.liveIn.gain.setTargetAtTime(v,ctx.currentTime,0.02);}}
};
function updCompMk(){if(!FX.comp||!FX.comp.mk)return;FX.comp.mk.gain.setTargetAtTime(dbg(P.cMk.v-compMakeupDb(P.cThr.v,P.cRatio.v,6)),ctx.currentTime,0.02);}
function fDb(v){return (v>0?'+':'')+dec(v,1)+' dB';}
function fSt(v){v=Math.round(v);return (v>0?'+':'')+v+' st';}
function fRate(v){return dec(v,2)+' Hz';}
function toSlider(p,v){if(p.log)return Math.log(v/p.min)/Math.log(p.max/p.min);return v;}
function fromSlider(p,x){if(p.log)return p.min*Math.pow(p.max/p.min,x);return x;}
function buildControls(){
  $$('[data-p]').forEach(bindControl);
  Object.keys(P).forEach(function(k){syncParam(k);});
}
function bindControl(el){
  (function(){
    var k=el.getAttribute('data-p'),p=P[k];
    el.classList.add('ctl');
    var mn=p.log?0:p.min,mx=p.log?1:p.max,st=p.log?0.001:(p.step||((p.max-p.min)/1000));
    el.innerHTML='<span class="row"><span>'+p.label+'</span><output data-o="'+k+'"></output></span><input type="range" data-r="'+k+'" min="'+mn+'" max="'+mx+'" step="'+st+'" aria-label="'+p.label+'">';
    var inp=el.querySelector('input');inp.value=toSlider(p,p.v);
    inp.addEventListener('input',function(){
      p.v=fromSlider(p,parseFloat(inp.value));
      syncParam(k,el);
      if(p.on&&ctx)p.on(p.v);
      if(p.set)p.set(p.v);
      markDirty();
    });
    var o=el.querySelector('output');o.textContent=p.fmt(p.v);
  })();
}
function syncParam(k,from){
  var p=P[k];
  $$('[data-o="'+k+'"]').forEach(function(o){o.textContent=p.fmt(p.v);});
  $$('[data-r="'+k+'"]').forEach(function(r){if(!from||!from.contains(r))r.value=toSlider(p,p.v);});
}

/* ---------- audio ---------- */
var ctx=null,N={};
var slots={A:{name:'Glass Tap',buf:null,root:880,det:true},B:{name:'Choir Pad',buf:null,root:261.63,det:true}};
var engine='sampler',loopOn=false;
var voices=new Map();
var pitchSemi=0,grainPos=0.2;

function ensureAudio(){
  if(offlineRender)return true;
  if(ctx){if(ctx.state!=='running')ctx.resume();return true;}
  var AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){toast('Web Audio is not supported in this browser.');return false;}
  var lh='interactive';try{if(localStorage.getItem('ecou.stable')==='1')lh='playback';}catch(e){}
  try{ctx=new AC({latencyHint:lh});}catch(e){ctx=new AC();}
  fmWorkletInit();setTimeout(hornPreload,600);buildGraph();perfInsert();meterInsert();makeDemos();demoSounds();initPatterns();makeKit();KITFAC=kitSig();demoNotes();setTimeout(function(){PRJ_UNT=true;},0);buildTracks();renderPatSegs();renderMixer();loadSound(selTrack);
  Object.keys(P).forEach(function(k){if(P[k].on)P[k].on(P[k].v);});
  setInterval(grainTick,25);
  dirty=false;$('#saveState').textContent='Not saved yet';setTimeout(histReset,0);
  return true;
}
