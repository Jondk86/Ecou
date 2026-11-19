var dawKbDone=false,DAWCOL=['#D4FF3A','#5CE1E6','#FF8A5B','#B69CFF','#FFD166','#7BE495','#FF6FB5','#6FA8FF','#F2A65A','#9AE6E0','#E0A3FF','#C2E812'];
while(SPCOL.length<DAWCOL.length)SPCOL.push(DAWCOL[SPCOL.length]);
var MAXAUD=8,DRH=36,DLH=64,abuf={},abufN=0,peakCache=new WeakMap(),dawClipboard=null,dawNeed=true;
function abufAdd(b){var id='a'+(++abufN);abuf[id]=b;return id;}
function dawDefaults(){return {clips:[],markers:[],loop:{on:false,a:0,b:64},ppx:4,sx:0,snap:4,sel:null,lane:1,auto:'off',play:0,nid:0,count:true,offMs:0,mon:false,init:false,msel:-1};}
var daw=dawDefaults();
var AUTOP={vol:{label:'Volume',min:0,max:1.2,neutral:1},pan:{label:'Pan',min:-1,max:1,neutral:0},rev:{label:'Reverb send',min:0,max:1,neutral:1},dly:{label:'Delay send',min:0,max:1,neutral:1},cut:{label:'Filter cutoff',min:0,max:1,neutral:1}};
var AUTOK=['vol','pan','rev','dly','cut'];
function hasAuto(t,k){return !!(t&&t.auto&&t.auto[k]&&t.auto[k].length);}
function autoBase(t,k){return k==='vol'?t.vol:k==='pan'?t.pan:k==='rev'?t.rev:k==='dly'?t.dly:1;}
function autoNode(t,k){var n=t.n;if(!n)return null;return k==='vol'?n.av.gain:k==='pan'?(n.ap.pan||null):k==='rev'?n.ar.gain:k==='dly'?n.ad.gain:n.af.frequency;}
function autoMap(k,v){return k==='cut'?Math.min(20000,normToHz(v)):v;}
function autoVal(t,k,g){var a=t.auto[k];if(g<=a[0].s)return a[0].v;for(var i=0;i<a.length-1;i++){if(g<a[i+1].s){var p=a[i],q=a[i+1];return p.v+(q.v-p.v)*(g-p.s)/Math.max(1e-9,q.s-p.s);}}return a[a.length-1].v;}
function fmtAuto(k,v){if(k==='vol')return v<0.001?'−∞ dB':dec(20*Math.log10(v),1)+' dB';if(k==='pan')return Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);if(k==='cut')return Math.round(Math.min(20000,normToHz(v)))+' Hz';return fPct(v);}
/* schedule automation from step g0 (at time t0) until step g1; cancel=true clears pending events first */
function schedAuto(t0,g0,g1,cancel){
  var sd=stepDur();
  tracks.forEach(function(t){if(!t.n)return;AUTOK.forEach(function(k){var p=autoNode(t,k);if(!p)return;
    if(cancel){try{p.cancelScheduledValues(Math.max(0,t0-0.001));}catch(e){}}
    if(!hasAuto(t,k)){p.setValueAtTime(k==='cut'?20000:AUTOP[k].neutral,t0);return;}
    var a=t.auto[k],prev={s:g0,v:autoVal(t,k,g0)};p.setValueAtTime(autoMap(k,prev.v),t0);
    function ramp(s,v){if(k==='cut'){var n=Math.max(1,Math.ceil(s-prev.s));for(var j=1;j<=n;j++){var ss=prev.s+(s-prev.s)*j/n,vv=prev.v+(v-prev.v)*j/n;p.linearRampToValueAtTime(autoMap(k,vv),t0+(ss-g0)*sd);}}else p.linearRampToValueAtTime(v,t0+(s-g0)*sd);prev={s:s,v:v};}
    for(var i=0;i<a.length;i++){if(a[i].s<=g0)continue;if(a[i].s>=g1)break;ramp(a[i].s,a[i].v);}
    if(g1<1e8&&prev.s<g1)ramp(g1,autoVal(t,k,g1));
  });});
}
function autoPreview(){if(!ctx||(seq.on&&seq.mode==='arrange'))return;var now=ctx.currentTime;
  tracks.forEach(function(t){if(!t.n)return;AUTOK.forEach(function(k){var p=autoNode(t,k);if(!p)return;try{p.cancelScheduledValues(now);}catch(e){}
    var v=hasAuto(t,k)?autoMap(k,autoVal(t,k,daw.play)):(k==='cut'?20000:AUTOP[k].neutral);p.setTargetAtTime(v,now,0.015);});});}
/* clips */
function clipLen(c){return c.type==='pat'?c.l:c.dur/stepDur();}
function clipEnd(c){return c.s+clipLen(c);}
function arrEnd(){var e=0;daw.clips.forEach(function(c){e=Math.max(e,clipEnd(c));});return e;}
function newClip(o){o.id=++daw.nid;if(o.type==='aud'){o.gain=o.gain||0;o.fi=o.fi==null?0.005:o.fi;o.fo=o.fo==null?0.01:o.fo;o.takes=o.takes||[o.buf];o.loop=!!o.loop;}daw.clips.push(o);return o;}
function clipById(id){for(var i=0;i<daw.clips.length;i++)if(daw.clips[i].id===id)return daw.clips[i];return null;}
function selClip(){return daw.sel!=null?clipById(daw.sel):null;}
function clipName(c){if(c.type==='pat')return PATN[c.p]+(clipLen(c)*daw.ppx>90?' · pattern':'');return c.name||'Audio';}
/* transport */
var arr={g:0,next:0,tl0:0,g0:0,anchors:[{t:0,g:0}],srcs:[],rec:null,end:0,startG:0,pre:0};
var arrCtx=arr;
function tlAt(g){if(daw.tmap&&g>arrCtx.g0){var t=arrCtx.tl0,f=Math.floor(g);for(var x=arrCtx.g0;x<f;x++)t+=tmSd(x);return t+(g-f)*tmSd(f);}return arrCtx.tl0+(g-arrCtx.g0)*stepDur();}
function startAudioClip(c,when,into){
  if(roSkip(c.ti))return;var b=abuf[c.buf],tr=tracks[c.ti];if(!b||!tr||!tr.n||c.mute)return;
  var rem=c.dur-into;if(rem<=0.004)return;
  var pos=c.off+into;if(c.loop)pos=((pos%b.duration)+b.duration)%b.duration;else{if(pos>=b.duration)return;rem=Math.min(rem,b.duration-pos);}
  var src=ctx.createBufferSource();src.buffer=b;if(c.loop){src.loop=true;src.loopStart=0;src.loopEnd=b.duration;}
  var g=ctx.createGain(),gv=dbg(c.gain||0),fi=Math.max(0.003,c.fi||0),fo=Math.max(0.003,c.fo||0),end=when+rem,fiEnd=when+Math.max(0,fi-into);
  if(into<fi){g.gain.setValueAtTime(gv*into/fi,when);g.gain.linearRampToValueAtTime(gv,fiEnd);}else g.gain.setValueAtTime(gv,when);
  var foS=when+(c.dur-into)-fo;if(foS>fiEnd)g.gain.setValueAtTime(gv,foS);
  g.gain.linearRampToValueAtTime(0,when+(c.dur-into));
  src.connect(g);g.connect(tr.n.in);src.start(when,pos);src.stop(end+0.02);if(offlineRender)offNodes.push({e:end+0.05,n:g});
  var rec={src:src,g:g,end:end};(arrCtx.srcs||(arrCtx.srcs=[])).push(rec);
  src.onended=function(){try{g.disconnect();}catch(e){}};
}
function arrStep(g,t){
  var sd=tmSd(g);
  for(var ci=0;ci<daw.clips.length;ci++){var c=daw.clips[ci];if(c.mute)continue;
    if(c.type==='pat'){
      if(g<c.s||g>=c.s+c.l)continue;var tr=tracks[c.ti],pt=patterns[c.p];if(!tr||tr.kind==='audio'||!pt)continue;
      var s=(((g-c.s+(c.o||0))%pt.len)+pt.len)%pt.len,left=c.s+c.l-g;
      if(c.ti===0){drumStep(pt,s,t,sd);}
      else{var ns=pt.notes[c.ti]||[];for(var j=0;j<ns.length;j++){var n=ns[j];if(n.s>=s&&n.s<s+1){var l=Math.min(n.l,left-(n.s-s));if(l>0)playNote(c.ti,n.m,n.v,t+(n.s-s)*sd,Math.max(0.05,l*sd));}}}
    }else if(c.s>=g&&c.s<g+1)startAudioClip(c,tlAt(c.s),0);
  }
  fxReplayStep(g);
}
function pfRecording(){var c=document.getElementById('pfRec');return !offlineRender&&!!(c&&c.checked&&seq.on&&seq.mode==='arrange');}
/* recorded punch-ins: daw.fx = segments {id,a,s,e} (steps), daw.fxf = filter-fader points {s,v} */
var pfUser={},pfRecOpen={},pfFT=null;
function r2(x){return Math.round(x*100)/100;}
function fxPos(){return Math.max(0,arrPosNow());}
function fxName(id){for(var i=0;i<PFX.length;i++)if(PFX[i].id===id)return PFX[i].name;return id;}
function fxBar(s){var b=Math.floor(s/16)+1,bt=Math.floor((s%16)/4)+1;return b+'.'+bt;}
function fxMigrate(a){if(!Array.isArray(a))return [];var out=[],open={};
  a.forEach(function(e){if(!e||e.s==null)return;if(e.e!=null&&e.on==null){out.push({id:e.id,a:e.a||1,s:+e.s,e:+e.e});return;}
    if(e.on)open[e.id]=e;else if(open[e.id]){var o=open[e.id];out.push({id:e.id,a:o.a||1,s:o.s,e:Math.max(o.s+0.25,e.s)});delete open[e.id];}});
  return out.sort(function(x,y){return x.s-y.s;});}
function fxCommit(seg){seg.s=r2(Math.max(0,seg.s));seg.e=r2(Math.max(seg.s+0.25,seg.e));var out=[];
  (daw.fx||[]).forEach(function(x){if(x.id!==seg.id||x.e<=seg.s||x.s>=seg.e){out.push(x);return;}
    if(x.s<seg.s-0.2)out.push({id:x.id,a:x.a,s:x.s,e:seg.s});if(x.e>seg.e+0.2)out.push({id:x.id,a:x.a,s:seg.e,e:x.e});});
  out.push(seg);out.sort(function(x,y){return x.s-y.s;});daw.fx=out;dawNeed=true;markDirty();if(daw.sel==null)renderInsp();}
function fxRecHint(){if(!fxRecHint.d&&$('#pfRec')&&$('#pfRec').checked&&!pfRecording()){fxRecHint.d=1;toast('Punch-ins are recorded only while the Studio timeline plays. Press ▶ in Studio first.',3200);}}
function fxRecOn(id,a){if(!pfRecording()){fxRecHint();return;}pfRecOpen[id]={id:id,a:a,s:fxPos()};}
function fxRecOff(id,at){var o=pfRecOpen[id];if(!o)return;delete pfRecOpen[id];var e=at!=null?at:fxPos();
  if(e<o.s-0.01&&daw.loop.on){fxCommit({id:id,a:o.a,s:o.s,e:daw.loop.b});if(e>daw.loop.a+0.05)fxCommit({id:id,a:o.a,s:daw.loop.a,e:e});}
  else fxCommit({id:id,a:o.a,s:o.s,e:Math.max(e,o.s+0.25)});
  toast('● '+fxName(id)+' recorded at bar '+fxBar(o.s),1400);}
function fxRecCloseAll(){Object.keys(pfRecOpen).forEach(function(k){fxRecOff(k);});if(pfFT)fxFadeEnd();}
function fxFadeStart(){pfFT=pfRecording()?{pts:[],lt:0}:null;if(!pfFT)fxRecHint();}
function fxFadeMove(v){if(!pfFT){if(pfRecording())pfFT={pts:[],lt:0};else return;}var nw=performance.now(),p={s:r2(fxPos()),v:r2(v)};
  if(nw-pfFT.lt>40||!pfFT.pts.length){pfFT.lt=nw;pfFT.pts.push(p);}else pfFT.pts[pfFT.pts.length-1]=p;}
function fxFadeEnd(){var f=pfFT;pfFT=null;if(!f||!f.pts.length)return;var last=f.pts[f.pts.length-1];
  if(pfRecording()){var p={s:r2(fxPos()),v:r2(pfFader)};if(p.s>=last.s)f.pts.push(p);}
  var lo=f.pts[0].s,hi=f.pts[f.pts.length-1].s;if(hi<lo){var w=f.pts.filter(function(p){return p.s>=lo;});f.pts=w;hi=w.length?w[w.length-1].s:lo;}
  var nf=(daw.fxf||[]).filter(function(p){return p.s<lo-0.01||p.s>hi+0.01;}).concat(f.pts).sort(function(a,b){return a.s-b.s;});
  daw.fxf=nf.filter(function(p,i){var q=nf[i+1];return !(q&&Math.abs(q.s-p.s)<0.02)&&!(i>0&&nf[i-1].v===p.v&&q&&q.v===p.v);});
  dawNeed=true;markDirty();if(daw.sel==null)renderInsp();}
function fxReplayStep(g){var fx=daw.fx,ff=daw.fxf;
  if(fx&&fx.length)for(var i=0;i<fx.length;i++){var x=fx[i];if(!offlineRender&&pfUser[x.id])continue;
    if(x.e>=g&&x.e<g+1&&pfHeld[x.id])pfOff(x.id,tlAt(x.e));if(x.s>=g&&x.s<g+1)pfOn(x.id,x.a||1,tlAt(x.s));}
  if(ff&&ff.length&&(offlineRender||!pfFT))for(var j=0;j<ff.length;j++){var p=ff[j];if(p.s>=g&&p.s<g+1){pfFader=p.v;applyFader(tlAt(p.s));}}}
/* rebuild the recorded state at step g (start of playback, loop restart) */
function fxStateAt(g,t){if(!PF)return;Object.keys(pfHeld).forEach(function(k){if(!pfUser[k])pfOff(k,t);});
  if(daw.fxf&&daw.fxf.length&&!pfFT){var v=0;daw.fxf.forEach(function(p){if(p.s<g)v=p.v;});pfFader=v;applyFader(t);fxFaderUI();}
  (daw.fx||[]).forEach(function(x){if(!pfUser[x.id]&&x.s<g&&x.e>g)pfOn(x.id,x.a||1,t);});}
function fxOffAll(){if(!PF||(seq.on&&seq.mode==='arrange'))return;Object.keys(pfHeld).forEach(function(k){if(!pfUser[k])pfOff(k);});}
function fxFaderUI(){var el=document.getElementById('pfFader'),o=document.getElementById('pfFo');if(!el)return;el.value=pfFader;if(o)o.textContent=Math.abs(pfFader)<0.03?'open':(pfFader<0?'low-pass '+Math.round(-pfFader*100)+'%':'high-pass '+Math.round(pfFader*100)+'%');}
function arrStartClipsAt(g,t){var sd=stepDur();daw.clips.forEach(function(c){if(c.type==='aud'&&!c.mute&&c.s<g&&clipEnd(c)>g)startAudioClip(c,t,(g-c.s)*sd);});}
function arrCutAt(tj){arr.srcs=arr.srcs.filter(function(r){if(r.end<=tj)return r.end>ctx.currentTime;try{r.g.gain.cancelScheduledValues(tj);r.g.gain.setTargetAtTime(0,tj,0.004);r.src.stop(tj+0.04);}catch(e){}return false;});}
function arrBegin(){arr.jump=null;
  var sd=stepDur(),pre=arr.pre||0,g=Math.max(0,Math.floor(daw.play+1e-6));arr.pre=0;
  if(daw.loop.on&&(g<daw.loop.a||g>=daw.loop.b))g=daw.loop.a;
  var t=ctx.currentTime+0.1;
  arr.g=g-pre;arr.next=t;arr.tl0=t+pre*sd;arr.g0=g;arr.startG=g;arr.anchors=[{t:t,g:g-pre}];arr.srcs=[];arr.end=Math.max(arrEnd(),g+1);arrCtx=arr;
  schedAuto(arr.tl0,g,daw.loop.on?daw.loop.b:1e9,true);
  arrStartClipsAt(g,arr.tl0);fxStateAt(g,arr.tl0);
  if(arr.rec){arr.rec.tStart=arr.tl0;arr.rec.gStart=g;arr.rec.cyc=[{t:arr.tl0,g:g}];}
}
function arrTick(){
  var now=ctx.currentTime,look=0.12,sd=stepDur();arrCtx=arr;
  while(seq.on&&arr.next<now+look){
    if(arr.jump&&arr.g>=arr.jump.at&&arr.g>=arr.startG&&!arr.rec){var J=arr.jump,tj=arr.next;arr.jump=null;arrCutAt(tj);arr.g=J.to;arr.tl0=tj;arr.g0=J.to;arr.anchors.push({t:tj,g:J.to});if(arr.anchors.length>8)arr.anchors.shift();
      schedAuto(tj,J.to,daw.loop.on?daw.loop.b:1e9,false);arrStartClipsAt(J.to,tj);fxStateAt(J.to,tj);(arr.jlog=arr.jlog||[]).push({at:J.at,to:J.to,t:tj});if(arr.jlog.length>16)arr.jlog.shift();if(typeof stJumped==='function')stJumped(J,tj);if(daw.tmap)sd=tmSd(arr.g);}
    var g=arr.g,t=arr.next,gm=((g%16)+16)%16;if(daw.tmap){sd=tmSd(g);if(gm===0&&g>=arr.startG){arr.anchors.push({t:t,g:g});if(arr.anchors.length>8)arr.anchors.shift();}}
    if(g>=arr.startG)arrStep(g,t);
    if(((seq.metro&&!(arr.rec&&!VT.hp&&g>=arr.startG))||arr.jam||g<arr.startG)&&gm%4===0)click(t,gm===0);
    var sw=P.swing.v*sd*0.5;arr.next+=sd+((((g%2)+2)%2)===0?sw:-sw);arr.g++;
    if(daw.loop.on&&arr.g>=daw.loop.b&&arr.g-1>=arr.startG){
      var tj=arr.tl0+(daw.loop.b-arr.g0)*sd;arr.next=tj;arrCutAt(tj);
      arr.g=daw.loop.a;arr.tl0=tj;arr.g0=daw.loop.a;arr.anchors.push({t:tj,g:daw.loop.a});if(arr.anchors.length>8)arr.anchors.shift();
      if(arr.rec)arr.rec.cyc.push({t:tj,g:daw.loop.a});
      schedAuto(tj,daw.loop.a,daw.loop.b,false);arrStartClipsAt(daw.loop.a,tj);fxStateAt(daw.loop.a,tj);
    }else if(!daw.loop.on&&!arr.rec&&!seq.rec&&!arr.jam&&arr.g>=arr.end+4){var wait=Math.max(0,arr.next-now);clearInterval(seq.timer);seq.timer=null;setTimeout(function(){if(seq.mode==='arrange'&&seq.on&&!seq.timer){transportStop();daw.play=0;daw.sx=0;dawNeed=true;}},wait*1000+600);return;}
  }
}
function arrPosNow(){if(!ctx)return daw.play;var now=ctx.currentTime-(ctx.outputLatency||0),a=arr.anchors,k=a.length-1;while(k>0&&a[k].t>now)k--;return a[k].g+(now-a[k].t)/tmSd(a[k].g);}
function arrStopCleanup(){
  var now=ctx.currentTime,pos=arrPosNow();fxRecCloseAll();Object.keys(pfHeld).forEach(function(k){if(!pfUser[k])pfOff(k);});if(daw.fxf&&daw.fxf.length){pfFader=0;applyFader();fxFaderUI();}
  arr.srcs.forEach(function(r){try{r.g.gain.cancelScheduledValues(now);r.g.gain.setTargetAtTime(0,now,0.006);r.src.stop(now+0.05);}catch(e){}});arr.srcs=[];
  if(arr.rec)arrRecFinish(now);
  else if(pos>=arr.startG)daw.play=daw.loop.on?clamp(pos,daw.loop.a,daw.loop.b):Math.max(0,pos);
  seq.mode='arrange';setTimeout(autoPreview,0);dawNeed=true;
}
/* offline arrangement */
function scheduleArrange(t0,range){
  var sd=stepDur(),g00=range?range[0]:0,end=range?range[1]:Math.max(1,Math.ceil(arrEnd()-1e-6)),A={tl0:t0,g0:g00,srcs:[]},t=t0,keep=arrCtx;arrCtx=A;
  if(range)return (function(){try{schedAuto(t0,g00,end,true);for(var g=g00;g<end;g++){(function(g,t){defer(t,function(){var k=arrCtx;arrCtx=A;try{arrStep(g,t);}finally{arrCtx=k;}});})(g,t);t+=tmSd(g);}}finally{arrCtx=keep;}return daw.tmap?t:t0+(end-g00)*sd;})();
  try{schedAuto(t0,0,1e9,true);for(var g=0;g<end;g++){(function(g,t){defer(t,function(){var k=arrCtx;arrCtx=A;try{arrStep(g,t);}finally{arrCtx=k;}});})(g,t);var sdg=tmSd(g),sw=P.swing.v*sdg*0.5;t+=sdg+(g%2===0?sw:-sw);}}finally{arrCtx=keep;}
  return daw.tmap?t:t0+arrEnd()*sd;
}
/* audio tracks */
function audioCount(){return tracks.filter(function(t){return t.kind==='audio';}).length;}
function instCount(){return tracks.filter(function(t,i){return i>=4&&t.kind==='keys';}).length;}
function addInstTrack(name,silent,stock){
  if(instCount()>=4){toast('Up to 7 instrument tracks.');return -1;}
  var n=instCount()+3,t=defTrack(name||('Keys '+n),'keys',{vol:0.6,rev:0.25,dly:0.05,fx:true});t.auto={};
  var base=tracks[1].sound,S=JSON.parse(JSON.stringify({engine:'sampler',loop:false,morphMode:'blend'}));IKEYS.forEach(function(k){S[k]=base[k];});
  var st=ctx?stockSlot(stock||'piano'):null;S.slots={A:st||Object.assign({},base.slots.A),B:Object.assign({},base.slots.B)};S.morph=0;S.morphBuf=null;S.morphRoot=S.slots.A.root;if(st){Object.assign(S,STOCK[stock||'piano'].p);S.loop=STOCK[stock||'piano'].loop;}
  t.sound=S;tracks.push(t);var i=tracks.length-1;t.sp={az:[-50,50,-80,80][(n-3)%4],el:10,dist:1.6,orbit:0};
  patterns.forEach(function(pt){while(pt.notes.length<=i)pt.notes.push([]);});
  if(ctx){buildTrackNode(t,i);t.n.f.frequency.value=normToHz(S.cutoff);t.n.f.Q.value=S.reso;applyMix();spRoute();}
  renderMixer();renderSpUI();renderTrackSegs();try{renderKeysSrc();}catch(e){}daw.lane=i;dawNeed=true;renderDawHeads();if(!silent){markDirty();toast(t.name+' added ('+(st?STOCK[stock||'piano'].name:'sound')+'). Pick its sound in the Sound tab, write notes in Song.',2600);}return i;
}
/* bounce in place: render one instrument lane of the timeline to an audio clip, mute the source */
function bounceLane(ti){
  if(!ensureAudio())return;var t=tracks[ti];if(!t||t.kind==='audio'){return;}if(!daw.clips.some(function(c){return c.ti===ti;})){toast('This lane has no clips on the timeline.');return;}
  if(audioCount()>=MAXAUD){toast('No free audio track.');return;}var btn=$('#tiBounce');if(btn)btn.textContent='Bouncing…';
  transportStop();renderOffline({mode:'stem',track:ti,src:'arrange',stereo:true}).then(function(r){
    var sr=r.buf.sampleRate,len=tailLength(r.buf,r.end),chs=cutBuffer(r.buf,len,false,Math.round(TRACKLAT*sr)),b=ctx.createBuffer(2,chs[0].length,sr);b.getChannelData(0).set(chs[0]);b.getChannelData(1).set(chs[1]);
    var ai=addAudioTrack(t.name+' (audio)',true);if(ai<0)return;var at=tracks[ai];at.vol=1;at.rev=t.rev;at.dly=t.dly;at.pan=0;at.fx=t.fx;at.sp=JSON.parse(JSON.stringify(t.sp||at.sp));trackRoute(ai);
    newClip({type:'aud',ti:ai,s:0,off:0,dur:b.duration,buf:abufAdd(b),name:t.name+' bounce'});t.mute=true;applyMix();renderMixer();renderDawHeads();renderInsp();dawNeed=true;markDirty();
    toast(t.name+' bounced to audio and muted — edit, chop or reverse it like a recording.',3000);
  }).catch(function(){toast('Bounce failed in this browser.');}).then(function(){var b2=$('#tiBounce');if(b2)b2.textContent='Bounce to audio';});
}
function addAudioTrack(name,silent){
  if(audioCount()>=MAXAUD){toast('Up to '+MAXAUD+' audio tracks.');return -1;}
  var n=audioCount()+1,t=defTrack(name||('Audio '+n),'audio',{vol:0.8,rev:0,dly:0,fx:false});t.inCh='L';t.arm=false;t.auto={};
  tracks.push(t);var i=tracks.length-1;t.sp={az:[-30,30,-60,60,-100,100,-140,140][(n-1)%8],el:0,dist:1.6,orbit:0};
  if(ctx){buildTrackNode(t,i);applyMix();spRoute();}
  renderMixer();renderSpUI();daw.lane=i;dawNeed=true;renderDawHeads();if(!silent)markDirty();return i;
}
function removeTrack(i){
  var t=tracks[i];if(!t||i<4)return;
  if(seq.on)transportStop();patterns.forEach(function(pt){if(pt.notes.length>i)pt.notes.splice(i,1);});if(selTrack===i){selTrack=1;loadSound(1);}if(songSel>=i)songSel=1;
  if(t.n){try{t.n.out.disconnect();t.n.sr.disconnect();t.n.sd.disconnect();t.n.ar.disconnect();t.n.ad.disconnect();}catch(e){}}
  daw.clips=daw.clips.filter(function(c){return c.ti!==i;});daw.clips.forEach(function(c){if(c.ti>i)c.ti--;});
  if(t.n&&t.n.insN)insTear(t.n);mxKeyRemap(i);tracks.splice(i,1);if(daw.lane>=tracks.length)daw.lane=tracks.length-1;if(typeof spSel!=='undefined'&&spSel>=tracks.length)spSel=0;
  daw.sel=null;tracks.forEach(function(x,j){trackRoute(j);});insRebuildAll();if(mxSel!=null&&mxSel!=='rA'&&mxSel!=='rB'&&mxSel!=='mst'&&!tracks[+mxSel])mxSel=null;
  renderMixer();renderSpUI();renderTrackSegs();renderDawHeads();renderInsp();dawNeed=true;markDirty();
}
function dropAudioTracks(){for(var i=tracks.length-1;i>=4;i--){var t=tracks[i];if(t.n){try{t.n.out.disconnect();t.n.sr.disconnect();t.n.sd.disconnect();t.n.ar.disconnect();t.n.ad.disconnect();}catch(e){}}tracks.splice(i,1);}}
var placeName=null;
function laneFree(ti,a,b){return !daw.clips.some(function(c){return c.ti===ti&&c.s<b-1e-6&&clipEnd(c)>a+1e-6;});}
/* where a new audio clip of len steps goes: selected audio lane if free there, else another free audio lane, else a new track, else after the last clip */
function placeAudio(s,len){var order=[];if(tracks[daw.lane]&&tracks[daw.lane].kind==='audio')order.push(daw.lane);tracks.forEach(function(t,i){if(t.kind==='audio'&&order.indexOf(i)<0)order.push(i);});
  for(var k=0;k<order.length;k++)if(laneFree(order[k],s,s+len))return {ti:order[k],s:s};
  if(audioCount()<MAXAUD){var ni=addAudioTrack(placeName||null,true);return {ti:ni,s:s};}
  var ti=order[0],e=0;daw.clips.forEach(function(c){if(c.ti===ti)e=Math.max(e,clipEnd(c));});return {ti:ti,s:Math.ceil(e/16)*16};}
function firstAudioLane(){if(tracks[daw.lane]&&tracks[daw.lane].kind==='audio')return daw.lane;for(var i=0;i<tracks.length;i++)if(tracks[i].kind==='audio')return i;return addAudioTrack();}
/* carve: make room on a lane between s and e (used by recording) */
function carveLane(ti,s,e,except){
  var sd=stepDur(),out=[];
  daw.clips.forEach(function(c){if(c.ti!==ti||c===except||clipEnd(c)<=s||c.s>=e){out.push(c);return;}
    var ce=clipEnd(c);
    if(c.s<s){var L=JSON.parse(JSON.stringify(c));if(c.type==='pat')L.l=s-c.s;else L.dur=(s-c.s)*sd;L.id=++daw.nid;out.push(L);}
    if(ce>e){var R=JSON.parse(JSON.stringify(c));R.id=++daw.nid;var d=e-c.s;R.s=e;if(c.type==='pat'){R.l=ce-e;R.o=(c.o||0)+d;}else{R.off=c.off+d*sd;R.dur=c.dur-d*sd;}out.push(R);}
  });daw.clips=out;
}
/* recording */
var IN_WORKLET="class I extends AudioWorkletProcessor{process(i){var c=i[0];if(c&&c.length){this.port.postMessage({f:currentFrame,l:c[0].slice(0),r:(c[1]||c[0]).slice(0)});}return true;}}registerProcessor('ecou-in',I);";
var inMod=null,inModOk=false;
function loadInWorklet(){if(inMod)return inMod;if(!ctx.audioWorklet)return Promise.resolve(false);
  inMod=ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([IN_WORKLET],{type:'application/javascript'}))).then(function(){inModOk=true;return true;},function(){return false;});return inMod;}
/* live input meter + growing waveform while recording: peaks come from the chunks already captured (no extra audio nodes) */
var RECBIN=512,recMet={on:false,t:0,lv:0};
function recFeed(R,c){var l=c.l,r=c.r,n=l.length,bl=R.bL,br=R.bR,k=R.bN,ml=0,mr=0;if(R.pkF0==null)R.pkF0=c.f;
  for(var i=0;i<n;i++){var a=l[i]<0?-l[i]:l[i],b=r[i]<0?-r[i]:r[i];if(a>bl)bl=a;if(b>br)br=b;if(a>ml)ml=a;if(b>mr)mr=b;if(++k>=RECBIN){R.pkL.push(bl);R.pkR.push(br);bl=br=0;k=0;}}
  R.bL=bl;R.bR=br;R.bN=k;var m=Math.max(ml,mr);if(m>R.lvl)R.lvl=m;}
function recPk(R,ch,i){return ch==='R'?R.pkR[i]:ch==='LR'?Math.max(R.pkL[i],R.pkR[i]):R.pkL[i];}
function recMeterStart(){recMet.lv=0;['#dawLvl','#garLvl'].forEach(function(q){var e=$(q);if(e)e.hidden=false;});var gw=$('#garRecWave');if(gw)gw.hidden=false;if(!recMet.on){recMet.on=true;requestAnimationFrame(recMeterTick);}}
function recMeterTick(ts){var R=arr.rec;
  if(!R){recMet.on=false;['#dawLvl','#garLvl'].forEach(function(q){var e=$(q);if(e)e.hidden=true;});return;}
  requestAnimationFrame(recMeterTick);if(ts-recMet.t<33)return;recMet.t=ts;
  var pk=R.lvl;R.lvl=0;recMet.lv=Math.max(pk,recMet.lv*0.8);var db=recMet.lv>1e-5?20*Math.log10(recMet.lv):-100,f=clamp((db+60)/60,0,1);
  ['#dawLvl','#garLvl'].forEach(function(q){var e=$(q);if(!e)return;e.hidden=false;e.firstChild.style.width=((1-f)*100)+'%';e.classList.toggle('clip',pk>0.98);});
  var cv=$('#garRecWave');if(cv&&!cv.hidden&&cv.offsetWidth)recWaveDraw(cv,R);}
/* Garage: the take so far, squeezed into the canvas (window grows from 8 s) */
function recWaveDraw(cv,R){var dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(0,H/2,W,1);
  var sr=ctx.sampleRate,ch=tracks[R.tracks[0]]?tracks[R.tracks[0]].inCh||'L':'L',b0=R.tStart==null||R.pkF0==null?R.pkL.length:Math.max(0,Math.floor(((R.tStart+R.lat)*sr-R.pkF0)/RECBIN)),nb=R.pkL.length-b0;if(nb<=0)return;
  var span=Math.max(nb,Math.ceil(8*sr/RECBIN)),bpx=span/W,mid=H/2;g.fillStyle='#F43F5E';
  for(var x=0;x*bpx<nb;x++){var i0=b0+Math.floor(x*bpx),i1=Math.max(i0+1,b0+Math.floor((x+1)*bpx)),m=0;for(var i=i0;i<i1&&i<R.pkL.length;i++){var v=recPk(R,ch,i);if(v>m)m=v;}var hh=Math.max(0.5,Math.min(1,m)*(H-4)/2);g.fillRect(x,mid-hh,1,hh*2);}}
/* Studio: draw the clip being recorded on each armed lane (current pass only) */
function drawRecLive(g){var R=arr.rec;if(!R||R.tStart==null||R.pkF0==null||!R.pkL.length)return;
  var sr=ctx.sampleRate,sd=stepDur(),ppx=daw.ppx,cy=R.cyc&&R.cyc.length?R.cyc[R.cyc.length-1]:{t:R.tStart,g:R.gStart},tNow=(R.pkF0+R.pkL.length*RECBIN)/sr-R.lat;if(tNow<=cy.t)return;
  var x0=sx2(cy.g),x1=sx2(cy.g+(tNow-cy.t)/sd);if(x1<0||x0>dW)return;
  R.tracks.forEach(function(ti){var t=tracks[ti];if(!t)return;var ch=t.inCh||'L',y=laneY(ti)+4,h=DLH-9,mid=y+17+(h-20)/2,hh0=(h-20)/2;
    g.fillStyle='rgba(244,63,94,.22)';rr(g,x0,y,Math.max(2,x1-x0),h,6);g.fill();g.strokeStyle='rgba(244,63,94,.9)';g.lineWidth=1;rr(g,x0+0.5,y+0.5,Math.max(2,x1-x0)-1,h-1,6);g.stroke();
    g.save();g.beginPath();g.rect(Math.max(0,x0),y,Math.min(dW,x1)-Math.max(0,x0),h);g.clip();g.fillStyle='#FDA4AF';g.font='700 11px Inter, system-ui, sans-serif';g.fillText('● Recording',Math.max(x0,0)+6,y+13);g.fillStyle='#F43F5E';
    for(var x=Math.max(0,Math.floor(x0));x<Math.min(dW,Math.ceil(x1));x++){var ta=cy.t+(x-x0)/ppx*sd,tb=ta+sd/ppx,i0=Math.floor(((ta+R.lat)*sr-R.pkF0)/RECBIN),i1=Math.max(i0+1,Math.floor(((tb+R.lat)*sr-R.pkF0)/RECBIN)),m=0;
      for(var i=Math.max(0,i0);i<i1&&i<R.pkL.length;i++){var v=recPk(R,ch,i);if(v>m)m=v;}var hh=Math.min(1,m)*hh0;g.fillRect(x,mid-hh,1,Math.max(1,hh*2));}
    g.restore();});}
function dawRecord(){
  if(seq.on&&seq.mode==='arrange'&&arr.rec){transportStop();return;}
  if(!ensureAudio())return;if(seq.bounce||stemsRunning){toast('An export is running.');return;}
  var armed=[];tracks.forEach(function(t,i){if(t.kind==='audio'&&t.arm)armed.push(i);});
  if(!armed.length){var ti=daw.lane;if(!tracks[ti]||tracks[ti].kind!=='audio')ti=firstAudioLane();if(ti<0)return;tracks[ti].arm=true;armed=[ti];renderDawHeads();}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){micBlocked();return;}
  var stream=null;
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:{ideal:2}}}).then(function(s){stream=s;return loadInWorklet().then(function(){return VTL.on?vtWkInit():0;});}).then(function(){
    if(seq.on)transportStop();
    var src=ctx.createMediaStreamSource(stream),R={stream:stream,s:src,chunks:[],tracks:armed,node:null,pkL:[],pkR:[],pkF0:null,bL:0,bR:0,bN:0,lvl:0},node;
    if(inModOk){node=new AudioWorkletNode(ctx,'ecou-in',{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'explicit'});node.port.onmessage=function(e){R.chunks.push(e.data);recFeed(R,e.data);};}
    else{node=ctx.createScriptProcessor(4096,2,2);var cnt=null;node.onaudioprocess=function(ev){var ib=ev.inputBuffer;if(cnt==null)cnt=Math.round(ctx.currentTime*ctx.sampleRate)-4096;var ck={f:cnt,l:new Float32Array(ib.getChannelData(0)),r:new Float32Array(ib.numberOfChannels>1?ib.getChannelData(1):ib.getChannelData(0))};R.chunks.push(ck);recFeed(R,ck);cnt+=ib.length;};}
    var z=G(0);src.connect(node);node.connect(z);z.connect(ctx.destination);R.node=node;R.z=z;
    R.vtAfter=!!VTL.on;R.noHp=(daw.mon||VTL.on)&&!VT.hp;if((daw.mon||VTL.on)&&VT.hp){R.mon=G(1);var vx=vtLiveNode(src);R.vox=vx;(vx||src).connect(R.mon);R.mon.connect(tracks[armed[0]].n.in);}
    var lat=0;try{var st=stream.getAudioTracks()[0].getSettings();if(st&&typeof st.latency==='number')lat=st.latency;}catch(e){}
    R.lat=lat+recLatency()+daw.offMs/1000;
    arr.rec=R;arr.pre=daw.count?16:0;transportStart('arrange');recMeterStart();
    toast((daw.count?'Count-in… recording starts on bar '+(Math.floor(arr.startG/16)+1)+'.':'Recording.')+(VT.hp?'':' Not monitoring (no headphones confirmed); metronome muted during the take.'),VT.hp?1800:3000);
  }).catch(function(){if(stream)stream.getTracks().forEach(function(t){t.stop();});micBlocked();});
}
function arrRecFinish(tStop){
  var R=arr.rec;arr.rec=null;
  try{R.s.disconnect();R.node.disconnect();R.z.disconnect();if(R.mon)R.mon.disconnect();vtLiveDrop(R.vox);}catch(e){}
  R.stream.getTracks().forEach(function(t){t.stop();});
  var sr=ctx.sampleRate,sd=stepDur();
  /* stopped during (or right after) the count-in: keep what the microphone already heard instead of throwing the take away */
  if(R.chunks.length&&(R.tStart==null||tStop<=R.tStart+0.05)){var tA=R.chunks[0].f/sr-R.lat;if(tStop-tA>=0.3){R.tStart=tA;if(R.gStart==null)R.gStart=arr.startG||0;R.cyc=null;R.early=true;}}
  if(!R.chunks.length||R.tStart==null||tStop<=R.tStart+0.05){toast('Nothing was recorded — the take was stopped before the microphone heard anything. Tap record and sing for at least a second.',3600);dawNeed=true;try{renderInsp();garReAud();}catch(e){}return;}
  var F0=R.chunks[0].f,last=R.chunks[R.chunks.length-1],total=last.f+last.l.length-F0,L=new Float32Array(total),Rr=new Float32Array(total);
  R.chunks.forEach(function(c){var o=c.f-F0;if(o<0||o+c.l.length>total)return;L.set(c.l,o);Rr.set(c.r,o);});
  /* build a buffer of n samples whose sample 0 is audio time t0; only audio between tMin and tMax is kept */
  function slice(t0,n,ch,tMin,tMax){var i0=Math.round((t0+R.lat)*sr)-F0,j0=Math.round((tMin+R.lat)*sr)-F0,j1=Math.round((tMax+R.lat)*sr)-F0,srcs=ch==='LR'?[L,Rr]:[ch==='R'?Rr:L];
    var b=ctx.createBuffer(srcs.length,Math.max(1,n),sr);srcs.forEach(function(src,ci){var d=b.getChannelData(ci);for(var i=0;i<n;i++){var j=i0+i;if(j>=j0&&j<j1&&j>=0&&j<total)d[i]=src[j];}});return b;}
  var made=0,cyc=R.cyc||[{t:R.tStart,g:R.gStart}],looped=cyc.length>1||daw.loop.on;
  R.tracks.forEach(function(ti){var t=tracks[ti];if(!t)return;var ch=t.inCh||'L',stamp=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    if(looped){
      var la=daw.loop.a,cl=(daw.loop.b-la)*sd,n=Math.round(cl*sr),takes=[];
      cyc.forEach(function(c,k){var tEnd=k+1<cyc.length?cyc[k+1].t:tStop,len=tEnd-c.t;if(len<Math.min(cl*0.25,1)&&takes.length)return;
        var tA=c.t-(c.g-la)*sd;takes.push(abufAdd(slice(tA,n,ch,c.t,tEnd)));});
      if(!takes.length)return;
      carveLane(ti,la,daw.loop.b);
      var lc=newClip({type:'aud',ti:ti,s:la,off:0,dur:cl,buf:takes[takes.length-1],takes:takes,name:t.name+' · '+stamp});daw.sel=lc.id;made++;(R.newc||(R.newc=[])).push(lc.id);
    }else{
      var dur=tStop-R.tStart,b=slice(R.tStart,Math.round(dur*sr),ch,R.tStart,tStop),id=abufAdd(b);
      carveLane(ti,R.gStart,R.gStart+dur/sd);
      var c=newClip({type:'aud',ti:ti,s:R.gStart,off:0,dur:b.duration,buf:id,name:t.name+' · '+stamp});daw.sel=c.id;made++;(R.newc||(R.newc=[])).push(c.id);
    }});
  if((R.vox||R.vtAfter)&&R.newc)vtAfterRec(R.newc);
  daw.play=daw.loop.on?daw.loop.a:R.gStart;
  if(made){markDirty();toast(R.early?'Short take kept — you stopped during the count-in, so it starts where the microphone began.':looped&&cyc.length>1?'Recorded '+cyc.length+' passes — switch takes in the clip panel.':'Recording added to the timeline.',2600);}
  renderInsp();dawNeed=true;garReAud();
}
/* ---------- VOCAL STUDIO v1: Tune (offline pitch correction, TD-PSOLA), pitch editor, live auto-tune (ecou-vox), harmonies ----------
   Shifter choice: TD-PSOLA on pitch marks from our own YIN track. It only re-spaces glottal-period grains, so the spectral envelope
   (formants) stays put without an explicit envelope stage, it is transparent for the ±5 semitone moves vocal tuning needs, it has no
   phase-vocoder "phasiness", and it is cheap enough to re-render on every change on a phone. Unvoiced frames pass through unshifted. */
