var STOCK={
  gpiano:{name:'Grand Piano',smp:'piano',src:'piano',zones:[36,48,60,72,84],dur:3.2,loop:false,p:{attack:0.002,release:0.7,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  epiano:{name:'Stage Electric Piano',smp:'rhodes',src:'rhodes',zones:[36,48,60,72,84],dur:3,loop:false,p:{attack:0.002,release:0.5,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  churchorg:{name:'Pipe Organ',smp:'organ',src:'organ',zones:[36,48,60,72,84],dur:2,loop:true,p:{attack:0.02,release:0.35,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  harmonium:{name:'Harmonium',smp:'harmonium',src:'organ',zones:[36,48,60,72],dur:2,loop:true,p:{attack:0.04,release:0.3,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  egtr2:{name:'Electric Guitar',smp:'gtr-electric',src:'gtr',zones:[40,52,64,76],dur:3,loop:false,p:{attack:0.002,release:0.3,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  steel:{name:'Steel-string Acoustic',smp:'gtr-acoustic',src:'gtrA',zones:[40,52,64,76],dur:3,loop:false,p:{attack:0.002,release:0.45,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  nylon:{name:'Nylon Guitar',smp:'gtr-nylon',src:'gtrA',zones:[40,52,64,76],dur:3,loop:false,p:{attack:0.002,release:0.45,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  ebass:{name:'Electric Bass',smp:'bass-electric',src:'fbass',zones:[28,40,52],dur:2.5,loop:false,p:{attack:0.002,release:0.12,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  upright:{name:'Upright Bass',smp:'upright',src:'fbass',zones:[28,40,52],dur:2.5,loop:false,p:{attack:0.002,release:0.2,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  violin:{name:'Violin',smp:'violin',src:'strings',zones:[60,72,84],dur:2,loop:true,p:{attack:0.04,release:0.35,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  cello:{name:'Cello',smp:'cello',src:'strings',zones:[36,48,60],dur:2,loop:true,p:{attack:0.05,release:0.4,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  flute:{name:'Flute',smp:'flute',src:'melodica',zones:[60,72,84],dur:2,loop:true,p:{attack:0.03,release:0.25,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  clarinet:{name:'Clarinet',smp:'clarinet',src:'melodica',zones:[48,60,72],dur:2,loop:true,p:{attack:0.02,release:0.25,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  sax:{name:'Saxophone',smp:'sax',src:'melodica',zones:[48,60,72],dur:2,loop:true,p:{attack:0.02,release:0.25,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  trumpet:{name:'Trumpet',smp:'trumpet',src:'saw',zones:[48,60,72],dur:2,loop:true,p:{attack:0.02,release:0.2,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  trombone:{name:'Trombone',smp:'trombone',src:'saw',zones:[36,48,60],dur:2,loop:true,p:{attack:0.03,release:0.25,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  horn:{name:'French Horn',smp:'horn',src:'saw',zones:[36,48,60],dur:2,loop:true,p:{attack:0.04,release:0.3,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  tuba:{name:'Tuba',smp:'tuba',src:'sub',zones:[24,36,48],dur:2,loop:true,p:{attack:0.03,release:0.25,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  harp:{name:'Harp',smp:'harp',src:'pluck',zones:[36,48,60,72,84],dur:2,loop:false,p:{attack:0.002,release:0.9,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  xylophone:{name:'Xylophone',smp:'xylophone',src:'pluck',zones:[60,72,84],dur:1.5,loop:false,p:{attack:0.001,release:0.4,cutoff:1,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  piano:{name:'Synth Piano',zones:[36,48,60,72,84],dur:3.2,loop:false,p:{attack:0.003,release:0.5,cutoff:0.92,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  rhodes:{name:'Synth E-Piano',zones:[36,48,60,72,84],dur:3,loop:false,p:{attack:0.003,release:0.45,cutoff:0.85,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  organ:{name:'Drawbar Organ',zones:[36,48,60,72,84],dur:2,loop:true,p:{attack:0.008,release:0.12,cutoff:0.9,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  skank:{name:'Skank Organ',src:'organ',zones:[48,60,72,84],dur:2,loop:true,p:{attack:0.004,release:0.06,cutoff:0.78,reso:1.2,fenv:0.3,fdec:0.08,glide:0,mono:0}},
  melodica:{name:'Melodica',zones:[48,60,72,84],dur:2,loop:true,p:{attack:0.04,release:0.15,cutoff:0.88,reso:0.7,fenv:0,fdec:0.3,glide:0.03,mono:1}},
  strings:{name:'Strings',zones:[36,48,60,72,84],dur:2,loop:true,p:{attack:0.35,release:1.2,cutoff:0.75,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  pluck:{name:'Pluck',zones:[36,48,60,72,84],dur:2,loop:false,p:{attack:0.002,release:0.3,cutoff:0.9,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  lead:{name:'Supertone Lead',src:'saw',zones:[36,48,60,72,84],dur:2,loop:true,p:{attack:0.005,release:0.18,cutoff:0.5,reso:3,fenv:0.55,fdec:0.22,glide:0.07,mono:1}},
  dub:{name:'Dub Bass',zones:[24,36,48,60],dur:2,loop:true,p:{attack:0.006,release:0.12,cutoff:0.55,reso:0.9,fenv:0.15,fdec:0.12,glide:0.05,mono:1}},
  b808:{name:'808',zones:[24,36,48],dur:3,loop:false,p:{attack:0.002,release:0.25,cutoff:0.95,reso:0.7,fenv:0,fdec:0.3,glide:0.09,mono:1}},
  sub:{name:'Sub Bass',zones:[24,36,48],dur:2,loop:true,p:{attack:0.008,release:0.1,cutoff:0.6,reso:0.7,fenv:0,fdec:0.3,glide:0.04,mono:1}},
  egtr:{name:'Synth Clean Guitar',src:'gtr',zones:[40,52,64,76],dur:3,loop:false,p:{attack:0.002,release:0.35,cutoff:0.9,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  agtr:{name:'Synth Acoustic Guitar',src:'gtrA',zones:[40,52,64,76],dur:3,loop:false,p:{attack:0.002,release:0.4,cutoff:0.95,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  fbass:{name:'Synth Finger Bass',src:'fbass',zones:[28,40,52],dur:2.5,loop:false,p:{attack:0.003,release:0.14,cutoff:0.8,reso:0.7,fenv:0,fdec:0.3,glide:0,mono:0}},
  sawbass:{name:'Saw Bass',src:'saw',zones:[24,36,48,60],dur:2,loop:true,p:{attack:0.003,release:0.12,cutoff:0.42,reso:4,fenv:0.6,fdec:0.15,glide:0.04,mono:1}}
};
var stockCache={};
function stockGen(kind,f,dur,sr){
  var n=Math.floor(dur*sr),d=new Float32Array(n),TP=2*Math.PI,i,h,t,nyq=sr*0.45,seed=Math.round(f*7)+3;
  function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;}
  if(kind==='piano'){var B=0.00035,P=[];for(h=1;h<=16;h++){var fh=h*f*Math.sqrt(1+B*h*h);if(fh>nyq)break;P.push([fh,Math.pow(h,-1.15)*(h===1?1:0.8),0.5+0.22*h+f/700]);}
    for(i=0;i<n;i++){t=i/sr;var s=0;for(var k=0;k<P.length;k++){var p=P[k];s+=Math.sin(TP*p[0]*t)*p[1]*(0.65*Math.exp(-t*p[2]*2.2)+0.35*Math.exp(-t*p[2]*0.45));}d[i]=s*Math.min(1,t/0.002)+(t<0.012?rnd()*0.15*Math.exp(-t*400):0);}}
  else if(kind==='rhodes'){for(i=0;i<n;i++){t=i/sr;var ix=2.4*Math.exp(-t*5)+0.35;d[i]=(Math.sin(TP*f*t+ix*Math.sin(TP*f*t))+0.25*Math.sin(TP*f*t*(f<500?14:7))*Math.exp(-t*25))*Math.exp(-t*(0.75+f/1800))*Math.min(1,t/0.0025);}}
  else if(kind==='organ'){var DB=[[0.5,0.55],[1,1],[1.5,0.45],[2,0.6],[3,0.35],[4,0.3],[6,0.15]];for(i=0;i<n;i++){t=i/sr;var s2=0;for(var q=0;q<DB.length;q++){if(DB[q][0]*f<nyq)s2+=Math.sin(TP*DB[q][0]*f*t)*DB[q][1];}d[i]=s2*Math.min(1,t/0.006)+(t<0.006?rnd()*0.08:0);}}
  else if(kind==='melodica'){for(i=0;i<n;i++){t=i/sr;var vib=1+0.004*Math.sin(TP*5.2*t)*Math.min(1,t/0.4),s3=0;for(h=1;h<=15;h+=1){if(h*f>nyq)break;s3+=Math.sin(TP*h*f*vib*t)*(h%2?1:0.35)/h;}d[i]=(s3+rnd()*0.05)*Math.min(1,t/0.03);}}
  else if(kind==='strings'){var T1=wtable(f,24,function(h){return Math.pow(0.82,h)/h;},nyq),det=[-9,0,8];for(var v=0;v<3;v++)wread(T1,d,f*Math.pow(2,det[v]/1200),sr,v*0.37,1);for(i=0;i<n;i++)d[i]*=1+0.02*Math.sin(TP*5.5*i/sr);}
  else if(kind==='pluck'){var N=Math.max(2,Math.round(sr/f)),buf=new Float32Array(N),idx=0;for(i=0;i<N;i++)buf[i]=rnd();var damp=0.996-f/40000;for(i=0;i<n;i++){var a=buf[idx],b=buf[(idx+1)%N];d[i]=a;buf[idx]=(a+b)*0.5*damp;idx=(idx+1)%N;}}
  else if(kind==='saw'){var T2=wtable(f,60,function(h){return 1/h;},nyq),dt=[-7,7];for(var w=0;w<2;w++)wread(T2,d,f*Math.pow(2,dt[w]/1200),sr,w*0.31,1);for(i=0;i<n;i++){t=i/sr;d[i]=(d[i]+0.5*Math.sin(TP*f*0.5*t))*Math.min(1,t/0.003);}}
  else if(kind==='dub'){for(i=0;i<n;i++){t=i/sr;var x=Math.sin(TP*f*t)+0.22*Math.sin(TP*2*f*t)+0.08*Math.sin(TP*3*f*t);d[i]=Math.tanh(1.4*x)*Math.min(1,t/0.006);}}
  else if(kind==='b808'){var ph=0;for(i=0;i<n;i++){t=i/sr;ph+=TP*f*(1+1.2*Math.exp(-t*35))/sr;d[i]=Math.tanh(1.6*Math.sin(ph))*Math.exp(-t*0.9)*Math.min(1,t/0.002);}}
  else if(kind==='sub'){for(i=0;i<n;i++){t=i/sr;d[i]=(Math.sin(TP*f*t)+0.05*Math.sin(TP*2*f*t))*Math.min(1,t/0.008);}}
  else if(kind==='gtr'||kind==='gtrA'||kind==='fbass'){ // Karplus-Strong string, fractional delay, pick-position comb
    var SS=clamp(0.5-0.3*Math.log2(Math.max(1,f/110))/2.6,0.18,0.5),L=sr/f-SS,Li=Math.floor(L),fr=L-Li,br=kind==='gtrA'?0.85:kind==='gtr'?0.55:0.2,damp=Math.min(0.9995,Math.pow(10,-3/(f*(kind==='fbass'?5:kind==='gtrA'?5:7)*Math.pow(110/f,0.5)))),PP=Math.max(1,Math.round(L*(kind==='fbass'?0.22:0.13))),E=new Float32Array(Li+2),lp=0;
    for(i=0;i<E.length;i++){lp+=(rnd()-lp)*br;E[i]=lp;}for(i=E.length-1;i>=PP;i--)E[i]-=E[i-PP];
    for(i=0;i<n;i++){var y=i<E.length?E[i]:0,j=i-Li;if(j>=1){var a1=d[j]*(1-fr)+d[j-1]*fr,b1=j>=2?d[j-1]*(1-fr)+d[j-2]*fr:0;y+=damp*((1-SS)*a1+SS*b1);}d[i]=y;}
    if(kind==='fbass'){for(i=0;i<n;i++){t=i/sr;d[i]=d[i]*0.8+0.5*Math.sin(TP*f*t)*Math.exp(-t*1.1)*Math.min(1,t/0.004);}}
    if(kind==='gtrA'){var bp=0,bv=0,w0=TP*110/sr;for(i=0;i<n;i++){bv+=(d[i]-bp)*w0*2;bp+=bv*w0*2;bv*=0.995;d[i]+=bp*0.25;}}}
  normalize(d);var fo=Math.floor(sr*0.004);for(i=0;i<fo;i++)d[n-1-i]*=i/fo;return d;
}
/* single-cycle band-limited wavetable + reader (fast additive oscillators) */
function wtable(f,maxH,amp,nyq){var L=2048,T=new Float32Array(L+1),TP=2*Math.PI;for(var h=1;h<=maxH;h++){if(h*f>nyq)break;var a=amp(h);for(var i=0;i<L;i++)T[i]+=a*Math.sin(TP*h*i/L+h*0.7);}T[L]=T[0];return T;}
function wread(T,d,f,sr,ph,g){var L=T.length-1,inc=f*L/sr,p=ph*L;for(var i=0;i<d.length;i++){var j=p|0,fr=p-j;d[i]+=g*(T[j]+(T[j+1]-T[j])*fr);p+=inc;if(p>=L)p-=L;}}
function stockSlot(id){
  var D=STOCK[id];if(!D||!ctx)return null;if(D.smp){if(SMP.cache[D.smp]){var zz=SMP.cache[D.smp],md=zz[Math.floor(zz.length/2)];return {name:D.name,stock:id,zones:zz,buf:md.buf,root:md.root,det:true};}if(!offlineRender)setTimeout(function(){smpEnsure(id,true);},0);}var key=id+'@'+ctx.sampleRate;
  if(!stockCache[key]){var sr=ctx.sampleRate,zones=D.zones.map(function(m){var f=mtof(m),dur=D.dur*(m>=72?0.7:1),d=stockGen(D.src||id,f,dur,sr),b=ctx.createBuffer(1,d.length,sr);b.getChannelData(0).set(d);return {buf:b,root:f,m:m};});stockCache[key]=zones;}
  var z=stockCache[key],mid=z[Math.floor(z.length/2)];
  return {name:D.name,stock:id,zones:z,buf:mid.buf,root:mid.root,det:true};
}
function loadStock(id,auto){
  if(!ensureAudio())return;if(!auto&&tracks[selTrack])tracks[selTrack].own=1;if(STOCK[id]&&STOCK[id].smp)smpEnsure(id);var D=STOCK[id],s=stockSlot(id);if(!s)return;allOff();
  slots.A=s;slots.B=Object.assign({},slots.B);engine='sampler';loopOn=D.loop;morphMode='blend';morphBuf=null;morphRoot=s.root;
  setParam('morph',0);Object.keys(D.p).forEach(function(k){setParam(k,D.p[k]);});
  $$('[data-engine]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-engine')==='sampler'?'true':'false');});$('#loop').checked=loopOn;
  slotUI('A');updateMorph();saveSound(selTrack);var t=tracks[selTrack];if(t.n){t.n.f.frequency.setTargetAtTime(normToHz(P.cutoff.v),ctx.currentTime,0.02);t.n.f.Q.value=P.reso.v;}
  renderStockChips();markDirty();toast(t.name+': '+D.name+(D.p.mono?' (mono, glide)':''),1600);
  noteOn('stockdemo',60,0.8);setTimeout(function(){noteOff('stockdemo');},350);
}
function renderStockChips(){var w=$('#stockChips');if(!w)return;var cur=slots.A&&slots.A.stock;
  w.innerHTML=Object.keys(STOCK).map(function(id){return '<button data-stock="'+id+'" aria-pressed="'+(cur===id)+'">'+STOCK[id].name+'</button>';}).join('');
  $$('[data-stock]').forEach(function(b){b.addEventListener('click',function(){loadStock(b.getAttribute('data-stock'));});});}
/* mono / glide memory per track */
var monoLast={};

/* ---------- POCKET: K.O. / Pocket Operator / Riddim style performance tools ---------- */
/* step locks (parameter locks + step multiplier): pt.locks['pad:step']={p:semitones,l:level 0..1,r:ratchet 1..4} */
function lockOf(pt,i,s){return pt.locks?pt.locks[i+':'+s]:null;}
function drumStep(pt,s,t,sd){
  for(var i=0;i<pads.length;i++){var dv=pt.drums[i][s];if(!dv)continue;var vel=typeof dv==='number'?dv:(s%4===0?1:0.82),L=lockOf(pt,i,s),r=L&&L.r>1?L.r:1;
    if(L&&L.l!=null)vel*=L.l;for(var k=0;k<r;k++)trigPad(i,vel*(k?0.85:1),t+k*sd/r,L?L.p||0:0);}
}
/* performance chain on the master: beat-repeat delay, filters, crush, gate, echo + reverb throws, siren */
var PF=null,pfHeld={},pfFader=0;
function perfInsert(force){
  if((offlineRender&&!force)||!N.master||!N.comp)return;try{N.mOut.disconnect(N.comp);}catch(e){}
  var f={};f.in=G(1);f.dry=G(1);f.sum=G(1);
  f.rIn=G(1);f.rd=ctx.createDelay(4);f.rd.delayTime.value=0.5;f.rFb=G(0);f.rOut=G(0);
  f.lp=BQ('lowpass',20000,0.8);f.hp=BQ('highpass',10,0.8);f.cr=ctx.createWaveShaper();f.gate=G(1);f.out=G(1);
  f.eSend=G(0);f.eD=ctx.createDelay(2);f.eFb=G(0.62);f.eLp=BQ('lowpass',2600,0.7);f.eHp=BQ('highpass',260,0.7);
  f.vSend=G(0);f.vConv=ctx.createConvolver();try{f.vConv.buffer=N.conv.buffer;}catch(e){}f.vRet=G(0.9);
  N.mOut.connect(f.in);f.in.connect(f.dry);f.dry.connect(f.sum);
  f.in.connect(f.rIn);f.rIn.connect(f.rd);f.rd.connect(f.rFb);f.rFb.connect(f.rd);f.rd.connect(f.rOut);f.rOut.connect(f.sum);
  f.in.connect(f.eSend);f.eSend.connect(f.eD);f.eD.connect(f.eLp);f.eLp.connect(f.eHp);f.eHp.connect(f.eFb);f.eFb.connect(f.eD);f.eHp.connect(f.sum);
  f.in.connect(f.vSend);f.vSend.connect(f.vConv);f.vConv.connect(f.vRet);f.vRet.connect(f.sum);
  f.sum.connect(f.lp);f.lp.connect(f.hp);f.hp.connect(f.cr);f.cr.connect(f.gate);f.gate.connect(f.out);f.out.connect(N.comp);
  PF=f;pfHeld={};applyFader();
}
function beat(){return 60/P.bpm.v;}
function applyFader(when){if(!PF)return;var now=when||ctx.currentTime,v=pfFader;
  if(!pfHeld.lps&&!pfHeld.tel&&!pfHeld.wob)PF.lp.frequency.setTargetAtTime(v<0?Math.max(120,20000*Math.pow(0.006,-v)):20000,now,0.03);
  if(!pfHeld.hps&&!pfHeld.tel&&!pfHeld.kill)PF.hp.frequency.setTargetAtTime(v>0?Math.min(8000,10*Math.pow(700,v)):10,now,0.03);}
var PFX=[
  {id:'l4',name:'Loop ¼',hint:'repeat the last beat'},{id:'l8',name:'Loop ⅛'},{id:'l16',name:'Loop 1/16'},{id:'l32',name:'Stutter'},
  {id:'tape',name:'Tape stop'},{id:'tapestart',name:'Tape start'},{id:'lps',name:'Filter down'},{id:'hps',name:'Filter up'},{id:'echo',name:'Dub echo'},
  {id:'verb',name:'Reverb throw'},{id:'crush',name:'Bitcrush'},{id:'tel',name:'Telephone'},{id:'siren',name:'Dub siren'},
  {id:'gate',name:'Gate 1/16'},{id:'wob',name:'Wobble'},{id:'kill',name:'Bass kill'},{id:'wash',name:'Washout'},
  {id:'airhorn',name:'Air Horn'},{id:'dubhorn',name:'Dub Horn'}];
function pfOn(id,amt,when){
  if(!ensureAudio()||!PF)return;if(pfHeld[id])pfOff(id,when);var f=PF,now=Math.max(ctx.currentTime,when||0),b=beat();pfHeld[id]={};amt=amt==null?1:amt;
  function loop(len){f.rd.delayTime.cancelScheduledValues(now);f.rd.delayTime.setValueAtTime(len,now);f.rIn.gain.setValueAtTime(0,now+0.002);f.rFb.gain.setValueAtTime(1,now);f.rOut.gain.setTargetAtTime(1,now,0.003);f.dry.gain.setTargetAtTime(0,now,0.003);}
  if(id==='l4')loop(b);else if(id==='l8')loop(b/2);else if(id==='l16')loop(b/4);else if(id==='l32')loop(b/8);
  else if(id==='tape'){var T=Math.max(0.4,b*2*amt),n=64,c=new Float32Array(n);for(var i=0;i<n;i++){var x=T*i/(n-1);c[i]=0.005+x*x/(2*T);}
    f.rIn.gain.setValueAtTime(1,now);f.rFb.gain.setValueAtTime(0,now);f.rd.delayTime.cancelScheduledValues(now);f.rd.delayTime.setValueAtTime(0.005,now);f.rd.delayTime.setValueCurveAtTime(c,now+0.005,T);
    f.rOut.gain.setTargetAtTime(1,now,0.004);f.dry.gain.setTargetAtTime(0,now,0.004);f.out.gain.setTargetAtTime(0,now+T*0.85,0.05);}
  else if(id==='tapestart'){/* spin-up: the read head starts frozen and speeds up to normal; it lands a whole number of 8th notes late so it stays on the grid until released */var A=Math.max(0.5,Math.round(amt*2)/2),T2=Math.max(0.4,b*2*A),n2=64,c2=new Float32Array(n2);for(var i2=0;i2<n2;i2++){var x2=T2*i2/(n2-1);c2[i2]=0.005+x2-x2*x2/(2*T2);}
    f.rIn.gain.setValueAtTime(1,now);f.rFb.gain.setValueAtTime(0,now);f.rd.delayTime.cancelScheduledValues(now);f.rd.delayTime.setValueAtTime(0.005,now);f.rd.delayTime.setValueCurveAtTime(c2,now+0.005,T2);
    f.rOut.gain.setTargetAtTime(1,now,0.004);f.dry.gain.setTargetAtTime(0,now,0.004);f.out.gain.cancelScheduledValues(now);f.out.gain.setValueAtTime(0,now);f.out.gain.linearRampToValueAtTime(1,now+T2*0.4);}
  else if(id==='lps'){f.lp.frequency.cancelScheduledValues(now);f.lp.frequency.setTargetAtTime(220,now,b*0.6);f.lp.Q.setTargetAtTime(6,now,0.05);}
  else if(id==='hps'){f.hp.frequency.cancelScheduledValues(now);f.hp.frequency.setTargetAtTime(2500,now,b*0.6);f.hp.Q.setTargetAtTime(5,now,0.05);}
  else if(id==='echo'){f.eD.delayTime.setValueAtTime(b*0.75,now);f.eSend.gain.setTargetAtTime(0.9,now,0.01);f.eFb.gain.setTargetAtTime(0.72,now,0.01);}
  else if(id==='verb'){f.vSend.gain.setTargetAtTime(1.2,now,0.01);}
  else if(id==='crush'){f.cr.curve=crushCurve(4);}
  else if(id==='tel'){f.hp.frequency.setTargetAtTime(450,now,0.01);f.lp.frequency.setTargetAtTime(2800,now,0.01);f.cr.curve=crushCurve(8);}
  else if(id==='siren'){/* NJD-style dub siren: square oscillator, falling-saw pitch LFO locked to 1/8 notes, pitch rises while held, into the dub echo */
    var o=ctx.createOscillator(),lfo=ctx.createOscillator(),lg=G(-1000),g=G(0),sh=ctx.createWaveShaper(),lpS=BQ('lowpass',2600,1.2);o.type='square';o.frequency.setValueAtTime(420,now);o.frequency.exponentialRampToValueAtTime(840*Math.min(1.4,amt),now+b*4);
    lfo.type='sawtooth';lfo.frequency.value=2/b;lfo.connect(lg);lg.connect(o.detune);
    sh.curve=softClipCurve();o.connect(lpS);lpS.connect(sh);sh.connect(g);g.connect(f.eSend);g.connect(f.sum);g.gain.setTargetAtTime(0.14,now,0.01);
    f.eD.delayTime.setValueAtTime(b*0.75,now);f.eSend.gain.setTargetAtTime(0.85,now,0.02);f.eFb.gain.setTargetAtTime(0.74,now,0.02);o.start(now);lfo.start(now);pfHeld[id]={o:o,lfo:lfo,g:g,lg:lg};}
  else if(id==='gate'){var go=ctx.createOscillator(),gg=G(0.5);go.type='square';go.frequency.value=4/b;go.connect(gg);f.gate.gain.setValueAtTime(0.5,now);gg.connect(f.gate.gain);go.start(now);pfHeld[id]={o:go,g:gg};}
  else if(id==='wob'){var wo=ctx.createOscillator(),wg=G(1400);wo.frequency.value=2/b;f.lp.frequency.cancelScheduledValues(now);f.lp.frequency.setValueAtTime(1600,now);f.lp.Q.setValueAtTime(8,now);wo.connect(wg);wg.connect(f.lp.frequency);wo.start(now);pfHeld[id]={o:wo,g:wg};}
  else if(id==='kill'){f.hp.frequency.setTargetAtTime(280,now,0.01);}
  else if(id==='airhorn'||id==='dubhorn'){var hb=hornBufs[id==='airhorn'?'air':'ragga'];if(!hb){hornPreload();pfHeld[id]={};return;}
    var hs=ctx.createBufferSource(),hg=G(0),he=G(0.35);hs.buffer=hb;hs.playbackRate.value=amt>1.2?1.06:1;hs.connect(hg);hg.connect(f.sum);hg.connect(he);he.connect(f.eSend.gain?f.eD:f.eD);
    hg.gain.setValueAtTime(0,now);hg.gain.linearRampToValueAtTime(0.9,now+0.004);hs.start(now);pfHeld[id]={hs:hs,hg:hg,he:he};}
  else if(id==='wash'){f.vSend.gain.setTargetAtTime(1.4,now,0.02);f.eD.delayTime.setValueAtTime(b*0.5,now);f.eSend.gain.setTargetAtTime(0.7,now,0.02);f.hp.frequency.setTargetAtTime(900,now,b);f.dry.gain.setTargetAtTime(0.4,now,b/2);}
}
function pfOff(id,when){
  if(!PF||!pfHeld[id])return;var f=PF,now=Math.max(ctx.currentTime,when||0),h=pfHeld[id];delete pfHeld[id];
  if(/^l\d|tape/.test(id)&&!Object.keys(pfHeld).some(function(k){return /^l\d|tape/.test(k);})){f.rOut.gain.cancelScheduledValues(now);f.rOut.gain.setTargetAtTime(0,now,0.004);f.rFb.gain.setValueAtTime(0,now+0.01);f.rIn.gain.setValueAtTime(1,now+0.012);f.dry.gain.cancelScheduledValues(now);f.dry.gain.setTargetAtTime(1,now,0.004);
    f.rd.delayTime.cancelScheduledValues(now);f.rd.delayTime.setValueAtTime(0.5,now+0.02);f.out.gain.cancelScheduledValues(now);f.out.gain.setTargetAtTime(1,now,0.01);}
  if(id==='lps'||id==='wob'){f.lp.Q.setTargetAtTime(0.8,now,0.05);}
  if(id==='hps'){f.hp.Q.setTargetAtTime(0.8,now,0.05);}
  if(id==='echo'||id==='siren'||id==='wash'){f.eSend.gain.setTargetAtTime(0,now,0.02);f.eFb.gain.setTargetAtTime(0.62,now+0.01,0.5);}
  if(id==='verb'||id==='wash'){f.vSend.gain.setTargetAtTime(0,now,0.03);f.dry.gain.setTargetAtTime(1,now,0.03);}
  if(id==='crush'||id==='tel'){if(!pfHeld.crush&&!pfHeld.tel)f.cr.curve=null;}
  if(h.o){try{h.o.stop(now+0.05);}catch(e){}if(h.lfo)try{h.lfo.stop(now+0.05);}catch(e){}}
  if(id==='siren'&&h.g)h.g.gain.setTargetAtTime(0,now,0.02);
  if(id==='gate'){try{h.g.disconnect();}catch(e){}f.gate.gain.setTargetAtTime(1,now,0.005);}
  if(id==='wob'){try{h.g.disconnect();}catch(e){}}
  if((id==='airhorn'||id==='dubhorn')&&h.hs){h.hg.gain.cancelScheduledValues(now);h.hg.gain.setValueAtTime(h.hg.gain.value,now);h.hg.gain.setTargetAtTime(0,now,0.05);try{h.hs.stop(now+0.4);}catch(e){}var he=h.he;setTimeout(function(){try{he.disconnect();}catch(e){}},Math.max(0,(now-ctx.currentTime+6)*1000));}
  applyFader(now);
}
/* note repeat */
var nrOn=false,nrRate=4,nrHeld=new Map();
function nrStart(i,vel){var sd=stepDur()*4/nrRate,next=ctx.currentTime;var job={i:i,vel:vel,next:next,timer:null};
  job.timer=setInterval(function(){var now=ctx.currentTime;while(job.next<now+0.08){var semi=keysMode?keySemi(i):0,pi=keysMode?padSel:i;trigPad(pi,job.vel,job.next,semi);(function(tt){setTimeout(function(){recPad(pi,job.vel,semi);},Math.max(0,(tt-now)*1000));})(job.next);job.next+=sd;}},20);
  nrHeld.set(i,job);}
function nrStop(i){var j=nrHeld.get(i);if(j){clearInterval(j.timer);nrHeld.delete(i);}}
/* keys mode (melodic sampler): the 16 pads play the selected pad's sound chromatically */
var keysMode=false,keyScale='minor',SCALES={minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],penta:[0,3,5,7,10],chrom:[0,1,2,3,4,5,6,7,8,9,10,11]};
function keySemi(i){var sc=SCALES[keyScale],row=3-Math.floor(i/4),col=i%4,idx=row*4+col;return Math.floor(idx/sc.length)*12+sc[idx%sc.length]-12;}
/* commit (EP-133): freeze the current pattern into the next free slot, append it to the song and keep playing it */
function commitPattern(){
  var to=-1;for(var i=0;i<8;i++){if(i!==curPat&&!patHas(patterns[i])){to=i;break;}}if(to<0){toast('All 8 patterns are used.');return;}
  var src=patterns[curPat],c=JSON.parse(JSON.stringify({drums:src.drums,notes:src.notes,locks:src.locks||{},len:src.len}));
  patterns[to].drums=c.drums;patterns[to].notes=c.notes;patterns[to].locks=c.locks;patterns[to].len=c.len;
  if(song.indexOf(curPat)<0)song.push(curPat);song.push(to);setPattern(to);if(seq.on&&seq.mode==='pattern')seq.pat=to;markDirty();renderSongUI&&renderSongUI();
  toast('Committed → pattern '+PATN[to]+' (added to the song). Keep jamming to make the next part.',2600);
}
/* step lock editor */
var lockStep=-1;
function openLock(q){lockStep=q;var pt=patterns[curPat],k=padSel+':'+q,L=(pt.locks&&pt.locks[k])||{p:0,l:1,r:1},el=$('#lockEd');el.hidden=false;
  $('#lockT').textContent=pads[padSel].name+' · step '+(q%16+1)+(pt.len>16?' (bar '+(Math.floor(q/16)+1)+')':'');$('#lkP').value=L.p||0;$('#lkL').value=L.l==null?1:L.l;
  $$('[data-lkr]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-lkr')===(L.r||1)?'true':'false');});updLockOut();}
function updLockOut(){$('#lkPo').textContent=(+$('#lkP').value>0?'+':'')+$('#lkP').value+' st';$('#lkLo').textContent=Math.round($('#lkL').value*100)+'%';}
function saveLock(){var pt=patterns[curPat];if(lockStep<0)return;pt.locks=pt.locks||{};var r=1;$$('[data-lkr]').forEach(function(b){if(b.getAttribute('aria-pressed')==='true')r=+b.getAttribute('data-lkr');});
  var L={p:+$('#lkP').value,l:+$('#lkL').value,r:r},k=padSel+':'+lockStep;if(!L.p&&L.l>=0.999&&r===1)delete pt.locks[k];else pt.locks[k]=L;
  if(!pt.drums[padSel][lockStep])pt.drums[padSel][lockStep]=true;markDirty();paintSteps();renderPadDots();}
/* sound-system air horn: three detuned compressed-air reed horns (band-limited pulse/saw), pitch scoop on the attack,
   pressure flutter, pitch sag as the air runs out, bell formants, driver saturation and air hiss */
function dubHornBuf(opt){opt=opt||{};var sr=ctx.sampleRate,dur=opt.dur||1.15,hold=opt.hold||0.85,n=Math.floor(dur*sr),out=new Float32Array(n),TP=2*Math.PI;
  var notes=opt.notes||[311.1,370.0,466.2],seed=7;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;}
  function blep(t,dt){if(t<dt){t/=dt;return t+t-t*t-1;}if(t>1-dt){t=(t-1)/dt;return t*t+t+t+1;}return 0;}
  notes.forEach(function(f0,hi){var ph=Math.random(),jit=0,jt=0,det=[0,7,-9][hi%3]/1200,amp=[1,0.8,0.7][hi%3],delay=hi*0.006;
    for(var i=0;i<n;i++){var t=i/sr-delay;if(t<0)continue;
      if(i%64===0){jt=rnd()*0.10;}jit+=(jt-jit)*0.002;
      var scoop=-2.6*Math.exp(-t/0.045),sag=t>hold?-1.8*(1-Math.exp(-(t-hold)/0.09)):0,flut=0.06*Math.sin(TP*5.3*t+hi);
      var f=f0*Math.pow(2,(scoop+sag+jit+flut)/12+det),dt=f/sr;ph+=dt;if(ph>=1)ph-=1;
      var saw=2*ph-1-blep(ph,dt),p2=ph+0.32;if(p2>=1)p2-=1;var saw2=2*p2-1-blep(p2,dt),pulse=saw-saw2;
      var env=Math.min(1,t/0.012)*(t<0.05?1+0.35*Math.exp(-t/0.02):1)*(t>hold?Math.exp(-(t-hold)/0.07):1);
      var buzz=1+0.12*Math.sin(TP*f*0.5*t);out[i]+=(pulse*0.75+saw*0.35)*env*buzz*amp;}});
  // air hiss, strongest at the attack
  for(var j=0;j<n;j++){var tt=j/sr;out[j]+=rnd()*0.10*(0.4+1.6*Math.exp(-tt/0.04))*(tt>hold?Math.exp(-(tt-hold)/0.05):1)*Math.min(1,tt/0.004);}
  // bell + horn-driver formants
  var a=biq(out,'hp',220,0.7,sr),b1=biq(a,'bp',1150,2.2,sr),b2=biq(a,'bp',2400,3,sr),b3=biq(a,'bp',3500,4,sr),lo=biq(a,'lp',900,0.7,sr);
  var m=new Float32Array(n);for(var k=0;k<n;k++)m[k]=lo[k]*0.55+b1[k]*1.8+b2[k]*1.5+b3[k]*0.6;
  var pk=0;for(k=0;k<n;k++)pk=Math.max(pk,Math.abs(m[k]));for(k=0;k<n;k++){m[k]=Math.tanh(m[k]/pk*2.6);}
  m=biq(biq(m,'lp',6500,0.7,sr),'hp',180,0.7,sr);
  var b=ctx.createBuffer(1,n,sr),d=b.getChannelData(0);d.set(m);normalize(d);var fo=Math.floor(sr*0.01);for(var q=0;q<fo;q++)d[n-1-q]*=q/fo;return b;}
/* dub horns: two recorded versions (user-supplied) + the synthesized one */
