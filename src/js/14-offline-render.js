function compMakeupDb(thr,ratio,knee){return Math.max(0,0.6*(-(thr+(knee||0)/2))*(1-1/ratio)+(knee?0.25:0));}
function dbg(db){return Math.pow(10,db/20);}
function setCeil(db){if(!N.comp||!N.clip)return;var thr=db-0.6;N.comp.threshold.value=thr;N.limMk.gain.value=dbg(-compMakeupDb(thr,20,0));N.clip.curve=softClipCurve(Math.pow(10,(db-0.35)/20));}
function softClipCurve(cl){var n=4096,c=new Float32Array(n),ceil=cl||0.966,kn=ceil*0.88;for(var i=0;i<n;i++){var x=i/(n-1)*2-1,a=Math.abs(x),y=a<kn?a:kn+(ceil-kn)*Math.tanh((a-kn)/(ceil-kn));c[i]=(x<0?-1:1)*Math.min(y,ceil);}return c;}
var REC_WORKLET="class R extends AudioWorkletProcessor{constructor(){super();this.on=false;this.port.onmessage=e=>{this.on=!!e.data;};}process(i,o){var c=i[0];if(this.on&&c&&c.length){this.port.postMessage([c[0].slice(0),(c[1]||c[0]).slice(0)]);}return true;}}registerProcessor('ecou-rec',R);";
function setupWorkletTap(){
  if(!ctx.audioWorklet||offlineRender)return;
  try{var url=URL.createObjectURL(new Blob([REC_WORKLET],{type:'application/javascript'}));
    ctx.audioWorklet.addModule(url).then(function(){
      var w=new AudioWorkletNode(ctx,'ecou-rec',{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'explicit'});
      w.port.onmessage=function(e){if(!wavRec||wavRec.bounce)return;wavRec.L.push(e.data[0]);wavRec.R.push(e.data[1]);wavRec.n+=e.data[0].length;if(wavRec.n>ctx.sampleRate*600)stopRec();};
      var z=ctx.createGain();z.gain.value=0;N.clip.connect(w);w.connect(z);z.connect(ctx.destination);
      try{N.clip.disconnect(N.tap);}catch(e){}N.tapW=w;
    }).catch(function(){});
  }catch(e){}
}
var offlineRender=false;
function songOrder(){return song.length?song:[curPat];}
var offQueue=null;
function defer(t,fn){if(offQueue)offQueue.push({t:t,fn:fn});else fn();}
function scheduleSong(t0){
  var t=t0,sd=stepDur();
  songOrder().forEach(function(pi){var pt=patterns[pi];
    for(var s=0;s<pt.len;s++){
      (function(pt,s,t){defer(t,function(){drumStep(pt,s,t,sd);
      for(var ti=1;ti<tracks.length;ti++){if(tracks[ti].kind!=='keys')continue;var ns=pt.notes[ti]||[];for(var j=0;j<ns.length;j++){var n=ns[j];if(n.s>=s&&n.s<s+1)playNote(ti,n.m,n.v,t+(n.s-s)*sd,Math.max(0.05,n.l*sd));}}});})(pt,s,t);
      var sw=P.swing.v*sd*0.5;t+=sd+(s%2===0?sw:-sw);
    }});
  return t;
}
function renderOffline(opts){
  opts=opts||{};if(ctx)saveSound(selTrack);
  var src=opts.src||'song',sr=ctx.sampleRate,sd=stepDur(),steps=src==='arrange'?(opts.range?opts.range[1]-opts.range[0]:Math.ceil(arrEnd())):songOrder().reduce(function(a,pi){return a+patterns[pi].len;},0),dur=(src==='arrange'&&daw.tmap?(function(){var a=0,g0=opts.range?opts.range[0]:0;for(var g=g0;g<g0+steps;g++)a+=tmSd(g);return a;})():steps*sd)*1.02,tail=opts.tail||8,len=Math.ceil((dur+tail+0.1)*sr);
  var OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  var M={pf:PF,pfh:pfHeld,pff:pfFader,ctx:ctx,N:N,FX:FX,nodes:tracks.map(function(t){return t.n;}),pv:padVoices,sv:svoices,fq:flashQ,sp:spatialOn,ps:pitchSemi,gp:grainPos,orb:tracks.map(function(t){return t.sp?t.sp.orbit:0;})};
  var ms=opts.mode==='mstem',useFx=(opts.mode==='mix'||ms)&&src==='arrange'&&((daw.fx&&daw.fx.length)||(daw.fxf&&daw.fxf.length)),js=opts.mode!=='stem',off=new OAC(js?4:2,len,sr),end=0,irBuf=M.N.conv.buffer,wetG=wetGain(P.space.v),preS=Math.round((P.rvPre?P.rvPre.v:0)*sr),volG=P.vol.v;
  try{
    offlineRender=true;offNodes=[];ctx=off;N={};FX={};padVoices=[];svoices=[];flashQ=[];pitchSemi=0;grainPos=P.gpos.v;
    if(opts.spatial!=null)spatialOn=opts.spatial;
    if(opts.mode==='stem'||opts.mode==='returns')spatialOn=false;
    tracks.forEach(function(t){if(t.sp)t.sp.orbit=0;});
    buildGraph(opts.mode==='stem'||opts.mode==='returns');
    N.conv.buffer=M.N.conv.buffer;
    var ovT=opts.ov?tracks[opts.ov.ti]:null,ovK=ovT?{comp:ovT.comp,cgr:ovT.cgr,duck:ovT.duck}:null;if(ovT)Object.assign(ovT,opts.ov.v);
    try{buildTracks();}finally{if(ovT)Object.assign(ovT,ovK);}
    Object.keys(P).forEach(function(k){if(P[k].on){try{P[k].on(P[k].v);}catch(e){}}});
    setAmpModel(ampModel);if(cabCustom&&FX.amp){FX.amp.cab.buffer=cabCustom;FX.amp.cabWet.gain.value=1;FX.amp.cabDry.gain.value=0;}
    if(FX.match&&M.FX.match)FX.match.target=M.FX.match.target.slice();applyMatch();
    if(FX.rotary){FX.rotary.hornO.frequency.value=roFast?6.8:0.8;FX.rotary.drumO.frequency.value=roFast?5.9:0.66;}
    updDelayTime();routeFX();spRoute();
    function setNow(param,v){param.cancelScheduledValues(0);param.setValueAtTime(v,0);}
    tracks.forEach(function(t,i){if(t.kind==='keys'&&t.n){var S=soundOf(i);setNow(t.n.f.frequency,normToHz(S.cutoff));t.n.f.Q.value=S.reso;}});
    setNow(N.master.gain,P.vol.v);var wet=P.space.v;setNow(N.wet.gain,wetGain(wet));setNow(N.dry.gain,1);
    if(ms){tracks.forEach(function(t,i){if(i!==opts.track){setNow(t.n.vol.gain,0);setNow(t.n.sr.gain,0);setNow(t.n.sd.gain,0);}});}
    if(opts.mode==='stem'){tracks.forEach(function(t,i){if(i!==opts.track)setNow(t.n.vol.gain,0);else{if(opts.stereo)setNow(t.n.vol.gain,1);setNow(t.n.sr.gain,0);setNow(t.n.sd.gain,0);if(t.n.pan.pan&&!opts.stereo)setNow(t.n.pan.pan,0);}});}
    if(opts.mode==='returns'){tracks.forEach(function(t){try{t.n.out.disconnect(t.n.dest);}catch(e){}});}
    try{N.revIn.disconnect(N.rvPreD);}catch(e){}
    PF=null;pfHeld={};pfFader=0;if(useFx){perfInsert(true);}
    if(js){var srcOut=PF?PF.out:N.mOut;try{srcOut.disconnect();}catch(e){}var mg=ctx.createChannelMerger(4),s1=ctx.createChannelSplitter(2),s2=ctx.createChannelSplitter(2);srcOut.connect(s1);s1.connect(mg,0,0);s1.connect(mg,1,1);N.revIn.connect(s2);s2.connect(mg,0,2);s2.connect(mg,1,3);mg.connect(ctx.destination);}
    renderOnly=(opts.mode==='stem'||ms)?opts.track:null;RKEY=renderOnly!=null?mxKeysOf(renderOnly):null;offQueue=[];
    end=src==='arrange'?scheduleArrange(0,opts.range):scheduleSong(0);
    var Q=offQueue;offQueue=null;
    var OS={pf:PF,pfh:pfHeld,ctx:off,N:N,FX:FX,nodes:tracks.map(function(t){return t.n;}),pv:padVoices,sv:svoices,ro:renderOnly,on:offNodes};
    var qi=0,runQ=function(until){var M2={pf:PF,pfh:pfHeld,pff:pfFader,ctx:ctx,N:N,FX:FX,nodes:tracks.map(function(t){return t.n;}),pv:padVoices,sv:svoices,sp:spatialOn,ps:pitchSemi,ro:renderOnly,on:offNodes,orl:offlineRender};
      PF=OS.pf;pfHeld=OS.pfh;pfFader=OS.pff||0;ctx=OS.ctx;N=OS.N;FX=OS.FX;tracks.forEach(function(t,i){t.n=OS.nodes[i];});padVoices=OS.pv;svoices=OS.sv;renderOnly=OS.ro;offNodes=OS.on;offlineRender=true;spatialOn=opts.spatial!=null?opts.spatial:M.sp;if(opts.mode==='stem'||opts.mode==='returns')spatialOn=false;pitchSemi=0;
      try{var s0=svoices.length;while(qi<Q.length&&Q[qi].t<until){Q[qi].fn();qi++;}
        for(var vi=s0;vi<svoices.length;vi++){var v=svoices[vi];if(v.S.engine!=='granular')continue;var tg=v.t0,gg=0;while(tg<v.t1+v.S.release&&gg++<40000){spawnGrains(v,tg);tg+=(1/v.S.gdens)*(0.75+0.5*Math.random());}}
        padVoices=padVoices.filter(function(x){return !x.dead&&x.end>until-4;});OS.pv=padVoices;svoices=svoices.filter(function(x){return x.t1+8>until-4;});OS.sv=svoices;}
      finally{OS.pff=pfFader;PF=M2.pf;pfHeld=M2.pfh;pfFader=M2.pff;ctx=M2.ctx;N=M2.N;FX=M2.FX;tracks.forEach(function(t,i){t.n=M2.nodes[i];});padVoices=M2.pv;svoices=M2.sv;spatialOn=M2.sp;pitchSemi=M2.ps;renderOnly=M2.ro;offNodes=M2.on;offlineRender=M2.orl;}};
    Q.sort(function(a,b){return a.t-b.t;});
  }finally{
    PF=M.pf;pfHeld=M.pfh;pfFader=M.pff;ctx=M.ctx;N=M.N;FX=M.FX;tracks.forEach(function(t,i){t.n=M.nodes[i];if(t.sp)t.sp.orbit=M.orb[i];});padVoices=M.pv;svoices=M.sv;flashQ=M.fq;spatialOn=M.sp;pitchSemi=M.ps;grainPos=M.gp;offlineRender=false;renderOnly=null;
  }
  var CH=2;runQ(CH*2);
  if(off.suspend){var D=len/sr;for(var q=1;q*CH<D;q++)(function(q){var at=Math.floor(q*CH*sr/128)*128/sr;off.suspend(at).then(function(){runQ(at+CH*2);
      var keep=[];OS.on.forEach(function(o){if(o.e<at){try{o.n.disconnect();}catch(e){}}else keep.push(o);});OS.on.length=0;keep.forEach(function(o){OS.on.push(o);});
      if(opts.onProgress){try{opts.onProgress(at/D);}catch(e){}}off.resume();}).catch(function(){off.resume();});})(q);}
  else runQ(1e9);
  return off.startRendering().then(function(buf){RKEY=null;
    if(!js)return {buf:buf,end:end};
    var n=buf.length,m=[new Float32Array(buf.getChannelData(0)),new Float32Array(buf.getChannelData(1))],snd=[buf.getChannelData(2),buf.getChannelData(3)];
    if(irBuf&&wetG>0){var any=false;for(var i=0;i<n;i+=64){if(snd[0][i]||snd[1][i]){any=true;break;}}
      if(any)for(var c=0;c<2;c++){var h=irBuf.getChannelData(Math.min(c,irBuf.numberOfChannels-1));if(irBuf.sampleRate!==sr){h=fitRate(irBuf).getChannelData(Math.min(c,irBuf.numberOfChannels-1));}var w=fftConvolve(snd[c],h);if(preS>0){var ws=new Float32Array(w.length);ws.set(w.subarray(0,w.length-preS),preS);w=ws;}w=biq(biq(w,'hp',P.rvLo.v,0.7,sr),'lp',P.rvHi.v,0.7,sr);if(opts.mode!=='returns')eqJS(w,sr);var k=wetG*volG*irScale(irBuf.sampleRate!==sr?fitRate(irBuf):irBuf);for(var j=0;j<n;j++)m[c][j]+=w[j]*k;}}
    if(opts.raw)return {raw:m,sr:sr,end:end};
    var gr=null;if(opts.mode!=='returns'&&!ms){if(opts.mode==='mix'&&MIX.match&&!opts.noMatch)mxMatch(m,sr);else jsMaster(m,sr,P.ceil?P.ceil.v:-1);gr=m.gr;}
    var out=new AudioBuffer({length:n,sampleRate:sr,numberOfChannels:2});out.getChannelData(0).set(m[0]);out.getChannelData(1).set(m[1]);return {buf:out,end:end,js:true,gr:gr};
  });
}
function tailLength(buf,end){
  var sr=buf.sampleRate,L=buf.getChannelData(0),R=buf.getChannelData(1),th=Math.pow(10,-80/20),last=Math.floor(end*sr);
  for(var i=buf.length-1;i>last;i--){if(Math.abs(L[i])>th||Math.abs(R[i])>th){last=i;break;}}
  return Math.min(buf.length,last+Math.floor(sr*0.2));
}
function masterLatency(sr){return Math.round(0.006*sr)+192;}
function cutBuffer(buf,len,mono,off){
  off=off||0;var sr=buf.sampleRate,f=Math.floor(sr*0.05),out=[];len=Math.min(len,buf.length-off);
  var chs=[buf.getChannelData(0).slice(off,off+len),buf.getChannelData(1).slice(off,off+len)];
  chs.forEach(function(c){for(var i=0;i<f&&i<len;i++)c[len-1-i]*=i/f;});
  if(mono){var m=new Float32Array(len);for(var j=0;j<len;j++)m[j]=(chs[0][j]+chs[1][j])*0.5;return [m];}
  return chs;
}
function peakDb(chs){var pk=0;chs.forEach(function(c){for(var i=0;i<c.length;i++){var a=Math.abs(c[i]);if(a>pk)pk=a;}});return pk>0?20*Math.log10(pk):-200;}
function exportSongOffline(binaural,src,btnEl){
  if(!ensureAudio())return;if(seq.bounce||stemsRunning){toast('An export is already running.');return;}
  transportStop();seq.bounce=true;var btn=btnEl||(binaural?$('#binBtn'):$('#bounceBtn')),orig=btn.textContent;btn.textContent=calPending()?'Measuring compressors…':'Rendering…';var t0=performance.now();
  waitCal().then(function(){t0=performance.now();return renderOffline({mode:'mix',spatial:binaural?true:spatialOn,src:src,onProgress:function(f){btn.textContent='Rendering… '+Math.round(f*100)+'%';}});}).then(function(r){
    var len=tailLength(r.buf,r.end),chs=cutBuffer(r.buf,len,false,r.js?Math.round(TRACKLAT*r.buf.sampleRate):masterLatency(r.buf.sampleRate)),bytes=WAVBITS===16?encodeWav16(chs,r.buf.sampleRate):encodeWav(chs,r.buf.sampleRate);
    if(lastTake&&lastTake.url)URL.revokeObjectURL(lastTake.url);
    lastTake={bytes:bytes,name:'ecou-'+safeName(project.name)+(src==='arrange'?'-timeline':'')+(binaural?'-binaural':''),url:URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}))};
    $('#takeAudio').src=lastTake.url;
    var lu=loudness(chs,r.buf.sampleRate),tp=truePeak(chs);$('#takeLen').textContent=dec(len/r.buf.sampleRate,1)+' s · '+dec(lu,1)+' LUFS · true peak '+dec(tp,1)+' dBTP'+(r.gr?' · limiter −'+dec(r.gr.avg,1)+' dB avg / −'+dec(r.gr.max,1)+' max'+(r.gr.avg>3?' (pushed hard: lower Master for more punch)':''):'')+' · '+WAVBITS+'-bit / '+Math.round(r.buf.sampleRate/100)/10+' kHz · rendered in '+dec((performance.now()-t0)/1000,1)+' s';
    $('#take').classList.add('show');pushOverlay('take');setTimeout(function(){$('#takeSave').focus();},50);
  }).catch(function(){toast('Rendering failed in this browser.');}).then(function(){seq.bounce=false;btn.textContent=orig;});
}

/* ---------- SONG DOCTOR (Mix › Song Doctor): on-device analysis of an imported song or the project, + gentle auto-master with loudness-matched A/B ---------- */
/* everything heavy runs in this worker (built from the function source, no network): BS.1770-4 loudness, 4x true peak, LRA, spectrum, chroma, sections, master */
