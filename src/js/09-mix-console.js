var mxKeepSheet=false,MIX={rAm:false,rBm:false,tgt:'stream',custom:-14,match:false,last:null},mxBulk=false,mxSel=null,mxEls=[],RKEY=null;
var MXTG=[['stream','Streaming',-14],['apple','Apple',-16],['loud','Loud',-9],['podcast','Podcast',-16],['custom','Custom',null]];
var INSDEF={eq:{n:'EQ',p:{hp:20,lo:0,mf:1000,mid:0,hi:0,lp:20000}},comp:{n:'Comp',p:{thr:-18,ratio:3,att:0.01,rel:0.15,mk:0,key:-1,amt:9,krel:0.15}},sat:{n:'Sat',p:{drive:6,out:-3}},gate:{n:'Gate',p:{thr:-40,floor:-40}},dly:{n:'Delay',p:{time:0.25,fb:0.3,mix:0.25}}};
var INSP={hp:['Low cut',20,1000,'hz'],lo:['Low',-15,15,'db'],mf:['Mid freq',200,6000,'hz'],mid:['Mid',-15,15,'db'],hi:['High',-15,15,'db'],lp:['High cut',1500,20000,'hz'],thr:['Threshold',-60,0,'db'],ratio:['Ratio',1,20,'x'],att:['Attack',0.001,0.1,'ms'],rel:['Release',0.03,1,'ms'],mk:['Makeup',0,18,'db'],amt:['Duck depth',0,24,'db'],krel:['Duck release',0.04,0.6,'ms'],drive:['Drive',0,30,'db'],out:['Output',-18,6,'db'],floor:['Range',-80,0,'db'],time:['Time',0.02,1.5,'ms'],fb:['Feedback',0,0.9,'%'],mix:['Mix',0,1,'%']};
function mixLoad(d){d=d&&typeof d==='object'?d:{};MIX.rAm=!!d.rAm;MIX.rBm=!!d.rBm;MIX.tgt=MXTG.some(function(x){return x[0]===d.tgt;})?d.tgt:'stream';MIX.custom=isFinite(+d.custom)&&d.custom!=null?clamp(+d.custom,-30,-5):-14;MIX.match=!!d.match;MT.tgt=mxTgtVal();}
function mxTgtVal(){var e=MXTG.filter(function(x){return x[0]===MIX.tgt;})[0]||MXTG[0];return e[2]==null?MIX.custom:e[2];}
function insNorm(a){if(!Array.isArray(a))return [];var used={};var out=a.filter(function(s){return s&&INSDEF[s.type];}).slice(0,4).map(function(s,j){var id=s.id!=null&&isFinite(+s.id)&&!used[+s.id]?+s.id:null;if(id==null){id=used[j]?null:j;if(id==null){id=0;while(used[id])id++;}}used[id]=1;var r=insNorm1(s);r.id=id;return r;});return out;}
function insNorm1(s){var p={},D=INSDEF[s.type].p;for(var k in D){var v=s.p&&s.p[k]!=null?+s.p[k]:D[k];if(!isFinite(v))v=D[k];if(INSP[k])v=clamp(v,k==='key'?-1:INSP[k][1],INSP[k][2]);p[k]=v;}p.key=s.p&&isFinite(+s.p.key)?Math.round(+s.p.key):-1;return {type:s.type,on:s.on!==false,p:p};}
function mxOn(t,any){return any?!!t.solo:!t.mute;}
var MXC={};function mxCurve(k){if(MXC[k])return MXC[k];var n=1025,c=new Float32Array(n);for(var i=0;i<n;i++){var x=i/(n-1)*2-1;c[i]=k==='abs'?Math.abs(x):k==='sat'?Math.tanh(4*x):k==='env'?(x>0?Math.tanh(3*x)/Math.tanh(3):0):(x<=0.5?0:(function(u){return u*u*(3-2*u);})(Math.min(1,(x-0.5)/0.5)));}c[(n-1)/2]=0;return (MXC[k]=c);}
function roSkip(ti){return renderOnly!=null&&ti!==renderOnly&&!(RKEY&&RKEY[ti]);}
function mxKeysOf(ti){var o={},t=tracks[ti];(t&&t.ins||[]).forEach(function(s){if(s.on&&s.type==='comp'&&s.p.key>=0)o[s.p.key]=1;});return o;}
function mxSendRoute(t,n){n=n||t.n;if(!n||!n.preM)return;var sp=t.spre||{};[['sr','a'],['sd','b']].forEach(function(q){var d=n[q[0]];try{n.post.disconnect(d);}catch(e){}try{n.preM.disconnect(d);}catch(e){}(sp[q[1]]?n.preM:n.post).connect(d);});}
function insTear(n){(n.insN||[]).forEach(function(o){if(o.tap){try{o.tap.src.disconnect(o.tap.dst);}catch(e){}}(o.all||[]).forEach(function(x){try{x.disconnect();}catch(e){}});});n.insN=[];try{n.insIn.disconnect();}catch(e){}}
function insMake(s,ti){var p=s.p,o={all:[]},a=function(x){o.all.push(x);return x;},sh=function(k){var w=a(ctx.createWaveShaper());w.curve=mxCurve(k);return w;};
  if(s.type==='eq'){o.hp=a(BQ('highpass',20,0.707));o.lo=a(BQ('lowshelf',120,0.7));o.md=a(BQ('peaking',1000,1));o.hi=a(BQ('highshelf',8000,0.7));o.lp=a(BQ('lowpass',20000,0.707));o.hp.connect(o.lo);o.lo.connect(o.md);o.md.connect(o.hi);o.hi.connect(o.lp);o.in=o.hp;o.out=o.lp;}
  else if(s.type==='comp'){o.c=a(ctx.createDynamicsCompressor());o.mk=a(G(1));o.dk=a(G(1));o.c.connect(o.mk);o.mk.connect(o.dk);o.in=o.c;o.out=o.dk;
    var kt=tracks[p.key];if(p.key>=0&&p.key!==ti&&kt&&kt.n&&kt.n.keyT){/* sidechain: envelope follower on the key track drives the gain (fast + slow path, saturated) */
      o.kf=a(BQ('lowpass',140,0.7));o.rc=sh('abs');o.fl=a(BQ('lowpass',30,0.5));o.sl=a(BQ('lowpass',2.3,0.5));o.fg=a(G(0.8));o.sg=a(G(0.45));o.sens=a(G(3));o.sh=sh('env');o.dep=a(G(0));
      kt.n.keyT.connect(o.kf);o.kf.connect(o.rc);o.tap={src:kt.n.keyT,dst:o.kf};o.rc.connect(o.fl);o.rc.connect(o.sl);o.fl.connect(o.fg);o.sl.connect(o.sg);o.fg.connect(o.sens);o.sg.connect(o.sens);o.sens.connect(o.sh);o.sh.connect(o.dep);o.dep.connect(o.dk.gain);}}
  else if(s.type==='sat'){o.pre=a(G(1));o.ws=sh('sat');o.ws.oversample='2x';o.post=a(G(1));o.pre.connect(o.ws);o.ws.connect(o.post);o.in=o.pre;o.out=o.post;}
  else if(s.type==='gate'){o.in=a(G(1));o.vca=a(G(0));o.in.connect(o.vca);o.out=o.vca;o.rc=sh('abs');o.fl=a(BQ('lowpass',40,0.6));o.sens=a(G(1));o.sh=sh('gate');o.gg=a(G(1));o.in.connect(o.rc);o.rc.connect(o.fl);o.fl.connect(o.sens);o.sens.connect(o.sh);o.sh.connect(o.gg);o.gg.connect(o.vca.gain);}
  else{o.in=a(G(1));o.out=a(G(1));o.dry=a(G(1));o.d=a(ctx.createDelay(2));o.lp=a(BQ('lowpass',5000,0.7));o.fb=a(G(0));o.wet=a(G(0));o.in.connect(o.dry);o.dry.connect(o.out);o.in.connect(o.d);o.d.connect(o.lp);o.lp.connect(o.wet);o.wet.connect(o.out);o.lp.connect(o.fb);o.fb.connect(o.d);}
  return o;}
function insApply(t,j){var s=t.ins&&t.ins[j],o=t.n&&t.n.insN&&t.n.insN[j];if(!s||!o||!o.all)return;var p=s.p,now=ctx.currentTime,ny=ctx.sampleRate/2,set=function(pr,v){if(offlineRender){pr.cancelScheduledValues(0);pr.setValueAtTime(v,0);}else pr.setTargetAtTime(v,now,0.02);};
  if(s.type==='eq'){set(o.hp.frequency,p.hp<=20.5?10:p.hp);set(o.lo.gain,p.lo);set(o.md.frequency,p.mf);set(o.md.gain,p.mid);set(o.hi.gain,p.hi);set(o.lp.frequency,p.lp>=19900?ny:Math.min(p.lp,ny));}
  else if(s.type==='comp'){o.c.threshold.value=p.thr;o.c.ratio.value=p.ratio;o.c.knee.value=6;o.c.attack.value=p.att;o.c.release.value=p.rel;set(o.mk.gain,dbg(p.mk));if(o.dep){set(o.dep.gain,-(1-dbg(-p.amt)));set(o.sl.frequency,0.35/p.krel);}}
  else if(s.type==='sat'){set(o.pre.gain,dbg(p.drive)/4);set(o.post.gain,dbg(p.out));}
  else if(s.type==='gate'){var fl=dbg(p.floor);set(o.vca.gain,fl);set(o.gg.gain,1-fl);set(o.sens.gain,dbg(-p.thr));}
  else{set(o.d.delayTime,p.time);set(o.fb.gain,p.fb);set(o.wet.gain,p.mix);}}
function insBuild(t,i){var n=t.n;if(!n||!n.insIn)return;insTear(n);t.ins=insNorm(t.ins);t.ins.forEach(function(s){if(s.p.key===i||s.p.key>=tracks.length)s.p.key=-1;});var cur=n.insIn;
  t.ins.forEach(function(s,j){if(!s.on){n.insN.push({});return;}var o=insMake(s,i);n.insN.push(o);cur.connect(o.in);cur=o.out;});cur.connect(n.av);t.ins.forEach(function(s,j){insApply(t,j);});}
function mxKeyRemap(del){tracks.forEach(function(x){(x.ins||[]).forEach(function(s){if(s.type!=='comp'||s.p.key<0)return;if(s.p.key===del)s.p.key=-1;else if(s.p.key>del)s.p.key--;});});}
function insRebuildAll(){tracks.forEach(function(t,i){if(t.n){mxSendRoute(t);insBuild(t,i);}});}
/* fader law: 0..1 position, 0 dB at ~70 %, +6 dB top, −60 dB then off at the bottom */
function fPos(db){if(!isFinite(db)||db<=-60)return db<=-90||!isFinite(db)?0:0.0001;return 1-Math.sqrt((6-Math.min(6,db))/66);}
function fDb(pos){if(pos<=0.002)return -Infinity;return 6-66*Math.pow(1-Math.min(1,pos),2);}
function mxGet(k){if(k==='rA')return P.rvRet.v;if(k==='rB')return P.dmix.v>0?20*Math.log10(P.dmix.v/0.7):-Infinity;if(k==='mst')return P.vol.v>0?20*Math.log10(P.vol.v/0.8):-Infinity;var t=tracks[+k];var fv=t?aFollowVol(t):null;if(fv!=null)return fv>0.0011?20*Math.log10(fv):-Infinity;return t&&t.vol>0?20*Math.log10(t.vol):-Infinity;}
function mxSet(k,db){if(k==='rA'){setParam('rvRet',clamp(isFinite(db)?db:-12,-12,12));}else if(k==='rB'){setParam('dmix',isFinite(db)?clamp(0.7*dbg(db),0,1):0);}else if(k==='mst'){setParam('vol',isFinite(db)?clamp(0.8*dbg(db),0,1.6):0);}
  else{var i=+k,t=tracks[i];if(!t)return;t.vol=isFinite(db)?Math.min(dbg(6),dbg(db)):0;var sl=document.querySelector('[data-mx="vol"][data-t="'+i+'"]');if(sl){sl.value=t.vol;var o=document.querySelector('[data-mo="'+i+'vol"]');if(o)o.textContent=fVolDb(t.vol);}ensureAudio();applyMix();}markDirty();}
function fDbTxt(db){return !isFinite(db)||db<-59.9?'−∞':(db>0.05?'+':db<-0.05?'−':'')+dec(Math.abs(db),1);}
function mxPaintF(el,k){var db=mxGet(k),th=el.querySelector('.th');el._v=db;th.style.bottom='calc('+(fPos(db)*100)+'% - 9px)';el.setAttribute('aria-valuenow',isFinite(db)?dec(db,1):'-90');el.setAttribute('aria-valuetext',fDbTxt(db)+' dB');var o=el.parentNode.parentNode.querySelector('.mxdb');if(o)o.textContent=fDbTxt(db);}
function mxKnobPaint(el){var i=+el.getAttribute('data-t'),w=el.getAttribute('data-knob'),t=tracks[i];if(!t)return;var v=w==='a'?t.rev:t.dly;el.style.setProperty('--r',(-135+270*v)+'deg');el.setAttribute('aria-valuenow',dec(v,2));}
function mxStrip(k,name,col,kind){var adv='',t=kind==='t'?tracks[+k]:null,i=+k;
  if(t){adv='<div class="mx-adv mxi">'+(t.ins||[]).map(function(s,j){return '<button class="mxin'+(s.on?'':' off')+'" data-mxo="'+k+'" aria-label="'+INSDEF[s.type].n+' insert on '+escH(name)+'">'+INSDEF[s.type].n+(s.type==='comp'&&s.p.key>=0?' SC':'')+'</button>';}).join('')+((t.ins||[]).length<4?'<button class="mxin add" data-mxo="'+k+'" aria-label="Add insert to '+escH(name)+'">+</button>':'')+'</div>'+
    '<div class="mx-adv mxk"><span class="knob" role="slider" tabindex="0" aria-label="'+escH(name)+' send A reverb" data-knob="a" data-t="'+k+'"><i></i></span><span class="knob" role="slider" tabindex="0" aria-label="'+escH(name)+' send B delay" data-knob="b" data-t="'+k+'"><i></i></span></div><div class="mx-adv mxkl"><small>A</small><small>B</small></div>';}
  return '<div class="mxs'+(kind==='m'?' mst':kind==='r'?' ret':'')+'" style="--c:'+col+'"><button class="mxn" data-mxo="'+k+'"><i></i><span>'+escH(name)+'</span></button>'+(t?adv:'<div class="mx-adv mxsp" aria-hidden="true"></div>')+
    '<div class="mxf"><div class="mxm" aria-hidden="true"><i class="pk"></i><i class="rm"></i></div><div class="fdr" role="slider" tabindex="0" aria-label="'+escH(name)+' fader" aria-valuemin="-60" aria-valuemax="6" data-fdr="'+k+'"><i class="th"></i></div></div><output class="mxdb"></output>'+
    (t?'<input class="mx-adv mxpan" type="range" min="-1" max="1" step="0.01" value="'+t.pan+'" data-mxpan="'+k+'" aria-label="'+escH(name)+' pan">':'')+
    (kind==='m'?'<div class="mxms"><span class="mu">'+escH(MXTG.filter(function(x){return x[0]===MIX.tgt;})[0][1])+'</span></div>':'<div class="mxms"><button data-mxm="'+k+'" aria-pressed="'+(kind==='r'?!!MIX[k==='rA'?'rAm':'rBm']:!!t.mute)+'" aria-label="Mute '+escH(name)+'">M</button>'+(t?'<button data-mxsl="'+k+'" aria-pressed="'+!!t.solo+'" aria-label="Solo '+escH(name)+'">S</button>':'<span class="mu" title="Returns are solo-safe">safe</span>')+'</div>')+
    (t?'<button class="mx-adv mxthr" data-thr="'+k+'" aria-label="Dub delay throw on '+escH(name)+' (hold)">Throw</button>':'')+'</div>';}
function escH(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function mxCol(i){var t=tracks[i],k=t.kind,nm=t.name||'';return /drum|kit|beat/i.test(nm)||i===0?'#FFC94D':/bass/i.test(nm)?'#B69CFF':k==='audio'?(/voc|voice|sing/i.test(nm)?'#FF7A9A':'#7CF29A'):/guit|gtr/i.test(nm)?'#FF8A5B':'#5CE1E6';}
function mxRender(){var R=$('#mxR');if(!R||!MIX)return;
  var h=tracks.map(function(t,i){return mxStrip(String(i),t.name,mxCol(i),'t');}).join('')+mxStrip('rA','A Rev','#9AA0B4','r')+mxStrip('rB','B Dly','#9AA0B4','r')+mxStrip('mst','Master','#D4FF3A','m');
  R.innerHTML=h;$$('#mxR .fdr').forEach(function(el){mxDrag(el,'f');mxPaintF(el,el.getAttribute('data-fdr'));});$$('#mxR .knob').forEach(function(el){mxDrag(el,'k');mxKnobPaint(el);});
  $('#mxTg').innerHTML=MXTG.map(function(x){return '<button data-mxt="'+x[0]+'" aria-pressed="'+(MIX.tgt===x[0])+'">'+x[1]+(x[2]!=null?' '+String(x[2]).replace('-','−'):'')+'</button>';}).join('');
  var cu=$('#mxCu');cu.hidden=MIX.tgt!=='custom';cu.value=MIX.custom;$('#mxMatch').checked=!!MIX.match;mxLastTxt();
  if(ctx&&N.mL)trackMeters();
  mxEls=[];$$('#mxR .mxs').forEach(function(s){var f=s.querySelector('.fdr'),k=f.getAttribute('data-fdr');mxEls.push({k:k,f:f,pk:s.querySelector('.pk'),rm:s.querySelector('.rm'),h:0});});
  if(mxSel!=null&&!mxKeepSheet)mxSheet(mxSel);}
function mxLastTxt(){var l=MIX.last,e=$('#mxLast');if(!e)return;e.textContent=l?'Last export: '+dec(l.lu,1)+' LUFS (target '+l.tgt+'), true peak '+dec(l.tp,1)+' dBTP, clean gain '+(l.gain>0?'+':'')+dec(l.gain,1)+' dB.':'';}
function mxAn(k){if(k==='rA'||k==='rB'){var nm=k==='rA'?'mxAA':'mxAB',src=k==='rA'?N.wet:N.dmerge;if(!N[nm]&&src&&!offlineRender){N[nm]=ctx.createAnalyser();N[nm].fftSize=256;src.connect(N[nm]);}return N[nm];}if(k==='mst')return N.an;var t=tracks[+k];return t&&t.n?t.n.an:null;}
var mxBuf=new Float32Array(1024);
function mxTick(st,pk){if(!mxEls.length||!ctx)return;mxEls.forEach(function(e){var an=mxAn(e.k);if(an){var n=Math.min(an.fftSize,1024),b=mxBuf.subarray(0,n);an.getFloatTimeDomainData(b);var p=0,s=0;for(var j=0;j<n;j++){var v=b[j];s+=v*v;if(v<0)v=-v;if(v>p)p=v;}
      var pd=p>1e-5?20*Math.log10(p):-90,rd=s>0?10*Math.log10(s/n):-90;e.h=Math.max(pd,(e.h||-90)-1.2);e.pk.style.transform='scaleY('+clamp((e.h+60)/66,0,1)+')';e.pk.classList.toggle('hot',e.h>-1);e.rm.style.transform='scaleY('+clamp((rd+60)/66,0,1)+')';}
    var db=mxGet(e.k);if(db!==e.f._v&&!(isNaN(db)&&isNaN(e.f._v))&&!e.f._drag)mxPaintF(e.f,e.k);});
  var lu=$('#mxLu');if(lu){lu.textContent=st<-60?'—':dec(st,1);lu.style.color=st>MT.tgt+1?'var(--or)':'';$('#mxTp').textContent='LUFS-S · peak '+(pk>0?dec(20*Math.log10(pk),1):'—');}}
function mxDrag(el,kind){var st=null,lastT=0;
  el.addEventListener('pointerdown',function(e){e.preventDefault();var now=performance.now(),k=el.getAttribute(kind==='f'?'data-fdr':'data-t');
    if(now-lastT<320){lastT=0;if(kind==='f')mxSet(k,0);else{var t=tracks[+k];t[el.getAttribute('data-knob')==='a'?'rev':'dly']=0;ensureAudio();applyMix();markDirty();mxKnobPaint(el);}if(kind==='f')mxPaintF(el,k);return;}lastT=now;
    try{el.setPointerCapture(e.pointerId);}catch(x){}var h=kind==='f'?el.getBoundingClientRect().height:140;st={y:e.clientY,h:h,k:k,v0:kind==='f'?fPos(mxGet(k)):tracks[+k][el.getAttribute('data-knob')==='a'?'rev':'dly']};el._drag=true;});
  el.addEventListener('pointermove',function(e){if(!st)return;var v=clamp(st.v0+(st.y-e.clientY)/st.h,0,1);if(kind==='f'){mxSet(st.k,fDb(v));mxPaintF(el,st.k);}else{var t=tracks[+st.k];t[el.getAttribute('data-knob')==='a'?'rev':'dly']=v;ensureAudio();applyMix();markDirty();mxKnobPaint(el);}});
  var end=function(){st=null;el._drag=false;};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('keydown',function(e){var d=e.key==='ArrowUp'||e.key==='ArrowRight'?1:e.key==='ArrowDown'||e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();var k=el.getAttribute(kind==='f'?'data-fdr':'data-t');if(kind==='f'){var db=mxGet(k);mxSet(k,clamp((isFinite(db)?db:-60)+d,-60,6));mxPaintF(el,k);}else{var t=tracks[+k],w=el.getAttribute('data-knob')==='a'?'rev':'dly';t[w]=clamp(t[w]+d*0.05,0,1);ensureAudio();applyMix();markDirty();mxKnobPaint(el);}});}
function mxThrow(i,on,btn){var t=tracks[i];if(!t||!ensureAudio()||!t.n)return;var n=t.n,now=ctx.currentTime;t._thr=!!on;if(btn)btn.classList.toggle('on',!!on);
  n.sd.gain.cancelScheduledValues(now);n.sd.gain.setValueAtTime(n.sd.gain.value,now);
  if(on){n.sd.gain.setTargetAtTime(1,now,0.006);N.fb.gain.cancelScheduledValues(now);N.fb.gain.setValueAtTime(N.fb.gain.value,now);N.fb.gain.setTargetAtTime(Math.max(P.dfb.v,0.62),now,0.03);if(MIX.rBm||P.dmix.v<0.2)toast('Return B (Delay) is down: raise it to hear the throw.',1600);}
  else{n.sd.gain.setTargetAtTime(mixVals(t).dly,now,0.025);if(!tracks.some(function(x){return x._thr;})){N.fb.gain.cancelScheduledValues(now);N.fb.gain.setValueAtTime(N.fb.gain.value,now);N.fb.gain.setTargetAtTime(P.dfb.v,now+0.5,0.8);}}}
function autoMix(){if(!ensureAudio())return;tracks.forEach(function(t,i){var nm=(t.name||'')+' '+daw.clips.filter(function(c){return c.ti===i;}).map(function(c){return c.name||'';}).join(' ')+' '+((t.sound&&t.sound.slots&&t.sound.slots.A&&(t.sound.slots.A.stock||t.sound.slots.A.name))||''),db;
    if(i===0||/drum|kit|beat|perc/i.test(nm))db=-3;else if(/bass/i.test(nm))db=-5;else if(/voc|vox|voice|sing|lead/i.test(nm))db=-4;else if(/guit|gtr/i.test(nm))db=-8;else if(t.kind==='audio')db=-6;else db=-8;
    t.vol=dbg(db);});applyMix();renderMixer();markDirty();toast('Auto-mix: starting levels set. Pan, mute and solo kept.',1800);}
function mxP(k,v){var d=INSP[k];return d[3]==='hz'?Math.round(v)+' Hz':d[3]==='db'?(v>0?'+':'')+dec(v,1)+' dB':d[3]==='ms'?Math.round(v*1000)+' ms':d[3]==='%'?Math.round(v*100)+'%':dec(v,1)+':1';}
function mxSheet(k){mxSel=k;var S=$('#mxSheet'),B=$('#mxBk');if(k==null){S.hidden=true;B.hidden=true;return;}S.hidden=false;B.hidden=false;var h='',rg=function(lbl,attrs,mn,mx,st,v,txt){return '<label class="ctl"><span class="row"><span>'+lbl+'</span><output>'+txt+'</output></span><input type="range" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'" '+attrs+' aria-label="'+lbl+'"></label>';};
  if(k==='rA'||k==='rB'||k==='mst'){var ps=k==='rA'?['rvRet','space','rvPre','rvLo','rvHi']:k==='rB'?['dmix','dtime','dfb']:['vol','ceil'];h='<div class="row"><strong>'+(k==='rA'?'Return A · Reverb':k==='rB'?'Return B · Delay':'Master')+'</strong><button class="btn" data-mxx>Done</button></div>'+ps.map(function(pk){var p=P[pk];if(!p)return '';return rg(p.label,'data-mxpp="'+pk+'"',p.min,p.max,p.step||((p.max-p.min)/200),p.v,p.fmt?p.fmt(p.v):dec(p.v,2));}).join('')+(k==='mst'?'<p class="note">Target '+mxTgtVal()+' LUFS. With “Match target on export” on, every export (WAV, Ripple Reel) gets clean gain to the target, then the limiter with a −1 dBTP ceiling.</p>':'<p class="note">Returns are solo-safe: soloing a track never mutes them.</p>');}
  else{var i=+k,t=tracks[i];if(!t){mxSheet(null);return;}var sp=t.spre||{};
    h='<div class="row"><strong style="color:'+mxCol(i)+'">'+escH(t.name)+'</strong><button class="btn" data-mxx>Done</button></div>'+
    rg('Fader','data-mxv="'+i+'"',-60,6,0.1,clamp(isFinite(mxGet(k))?mxGet(k):-60,-60,6),fDbTxt(mxGet(k))+' dB')+rg('Pan','data-mxpan="'+i+'"',-1,1,0.01,t.pan,Math.abs(t.pan)<0.02?'C':(t.pan<0?'L':'R')+Math.round(Math.abs(t.pan)*100))+
    '<div class="row mxms" style="justify-content:flex-start;gap:8px"><button data-mxm="'+i+'" aria-pressed="'+!!t.mute+'">M</button><button data-mxsl="'+i+'" aria-pressed="'+!!t.solo+'">S</button><button class="mxthr big" data-thr="'+i+'">Hold: dub throw</button></div>'+
    '<span class="kicker">Sends</span>'+rg('A · Reverb','data-mxsend="rev" data-t="'+i+'"',0,1,0.01,t.rev,fPct(t.rev))+'<label class="chk"><span>A pre-fader</span><input type="checkbox" data-mxpre="a" data-t="'+i+'"'+(sp.a?' checked':'')+'></label>'+
    rg('B · Delay','data-mxsend="dly" data-t="'+i+'"',0,1,0.01,t.dly,fPct(t.dly))+'<label class="chk"><span>B pre-fader</span><input type="checkbox" data-mxpre="b" data-t="'+i+'"'+(sp.b?' checked':'')+'></label>'+
    '<span class="kicker">Inserts '+(t.ins||[]).length+'/4 · top to bottom, before the fader</span>'+
    (t.ins||[]).map(function(s,j){var D=INSDEF[s.type];return '<div class="fx mxis"><div class="row"><strong>'+(j+1)+' · '+D.n+'</strong><div class="row" style="gap:4px"><button class="mv" data-mxon="'+j+'" aria-pressed="'+s.on+'" aria-label="'+D.n+' on">'+(s.on?'On':'Off')+'</button><button class="mv" data-mxup="'+j+'" aria-label="Move up"'+(j?'':' disabled')+'>↑</button><button class="mv" data-mxdn="'+j+'" aria-label="Move down"'+(j<t.ins.length-1?'':' disabled')+'>↓</button><button class="mv" data-mxdel="'+j+'" aria-label="Remove '+D.n+'">✕</button></div></div>'+
      (s.type==='comp'?'<label class="ctl"><span>Sidechain key (ducks this track)</span><select data-mxkey="'+j+'"><option value="-1">None</option>'+tracks.map(function(x,q){return q===i?'':'<option value="'+q+'"'+(s.p.key===q?' selected':'')+'>'+escH(x.name)+'</option>';}).join('')+'</select></label>':'')+
      Object.keys(D.p).filter(function(pk){return pk!=='key'&&!(s.type==='comp'&&(pk==='amt'||pk==='krel')&&s.p.key<0);}).map(function(pk){var d=INSP[pk];return rg(d[0],'data-mxip="'+pk+'" data-j="'+j+'"',d[1],d[2],({hz:1,db:0.1,ms:0.001,'%':0.01,x:0.1})[d[3]],s.p[pk],mxP(pk,s.p[pk]));}).join('')+'</div>';}).join('')+
    ((t.ins||[]).length<4?'<div class="btns">'+Object.keys(INSDEF).map(function(ty){return '<button class="btn" data-mxadd="'+ty+'">+ '+INSDEF[ty].n+'</button>';}).join('')+'</div>':'');}
  S.innerHTML=h;S.setAttribute('data-k',k);}
function mxInsChange(i,fn){var t=tracks[i];t.ins=insNorm(t.ins);fn(t);ensureAudio();insBuild(t,i);markDirty();mxRender();}
function initMix(){var R=$('#mxR'),S=$('#mxSheet');
  function hold(root){root.addEventListener('pointerdown',function(e){var b=e.target.closest('[data-thr]');if(!b)return;e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(x){}mxThrow(+b.getAttribute('data-thr'),true,b);});
    var up=function(e){var b=e.target.closest('[data-thr]');if(b&&b.classList.contains('on'))mxThrow(+b.getAttribute('data-thr'),false,b);};root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);root.addEventListener('contextmenu',function(e){if(e.target.closest('[data-thr]'))e.preventDefault();});}
  hold(R);hold(S);
  function clicks(root){root.addEventListener('click',function(e){var b;
    if((b=e.target.closest('[data-mxo]'))){mxSheet(b.getAttribute('data-mxo'));return;}
    if((b=e.target.closest('[data-mxm]'))){var k=b.getAttribute('data-mxm');if(k==='rA'||k==='rB'){var f=k==='rA'?'rAm':'rBm';MIX[f]=!MIX[f];ensureAudio();if(k==='rA')P.rvRet.on(P.rvRet.v);else P.dmix.on(P.dmix.v);}else{tracks[+k].mute=!tracks[+k].mute;ensureAudio();applyMix();}markDirty();renderMixer();return;}
    if((b=e.target.closest('[data-mxsl]'))){var t=tracks[+b.getAttribute('data-mxsl')];t.solo=!t.solo;ensureAudio();applyMix();markDirty();renderMixer();return;}
    if(e.target.closest('[data-mxx]')){mxSheet(null);return;}
    var k2=S.getAttribute('data-k'),i=+k2;
    if((b=e.target.closest('[data-mxadd]'))){var ty=b.getAttribute('data-mxadd');mxInsChange(i,function(t){if(t.ins.length<4)t.ins.push({type:ty,on:true,p:JSON.parse(JSON.stringify(INSDEF[ty].p))});});return;}
    if((b=e.target.closest('[data-mxon]'))){var j=+b.getAttribute('data-mxon');mxInsChange(i,function(t){t.ins[j].on=!t.ins[j].on;});return;}
    if((b=e.target.closest('[data-mxup]'))){var j2=+b.getAttribute('data-mxup');mxInsChange(i,function(t){var x=t.ins.splice(j2,1)[0];t.ins.splice(j2-1,0,x);});return;}
    if((b=e.target.closest('[data-mxdn]'))){var j3=+b.getAttribute('data-mxdn');mxInsChange(i,function(t){var x=t.ins.splice(j3,1)[0];t.ins.splice(j3+1,0,x);});return;}
    if((b=e.target.closest('[data-mxdel]'))){var j4=+b.getAttribute('data-mxdel');mxInsChange(i,function(t){t.ins.splice(j4,1);});return;}
    if((b=e.target.closest('[data-mxt]'))){MIX.tgt=b.getAttribute('data-mxt');MT.tgt=mxTgtVal();$$('[data-tgt]').forEach(function(x){x.setAttribute('aria-pressed',+x.getAttribute('data-tgt')===MT.tgt?'true':'false');});markDirty();mxRender();return;}
  });}
  clicks($('#mxCard'));clicks(S);
  S.addEventListener('input',function(e){var x=e.target,k=S.getAttribute('data-k'),i=+k,t=tracks[i],v=+x.value,o=x.parentNode.querySelector('output');
    if(x.hasAttribute('data-mxpp')){var pk=x.getAttribute('data-mxpp');ensureAudio();setParam(pk,v);markDirty();if(o)o.textContent=P[pk].fmt?P[pk].fmt(P[pk].v):dec(v,2);return;}
    if(!t)return;
    if(x.hasAttribute('data-mxv')){mxSet(k,v<=-59.9?-Infinity:v);if(o)o.textContent=fDbTxt(mxGet(k))+' dB';}
    else if(x.hasAttribute('data-mxpan')){t.pan=v;ensureAudio();applyMix();markDirty();if(o)o.textContent=Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);}
    else if(x.hasAttribute('data-mxsend')){t[x.getAttribute('data-mxsend')]=v;ensureAudio();applyMix();markDirty();if(o)o.textContent=fPct(v);}
    else if(x.hasAttribute('data-mxip')){var j=+x.getAttribute('data-j'),pk2=x.getAttribute('data-mxip');t.ins[j].p[pk2]=v;ensureAudio();insApply(t,j);markDirty();if(o)o.textContent=mxP(pk2,v);}});
  S.addEventListener('change',function(e){var x=e.target,i=+S.getAttribute('data-k'),t=tracks[i];if(!t)return;
    if(x.hasAttribute('data-mxpre')){t.spre=t.spre||{a:false,b:false};t.spre[x.getAttribute('data-mxpre')]=x.checked;ensureAudio();mxSendRoute(t);markDirty();}
    else if(x.hasAttribute('data-mxkey')){var j=+x.getAttribute('data-mxkey');mxInsChange(i,function(t){t.ins[j].p.key=+x.value;});}
    else if(x.type==='range'){mxKeepSheet=true;try{renderMixer();}finally{mxKeepSheet=false;}}});
  R.addEventListener('input',function(e){var x=e.target;if(x.hasAttribute('data-mxpan')){var t=tracks[+x.getAttribute('data-mxpan')];t.pan=+x.value;ensureAudio();applyMix();markDirty();}});
  $('#mxBk').addEventListener('click',function(){mxSheet(null);});
  $('#mxAuto').addEventListener('click',autoMix);
  $('#mxMatch').addEventListener('change',function(){MIX.match=this.checked;markDirty();});
  $('#mxCu').addEventListener('change',function(){var cv=parseFloat(this.value);MIX.custom=isFinite(cv)?clamp(cv,-30,-5):MIX.custom;this.value=MIX.custom;MT.tgt=mxTgtVal();markDirty();});
  $$('[data-tgt]').forEach(function(b){b.addEventListener('click',function(){var v=+b.getAttribute('data-tgt'),m=MXTG.filter(function(x){return x[2]===v;})[0];MIX.tgt=m?m[0]:'custom';if(!m)MIX.custom=v;mxRender();});});
  try{new IntersectionObserver(function(es){es.forEach(function(e){document.body.classList.toggle('mx-vis',e.isIntersecting);});}).observe(R);}catch(e){}
  mxRender();}
/* sidechain-aware loudness match on export: clean gain (secant search) then the existing look-ahead limiter at ≤ −1 dBTP */
function mxMatch(m,sr){var tgt=mxTgtVal(),ceil=Math.min(P.ceil?P.ceil.v:-1,-1),L0=loudness(m,sr);if(L0<-69){jsMaster(m,sr,ceil);return;}
  var test=function(d){var g=dbg(d),c=[new Float32Array(m[0].length),new Float32Array(m[1].length)];for(var i=0;i<c[0].length;i++){c[0][i]=m[0][i]*g;c[1][i]=m[1][i]*g;}jsMaster(c,sr,ceil);return {lu:loudness(c,sr),c:c,d:d};};
  var a=test(clamp(tgt-L0,-40,30)),b=null;
  for(var it=0;it<4&&Math.abs(a.lu-tgt)>0.12;it++){var sl=b?clamp((a.lu-b.lu)/((a.d-b.d)||1e-3),0.15,1.2):1,nd=clamp(a.d+(tgt-a.lu)/sl,-40,30);b=a;a=test(nd);}
  m[0].set(a.c[0]);m[1].set(a.c[1]);m.gr=a.c.gr;MIX.last={lu:a.lu,tp:truePeak(a.c),gain:a.d,tgt:tgt};setTimeout(mxLastTxt,0);}

/* ---------- PROJECTS ---------- */
