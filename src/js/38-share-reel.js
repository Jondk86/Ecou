var REEL={log:null,busy:false,len:15,mon:true,st:null,blob:null,url:null,name:'',state:'idle',cx:false};
var RFAM={k:'#5CE1E6',g:'#FF8A5B',b:'#B69CFF',d:'#FFC94D',v:'#FF7A9A',s:'#7CF29A'};
function reelFam(ti){var t=tracks[ti]||{},s=((t.name||'')+' '+(t.inst||'')).toLowerCase();
  return /bass/.test(s)?'b':/guit|gtr|strum/.test(s)?'g':/voc|voice|sing|hum|choir/.test(s)?'v':/samp|capt|slice|grain|my sound/.test(s)?'s':'k';}
/* note/pad hooks: only log while a reel render is running (offline context, so live playing is never logged) */
(function(){var pn=playNote,tp=trigPad;
  playNote=function(ti,m,v,t,d){if(REEL.log&&offlineRender)REEL.log.push({t:t,f:reelFam(ti),m:m,v:v==null?0.8:v,d:d||0.2});return pn.apply(this,arguments);};
  trigPad=function(i,v,w){if(REEL.log&&offlineRender){var p=pads[i];REEL.log.push({t:w||0,f:p&&p.user?'s':'d',v:v==null?0.8:v,k:!!(p&&p.cls==='kick')});}return tp.apply(this,arguments);};/* ---- Stage mode: a full-screen overlay for playing live (phone/tablet on a music stand). Launched from Play (header) and Song › Sections; no new tab.
   Reads the song's sections + tempo map through the arrange transport (arrPosNow), or the Backing Band marks when the band plays on its own.
   Next/Prev queue a jump to the next bar line (arr.jump in arrTick; band parts go through bandSetPart's transition queue). Pedal keys + MIDI learn
   are kept in localStorage (ecou.stage), separate from the project. Looper: mic through the ecou-in worklet, bar-quantised when a transport runs. ---- */
var ST={open:false,mode:'idle',si:0,rep:null,q:null,taps:[],wl:null,raf:0,last:{},learn:null,ccSt:{},fl:0,lastBeat:-1};
var STACT=[['play','Play / Stop'],['next','Next section'],['prev','Previous section'],['repeat','Repeat this section'],['tap','Tap tempo'],['enUp','Energy up'],['enDn','Energy down'],['loop','Looper (rec / play / overdub)'],['loopUndo','Looper: undo layer'],['loopClear','Looper: clear'],['ccEnergy','Band energy (CC knob)'],['ccVol','Master volume (CC knob)']];
var STKEYDEF={ArrowRight:'next',PageDown:'next',ArrowLeft:'prev',PageUp:'prev',' ':'play',Enter:'loop'};
var STP=(function(){var d={keys:JSON.parse(JSON.stringify(STKEYDEF)),midi:{},z:1,rn:false};try{var s=JSON.parse(localStorage.getItem('ecou.stage')||'null');if(s){if(s.keys)d.keys=s.keys;if(s.midi)d.midi=s.midi;if(s.z)d.z=s.z;d.rn=!!s.rn;}}catch(e){}return d;}());
function stSave(){try{localStorage.setItem('ecou.stage',JSON.stringify(STP));}catch(e){}}
function stKeyName(k){return k===' '?'Space':k;}
function stSay(t,ms){var el=$('#stMsg');if(!el)return;el.textContent=t||'';clearTimeout(stSay.tm);if(t)stSay.tm=setTimeout(function(){el.textContent='';},ms||2600);}
(function(){var t0=toast;toast=function(m,ms){if(ST.open&&typeof m==='string')stSay(m,ms);return t0.apply(this,arguments);};}());
function stBuild(){if($('#stage'))return;var d=document.createElement('div');d.id='stage';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-label','Stage mode');
  d.innerHTML='<div class="st-top"><div class="st-sec" id="stSec">—<small id="stSub"></small></div><div class="st-pos" id="stPos">1.1</div>'+
    '<button class="st-set" id="stSetB" aria-label="Pedals, MIDI and text size">⚙</button><button class="st-x" id="stExit" aria-label="Exit Stage mode: press and hold">Exit<small style="display:block;font-size:10px;color:#aaa">hold</small><i id="stExitP"></i></button></div>'+
    '<div class="st-main"><div class="st-beats" id="stBeats" aria-hidden="true"></div><div class="st-rn" id="stRn"></div><div class="st-ch" id="stCh" aria-live="polite">—</div><div class="st-nx" id="stNx"></div></div>'+
    '<div class="st-ly"><b id="stLy"></b><span id="stLy2"></span></div><div class="st-msg" id="stMsg" role="status"></div>'+
    '<div class="st-side"><div class="st-ctl">'+
      '<button class="st-b" data-sa="prev">◀◀<small>Prev section</small></button><button class="st-b" data-sa="play" id="stPlay">▶<small>Play</small></button><button class="st-b" data-sa="next">▶▶<small>Next section</small></button><button class="st-b" data-sa="repeat" id="stRep">⟳<small>Repeat</small></button>'+
      '<button class="st-b" data-sa="enDn">−<small>Energy</small></button><button class="st-b" data-sa="enUp">+<small>Energy</small></button><button class="st-b" data-sa="tap" id="stTap">TAP<small id="stBpm">120 bpm</small></button><button class="st-b" data-sa="loop" id="stLoop">● LOOP<small id="stLoopS">tap: record</small></button>'+
    '</div><div class="st-lpx" id="stLpx" hidden><button data-sa="loopUndo">Undo layer</button><button data-sa="loopClear">Clear</button><button id="stKeep">Keep loop</button></div></div>'+
    '<div class="st-learn" id="stLearn" hidden></div>';
  document.body.appendChild(d);
  /* tap zones: pointerdown fires (pedal-like), the looper button also sees the release for long/double press */
  d.addEventListener('pointerdown',function(e){var b=e.target.closest('[data-sa]');if(!b||ST.learn&&ST.learn.k)return;e.preventDefault();var a=b.getAttribute('data-sa');stPress(a,'ui');
    var up=function(){document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);stRelease(a,'ui');};document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);});
  $('#stKeep').addEventListener('click',lpKeep);$('#stSetB').addEventListener('click',function(){stLearnUI(true);});
  /* exit: hold the Exit button 700 ms, or tap with two fingers anywhere; a single stray touch never exits */
  var ex=$('#stExit'),hold=null,hs=0;function cancelHold(){if(hold){cancelAnimationFrame(hold);hold=null;}$('#stExitP').style.width='0';}
  ex.addEventListener('pointerdown',function(e){e.preventDefault();hs=performance.now();cancelHold();(function f(){var p=(performance.now()-hs)/700;$('#stExitP').style.width=Math.min(100,p*100)+'%';if(p>=1){hold=null;stClose();return;}hold=requestAnimationFrame(f);}());});
  ['pointerup','pointercancel','pointerleave'].forEach(function(k){ex.addEventListener(k,function(){if(hold)stSay('Hold Exit for a moment (or tap with two fingers) to leave Stage mode.',1800);cancelHold();});});
  d.addEventListener('touchstart',function(e){if(e.touches.length===2&&!ST.learn&&[].every.call(e.touches,function(t){return !(t.target.closest&&t.target.closest('.st-side,.st-learn,.st-top button'));})){ST.two=performance.now();}else if(e.touches.length>2)ST.two=0;},{passive:true});
  d.addEventListener('touchend',function(e){if(ST.two&&e.touches.length===0){var dt=performance.now()-ST.two;ST.two=0;if(dt<400)stClose();}},{passive:true});
  d.addEventListener('contextmenu',function(e){e.preventDefault();});}
/* ---------- open / close, wake lock, fullscreen ---------- */
function stOpen(from){stBuild();ensureAudio();ST.open=true;ST.from=from||'play';var el=$('#stage');el.hidden=false;el.style.setProperty('--z',STP.z);document.body.classList.add('stage-on');ST.last={};
  if(!bandRunning()&&!(seq.on&&seq.mode==='arrange')){var Lay=secLayout();if(Lay.length){var g=daw.play||0;ST.si=0;Lay.forEach(function(L,i){if(g>=L.s)ST.si=i;});}}
  var hs=$('#hpSheet');if(hs&&hs.parentNode!==el){ST.hpHome=[hs.parentNode,hs.nextSibling];el.appendChild(hs);}
  stWake();try{var r=el.requestFullscreen?el.requestFullscreen({navigationUI:'hide'}):null;if(r&&r.catch)r.catch(function(){});}catch(e){}
  cancelAnimationFrame(ST.raf);ST.raf=requestAnimationFrame(stTick);lpUI();
  if(lpHas()&&(bandRunning()||seq.on))lpStartAll(stGridT0());}
function stClose(){if(!ST.open)return;ST.open=false;ST.learn=null;var el=$('#stage');if(el){el.hidden=true;$('#stLearn').hidden=true;}document.body.classList.remove('stage-on');cancelAnimationFrame(ST.raf);var hs=$('#hpSheet');if(hs&&ST.hpHome){ST.hpHome[0].insertBefore(hs,ST.hpHome[1]);ST.hpHome=null;}
  stRepOff();if(ST.wl){try{ST.wl.release();}catch(e){}ST.wl=null;}try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});}catch(e){}
  lpStopAll();lpMicClose();if(typeof garUpd==='function')garUpd();}
function stWake(){if(!ST.open)return;if(!navigator.wakeLock||!navigator.wakeLock.request){stSay('This browser cannot keep the screen on: set a longer screen timeout in your phone settings.',4500);return;}
  if(ST.wl&&!ST.wl.released)return;navigator.wakeLock.request('screen').then(function(l){ST.wl=l;ST.wlN=(ST.wlN||0)+1;try{l.addEventListener('release',function(){if(ST.wl===l)ST.wl=null;});}catch(e){}},function(){stSay('Could not keep the screen on (battery saver?). Set a longer screen timeout in your phone settings.',4500);});}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&ST.open){stWake();cancelAnimationFrame(ST.raf);ST.raf=requestAnimationFrame(stTick);}});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-stage]');if(b){e.preventDefault();stOpen(b.getAttribute('data-stage'));}});
/* ---------- where are we: song sections (arrange transport + tempo map) or the band on its own ---------- */
function stSongOn(){return !!(seq.on&&seq.mode==='arrange'&&SEC.list.length&&SEC.built);}
function stLyr(s){return String(s&&s.lyric||'').split(/\s*(?:\n|\||\s\/\s)\s*/).filter(function(x){return x;});}
function stSecAt(Lay,g){var i=0;for(var k=0;k<Lay.length;k++)if(g>=Lay[k].s)i=k;return i;}
function stChordAtG(Lay,g){var i=stSecAt(Lay,g),L=Lay[i];if(!L)return null;var s=L.sec,N=L.N,rel=Math.max(0,g-L.s),bar=Math.floor(rel/N),st=rel-bar*N,pr=s.chords.length?s.chords:[[secKey(s),'maj']],c=pr[bar%pr.length],sp=N/2;
  if(c&&c[2])return {c:st>=sp?c[2]:[c[0],c[1]],i:i,bar:bar,st:st,N:N};return {c:c,i:i,bar:bar,st:st,N:N};}
function stBeatSt(N,m){var G=bandGroups(m);return N/Math.max(1,G.length);}
function stState(){var o={sec:'',sub:'',pos:'',c:null,k:GAR.key||0,nx:null,cd:null,ly:'',ly2:'',beat:-1,beats:4,run:false,q:''};
  var Lay=secLayout();
  if(stSongOn()){var g=Math.max(0,arrPosNow()),A=stChordAtG(Lay,g);o.run=true;o.mode='song';if(!A)return o;var L=Lay[A.i],s=L.sec,G=bandGroups(secMeter(s)),gi=0;G.forEach(function(x,j){if(A.st>=x.s)gi=j;});
    ST.si=A.i;o.sec=s.name;o.sub=(A.i+1)+'/'+Lay.length+' · '+s.bars+' bars · '+Math.round(tmSd(g)?60/tmSd(g)/4:P.bpm.v)+' bpm';o.pos=(A.bar+1)+'.'+(gi+1);o.c=A.c;o.k=secKey(s);o.beat=gi;o.beats=G.length;o.g=g;o.bar=A.bar;
    /* next chord change: scan bar starts / split points ahead (up to 32 bars) */
    var bs=stBeatSt(L.N,secMeter(s)),cur=bandChName(A.c),gg=g;for(var n=0;n<64;n++){var B2=stChordAtG(Lay,gg),Lb=Lay[B2.i],nb=Lb.s+(B2.bar+1)*Lb.N,ns=B2.st<Lb.N/2?Lb.s+B2.bar*Lb.N+Lb.N/2:nb;gg=Math.min(ns,nb);if(gg>=Lay[Lay.length-1].s+Lay[Lay.length-1].l)break;var C=stChordAtG(Lay,gg+1e-6);if(C&&bandChName(C.c)!==cur){o.nx=C.c;o.cd=Math.max(1,Math.ceil((gg-g)/bs-1e-6));o.gx=gg;break;}}
    var ly=stLyr(s),li=ly.length?Math.min(ly.length-1,Math.floor(A.bar*ly.length/Math.max(1,s.bars))):-1;o.ly=li>=0?ly[li]:'';
    if(li>=0&&li+1<ly.length)o.ly2=ly[li+1];else{var nxs=Lay[A.i+1];var l2=nxs?stLyr(nxs.sec):[];o.ly2=l2.length?l2[0]:(nxs?'('+nxs.sec.name+')':'');}
    if(arr.jump)o.q='→ '+(Lay[stSecAt(Lay,arr.jump.to)]||{sec:{name:'?'}}).sec.name+' at the next bar';
    if(ST.rep)o.q='⟳ Repeating '+s.name;return o;}
  if(bandRunning()){var now=ctx.currentTime-(ctx.outputLatency||0),m=null;o.run=true;o.mode='band';BR.marks.forEach(function(x){if(x.t<=now+1e-3)m=x;});var Bd=GAR.band;
    var sec=SEC.list.filter(function(x){return x.band===(m?m.part:BR.part);})[0];o.sec=sec?sec.name:'Part '+(m?m.part:BR.part);o.sub='Backing Band · part '+(m?m.part:BR.part)+' · '+Math.round(P.bpm.v)+' bpm · energy '+Math.round((Bd.pen[BR.part]||0)*10);
    if(!m){o.pos='Count';o.c=null;o.sub='Count-in…';return o;}
    var sd=stepDur(),st=Math.floor((now-m.t)/sd+1e-6),half=!!(m.c2&&st>=m.sp),G2=m.G||bandGroups(),gi2=0;G2.forEach(function(x,j){if(st>=x.s)gi2=j;});o.c=half?m.c2:m.c;o.pos=(m.pb+1)+'.'+(gi2+1);o.beat=gi2;o.beats=G2.length;
    var bs2=m.N/Math.max(1,G2.length),cur2=bandChName(o.c);
    if(m.c2&&!half&&bandChName(m.c2)!==cur2){o.nx=m.c2;o.cd=Math.max(1,Math.ceil((m.sp-st)/bs2-1e-6));}
    else{var prog=bandLive(),steps=m.N-st,pb=m.pb;for(var k2=0;k2<16;k2++){var c3=k2===0&&m.n?m.n:prog[(pb+1+k2)%prog.length];if(c3&&bandChName(c3[2]?[c3[0],c3[1]]:c3)!==cur2){o.nx=c3[2]?[c3[0],c3[1]]:c3;o.cd=Math.max(1,Math.ceil(steps/bs2-1e-6));break;}steps+=m.N;}}
    if(sec){var ly2=stLyr(sec),li2=ly2.length?Math.floor((m.pb%Math.max(1,m.len))*ly2.length/Math.max(1,m.len)):-1;o.ly=li2>=0?ly2[li2]:'';o.ly2=li2>=0&&li2+1<ly2.length?ly2[li2+1]:'';}
    if(BR.T&&BR.T.items.part)o.q='→ part '+BR.T.items.part.p+' at bar '+(BR.T.bar-BR.barN>0?'+'+(BR.T.bar-BR.barN):'line');else if(BR.q)o.q='→ part '+BR.q+' after this phrase';return o;}
  /* idle: show the section we would start from */
  o.mode='idle';if(Lay.length){var Li=Lay[Math.min(ST.si,Lay.length-1)],s0=Li.sec,ly0=stLyr(s0);o.sec=s0.name;o.sub='Section '+(ST.si+1)+'/'+Lay.length+' · press Play';o.c=s0.chords[0]||null;o.k=secKey(s0);o.nx=s0.chords[1]||null;o.ly=ly0[0]||'';o.ly2=ly0[1]||'';o.pos='1.1';}
  else{var p=bandPart(GAR.band.edit);o.sec='Backing Band';o.sub='Part '+GAR.band.edit+' · press Play';o.c=p[0];o.nx=p[1]||null;o.pos='1.1';}return o;}
function stSet(id,v,prop){var c=ST.last;if(c[id]===v)return;c[id]=v;var el=document.getElementById(id);if(el)el[prop||'textContent']=v;}
/* the chord fills the free space: as large as the width and the height left by the other lines allow; the text size slider scales it */
function stFit(){var ce=$('#stCh'),mn=ce&&ce.parentNode;if(!mn||!mn.clientWidth)return;ce.style.fontSize='100px';var w=ce.scrollWidth||1,h=ce.offsetHeight||95,W=mn.clientWidth-16,
    H=mn.clientHeight-$('#stNx').offsetHeight-$('#stRn').offsetHeight-$('#stBeats').offsetHeight-14,wf=100*W/w,cap=Math.max(24,Math.min(wf,100*H/h)),fs=Math.min(cap,cap*0.85*STP.z);ce.style.fontSize=Math.floor(fs)+'px';}
window.addEventListener('resize',function(){if(ST.open)ST.refit=true;});
function stTick(){if(!ST.open)return;ST.raf=requestAnimationFrame(stTick);var o;try{o=stState();}catch(e){return;}ST.cur=o;
  var cn=o.c?bandChName(o.c).replace(/#/g,'♯').replace(/b(?=\d|$|m|\/)/g,'♭'):'—';
  var ch0=ST.last.stCh!==cn;stSet('stCh',cn);
  stSet('stRn',STP.rn&&o.c?secRoman(o.c,o.k):'');
  stSet('stNx',o.nx?'then <b>'+xesc(bandChName(o.nx).replace(/#/g,'♯'))+'</b>'+(o.cd!=null&&o.run?'<em class="'+(o.cd<=1?'soon':'')+'">'+o.cd+'</em>':''):'','innerHTML');if(ch0)ST.refit=true;
  var sh=xesc(o.sec||'—')+'<small>'+xesc(o.q||o.sub||'')+'</small>';if(ST.last.stSec!==sh){stSet('stSec',sh,'innerHTML');ST.refit=true;}stSet('stPos',o.pos||'');stSet('stLy',o.ly||'');stSet('stLy2',o.ly2||'');
  if(ST.last.nb!==o.beats){ST.last.nb=o.beats;var h='';for(var i=0;i<o.beats;i++)h+='<i></i>';$('#stBeats').innerHTML=h;ST.lastBeat=-2;}
  var bk=o.run?o.pos:'-';if(bk!==ST.lastBeat){ST.lastBeat=bk;var dots=$('#stBeats').children;for(var j=0;j<dots.length;j++)dots[j].className=j===o.beat&&o.run?'on'+(j===0?' d':''):'';if(o.run&&o.beat>=0){ST.fl=performance.now();$('#stage').className=o.beat===0?'dn':'bt';}}
  if(ST.fl&&performance.now()-ST.fl>110){ST.fl=0;$('#stage').className='';}
  if(ST.last.pl!==o.run){ST.last.pl=o.run;var pb=$('#stPlay');pb.innerHTML=o.run?'■<small>Stop</small>':'▶<small>Play</small>';pb.classList.toggle('on',o.run);}
  var rp=!!ST.rep;if(ST.last.rp!==rp){ST.last.rp=rp;$('#stRep').classList.toggle('on',rp);}
  stSet('stBpm',Math.round(P.bpm.v)+' bpm');if(ST.refit){ST.refit=false;stFit();}lpTick();}
/* ---------- actions ---------- */
function stPress(a,src,t){var tp=t!=null?t:(ctx?ctx.currentTime-(ctx.outputLatency||0):0);
  if(a==='loop'){lpDown(tp);return;}
  if(a==='repeat'){if(ST.rep){stRepOff();stSay('Repeat off: the song carries on.',1400);}else{stRepOn();ST.repT=performance.now();}return;}
  ST.lastAct=a;
  if(a==='play')stPlay();else if(a==='next')stJump(1);else if(a==='prev')stJump(-1);else if(a==='tap')stTap();else if(a==='enUp')stEnergy(0.1);else if(a==='enDn')stEnergy(-0.1);
  else if(a==='loopUndo')lpUndo();else if(a==='loopClear')lpClear();}
function stRelease(a,src){if(a==='loop'){lpUp();return;}if(a==='repeat'&&ST.rep&&ST.repT&&performance.now()-ST.repT>600){stRepOff();stSay('Repeat released.',1200);}}
function stPlay(){if(LP.st==='rec'||LP.st==='dub'){var now=performance.now();
    if(!ST.stopArm||now-ST.stopArm>3000){ST.stopArm=now;stSay('The looper is recording: press Play/Stop again to close the loop and stop (the take is kept), or Loop to close it and play on.',4000);return;}
    ST.stopArm=0;ST.stopAfter=true;lpCycle(ctx.currentTime-(ctx.outputLatency||0));return;}
  if(bandRunning()){bandStop();lpStopAll();return;}if(seq.on){transportStop();stRepOff();lpStopAll();return;}
  var Lay=secLayout();if(Lay.length){var L=Lay[Math.min(ST.si,Lay.length-1)];secPlayFrom(L.s);}else bandStart();
  setTimeout(function(){if(lpHas())lpStartAll(stGridT0());},30);}
function stJump(d){var Lay=secLayout();
  if(stSongOn()){if(arr.rec)return;stRepOff();
    if(arr.jump&&arr.jump.d&&(arr.jump.d>0)!==(d>0)){var hs=Lay[stSecAt(Lay,Math.max(0,arrPosNow()))];arr.jump=null;ST.q=null;stSay('Change cancelled: staying in '+hs.sec.name+'.',1600);return;}
    var jl=arr.jlog&&arr.jlog[arr.jlog.length-1],unheard=jl&&jl.t>ctx.currentTime-(ctx.outputLatency||0)-1e-3;
    var base=arr.jump?stSecAt(Lay,arr.jump.to):unheard?stSecAt(Lay,jl.to):stSecAt(Lay,Math.max(0,arrPosNow())),to=clamp(base+d,0,Lay.length-1),g=arr.g,L=Lay[stSecAt(Lay,g)],at=L.s+Math.ceil((g-L.s)/L.N-1e-9)*L.N;
    if(at<g)at+=L.N;arr.jump={at:at,to:Lay[to].s,d:d};ST.q=arr.jump;stSay((d>0?'Next: ':'Back to: ')+Lay[to].sec.name+' on the next bar line.',1600);return;}
  if(bandRunning()){var parts=['A','B','C'],cur=BR.T&&BR.T.items.part?BR.T.items.part.p:BR.q||BR.part,i=parts.indexOf(cur),p=parts[clamp(i+d,0,2)];if(p!==BR.part||BR.q||BR.T)bandSetPart(p);return;}
  if(Lay.length){ST.si=clamp(ST.si+d,0,Lay.length-1);ST.last={};}else{var ps=['A','B','C'];GAR.band.edit=ps[clamp(ps.indexOf(GAR.band.edit)+d,0,2)];ST.last={};}}
function stRepOn(){var Lay=secLayout();
  if(stSongOn()){var i=stSecAt(Lay,Math.max(0,arrPosNow())),L=Lay[i];arr.jump=null;ST.rep={sv:JSON.parse(JSON.stringify(daw.loop)),i:i};daw.loop.on=true;daw.loop.a=L.s;daw.loop.b=L.s+L.l;stSay('Repeating '+L.sec.name+' until you tap Repeat again.',1800);return;}
  if(bandRunning()){if(BR.T&&BR.T.items.part)bandTrCancel('part');BR.q=null;ST.rep={band:true};stSay('The band repeats this part.',1500);return;}
  stSay('Repeat works while the song plays.',1500);}
function stRepOff(){var R=ST.rep;ST.rep=null;if(!R)return;if(R.sv){daw.loop.on=R.sv.on;daw.loop.a=R.sv.a;daw.loop.b=R.sv.b;}}
/* called from arrTick when a queued jump lands on its bar line */
function stJumped(J,tj){ST.q=null;}
function stTap(){var t=performance.now();ST.taps=ST.taps.filter(function(x){return t-x<2200;});ST.taps.push(t);if(ST.taps.length<2){stSay('Tap tempo: keep tapping…',1200);return;}
  var a=ST.taps.slice(-5),s=0;for(var i=1;i<a.length;i++)s+=a[i]-a[i-1];var bpm=Math.round(60000/(s/(a.length-1)));bpm=clamp(bpm,40,240);setParam('bpm',bpm);stSay('Tempo '+bpm+' bpm'+(daw.tmap&&stSongOn()?' (sections with their own tempo keep it)':''),1500);}
function stEnergy(d,abs){var B=GAR.band,p=bandRunning()?BR.part:B.edit;if(!B.pen)return;var v=abs!=null?abs:clamp((B.pen[p]==null?0.5:B.pen[p])+d,0,1);B.pen[p]=Math.round(v*100)/100;markDirty();
  if(stSongOn())stSay('Energy changes the live Backing Band; the built song keeps its arrangement.',2200);else stSay('Energy '+Math.round(B.pen[p]*10)+'/10'+(bandRunning()?' from the next bar':''),1100);}
/* ---------- pedals / keyboard ---------- */
window.addEventListener('keydown',function(e){if(!ST.open)return;if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(ST.learn&&ST.learn.k){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'){ST.learn=null;stLearnUI(true);return;}stLearnKey(e.key);return;}
  var a=STP.keys[e.key];if(!a){if(e.key!=='Tab'){e.stopImmediatePropagation();}return;}e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;stPress(a,'key');},true);
window.addEventListener('keyup',function(e){if(!ST.open)return;var a=STP.keys[e.key];if(!a)return;e.preventDefault();e.stopImmediatePropagation();stRelease(a,'key');},true);
/* ---------- MIDI learn: notes, CCs and program changes → Stage actions; a CC can drive band energy or master volume ---------- */
function stMidiId(d){var st=d[0]&0xf0,ch=d[0]&15;if(st===0x90||st===0x80)return 'n'+ch+':'+d[1];if(st===0xB0)return 'c'+ch+':'+d[1];if(st===0xC0)return 'p'+ch+':'+d[1];return null;}
function stMidi(d){if(!d||d.length<2)return false;var st=d[0]&0xf0,id=stMidiId(d);if(!id)return false;var on=st===0x90&&d[2]>0||st===0xC0||(st===0xB0&&d[2]>=64);
  if(ST.learn&&ST.learn.m){if(st===0x80||(st===0x90&&!d[2]))return true;var act=ST.learn.m;Object.keys(STP.midi).forEach(function(k){if(STP.midi[k]===act)delete STP.midi[k];});STP.midi[id]=act;stSave();ST.learn=null;stLearnUI(true);stSay('Learned '+stMidiTxt(id)+' → '+stActName(act),2000);return true;}
  var a=STP.midi[id];if(!a)return false;if(!ST.open&&a!=='ccVol')return false;
  if(a==='ccEnergy'||a==='ccVol'){if(st!==0xB0)return true;var v=d[2]/127;if(a==='ccEnergy')stEnergy(0,v);else setParam('vol',Math.round(v*1.2*100)/100);return true;}
  if(st===0xC0){stPress(a,'midi');stRelease(a,'midi');return true;}
  var was=!!ST.ccSt[id];if(on&&!was){ST.ccSt[id]=1;stPress(a,'midi');}else if(!on&&was){ST.ccSt[id]=0;stRelease(a,'midi');}return true;}
function stMidiTxt(id){var t=id.charAt(0),p=id.slice(1).split(':');return (t==='n'?'Note '+p[1]:t==='c'?'CC '+p[1]:'Program '+p[1])+' (ch '+(+p[0]+1)+')';}
function stActName(a){for(var i=0;i<STACT.length;i++)if(STACT[i][0]===a)return STACT[i][1];return a;}
function stMidiAccess(){if(ST.midiOk||!navigator.requestMIDIAccess)return;navigator.requestMIDIAccess().then(function(acc){ST.midiOk=true;var hook=function(){acc.inputs.forEach(function(inp){inp.onmidimessage=onMidi;});};hook();acc.onstatechange=hook;},function(){});}
function stLearnKey(k){var act=ST.learn.k,sl=ST.learn.slot;ST.learn=null;if(sl!=null&&STP.keys[sl]===act)delete STP.keys[sl];
  if(k==='Delete'||k==='Backspace'){stSave();stLearnUI(true);stSay(sl!=null?'Removed '+stKeyName(sl)+' from '+stActName(act)+'.':'Nothing removed.',1800);return;}
  STP.keys[k]=act;stSave();stLearnUI(true);stSay('Learned '+stKeyName(k)+' → '+stActName(act),2000);}
function stLearnUI(show){var el=$('#stLearn');if(!show){el.hidden=true;ST.learn=null;return;}el.hidden=false;
  var h='<h3>Pedals, MIDI &amp; screen</h3><p>Most Bluetooth page-turner pedals send arrow, Page Up/Down, Space or Enter keys. Tap <b>Learn key</b> or <b>Learn MIDI</b>, then press the pedal / move the control. Tap a key to replace it; while it waits, Delete removes it.</p>'+
    '<label>Text size<input type="range" id="stZ" min="0.6" max="1.6" step="0.05" value="'+STP.z+'"></label><label><input type="checkbox" id="stRnC"'+(STP.rn?' checked':'')+'> Show chord numbers (I–V) under the chord</label>';
  STACT.forEach(function(A){var ks=Object.keys(STP.keys).filter(function(k){return STP.keys[k]===A[0];}).map(stKeyName).join(' / '),ms=Object.keys(STP.midi).filter(function(k){return STP.midi[k]===A[0];}).map(stMidiTxt).join(' / '),cc=/^cc/.test(A[0]);
    var wk=ST.learn&&ST.learn.k===A[0],wm=ST.learn&&ST.learn.m===A[0];
    h+='<div class="row"><b>'+A[1]+'</b>'+(cc?'<span></span>':'<span class="st-ks">'+Object.keys(STP.keys).filter(function(k){return STP.keys[k]===A[0];}).map(function(k){var w=wk&&ST.learn.slot===k;return '<button data-lk="'+A[0]+'" data-ls="'+xesc(k)+'" class="'+(w?'w':'')+'">'+(w?'Press a key…':xesc(stKeyName(k)))+'</button>';}).join('')+'<button data-lk="'+A[0]+'" class="'+(wk&&ST.learn.slot==null?'w':'')+'" aria-label="Add a key for '+A[1]+'">'+(wk&&ST.learn.slot==null?'Press a key…':ks?'+ key':'Learn key')+'</button></span>')+'<button data-lm="'+A[0]+'" class="'+(wm?'w':'')+'">'+(wm?'Send MIDI…':ms||'Learn MIDI')+'</button></div>';});
  h+='<p>Looper pedal: one press = record → play → overdub; double press = undo layer; hold = clear.</p><div style="display:flex;gap:8px;margin-top:12px"><button id="stLDef">Reset to defaults</button><button id="stLDone" style="flex:1;border-color:#D4FF3A;color:#D4FF3A">Done</button></div>';
  el.innerHTML=h;
  $('#stZ').addEventListener('input',function(){STP.z=+this.value;$('#stage').style.setProperty('--z',STP.z);ST.last={};ST.refit=true;stSave();});
  $('#stRnC').addEventListener('change',function(){STP.rn=this.checked;stSave();});
  $$('#stLearn [data-lk]').forEach(function(b){b.addEventListener('click',function(){ST.learn={k:b.getAttribute('data-lk'),slot:b.hasAttribute('data-ls')?b.getAttribute('data-ls'):null};stLearnUI(true);});});
  $$('#stLearn [data-lm]').forEach(function(b){b.addEventListener('click',function(){ST.learn={m:b.getAttribute('data-lm')};stMidiAccess();if(!navigator.requestMIDIAccess)stSay('Web MIDI is not available in this browser.',2500);stLearnUI(true);});});
  $('#stLDef').addEventListener('click',function(){STP.keys=JSON.parse(JSON.stringify(STKEYDEF));STP.midi={};stSave();stLearnUI(true);});
  $('#stLDone').addEventListener('click',function(){stLearnUI(false);});}
/* ---------- looper: 1 track, up to 4 layers, bar-quantised over a running transport, free length otherwise ---------- */
var LP={st:'empty',layers:[],L:0,t0:0,mic:null,srcs:[],out:null,pend:null,down:0,dn:0,dt:null};
function lpHas(){return LP.layers.length>0;}
/* bar grid of whatever is playing, in scheduled audio time */
function stGrid(){if(bandRunning()&&BR.marks.length){var m=BR.marks[0];BR.marks.forEach(function(x){if(x.t<=ctx.currentTime)m=x;});return {t:m.t,bar:m.N*stepDur()};}
  if(stSongOn()){var a=arr.anchors,k=a.length-1,now=ctx.currentTime;while(k>0&&a[k].t>now)k--;var A=a[k],sd=tmSd(A.g),Lay=secLayout(),L=Lay[stSecAt(Lay,A.g)],off=((A.g-L.s)%L.N+L.N)%L.N;return {t:A.t-off*sd,bar:L.N*sd};}return null;}
function stGridT0(){if(bandRunning())return BR.t0;if(seq.on&&seq.mode==='arrange')return arr.tl0;return ctx.currentTime+0.05;}
function lpSnap(t,G){var k=(t-G.t)/G.bar,f=Math.floor(k),frac=k-f;return G.t+(frac<0.12?f:f+1)*G.bar;}
function lpMicOpen(cb){if(LP.mic){cb();return;}if(LP.opening)return;if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){micBlocked();return;}LP.opening=true;
  var go=function(){var stream=null;navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(s){stream=s;s._keep=1;/* Stage looper owns it until lpMicClose */return loadInWorklet();}).then(function(){
      var src=ctx.createMediaStreamSource(stream),M={stream:stream,s:src,ch:[],node:null},node;
      var push=function(c){M.ch.push(c);var keepF=c.f-ctx.sampleRate*4;if(LP.st!=='rec'&&LP.st!=='dub'&&!LP.pend)while(M.ch.length>2&&M.ch[0].f+M.ch[0].l.length<keepF)M.ch.shift();};
      if(inModOk){node=new AudioWorkletNode(ctx,'ecou-in',{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'explicit'});node.port.onmessage=function(e){push(e.data);};}
      else{node=ctx.createScriptProcessor(4096,2,2);var cnt=null;node.onaudioprocess=function(ev){var ib=ev.inputBuffer;if(cnt==null)cnt=Math.round(ctx.currentTime*ctx.sampleRate)-4096;push({f:cnt,l:new Float32Array(ib.getChannelData(0)),r:null});cnt+=ib.length;};}
      var z=G(0);src.connect(node);node.connect(z);z.connect(ctx.destination);M.node=node;M.z=z;
      if(VT.hp){M.mon=G(0.9);src.connect(M.mon);M.mon.connect(N.master||ctx.destination);}
      var lat=0;try{var st=stream.getAudioTracks()[0].getSettings();if(st&&typeof st.latency==='number')lat=st.latency;}catch(e){}
      M.lat=lat+recLatency()+(daw.offMs||0)/1000;LP.mic=M;LP.opening=false;cb();
    }).catch(function(){LP.opening=false;if(stream)stream.getTracks().forEach(function(t){t.stop();});micBlocked();});};
  hpAsk('The looper records your microphone over the band.',go,function(){toast('Looper records without monitoring (no headphones). Keep the band quiet so it does not leak into the loop.',3200);go();});}
function lpMicClose(){var M=LP.mic;LP.mic=null;if(!M)return;try{M.s.disconnect();M.node.disconnect();M.z.disconnect();if(M.mon)M.mon.disconnect();}catch(e){}M.stream.getTracks().forEach(function(t){t.stop();});}
/* mono samples of mic audio heard at scheduled audio times [tA,tB) */
function lpGrab(tA,tB){var M=LP.mic,sr=ctx.sampleRate,n=Math.max(1,Math.round((tB-tA)*sr)),out=new Float32Array(n),i0=Math.round((tA+M.lat)*sr);
  M.ch.forEach(function(c){var o=c.f-i0,l=c.l;for(var j=0;j<l.length;j++){var k=o+j;if(k>=0&&k<n)out[k]=l[j];}});return out;}
function lpReady(t,fn){(function w(){if(!LP.mic)return;var M=LP.mic,last=M.ch[M.ch.length-1],sr=ctx.sampleRate;if(last&&(last.f+last.l.length)/sr-M.lat>=t)fn();else setTimeout(w,40);}());}
/* footswitch: one press cycles; double press = undo layer; hold = clear */
function lpDown(tp){LP.down=performance.now();LP.dnT=tp;}
function lpUp(){var held=performance.now()-LP.down;if(!LP.down)return;LP.down=0;if(held>800){clearTimeout(LP.dt);LP.dn=0;lpClear();return;}
  if(LP.dn&&performance.now()-LP.dn<350){clearTimeout(LP.dt);LP.dn=0;lpUndo();return;}
  LP.dn=performance.now();var tp=LP.dnT;clearTimeout(LP.dt);LP.dt=setTimeout(function(){LP.dn=0;lpCycle(tp);},350);}
function lpCycle(tp){if(!ensureAudio())return;var st=LP.st;
  if(st==='stopped'){lpStartAll(stGrid()?stGridT0():ctx.currentTime+0.05);return;}
  if(st==='empty'){var wasOpen=!!LP.mic;lpMicOpen(function(){var G=stGrid(),now=ctx.currentTime-(ctx.outputLatency||0),t=wasOpen?tp:now;LP.grid=!!G;LP.tA=G?lpSnap(t,G):t;LP.G=G;LP.st='rec';lpUI();
      stSay(G?'Recording from the bar line. Press again to close the loop on a bar.':'Recording (free length). Press again to close the loop.',1800);});return;}
  if(st==='rec'){var G=LP.G,tB=G?lpSnap(tp,G):tp;if(G&&tB<=LP.tA+1e-3)tB=LP.tA+G.bar;if(tB-LP.tA<0.25){stSay('Loop too short.',1200);return;}LP.L=tB-LP.tA;LP.t0=LP.tA;LP.st='play';LP.pend=true;lpUI();
    lpReady(tB,function(){var d=lpGrab(LP.tA,tB);lpFade(d);LP.pend=null;lpAddLayer(d);LP.bars=G?Math.round(LP.L/G.bar):0;stSay('Loop: '+(G?LP.bars+' bar'+(LP.bars>1?'s':'')+' · ':'')+LP.L.toFixed(2)+' s',1800);lpUI();lpAfter();});return;}
  if(st==='play'){if(LP.layers.length>=4){stSay('4 layers is the maximum: double-press to undo one first.',2200);return;}if(LP.pend)return;LP.dA=tp;LP.st='dub';lpUI();return;}
  if(st==='dub'){var tA=LP.dA,tB2=tp;LP.st='play';LP.pend=true;lpUI();lpReady(tB2,function(){var raw=lpGrab(tA,tB2),sr=ctx.sampleRate,n=Math.round(LP.L*sr),lay=new Float32Array(n),ph=Math.round((((tA-LP.t0)%LP.L)+LP.L)%LP.L*sr);
      for(var i=0;i<raw.length;i++){lay[(ph+i)%n]+=raw[i];}LP.pend=null;lpAddLayer(lay);stSay('Overdub layer '+LP.layers.length+' added.',1400);lpUI();lpAfter();});return;}}
function lpAfter(){if(ST.stopAfter){ST.stopAfter=false;stPlay();stSay('Loop kept and stopped. Play restarts it with the band.',2400);}}
function lpFade(d){var n=Math.min(64,d.length>>2);for(var i=0;i<n;i++){d[i]*=i/n;d[d.length-1-i]*=i/n;}}
function lpOut(){if(!LP.out){LP.out=ctx.createGain();LP.out.gain.value=1;LP.out.connect(N.master||ctx.destination);}return LP.out;}
function lpAddLayer(d){var sr=ctx.sampleRate,n=Math.max(1,Math.round(LP.L*sr)),b=ctx.createBuffer(1,n,sr),ch=b.getChannelData(0);ch.set(d.length>n?d.subarray(0,n):d);LP.layers.push({buf:b});lpStartLayer(LP.layers[LP.layers.length-1],ctx.currentTime+0.03);}
function lpStartLayer(Lr,when){try{if(Lr.src)Lr.src.stop();}catch(e){}var s=ctx.createBufferSource();s.buffer=Lr.buf;s.loop=true;s.loopStart=0;s.loopEnd=Lr.buf.duration;s.connect(lpOut());
  var off=((((when-LP.t0)%LP.L)+LP.L)%LP.L);s.start(when,Math.min(off,Lr.buf.duration-1e-4));Lr.src=s;Lr.when=when;Lr.off=off;}
function lpStartAll(t0){if(!lpHas())return;LP.t0=t0;LP.layers.forEach(function(Lr){lpStartLayer(Lr,Math.max(t0,ctx.currentTime+0.02));});if(LP.st==='stopped')LP.st='play';lpUI();}
function lpStopAll(){LP.layers.forEach(function(Lr){try{if(Lr.src)Lr.src.stop();}catch(e){}Lr.src=null;});if(LP.st==='rec'||LP.st==='dub'){LP.st=lpHas()?'play':'empty';}if(lpHas())LP.st='stopped';lpUI();}
function lpUndo(){if(LP.st==='rec'){LP.st='empty';lpUI();stSay('Recording cancelled.',1200);return;}if(LP.st==='dub'){LP.st='play';lpUI();stSay('Overdub cancelled.',1200);return;}
  var Lr=LP.layers.pop();if(!Lr){stSay('Nothing to undo.',1000);return;}try{Lr.src.stop();}catch(e){}if(!LP.layers.length){LP.st='empty';LP.L=0;}stSay(LP.layers.length?'Layer removed ('+LP.layers.length+' left).':'Loop removed.',1300);lpUI();}
function lpClear(){LP.layers.forEach(function(Lr){try{Lr.src.stop();}catch(e){}});LP.layers=[];LP.st='empty';LP.L=0;LP.pend=null;lpUI();stSay('Loop cleared.',1200);}
function lpMix(){var sr=ctx.sampleRate,n=LP.layers[0].buf.length,b=ctx.createBuffer(1,n,sr),o=b.getChannelData(0);LP.layers.forEach(function(Lr){var d=Lr.buf.getChannelData(0);for(var i=0;i<n;i++)o[i]+=d[i];});var pk=0;for(var j=0;j<n;j++)pk=Math.max(pk,Math.abs(o[j]));if(pk>0.99)for(var k=0;k<n;k++)o[k]*=0.99/pk;return b;}
function lpKeep(){if(!lpHas()){stSay('Record a loop first.',1400);return;}var ti=firstAudioLane();if(ti<0)return;var b=lpMix(),id=abufAdd(b),sd=stepDur(),Lay=secLayout(),gs=0,dur=b.duration;
  if(Lay.length){var L=Lay[Math.min(ST.si,Lay.length-1)];gs=L.s;var secDur=0;for(var g=L.s;g<L.s+L.l;g++)secDur+=tmSd(g);dur=b.duration*Math.max(1,Math.round(secDur/b.duration));}else gs=Math.round((daw.play||0)/16)*16;
  var c=newClip({type:'aud',ti:ti,s:gs,off:0,dur:dur,buf:id,loop:true,name:'Stage loop'});daw.sel=c.id;dawNeed=true;markDirty();LP.kept=c.id;
  stSay('Loop kept: '+tracks[ti].name+' at bar '+(Math.floor(gs/16)+1)+(Lay.length?' ('+Lay[Math.min(ST.si,Lay.length-1)].sec.name+')':'')+'.',2600);}
function lpUI(){var b=$('#stLoop');if(!b)return;var st=LP.st,lbl={empty:['● LOOP','tap: record'],rec:['● REC',LP.grid?'closes on a bar':'tap: close loop'],play:['▶ LOOP',LP.pend?'…':'tap: overdub'],dub:['● DUB','tap: stop overdub'],stopped:['▶ LOOP','stopped']}[st]||['LOOP',''];
  b.innerHTML=lbl[0]+'<small id="stLoopS">'+lbl[1]+(LP.layers.length?' · '+LP.layers.length+'/4':'')+'</small>';b.className='st-b'+(st==='rec'?' rec':st==='dub'?' dub':st==='play'?' lp':'');$('#stLpx').hidden=!lpHas();}
function lpTick(){if(LP.st==='rec'&&LP.grid){var b=$('#stLoop');var now=ctx.currentTime-(ctx.outputLatency||0);b.classList.toggle('arm',now<LP.tA);b.classList.toggle('rec',now>=LP.tA);}}

})();
var RTPL=[['',[0,4,7]],['m',[0,3,7]],['7',[0,4,7,10]],['maj7',[0,4,7,11]],['m7',[0,3,7,10]],['sus4',[0,5,7]],['sus2',[0,2,7]],['dim',[0,3,6]],['5',[0,7]]];
function reelChordName(pcs,bass){var best=null,bs=-99;for(var r=0;r<12;r++){if(!pcs[r])continue;for(var q=0;q<RTPL.length;q++){var T=RTPL[q][1],sc=0,inT={};
  for(var j=0;j<T.length;j++){var pc=(r+T[j])%12;inT[pc]=1;sc+=pcs[pc]?2:-2;}for(var p=0;p<12;p++)if(pcs[p]&&!inT[p])sc-=1;if(r===bass)sc+=1.5;sc-=T.length*0.05;if(sc>bs){bs=sc;best=GNOTE[r]+RTPL[q][0];}}}return bs>=3?best:null;}
function reelChords(ev,dur){var out=[],prev='';for(var t=0;t<dur;t+=0.25){var pcs=[],bass=-1,lo=999,n=0;
  for(var i=0;i<ev.length;i++){var e=ev[i];if(e.f==='d'||e.m==null)continue;if(e.t>t+0.05)break;if(e.t+e.d>t){var pc=e.m%12;if(!pcs[pc]){pcs[pc]=1;n++;}if(e.m<lo){lo=e.m;bass=pc;}}}
  var nm=n>=2?reelChordName(pcs,bass):null;if(nm)prev=nm;out.push(prev);}return out;}
/* audio clips (captured sounds) have no note events: find their onsets in the rendered audio instead */
function reelOnsets(ch,sr){var H=512,n=Math.floor(ch[0].length/H),E=[],hist=[],last=-1;for(var h=0;h<n;h++){var e=0,o=h*H;for(var i=0;i<H;i++){var x=ch[0][o+i]+ch[1][o+i];e+=x*x;}e/=H;
  var av=hist.length?hist.reduce(function(a,b){return a+b;},0)/hist.length:0;if(e>1e-5&&e>av*2.2&&(h-last)*H/sr>0.08){E.push({t:o/sr,f:'s',v:Math.min(1,Math.sqrt(e)*3),d:0.2,k:e>av*6});last=h;}hist.push(e);if(hist.length>8)hist.shift();}return E;}
function reelMime(){var L=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4;codecs=avc1,opus','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  for(var i=0;i<L.length;i++){try{if(MediaRecorder.isTypeSupported(L[i]))return L[i];}catch(e){}}return '';}
function reelDraw(c,S,t){var g=c.getContext('2d'),W=c.width,H=c.height,u=W/1080,cx=W/2,cy=H*0.46,R=300*u,ev=S.ev,i,j;
  g.globalAlpha=1;g.fillStyle='#0B0B0E';g.fillRect(0,0,W,H);
  var s0=Math.max(0,Math.floor(t*S.sr)),lv=0,L=S.ch[0],Rr=S.ch[1];for(i=0;i<2048&&s0+i<L.length;i+=8){var a=Math.abs(L[s0+i])+Math.abs(Rr[s0+i]);if(a>lv)lv=a;}lv=Math.min(1,lv*0.6);
  /* the glow is drawn once per size and blitted with globalAlpha (same pixels as a per-frame gradient, far cheaper to raster) */
  if(!S.glow||S.glow.width!==W){var gc=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):document.createElement('canvas');gc.width=W;gc.height=H;var gg=gc.getContext('2d'),gr=gg.createRadialGradient(cx,cy,R*0.2,cx,cy,H*0.6);gr.addColorStop(0,'rgba(212,255,58,1)');gr.addColorStop(1,'rgba(11,11,14,0)');gg.fillStyle=gr;gg.fillRect(0,0,W,H);S.glow=gc;}
  g.globalAlpha=0.05+lv*0.08;g.drawImage(S.glow,0,0);g.globalAlpha=1;
  var LIFE=S.rm?0.7:2.4;i=S.i0;while(i<ev.length&&ev[i].t<t-LIFE)i++;S.i0=i;
  var FR={k:0,g:1,b:2,d:3,v:4,s:5};
  for(j=i;j<ev.length&&ev[j].t<=t;j++){var e=ev[j],ag=t-e.t,k=ag/LIFE;g.strokeStyle=RFAM[e.f]||'#fff';g.beginPath();
    if(S.rm){g.globalAlpha=(1-k)*0.8*(0.4+0.6*e.v);g.lineWidth=8*u;g.arc(cx,cy,R+(40+FR[e.f]*34)*u,0,6.2832);}
    else{g.globalAlpha=Math.pow(1-k,2)*(0.35+0.65*e.v);g.lineWidth=(e.k?16:7)*u*(1-k*0.7)+1;g.arc(cx,cy,R+ag*(e.k?640:380+FR[e.f]*40)*u,0,6.2832);}
    g.stroke();}
  g.globalAlpha=0.9;g.strokeStyle='#D4FF3A';g.lineWidth=5*u;g.beginPath();
  if(S.rm){g.arc(cx,cy,R+lv*20*u,0,6.2832);}
  else{var P=180,b0=Math.max(0,s0-1440);for(i=0;i<=P;i++){var x=b0+(i%P)*16,m=x<L.length?(L[x]+Rr[x])*0.5:0,rr=R+Math.max(-1,Math.min(1,m*1.6))*90*u,an=i/P*6.2832-1.5708;if(i)g.lineTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr);else g.moveTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr);}g.closePath();}
  g.stroke();g.globalAlpha=1;g.textAlign='center';g.textBaseline='middle';
  var ch=S.chords[Math.max(0,Math.min(S.chords.length-1,Math.floor(t/0.25)))]||'';g.fillStyle='#F4F4F6';g.font='700 '+Math.round((ch.length>4?120:160)*u)+'px Inter, system-ui, sans-serif';g.fillText(ch||'♪',cx,cy-10*u);
  g.fillStyle='#D4FF3A';g.font='600 '+Math.round(40*u)+'px "JetBrains Mono", ui-monospace, monospace';g.fillText(S.key+' · '+S.bpm+' BPM',cx,cy+110*u);
  g.fillStyle='#D4FF3A';g.font='700 '+Math.round(34*u)+'px Inter, system-ui, sans-serif';g.fillText('E C O U',cx,170*u);
  g.fillStyle='#F4F4F6';g.font='700 '+Math.round(68*u)+'px Inter, system-ui, sans-serif';var ti=S.title.length>22?S.title.slice(0,21)+'…':S.title;g.fillText(ti,cx,260*u);
  g.fillStyle='rgba(255,255,255,.14)';g.fillRect(140*u,H-230*u,800*u,6*u);g.fillStyle='#D4FF3A';g.fillRect(140*u,H-230*u,800*u*Math.max(0,Math.min(1,t/S.dur)),6*u);
  g.fillStyle='rgba(244,244,246,.62)';g.font='500 '+Math.round(34*u)+'px Inter, system-ui, sans-serif';g.fillText('made with Ecou · ecou.geoptimize.io',cx,H-140*u);}
/* Chrome writes WebM without a Duration: add it so players can seek and show the length */
function reelFixWebm(blob,ms){if(!blob.arrayBuffer)return Promise.resolve(blob);return blob.arrayBuffer().then(function(ab){var b=new Uint8Array(ab),n=Math.min(b.length-4,65536);
  function vl(o){var x=b[o],l=1,m=0x80;while(l<8&&!(x&m)){l++;m>>=1;}return l;}function vv(o,l){var v=b[o]&(0xFF>>l);for(var i=1;i<l;i++)v=v*256+b[o+i];return v;}
  for(var i=0;i<n;i++){if(b[i]===0x15&&b[i+1]===0x49&&b[i+2]===0xA9&&b[i+3]===0x66){var so=i+4,sl=vl(so),sz=vv(so,sl),co=so+sl,ce=co+sz;
    for(var j=co;j<ce-1;j++)if(b[j]===0x44&&b[j+1]===0x89)return blob;
    var d=new Uint8Array(11);d[0]=0x44;d[1]=0x89;d[2]=0x88;new DataView(d.buffer).setFloat64(3,ms,false);
    var ns=sz+11,h=new Uint8Array(8);h[0]=1;for(var k=7;k>=1;k--){h[k]=ns&255;ns=Math.floor(ns/256);}
    return new Blob([b.subarray(0,so),h,b.subarray(co,ce),d,b.subarray(ce)],{type:blob.type});}}return blob;});}
function reelUI(st,f){if(st)REEL.state=st;st=REEL.state;var s=$('#rlStat');if(!s)return;
  $('#rlGo').hidden=st==='render'||st==='rec';$('#rlCancel').hidden=!(st==='render'||st==='rec');$('#rlOut').hidden=st!=='done';$('#rlProg').hidden=!(st==='render'||st==='rec');
  $('#rlStage').hidden=st==='idle';$('#rlCv').hidden=st!=='rec'&&st!=='render';$('#rlVid').hidden=st!=='done';$('#rlLen').classList.toggle('dis',st==='render'||st==='rec');if(st==='idle'||st==='done')reelLenUI();
  if(f!=null)$('#rlBar').style.width=Math.round(f*100)+'%';
  s.textContent=st==='render'?'Rendering the audio… '+Math.round((f||0)*100)+'%':st==='rec'?(REEL.mode==='wc'?'Making video… '+Math.round((f||0)*100)+'% (faster than real time — you can close this sheet)':'Recording video… '+Math.round((f||0)*REEL.dur)+' / '+Math.round(REEL.dur)+' s (real time — you can close this sheet)'):st==='done'?REEL.info:'';
  $('#rlGo').textContent=st==='done'?'New video':'Make video';var sb=$('#shareBtn');if(sb)sb.classList.toggle('busy',st==='render'||st==='rec');}
function reelMRok(){return typeof MediaRecorder!=='undefined'&&!!HTMLCanvasElement.prototype.captureStream&&!!(ctx&&ctx.createMediaStreamDestination);}
function reelWCok(){return typeof VideoEncoder!=='undefined'&&typeof AudioEncoder!=='undefined'&&typeof VideoFrame!=='undefined'&&typeof AudioData!=='undefined'&&typeof OfflineAudioContext!=='undefined';}
/* vendored MIT muxers (Vanilagy mp4-muxer / webm-muxer), lazy-loaded; cached by sw.js for offline use */
function reelLoad(path,g){if(window[g])return Promise.resolve(window[g]);
  function one(base){return new Promise(function(res,rej){var s=document.createElement('script');s.src=new URL(path,base).href;s.onload=function(){window[g]?res(window[g]):rej('noload');};s.onerror=function(){s.remove();rej('noload');};document.head.appendChild(s);});}
  return one(document.baseURI).catch(function(){return one(SMPALT);});}
function reelFirst(L,f){return L.reduce(function(p,c){return p.then(function(r){return r||Promise.resolve().then(function(){return f(c);}).then(function(x){return x&&x.supported?c:null;},function(){return null;});});},Promise.resolve(null));}
function reelPickA(){return reelFirst([{codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:2,bitrate:160000},{codec:'opus',sampleRate:48000,numberOfChannels:2,bitrate:160000}],function(c){return AudioEncoder.isConfigSupported(c);});}
function reelPickV(boxes,maxW){var C=[];boxes.forEach(function(bx){[[1080,1920,8e6,'28','40'],[720,1280,5e6,'1f','31']].forEach(function(z){if(z[0]>(maxW||1080))return;
    (bx==='mp4'?['avc1.6400'+z[3],'avc1.4d00'+z[3],'avc1.42e0'+z[3]]:['vp8','vp09.00.'+z[4]+'.08']).forEach(function(cd){var cfg={codec:cd,width:z[0],height:z[1],bitrate:z[2],framerate:30,latencyMode:'quality'};if(bx==='mp4')cfg.avc={format:'avc'};C.push({box:bx,codec:cd,width:z[0],height:z[1],cfg:cfg});});});});
  return reelFirst(C,function(c){return VideoEncoder.isConfigSupported(c.cfg);});}
function reelTo48(ab){if(ab.sampleRate===48000)return Promise.resolve(ab);var oc=new OfflineAudioContext(2,Math.ceil(ab.duration*48000),48000),s=oc.createBufferSource();s.buffer=ab;s.connect(oc.destination);s.start();return oc.startRendering();}
/* codec plan: AAC-LC → MP4 + H.264. No AAC encoder → Opus, still in MP4 + H.264 (measured 1.3x faster than VP8/WebM here; plays in Chrome, Firefox, Safari 17+), WebM VP8/VP9 only without H.264 */
function reelPlan(maxW){var ac;return reelPickA().then(function(a){if(!a)throw 'noaud';ac=a;return reelPickV(a.codec==='opus'?(REEL.opusBoxes||['mp4','webm']):['mp4'],maxW);}).then(function(v){if(!v)throw 'novid';return {a:ac,v:v};});}
function reelWC(cv,S,ab,maxW){var M,vc,ac,venc=null,aenc=null,mux,tgt,err=null,t0=performance.now();REEL.mode='wc';
  function shut(){[venc,aenc].forEach(function(x){try{if(x&&x.state!=='closed')x.close();}catch(e){}});}
  return reelPlan(maxW).then(function(pl){ac=pl.a;vc=pl.v;
    return Promise.all([vc.box==='mp4'?reelLoad('vendor/mp4-muxer/mp4-muxer.js','Mp4Muxer'):reelLoad('vendor/webm-muxer/webm-muxer.js','WebMMuxer'),reelTo48(ab)]);}).then(function(r){
    if(REEL.cx)throw 'cx';M=r[0];var a48=r[1],mp4=vc.box==='mp4',opus=ac.codec==='opus';cv.width=vc.width;cv.height=vc.height;S.big=vc.width;S.i0=0;tgt=new M.ArrayBufferTarget();
    mux=mp4?new M.Muxer({target:tgt,video:{codec:'avc',width:vc.width,height:vc.height,frameRate:30},audio:{codec:opus?'opus':'aac',numberOfChannels:2,sampleRate:48000},fastStart:'in-memory',firstTimestampBehavior:'cross-track-offset'})
      :new M.Muxer({target:tgt,video:{codec:vc.codec==='vp8'?'V_VP8':'V_VP9',width:vc.width,height:vc.height,frameRate:30},audio:{codec:'A_OPUS',numberOfChannels:2,sampleRate:48000},firstTimestampBehavior:'offset'});
    venc=new VideoEncoder({output:function(c,m){mux.addVideoChunk(c,m);},error:function(e){err=e;}});venc.configure(vc.cfg);
    aenc=new AudioEncoder({output:function(c,m){mux.addAudioChunk(c,m);},error:function(e){err=e;}});aenc.configure(ac);
    REEL.st={stop:function(){REEL.cx=true;}};REEL.vinfo=(mp4?'MP4':'WebM')+' · '+(vc.codec.indexOf('avc')===0?'H.264':vc.codec==='vp8'?'VP8':'VP9')+' + '+(opus?'Opus':'AAC');reelUI('rec',0);
    var L=a48.getChannelData(0),R=a48.getChannelData(1),N=L.length,ao=0,F=4800,nf=Math.max(1,Math.round(S.dur*30)),i=0,lu=0,tS=performance.now(),probed=false;REEL.wst={draw:0,vf:0,w:vc.width,codec:vc.codec};
    /* draw on an OffscreenCanvas (cheaper frame readback); the sheet's canvas shows every 5th frame as a preview */
    var oc=cv,pg=null;if(typeof OffscreenCanvas!=='undefined'){try{oc=new OffscreenCanvas(vc.width,vc.height);if(!oc.getContext('2d'))oc=cv;}catch(e){oc=cv;}}if(oc!==cv){cv.width=360;cv.height=640;pg=cv.getContext('2d');}
    function feedA(to){to=Math.min(N,to);while(ao<to){var n=Math.min(F,N-ao),b=new Float32Array(n*2);b.set(L.subarray(ao,ao+n),0);b.set(R.subarray(ao,ao+n),n);
      var d=new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(ao*1e6/48000),data:b});aenc.encode(d);d.close();ao+=n;}}
    return new Promise(function(res,rej){
      function step(){if(err)return rej(err);if(REEL.cx)return rej('cx');var tEnd=performance.now()+24;
        while(i<nf&&performance.now()<tEnd&&venc.encodeQueueSize<6){var tt=i/30;feedA(Math.round((tt+0.5)*48000));var td=performance.now();reelDraw(oc,S,tt);var tv=performance.now();REEL.wst.draw+=tv-td;
          var vf=new VideoFrame(oc,{timestamp:Math.round(i*1e6/30),duration:Math.round(1e6/30)});venc.encode(vf,{keyFrame:i%60===0});vf.close();REEL.wst.vf+=performance.now()-tv;
          if(oc!==cv&&i%5===0)pg.drawImage(oc,0,0,cv.width,cv.height);i++;}
        if(i-lu>=6||i>=nf){lu=i;reelUI('rec',i/nf);}
        /* speed probe: a software encoder that can't beat 1.2x real time at 1080p starts again at 720p */
        if(!probed&&i>=45&&i<nf){probed=true;if(i/((performance.now()-tS)/1000)<36&&vc.width>720)return rej('slow');}
        if(i<nf){setTimeout(step,venc.encodeQueueSize>=6?6:0);return;}
        feedA(N);Promise.all([venc.flush(),aenc.flush()]).then(function(){if(err)throw err;res();}).catch(rej);}
      step();});
  }).then(function(){shut();REEL.st=null;mux.finalize();var mp4=vc.box==='mp4',b=new Blob([tgt.buffer],{type:mp4?'video/mp4':'video/webm'});REEL.encMs=Math.round(performance.now()-t0);
    reelFinish(b,mp4?'mp4':'webm',S,ac.codec==='opus'?'Opus':'AAC',REEL.encMs);},function(e){shut();REEL.st=null;throw e;});}
function reelFinish(b2,ext,S,aud,ms){REEL.busy=false;if(REEL.url)URL.revokeObjectURL(REEL.url);REEL.blob=b2;REEL.url=URL.createObjectURL(b2);REEL.name='ecou-'+safeName(project.name)+'-reel.'+ext;REEL.aud=aud;
  $('#rlVid').src=REEL.url;REEL.info='Video ready · '+dec(S.dur,1)+' s · '+S.big+'×'+Math.round(S.big*16/9)+' · '+(REEL.mode==='wc'?REEL.vinfo:ext.toUpperCase()+' + '+aud)+' · '+dec(b2.size/1048576,1)+' MB'+
    (aud==='Opus'?' — this browser has no AAC audio encoder, so some apps (Instagram, iPhone) may refuse the sound; Chrome on Android/Windows/Mac makes AAC':'');reelUI('done');
  if($('#shareSheet').hidden)toast('Your video is ready — open Share to post it.');}
/* the reel's real length before rendering: timeline/song length (+ the short tail the mix keeps) */
function reelSongLen(){var sd=stepDur();return stemSrc()==='arrange'?arrEnd()*sd:songOrder().reduce(function(a,pi){return a+patterns[pi].len;},0)*sd;}
function reelLenUI(){var L=reelSongLen(),w=$('#rlLen');if(!w)return;var any=false,Lw=Math.min(60,Math.round(L+1));/* whole reel = song + up to 1 s of tail */
  $$('#rlLen button').forEach(function(b){var n=+b.getAttribute('data-rl');if(n){b.hidden=n>=Lw;if(!b.hidden)any=true;}else b.textContent=L>60?'First 60 s':'Whole song';});
  if(REEL.len&&REEL.len>=Lw)REEL.len=0;$$('#rlLen button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-rl')===REEL.len));});
  var i=$('#rlLenInfo');if(i)i.textContent=REEL.len?'~'+REEL.len+' s — the last '+REEL.len+' s of a ~'+Math.round(L)+' s song':L>60?'~60 s — the first minute of a ~'+Math.round(L)+' s song':'~'+Math.max(1,Lw)+' s — whole song';
  var wc=reelWCok(),m=$('#rlMon');if(m)m.closest('label').hidden=wc;var nt=$('#rlNote');if(nt)nt.textContent=wc?'Videos are made faster than real time at a steady 30 fps (up to 60 s). You can close this sheet and keep working.':'Videos record in real time (up to 60 s): this browser can only encode while the song plays. You can close this sheet and keep working.';}
function reelMake(){
  if(REEL.busy){toast('A video is already being made.');return;}if(!ensureAudio())return;if(seq.bounce||stemsRunning){toast('An export is already running.');return;}
  var wc=reelWCok();if(!wc&&!reelMRok()){toast('Video export isn’t supported in this browser — try Chrome.');return;}
  transportStop();REEL.mode=wc?'wc':'mr';REEL.busy=true;REEL.cx=false;REEL.log=[];reelUI('render',0);var sr=ctx.sampleRate;
  waitCal().then(function(){return renderOffline({mode:'mix',spatial:false,src:stemSrc(),onProgress:function(f){if(REEL.state==='render')reelUI('render',f);}});}).then(function(r){
    var ev=REEL.log||[];REEL.log=null;if(REEL.cx)throw 'cx';
    var lat=r.js?Math.round(TRACKLAT*sr):masterLatency(sr),full=r.buf,endS=Math.min(tailLength(full,r.end),Math.round((r.end+1)*sr)+lat),N=REEL.len||60,st=REEL.len?Math.max(lat,endS-N*sr):lat,en=REEL.len?endS:Math.min(endS,lat+N*sr),n=Math.max(sr,en-st);
    var ab=ctx.createBuffer(2,n,sr),ch=[ab.getChannelData(0),ab.getChannelData(1)],fi=Math.floor(sr*0.02),fo=Math.floor(sr*0.3);
    for(var c=0;c<2;c++){var x=full.getChannelData(c);ch[c].set(x.subarray(st,Math.min(x.length,st+n)));if(st>lat)for(var i=0;i<fi;i++)ch[c][i]*=i/fi;for(i=0;i<fo&&i<n;i++)ch[c][n-1-i]*=i/fo;}
    var off=(lat-st)/sr,E=[];if(ev.length<8){ev=reelOnsets(ch,sr);off=0;}if(!ev.length)throw 'empty';ev.forEach(function(e){var t=e.t+off;if(t>-3&&t<n/sr)E.push({t:t,f:e.f,m:e.m,v:e.v,d:e.d,k:e.k});});E.sort(function(a,b){return a.t-b.t;});
    REEL.ev=E;var dur=n/sr,S={ev:E,i0:0,sr:sr,ch:ch,dur:dur,chords:reelChords(E,dur),key:GNOTE[GAR.key||0]+(GAR.minor?' minor':' major'),bpm:Math.round(P.bpm.v),title:(project.name||'Untitled'),rm:!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)};
    REEL.dur=dur;var cv=$('#rlCv');
    /* WebCodecs: frame i is drawn at t=i/30 from the logged events and encoded offline (constant 30 fps, exact sync, faster than real time).
       MediaRecorder (no WebCodecs): real time at 720x1280, dropping to 540x960 if the first second runs under 26 fps */
    var mr=function(){if(!reelMRok())throw 'nosup';REEL.mode='mr';cv.width=720;cv.height=1280;S.big=720;S.i0=0;reelRecord(cv,S,ab);};
    if(!wc)return mr();
    return reelWC(cv,S,ab).catch(function(e){if(e==='slow')return reelWC(cv,S,ab,720);throw e;}).catch(function(e){if(e==='cx')throw e;console.warn('Ecou reel: WebCodecs path failed, using MediaRecorder',e);return mr();});
  }).catch(function(e){REEL.log=null;REEL.busy=false;REEL.st=null;if(e==='cx'&&REEL.mode==='wc')toast('Video cancelled.');if(e==='empty')toast('Nothing to film yet — add a part to the song first.');else if(e!=='cx'){console.error(e);toast('Couldn’t make the video in this browser.');}reelUI(REEL.blob?'done':'idle');});
}
function reelRecord(cv,S,ab){
  var mt=reelMime(),dest=ctx.createMediaStreamDestination(),src=ctx.createBufferSource(),mg=null;src.buffer=ab;src.connect(dest);if(REEL.mon){mg=ctx.createGain();mg.gain.value=1;src.connect(mg);mg.connect(ctx.destination);}
  var vs=cv.captureStream(30),ms=new MediaStream([vs.getVideoTracks()[0],dest.stream.getAudioTracks()[0]]),o=mt?{mimeType:mt,videoBitsPerSecond:cv.width>800?8000000:4500000,audioBitsPerSecond:160000}:{},rec,chunks=[];
  try{rec=new MediaRecorder(ms,o);}catch(e){rec=new MediaRecorder(ms);}
  rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
  var t0=0,tw=0,last=0,raf=0,done=false,p0=0,nd=0,chk=false,redo=false,vt=vs.getVideoTracks()[0];
  function stop(){if(done)return;done=true;cancelAnimationFrame(raf);try{src.stop();}catch(e){}try{src.disconnect();if(mg)mg.disconnect();}catch(e){}try{rec.stop();}catch(e){}}
  REEL.st={stop:stop};
  rec.onstop=function(){ms.getTracks().forEach(function(t){try{t.stop();}catch(e){}});REEL.st=null;REEL.busy=false;var dms=performance.now()-p0;
    if(REEL.cx){reelUI(REEL.blob?'done':'idle');toast('Video cancelled.');return;}
    if(redo){REEL.busy=true;cv.width=540;cv.height=960;S.big=540;S.i0=0;reelRecord(cv,S,ab);return;}
    var ty=(rec.mimeType||mt||'video/webm').split(';')[0],b=new Blob(chunks,{type:ty}),ext=/mp4/.test(ty)?'mp4':'webm',am=rec.mimeType||mt||'';
    (ext==='webm'?reelFixWebm(b,dms):Promise.resolve(b)).then(function(b2){reelFinish(b2,ext,S,/mp4a/.test(am)?'AAC':'Opus',dms);});};
  function fr(){if(done)return;var now=ctx.currentTime,t=now-t0-0.04;/* 40 ms: the MediaStream audio path lags the canvas capture (measured) */if(performance.now()-last>=30){last=performance.now();reelDraw(cv,S,Math.max(0,t));nd++;if(t-tw>0.25){tw=t;reelUI('rec',Math.max(0,Math.min(1,t/S.dur)));}}
    if(!chk&&t>=1){chk=true;var st=null;try{st=vt.stats;}catch(e){}var fps=(st&&st.deliveredFrames>0?st.deliveredFrames:nd)/t;REEL.mrFps=Math.round(fps*10)/10;
      if(fps<26&&cv.width>540){redo=true;stop();return;}}/* real encode rate too low for this phone: start again at 540x960 */
    if(t>S.dur+0.06){stop();return;}raf=requestAnimationFrame(fr);}
  reelDraw(cv,S,0);rec.start(1000);p0=performance.now();t0=ctx.currentTime+0.1;src.start(t0);src.onended=function(){setTimeout(stop,120);};reelUI('rec',0);raf=requestAnimationFrame(fr);
}
function reelCancel(){REEL.cx=true;if(REEL.st)REEL.st.stop();else if(REEL.state==='render')reelUI(REEL.blob?'done':'idle');}
function reelShare(){var b=REEL.blob;if(!b)return;var f=null;try{f=new File([b],REEL.name,{type:b.type});}catch(e){}
  if(f&&navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:project.name||'Ecou',text:'Made with Ecou · ecou.geoptimize.io'}).catch(function(e){if(!e||e.name!=='AbortError')saveBlob(b,REEL.name,'Video saved.');});}
  else saveBlob(b,REEL.name,'Video saved (sharing files isn’t available here).');}
function shareOpen(){var s=$('#shareSheet');s.hidden=false;FLOW.share=true;flowSync();reelUI();try{reelLenUI();}catch(e){}setTimeout(function(){var f=$('#rlGo');if(f&&!f.hidden)f.focus();},30);}
function shareClose(){$('#shareSheet').hidden=true;FLOW.share=false;flowSync();}
function shareInit(){var d=document.createElement('div');d.className='gx-sheet';d.id='shareSheet';d.hidden=true;
  function it(k,t,s){return '<button class="gx-btn sh-it" data-sh="'+k+'"><span><b>'+t+'</b><small>'+s+'</small></span></button>';}
  d.innerHTML='<div class="gx-scrim" data-sclose="1"></div><div class="gx-panel" role="dialog" aria-modal="true" aria-labelledby="shareT"><div class="gx-grab"></div><div class="sh-hd"><h3 id="shareT">06 · Finish &amp; share</h3><button class="gx-btn" id="shareX" aria-label="Close share sheet">✕</button></div>'+
    '<div class="gx-sec"><div class="sh-t"><b>Ripple Reel</b><small>Vertical 9:16 video with ripples, chords and your title — for Shorts, Reels, TikTok</small></div>'+
    '<div class="seg" id="rlLen" role="group" aria-label="Video length"><button data-rl="15" aria-pressed="true">Last 15 s</button><button data-rl="30" aria-pressed="false">Last 30 s</button><button data-rl="60" aria-pressed="false">Last 60 s</button><button data-rl="0" aria-pressed="false">Whole song</button></div><p class="note" id="rlLenInfo"></p>'+
    '<label class="chk"><span>Play the sound while it records</span><input type="checkbox" id="rlMon" checked></label>'+
    '<div id="rlStage" class="sh-stage" hidden><canvas id="rlCv" width="720" height="1280" aria-label="Video being recorded"></canvas><video id="rlVid" controls playsinline hidden aria-label="Video preview"></video></div>'+
    '<div class="sh-prog" id="rlProg" hidden><i id="rlBar"></i></div><p class="note" id="rlStat" aria-live="polite"></p>'+
    '<div class="btns"><button class="gx-btn sh-pri" id="rlGo">Make video</button><button class="gx-btn" id="rlCancel" hidden>Cancel</button></div>'+
    '<div class="btns" id="rlOut" hidden><button class="gx-btn sh-pri" id="rlShare">Share video</button><button class="gx-btn" id="rlDl">Download</button></div>'+
    '<p class="note" id="rlNote">Videos record in real time (up to 60 s): the browser can only encode while the song plays. You can close this sheet and keep working.</p></div>'+
    '<div class="gx-sec"><div class="sh-t"><b>Audio</b></div><div class="seg" id="shBits" role="group" aria-label="WAV bit depth"><button data-bits="24" aria-pressed="true">24-bit</button><button data-bits="16" aria-pressed="false">16-bit (CD)</button></div>'+
    it('wav','Song (WAV)','The whole arrangement, mastered')+it('stems','Stems','One WAV per track + full mix, all from bar 1')+it('rec','Capture output','Record what you play live to a WAV')+'</div>'+
    '<div class="gx-sec"><div class="sh-t"><b>Notes &amp; score</b></div>'+it('midi','MIDI + MusicXML','For any DAW, MuseScore, Sibelius…')+it('score','Sheet music','View, print or save as PDF')+'</div>'+
    '<div class="gx-sec"><div class="sh-t"><b>Project</b></div>'+it('proj','Project backup (.ecou)','Everything, to restore on any device')+it('doc','Song Doctor','Loudness, balance and gentle master check')+'</div></div>';
  document.body.appendChild(d);
  var sb=document.createElement('button');sb.className='hbtn';sb.id='shareBtn';sb.setAttribute('aria-label','Share and export');sb.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var lc=$('#lcd');lc.parentNode.insertBefore(sb,lc.nextSibling);sb.addEventListener('click',shareOpen);
  d.addEventListener('click',function(e){if(e.target.getAttribute('data-sclose'))shareClose();});$('#shareX').addEventListener('click',shareClose);
  d.addEventListener('keydown',function(e){if(e.key==='Escape')shareClose();});
  $$('#rlLen button').forEach(function(b){b.addEventListener('click',function(){if(REEL.busy)return;REEL.len=+b.getAttribute('data-rl');$$('#rlLen button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});reelLenUI();});});
  $$('#shBits button').forEach(function(b){b.addEventListener('click',function(){WAVBITS=+b.getAttribute('data-bits');$$('#shBits button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
  $('#rlMon').addEventListener('change',function(){REEL.mon=this.checked;});
  $('#rlGo').addEventListener('click',reelMake);$('#rlCancel').addEventListener('click',reelCancel);$('#rlShare').addEventListener('click',reelShare);$('#rlDl').addEventListener('click',function(){if(REEL.blob)saveBlob(REEL.blob,REEL.name,'Video saved.');});
  $$('#shareSheet [data-sh]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-sh');
    if(k==='wav'){exportSongOffline(false,stemSrc(),b.querySelector('b'));}
    else if(k==='stems'){$('#stemsBtn').click();var o=b.querySelector('small'),ot=o.textContent,iv=setInterval(function(){if(stemsRunning)o.textContent=$('#stemsBtn').textContent;else{clearInterval(iv);o.textContent=ot;}},200);}
    else if(k==='rec'){shareClose();$('#rec').click();}
    else if(k==='midi')exportNotation();
    else if(k==='score'){shareClose();openScore();}
    else if(k==='proj')exportProject();
    else if(k==='doc'){shareClose();subGo('doctor');}});});
  try{new MutationObserver(function(){if($('#take').classList.contains('show')&&!$('#shareSheet').hidden)shareClose();}).observe($('#take'),{attributes:true,attributeFilter:['class']});}catch(e){}
}
try{shareInit();}catch(e){errLog.push('share: '+e.message);}
/* warm the service-worker cache with the muxer so Ripple Reel also works offline later */
setTimeout(function(){try{if(reelWCok()&&navigator.onLine!==false)['vendor/mp4-muxer/mp4-muxer.js','vendor/webm-muxer/webm-muxer.js'].forEach(function(u){fetch(u).catch(function(){});});}catch(e){}},15000);

