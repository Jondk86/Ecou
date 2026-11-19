var project={id:null,name:'Untitled beat'},dirty=false,PDEF={},MXDEF=MX.map(function(r){return r.slice();}),FXDEFORDER=FXORDER.slice();
Object.keys(P).forEach(function(k){PDEF[k]=P[k].v;});
var PRJ_UNT=false;/* project untouched since boot/reset (demo content only, tempo not changed by the user) */
function markDirty(){dirty=true;PRJ_UNT=false;histSchedule();if(hitTarget.done&&!seq.bounce){hitTarget.done=false;var sc=$('#mtSong');if(sc)sc.textContent='changed';var hn=$('#hitNote');if(hn)hn.textContent='The mix changed since the last measurement: tap Hit target loudness again before exporting.';}var s=$('#saveState');if(s&&project)s.textContent='Unsaved changes';}
function serialize(){
  if(ctx)saveSound(selTrack);
  var bufs=[],map=new Map();
  function bid(b){if(!b)return null;if(map.has(b))return map.get(b);var id=bufs.length,chs=[];map.set(b,id);for(var c=0;c<b.numberOfChannels;c++)chs.push(b.getChannelData(c));bufs.push({id:id,sr:b.sampleRate,chs:chs});return id;}
  function sSlot(s){return s?(s.stock?{name:s.name,root:s.root,det:true,buf:null,stock:s.stock}:{name:s.name,root:s.root,det:s.det,buf:bid(s.buf),cap:s.buf&&s.buf._cap?1:0}):null;}
  function sSound(S){if(!S)return null;var o={slots:{A:sSlot(S.slots.A),B:sSlot(S.slots.B)},engine:S.engine,loop:!!S.loop,morphMode:S.morphMode||'blend',fmP:S.fmP||null};IKEYS.forEach(function(k){o[k]=S[k];});return o;}
  var params={};Object.keys(P).forEach(function(k){if(IKEYS.indexOf(k)<0&&k.indexOf('pad')!==0)params[k]=P[k].v;});
  var data={v:1,name:project.name,params:params,fxOn:fxOn,order:FXORDER.slice(),roFast:roFast,dsync:dsync,MX:MX,
    ir:{name:$('#irName').textContent,rt:$('#irRt').textContent,buf:ctx?bid(N.conv.buffer):null},
    tracks:tracks.map(function(t){return {name:t.name,kind:t.kind,vol:t.vol,pan:t.pan,mute:t.mute,solo:t.solo,rev:t.rev,dly:t.dly,fx:t.fx,sp:t.sp,sound:sSound(t.sound),auto:t.auto||{},inCh:t.inCh,arm:!!t.arm,eq:t.eq||null,comp:t.comp||0,duck:t.duck||0,cmo:t.cmo||0,duckR:t.duckR||0.18,width:t.width==null?1:t.width,cgr:t.cgr==null?null:t.cgr,volRef:t.volRef==null?null:t.volRef,compLegacy:!!t.compLegacy,fm1ch:t.fm1ch||0,rig:t.rig||null,own:t.own?1:0,ins:t.ins&&t.ins.length?JSON.parse(JSON.stringify(t.ins)):[],spre:t.spre||null};}),daw:dawSerialize(bid),mq:MQG.slice(),fmBank:fmBank||null,mqf:MQF.slice(),mqq:MQQ.slice(),selTrack:selTrack,spatial:{on:spatialOn},
    amp:{model:ampModel,cab:cabCustom?bid(cabCustom):null,match:FX.match?FX.match.target:null,ref:matchRef},
    pads:pads.map(function(p){return {name:p.name,cls:p.cls,level:p.level,tune:p.tune,decay:p.decay,pan:p.pan,choke:p.choke,buf:bid(p.buf),cap:p.buf&&(p.buf._cap||p.buf._slc)?1:0};}),
    patterns:patterns.map(function(pt){return {name:pt.name,len:pt.len,drums:pt.drums.map(function(a){return a.map(function(x){return x?(typeof x==='number'?Math.round(x*100)/100:1):0;});}),notes:pt.notes,locks:pt.locks||{}};}),song:song,curPat:curPat,garage:garSave()};
  data.mix={rAm:!!MIX.rAm,rBm:!!MIX.rBm,tgt:MIX.tgt,custom:MIX.custom,match:!!MIX.match};data.sections=secSave();data.shelf=shelfSave(bid);data.vmLib=VM.lib.slice();try{data.course=lnLoad();}catch(e){}
  return {data:data,bufs:bufs};
}
/* convolvers need buffers at the context's sample rate; phones switch rate (speaker 48 kHz, Bluetooth 44.1/16 kHz) between sessions */
function fitRate(b){if(!b||b.sampleRate===ctx.sampleRate)return b;var r=ctx.sampleRate/b.sampleRate,n=Math.max(1,Math.round(b.length*r)),o=ctx.createBuffer(b.numberOfChannels,n,ctx.sampleRate);
  for(var c=0;c<b.numberOfChannels;c++){var s0=b.getChannelData(c),d=o.getChannelData(c),L=s0.length-1;for(var i=0;i<n;i++){var x=i/r,j=Math.floor(x),f=x-j;d[i]=j>=L?s0[L]:s0[j]*(1-f)+s0[j+1]*f;}}return o;}
function loadProjectData(data,bufs){
  if(!ensureAudio())return;transportStop();if(!hist.keepBand)allOff();
  var B=[];bufs.forEach(function(b){try{if(!b||!b.chs||!b.chs.length||!b.chs[0].length)return;var ab=ctx.createBuffer(b.chs.length,b.chs[0].length,b.sr||ctx.sampleRate);b.chs.forEach(function(c,i){var d=ab.getChannelData(i);d.set(c);for(var k=0;k<d.length;k++){var v=d[k];if(!(v>-1e9&&v<1e9))d[k]=0;}});B[b.id]=ab;}catch(e){errLog.push('buffer '+b.id+': '+e.message);}});
  function gb(id){return id==null?null:(B[id]||null);}
  function dSlot(s){if(s&&s.stock){var st=stockSlot(s.stock);if(st)return st;}if(!s)return {name:'—',buf:null,root:261.63,det:false};var gbuf=gb(s.buf);if(gbuf&&s.cap)gbuf._cap=1;return {name:s.name,root:s.root,det:s.det,buf:gbuf};}
  project.name=data.name||'Untitled beat';try{if(data.vmLib)vmLibMerge(data.vmLib);}catch(e){}
  mixLoad(data.mix);Object.keys(data.params||{}).forEach(function(k){if(P[k])setParam(k,data.params[k]);});
  fxOn=data.fxOn||{};var ord=(data.order||[]).filter(function(x){return FXDEF[x];});FXDEFORDER.forEach(function(x){if(ord.indexOf(x)<0)ord.push(x);});FXORDER.splice(0,FXORDER.length);ord.forEach(function(x){FXORDER.push(x);});
  setRotary(!!data.roFast);setSync(data.dsync||'1/8D');
  if(data.MX)data.MX.forEach(function(r,i){if(MX[i])r.forEach(function(v,j){MX[i][j]=v;});});$$('#mx button').forEach(paintCell);
  if(data.ir&&data.ir.buf!=null&&gb(data.ir.buf)){N.conv.buffer=fitRate(gb(data.ir.buf));$('#irName').textContent=data.ir.name;$('#irRt').textContent=data.ir.rt;}
  (data.pads||[]).forEach(function(d,i){var p=pads[i];if(!p)return;['name','cls','level','tune','decay','pan','choke'].forEach(function(k){p[k]=d[k];});p.buf=gb(d.buf);if(p.buf&&d.cap)p.buf._cap=1;});
  dropAudioTracks();(data.tracks||[]).forEach(function(d,i){if(i>=4&&tracks.length===i){if(d.kind==='audio')addAudioTrack(d.name,true);else if(d.kind==='keys')addInstTrack(d.name,true);}});
  (data.tracks||[]).forEach(function(d,i){var t=tracks[i];if(!t)return;['name','vol','pan','mute','solo','rev','dly','fx'].forEach(function(k){t[k]=d[k];});if(d.sp)t.sp=d.sp;t.auto=d.auto&&typeof d.auto==='object'?d.auto:{};t.eq=d.eq||null;t.comp=+d.comp||0;t.duck=+d.duck||0;t.cmo=+d.cmo||0;t.fm1ch=+d.fm1ch||0;t.volRef=d.volRef==null?null:+d.volRef;t.duckR=+d.duckR||0.18;t.width=d.width==null?1:+d.width;t.cgr=d.cgr==null?null:+d.cgr;t.compLegacy=!!d.compLegacy||(+d.comp>0&&!('cgr' in d));t.ins=insNorm(d.ins);t.spre=d.spre&&typeof d.spre==='object'?{a:!!d.spre.a,b:!!d.spre.b}:null;applyStrip(t);if(t.comp&&t.cgr==null&&!t.compLegacy){(function(ti){setTimeout(function(){calibrateComp(ti);},2500+ti*400);})(i);}if(t.kind==='audio'){t.inCh=d.inCh||'L';t.arm=!!d.arm;}t.rig=d.rig&&d.rig.amp&&d.rig.ped?d.rig:null;rigRebuild(i);var dst=d.sound&&d.sound.slots&&d.sound.slots.A&&d.sound.slots.A.stock;t.own=('own' in d)?(d.own?1:0):(dst&&dst!==({1:'rhodes',3:'dub'})[i]?1:0);
    if(d.sound){var S={slots:{A:dSlot(d.sound.slots.A),B:dSlot(d.sound.slots.B)},engine:d.sound.engine,loop:d.sound.loop,morphMode:d.sound.morphMode,morphBuf:null,morphRoot:0,fmP:Array.isArray(d.sound.fmP)?FMC.clamp(d.sound.fmP.slice()):null};IKEYS.forEach(function(k){S[k]=d.sound[k];});S.morphRoot=S.slots.A.root;
      if(S.morphMode!=='blend'&&S.slots.A.buf&&S.slots.B.buf)S.morphBuf=renderMorphCore(S.slots.A,S.slots.B,S.morph,S.morphMode);t.sound=S;}
    trackRoute(i);if(t.kind==='keys'&&t.sound&&t.n){t.n.f.frequency.value=normToHz(t.sound.cutoff);t.n.f.Q.value=t.sound.reso;}});
  $('#padFx').checked=tracks[0].fx;
  patterns=(data.patterns||[]).map(function(pt,i){var len=pt.len||16,dr=[];for(var p=0;p<16;p++){var a=(pt.drums&&pt.drums[p]||[]).map(function(x){return x?(x===1||x===true?true:x):false;});while(a.length<64)a.push(false);dr.push(a);}var nt=(pt.notes||[]).slice(0,16).map(function(x){return Array.isArray(x)?x:[];});while(nt.length<4)nt.push([]);return {name:PATN[i],len:len,drums:dr,notes:nt,locks:pt.locks&&typeof pt.locks==='object'?pt.locks:{}};});
  while(patterns.length<8)patterns.push(newPattern(patterns.length,16));
  song=(data.song||[0]).filter(function(x){return x>=0&&x<8;});curPat=data.curPat||0;page=0;bindPads();
  selTrack=data.selTrack&&tracks[data.selTrack]&&tracks[data.selTrack].kind==='keys'?data.selTrack:1;songSel=selTrack;loadSound(selTrack);
  ensureSp();spatialOn=!!(data.spatial&&data.spatial.on);$('#spOn').checked=spatialOn;spRoute();renderSpUI();
  if(data.amp){cabCustom=data.amp.cab!=null?fitRate(gb(data.amp.cab)):null;matchRef=data.amp.ref||'';if(data.amp.match&&FX.match)FX.match.target=data.amp.match.slice();setAmpModel(data.amp.model||'crunch');if(cabCustom){FX.amp.cab.buffer=cabCustom;FX.amp.cabWet.gain.value=1;FX.amp.cabDry.gain.value=0;cabName='Captured cabinet';}applyMatch();}
  dawLoad(data.daw,gb);secLoad(data.sections);fmBank=Array.isArray(data.fmBank)?data.fmBank.map(function(p){return FMC.clamp(p.slice());}):null;renderFm1Routes();mqReset();if(Array.isArray(data.mq)&&data.mq.length===6)MQG=data.mq.map(Number);if(Array.isArray(data.mqf)&&data.mqf.length===6)MQF=data.mqf.map(Number);if(Array.isArray(data.mqq)&&data.mqq.length===6)MQQ=data.mqq.map(Number);applyMasterEq();renderMqUI();
  try{garLoad(data.garage);}catch(e){}
  try{shelfLoad(data.shelf,gb);}catch(e){errLog.push('shelf: '+e.message);}
  try{if(data.course)lnMerge(data.course);}catch(e){}
  insRebuildAll();applyMix();buildFxUI();routeFX();renderPads();selectPad(0);renderPatSegs();renderTrackSegs();renderMixer();paintSteps();drawRoll();updTransportUI();updDelayTime();autoPreview();
  $('#projName').value=project.name;dirty=false;if(!hist.lock)setTimeout(histReset,0);
}
function resetProject(){
  if(!ensureAudio())return;transportStop();allOff();
  Object.keys(PDEF).forEach(function(k){setParam(k,PDEF[k]);});
  fxOn={};FXORDER.splice(0,FXORDER.length);FXDEFORDER.forEach(function(x){FXORDER.push(x);});setRotary(false);setSync('1/8D');
  MXDEF.forEach(function(r,i){r.forEach(function(v,j){MX[i][j]=v;});});$$('#mx button').forEach(paintCell);
  N.conv.buffer=makeVerb('hall');$('#irName').textContent='Hall';$('#irRt').textContent='RT60 ≈ 2.4 s';
  dropAudioTracks();var keep=tracks.map(function(t){return t.n;});tracks=defaultTracks();tracks.forEach(function(t,i){t.n=keep[i];rigRebuild(i);});
  slots={A:{name:'Glass Tap',buf:null,root:880,det:true},B:{name:'Choir Pad',buf:null,root:261.63,det:true}};engine='sampler';loopOn=false;morphMode='blend';morphBuf=null;
  makeDemos();demoSounds();initPatterns();makeKit();KITFAC=kitSig();demoNotes();setTimeout(function(){PRJ_UNT=true;},0);
  tracks.forEach(function(t,i){trackRoute(i);if(t.kind==='keys'&&t.n){t.n.f.frequency.value=normToHz(t.sound.cutoff);t.n.f.Q.value=t.sound.reso;}});
  selTrack=1;songSel=1;loadSound(1);SHELF=[];ensureSp();spatialOn=false;$('#spOn').checked=false;spRoute();renderSpUI();
  cabCustom=null;matchRef='';if(FX.match)FX.match.target=TMF.map(function(){return 0;});setAmpModel('crunch');applyMatch();
  try{garLoad({});}catch(e){}
  applyMix();$('#padFx').checked=true;dawLoad(null);secLoad(null);autoPreview();mqReset();applyMasterEq();renderMqUI();
  project={id:null,name:'Untitled beat'};
  buildFxUI();routeFX();renderPads();selectPad(0);renderPatSegs();renderTrackSegs();renderMixer();paintSteps();drawRoll();updTransportUI();
  $('#projName').value=project.name;dirty=false;$('#saveState').textContent='New project';setTimeout(histReset,0);
}
/* IndexedDB */
var DBP=null;
function idb(){if(DBP)return DBP;DBP=new Promise(function(res,rej){try{var r=indexedDB.open('ecou',1);r.onupgradeneeded=function(){var db=r.result;db.createObjectStore('projects',{keyPath:'id'});db.createObjectStore('meta',{keyPath:'id'});};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};}catch(e){rej(e);}});DBP.catch(function(){DBP=null;});return DBP;}
function idbReq(store,mode,fn){return idb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction(store,mode),st=tx.objectStore(store),r=fn(st),out;if(r)r.onsuccess=function(){out=r.result;};tx.oncomplete=function(){res(out);};tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error);};});});}
var saving=false,storageWarned=false,persistAsked=false,persistOK=null;
/* ask the browser once per session to keep IndexedDB from being evicted; warn only if it says no */
function askPersist(){if(persistAsked)return;persistAsked=true;
  try{if(!navigator.storage||typeof navigator.storage.persist!=='function')return;
    navigator.storage.persist().then(function(ok){persistOK=!!ok;var seen=false;try{seen=localStorage.getItem('ecou.persistWarn')==='1';if(!ok)localStorage.setItem('ecou.persistWarn','1');}catch(e){}if(!ok&&!seen)setTimeout(function(){toast('This browser may clear saved projects when space runs low. Use Back up to file regularly.',5000);},2400);}).catch(function(){});}catch(e){}}
function fmtBytes(b){b=+b||0;if(b<1024*1024)return Math.max(0,Math.round(b/1024))+' KB';if(b<1024*1024*1024)return (b/1048576).toFixed(b<10485760?1:0)+' MB';return (b/1073741824).toFixed(1)+' GB';}
function showStorageUse(){var el=$('#storeUse');if(!el)return;
  try{if(!navigator.storage||typeof navigator.storage.estimate!=='function'){el.hidden=true;return;}
    navigator.storage.estimate().then(function(e){if(!e||!e.quota){el.hidden=true;return;}el.textContent='Storage: '+fmtBytes(e.usage)+' used of '+fmtBytes(e.quota)+(persistOK===true?' · protected':'');el.hidden=false;}).catch(function(){el.hidden=true;});}catch(e){el.hidden=true;}}
function saveProject(auto){
  if(!ctx||saving)return Promise.resolve();saving=true;askPersist();
  project.name=($('#projName').value||'').trim()||project.name||'Untitled beat';
  if(!project.id)project.id='p'+Date.now();
  var s=serialize();s.data=JSON.parse(JSON.stringify(s.data));dirty=false;var rec={id:project.id,name:project.name,updated:Date.now(),data:s.data,bufs:s.bufs},bars=Math.max(song.reduce(function(a,pi){return a+patterns[pi].len/16;},0),Math.ceil(arrEnd()/16));
  return idbReq('projects','readwrite',function(st){return st.put(rec);}).then(function(){return idbReq('meta','readwrite',function(st){return st.put({id:rec.id,name:rec.name,updated:rec.updated,bars:bars,bpm:Math.round(P.bpm.v)});});})
  .then(function(){try{localStorage.setItem('ecou.last',project.id);}catch(e){}$('#saveState').textContent=(auto?'Auto-saved ':'Saved ')+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});if(!auto)toast('Project saved on this device.');})
  .catch(function(){dirty=true;$('#saveState').textContent='Device storage unavailable — use Back up to file';if(!auto||!storageWarned){storageWarned=true;toast('This view can’t save on the device. Use Back up to file to keep your project.',5000);}})
  .then(function(){saving=false;});
}
function openProject(id){
  return idbReq('projects','readonly',function(st){return st.get(id);}).then(function(rec){if(!rec){toast('Project not found.');return;}project.id=rec.id;try{loadProjectData(rec.data,rec.bufs);}catch(e){errLog.push('load: '+e.message+' '+((e.stack||'').split('\n')[1]||''));throw e;}$('#saveState').textContent='Opened '+rec.name;try{localStorage.setItem('ecou.last',rec.id);}catch(e){}$('#projList').hidden=true;$('#storeUse').hidden=true;toast('Opened “'+rec.name+'”.');}).catch(function(){toast('Couldn’t open the project.');});
}
function listProjects(){
  var w=$('#projList');showStorageUse();
  idbReq('meta','readonly',function(st){return st.getAll();}).then(function(list){
    list=(list||[]).sort(function(a,b){return b.updated-a.updated;});w.hidden=false;
    if(!list.length){w.innerHTML='<p class="note">No saved projects on this device yet.</p>';return;}
    w.innerHTML=list.map(function(m){return '<div class="row" style="gap:8px"><button class="btn" style="flex:1;justify-content:flex-start;text-align:left;display:flex;flex-direction:column;align-items:flex-start;padding:8px 12px" data-open="'+m.id+'"><span>'+escapeH(m.name)+'</span><small class="mu">'+new Date(m.updated).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+(m.bpm||'')+' BPM · '+(m.bars||0)+' bar'+(m.bars===1?'':'s')+'</small></button><button class="mv" data-del="'+m.id+'" aria-label="Delete '+escapeH(m.name)+'">×</button></div>';}).join('');
    $$('[data-open]').forEach(function(b){b.addEventListener('click',function(){var go=function(){openProject(b.getAttribute('data-open'));};if(dirty&&ctx)saveProject(true).then(go);else go();});});
    $$('[data-del]').forEach(function(b){var armed=false;b.addEventListener('click',function(){if(!armed){armed=true;b.textContent='Delete?';b.style.width='auto';b.style.padding='0 8px';b.setAttribute('aria-label','Tap again to delete');setTimeout(function(){armed=false;b.textContent='×';},3000);return;}var id=b.getAttribute('data-del');idbReq('projects','readwrite',function(st){return st.delete(id);}).then(function(){return idbReq('meta','readwrite',function(st){return st.delete(id);});}).then(function(){if(project.id===id)project.id=null;listProjects();toast('Project deleted.');});});});
  }).catch(function(){w.hidden=false;w.innerHTML='<p class="note">Device storage isn’t available in this view. Use Back up to file / Restore from file.</p>';});
}
/* project file (.zip, store) */
function u8(s){return new TextEncoder().encode(s);}
function zipFiles(files){
  var parts=[],cds=[],off=0;
  files.forEach(function(f){var nm=u8(f.name),crc=crc32(f.data),sz=f.data.length;
    var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
    var cd=new DataView(new ArrayBuffer(46));cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint32(16,crc,true);cd.setUint32(20,sz,true);cd.setUint32(24,sz,true);cd.setUint16(28,nm.length,true);cd.setUint32(42,off,true);
    parts.push(lh.buffer,nm,f.data);cds.push(cd.buffer,nm);off+=30+nm.length+sz;});
  var cdSize=cds.reduce(function(a,b){return a+(b.byteLength||b.length);},0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
  return new Blob(parts.concat(cds,[end.buffer]),{type:'application/zip'});
}
function unzipAsync(ab){
  var dv=new DataView(ab),eo=-1;for(var i=ab.byteLength-22;i>=Math.max(0,ab.byteLength-65557);i--){if(dv.getUint32(i,true)===0x06054b50){eo=i;break;}}
  if(eo<0)return Promise.resolve(unzip(ab));
  var n=dv.getUint16(eo+10,true),cd=dv.getUint32(eo+16,true),jobs=[],out={};
  for(var k=0;k<n;k++){if(dv.getUint32(cd,true)!==0x02014b50)break;var meth=dv.getUint16(cd+10,true),csz=dv.getUint32(cd+20,true),nl=dv.getUint16(cd+28,true),el=dv.getUint16(cd+30,true),cl=dv.getUint16(cd+32,true),lo=dv.getUint32(cd+42,true),name=new TextDecoder().decode(new Uint8Array(ab,cd+46,nl));
    var ds=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),raw=ab.slice(ds,ds+csz);
    (function(name,meth,raw){if(meth===0)out[name]=raw;else if(meth===8&&typeof DecompressionStream!=='undefined')jobs.push(new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(b){out[name]=b;}));})(name,meth,raw);
    cd+=46+nl+el+cl;}
  return Promise.all(jobs).then(function(){return out;});
}
function unzip(ab){var dv=new DataView(ab),o=0,out={};while(o+30<=ab.byteLength&&dv.getUint32(o,true)===0x04034b50){var sz=dv.getUint32(o+18,true),nl=dv.getUint16(o+26,true),el=dv.getUint16(o+28,true),name=new TextDecoder().decode(new Uint8Array(ab,o+30,nl)),st=o+30+nl+el;out[name]=ab.slice(st,st+sz);o=st+sz;}return out;}
function exportProject(){
  if(!ensureAudio())return;project.name=($('#projName').value||'').trim()||project.name;
  var s=serialize(),files=[];s.data.bufs=s.bufs.map(function(b){return {id:b.id,sr:b.sr,nch:b.chs.length,len:b.chs[0].length};});
  files.push({name:'project.json',data:u8(JSON.stringify(s.data))});
  s.bufs.forEach(function(b){var len=b.chs[0].length,all=new Float32Array(len*b.chs.length);b.chs.forEach(function(c,i){all.set(c,i*len);});files.push({name:'b'+b.id+'.f32',data:new Uint8Array(all.buffer)});});
  var blob=zipFiles(files),name=safeName(project.name)+'.ecou.zip';
  if(window.claude&&typeof window.claude.use==='function'){window.claude.use('downloads').then(function(dl){if(!dl){toast('File export isn’t available in this view.');return;}return dl.save({filename:name,data:blob}).then(function(){toast('Project file exported.');}).catch(function(e){toast(e&&e.code==='declined'?'Export cancelled.':'Couldn’t export ('+((e&&e.code)||'error')+').');});});return;}
  var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);toast('Project file exported.');
}
function importProject(file){
  if(!file||!ensureAudio())return;
  file.arrayBuffer().then(unzipAsync).then(function(z){if(!z['project.json'])throw new Error('no project');var data=JSON.parse(new TextDecoder().decode(new Uint8Array(z['project.json'])));
    if(!data||!Array.isArray(data.patterns)||!Array.isArray(data.tracks)||!Array.isArray(data.pads)||!data.params)throw new Error('structure');
    var bufs=(data.bufs||[]).map(function(m){var raw=z['b'+m.id+'.f32'];if(!raw||raw.byteLength!==m.nch*m.len*4)throw new Error('buffer');var f=new Float32Array(raw),chs=[];for(var c=0;c<m.nch;c++)chs.push(f.subarray(c*m.len,(c+1)*m.len));return {id:m.id,sr:m.sr,chs:chs};});
    var backup=serialize();backup.data=JSON.parse(JSON.stringify(backup.data));var keepId=project.id,keepName=project.name;
    try{project.id=null;loadProjectData(data,bufs);}catch(err){project.id=keepId;project.name=keepName;loadProjectData(backup.data,backup.bufs);throw err;}
    dirty=true;saveProject(true);toast('Imported “'+project.name+'”.');
  }).catch(function(){toast('That isn’t a valid Ecou project file — nothing was changed.');});
}
