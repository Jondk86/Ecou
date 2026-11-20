function dawShown(){
  if(!daw.init){daw.init=true;if(!daw.clips.length&&songOrder().some(function(pi){return patHas(patterns[pi]);})){songToTimeline();if(!hist.lock)markDirty();}}
  renderDawHeads();renderInsp();renderMarkers();updDawTr();resizeDaw();if(!dawShown.fit){dawShown.fit=true;setTimeout(function(){if(arrEnd()*daw.ppx>dW)dawFit();},30);}
}
/* play along: record pads / keys onto the timeline while it plays */
var jamSess=0;
function jamTarget(ti,pos){
  if(pos<0)return null;var g=Math.floor(pos),c=null;
  daw.clips.forEach(function(x){if(x.type==='pat'&&x.ti===ti&&!x.mute&&g>=x.s&&g<x.s+x.l)c=x;});
  if(!c){ // extend this take's clip, or start a new 4-bar pattern clip at this bar
    daw.clips.forEach(function(x){if(x.type==='pat'&&x.ti===ti&&x.jam===jamSess&&g>=x.s+x.l&&g<x.s+x.l+64)c=x;});
    if(c){c.l=Math.ceil((g+1-c.s)/16)*16;}
    else{var used={};daw.clips.forEach(function(x){if(x.type==='pat')used[x.p]=1;});var pi=-1;for(var i=0;i<8;i++)if(!used[i]&&!patHas(patterns[i])){pi=i;break;}
      if(pi<0){if(!jamTarget.warned){jamTarget.warned=true;toast('All 8 patterns are in use — clear one in Song to record more.',3500);}return null;}
      patterns[pi].len=64;var s0=Math.floor(g/16)*16;c=newClip({type:'pat',ti:ti,s:s0,l:16,p:pi,o:0});c.jam=jamSess;if(ti===0||ti===selTrack)setPattern(pi);renderPatSegs();}
    dawNeed=true;}
  var pt=patterns[c.p];return {p:c.p,s:(((pos-c.s+(c.o||0))%pt.len)+pt.len)%pt.len,c:c};
}
function updJam(){
  var src=seq.src,b=$('#jamPlay');if(!b)return;var on=seq.on&&((src==='arrange')===(seq.mode==='arrange'));
  $$('[data-js]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-js')===src?'true':'false');});
  b.textContent=seq.on?'■ Stop':'▶ Play';$('#jamRec').classList.toggle('live',!!seq.rec);$('#jamRec').textContent=seq.rec?'● Recording — tap to stop':'● Record performance';
  var hasA=daw.clips.some(function(c){return c.type==='aud';});
  $('#jamInfo').textContent=src==='arrange'?(daw.clips.length?(hasA?'beat on the timeline':'timeline'):'timeline is empty'):'pattern '+PATN[curPat];
}
function initJam(){
  $$('[data-js]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-js');if(v===seq.src)return;var was=seq.on;if(was)transportStop();seq.src=v;if(v==='pattern'&&seq.mode==='arrange')seq.mode='pattern';
    if(v==='arrange'&&!daw.clips.length)toast('The timeline is empty — import a beat or add loops in Studio.',3000);if(was)transportToggle();updTransportUI();});});
  $('#jamPlay').addEventListener('click',function(){transportToggle();});
  $('#jamRec').addEventListener('click',function(){seq.rec=!seq.rec;if(seq.rec){jamSess++;jamTarget.warned=false;if(!seq.on)transportToggle();toast(seq.src==='arrange'?'Recording onto the timeline — play the pads or keys.':'Recording into pattern '+PATN[curPat]+'.',1800);}else{recFlush();}updTransportUI();});
}
/* tempo detection for imported beats (onset autocorrelation) */
function detectBpm(b){
  var sr=b.sampleRate,hop=Math.round(sr/200),n=Math.floor(Math.min(b.length,sr*45)/hop);if(n<400)return 0;
  var c0=b.getChannelData(0),c1=b.numberOfChannels>1?b.getChannelData(1):c0,env=new Float32Array(n),prev=0,lp=0;
  for(var i=0;i<n;i++){var e=0;for(var j=i*hop,k=j+hop;j<k;j++){var x=c0[j]+c1[j],d=x-lp;lp=x;e+=d*d;}e=Math.log(1e-9+e);env[i]=Math.max(0,e-prev);prev=e;}
  var m=0;for(i=0;i<n;i++)m+=env[i];m/=n;for(i=0;i<n;i++)env[i]=Math.max(0,env[i]-m);
  var best=0,bv=-1,fps=200,sc=[];
  for(var bpm=70;bpm<=180;bpm+=0.5){var lag=60*fps/bpm,L=Math.floor(lag),f=lag-L,s=0;for(i=0;i+L+1<n;i++)s+=env[i]*(env[i+L]*(1-f)+env[i+L+1]*f);
    for(var h=2;h<=4;h*=2){var lg=lag*h,Lh=Math.floor(lg);if(Lh+1<n)for(i=0;i+Lh+1<n;i+=2)s+=0.5*env[i]*env[i+Lh];}
    var w=Math.exp(-Math.pow(Math.log2(bpm/110),2)*1.2);sc.push([bpm,s*w]);if(s*w>bv){bv=s*w;best=bpm;}}
  var mean=sc.reduce(function(a,x){return a+x[1];},0)/sc.length;if(bv<mean*1.25)return 0;
  return Math.round(best);
}
/* microphone hygiene: Android switches Bluetooth headphones to low-quality call mode while any mic is open,
   so every mic stream is tracked and released as soon as it is not needed (and whenever the page is hidden) */
var openStreams=new Set();
(function(){var md=navigator.mediaDevices;if(!md||!md.getUserMedia)return;var gum=md.getUserMedia.bind(md);
  md.getUserMedia=function(c){if(c&&c.audio&&audioInId){if(c.audio===true)c={audio:{deviceId:{exact:audioInId}},video:c.video};else{c=Object.assign({},c);c.audio=Object.assign({},c.audio,{deviceId:{exact:audioInId}});}}return gum(c).then(function(st){if(c&&c.audio){openStreams.add(st);st.getTracks().forEach(function(t){t.addEventListener('ended',function(){if(!st.getTracks().some(function(x){return x.readyState==='live';}))openStreams.delete(st);});});}updMic();return st;});};})();
function micLive(){var on=false;openStreams.forEach(function(st){st.getAudioTracks().forEach(function(t){if(t.readyState==='live')on=true;});});return on;}
function updMic(){var b=$('#micOn');if(b)b.hidden=!micLive();}
function releaseMics(){
  try{if(capture)stopCapture();}catch(e){}try{if(live)liveStop();}catch(e){}try{if(arr.rec)transportStop();}catch(e){}
  openStreams.forEach(function(st){st.getTracks().forEach(function(t){t.stop();});});openStreams.clear();updMic();
}
setInterval(function(){openStreams.forEach(function(st){if(!st.getTracks().some(function(t){return t.readyState==='live';}))openStreams.delete(st);});updMic();},1500);
document.addEventListener('visibilitychange',function(){if(document.hidden&&micLive())releaseMics();});
window.addEventListener('pagehide',releaseMics);
var errLog=[];
window.addEventListener('error',function(e){errLog.push((e.message||'error')+(e.lineno?' @'+e.lineno:''));if(errLog.length>10)errLog.shift();});
window.addEventListener('unhandledrejection',function(e){var r=e.reason;errLog.push('promise: '+((r&&r.message)||r));if(errLog.length>10)errLog.shift();});
var nanSeen=false,anBuf=null;
function masterPeak(){if(!N.an)return 0;if(!anBuf||anBuf.length!==N.an.fftSize)anBuf=new Float32Array(N.an.fftSize);N.an.getFloatTimeDomainData(anBuf);var pk=0;for(var i=0;i<anBuf.length;i++){var v=anBuf[i];if(!isFinite(v)){nanSeen=true;return NaN;}v=v<0?-v:v;if(v>pk)pk=v;}return pk;}
/* rebuild the whole audio engine on a fresh AudioContext, keeping the project */
function restartAudio(){
  if(!ctx)return;var sv=serialize(),pid=project.id,wasDirty=dirty;
  try{transportStop();}catch(e){}try{releaseMics();}catch(e){}
  var old=ctx;ctx=null;N={};FX={};padVoices=[];svoices=[];voices.clear();inMod=null;inModOk=false;nanSeen=false;sndStall=0;
  try{old.close();}catch(e){}
  ensureAudio();hist.lock=true;try{loadProjectData(sv.data,sv.bufs);}finally{hist.lock=false;}
  project.id=pid;dirty=wasDirty;setTimeout(histReset,0);$('#sndOff').hidden=true;
  toast('Audio engine restarted ('+Math.round(ctx.sampleRate/100)/10+' kHz).',2500);
}
function diagText(){
  if(!ctx)return 'Audio not started yet — press Start session.';
  var t0=ctx.currentTime,pk=masterPeak();
  return ['Context: '+ctx.state+' · '+ctx.sampleRate+' Hz','Latency: base '+Math.round((ctx.baseLatency||0)*1000)+' ms ('+(function(){try{return localStorage.getItem('ecou.stable')==='1'?'stable':'low-latency';}catch(e){return '?';}})()+') · output '+Math.round((ctx.outputLatency||0)*1000)+' ms',
    'Clock: '+dec(t0,2)+' s'+(sndStall>=2?' (STALLED)':''),'Master level now: '+(isNaN(pk)?'NaN — engine jammed':pk>0?dec(20*Math.log10(pk),1)+' dBFS':'silent'),'NaN seen: '+(nanSeen?'YES':'no'),
    'Recorder: '+(N.tapW?'worklet':'script processor')+' · mic open: '+(micLive()?'YES':'no'),'Tracks: '+tracks.length+' · clips: '+daw.clips.length+' · BPM '+Math.round(P.bpm.v)+' · master vol '+dec(P.vol.v,2),
    'Muted: '+(tracks.filter(function(t){return t.mute;}).map(function(t){return t.name;}).join(', ')||'none'),
    'Errors: '+(errLog.length?'\n  '+errLog.join('\n  '):'none'),'Browser: '+navigator.userAgent].join('\n');
}
var sndLast=-1,sndStall=0;
setInterval(function(){if(!ctx||offlineRender||document.hidden)return;var st=ctx.state,t=ctx.currentTime;
  if(st==='running'&&t===sndLast)sndStall++;else sndStall=0;sndLast=t;masterPeak();
  var bad=st!=='running'||sndStall>=2||nanSeen;$('#sndOff').textContent=nanSeen||sndStall>=2?'⚠ Audio engine jammed — tap here to restart sound':'🔇 Sound is paused — tap here to turn it on';
  $('#sndOff').hidden=!bad||$('#start').style.display!=='none';},1000);
$('#micOn').addEventListener('click',function(){releaseMics();toast('Microphone released. Bluetooth headphones return to full quality.',2600);});
try{$('#stableAudio').checked=localStorage.getItem('ecou.stable')==='1';}catch(e){}
$('#stableAudio').addEventListener('change',function(e){try{localStorage.setItem('ecou.stable',e.target.checked?'1':'0');}catch(x){}if(ctx)restartAudio();toast(e.target.checked?'Stable playback on — larger audio buffer.':'Low-latency playback on.',2200);});
$('#diagBtn').addEventListener('click',function(){var o=$('#diagOut');o.hidden=false;o.textContent=diagText();});
$('#diagRestart').addEventListener('click',function(){ensureAudio();restartAudio();var o=$('#diagOut');if(!o.hidden)setTimeout(function(){o.textContent=diagText();},600);});
$('#sndOff').addEventListener('click',function(){if(!ctx)return;if(nanSeen||sndStall>=2){restartAudio();return;}var p=ctx.resume();$('#sndOff').hidden=true;
  if(p&&p.then)p.then(function(){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;g.gain.setValueAtTime(0.15,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.2);toast('Sound on ('+ctx.state+', '+Math.round(ctx.sampleRate/100)/10+' kHz). If you still hear nothing, check the phone volume and that the site isn’t muted in Chrome.',4500);});});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&ctx&&ctx.state!=='running'){try{ctx.resume();}catch(e){}}});
document.addEventListener('pointerdown',function(){if(ctx&&ctx.state!=='running'&&!offlineRender){try{ctx.resume();}catch(e){}}},true);
/* serialization helpers (called from serialize / loadProjectData) */
function dawSerialize(bid){return {clips:daw.clips.map(function(c){var o=JSON.parse(JSON.stringify(c));if(c.type==='aud'){o.buf=bid(abuf[c.buf]);o.takes=(c.takes||[c.buf]).map(function(id){return bid(abuf[id]);});if(c.vt){o.vt.src=bid(abuf[c.vt.src]);o.vt.out=c.vt.out?bid(abuf[c.vt.out]):null;}}return o;}),
  markers:daw.markers,fx:daw.fx||[],fxf:daw.fxf||[],loop:daw.loop,ppx:daw.ppx,snap:daw.snap,play:daw.play,count:daw.count,offMs:daw.offMs,nid:daw.nid,init:daw.init,tmap:daw.tmap||null};}
function dawLoad(d,gb){
  var keepView={ppx:daw.ppx,sx:daw.sx,lane:daw.lane,auto:daw.auto,sel:daw.sel};
  daw=dawDefaults();abuf={};
  if(d){var map={};function rid(i){if(i==null)return null;if(map[i])return map[i];var b=gb(i);if(!b)return null;map[i]=abufAdd(b);return map[i];}
    (d.clips||[]).forEach(function(c){if(!tracks[c.ti])return;if(c.type==='aud'){c.buf=rid(c.buf);c.takes=(c.takes||[]).map(rid).filter(Boolean);if(!c.buf)return;if(c.takes.indexOf(c.buf)<0)c.takes.push(c.buf);if(c.vt){c.vt.src=rid(c.vt.src);c.vt.out=rid(c.vt.out);if(!c.vt.src)delete c.vt;}}daw.clips.push(c);});
    daw.markers=d.markers||[];daw.fx=fxMigrate(d.fx);daw.fxf=Array.isArray(d.fxf)?d.fxf:[];if(d.loop)daw.loop=d.loop;['snap','play','count','offMs','nid'].forEach(function(k){if(d[k]!=null)daw[k]=d[k];});daw.init=!!d.init;daw.tmap=Array.isArray(d.tmap)&&d.tmap.length?d.tmap:null;
    daw.clips.forEach(function(c){if(c.id>daw.nid)daw.nid=c.id;});}
  if(hist.lock){daw.ppx=keepView.ppx;daw.sx=keepView.sx;daw.lane=Math.min(keepView.lane,tracks.length-1);daw.auto=keepView.auto;if(clipById(keepView.sel))daw.sel=keepView.sel;}
  if($('#t-daw').classList.contains('active'))daw.init=true;
  if(dcv){renderDawHeads();renderInsp();renderMarkers();updDawTr();}dawNeed=true;
}

/* ===================== HARMONY COLOURS =====================
   Every note of the song's key has a colour for its scale degree. Played notes light up in that colour, and the chord
   you play is named with its function in the key (IV, V, vi…), including "the minor fall" and "the major lift". */
