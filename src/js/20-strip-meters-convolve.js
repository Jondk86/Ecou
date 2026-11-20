function stripVals(t){return {eq:t.eq||{l:0,m:0,mf:1000,h:0},comp:t.comp||0,duck:t.duck||0,cmo:t.cmo||0,duckR:t.duckR||0.18,width:t.width==null?1:t.width};}
/* compressor: amount a -> threshold/ratio; WebAudio's built-in makeup is cancelled and replaced by our own
   estimate of the gain reduction on a typical track level (COMPREF dBFS), so loudness stays roughly level */
var COMPREF=-11;
function compParams(a,learned){var thr=-a*30,ratio=1+a*5,knee=a>0?6:0,over=Math.max(0,COMPREF-thr),gr=over*(1-1/ratio);return {thr:thr,ratio:ratio,knee:knee,mk:a>0?gr*0.9:0};}
/* auto makeup: after the compressor amount changes, two short offline renders of this track (8 busiest bars) measure the
   loudness with and without compression; the difference becomes the makeup gain, so live play and exports match */
var calQ={};
function calPending(){return !!calibrateComp.busy||Object.keys(calQ).some(function(k){return calQ[k];});}
function waitCal(){return new Promise(function(res){var t0=Date.now();calibrateComp.prio=true;(function chk(){if(!calPending()||Date.now()-t0>60000){calibrateComp.prio=false;res();}else setTimeout(chk,250);})();});}
function calibrateComp(ti){var t=tracks[ti];if(!t)return;clearTimeout(calQ[ti]);t.cgr=null;applyStrip(t);if(!t.comp)return;calibrateComp.pend(ti,700);}
calibrateComp.pend=function(ti,delay){var t=tracks[ti];if(!t||!t.comp)return;clearTimeout(calQ[ti]);
  calQ[ti]=setTimeout(function(){calQ[ti]=null;
    if(((stemsRunning||seq.bounce)&&!calibrateComp.prio)||calibrateComp.busy||seq.on||wavRec){var e0=document.querySelector('[data-gr="'+ti+'"]');if(e0&&seq.on)e0.textContent='Auto makeup: measures when playback stops';calibrateComp.pend(ti,1500);return;}
    var cl=daw.clips.filter(function(c){return c.ti===ti&&!c.mute;});if(!cl.length)return;
    var best=-1,bg=0,end=Math.ceil(arrEnd()),W=Math.min(192,end),mid=end/2;for(var g=0;g+W<=end||g===0;g+=16){var cov=0;cl.forEach(function(c){cov+=Math.max(0,Math.min(clipEnd(c),g+W)-Math.max(c.s,g));});var sc=cov-Math.abs(g+W/2-mid)*0.01;if(sc>best){best=sc;bg=g;}if(g+W>=end)break;}
    var amt=t.comp,el=document.querySelector('[data-gr="'+ti+'"]');if(el)el.textContent='Auto makeup: measuring…';calibrateComp.busy=true;
    var L=function(v){return renderOffline({mode:'mstem',track:ti,src:'arrange',spatial:false,range:[bg,Math.min(end,bg+W)],tail:1,ov:{ti:ti,v:v}}).then(function(r){return loudness([r.buf.getChannelData(0),r.buf.getChannelData(1)],r.buf.sampleRate);});},l0;
    L({comp:0,duck:0,cgr:null}).then(function(v){l0=v;return L({comp:amt,duck:0,cgr:0});}).then(function(l1){if(t.comp!==amt)return;
      t.cgr=isFinite(l0-l1)?Math.round(clamp(l0-l1,-24,24)*10)/10:null;applyStrip(t,true);markDirty();var e2=document.querySelector('[data-gr="'+ti+'"]');if(e2)e2.textContent='Auto makeup '+(t.cgr>0?'+':'')+dec(t.cgr,1)+' dB (level kept)';})
    .catch(function(e){console.error(e);}).then(function(){calibrateComp.busy=false;});
  },delay||700);};
function applyStrip(t,slow){var n=t.n;if(!n||!n.eqL)return;var v=stripVals(t),now=ctx.currentTime,set=function(p,x){if(offlineRender){p.cancelScheduledValues(0);p.setValueAtTime(x,0);}else p.setTargetAtTime(x,now,slow?0.4:0.02);};
  set(n.eqL.gain,v.eq.l);set(n.eqM.gain,v.eq.m);set(n.eqM.frequency,v.eq.mf||1000);set(n.eqH.gain,v.eq.h);
  if(t.compLegacy&&v.comp>0){var la=v.comp,lthr=-la*36,lr=1+la*7;n.cmp.threshold.value=lthr;n.cmp.ratio.value=lr;n.cmp.knee.value=10;n.cmp.attack.value=0.008;n.cmp.release.value=0.16;set(n.cmk.gain,dbg(-compMakeupDb(lthr,lr,10)+la*9+v.cmo));applyWidth(t,set);return;}
  var cp=compParams(v.comp,t.cgr);n.cmp.threshold.value=cp.thr;n.cmp.ratio.value=cp.ratio;n.cmp.knee.value=cp.knee;n.cmp.attack.value=0.01;n.cmp.release.value=0.15;
  set(n.cmk.gain,dbg((v.comp>0&&t.cgr!=null?t.cgr:-compMakeupDb(cp.thr,cp.ratio,cp.knee)+cp.mk)+v.cmo));applyWidth(t,set);}
var DUCKREL=0.16;
function duckAt(t0){tracks.forEach(function(t,i){if(i===0||!t.duck||!t.n||!t.n.duck)return;if(renderOnly!=null&&renderOnly!==i)return;var g=t.n.duck.gain,d=dbg(-t.duck*18),r=t.duckR||0.18;
  g.cancelScheduledValues(t0);g.setTargetAtTime(d,t0,0.002);g.setTargetAtTime(1,t0+0.012,r/3);});}
/* EBU R128 / BS.1770 loudness + true peak of a rendered buffer */
function kCoefs(sr){var f0=1681.974450955533,G0=3.999843853973347,Q=0.7071752369554196,K=Math.tan(Math.PI*f0/sr),Vh=Math.pow(10,G0/20),Vb=Math.pow(Vh,0.4996667741545416),a0=1+K/Q+K*K;
  var s1={b:[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],a:[2*(K*K-1)/a0,(1-K/Q+K*K)/a0]};
  var f1=38.13547087602444,Q1=0.5003270373238773,K1=Math.tan(Math.PI*f1/sr),a1=1+K1/Q1+K1*K1;var s2={b:[1,-2,1],a:[2*(K1*K1-1)/a1,(1-K1/Q1+K1*K1)/a1]};return [s1,s2];}
function kFilter(x,sr){var C=kCoefs(sr),y=x;C.forEach(function(c){var o=new Float32Array(y.length),x1=0,x2=0,y1=0,y2=0;for(var i=0;i<y.length;i++){var v=c.b[0]*y[i]+c.b[1]*x1+c.b[2]*x2-c.a[0]*y1-c.a[1]*y2;x2=x1;x1=y[i];y2=y1;y1=v;o[i]=v;}y=o;});return y;}
function loudness(chs,sr){var k=chs.map(function(c){return kFilter(c,sr);}),B=Math.round(0.4*sr),H=Math.round(0.1*sr),bl=[];
  for(var s=0;s+B<=k[0].length;s+=H){var e=0;k.forEach(function(c){var m=0;for(var i=s;i<s+B;i++)m+=c[i]*c[i];e+=m/B;});bl.push(e);}
  var L=function(e){return -0.691+10*Math.log10(e+1e-20);};var g1=bl.filter(function(e){return L(e)>-70;});if(!g1.length)return -70;
  var m1=g1.reduce(function(a,b){return a+b;},0)/g1.length,th=L(m1)-10,g2=g1.filter(function(e){return L(e)>th;});var m2=g2.reduce(function(a,b){return a+b;},0)/Math.max(1,g2.length);return L(m2);}
function truePeak(chs){var pk=0;chs.forEach(function(c){for(var i=1;i+2<c.length;i++){var p0=c[i-1],p1=c[i],p2=c[i+1],p3=c[i+2];var a=Math.abs(p1);if(a>pk)pk=a;
  if((p1>0.5||p1<-0.5)){for(var q=1;q<4;q++){var t=q/4,v=p1+0.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)));v=Math.abs(v);if(v>pk)pk=v;}}}});return 20*Math.log10(pk+1e-12);}
/* live metering */
var MT={mom:[],st:[],last:0,tgt:-14};
function meterInsert(){if(offlineRender||!N.clip)return;var hs=BQ('highshelf',1682,0.7);hs.gain.value=4;var hp=BQ('highpass',38,0.5),sp=ctx.createChannelSplitter(2);N.mL=ctx.createAnalyser();N.mR=ctx.createAnalyser();N.mL.fftSize=N.mR.fftSize=2048;
  N.clip.connect(hs);hs.connect(hp);hp.connect(sp);sp.connect(N.mL,0);sp.connect(N.mR,1);N.mBufL=new Float32Array(2048);N.mBufR=new Float32Array(2048);}
function trackMeters(){tracks.forEach(function(t){var n=t.n;if(!n||n.an)return;n.an=ctx.createAnalyser();n.an.fftSize=256;n.out.connect(n.an);n.anB=new Float32Array(256);});}
function meterTick(){
  requestAnimationFrame(meterTick);if(!ctx||!N.mL||document.hidden)return;var vis=$('#t-fx').classList.contains('active');if(!vis)return;
  var now=performance.now(),dt=Math.min(0.1,(now-(MT.last||now))/1000);MT.last=now;N.mL.getFloatTimeDomainData(N.mBufL);N.mR.getFloatTimeDomainData(N.mBufR);
  var eL=0,eR=0,xy=0,n=N.mBufL.length;for(var i=0;i<n;i++){var a=N.mBufL[i],b=N.mBufR[i];eL+=a*a;eR+=b*b;xy+=a*b;}eL/=n;eR/=n;
  MT.mom.push({e:eL+eR,dt:dt});MT.st.push({e:eL+eR,dt:dt});var sum=function(arr,win){var T=0,E=0;for(var k=arr.length-1;k>=0&&T<win;k--){T+=arr[k].dt;E+=arr[k].e*arr[k].dt;}while(arr.length>400)arr.shift();return T>0?E/T:0;};
  var mom=-0.691+10*Math.log10(sum(MT.mom,0.4)+1e-20),st=-0.691+10*Math.log10(sum(MT.st,3)+1e-20),corr=eL>1e-9&&eR>1e-9?xy/n/Math.sqrt(eL*eR):0,pk=masterPeak();
  if(!MT.grT||now-MT.grT>150){MT.grT=now;tracks.forEach(function(t,i){var el=document.querySelector('[data-gr="'+i+'"]');if(!el)return;if(el.textContent.indexOf('measuring')>=0)return;var r=t.comp&&t.n&&t.n.cmp?t.n.cmp.reduction:0;el.textContent=t.comp?'Gain reduction now '+(r<-0.2?dec(r,1)+' dB':'0 dB')+(t.cgr!=null?' · auto makeup '+(t.cgr>0?'+':'')+dec(t.cgr,1)+' dB':''):'';});}
  var lgr=N.comp?N.comp.reduction:0;$('#mtGr').textContent=lgr<-0.05?dec(lgr,1)+' dB':'0';$('#mtGr').style.color=lgr<-6?'var(--or)':'';
  var f=function(v){return v<-60?'—':dec(v,1);};$('#mtMom').textContent=f(mom);$('#mtSt').textContent=f(st);$('#mtPk').textContent=isNaN(pk)?'NaN':(pk>0?dec(20*Math.log10(pk),1):'—');$('#mtCor').textContent=dec(corr,2);
  var d=st-MT.tgt;$('#mtTgt').textContent=st<-60?'play something…':(Math.abs(d)<1?'on target':(d>0?dec(d,1)+' LU above':dec(-d,1)+' LU below')+' '+MT.tgt+' LUFS');
  $('#mtBar').style.width=clamp((st+40)/40*100,0,100)+'%';$('#mtBar').style.background=st>MT.tgt+1?'var(--or)':'var(--ac)';
  tracks.forEach(function(t,i){var n2=t.n,el=document.querySelector('[data-meter="'+i+'"]');if(!n2||!n2.an||!el)return;n2.an.getFloatTimeDomainData(n2.anB);var p=0;for(var j=0;j<n2.anB.length;j++){var v=Math.abs(n2.anB[j]);if(v>p)p=v;}
    var db=p>0?20*Math.log10(p):-90;el.style.width=clamp((db+48)/48*100,0,100)+'%';el.style.background=db>-1?'var(--or)':'var(--ac)';});
  mxTick(st,pk);
}

/* ---------- FAST OFFLINE MIXDOWN: reverb convolved in JS (FFT), true-peak limiter in JS ---------- */
function fftInit(n){var lg=Math.round(Math.log2(n)),rev=new Uint32Array(n),cs=new Float64Array(n/2),sn=new Float64Array(n/2);
  for(var i=0;i<n;i++){var r=0,x=i;for(var b=0;b<lg;b++){r=(r<<1)|(x&1);x>>=1;}rev[i]=r;}for(var k=0;k<n/2;k++){cs[k]=Math.cos(2*Math.PI*k/n);sn[k]=-Math.sin(2*Math.PI*k/n);}return {n:n,rev:rev,cs:cs,sn:sn};}
function fft(F,re,im,inv){var n=F.n,rev=F.rev,i,j,t;for(i=0;i<n;i++){j=rev[i];if(j>i){t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(var size=2;size<=n;size<<=1){var half=size>>1,step=n/size;for(i=0;i<n;i+=size){for(var k=0;k<half;k++){var c=F.cs[k*step],s=inv?-F.sn[k*step]:F.sn[k*step],a=i+k,b=a+half,tr=re[b]*c-im[b]*s,ti=re[b]*s+im[b]*c;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;}}}
  if(inv){for(i=0;i<n;i++){re[i]/=n;im[i]/=n;}}}
/* same scale the browser applies to a normalized ConvolverNode (Web Audio spec) */
function irScale(b){var p=0,n=b.length,c=b.numberOfChannels;for(var ch=0;ch<c;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++)p+=d[i]*d[i];}p=Math.sqrt(p/(c*n));if(!isFinite(p)||p<0.000125)p=0.000125;var sc=0.00125/p*(44100/b.sampleRate);if(c===4)sc*=0.5;return sc;}
var TRACKLAT=0.006; /* every track has a channel compressor: browsers add a fixed 6 ms look-ahead */
function fftConvolve(x,h){
  var hl=h.length,N=1;while(N<2*hl)N<<=1;var L=N-hl+1,F=fftInit(N),Hr=new Float64Array(N),Hi=new Float64Array(N);for(var i=0;i<hl;i++)Hr[i]=h[i];fft(F,Hr,Hi,false);
  var out=new Float32Array(x.length),re=new Float64Array(N),im=new Float64Array(N);
  for(var s=0;s<x.length;s+=L){re.fill(0);im.fill(0);var e=Math.min(L,x.length-s),any=false;for(i=0;i<e;i++){re[i]=x[s+i];if(re[i])any=true;}if(!any)continue;
    fft(F,re,im,false);for(i=0;i<N;i++){var a=re[i],b=im[i];re[i]=a*Hr[i]-b*Hi[i];im[i]=a*Hi[i]+b*Hr[i];}fft(F,re,im,true);
    var lim=Math.min(N,x.length-s);for(i=0;i<lim;i++)out[s+i]+=re[i];}
  return out;}
/* look-ahead limiter with ceiling + the same soft-clip curve as the live master */
/* hit target loudness: one offline render of the pre-limiter mix, then a binary search on the master gain through the same limiter */
function hitTarget(){if(!ensureAudio())return;if(seq.bounce||stemsRunning){toast('An export is already running.');return;}var ssrc=stemSrc();if(ssrc==='song'&&!song.length){toast('Add patterns to the song or timeline first.');return;}
  var btn=$('#hitTgt'),orig=btn.textContent,tgt=MT.tgt;transportStop();btn.textContent=calPending()?'Measuring compressors…':'Rendering…';
  seq.bounce=true;waitCal().then(function(){return renderOffline({mode:'mix',src:ssrc,spatial:false,raw:true,onProgress:function(f){btn.textContent='Rendering… '+Math.round(f*100)+'%';}});}).then(function(r){
    btn.textContent='Measuring…';var sr=r.sr,dec4=function(x){var n=Math.floor(x.length/1);return x;},ceil=P.ceil?P.ceil.v:-1;
    var test=function(db){var g=dbg(db),c=[new Float32Array(r.raw[0].length),new Float32Array(r.raw[1].length)];for(var i=0;i<c[0].length;i++){c[0][i]=r.raw[0][i]*g;c[1][i]=r.raw[1][i]*g;}jsMaster(c,sr,ceil);return {lu:loudness(c,sr),gr:c.gr};};
    var lo=-30,hi=20,best=null;for(var it=0;it<9;it++){var mid=(lo+hi)/2,t=test(mid);if(t.lu<tgt)lo=mid;else hi=mid;best={db:mid,t:t};if(Math.abs(t.lu-tgt)<0.15)break;}
    var nv=P.vol.v*dbg(best.db),capped=nv>P.vol.max;if(capped){nv=P.vol.max;best.t=test(20*Math.log10(nv/P.vol.v));}
    setParam('vol',nv);markDirty();hitTarget.done=true;var gr=best.t.gr;
    $('#mtSong').textContent=dec(best.t.lu,1);
    $('#hitNote').textContent='Master '+Math.round(nv*100)+'% → export ≈ '+dec(best.t.lu,1)+' LUFS, limiter −'+dec(gr.avg,1)+' dB avg / −'+dec(gr.max,1)+' dB max.'+(capped?' Master is at maximum: raise track levels to get louder.':'')+(gr.avg>3?' The limiter works hard here: expect less punch. A lower target or a cleaner mix keeps transients.':'');
    toast('Master set to '+Math.round(nv*100)+'% for '+tgt+' LUFS.',2000);
  }).catch(function(e){console.error(e);toast('Could not measure in this browser.');}).then(function(){seq.bounce=false;btn.textContent=orig;});}
function jsMaster(chs,sr,ceilDb){
  var n=chs[0].length,LA=Math.max(8,Math.round(sr*0.0015)),ceil=Math.pow(10,(ceilDb-0.35)/20),rel=1-Math.exp(-1/(sr*0.08)),att=1-Math.exp(-1/(LA/3)),tgt=new Float32Array(n),i;
  for(i=0;i<n;i++){var p=0;for(var c=0;c<chs.length;c++){var a=Math.abs(chs[c][i]),b2=i+1<n?Math.abs(chs[c][i+1]):a,m=Math.max(a,b2)*1.02+Math.abs(a-b2)*0.15;if(m>p)p=m;}tgt[i]=p>ceil?ceil/p:1;}
  // sliding minimum over the look-ahead window (monotonic deque)
  var mn=new Float32Array(n),dq=new Int32Array(n),h=0,t=0;
  for(i=n-1;i>=0;i--){while(t>h&&tgt[dq[t-1]]>=tgt[i])t--;dq[t++]=i;while(dq[h]>i+LA)h++;mn[i]=tgt[dq[h]];}
  var g=1,curve=softClipCurve(Math.pow(10,(ceilDb-0.1)/20)),cn=curve.length-1,grMin=1,grS=0,grN=0;
  for(i=0;i<n;i++){var m2=mn[i];g+=(m2<g?att:rel)*(m2-g);if(m2<g&&g-m2>0.5)g=m2;if(g<grMin)grMin=g;if((i&15)===0&&Math.abs(chs[0][i])+Math.abs(chs[chs.length-1][i])>0.1){grS+=-20*Math.log10(g);grN++;}
    for(var c2=0;c2<chs.length;c2++){var x=chs[c2][i]*g;var f=(Math.max(-1,Math.min(1,x))+1)/2*cn,j=Math.floor(f),fr=f-j;chs[c2][i]=j>=cn?curve[cn]:curve[j]+(curve[j+1]-curve[j])*fr;}}
  chs.gr={max:-20*Math.log10(grMin),avg:grN?grS/grN:0};return chs;}

/* ---------- PIANO ROLL 2: drag edit, chords, progressions, velocity, bar tools ---------- */
