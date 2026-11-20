var hist={stack:[],idx:-1,timer:null,lock:false,last:''};
function histCommit(){
  if(hist.lock||!ctx||offlineRender)return;
  var sv=serialize(),key=JSON.stringify(sv.data),ck=histCk(key);if(ck===hist.last)return;
  hist.stack=hist.stack.slice(0,hist.idx+1);hist.stack.push({data:JSON.parse(key),bufs:sv.bufs,key:key,ck:ck});
  if(hist.stack.length>80)hist.stack.shift();hist.idx=hist.stack.length-1;hist.last=ck;updUndoUI();
}
/* comparison key: the selected track and the timeline zoom (ppx, refitted after a load) are view state, and a stock sound's root changes when its recorded samples finish loading; neither is an edit */
function histCk(key){return key.replace(/"selTrack":\d+,?/,'').replace(/"ppx":[-\d.e]+,?/,'').replace(/"root":[^,]+,"det":true,"buf":null,"stock"/g,'"stock"');}
/* automatic changes (Garage preparing an instrument) are folded into the current undo entry: no new step, undo is never blocked */
function histQuiet(fn){
  if(hist.lock||!ctx||offlineRender||hist.idx<0)return fn();
  clearTimeout(hist.timer);histCommit();hist.lock=true;try{fn();}finally{hist.lock=false;}
  var sv=serialize(),key=JSON.stringify(sv.data),ck=histCk(key);if(ck===hist.last)return;
  hist.stack[hist.idx]={data:JSON.parse(key),bufs:sv.bufs,key:key,ck:ck};hist.last=ck;
}
function histSchedule(){if(hist.lock)return;clearTimeout(hist.timer);hist.timer=setTimeout(histCommit,450);}
function histReset(){hist.stack=[];hist.idx=-1;hist.last='';histCommit();}
function histGo(d){
  clearTimeout(hist.timer);histCommit();
  var j=hist.idx+d;if(j<0||j>=hist.stack.length)return;
  var e=hist.stack[j],pid=project.id,wasPlaying=seq.on,mode=seq.mode,kp=padSel,kpg=page,ks=songSel,kcp=curPat,kst=selTrack,bw=bandRunning(),bk=GAR.key,bmi=GAR.minor,bmo=GAR.band.mode;hist.lock=true;hist.keepBand=bw;
  try{loadProjectData(JSON.parse(e.key),e.bufs);
    /* undo/redo while the band plays: the band keeps playing; a restored key is applied like any key change (queued to the bar line when transitions are on) */
    if(bw&&bandRunning()){BR.bass=bandTrack('bass');BR.keys=bandTrack('keys');var k1=GAR.key,m1=GAR.minor,mo1=GAR.band.mode;
      if((k1!==bk||mo1!==bmo)&&bandTrOn()){GAR.key=bk;GAR.minor=bmi;GAR.band.mode=bmo;GAR.chords=null;bandKeyChanged(k1,m1);bandTrSnap();bandKeyReq(k1,null,mo1);}}}
  finally{hist.lock=false;hist.keepBand=false;}
  if(patterns[kcp]&&curPat!==kcp){hist.lock=true;try{setPattern(kcp);}finally{hist.lock=false;}}if(tracks[kst]&&selTrack!==kst&&tracks[kst].kind==='keys'){hist.lock=true;try{selectTrack(kst);}finally{hist.lock=false;}}
  page=Math.min(kpg,patterns[curPat].len/16-1);selectPad(kp);if(tracks[ks])songSel=ks;renderPatSegs();renderTrackSegs();paintSteps();drawRoll();
  project.id=pid;hist.idx=j;hist.last=e.ck;dirty=true;$('#saveState').textContent='Unsaved changes';updUndoUI();
  if(wasPlaying)transportStart(mode);
  toast(d<0?'Undo':'Redo',800);
}
function updUndoUI(){$('#undoBtn').disabled=hist.idx<=0;$('#redoBtn').disabled=hist.idx>=hist.stack.length-1;}

/* ---------- UI ---------- */
var TABH={'t-home':'home','t-gar':'garage','t-cap':'capture','t-ins':'instrument','t-mod':'modulation','t-pad':'pads','t-song':'song','t-daw':'studio','t-fx':'mix'},overlay=null;
function hideOverlayEls(name){if(name==='tab'){tabHide();return;}if(name==='score'){$('#scoreOv').hidden=true;$('#scoreInner').innerHTML='';}if(name==='take')$('#take').classList.remove('show');}
function pushOverlay(name){overlay=name;try{if(location.hash!=='#'+name)location.hash=name;}catch(e){}}
function closeOverlay(name){hideOverlayEls(name);if(overlay===name){overlay=null;try{if(location.hash==='#'+name)history.back();}catch(e){}}}
function showTab(id,fromHash){if(!TABH[id])return;var tt=$('#toast');if(tt&&showTab.cur!==id){tt.classList.remove('show');}if(FLOW)FLOW.share=false;
  $$('.tab').forEach(function(t){t.classList.toggle('active',t.id===id);});
  $('main').scrollTop=0;$('#kbwrap').hidden=id==='t-pad'||id==='t-home'||id==='t-fx';showTab.cur=id;var KBS=showTab.kb||(showTab.kb={});setKbCollapsed(id in KBS?KBS[id]:(id==='t-daw'||id==='t-song'||id==='t-fx'));
  if(id==='t-song'){renderSongUI();drawRoll();}if(id==='t-pad'){paintSteps();updJam();}if(id==='t-daw')dawShown();if(id==='t-home')homeShown();document.body.classList.toggle('on-gar',id==='t-gar');if(id==='t-gar')garShown();else if(GAR.apOn>=0)garApStop();navSync();
  if(!fromHash){try{if(location.hash!=='#'+TABH[id])location.hash=TABH[id];}catch(e){}}}
window.addEventListener('hashchange',function(){var h=(location.hash||'').slice(1);
  if(overlay&&h!==overlay){var o=overlay;overlay=null;hideOverlayEls(o);}
  for(var k in TABH)if(TABH[k]===h){showTab(k,true);return;}});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(overlay){closeOverlay(overlay);e.preventDefault();return;}if(!$('#projList').hidden){$('#projList').hidden=true;$('#storeUse').hidden=true;}});
window.addEventListener('beforeunload',function(e){if(dirty&&ctx){try{saveProject(true);}catch(x){}e.preventDefault();e.returnValue='';}});

/* ---------- v2 navigation: 5 tabs over the 8 legacy panels (ids unchanged) ---------- */
var NAV5={sub:{play:'inst',sound:'t-cap',song:'t-song',mix:'t-fx'},
  subs:{play:[['inst','Instruments'],['pads','Pads'],['loops','Loops']],sound:[['t-cap','Capture'],['t-ins','Synth+Morph'],['t-mod','Motion']],song:[['t-song','Sections'],['tracks','Tracks'],['t-daw','Studio']],mix:[['t-fx','Mixer'],['doctor','Song Doctor']]},
  of:{'t-home':'home','t-cap':'sound','t-ins':'sound','t-mod':'sound','t-pad':'play','t-song':'song','t-daw':'song','t-fx':'mix'}};
var FLOW={share:false,steps:['Capture','Transform','Play','Create','Produce','Share']};
function navCur(){var id=showTab.cur||'t-pad';if(id==='t-gar'){var v=GAR.view;return v==='tracks'?'song':'play';}return NAV5.of[id]||'play';}
function subCur(){var id=showTab.cur||'t-pad';if(id==='t-fx')return DOC&&DOC.view?'doctor':'t-fx';if(id==='t-gar')return GAR.view==='tracks'?'tracks':GAR.view==='loops'?'loops':'inst';return id==='t-pad'?'pads':id;}
function subGo(k){if(k==='doctor'||k==='t-fx'){docShow(k==='doctor');showTab('t-fx');return;}if(k==='pads'){showTab('t-pad');return;}
  if(k==='loops'||k==='tracks'){GAR.view=k;if(showTab.cur==='t-gar')garView(k);else showTab('t-gar');return;}
  if(k==='inst'){if(GAR.inst&&!(showTab.cur==='t-gar'&&GAR.view==='play')){GAR.view='play';GAR.surf=true;if(showTab.cur==='t-gar')garView('play');else showTab('t-gar');}else{GAR.view='sounds';if(showTab.cur==='t-gar')garView('sounds');else showTab('t-gar');}return;}
  showTab(k);}
function navGo(n){if(n==='home'){showTab('t-home');return;}
  if(n==='mix'){subGo(NAV5.sub.mix||'t-fx');return;}subGo(NAV5.sub[n]);}
function flowCur(){if(FLOW.share||$('#take').classList.contains('show')||!$('#scoreOv').hidden)return 5;var n=navCur(),id=showTab.cur;
  return n==='home'||id==='t-cap'?0:n==='sound'?1:n==='play'?2:n==='song'?3:4;}
function flowGo(i){if(i===0)showTab('t-cap');else if(i===1)showTab('t-ins');else if(i===2)navGo('play');else if(i===3)navGo('song');else if(i===4)showTab('t-fx');
  else shareOpen();}
function flowSync(){var c=flowCur(),f=$('#flow');if(!f)return;if(!f.firstChild){f.innerHTML=FLOW.steps.map(function(s,i){return '<button data-fl="'+i+'" aria-label="Step 0'+(i+1)+' '+s+'"><b>0'+(i+1)+'</b><span>'+s+'</span></button>';}).join('');
    $$('#flow button').forEach(function(b){b.addEventListener('click',function(){flowGo(+b.getAttribute('data-fl'));});});}
  $$('#flow button').forEach(function(b,i){b.className=i===c?'on':i<c?'done':'';if(i===c)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function navSync(){var n=navCur(),k=subCur(),sn=$('#subnav');
  $$('nav button[data-nav]').forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-nav')===n?'true':'false');});
  var L=NAV5.subs[n];if(L){if(k)NAV5.sub[n]=k;if(sn.getAttribute('data-for')!==n){sn.setAttribute('data-for',n);sn.setAttribute('aria-label',n.charAt(0).toUpperCase()+n.slice(1)+' views');
      sn.innerHTML=L.map(function(e){return '<button role="tab" data-sub="'+e[0]+'">'+e[1]+'</button>';}).join('')+(n==='play'?'<button class="sub-stage" data-stage="play" aria-label="Stage mode: full screen for playing live">Stage</button>':'');
      $$('#subnav button[data-sub]').forEach(function(b){b.addEventListener('click',function(){subGo(b.getAttribute('data-sub'));});});}
    $$('#subnav button').forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-sub')===k?'true':'false');});}
  sn.hidden=!L;document.body.setAttribute('data-nav',n);flowSync();if(typeof lnQSync==='function')lnQSync();if(showTab.cur==='t-song'&&typeof secRender==='function')secRender();}
$$('nav button[data-nav]').forEach(function(b){b.addEventListener('click',function(){navGo(b.getAttribute('data-nav'));});});
try{var _fo=new MutationObserver(function(){flowSync();});_fo.observe($('#take'),{attributes:true,attributeFilter:['class']});_fo.observe($('#scoreOv'),{attributes:true,attributeFilter:['hidden']});}catch(e){}
navSync();
var _unusedNav=[];[].forEach(function(b){b.addEventListener('click',function(){
  $$('nav button').forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');});
  $$('.tab').forEach(function(t){t.classList.toggle('active',t.id===b.getAttribute('data-tab'));});
  $('main').scrollTop=0;
  $('#kbwrap').hidden=b.getAttribute('data-tab')==='t-pad';
  if(b.getAttribute('data-tab')==='t-song'){renderSongUI();drawRoll();}
  if(b.getAttribute('data-tab')==='t-pad')paintSteps();
});});
function setPro(on){document.body.classList.toggle('is-pro',on);$('#mPro').setAttribute('aria-pressed',on);toast(on?'Advanced mode: all controls visible.':'Basic mode: essentials only.',1400);}
$('#mPro').addEventListener('click',function(){setPro(!document.body.classList.contains('is-pro'));});
$$('[data-engine]').forEach(function(b){b.addEventListener('click',function(){
  if(ctx)allOff();engine=b.getAttribute('data-engine');
  $$('[data-engine]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
  if(engine==='fm'&&!fmP)fmP=FMV[0].p.slice();renderFM();if(ctx&&!loadingSound)saveSound(selTrack);
  toast(engine==='granular'?'Granular: the source is resynthesized from overlapping micro-grains. Sweep Pad X to scan it.':engine==='fm'?'FM: a 6-operator DX7-style synth. Pick a voice, import .syx, or Sound Match your capture.':'Sampler: the full source, repitched across the keys.',2600);
});});
$('#loop').addEventListener('change',function(e){loopOn=e.target.checked;markDirty();});
$$('[data-mm]').forEach(function(b){b.addEventListener('click',function(){setMorphMode(b.getAttribute('data-mm'));});});
$('#octDn').addEventListener('click',function(){if(octave>1){if(ctx)allOff();octave--;buildKeyboard();}});
$('#octUp').addEventListener('click',function(){if(octave<7){if(ctx)allOff();octave++;buildKeyboard();}});
var kb=$('#kb');
kb.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();try{kb.setPointerCapture(e.pointerId);}catch(x){}handlePtr(e);});
kb.addEventListener('pointermove',function(e){if(ptr.has(e.pointerId))handlePtr(e);});
['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){kb.addEventListener(ev,endPtr);});
kb.addEventListener('contextmenu',function(e){e.preventDefault();});
window.addEventListener('resize',function(){layoutBlacks();if(ctx){drawWave($('#wave-A'),slots.A.buf.getChannelData(0));drawWave($('#wave-B'),slots.B.buf.getChannelData(0));}});
function clearPatternsAll(){patterns.forEach(function(pt){pt.drums.forEach(function(a){a.fill(false);});pt.notes=[[],[],[],[]];pt.locks={};});song=[];daw.clips=[];daw.init=true;bindPads();renderPads();renderPatSegs();paintSteps();drawRoll();renderPadDots();}
$('#startFresh').addEventListener('click',function(){ensureAudio();$('#start').style.display='none';clearPatternsAll();setTimeout(histReset,0);$('#projName').value=project.name;showTab('t-home');0;});
$('#startBtn').addEventListener('click',function(){ensureAudio();$('#start').style.display='none';
  var last=null;try{last=localStorage.getItem('ecou.last');}catch(e){}
  if(last)safeOpen(last);else{$('#projName').value=project.name;}
});
/* open the last project, then make sure sound is actually flowing; if not, restart the engine, and as a last resort start a new project */
function audioHealthy(){if(!ctx||ctx.state!=='running')return false;var pk=masterPeak();return !nanSeen&&!isNaN(pk);}
function safeOpen(id){
  var p;try{p=openProject(id);}catch(e){p=Promise.reject(e);}
  return Promise.resolve(p).catch(function(e){errLog.push('open: '+(e&&e.message));toast('Couldn’t open the last project ('+((e&&e.message)||'error')+') — started a new one.',6000);try{resetProject();}catch(x){}})
  .then(function(){return new Promise(function(r){setTimeout(r,1200);});}).then(function(){
    if(audioHealthy())return;errLog.push('sound check failed after open → restarting engine');restartAudio();
    return new Promise(function(r){setTimeout(r,1500);}).then(function(){if(audioHealthy())return;
      errLog.push('still silent after restart → new project');var keep=project.id;resetProject();restartAudio();
      toast('That project jams the audio on this phone, so a new one was started. It is still under Song → Open…',7000);});
  });
}

$$('input[type=file]').forEach(function(f){f.tabIndex=-1;});
document.addEventListener('keydown',function(e){var t=e.target;if(t&&t.tagName==='LABEL'&&t.classList.contains('btn')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click();}});
function fixLabels(){$$('label.btn[for]').forEach(function(l){l.tabIndex=0;l.setAttribute('role','button');});}
fixLabels();new MutationObserver(fixLabels).observe($('#fxChain'),{childList:true,subtree:true});
/* ---------- SOUND LIBRARY: multisampled instruments synthesized on the device ---------- */
