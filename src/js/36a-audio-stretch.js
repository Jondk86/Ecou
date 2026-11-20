/* ---------- Audio follows tempo & key: time-stretch / pitch-shift for audio clips (own code, no third-party DSP) ----------
   Engine: phase vocoder, Hann N=2048 (1024 under 32 kHz), synthesis hop N/4. Each output frame reads the source at map(t) and
   measures the instantaneous frequency from two analysis frames N/4 apart, so any time map (section tempos, tempo ramps) works
   in one pass. Phases: identity/scaled phase locking (Laroche-Dolson) around spectral peaks; pitch shift moves each peak
   region by whole bins while its phase advances at the exact shifted frequency. Transients: spectral-flux onsets in the
   source reset all phases to the analysis phases on the frame that reaches them (sharp attacks, no smearing).
   Formants (voice): the shifted result is envelope-warped back by -semitones with the Voice Morph envelope code (vmWarp).
   Rendering runs in ~10 ms slices (MessageChannel), results are cached in memory per clip plan; the project stores only c.st:
   {f:'fixed'|'tempo'|'key'|'both'|'auto', b0: source bpm, k0: source key, tp: tempo %, sm: semitones, ct: cents, fm: formants}. */
var TS={cache:{},lru:[],q:[],job:null,waits:[],memo:{},said:0,ch:null,tick:0,last:''};
function tsFftPlan(n){var P={n:n,rev:new Uint32Array(n),c:new Float64Array(n/2),s:new Float64Array(n/2)},lg=Math.round(Math.log(n)/Math.LN2),i,j;
  for(i=0;i<n;i++){var r=0,x=i;for(j=0;j<lg;j++){r=(r<<1)|(x&1);x>>=1;}P.rev[i]=r;}
  for(i=0;i<n/2;i++){P.c[i]=Math.cos(2*Math.PI*i/n);P.s[i]=-Math.sin(2*Math.PI*i/n);}return P;}
function tsFft(P,re,im){var n=P.n,rev=P.rev,i,j,k,t,sz,h,st;
  for(i=0;i<n;i++){j=rev[i];if(j>i){t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(sz=2;sz<=n;sz<<=1){h=sz>>1;st=n/sz;for(i=0;i<n;i+=sz){for(j=0,k=0;j<h;j++,k+=st){var a=i+j,b=a+h,wr=P.c[k],wi=P.s[k],xr=re[b]*wr-im[b]*wi,xi=re[b]*wi+im[b]*wr;re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;}}}}
function tsPrinc(x){return x-2*Math.PI*Math.round(x/(2*Math.PI));}
/* source onsets (samples from the clip start) by log-spectral flux with an adaptive threshold */
function tsOnsets(rd,n0,n1){var N=1024,H=256,P=tsFftPlan(N),w=new Float64Array(N),re=new Float64Array(N),im=new Float64Array(N),pm=new Float64Array(N/2+1),F=[],i,k,t=n0,J={done:false};
  for(i=0;i<N;i++)w[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
  J.step=function(ms){var t0=Date.now();for(;t<n1;t+=H){for(i=0;i<N;i++){re[i]=w[i]*rd(t-N/2+i);im[i]=0;}tsFft(P,re,im);var f=0;
      for(k=2;k<=N/2;k++){var m=Math.log(1e-5+Math.sqrt(re[k]*re[k]+im[k]*im[k])),d=m-pm[k];if(d>0)f+=d;pm[k]=m;}F.push(f);if(Date.now()-t0>ms){t+=H;return false;}}
    var out=[],mx=0;for(i=1;i<F.length;i++)if(F[i]>mx)mx=F[i];
    for(i=2;i<F.length-1;i++){var a=0,c=0;for(k=Math.max(1,i-12);k<Math.min(F.length,i+6);k++){a+=F[k];c++;}a/=c;
      if(F[i]>F[i-1]&&F[i]>=F[i+1]&&F[i]>a*1.5+0.02*mx&&F[i]>0.12*mx)out.push(n0+i*H-H/2);}
    J.res=out;J.done=true;return true;};
  return J;}
/* plan: O (output seconds), S (source seconds from clip start), Q (semitones per segment), loop, off. Returns a job with step(ms).
   Stereo is phase-locked: peaks come from the summed magnitude and the phase evolution from the mid signal; every channel gets the
   same rotation (its own analysis phase + the mid's synthesis offset), so L/R phase differences and the stereo image are kept. */
function tsEngine(chans,sr,plan,opt){opt=opt||{};chans=chans.slice(0,2);var N=opt.N||(sr<32000?1024:2048),H=N/4,h2=N/2,P=tsFftPlan(N),w=new Float64Array(N),i,NC=chans.length;
  for(i=0;i<N;i++)w[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
  var L=chans[0].length,offS=Math.round(plan.off*sr),loop=!!plan.loop,O=plan.O,S=plan.S,Q=plan.Q,outLen=Math.max(1,Math.round(O[O.length-1]*sr)),nseg=O.length-1;
  function rd(ch){var d=chans[ch];return function(x){var j=offS+Math.round(x);if(loop){j%=L;if(j<0)j+=L;return d[j];}return j>=0&&j<L?d[j]:0;};}
  var seg=0;function at(tc){var t=tc/sr;if(t<O[0])seg=0;while(seg<nseg-1&&t>=O[seg+1])seg++;while(seg>0&&t<O[seg])seg--;
    var o0=O[seg],o1=O[seg+1],s0=S[seg],s1=S[seg+1],r=o1>o0?(s1-s0)/(o1-o0):1;return [(s0+(t-o0)*r)*sr,Math.pow(2,Q[seg]/12)];}
  var R=chans.map(function(_,c){return rd(c);}),mono=function(x){var s=0;for(var c=0;c<NC;c++)s+=R[c](x);return s/NC;},
      ident=Q.every(function(q){return Math.abs(q)<1e-9;})&&O.every(function(v,j){return Math.abs(v-S[j])<1e-9;}),
      outs=chans.map(function(){return new Float32Array(outLen);}),K0=-4,K1=Math.ceil((outLen+h2)/H)+1,ons=null,st={k:K0,ph:ident?'id':'on',done:false,prog:0},
      re=new Float64Array(N),im=new Float64Array(N),mag=new Float64Array(h2+1),pa=new Float64Array(h2+1),wi=new Float64Array(h2+1),ms=new Float64Array(h2+1),
      cm=[new Float64Array(h2+1),new Float64Array(h2+1)],cp=[new Float64Array(h2+1),new Float64Array(h2+1)],Yr=[new Float64Array(h2+1),new Float64Array(h2+1)],Yi=[new Float64Array(h2+1),new Float64Array(h2+1)],
      Ps=new Float64Array(h2+1),Pc=new Float64Array(h2+1),pk=new Int32Array(h2+1),pkc=new Int32Array(h2+1),peaks=new Int32Array(h2),norm=1/1.5,lastSc=-1e18,oi=0,
      fmQ=opt.fm&&typeof opt.warp==='function'?Q.some(function(q){return Math.abs(q)>0.05;}):false,fm={c:0,a:0};
  function fill(x0,dl,mid,c){var bs=offS+Math.round(x0),j,fast=!loop&&bs-dl>=0&&bs+N<=L;
    if(mid){if(NC===1){var d0=chans[0];if(fast)for(j=0;j<N;j++){re[j]=w[j]*d0[bs+j];im[j]=w[j]*d0[bs-dl+j];}else for(j=0;j<N;j++){re[j]=w[j]*R[0](x0+j);im[j]=w[j]*R[0](x0-dl+j);}}
      else{var a=chans[0],b=chans[1];if(fast)for(j=0;j<N;j++){re[j]=w[j]*(a[bs+j]+b[bs+j])*0.5;im[j]=w[j]*(a[bs-dl+j]+b[bs-dl+j])*0.5;}else for(j=0;j<N;j++){re[j]=w[j]*mono(x0+j);im[j]=w[j]*mono(x0-dl+j);}}}
    else{var A=chans[0],B=chans[1];if(fast)for(j=0;j<N;j++){re[j]=w[j]*A[bs+j];im[j]=w[j]*B[bs+j];}else for(j=0;j<N;j++){re[j]=w[j]*R[0](x0+j);im[j]=w[j]*R[1](x0+j);}}}
  function frame(k){var tc=k*H,A=at(tc),sc=A[0],p=A[1],j,d,c,x0=sc-h2;
    fill(x0,H,true);tsFft(P,re,im);
    for(j=0;j<=h2;j++){var nj=(N-j)%N,ar=(re[j]+re[nj])/2,ai=(im[j]-im[nj])/2,br=(im[j]+im[nj])/2,bi=-(re[j]-re[nj])/2,om=2*Math.PI*j/N,pA=Math.atan2(ai,ar);
      mag[j]=Math.sqrt(ar*ar+ai*ai);pa[j]=pA;wi[j]=om+tsPrinc(pA-Math.atan2(bi,br)-om*H)/H;}
    if(NC===2){fill(x0,0,false);tsFft(P,re,im);
      for(j=0;j<=h2;j++){var nk=(N-j)%N,lr=(re[j]+re[nk])/2,li=(im[j]-im[nk])/2,rr=(im[j]+im[nk])/2,ri=-(re[j]-re[nk])/2;cm[0][j]=Math.sqrt(lr*lr+li*li);cp[0][j]=Math.atan2(li,lr);cm[1][j]=Math.sqrt(rr*rr+ri*ri);cp[1][j]=Math.atan2(ri,rr);}}
    else{cm[0]=mag;cp[0]=pa;}
    var mx=0;for(j=0;j<=h2;j++){var sm=0;for(c=0;c<NC;c++)sm+=cm[c][j];ms[j]=sm;if(sm>mx)mx=sm;}
    var tr=false;if(ons){while(oi<ons.length&&ons[oi]<=lastSc)oi++;if(oi<ons.length&&ons[oi]<=sc&&ons[oi]>lastSc&&k>K0){tr=true;oi++;}}lastSc=sc;
    for(j=0;j<=h2;j++){for(c=0;c<NC;c++){Yr[c][j]=0;Yi[c][j]=0;}pkc[j]=-1;}
    var np=0,thr=mx*1e-4;if(mx>1e-9)for(j=2;j<h2-1;j++){var m2=ms[j];if(m2>thr&&m2>ms[j-1]&&m2>=ms[j+1]&&m2>ms[j-2]&&m2>=ms[j+2])peaks[np++]=j;}
    for(var q=0;q<np;q++){var m0=peaks[q],lo=q?((peaks[q-1]+m0)>>1)+1:0,hi=q<np-1?((m0+peaks[q+1])>>1):h2,jt=Math.round(m0*p),D=jt-m0,psi;
      if(tr||jt>h2)psi=pa[m0];else{var pp=pk[jt];psi=pp>=0?Ps[pp]+H*p*wi[m0]:pa[m0];}
      var rot=psi-pa[m0];
      for(d=lo;d<=hi;d++){var jo=d+D;if(jo<0||jo>h2)continue;for(c=0;c<NC;c++){var ph=rot+cp[c][d],mg=cm[c][d];Yr[c][jo]+=mg*Math.cos(ph);Yi[c][jo]+=mg*Math.sin(ph);}pkc[jo]=jt<=h2?jt:-1;Pc[jo]=rot+pa[d];}
      if(jt<=h2)Pc[jt]=psi;}
    for(j=0;j<=h2;j++){Ps[j]=Pc[j];pk[j]=pkc[j];}
    /* inverse of Z=Y0+iY1 (both Hermitian): ifft(Z)=conj(fft(conj(Z)))/N -> channel 0 real, channel 1 imaginary */
    for(c=0;c<NC;c++){Yi[c][0]=0;Yi[c][h2]=0;}var a0=Yr[0],b0=Yi[0],a1=NC===2?Yr[1]:null,b1=NC===2?Yi[1]:null;
    for(j=0;j<=h2;j++){var zr=a0[j]-(a1?b1[j]:0),zi=b0[j]+(a1?a1[j]:0);re[j]=zr;im[j]=-zi;}
    for(j=1;j<h2;j++){var zr2=a0[j]+(a1?b1[j]:0),zi2=-b0[j]+(a1?a1[j]:0);re[N-j]=zr2;im[N-j]=-zi2;}
    tsFft(P,re,im);var o0=outs[0],o1=NC===2?outs[1]:null,bb=tc-h2,g=norm/N;
    for(i=0;i<N;i++){var t2=bb+i;if(t2>=0&&t2<outLen){o0[t2]+=w[i]*re[i]*g;if(o1)o1[t2]-=w[i]*im[i]*g;}}}
  /* transient copy-through (pure stretch only), one onset at a time: the refined source onset is copied 1:1 to its mapped output time */
  var pre=Math.round(0.003*sr),post=Math.round(0.02*sr),fi=Math.round(0.002*sr),fo=Math.round(0.008*sr);
  function copyOn(on){var bi=on,best=-1,e0=0,k,x,c,srcLen=S[S.length-1]*sr;for(x=on-384;x<on+384;x+=16){var e1=0;for(k=0;k<64;k++)e1+=Math.abs(mono(x+k));if(x>on-384&&e1-e0>best){best=e1-e0;bi=x;}e0=e1;}
    if(bi<0||bi>srcLen)return;var g,ts=bi/sr;for(g=0;g<nseg;g++)if(ts<S[g+1]||g===nseg-1)break;if(Math.abs(Q[g])>1e-6)return;var rr=(S[g+1]-S[g])/(O[g+1]-O[g]||1);if(Math.abs(rr-1)<1e-4)return;
    var oc=Math.round((O[g]+(ts-S[g])/rr)*sr);
    for(c=0;c<NC;c++){var o=outs[c],f=R[c];for(k=-pre;k<post;k++){var t=oc+k;if(t<0||t>=outLen)continue;var a=k<-pre+fi?(k+pre)/fi:k>=post-fo?(post-k)/fo:1;o[t]=o[t]*(1-a)+a*f(bi+k);}}}
  st.step=function(msb){var t0=Date.now();
    /* ratio 1 and 0 semitones: the original samples, untouched */
    if(st.ph==='id'){for(var c=0;c<NC;c++){var o=outs[c],d=chans[c];if(!loop&&offS>=0&&offS+outLen<=L)o.set(d.subarray(offS,offS+outLen));else for(i=0;i<outLen;i++)o[i]=R[c](i);}st.ph='end';}
    if(st.ph==='on'){if(!st.oj)st.oj=opt.trans===false?{done:true,res:[]}:tsOnsets(mono,-1024,Math.round(S[S.length-1]*sr)+1024);if(!st.oj.done&&!st.oj.step(msb))return false;ons=st.ons=st.oj.res;st.ph='pv';seg=0;}
    while(st.ph==='pv'){frame(st.k);st.k++;if(st.k>K1){st.ph='cp';st.ci=0;}st.prog=(st.k-K0)/(K1-K0)*(fmQ?0.75:0.95);if(Date.now()-t0>msb)return false;}
    while(st.ph==='cp'){if(!ons||st.ci>=ons.length){st.ph='by';st.bi=0;st.bt=-1;break;}copyOn(ons[st.ci++]);if(Date.now()-t0>msb)return false;}
    /* same-tempo, unshifted regions are the original samples; 10 ms equal-power crossfades where they meet processed audio */
    if(st.ph==='by'&&!st.runs){st.runs=[];for(var g2=0;g2<nseg;g2++){var idg=Math.abs(Q[g2])<1e-9&&Math.abs((S[g2+1]-S[g2])-(O[g2+1]-O[g2]))<1e-9;if(!idg)continue;var ra=Math.round(O[g2]*sr),rb=Math.min(outLen,Math.round(O[g2+1]*sr)),lr=st.runs[st.runs.length-1];
      if(lr&&lr.b===ra&&lr.g1===g2-1){lr.b=rb;lr.g1=g2;}else st.runs.push({a:ra,b:rb,g0:g2,g1:g2,s:S[g2]*sr-ra});}st.runs.forEach(function(r){r.fa=r.g0>0;r.fb=r.g1<nseg-1;});}
    while(st.ph==='by'){var ru=st.runs[st.bi];if(!ru){st.ph=fmQ?'fm':'end';break;}if(st.bt<0)st.bt=ru.a;var X=Math.max(1,Math.round(0.01*sr)),len=ru.b-ru.a,Xa=ru.fa?Math.min(X,len>>1):0,Xb=ru.fb?Math.min(X,len>>1):0,e2=Math.min(ru.b,st.bt+262144);
      for(var c2=0;c2<NC;c2++){var ob2=outs[c2],f2=R[c2];for(i=st.bt;i<e2;i++){var x=f2(i+ru.s),q2=i-ru.a,q3=ru.b-1-i,th=q2<Xa?(q2+0.5)/Xa:q3<Xb?(q3+0.5)/Xb:1;
        if(th>=1)ob2[i]=x;else{var an=th*Math.PI/2;ob2[i]=ob2[i]*Math.cos(an)+x*Math.sin(an);}}}
      st.bt=e2;if(e2>=ru.b){st.bi++;st.bt=-1;}if(Date.now()-t0>msb)return false;}
    /* formants: envelope-warp each constant-pitch run back by -semitones, in 4096-sample slices with 1536 padding */
    while(st.ph==='fm'){var SL=4096,PD=1536,ob=outs[fm.c];if(!fm.runs){fm.runs=[];var s0=0;for(var g=0;g<nseg;g++){var e=Math.round(O[g+1]*sr);if(g===nseg-1||Q[g+1]!==Q[g]){if(Math.abs(Q[g])>0.05)fm.runs.push([s0,Math.min(outLen,e),Q[g]]);s0=e;}}fm.ri=0;fm.out=new Float32Array(outLen);fm.out.set(ob);}
      var run=fm.runs[fm.ri];if(!run){outs[fm.c]=fm.out;fm.c++;fm.runs=null;if(fm.c>=NC)st.ph='end';continue;}
      var a=run[0]+fm.a,b=Math.min(run[1],a+SL),xa=Math.max(0,a-PD),xb=Math.min(outLen,b+PD),y=opt.warp(ob.subarray(xa,xb),sr,-run[2]);
      for(i=a;i<b;i++)fm.out[i]=y[i-xa];fm.a+=SL;if(a+SL>=run[1]){fm.ri++;fm.a=0;}
      st.prog=0.75+0.2*(fm.c/NC);if(Date.now()-t0>msb)return false;}
    st.out=outs;st.done=true;st.prog=1;return true;};
  return st;}

/* ---- clip parameters ---- */
function tsMode(c){var f=c&&c.st&&c.st.f;return f==='tempo'||f==='key'||f==='both'?f:'fixed';}
function tsFT(c){var m=tsMode(c);return m==='tempo'||m==='both';}
function tsFK(c){var m=tsMode(c);return m==='key'||m==='both';}
function tsActive(c){if(!c||c.type!=='aud'||!c.st)return false;var s=c.st;return tsMode(c)!=='fixed'||(s.tp&&s.tp!==100)||!!s.sm||!!s.ct;}
function tsSd0(c){return 60/((c.st&&c.st.b0)||P.bpm.v)/4*((c.st&&c.st.tp)||100)/100;}
function tsSrcSd(c){return tsFT(c)?tsSd0(c):stepDur()*((c.st&&c.st.tp)||100)/100;}
function tsKeyAt(g){var r=SEC.built&&SEC.reg;if(r&&r.length){for(var i=r.length-1;i>=0;i--)if(g>=r[i].s)return r[i].key;return r[0].key;}return GAR.key||0;}
function tsVocal(c){var t=tracks[c.ti],n=((c.name||'')+' '+(t?t.name:'')).toLowerCase();return !!c.vt||/voc|voice|vox|sing|mic|lead|choir|rap|speech|talk/.test(n);}
function tsKind(c){if(tsVocal(c))return 'vocal';return 'loop';}
function tsDefault(c){return tsKind(c)==='vocal'?'fixed':'tempo';}
/* set a clip's follow mode; captures the source tempo/key the first time it follows */
function tsSet(c,f){c.st=c.st||{};if(f!=='fixed'){if(!c.st.b0)c.st.b0=daw.tmap&&daw.tmap.length?tmBpm(c.s):P.bpm.v;if(c.st.k0==null)c.st.k0=tsKeyAt(c.s);}c.st.f=f;
  if(c.st.fm==null)c.st.fm=tsVocal(c)?1:0;}
function tsPlan(c){var b=abuf[c.buf];if(!b||!c.st)return null;var s=c.st,ft=tsFT(c),fk=tsFK(c),base=(s.sm||0)+(s.ct||0)/100,k0=s.k0!=null?s.k0:tsKeyAt(c.s);
  function ko(g){if(!fk)return 0;var d=((tsKeyAt(g)-k0)%12+12)%12;return d>6?d-12:d;}
  var O=[0],S=[0],Q=[],G=[0];
  if(ft){var sd0=tsSd0(c),Lst=c.dur/sd0,g=c.s,e=c.s+Lst,o=0,x=0,tm=daw.tmap&&daw.tmap.length;
    while(g<e-1e-9){var gn=Math.min(e,Math.floor(g+1e-9)+1),sd=tm?tmSd(Math.floor(g+1e-9)):stepDur(),q=base+ko(g),n=O.length-1;o+=(gn-g)*sd;x+=(gn-g)*sd0;
      /* merge with the previous segment when the speed and pitch are unchanged */
      if(n>0&&Q[n-1]===q&&Math.abs((S[n]-S[n-1])/(O[n]-O[n-1])-sd0/sd)<1e-9){O[n]=o;S[n]=x;G[n]=gn-c.s;}else{O.push(o);S.push(x);G.push(gn-c.s);Q.push(q);}g=gn;}}
  else{var r=(s.tp||100)/100,pts=[c.s];if(fk)(SEC.reg||[]).forEach(function(R){if(R.s>c.s&&R.s<clipEnd(c))pts.push(R.s);});pts.push(clipEnd(c));
    for(var i=1;i<pts.length;i++){var ot=(pts[i]-c.s)*stepDur();O.push(ot);S.push(ot*r);G.push(pts[i]-c.s);Q.push(base+ko(pts[i-1]));}}
  if(!Q.length)return null;
  var ident=Q.every(function(q){return Math.abs(q)<1e-6;})&&O.every(function(v,i){return Math.abs(v-S[i])<1e-6;}),
      fmOn=!!s.fm&&Q.some(function(q){return Math.abs(q)>0.05;}),
      key=c.buf+'|'+c.off.toFixed(5)+'|'+(c.loop?1:0)+'|'+(fmOn?1:0)+'|'+O.map(function(v,i){return v.toFixed(5)+':'+S[i].toFixed(5)+(i<Q.length?':'+Q[i].toFixed(3):'');}).join(','),
      rmax=0,smax=0;for(var j=0;j<Q.length;j++){var rr=(O[j+1]-O[j])>0?(S[j+1]-S[j])/(O[j+1]-O[j]):1;rmax=Math.max(rmax,Math.abs(rr-1));smax=Math.max(smax,Math.abs(Q[j]));}
  return {O:O,S:S,Q:Q,G:G,off:c.off,loop:c.loop,fm:fmOn,key:key,ident:ident,dur:O[O.length-1],big:rmax>0.15+1e-6||smax>3+1e-6,rmax:rmax,smax:smax};}
/* output seconds at "steps into the clip" (follow tempo) */
function tsOutAt(pl,gs){var G=pl.G,O=pl.O;for(var i=0;i<G.length-1;i++)if(gs<G[i+1]||i===G.length-2){var f=G[i+1]>G[i]?(gs-G[i])/(G[i+1]-G[i]):0;return O[i]+f*(O[i+1]-O[i]);}return 0;}
function tsBig(c){var p=tsActive(c)?tsPlan(c):null;return p&&p.big?p:null;}
/* used by startAudioClip: the rendered buffer, or null (plays the original; rendering is queued) */
function tsUse(c,into){var pl=tsPlan(c);if(!pl||pl.ident)return null;var b=TS.cache[pl.key];
  if(!b){tsKick();if(!offlineRender&&Date.now()-TS.said>8000){TS.said=Date.now();toast('Preparing stretched audio… it plays unchanged until ready.',1800);}return null;}
  tsTouch(pl.key);return {b:b,dur:pl.dur,into:tsFT(c)?tsOutAt(pl,into/stepDur()):into};}
function tsTouch(k){var i=TS.lru.indexOf(k);if(i>=0)TS.lru.splice(i,1);TS.lru.push(k);}
function tsWanted(){var w={};daw.clips.forEach(function(c){if(!tsActive(c))return;var p=tsPlan(c);if(p&&!p.ident)w[p.key]={c:c,p:p};});return w;}
function tsPending(){var w=tsWanted();return Object.keys(w).some(function(k){return !TS.cache[k];});}
function tsKick(){if(offlineRender)return;var w=tsWanted();
  Object.keys(w).forEach(function(k){if(TS.cache[k]||(TS.job&&TS.job.key===k)||TS.q.some(function(j){return j.key===k;}))return;TS.q.push({key:k,c:w[k].c,p:w[k].p});});
  /* cache: what the project uses now plus the 12 most recent others */
  var keep=TS.lru.filter(function(k){return !w[k];}).slice(-12);Object.keys(TS.cache).forEach(function(k){if(!w[k]&&keep.indexOf(k)<0){delete TS.cache[k];var i=TS.lru.indexOf(k);if(i>=0)TS.lru.splice(i,1);}});
  tsPump();}
function tsPump(){if(TS.run)return;if(!TS.job&&!TS.q.length){var ws=TS.waits;TS.waits=[];ws.forEach(function(f){f();});return;}TS.run=true;
  var go=function(){TS.run=false;tsSlice();};if(typeof MessageChannel!=='undefined'){if(!TS.ch){TS.ch=new MessageChannel();TS.ch.port1.onmessage=function(){var f=TS.chf;TS.chf=null;if(f)f();};}TS.chf=go;TS.ch.port2.postMessage(0);}else setTimeout(go,0);}
function tsSlice(){if(offlineRender){setTimeout(tsPump,50);return;}
  if(!TS.job){var J=TS.q.shift();if(!J){tsPump();return;}var b=abuf[J.c.buf];if(!b){tsPump();return;}var ch=[];for(var i=0;i<b.numberOfChannels;i++)ch.push(b.getChannelData(i));
    J.sr=b.sampleRate;J.e=tsEngine(ch,b.sampleRate,J.p,{fm:J.p.fm,warp:typeof vmWarp==='function'?vmWarp:null});TS.job=J;}
  /* the finished render is copied into its AudioBuffer in 128k-sample pieces, one slice at a time */
  var J2=TS.job,t0=Date.now();if(!J2.bc){if(J2.e.step(10)){var o=J2.e.out,nb;try{nb=new AudioBuffer({length:o[0].length,numberOfChannels:o.length,sampleRate:J2.sr});}catch(e){nb=ctx.createBuffer(o.length,o[0].length,J2.sr);}J2.bc={b:nb,o:o,c:0,a:0};}}
  else{var B=J2.bc;while(B.c<B.o.length&&Date.now()-t0<10){var n=Math.min(131072,B.o[B.c].length-B.a),sub=B.o[B.c].subarray(B.a,B.a+n);if(B.b.copyToChannel)B.b.copyToChannel(sub,B.c,B.a);else B.b.getChannelData(B.c).set(sub,B.a);B.a+=n;if(B.a>=B.o[B.c].length){B.c++;B.a=0;}}
    if(B.c>=B.o.length){TS.cache[J2.key]=B.b;tsTouch(J2.key);TS.job=null;dawNeed=true;}}
  tsStat();
  tsPump();}
function tsWait(){return new Promise(function(res){TS.waits.push(res);tsKick();});}
function tsStat(){var el=document.getElementById('ciTsStat');if(!el)return;var c=clipById(daw.sel);if(!c)return;var p=tsActive(c)?tsPlan(c):null;
  el.textContent=!p||p.ident?'Original audio':TS.cache[p.key]?'Ready ✓':TS.job&&TS.job.key===p.key?'Rendering '+Math.round(TS.job.e.prog*100)+'%…':'Queued…';}
setInterval(function(){if(!ctx||offlineRender||!daw.clips.length)return;tsKick();},700);
/* clip sheet rows */
function tsInspRow(c){var s=c.st||{},m=tsMode(c),ft=tsFT(c),pl=tsActive(c)?tsPlan(c):null,
    seg=['fixed','tempo','key','both'].map(function(f){return '<button class="btn" data-tsf="'+f+'" aria-pressed="'+(m===f)+'" style="min-height:44px;flex:1'+(m===f?';background:var(--acc,#7c5cff);color:#fff':'')+'">'+{fixed:'Fixed',tempo:'Tempo',key:'Key',both:'Both'}[f]+'</button>';}).join('');
  return '<div class="card" style="padding:10px;margin:8px 0"><div class="row"><span class="kicker">Stretch &amp; pitch</span><span class="mu" id="ciTsStat"></span></div>'+
    '<p class="note" style="margin:4px 0">Follow the song:</p><div style="display:flex;gap:6px" role="group" aria-label="Follow the song">'+seg+'</div>'+
    (ft?'<div class="row" style="margin-top:8px;gap:6px"><span>Source tempo</span><span style="display:flex;gap:4px;align-items:center"><input type="number" id="ciTsB0" min="30" max="300" step="0.1" value="'+(+(s.b0||P.bpm.v).toFixed(1))+'" style="width:72px;min-height:44px" aria-label="Source tempo BPM"><button class="btn" id="ciTsB2" style="min-height:44px">×2</button><button class="btn" id="ciTsBh" style="min-height:44px">÷2</button></span></div><p class="note" style="margin:2px 0">'+(s.bd?'Detected '+s.bd+' BPM. ':'')+'Correct it if the loop drifts.</p>':'')+
    '<label class="row" style="margin-top:8px"><span>Tempo <b id="ciTsTpV">'+(s.tp||100)+'%</b>'+(ft?' (on top of the song)':'')+'</span><input type="range" id="ciTsTp" min="50" max="200" step="1" value="'+(s.tp||100)+'" aria-label="Tempo percent"></label>'+
    '<label class="row"><span>Semitones <b id="ciTsSmV">'+(s.sm>0?'+':'')+(s.sm||0)+'</b></span><input type="range" id="ciTsSm" min="-12" max="12" step="1" value="'+(s.sm||0)+'" aria-label="Semitones"></label>'+
    '<label class="row"><span>Cents <b id="ciTsCtV">'+(s.ct>0?'+':'')+(s.ct||0)+'</b></span><input type="range" id="ciTsCt" min="-50" max="50" step="1" value="'+(s.ct||0)+'" aria-label="Cents"></label>'+
    '<label class="chk" style="justify-content:space-between"><span>Keep voice character (formants)</span><input type="checkbox" id="ciTsFm"'+((s.fm==null?tsVocal(c):s.fm)?' checked':'')+'></label>'+
    (pl&&pl.big?'<p class="note sc-warn">⚠ Big change ('+(pl.rmax>0.15?'tempo ±'+Math.round(pl.rmax*100)+'%':'')+(pl.rmax>0.15&&pl.smax>3?', ':'')+(pl.smax>3?'pitch ±'+dec(pl.smax,1)+' st':'')+'): quality drops beyond ±15% tempo or ±3 semitones.</p>':'')+'</div>';}
function tsBindInsp(c,done){var root=document.getElementById('ciTsStat');if(!root)return;tsStat();
  Array.prototype.forEach.call(document.querySelectorAll('[data-tsf]'),function(b){b.addEventListener('click',function(){tsSet(c,b.getAttribute('data-tsf'));done();});});
  function num(id,k,lab){var el=document.getElementById(id);if(!el)return;el.addEventListener('input',function(){var v=+el.value,l=document.getElementById(lab);if(l)l.textContent=k==='tp'?v+'%':(v>0?'+':'')+v;});
    el.addEventListener('change',function(){c.st=c.st||{f:'fixed'};c.st[k]=+el.value;if(c.st.fm==null)c.st.fm=tsVocal(c)?1:0;done();});}
  num('ciTsTp','tp','ciTsTpV');num('ciTsSm','sm','ciTsSmV');num('ciTsCt','ct','ciTsCtV');
  var b0=document.getElementById('ciTsB0');function setB(v){if(!(v>=30&&v<=300))return;c.st.b0=Math.round(v*10)/10;done();}
  if(b0){b0.addEventListener('change',function(){setB(+b0.value);});document.getElementById('ciTsB2').addEventListener('click',function(){setB(c.st.b0*2);});document.getElementById('ciTsBh').addEventListener('click',function(){setB(c.st.b0/2);});}
  var fm=document.getElementById('ciTsFm');if(fm)fm.addEventListener('change',function(){c.st=c.st||{f:'fixed'};c.st.fm=fm.checked?1:0;done();});}
