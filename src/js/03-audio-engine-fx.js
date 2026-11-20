function buildGraph(noMaster){
  N.post=ctx.createGain();
  N.dry=ctx.createGain();N.wet=ctx.createGain();N.wet.gain.value=0.3;
  N.conv=ctx.createConvolver();
  N.dsend=ctx.createGain();N.dsend.gain.value=0;N.delay=ctx.createDelay(2);N.fb=ctx.createGain();
  N.master=ctx.createGain();
  N.comp=ctx.createDynamicsCompressor();N.comp.threshold.value=-1.5;N.comp.knee.value=0;N.comp.ratio.value=20;N.comp.attack.value=0.001;N.comp.release.value=0.1;
  N.limMk=ctx.createGain();N.limMk.gain.value=dbg(-compMakeupDb(-1.5,20,0));N.clip=ctx.createWaveShaper();N.clip.oversample=offlineRender?'4x':'2x';N.clip.curve=softClipCurve();
  N.an=ctx.createAnalyser();N.an.fftSize=1024;
  N.chainIn=ctx.createGain();N.revIn=ctx.createGain();N.dlyIn=ctx.createGain();
  N.post.connect(N.dry);N.dry.connect(N.master);
  N.rvHp=BQ('highpass',P.rvLo?P.rvLo.v:160,0.7);N.rvLp=BQ('lowpass',P.rvHi?P.rvHi.v:9000,0.7);
  N.rvPreD=ctx.createDelay(0.2);N.rvPreD.delayTime.value=P.rvPre?P.rvPre.v:0;N.revIn.connect(N.rvPreD);N.rvPreD.connect(N.conv);N.conv.connect(N.rvHp);N.rvHp.connect(N.rvLp);N.rvLp.connect(N.wet);N.wet.connect(N.master);
  /* ping-pong style stereo delay: L/R offset */
  N.delay2=ctx.createDelay(2);N.dmerge=ctx.createChannelMerger(2);
  N.dlyIn.connect(N.dsend);N.dsend.connect(N.delay);N.delay.connect(N.delay2);N.delay2.connect(N.fb);N.fb.connect(N.delay);
  N.delay.connect(N.dmerge,0,0);N.delay2.connect(N.dmerge,0,1);N.dmerge.connect(N.master);
  buildMasterEq();
  if(noMaster){N.mOut.connect(ctx.destination);}else{N.mOut.connect(N.comp);N.comp.connect(N.limMk);N.limMk.connect(N.clip);N.clip.connect(N.an);N.an.connect(ctx.destination);}
  N.conv.buffer=makeVerb('hall');
  buildFX();routeFX();
  if(offlineRender)return;
  /* tap for 24-bit WAV recording (ScriptProcessor fallback; AudioWorklet replaces it when available) */
  N.tap=ctx.createScriptProcessor(4096,2,2);N.tapMute=ctx.createGain();N.tapMute.gain.value=0;
  N.tap.onaudioprocess=function(e){if(!wavRec||wavRec.bounce||N.tapW)return;var ib=e.inputBuffer;wavRec.L.push(new Float32Array(ib.getChannelData(0)));wavRec.R.push(new Float32Array(ib.numberOfChannels>1?ib.getChannelData(1):ib.getChannelData(0)));wavRec.n+=ib.length;if(wavRec.n>ctx.sampleRate*600)stopRec();};
  N.tap.connect(N.tapMute);N.tapMute.connect(ctx.destination);N.tapOn=false;
  /* AudioWorklet tap disabled: keep the always-on graph identical to the build that plays on every phone */
}

/* ---------- rack de efecte ---------- */
var FX={},FXDEF={
  eq:{name:'EQ',desc:'Low cut · shelves · parametric mid · high cut',params:['eqHp','eqLow','eqMidF','eqMid','eqQ','eqHigh','eqLp']},
  comp:{name:'Compressor',desc:'Threshold · ratio · attack · release · makeup',params:['cThr','cRatio','cAtt','cRel','cMk']},
  drive:{name:'Drive',desc:'Soft-clip saturation with tone control',params:['drive','dTone','dMix']},
  pitch:{name:'Pitch shifter',desc:'Real-time ±12 semitones, dry/wet',params:['psShift','psMix']},
  chorus:{name:'Chorus',desc:'Stereo dual-voice modulation',params:['chRate','chDepth','chMix']},
  flanger:{name:'Flanger',desc:'Short modulated delay with feedback',params:['flRate','flDepth','flFb','flMix']},
  phaser:{name:'Phaser',desc:'6-stage all-pass with feedback',params:['phRate','phDepth','phFb','phMix']},
  rotary:{name:'Rotary speaker',desc:'Horn + drum, slow/fast with inertia',params:['roMix','roBal']},
  lofi:{name:'Lo-Fi',desc:'Bit reduction and band-limiting',params:['lfBits','lfTone','lfMix']},
  amp:{name:'Amp',desc:'Amp modeling · tone stack · cabinet',params:['ampGain','ampMaster','ampBass','ampMid','ampTreble','ampPres']},
  match:{name:'Tone Match',desc:'10-band EQ matched to a reference',params:['tmAmt']}
};
var FXORDER=['eq','match','comp','amp','drive','pitch','chorus','flanger','phaser','rotary','lofi'];
var fxOn={},fxOpen={},roFast=false;
function G(v){var g=ctx.createGain();g.gain.value=v==null?1:v;return g;}
function BQ(type,f,q){var b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;}
function OSC(f){var o=ctx.createOscillator();o.type='sine';o.frequency.value=f;o.start();return o;}
function PAN(v){if(ctx.createStereoPanner){var p=ctx.createStereoPanner();p.pan.value=v;return p;}return G(1);}
function setCurve(sh,c){sh.curve=c;}
function driveCurve(a){var n=2048,c=new Float32Array(n),k=a*30;for(var i=0;i<n;i++){var x=i/(n-1)*2-1;c[i]=k>0.01?Math.tanh(x*(1+k))/Math.tanh(1+k):x;}return c;}
function crushCurve(b){var n=4096,c=new Float32Array(n),L=Math.pow(2,Math.round(b))/2;for(var i=0;i<n;i++){var x=i/(n-1)*2-1;c[i]=Math.round(x*L)/L;}return c;}
function mixMod(m){m.dryG=G(1);m.wetG=G(0);m.in.connect(m.dryG);m.dryG.connect(m.out);m.wetG.connect(m.out);}
function setMix(m,v){var df=m.dryFloor||0,wk=m.wk||1;m.dryG.gain.setTargetAtTime(1-v*(1-df),ctx.currentTime,0.02);m.wetG.gain.setTargetAtTime(v*wk,ctx.currentTime,0.02);}
function buildFX(){
  FXORDER.forEach(function(id){FX[id]={in:G(1),out:G(1)};});
  var m;
  /* EQ */
  m=FX.eq;m.hp=BQ('highpass',20,0.707);m.ls=BQ('lowshelf',120);m.pk=BQ('peaking',1000,0.9);m.hs=BQ('highshelf',8000);m.lp=BQ('lowpass',20000,0.707);
  m.in.connect(m.hp);m.hp.connect(m.ls);m.ls.connect(m.pk);m.pk.connect(m.hs);m.hs.connect(m.lp);m.lp.connect(m.out);
  /* Compressor */
  m=FX.comp;m.c=ctx.createDynamicsCompressor();m.c.knee.value=6;m.mk=G(1);m.in.connect(m.c);m.c.connect(m.mk);m.mk.connect(m.out);
  /* Drive */
  m=FX.drive;mixMod(m);m.pre=G(1);m.sh=ctx.createWaveShaper();m.sh.oversample='4x';m.tone=BQ('lowpass',6000,0.707);m.post=G(0.45);
  m.in.connect(m.pre);m.pre.connect(m.sh);m.sh.connect(m.tone);m.tone.connect(m.post);m.post.connect(m.wetG);
  /* Pitch shifter (dual crossfaded modulated delay lines) */
  m=FX.pitch;mixMod(m);m.dryFloor=0.3;m.wk=1.2;buildPitch(m);
  /* Chorus */
  m=FX.chorus;mixMod(m);m.dryFloor=0.6;m.wk=1.3;m.d1=ctx.createDelay(0.1);m.d2=ctx.createDelay(0.1);m.d1.delayTime.value=0.018;m.d2.delayTime.value=0.024;
  m.osc=OSC(0.6);m.dg=G(0.003);m.dgi=G(-0.003);m.osc.connect(m.dg);m.dg.connect(m.d1.delayTime);m.osc.connect(m.dgi);m.dgi.connect(m.d2.delayTime);
  m.p1=PAN(-0.7);m.p2=PAN(0.7);m.in.connect(m.d1);m.in.connect(m.d2);m.d1.connect(m.p1);m.d2.connect(m.p2);m.p1.connect(m.wetG);m.p2.connect(m.wetG);
  /* Flanger */
  m=FX.flanger;mixMod(m);m.d=ctx.createDelay(0.05);m.d.delayTime.value=0.005;m.osc=OSC(0.25);m.dg=G(0.0025);m.fb=G(0.6);
  m.osc.connect(m.dg);m.dg.connect(m.d.delayTime);m.in.connect(m.d);m.d.connect(m.fb);m.fb.connect(m.d);m.d.connect(m.wetG);
  /* Phaser */
  m=FX.phaser;mixMod(m);m.aps=[];m.osc=OSC(0.4);m.dg=G(800);m.osc.connect(m.dg);
  m.fbd=ctx.createDelay(0.01);m.fbd.delayTime.value=0.003;m.fb=G(0.5);m.sum=G(1);m.in.connect(m.sum);
  var prev=m.sum,bases=[300,520,800,1150,1600,2200];
  bases.forEach(function(f){var a=BQ('allpass',f,0.6);m.dg.connect(a.frequency);prev.connect(a);prev=a;m.aps.push(a);});
  prev.connect(m.wetG);prev.connect(m.fbd);m.fbd.connect(m.fb);m.fb.connect(m.sum);
  /* Rotary speaker */
  m=FX.rotary;mixMod(m);m.wk=1.6;m.lo=BQ('lowpass',800,0.707);m.hi=BQ('highpass',800,0.707);m.hg=G(0.8);m.lg=G(0.8);
  m.hornO=OSC(0.8);m.drumO=OSC(0.66);
  m.hAM=G(0.72);m.hAMd=G(0.28);m.hornO.connect(m.hAMd);m.hAMd.connect(m.hAM.gain);
  m.hDel=ctx.createDelay(0.01);m.hDel.delayTime.value=0.0015;m.hDd=G(0.0006);m.hornO.connect(m.hDd);m.hDd.connect(m.hDel.delayTime);
  m.hPan=PAN(0);m.hPd=G(0.85);if(m.hPan.pan){m.hornO.connect(m.hPd);m.hPd.connect(m.hPan.pan);}
  m.dAM=G(0.85);m.dAMd=G(0.15);m.drumO.connect(m.dAMd);m.dAMd.connect(m.dAM.gain);
  m.dPan=PAN(0);m.dPd=G(0.4);if(m.dPan.pan){m.drumO.connect(m.dPd);m.dPd.connect(m.dPan.pan);}
  m.in.connect(m.hi);m.hi.connect(m.hDel);m.hDel.connect(m.hAM);m.hAM.connect(m.hPan);m.hPan.connect(m.hg);m.hg.connect(m.wetG);
  m.in.connect(m.lo);m.lo.connect(m.dAM);m.dAM.connect(m.dPan);m.dPan.connect(m.lg);m.lg.connect(m.wetG);
  /* Lo-Fi */
  m=FX.lofi;mixMod(m);m.sh=ctx.createWaveShaper();m.tone=BQ('lowpass',5000,0.707);m.in.connect(m.sh);m.sh.connect(m.tone);m.tone.connect(m.wetG);
  buildAmp();
}
function buildPitch(m){
  var T=0.1,sr=ctx.sampleRate,n=Math.round(T*sr);
  var up=ctx.createBuffer(1,n,sr),dn=ctx.createBuffer(1,n,sr),fd=ctx.createBuffer(1,n,sr);
  var u=up.getChannelData(0),d=dn.getChannelData(0),f=fd.getChannelData(0);
  for(var i=0;i<n;i++){var ph=i/n;d[i]=ph;u[i]=1-ph;f[i]=ph<0.1?ph/0.1:ph<0.5?1:ph<0.6?(0.6-ph)/0.1:0;}
  m.ps={T:T,up:up,dn:dn,fd:fd,lines:[],dir:0};
  for(var k=0;k<2;k++){
    var del=ctx.createDelay(0.5);del.delayTime.value=0.003;var lg=G(0),dg=G(0);
    m.in.connect(del);del.connect(lg);lg.connect(m.wetG);dg.connect(del.delayTime);
    m.ps.lines.push({del:del,lg:lg,dg:dg,srcs:[]});
  }
  psRestart(m,1);
}
function psRestart(m,dir){
  var ps=m.ps;ps.dir=dir;var t=ctx.currentTime+0.02;
  ps.lines.forEach(function(L,k){
    L.srcs.forEach(function(s){try{s.stop();}catch(e){}});
    var r=ctx.createBufferSource();r.buffer=dir>0?ps.up:ps.dn;r.loop=true;r.connect(L.dg);
    var f=ctx.createBufferSource();f.buffer=ps.fd;f.loop=true;f.connect(L.lg.gain);
    var off=k*ps.T/2;r.start(t,off);f.start(t,off);L.srcs=[r,f];
  });
}
function psSet(m,semi){
  var r=Math.pow(2,Math.round(semi)/12),dir=r>=1?1:-1;
  if(dir!==m.ps.dir)psRestart(m,dir);
  var D=Math.min(0.45,Math.abs(1-r)*m.ps.T);
  m.ps.lines.forEach(function(L){L.dg.gain.setTargetAtTime(D,ctx.currentTime,0.01);});
}
function routeFX(){
  try{N.chainIn.disconnect();}catch(e){}
  FXORDER.forEach(function(id){try{FX[id].out.disconnect();}catch(e){}});
  var prev=N.chainIn;
  FXORDER.forEach(function(id){if(fxOn[id]){prev.connect(FX[id].in);prev=FX[id].out;}});
  prev.connect(N.post);
}
function setRotary(fast){
  roFast=fast;
  $$('[data-ro]').forEach(function(b){b.setAttribute('aria-pressed',(b.getAttribute('data-ro')==='fast')===fast?'true':'false');});
  if(!ctx)return;var m=FX.rotary,now=ctx.currentTime;
  m.hornO.frequency.setTargetAtTime(fast?6.8:0.8,now,fast?0.35:0.9);
  m.drumO.frequency.setTargetAtTime(fast?5.9:0.66,now,fast?1.1:2.2);
}
function buildFxUI(){
  var wrap=$('#fxChain');wrap.innerHTML='';
  FXORDER.forEach(function(id,i){
    var d=FXDEF[id],open=!!fxOpen[id],card=document.createElement('div');
    card.className='fx'+(fxOn[id]?' on':'');
    var h='<div class="fxh"><button class="fxname" data-x="'+id+'" aria-expanded="'+open+'"><span>'+d.name+'</span><small>'+d.desc+'</small></button>'+
      '<button class="mv" data-mv="'+id+'" data-dir="-1" aria-label="Move '+d.name+' up"'+(i===0?' disabled':'')+'>↑</button>'+
      '<button class="mv" data-mv="'+id+'" data-dir="1" aria-label="Move '+d.name+' down"'+(i===FXORDER.length-1?' disabled':'')+'>↓</button>'+
      '<input type="checkbox" class="sw" data-on="'+id+'" aria-label="'+d.name+' on"'+(fxOn[id]?' checked':'')+'></div>';
    h+='<div class="fxb"'+(open?'':' hidden')+'>';
    if(id==='amp')h+='<div class="seg" role="group" aria-label="Amp model" style="align-self:flex-start;flex-wrap:wrap">'+Object.keys(AMPM).map(function(k){return '<button data-amp="'+k+'" aria-pressed="'+(k===ampModel)+'">'+AMPM[k].name+'</button>';}).join('')+'</div><div class="row"><span class="mu">Cabinet</span><span class="mu" id="cabInfo">'+cabName+'</span></div><div class="btns"><button class="btn rec" id="cabRec">● Capture cab</button><label class="btn" for="f-CAB">Import IR</label></div>';
    if(id==='match')h+='<p class="note">Import a reference (a guitar tone, an instrument, a mix). Ecou compares it with Source A of the selected track and sets the EQ so it takes on the reference’s tonal balance.</p><label class="btn" for="f-REF">Import reference</label><p class="note" id="matchInfo" style="color:var(--tx)"></p>';
    if(id==='rotary')h+='<div class="seg" role="group" aria-label="Rotor speed" style="align-self:flex-start"><button data-ro="slow" aria-pressed="'+(!roFast)+'">Slow</button><button data-ro="fast" aria-pressed="'+roFast+'">Fast</button></div>';
    h+='<div class="grid2">';
    d.params.forEach(function(k,j){h+='<label data-p="'+k+'"'+(j>=2?' class="pro"':'')+'></label>';});
    h+='</div></div>';
    card.innerHTML=h;wrap.appendChild(card);
  });
  $$('#fxChain [data-p]').forEach(bindControl);
  $$('#fxChain .fxname').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-x');fxOpen[id]=!fxOpen[id];b.setAttribute('aria-expanded',fxOpen[id]);b.parentNode.nextSibling.hidden=!fxOpen[id];});});
  $$('#fxChain [data-mv]').forEach(function(b){b.addEventListener('click',function(){
    var id=b.getAttribute('data-mv'),dir=+b.getAttribute('data-dir'),i=FXORDER.indexOf(id),j=i+dir;
    if(j<0||j>=FXORDER.length)return;FXORDER[i]=FXORDER[j];FXORDER[j]=id;buildFxUI();if(ctx)routeFX();
  });});
  $$('#fxChain [data-on]').forEach(function(c){c.addEventListener('change',function(){
    var id=c.getAttribute('data-on');ensureAudio();fxOn[id]=c.checked;c.closest('.fx').classList.toggle('on',c.checked);
    if(c.checked&&!fxOpen[id]){fxOpen[id]=true;var b=c.closest('.fx').querySelector('.fxname');b.setAttribute('aria-expanded','true');c.closest('.fx').querySelector('.fxb').hidden=false;}
    routeFX();updFxCount();
  });});
  $$('#fxChain [data-amp]').forEach(function(b){b.addEventListener('click',function(){ensureAudio();cabCustom=null;setAmpModel(b.getAttribute('data-amp'));markDirty();});});
  var cr=$('#cabRec');if(cr)cr.addEventListener('click',function(){startCapture('CAB');});
  if(ctx&&FX.match)renderMatchInfo();
  $$('#fxChain [data-ro]').forEach(function(b){b.addEventListener('click',function(){ensureAudio();setRotary(b.getAttribute('data-ro')==='fast');});});
  updFxCount();
}
function updFxCount(){var n=0;FXORDER.forEach(function(id){if(fxOn[id])n++;});$('#fxCount').textContent=n+' active';}

/* ---------- delay sincronizat ---------- */
var DSYNC=[['free','Free'],['1/4','1/4'],['1/8','1/8'],['1/8D','1/8 dot'],['1/16','1/16'],['1/4T','1/4 trip']],dsync='1/8D';
function syncSeconds(){var q=60/P.bpm.v;return {'1/4':q,'1/8':q/2,'1/8D':q*0.75,'1/16':q/4,'1/4T':q*2/3}[dsync];}
function updDelayTime(){
  $('#dtimeCtl').style.display=dsync==='free'?'':'none';
  if(!ctx)return;var t=dsync==='free'?P.dtime.v:syncSeconds();
  N.delay.delayTime.setTargetAtTime(Math.min(1.9,t),ctx.currentTime,0.05);if(N.delay2)N.delay2.delayTime.setTargetAtTime(Math.min(1.9,t),ctx.currentTime,0.05);
}
function buildDsync(){
  var w=$('#dsync');w.innerHTML=DSYNC.map(function(d){return '<button data-ds="'+d[0]+'" aria-pressed="'+(d[0]===dsync)+'">'+d[1]+'</button>';}).join('');
  $$('[data-ds]').forEach(function(b){b.addEventListener('click',function(){dsync=b.getAttribute('data-ds');$$('[data-ds]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});updDelayTime();});});
}

/* ---------- WAV / ZIP ---------- */
