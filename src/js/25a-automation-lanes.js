/* ---------- AUTOMATION LANES (Song › Studio, Advanced): finger-drawn lanes per track and master ----------
   Data: owner.auto[key] = [{s: step (1/16 note), v: value in real units, c: shape of the segment starting here (0 linear, 1 smooth, 2 step)}].
   Tracks keep t.auto (vol = linear gain, pan −1..1, rev/dly = send 0..1, mute 0/1, cut = normalised cutoff, res = Q,
   'i<j>.<p>' = parameter p of insert j). The master keeps daw.mauto (mvol gain, mcut normalised cutoff).
   Values are interpolated in the drawn (normalised) space: volume in dB, frequencies in log-Hz, so the curve you see is the curve you hear.
   One scheduler for live and offline: schedAuto() builds lane states, aAdv() writes setValueAtTime/linearRampToValueAtTime events
   (curves in 1/8-step pieces, steps as 1.5 ms ramps ending exactly on the breakpoint). Live playback pumps ≤100 ms ahead from arrTick;
   offline render (export, stems, Ripple Reel) writes the whole song through the same code.
   Position: automation lives at absolute song steps. Song › Sections rebuilds do not move it (documented limit, warning in the lane sheet). */
var AL={rec:false,mode:'latch',snap:false,lanes:[],sel:null,clip:null,need:true,LH:64,tip:null,W:[],tilt:null,inB:false,lastSx:-1,lastPpx:-1};
var AU=null,MAST={name:'Master',isM:1,auto:{},n:null};
var AINS={eq:['lo','mid','hi','hp','lp'],comp:['thr'],dly:['mix','fb'],sat:['drive']};
var AFIX=['vol','pan','rev','dly','mute','cut','res'],AFIXM=['mvol','mcut'];
function aI(v){return v;}
function dbN(v){return v<=0.001?0:clamp((20*Math.log10(v)+60)/61.6,0,1);}
function nDb(n){return n<=0.004?0:dbg(-60+n*61.6);}
function logN(v,a,b){return clamp(Math.log(Math.max(v,a)/a)/Math.log(b/a),0,1);}
function nLog(n,a,b){return a*Math.pow(b/a,n);}
function fDbA(v){if(v<0.0011)return '−∞ dB';var d=20*Math.log10(v);return (d>0.05?'+':'')+dec(d,1)+' dB';}
function fHz(v){return v>=1000?dec(v/1000,v>=10000?1:2)+' kHz':Math.round(v)+' Hz';}
function fPanA(v){return Math.abs(v)<0.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);}
var ADEF={
  vol:{label:'Volume',db:1,toN:dbN,fromN:nDb,fmt:fDbA,nv:1,lin:0,par:function(n){return n.av.gain;},base:function(t){return t.vol;}},
  pan:{label:'Pan',toN:function(v){return clamp((v+1)/2,0,1);},fromN:function(n){return n*2-1;},fmt:fPanA,nv:0,lin:1,par:function(n){return n.ap.pan||null;},base:function(t){return t.pan;}},
  rev:{label:'Send A · reverb',toN:aI,fromN:aI,fmt:fPct,nv:1,lin:1,par:function(n){return n.ar.gain;},base:function(t){return t.rev;}},
  dly:{label:'Send B · delay',toN:aI,fromN:aI,fmt:fPct,nv:1,lin:1,par:function(n){return n.ad.gain;},base:function(t){return t.dly;}},
  mute:{label:'Mute',toN:aI,fromN:function(n){return n>=0.5?1:0;},fmt:function(v){return v>=0.5?'sound on':'muted';},nv:1,lin:1,step:1,par:function(n){return n.am||null?n.am.gain:null;},base:function(t){return t.mute?0:1;}},
  cut:{label:'Filter cutoff',toN:aI,fromN:aI,fmt:function(v){return fHz(Math.min(20000,normToHz(v)));},nv:20000,lin:0,map:function(v){return Math.min(20000,normToHz(v));},par:function(n){return n.af.frequency;},base:function(){return 1;}},
  res:{label:'Filter resonance',toN:function(v){return logN(v,0.5,12);},fromN:function(n){return nLog(n,0.5,12);},fmt:function(v){return 'Q '+dec(v,1);},nv:0.707,lin:0,par:function(n){return n.af.Q;},base:function(){return 0.707;}}};
var MDEF={
  mvol:{label:'Master volume',db:1,toN:dbN,fromN:nDb,fmt:fDbA,nv:1,lin:0,par:function(n){return n.mav.gain;},base:function(){return 1;}},
  mcut:{label:'Master filter',toN:aI,fromN:aI,fmt:function(v){return v>=0.995?'open':fHz(normToHz(v));},nv:function(){return ctx.sampleRate/2;},lin:0,map:function(v){return v>=0.995?ctx.sampleRate/2:Math.min(20000,normToHz(v));},par:function(n){return n.maf.frequency;},base:function(){return 1;}}};
function aInsDef(o,k){var m=/^i(\d+)\.(\w+)$/.exec(k);if(!m||!o.ins)return null;var id=+m[1],pn=m[2],j=-1;for(var q=0;q<o.ins.length;q++)if(o.ins[q]&&(o.ins[q].id!=null?o.ins[q].id:q)===id){j=q;break;}var s=o.ins[j];if(!s||!AINS[s.type]||AINS[s.type].indexOf(pn)<0||!INSP[pn])return null;
  var R=INSP[pn],a=R[1],b=R[2],u=R[3],hz=u==='hz';
  return {label:INSDEF[s.type].n+(j>0?' '+(j+1):'')+' '+R[0].toLowerCase(),toN:hz?function(v){return logN(v,a,b);}:function(v){return clamp((v-a)/(b-a),0,1);},fromN:hz?function(n){return nLog(n,a,b);}:function(n){return a+n*(b-a);},
    fmt:function(v){return u==='db'?dec(v,1)+' dB':hz?fHz(v):b<=1?fPct(v):dec(v,2);},nv:null,lin:!hz&&s.type!=='sat',base:function(){return s.p[pn];},
    map:s.type==='sat'?function(v){return dbg(v)/4;}:pn==='hp'?function(v){return v<=20.5?10:v;}:pn==='lp'?function(v){var ny=ctx.sampleRate/2;return v>=19900?ny:Math.min(v,ny);}:aI,
    par:function(n){var x=n.insN&&n.insN[j];if(!x||!x.all)return null;return s.type==='eq'?(pn==='lo'?x.lo.gain:pn==='mid'?x.md.gain:pn==='hi'?x.hi.gain:pn==='hp'?x.hp.frequency:x.lp.frequency):s.type==='comp'?x.c.threshold:s.type==='dly'?(pn==='mix'?x.wet.gain:x.fb.gain):x.pre.gain;}};}
function aDef(o,k){if(!o)return null;return o.isM?MDEF[k]||null:ADEF[k]||aInsDef(o,k);}
function aParam(o,D){return D&&o&&o.n?D.par(o.n):null;}
function aMap(D,v){return D.map?D.map(v):v;}
function aNv(D){return typeof D.nv==='function'?D.nv():D.nv;}
function aMast(){if(!daw.mauto)daw.mauto={};MAST.auto=daw.mauto;MAST.n=N&&N.mAv?{mav:N.mAv,maf:N.mAf}:null;return MAST;}
function aOwner(oi){return oi<0?aMast():tracks[oi];}
function aOwners(){return tracks.concat([aMast()]);}
function aKeysFor(o){if(o.isM)return AFIXM.slice();var k=AFIX.slice();(o.ins||[]).forEach(function(s,j){(AINS[s.type]||[]).forEach(function(p){k.push('i'+(s.id!=null?s.id:j)+'.'+p);});});return k;}
function hasAuto(t,k){return !!(t&&t.auto&&t.auto[k]&&t.auto[k].length);}
function autoBase(t,k){var D=aDef(t,k);return D?D.base(t):1;}
function fmtAuto(k,v){var D=aDef(tracks[daw.lane]||tracks[0],k);return D?D.fmt(v):String(v);}
/* interpolation space of a lane. Volume lanes drawn in the lane editor are marked {i:'db'} on their first point and move linearly in dB
   with a −60 dB floor: a fade to 0 glides evenly in loudness down to −60 dB and only reaches silence on the breakpoint itself, so it
   neither sits at −∞ for half the fade (pure dB) nor collapses early (linear gain). Lanes without the mark (old projects, the global
   overlay) keep the old linear-gain interpolation exactly. Other parameters interpolate in the drawn (normalised) space. */
var DBSP={X:function(v){return v<=0.001?-60:Math.max(-60,20*Math.log10(v));},V:function(x){return x<=-59.999?0:dbg(x);}},LINSP={X:aI,V:aI};
function aIsDb(a){for(var i=0;i<a.length;i++)if(a[i].i==='db')return true;return false;}
function aSp(D,a){return D.db?(aIsDb(a)?DBSP:LINSP):{X:D.toN,V:D.fromN};}
function aMarkDb(o,k,fresh){var D=aDef(o,k),a=o.auto&&o.auto[k];if(!D||!D.db||!a||!a.length)return;if(fresh||aIsDb(a)){a.forEach(function(p){delete p.i;});a[0].i='db';}}
function aSegV(P,Q,u,D,sp){var c=D.step?2:(P.c||0);if(c===2)return P.v;if(u>=1)return Q.v;if(c===1)u=(1-Math.cos(Math.PI*u))/2;var x0=sp.X(P.v);return sp.V(x0+(sp.X(Q.v)-x0)*u);}
function autoValV(a,g,D,sp){sp=sp||aSp(D,a);if(g<=a[0].s)return a[0].v;for(var i=0;i<a.length-1;i++){if(g<a[i+1].s){var p=a[i],q=a[i+1];return aSegV(p,q,(g-p.s)/Math.max(1e-9,q.s-p.s),D,sp);}}return a[a.length-1].v;}
function autoValN(a,g,D){return D.toN(autoValV(a,g,D));}
function autoVal(t,k,g){var D=aDef(t,k);if(!D)return 0;return autoValV(t.auto[k],g,D);}
function aIsOvr(o,k){return !!(o&&o._ovr&&o._ovr[k]);}
function aHold(p,t){try{if(p.cancelAndHoldAtTime&&!offlineRender)p.cancelAndHoldAtTime(t);else p.cancelScheduledValues(t);}catch(e){try{p.cancelScheduledValues(t);}catch(x){}}}
/* time of step g inside schedule S (tempo map aware, incremental cache per lane) */
function aT(S,c,g){if(!daw.tmap)return S.t0+(g-S.g0)*S.sd;if(c.tg==null||g<c.tg){c.tg=S.g0;c.tt=S.t0;}while(c.tg+1<=g+1e-9){c.tt+=tmSd(Math.floor(c.tg+1e-9));c.tg+=1;}return c.tt+(g-c.tg)*tmSd(Math.floor(c.tg+1e-9));}
/* write events for one lane from st.g up to gLim (offline: whole song; live: until tEnd). No iteration cap: every pass advances.
   A segment that is exactly linear or exponential in parameter units (checked numerically) gets one native ramp
   (linear sends/pan/gain, exponential dB fades and log-Hz cutoff); other shapes are sampled in time pieces (10 ms, at most 512 per segment). */
var AFLOOR=dbg(-60);
function aKind(D,sp,P,Q,u0,u2,y0,y2){var c=P.c||0;if(c===1)return 'pc';var f=function(u){return aMap(D,aSegV(P,Q,u,D,sp));},um=(u0+u2)/2,uq=u0+(u2-u0)/4,ym=f(um),yq=f(uq),tol=1e-5*Math.max(1e-6,Math.abs(y0),Math.abs(y2));
  if(Math.abs(ym-(y0+y2)/2)<=tol&&Math.abs(yq-(0.75*y0+0.25*y2))<=tol)return 'lin';
  var a0=sp===DBSP?Math.max(y0,AFLOOR):y0,a2=sp===DBSP?Math.max(y2,AFLOOR):y2;if(sp===DBSP){ym=Math.max(ym,AFLOOR);yq=Math.max(yq,AFLOOR);}
  if(a0>0&&a2>0&&Math.abs(ym-Math.sqrt(a0*a2))<=1e-5*ym&&Math.abs(yq-Math.pow(a0,0.75)*Math.pow(a2,0.25))<=1e-5*yq)return 'exp';return 'pc';}
function aAdv(S,st,gLim,tEnd){var a=st.a,D=st.D,p=st.p,live=tEnd!==Infinity;if(!a||!a.length)return;var sp=aSp(D,a);
  while(st.g<gLim-1e-9){var g=st.g;if(live&&aT(S,st.c,g)>=tEnd)break;
    var i=0;while(i<a.length&&a[i].s<=g+1e-9)i++;
    if(i===0){st.g=Math.min(a[0].s,gLim);continue;}if(i>=a.length){st.g=gLim;continue;}
    var P=a[i-1],Q=a[i],c=D.step?2:(P.c||0),nb=Q.s,L=Math.max(1e-9,nb-P.s);
    if(c===2){if(nb>gLim+1e-9){st.g=gLim;continue;}var tb=aT(S,st.c,nb),y=aMap(D,Q.v);p.setValueAtTime(aMap(D,P.v),Math.max(tb-0.0015,aT(S,st.c,g)));p.linearRampToValueAtTime(y,tb);st.last=y;st.lt=tb;st.g=nb;continue;}
    var g2=Math.min(nb,gLim);if(live)g2=Math.min(g2,g+0.5);
    var u0=(g-P.s)/L,u2=(g2-P.s)/L,y0=aMap(D,aSegV(P,Q,u0,D,sp)),y2=aMap(D,aSegV(P,Q,u2,D,sp)),kind=aKind(D,sp,P,Q,u0,u2,y0,y2),t2=aT(S,st.c,g2),tg0=aT(S,st.c,g);
    /* a ramp starts at the previous event: anchor the segment start (flat stretches before it emit nothing) */
    if(!(st.lt>=tg0-1e-7)){var ya=kind==='exp'&&sp===DBSP?Math.max(y0,AFLOOR):y0;p.setValueAtTime(ya,tg0);st.last=ya;}
    if(kind==='lin'){p.linearRampToValueAtTime(y2,t2);st.last=y2;st.lt=t2;st.g=g2;continue;}
    if(kind==='exp'){var e0=sp===DBSP?Math.max(y0,AFLOOR):y0,e2=sp===DBSP?Math.max(y2,AFLOOR):y2;if(!(st.last>0))p.setValueAtTime(e0,aT(S,st.c,g));p.exponentialRampToValueAtTime(e2,t2);st.last=e2;st.lt=t2;if(y2<=0){p.setValueAtTime(0,t2);st.last=0;}st.g=g2;continue;}
    var tg=aT(S,st.c,g),n=Math.max(1,Math.min(512,Math.ceil((t2-tg)/0.01)));
    for(var q=1;q<=n;q++){var gq=g+(g2-g)*q/n,yq=aMap(D,aSegV(P,Q,(gq-P.s)/L,D,sp));p.linearRampToValueAtTime(yq,aT(S,st.c,gq));st.last=yq;}st.lt=t2;st.g=g2;}}
/* schedule automation from step g0 (at time t0) until step g1; live playback then pumps it ≤100 ms ahead */
function schedAuto(t0,g0,g1,cancel){
  var live=!offlineRender,S={t0:t0,g0:g0,g1:g1>=1e8?1e9:g1,sd:stepDur(),st:[]};
  if(live&&AU&&seq.on){AU.st.forEach(function(st){if(!aIsOvr(st.o,st.k))aAdv(AU,st,AU.g1,t0+1e-4);});}
  aOwners().forEach(function(o){if(!o.n)return;var ks=o.isM?AFIXM.slice():AFIX.slice();Object.keys(o.auto||{}).forEach(function(k){if(ks.indexOf(k)<0&&hasAuto(o,k))ks.push(k);});
    ks.forEach(function(k){var D=aDef(o,k),p=aParam(o,D);if(!p)return;var has=hasAuto(o,k);if(!has&&D.nv==null)return;if(live&&aIsOvr(o,k))return;
      aHold(p,cancel?Math.max(0,t0-0.001):t0);
      if(!has){p.setValueAtTime(aNv(D),t0);return;}
      var st={o:o,k:k,D:D,p:p,a:o.auto[k],g:g0,c:{}};st.last=aMap(D,autoValV(st.a,g0,D));st.lt=t0;p.setValueAtTime(st.last,t0);S.st.push(st);});});
  if(live){AU=S;aPump();}else S.st.forEach(function(st){aAdv(S,st,S.g1,Infinity);});
}
function aPump(){if(!AU||!ctx||offlineRender||!seq.on||seq.mode!=='arrange')return;var tEnd=ctx.currentTime+0.1;AU.st.forEach(function(st){if(!aIsOvr(st.o,st.k))aAdv(AU,st,AU.g1,tEnd);});}
function aGAt(t){var a=arr.anchors||[],k=a.length-1;if(k<0)return daw.play;while(k>0&&a[k].t>t)k--;return a[k].g+(t-a[k].t)/tmSd(a[k].g);}
/* a lane changed (or came back from an override) while playing: glide to the automation from now on */
function aResync(o,k){if(!ctx)return;if(!AU||!seq.on||seq.mode!=='arrange'){autoPreview();return;}
  var D=aDef(o,k),p=aParam(o,D);if(!p)return;var now=ctx.currentTime,tb=now+0.03,gb=aGAt(tb),st=null;
  AU.st=AU.st.filter(function(x){if(x.o===o&&x.k===k){st=x;return hasAuto(o,k);}return true;});aHold(p,now);
  if(!hasAuto(o,k)){if(D.nv!=null)p.setTargetAtTime(aNv(D),now,0.015);else if(!o.isM&&/^i\d/.test(k))insApply(o,+k.charAt(1));return;}
  if(!st){st={o:o,k:k,D:D,p:p,c:{}};AU.st.push(st);}st.a=o.auto[k];st.D=D;st.p=p;
  st.last=aMap(D,autoValV(st.a,gb,D));st.lt=aT(AU,st.c,gb);p.linearRampToValueAtTime(st.last,st.lt);st.g=gb;aPump();}
function autoPreview(){if(!ctx||(seq.on&&seq.mode==='arrange'))return;var now=ctx.currentTime;
  aOwners().forEach(function(o){if(!o.n)return;var ks=o.isM?AFIXM.slice():AFIX.slice();Object.keys(o.auto||{}).forEach(function(k){if(ks.indexOf(k)<0&&hasAuto(o,k))ks.push(k);});
    ks.forEach(function(k){var D=aDef(o,k),p=aParam(o,D);if(!p)return;var has=hasAuto(o,k);if(!has&&D.nv==null)return;aHold(p,now);
      p.setTargetAtTime(has?aMap(D,autoVal(o,k,daw.play)):aNv(D),now,0.015);});});}
/* ---------- override: touching a control during playback takes over until stop (or "Back to automation") ---------- */
function aCtlGet(o,k){return k==='vol'?o.vol:k==='pan'?o.pan:k==='rev'?o.rev:k==='dly'?o.dly:k==='mute'?o.mute:null;}
function aCtlSet(o,k,v){if(k==='vol')o.vol=v;else if(k==='pan')o.pan=v;else if(k==='rev')o.rev=v;else if(k==='dly')o.dly=v;else if(k==='mute')o.mute=v;}
function aTrim(t){return t.volRef?t.vol/t.volRef:1;}
function aFollowVol(t){if(!AU||!seq.on||seq.mode!=='arrange'||!hasAuto(t,'vol')||aIsOvr(t,'vol'))return null;return autoVal(t,'vol',arrPosNow())*aTrim(t);}
function aOverride(o,k){if(!AU||!seq.on||seq.mode!=='arrange'||aIsOvr(o,k))return;var D=aDef(o,k),p=aParam(o,D);o._ovr=o._ovr||{};
  var keep=aCtlGet(o,k),has=hasAuto(o,k),g=arrPosNow();o._ovr[k]={keep:keep,ref:o.volRef};
  if(has&&keep!=null){var cur=autoVal(o,k,g);aCtlSet(o,k,k==='vol'?cur*aTrim(o):k==='mute'?cur<0.5:cur);}
  if(p){aHold(p,ctx.currentTime);if(D.nv!=null)p.setTargetAtTime(aNv(D),ctx.currentTime,0.012);}
  applyMix();aUI();}
function aRelease(o,k){var r=o._ovr&&o._ovr[k];if(!r)return;delete o._ovr[k];if(r.keep!=null)aCtlSet(o,k,r.keep);if(k==='vol')o.volRef=r.ref;applyMix();}
function aBack(){aW_commitAll();aOwners().forEach(function(o){Object.keys(o._ovr||{}).forEach(function(k){aRelease(o,k);aResync(o,k);});});$$('#mxR .knob').forEach(function(el){try{mxKnobPaint(el);}catch(e){}});$$('#mxR [data-mxpan]').forEach(function(el){var t=tracks[+el.getAttribute('data-mxpan')];if(t)el.value=t.pan;});aUI();}
function aAnyOvr(){return aOwners().some(function(o){return o._ovr&&Object.keys(o._ovr).length;});}
function aStop(){aW_commitAll();aOwners().forEach(function(o){Object.keys(o._ovr||{}).forEach(function(k){aRelease(o,k);});});AU=null;if(AL.tilt)AL.tilt.live=false;aUI();AL.need=true;}
/* insert parameters: an edit in the insert sheet during playback overrides; a rebuild resyncs the lanes onto the new nodes */
insApply=(function(f){return function(t,j){var si=t&&t.ins&&t.ins[j],pre='i'+(si&&si.id!=null?si.id:j)+'.';if(!AL.inB&&AU&&t&&t.auto)Object.keys(t.auto).forEach(function(k){if(k.indexOf(pre)===0&&hasAuto(t,k)&&!aIsOvr(t,k)){t._ovr=t._ovr||{};t._ovr[k]={keep:null};var D=aDef(t,k),p=aParam(t,D);if(p)aHold(p,ctx.currentTime);aUI();}});f(t,j);};})(insApply);
insBuild=(function(f){return function(t,i){AL.inB=true;try{f(t,i);}finally{AL.inB=false;}if(t&&t.auto&&!offlineRender&&!hist.lock){var gone=Object.keys(t.auto).filter(function(k){return /^i\d+\./.test(k)&&!aInsDef(t,k);});if(gone.length){gone.forEach(function(k){delete t.auto[k];});AL.lanes=AL.lanes.filter(function(l){return !(aOwner(l.oi)===t&&gone.indexOf(l.k)>=0);});markDirty();toast('The removed insert’s automation was removed too. Tap ↶ to undo.',3000);if($('#alPanel'))alRender();}}if(t&&t.auto&&ctx&&!offlineRender)Object.keys(t.auto).forEach(function(k){if(/^i\d/.test(k)&&hasAuto(t,k)&&!aIsOvr(t,k))aResync(t,k);});};})(insBuild);
/* ---------- recording: Mix fader / knobs / pan / mute / Throw (and tilt) write into the lane while the Studio timeline plays ---------- */
function aRecOn(){return AL.rec&&seq.on&&seq.mode==='arrange'&&!!AU;}
function aW_start(o,k,get){if(AL.W.some(function(w){return w.o===o&&w.k===k;}))return;var D=aDef(o,k);if(!D)return;aOverride(o,k);
  var r=o._ovr&&o._ovr[k],trim=k==='vol'?(r&&r.ref?r.keep/r.ref:1):1;
  var w={o:o,k:k,D:D,get:get,trim:trim,pts:[],g0:arrPosNow()};AL.W.push(w);aW_sample(w);if(!AL.wt)AL.wt=setInterval(aW_tick,40);}
function aW_sample(w){var g=arrPosNow(),v=w.get();if(v==null)return;if(w.k==='vol')v=v/(w.trim||1);if(w.k==='mute')v=v?0:1;
  var L=w.pts[w.pts.length-1];if(L&&g<L.s-0.5){aW_commit(w);w.g0=g;}w.pts.push({s:Math.max(0,g),v:v});AL.need=true;}
function aW_tick(){if(!aRecOn()||!AL.W.length){if(!AL.W.length){clearInterval(AL.wt);AL.wt=null;}return;}AL.W.forEach(aW_sample);}
function aW_commit(w){var P=w.pts;w.pts=[];if(!P.length)return;var D=w.D,o=w.o,k=w.k,s0=P[0].s,s1=P[P.length-1].s,fresh=!hasAuto(o,k);
  var th=P.length>2?aRdp(P.map(function(p){return [p.s,D.toN(p.v),p];}),0.004,0.012).map(function(x){return x[2];}):P;
  if(D.step){th=[];P.forEach(function(p){var L=th[th.length-1];if(!L||L.v!==p.v)th.push(p);});}
  th=th.map(function(p){return {s:Math.round(p.s*100)/100,v:Math.round(p.v*10000)/10000,c:D.step?2:0};});
  o.auto=o.auto||{};var a=(o.auto[k]||[]).filter(function(p){return p.s<s0-1e-6||p.s>s1+1e-6;});o.auto[k]=aSort(a.concat(th));aMarkDb(o,k,fresh);markDirty();AL.need=true;if($('#t-daw')&&$('#t-daw').classList.contains('active'))alRender();}
function aW_commitAll(){var W=AL.W;AL.W=[];W.forEach(aW_commit);if(AL.wt){clearInterval(AL.wt);AL.wt=null;}}
function aW_end(o,k){if(AL.mode!=='touch')return;AL.W=AL.W.filter(function(w){if(w.o===o&&w.k===k){aW_commit(w);return false;}return true;});aRelease(o,k);aResync(o,k);aUI();}
function aSort(a){a.sort(function(x,y){return x.s-y.s;});var out=[];a.forEach(function(p){var L=out[out.length-1];if(L&&Math.abs(L.s-p.s)<1e-6)out[out.length-1]=p;else out.push(p);});return out;}
/* Ramer–Douglas–Peucker on [x, y, ...] with x scaled by sx (steps → comparable units) */
function aRdp(P,eps,sx){if(P.length<3)return P;var keep=new Uint8Array(P.length);keep[0]=keep[P.length-1]=1;var stack=[[0,P.length-1]];
  while(stack.length){var r=stack.pop(),a=r[0],b=r[1],ax=P[a][0]*sx,ay=P[a][1],bx=P[b][0]*sx,by=P[b][1],dx=bx-ax,dy=by-ay,L=Math.sqrt(dx*dx+dy*dy)||1e-9,mi=-1,md=0;
    for(var i=a+1;i<b;i++){var d=Math.abs(dy*(P[i][0]*sx-ax)-dx*(P[i][1]-ay))/L;if(d>md){md=d;mi=i;}}if(mi>=0&&md>eps){keep[mi]=1;stack.push([a,mi],[mi,b]);}}
  return P.filter(function(_,i){return keep[i];});}
function aCtlTarget(el){var b;
  if((b=el.closest('[data-fdr]'))){var k=b.getAttribute('data-fdr');if(!/^\d+$/.test(k))return null;var t=tracks[+k];return t?{o:t,k:'vol',get:function(){return t.vol;}}:null;}
  if((b=el.closest('#mxR [data-knob]'))){var t2=tracks[+b.getAttribute('data-t')],w=b.getAttribute('data-knob')==='a'?'rev':'dly';return t2?{o:t2,k:w,get:function(){return t2[w];}}:null;}
  if((b=el.closest('[data-mxpan]'))){var t3=tracks[+b.getAttribute('data-mxpan')];return t3?{o:t3,k:'pan',get:function(){return t3.pan;}}:null;}
  if((b=el.closest('[data-mxm]'))){var k4=b.getAttribute('data-mxm');if(!/^\d+$/.test(k4))return null;var t4=tracks[+k4];return t4?{o:t4,k:'mute',get:function(){return t4.mute;}}:null;}
  if((b=el.closest('[data-thr]'))){var t5=tracks[+b.getAttribute('data-thr')];return t5?{o:t5,k:'dly',get:function(){return t5._thr?1:t5.dly;}}:null;}
  return null;}
document.addEventListener('pointerdown',function(e){if(!AU||!seq.on||seq.mode!=='arrange'||!e.target.closest)return;var c=aCtlTarget(e.target);if(!c)return;
  if(aRecOn()&&document.body.classList.contains('is-pro')){aW_start(c.o,c.k,c.get);AL.touch=c;}else if(hasAuto(c.o,c.k))aOverride(c.o,c.k);},true);
['pointerup','pointercancel'].forEach(function(ev){document.addEventListener(ev,function(){var c=AL.touch;AL.touch=null;if(c)setTimeout(function(){aW_end(c.o,c.k);},c.k==='mute'?80:0);},true);});
/* UI follows automation while playing: pan sliders and send knobs in Mix (faders follow through mxGet) */
setInterval(function(){if(!AU||!seq.on||seq.mode!=='arrange')return;var g=arrPosNow();
  $$('#mxR [data-mxpan]').forEach(function(el){var t=tracks[+el.getAttribute('data-mxpan')];if(t&&hasAuto(t,'pan')&&!aIsOvr(t,'pan'))el.value=autoVal(t,'pan',g);});
  $$('#mxR [data-knob]').forEach(function(el){var t=tracks[+el.getAttribute('data-t')],k=el.getAttribute('data-knob')==='a'?'rev':'dly';if(t&&hasAuto(t,k)&&!aIsOvr(t,k))el.style.setProperty('--r',(-135+270*autoVal(t,k,g))+'deg');});},90);
/* tilt-to-filter: the device's forward tilt drives the cutoff lane (live), and writes it while recording */
function aTiltToggle(oi,k){if(AL.tilt){window.removeEventListener('deviceorientation',aTiltEv);var same=AL.tilt.oi===oi&&AL.tilt.k===k;AL.tilt=null;if(same){toast('Tilt-to-filter off.');alSheet();return;}}
  var go=function(){AL.tilt={oi:oi,k:k,base:null,n:0.5};window.addEventListener('deviceorientation',aTiltEv);toast('Tilt-to-filter on: tilt the phone forward to open the filter. It writes the lane while ● Rec auto runs.',3200);alSheet();};
  var DOE=window.DeviceOrientationEvent;if(DOE&&typeof DOE.requestPermission==='function'){DOE.requestPermission().then(function(r){if(r==='granted')go();else toast('Motion access was not allowed.');}).catch(function(){toast('Motion access was not allowed.');});}else if(DOE)go();else toast('This device has no motion sensor.');}
function aTiltEv(e){var T=AL.tilt;if(!T||e.beta==null)return;if(T.base==null)T.base=e.beta;T.n=clamp(0.5+(e.beta-T.base)/70,0,1);var o=aOwner(T.oi);if(!o||!ctx||!AU||!seq.on||seq.mode!=='arrange')return;
  var D=aDef(o,T.k),p=aParam(o,D);if(aRecOn()&&!AL.W.some(function(w){return w.o===o&&w.k===T.k;}))aW_start(o,T.k,function(){return AL.tilt?AL.tilt.n:null;});
  else if(!aIsOvr(o,T.k)){o._ovr=o._ovr||{};o._ovr[T.k]={keep:null};if(p)aHold(p,ctx.currentTime);aUI();}
  if(p)p.setTargetAtTime(aMap(D,T.n),ctx.currentTime,0.03);}
/* ---------- lane panel (Studio, under the tracks) ---------- */
function alHas(oi){return !!AL&&AL.lanes.some(function(l){return l.oi===oi;});}
function alToggle(oi){if(alHas(oi)){AL.lanes=AL.lanes.filter(function(l){return l.oi!==oi;});}else{var o=aOwner(oi);if(!o)return;var ks=Object.keys(o.auto||{}).filter(function(k){return hasAuto(o,k)&&aDef(o,k);});if(!ks.length)ks=[oi<0?'mvol':'vol'];ks.forEach(function(k){AL.lanes.push({oi:oi,k:k});});}
  AL.sel=null;renderDawHeads();}
function alTrackRemoved(i){var t=tracks[i];AL.lanes=AL.lanes.filter(function(l){return l.oi!==i;}).map(function(l){return {oi:l.oi>i?l.oi-1:l.oi,k:l.k};});if(AL.sel&&AL.sel.o===t)AL.sel=null;if(AL.tilt&&AL.tilt.oi===i){window.removeEventListener('deviceorientation',aTiltEv);AL.tilt=null;}else if(AL.tilt&&AL.tilt.oi>i)AL.tilt.oi--;AL.W=AL.W.filter(function(w){return w.o!==t;});if(AU)AU.st=AU.st.filter(function(x){return x.o!==t;});var S=$('#alSheet');if(S)S.hidden=true;}
function alValid(){AL.lanes=AL.lanes.filter(function(l){return (l.oi<0||tracks[l.oi])&&aDef(aOwner(l.oi),l.k);});}
var alCv=null,alG=null,alW=300,alDp=null;
function alEnsure(){if($('#alPanel'))return true;var w=$('#dawWrap');if(!w)return false;
  var P=document.createElement('div');P.id='alPanel';P.className='mx-adv';P.hidden=true;
  P.innerHTML='<div class="al-bar"><b>Automation</b><button id="alRec" class="al-b" aria-pressed="false" aria-label="Record automation">● Rec auto</button><div class="seg al-seg" role="group" aria-label="Automation record mode"><button data-alm="latch" aria-pressed="true">Latch</button><button data-alm="touch" aria-pressed="false">Touch</button></div><button id="alMst" class="al-b" aria-label="Show master automation lanes">+ Master</button><button id="alBackS" class="al-b alBackB" hidden>↺ Back to automation</button></div>'+
    '<div class="al-grid"><div id="alHeads"></div><canvas id="alCv" aria-label="Automation lanes. Drag to draw, tap to add a point, drag a point to move it, long-press a point to delete it."></canvas></div>'+
    '<p class="note al-note">Draw with one finger. Tools in the lane menu use the loop range (drag the ruler). Automation stays at absolute bars: Song › Sections changes do not move it.</p>';
  w.insertAdjacentElement('afterend',P);
  $('#alBackS').addEventListener('click',aBack);
  var S=document.createElement('div');S.id='alSheet';S.hidden=true;S.setAttribute('role','dialog');S.setAttribute('aria-label','Automation lane');document.body.appendChild(S);
  $('#alRec').addEventListener('click',function(){AL.rec=!AL.rec;aUI();toast(AL.rec?'Automation recording armed: press ▶ in Studio and move a Mix fader, knob, pan, M or Throw.':'Automation recording off.',2600);});
  $$('[data-alm]').forEach(function(b){b.addEventListener('click',function(){AL.mode=b.getAttribute('data-alm');aUI();});});
  $('#alMst').addEventListener('click',function(){alToggle(-1);});
  alCv=$('#alCv');alG=alCv.getContext('2d');alPointer();requestAnimationFrame(alFrame);return true;}
function aUI(){var b=$('#alRec');if(b){b.setAttribute('aria-pressed',String(AL.rec));b.classList.toggle('on',AL.rec);$$('[data-alm]').forEach(function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-alm')===AL.mode));});var m=$('#alMst');if(m)m.setAttribute('aria-pressed',String(alHas(-1)));}
  var mr=$('#mxR');if(mr&&!$('#alBack')){var B=document.createElement('button');B.id='alBack';B.className='al-b alBackB';B.hidden=true;B.textContent='↺ Back to automation';B.addEventListener('click',aBack);mr.insertAdjacentElement('beforebegin',B);}
  var on=aAnyOvr();$$('.alBackB').forEach(function(x){x.hidden=!on;});}
function alRender(){if(!alEnsure())return;alValid();var P=$('#alPanel'),H=$('#alHeads');P.hidden=!AL.lanes.length;aUI();if(!AL.lanes.length)return;
  var hw=($('#dawHeads')||{}).offsetWidth||92;P.querySelector('.al-grid').style.gridTemplateColumns=hw+'px minmax(0,1fr)';
  H.innerHTML=AL.lanes.map(function(l,i){var o=aOwner(l.oi),D=aDef(o,l.k),col=l.oi<0?'#D4FF3A':DAWCOL[l.oi%DAWCOL.length];
    return '<div class="alh" style="--c:'+col+';height:'+AL.LH+'px"><span class="altn">'+escH(o.name)+'</span><div class="alr"><button class="alx" data-alx="'+i+'" aria-label="Hide lane">×</button><button class="alp" data-alp="'+i+'" aria-label="'+escH(o.name)+' '+escH(D.label)+' lane menu">'+escH(D.label)+(hasAuto(o,l.k)?'':' ·')+'</button></div></div>';}).join('');
  $$('[data-alp]').forEach(function(b){b.addEventListener('click',function(){AL.sheet=+b.getAttribute('data-alp');alSheet();});});
  $$('[data-alx]').forEach(function(b){b.addEventListener('click',function(){AL.lanes.splice(+b.getAttribute('data-alx'),1);renderDawHeads();});});
  alResize();}
function alResize(){if(!alCv)return;var dpr=window.devicePixelRatio||1,W=Math.max(100,alCv.getBoundingClientRect().width||dW),H=AL.lanes.length*AL.LH;alW=W;alCv.style.height=H+'px';alCv.width=Math.round(W*dpr);alCv.height=Math.max(1,Math.round(H*dpr));alG.setTransform(dpr,0,0,dpr,0,0);AL.need=true;}
renderDawHeads=(function(f){return function(){f();try{alRender();}catch(e){errLog.push('alRender: '+e.message);}};})(renderDawHeads);
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-lal]');if(!b)return;alToggle(+b.getAttribute('data-lal'));});
function alLane(i){var l=AL.lanes[i];if(!l)return null;var o=aOwner(l.oi);return o?{l:l,o:o,D:aDef(o,l.k),y:i*AL.LH}:null;}
function alYN(L,n){return L.y+8+(1-n)*(AL.LH-16);}
function alNY(L,y){return clamp(1-(y-L.y-8)/(AL.LH-16),0,1);}
function alFrame(){requestAnimationFrame(alFrame);if(!alG||!AL.lanes.length)return;var vis=$('#t-daw')&&$('#t-daw').classList.contains('active');if(!vis)return;
  var playing=seq.on&&seq.mode==='arrange';if(!playing&&!AL.need&&daw.sx===AL.lastSx&&daw.ppx===AL.lastPpx)return;AL.lastSx=daw.sx;AL.lastPpx=daw.ppx;AL.need=false;alDraw(playing?arrPosNow():daw.play);}
function alDraw(pos){var g=alG,W=alW,ppx=daw.ppx,H=AL.lanes.length*AL.LH;if(Math.abs(alCv.clientWidth-W)>1){alResize();W=alW;}
  g.clearRect(0,0,W,H);g.fillStyle='#0E0E15';g.fillRect(0,0,W,H);
  var g0=Math.max(0,Math.floor(daw.sx)),g1=Math.ceil(daw.sx+W/ppx)+1;
  if(daw.loop.b>daw.loop.a){g.fillStyle=daw.loop.on?'rgba(212,255,58,.07)':'rgba(255,255,255,.03)';g.fillRect(sx2(daw.loop.a),0,(daw.loop.b-daw.loop.a)*ppx,H);}
  for(var s=g0-(g0%4);s<=g1;s+=4){var x=sx2(s);g.fillStyle=s%16===0?'#2A2A38':'#191922';if(s%16===0||ppx*4>=10)g.fillRect(x,0,1,H);}
  AL.lanes.forEach(function(l,i){var L=alLane(i);if(!L||!L.D)return;var o=L.o,D=L.D,col=l.oi<0?'#D4FF3A':DAWCOL[l.oi%DAWCOL.length],has=hasAuto(o,l.k),a=has?o.auto[l.k]:null;
    g.fillStyle='#2A2A36';g.fillRect(0,L.y+AL.LH-1,W,1);
    if(!has){g.setLineDash([4,4]);g.strokeStyle=hexA(col,0.5);var by=alYN(L,D.toN(D.base(o)));g.beginPath();g.moveTo(0,by);g.lineTo(W,by);g.stroke();g.setLineDash([]);g.fillStyle='rgba(244,244,247,.45)';g.font='600 10px Inter, system-ui, sans-serif';g.fillText('drag to draw · tap to add',6,L.y+AL.LH-8);return;}
    g.fillStyle=hexA(col,0.12);g.beginPath();g.moveTo(0,L.y+AL.LH-8);for(var x=0;x<=W;x+=2)g.lineTo(x,alYN(L,autoValN(a,x/ppx+daw.sx,D)));g.lineTo(W,L.y+AL.LH-8);g.closePath();g.fill();
    g.strokeStyle=col;g.lineWidth=2;g.beginPath();for(x=0;x<=W;x+=2){var yy=alYN(L,autoValN(a,x/ppx+daw.sx,D));if(x)g.lineTo(x,yy);else g.moveTo(x,yy);}g.stroke();g.lineWidth=1;
    a.forEach(function(p){var px=sx2(p.s);if(px<-8||px>W+8)return;var sel=AL.sel&&AL.sel.p===p;g.fillStyle=sel?'#F4F4F7':col;g.beginPath();g.arc(px,alYN(L,D.toN(p.v)),sel?7:5,0,6.283);g.fill();if(p.c){g.fillStyle='#0E0E15';g.font='700 8px Inter, system-ui, sans-serif';g.fillText(p.c===2?'⌐':'~',px-2.5,alYN(L,D.toN(p.v))+3);}});
    if(aIsOvr(o,l.k)){g.fillStyle='rgba(255,138,91,.9)';g.font='700 10px Inter, system-ui, sans-serif';g.fillText('overridden',W-70,L.y+14);}});
  AL.W.forEach(function(w){var i=-1;AL.lanes.forEach(function(l,j){if(aOwner(l.oi)===w.o&&l.k===w.k)i=j;});if(i<0||!w.pts.length)return;var L=alLane(i);g.strokeStyle='#FF5C7A';g.lineWidth=2;g.beginPath();w.pts.forEach(function(p,j){var X=sx2(p.s),Y=alYN(L,w.D.toN(p.v));if(j)g.lineTo(X,Y);else g.moveTo(X,Y);});g.stroke();g.lineWidth=1;});
  var T=AL.tip;if(T){g.font='700 12px Inter, system-ui, sans-serif';var tw=g.measureText(T.t).width+12,tx=clamp(T.x-tw/2,2,W-tw-2),ty=T.y-34<2?T.y+16:T.y-34;g.fillStyle='rgba(20,20,28,.95)';rr(g,tx,ty,tw,22,6);g.fill();g.strokeStyle='#F4F4F7';rr(g,tx+0.5,ty+0.5,tw-1,21,6);g.stroke();g.fillStyle='#F4F4F7';g.fillText(T.t,tx+6,ty+15);}
  var ph=sx2(pos);g.fillStyle='#5CE1E6';g.fillRect(ph,0,2,H);}
function alEdited(o,k,fresh){if(o.auto&&o.auto[k]&&!o.auto[k].length)delete o.auto[k];aMarkDb(o,k,fresh);if(!o.isM)applyMix();aResync(o,k);markDirty();AL.need=true;}
function alTipFor(L,s,v){AL.tip={x:sx2(s),y:alYN(L,L.D.toN(v)),t:L.D.fmt(v)+' · bar '+fxBar(s)};}
function alPointer(){var cv=alCv,lp=null;
  function xy(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  cv.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();try{cv.setPointerCapture(e.pointerId);}catch(x){}var p=xy(e),i=Math.floor(p.y/AL.LH),L=alLane(i);if(!L||!L.D)return;
    var o=L.o,k=L.l.k,a=(o.auto&&o.auto[k])||[],best=null,bd=22;a.forEach(function(q){var dx=sx2(q.s)-p.x,dy=alYN(L,L.D.toN(q.v))-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<bd){bd=d;best=q;}});
    alDp={L:L,x0:p.x,y0:p.y,t0:performance.now(),moved:false,pt:best,raw:[[p.x/daw.ppx+daw.sx,alNY(L,p.y)]]};
    if(best){AL.sel={o:o,k:k,p:best};alTipFor(L,best.s,best.v);clearTimeout(lp);lp=setTimeout(function(){if(alDp&&alDp.pt===best&&!alDp.moved){o.auto[k]=a.filter(function(q){return q!==best;});AL.sel=null;AL.tip=null;alDp=null;alEdited(o,k);toast('Point deleted.',1200);}},550);}
    else{var n0=alNY(L,p.y);alTipFor(L,p.x/daw.ppx+daw.sx,L.D.fromN(n0));}AL.need=true;});
  cv.addEventListener('pointermove',function(e){if(!alDp)return;var p=xy(e),L=alDp.L,D=L.D;if(Math.abs(p.x-alDp.x0)+Math.abs(p.y-alDp.y0)>6)alDp.moved=true;if(!alDp.moved)return;var s=Math.max(0,p.x/daw.ppx+daw.sx),n=alNY(L,p.y);
    if(alDp.pt){var o=L.o,a=o.auto[L.l.k],j=a.indexOf(alDp.pt),lo=j>0?a[j-1].s+0.01:0,hi=j<a.length-1?a[j+1].s-0.01:1e9;var sn=daw.snap?dawSnap(s,daw.snap):s;alDp.pt.s=Math.round(clamp(sn,lo,hi)*100)/100;alDp.pt.v=D.fromN(n);alTipFor(L,alDp.pt.s,alDp.pt.v);}
    else{var R=alDp.raw,last=R[R.length-1];if(s>last[0]+0.02)R.push([s,n]);else if(Math.abs(s-last[0])<=0.02)last[1]=n;alTipFor(L,s,D.fromN(n));}AL.need=true;});
  function up(e){clearTimeout(lp);var d=alDp;alDp=null;AL.tip=null;AL.need=true;if(!d)return;var L=d.L,o=L.o,k=L.l.k,D=L.D;
    if(d.pt){if(d.moved)alEdited(o,k);return;}
    o.auto=o.auto||{};var a=o.auto[k]||[];
    if(!d.moved){var s0=dawSnap(d.raw[0][0],daw.snap||1),v0=D.fromN(d.raw[0][1]);var np={s:s0,v:v0};if(D.step)np.c=2;o.auto[k]=aSort(a.concat([np]));AL.sel={o:o,k:k,p:np};alEdited(o,k,!a.length);if(!a.length)alRender();return;}
    var R=d.raw;if(R.length<2)return;var th=aRdp(R,2.5/(AL.LH-16),daw.ppx/(AL.LH-16));
    var pts=th.map(function(r){var s=AL.snap&&daw.snap?dawSnap(r[0],daw.snap):Math.round(r[0]*100)/100;var q={s:s,v:D.fromN(r[1])};if(D.step)q.c=2;return q;});pts=aSort(pts);
    var s1=pts[0].s,s2=pts[pts.length-1].s;o.auto[k]=aSort(a.filter(function(p){return p.s<s1-1e-6||p.s>s2+1e-6;}).concat(pts));alEdited(o,k,!a.length);if(!a.length)alRender();}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
/* ---------- lane sheet: parameter picker, segment shape, tools, LFO, tilt ---------- */
function alSheet(){var S=$('#alSheet');if(!S)return;var L=alLane(AL.sheet);if(!L){S.hidden=true;return;}var o=L.o,k=L.l.k,D=L.D,ks=aKeysFor(o).filter(function(x){return aDef(o,x);});
  var h='<div class="al-sh"><div class="row"><b>'+escH(o.name)+' · '+escH(D.label)+'</b><button class="al-b" data-als="close" style="margin-left:auto" aria-label="Close">Done</button></div>'+
    '<span class="kicker">Parameter</span><div class="al-ks">'+ks.map(function(x){var d2=aDef(o,x);return '<button data-alk="'+x+'" aria-pressed="'+(x===k)+'">'+escH(d2.label)+(hasAuto(o,x)?' •':'')+'</button>';}).join('')+'</div>'+
    (D.step?'':'<span class="kicker">Shape '+(AL.sel&&AL.sel.o===o&&AL.sel.k===k?'(from the selected point)':'(whole lane)')+'</span><div class="al-ks">'+[['0','Linear'],['1','Smooth'],['2','Step']].map(function(x){return '<button data-alc="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>')+
    '<span class="kicker">Tools · loop range bar '+fxBar(daw.loop.a)+' → '+fxBar(daw.loop.b)+'</span><div class="al-ks"><button data-als="clr">Clear lane</button><button data-als="clrr">Clear range</button><button data-als="copy">Copy range</button><button data-als="paste"'+(AL.clip?'':' disabled')+'>Paste at playhead</button></div>'+
    '<span class="kicker">LFO over the loop range</span><div class="al-ks">'+['sine','saw','square'].map(function(sh){return [[4,'1/4'],[2,'1/8'],[16,'1 bar'],[32,'2 bars'],[64,'4 bars']].map(function(r){return '<button data-alfo="'+sh+':'+r[0]+'">'+sh.charAt(0).toUpperCase()+sh.slice(1)+' '+r[1]+'</button>';}).join('');}).join('')+'</div>'+
    '<div class="al-ks"><button data-als="snap" aria-pressed="'+AL.snap+'">Snap drawn points to grid</button>'+(k==='cut'||k==='mcut'?'<button data-als="tilt" aria-pressed="'+!!(AL.tilt&&AL.tilt.oi===L.l.oi&&AL.tilt.k===k)+'">Tilt-to-filter</button>':'')+'<button data-als="add">+ Lane</button><button data-als="rm">Hide lane</button></div>'+
    '<p class="note">Selection = the loop range (drag the ruler). Automation is kept at absolute bars: reordering or resizing sections in Song › Sections does not move it, so copy/paste it after big structure changes.</p></div>';
  S.innerHTML=h;S.hidden=false;
  S.querySelectorAll('[data-alk]').forEach(function(b){b.addEventListener('click',function(){L.l.k=b.getAttribute('data-alk');AL.sel=null;alRender();alSheet();});});
  S.querySelectorAll('[data-alc]').forEach(function(b){b.addEventListener('click',function(){var c=+b.getAttribute('data-alc'),a=o.auto&&o.auto[k];if(!a)return;if(AL.sel&&AL.sel.o===o&&AL.sel.k===k)AL.sel.p.c=c;else a.forEach(function(p){p.c=c;});alEdited(o,k);toast('Shape: '+b.textContent+'.',1000);});});
  S.querySelectorAll('[data-alfo]').forEach(function(b){b.addEventListener('click',function(){var q=b.getAttribute('data-alfo').split(':');alLfo(o,k,D,q[0],+q[1]);});});
  S.querySelectorAll('[data-als]').forEach(function(b){b.addEventListener('click',function(){var w=b.getAttribute('data-als'),A=daw.loop.a,B=daw.loop.b;o.auto=o.auto||{};var a=o.auto[k]||[];
    if(w==='close'){S.hidden=true;return;}
    if(w==='clr'){if(o.auto)delete o.auto[k];AL.sel=null;alEdited(o,k);alRender();}
    else if(w==='clrr'){if(B<=A)return toast('Set a loop range on the ruler first.');o.auto[k]=a.filter(function(p){return p.s<A||p.s>B;});alEdited(o,k);}
    else if(w==='copy'){if(B<=A)return toast('Set a loop range on the ruler first.');AL.clip={len:B-A,pts:a.filter(function(p){return p.s>=A&&p.s<=B;}).map(function(p){return {s:p.s-A,v:p.v,c:p.c};}),k:k};if(hasAuto(o,k)&&!AL.clip.pts.some(function(p){return p.s===0;}))AL.clip.pts.unshift({s:0,v:autoVal(o,k,A)});toast('Copied '+AL.clip.pts.length+' points.',1200);}
    else if(w==='paste'){if(!AL.clip)return;var s0=dawSnap(daw.play,daw.snap||1),Lc=AL.clip.len,np=AL.clip.pts.map(function(p){var q={s:p.s+s0,v:p.v};if(p.c)q.c=p.c;return q;});o.auto=o.auto||{};o.auto[k]=aSort(a.filter(function(p){return p.s<s0||p.s>s0+Lc;}).concat(np));alEdited(o,k,!a.length);if(AL.clip.k!==k)toast('Pasted values from another parameter.',1600);}
    else if(w==='snap'){AL.snap=!AL.snap;}
    else if(w==='tilt'){aTiltToggle(L.l.oi,k);return;}
    else if(w==='add'){var nk=ks.filter(function(x){return !AL.lanes.some(function(l){return l.oi===L.l.oi&&l.k===x;});})[0];if(nk){AL.lanes.splice(AL.sheet+1,0,{oi:L.l.oi,k:nk});AL.sheet++;renderDawHeads();}}
    else if(w==='rm'){AL.lanes.splice(AL.sheet,1);S.hidden=true;renderDawHeads();return;}
    alSheet();});});}
function alLfo(o,k,D,sh,per){var A=daw.loop.a,B=daw.loop.b;if(B<=A){toast('Set a loop range on the ruler first.');return;}var a=(o.auto&&o.auto[k])||[],c=hasAuto(o,k)?autoValN(a,A,D):D.toN(D.base(o)),hi=clamp(c+0.4,0,1),lo=clamp(c-0.4,0,1),pts=[],s;
  if(c>0.6){hi=1;lo=0.2;}else if(c<0.4){lo=0;hi=0.8;}
  if(sh==='sine'){for(s=A;s<B-1e-6;s+=per/2)pts.push({s:s,v:D.fromN(((s-A)/(per/2))%2<1e-6?hi:lo),c:1});pts.forEach(function(p,i){p.v=D.fromN(i%2?lo:hi);});}
  else if(sh==='saw'){for(s=A;s<B-1e-6;s+=per){pts.push({s:s,v:D.fromN(lo),c:0});pts.push({s:Math.round((s+per-0.05)*100)/100,v:D.fromN(hi),c:2});}}
  else{for(s=A;s<B-1e-6;s+=per){pts.push({s:s,v:D.fromN(hi),c:2});pts.push({s:s+per/2,v:D.fromN(lo),c:2});}}
  pts.push({s:B,v:D.fromN(c)});o.auto=o.auto||{};o.auto[k]=aSort(a.filter(function(p){return p.s<A||p.s>B;}).concat(pts));alEdited(o,k,!a.length);toast('LFO drawn: '+pts.length+' points.',1200);}
window.addEventListener('resize',function(){if(AL.lanes.length)alRender();});
