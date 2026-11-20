var VMK=['body','reg','br','gr','gw','bri','nas','vd','vr','vo','dbl','dly','wid'],VMLOG={vr:1,dly:1,vo:1};
var VM0={body:0,reg:0,br:0,gr:0,gw:0,bri:0,nas:0,vd:0,vr:5.5,vo:300,ent:'straight',dbl:0,dly:18,wid:0};
var VMP={
  velvet:{n:'Velvet',d:'dark · soft',col:'#A78BFA',body:1.5,reg:0,br:35,gr:0,gw:0,bri:-2.5,nas:-0.2,vd:30,vr:5,vo:250,ent:'slide',dbl:20,dly:18,wid:40},
  glass:{n:'Glass',d:'bright · pure',col:'#5EEAD4',body:-1.5,reg:0,br:15,gr:0,gw:0,bri:4,nas:0,vd:15,vr:5.5,vo:300,ent:'straight',dbl:30,dly:14,wid:60},
  gravel:{n:'Gravel',d:'rough · low',col:'#FB923C',body:2,reg:-2,br:25,gr:55,gw:45,bri:-1,nas:0.2,vd:10,vr:5,vo:300,ent:'fall',dbl:0,dly:18,wid:0},
  giant:{n:'Giant',d:'huge · slow',col:'#FACC15',body:4,reg:-5,br:10,gr:15,gw:25,bri:-3,nas:0,vd:25,vr:4,vo:400,ent:'scoop',dbl:0,dly:18,wid:0},
  choirboy:{n:'Choirboy',d:'high · airy',col:'#93C5FD',body:-3,reg:5,br:40,gr:0,gw:0,bri:2,nas:-0.3,vd:12,vr:5.5,vo:400,ent:'straight',dbl:25,dly:20,wid:50},
  robot:{n:'Robot Duet',d:'exact · twin',col:'#F472B6',body:0,reg:0,br:0,gr:0,gw:0,bri:1,nas:0.6,vd:0,vr:5.5,vo:300,ent:'straight',dbl:100,dly:12,wid:100,rob:1}};
var VMS=[['body','Body size',-4,4,0.1,' st',1],['reg','Register',-12,12,0.5,' st',1],['br','Breath',0,100,1,'%',1],['gr','Grit',0,100,1,'',1],['gw','Growl',0,100,1,'',0],
  ['bri','Bright',-6,6,0.5,' dB',1],['nas','Nasal',-1,1,0.1,'',1],['dbl','Double',0,100,1,'%',1],['dly','Dbl delay',12,25,0.5,' ms',1],['wid','Width',0,100,1,'%',0],
  ['vd','Vibrato',0,100,1,' ct',0],['vr','Vib. rate',3,8,0.1,' Hz',0],['vo','Vib. onset',0,600,10,' ms',0]];
var VMCOR=[[0,0],[1,0],[0,1],[1,1]],VMCN=['TL','TR','BL','BR'];
var VM={lib:[],tab:'tune',t:null,zone:null,lt:0,sig:''};
try{VM.lib=JSON.parse(localStorage.getItem('ecou.vmLib')||'[]')||[];}catch(e){VM.lib=[];}
try{VM.tag=localStorage.getItem('ecou.vmTag')==='1';}catch(e){}
function vmLibSave(){try{localStorage.setItem('ecou.vmLib',JSON.stringify(VM.lib));}catch(e){}}
function vmLibMerge(L){(L||[]).forEach(function(c){if(c&&c.id&&!vmCard(c.id))VM.lib.push(c);});vmLibSave();}
function vmCard(id){if(id==='__roll'){var vv=vtSet(),mm=vv&&vv.vm;return mm&&mm.rc?Object.assign({id:'__roll'},mm.rc):null;}if(VMP[id])return Object.assign({id:id},VMP[id]);return VM.lib.filter(function(c){return c.id===id;})[0]||null;}
function vmCards(){return Object.keys(VMP).map(vmCard).concat(VM.lib);}
function vmClean(c){var o={};VMK.forEach(function(k){o[k]=c&&c[k]!=null&&!isNaN(+c[k])?+c[k]:VM0[k];});o.ent=c&&c.ent||'straight';if(c&&c.rob)o.rob=1;return o;}
function vmActive(c){return !!c&&(c.body||c.reg||c.br||c.gr||c.gw||c.bri||c.nas||c.vd||c.dbl||c.rob||(c.ent&&c.ent!=='straight'))?true:false;}
function vmEff(v){var m=v&&v.vm;return m&&m.on!==false&&m.c&&vmActive(m.c)?m.c:null;}
/* blend: semitone/dB/% params linearly, time params (vibrato rate, onset, double delay) on a log scale; the entry style comes from the strongest card */
function vmBlend(list){var o={},W=0;list.forEach(function(p){W+=p[1];});if(W<=0)return vmClean(null);
  VMK.forEach(function(k){var s=0;list.forEach(function(p){var x=vmClean(p[0])[k];s+=p[1]/W*(VMLOG[k]?Math.log(x+50):x);});o[k]=VMLOG[k]?Math.exp(s)-50:s;o[k]=Math.round(o[k]*100)/100;});
  var best=list.slice().sort(function(a,b){return b[1]-a[1];})[0][0];o.ent=best&&best.ent||'straight';if(list.some(function(p){return p[0]&&p[0].rob&&p[1]/W>0.5;}))o.rob=1;return o;}
function vmPadW(x,y){var d=[],i;for(i=0;i<4;i++){var dx=x-VMCOR[i][0],dy=y-VMCOR[i][1];d.push([i,Math.sqrt(dx*dx+dy*dy)]);}d.sort(function(a,b){return a[1]-b[1];});
  var w=d.slice(0,3).map(function(p){return [p[0],1/Math.pow(p[1]+0.03,2)];}),W=0;w.forEach(function(p){W+=p[1];});w.forEach(function(p){p[1]/=W;});
  var dc=Math.sqrt((x-0.5)*(x-0.5)+(y-0.5)*(y-0.5));return {w:w,amt:Math.min(1,Math.max(0,(dc-0.06)/0.5))};}
function vmFromPad(m){var P=vmPadW(m.x,m.y),L=P.w.map(function(p){return [vmCard(m.cor[p[0]]),p[1]*P.amt];});L.push([null,1-P.amt]);m.c=vmBlend(L);m.src='pad';}
function vmV(){var v=vtSet();if(!v)return null;if(!v.vm)v.vm={on:true,x:0.5,y:0.5,cor:['velvet','glass','giant','gravel'],c:vmClean(null),a:'velvet',b:'gravel',t:50,src:'pad'};return v.vm;}
function vmRand(s){s=s>>>0||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function vmCurve(A,N,sh,c){var F=A.F,fr=A.hop/A.sr,o=new Float32Array(F),k,i,vd=c.vd/100,vo=c.vo/1000;for(k=0;k<F;k++)o[k]=sh[k]+(isNaN(A.m[k])?0:c.reg);
  for(i=0;i<N.length;i++){var n=N[i],a=n.a,b=Math.min(F,n.b),dur=(b-a)*fr,p=i>0?N[i-1]:null;
    for(k=a;k<b;k++){if(isNaN(A.m[k]))continue;var t=(k-a)*fr,te=(b-k)*fr,add=0;
      if(vd){var ramp=Math.min(1,Math.max(0,(t-vo)/0.2));add+=vd*Math.sin(2*Math.PI*c.vr*(t-vo))*ramp*Math.min(1,te/0.05);}
      if(dur>=0.15){if(c.ent==='scoop'&&t<0.09)add-=1.5*Math.pow(1-t/0.09,2);else if(c.ent==='fall'&&te<0.14)add-=2*Math.pow(1-te/0.14,2);
        else if(c.ent==='slide'&&p&&(a-p.b)*fr<0.25&&t<0.1){var dd=Math.max(-7,Math.min(7,(p.T-n.T)||0));add+=dd*Math.pow(1-t/0.1,2);}}
      o[k]+=add;}}
  return o;}
function vmBq(y,sr,type,f,Q,dB){if(type==='pk'&&!dB)return;var A=Math.pow(10,(dB||0)/40),w=2*Math.PI*f/sr,cs=Math.cos(w),al=Math.sin(w)/(2*Q),b0,b1,b2,a0,a1,a2;
  if(type==='pk'){b0=1+al*A;b1=-2*cs;b2=1-al*A;a0=1+al/A;a1=-2*cs;a2=1-al/A;}else if(type==='hp'){b0=(1+cs)/2;b1=-(1+cs);b2=b0;a0=1+al;a1=-2*cs;a2=1-al;}else{b0=(1-cs)/2;b1=1-cs;b2=b0;a0=1+al;a1=-2*cs;a2=1-al;}
  b0/=a0;b1/=a0;b2/=a0;a1/=a0;a2/=a0;var x1=0,x2=0,y1=0,y2=0;for(var i=0;i<y.length;i++){var x=y[i],v=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=v;y[i]=v;}}
function vmPost(y,A,c,sr,seed){var n=y.length,i,k;
  if(c.bri){vmBq(y,sr,'pk',3000,0.7,c.bri);
    if(c.bri>0){var h=new Float32Array(y),e=0;vmBq(h,sr,'hp',5500,0.7);for(i=0;i<n;i++)e+=h[i]*h[i];var thr=Math.sqrt(e/n)*1.6,env=0,at=Math.exp(-1/(sr*0.002)),rl=Math.exp(-1/(sr*0.06)),dep=Math.min(1,c.bri/4);
      for(i=0;i<n;i++){var a=Math.abs(h[i]);env=a>env?a+(env-a)*at:a+(env-a)*rl;if(env>thr)y[i]-=h[i]*(1-thr/env)*dep;}}}
  if(c.nas){vmBq(y,sr,'pk',500,1.2,-6*c.nas);vmBq(y,sr,'pk',1000,1.4,5*c.nas);}
  if(c.gw){var pk=0;for(i=0;i<n;i++)if(Math.abs(y[i])>pk)pk=Math.abs(y[i]);if(pk>1e-6){var dr=1+c.gw/100*1.5,tn=Math.tanh(dr),mx=c.gw/100*0.6;for(i=0;i<n;i++)y[i]+=mx*(Math.tanh(dr*y[i]/pk)/tn*pk-y[i]);}}
  if(c.br){var R=vmRand(seed||7),nz=new Float32Array(n),ns=0,hop=A.hop,F=A.F,env2=new Float32Array(F),bo=0,dec=Math.exp(-hop/sr/0.15),pr=0,lvl=c.br/100*0.9;
    for(i=0;i<n;i++)nz[i]=R()*2-1;vmBq(nz,sr,'hp',1800,0.7);vmBq(nz,sr,'lp',7500,0.7);for(i=0;i<n;i++)ns+=nz[i]*nz[i];ns=Math.sqrt(ns/n)||1;
    /* aspiration follows the take's own 1.8–7.5 kHz envelope, so a dark or band-limited recording gets proportionally less hiss */
    if(!A.hfr){var hx=new Float32Array(A.x);vmBq(hx,sr,'hp',1800,0.7);vmBq(hx,sr,'lp',7500,0.7);A.hfr=new Float32Array(F);for(k=0;k<F;k++){var e3=0,j0=Math.max(0,k*hop-hop),j1=Math.min(n,k*hop+hop);for(i=j0;i<j1;i++)e3+=hx[i]*hx[i];A.hfr[k]=Math.sqrt(e3/Math.max(1,j1-j0));}}
    for(k=0;k<F;k++){var r=A.rms[k];if(r>pr*2&&r>0.01)bo=1;else bo*=dec;pr=pr*0.6+r*0.4;env2[k]=Math.min(A.hfr[k],0.25*r)*(1+1.5*bo);}
    for(i=0;i<n;i++){var fk=i/hop,k0=Math.min(F-1,Math.floor(fk)),k1=Math.min(F-1,k0+1),fi=fk-k0;nz[i]*=lvl*(env2[k0]*(1-fi)+env2[k1]*fi)/ns;}
    /* click guard: the hiss may add at most 15 % to the take's largest sample-to-sample step (matters on dark, band-limited phone takes) */
    if(A.mj==null){A.mj=0;for(i=1;i<n;i++){var q=Math.abs(A.x[i]-A.x[i-1]);if(q>A.mj)A.mj=q;}}var nj=0;for(i=1;i<n;i++){var q2=Math.abs(nz[i]-nz[i-1]);if(q2>nj)nj=q2;}var gc=nj>0.15*A.mj?0.15*A.mj/nj:1;
    for(i=0;i<n;i++)y[i]+=nz[i]*gc;}}
/* body / formant: STFT spectral-envelope warp of the source (1024-pt Hann, hop 512, weighted overlap-add, cepstral envelope liftered under the voice's period).
   Each bin is multiplied by E(f/a)/E(f): the harmonics stay where they are (pitch untouched) while the envelope moves by exactly a=2^(st/12). */
function vmWarp(x,sr,st,A){if(Math.abs(st)<0.05)return x;var a=Math.pow(2,st/12),N=1024,H=512,h2=N/2,NC=128,QM=40,n=x.length,i,j,k,q,F=VM.fF||(VM.fF=fftInit(N)),W=VM.fW,T=VM.fT,bz=sr/N;
  if(!W){W=VM.fW=new Float32Array(N);for(i=0;i<N;i++)W[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);T=VM.fT=new Float32Array(QM*NC);for(q=0;q<QM;q++)for(j=0;j<NC;j++)T[q*NC+j]=Math.cos(Math.PI*q*(j+0.375)/NC);}
  var re=new Float64Array(N),im=new Float64Array(N),ar=new Float64Array(h2+1),ai=new Float64Array(h2+1),br=new Float64Array(h2+1),bi=new Float64Array(h2+1),Pw=new Float64Array(h2+1),
      L=new Float32Array(NC),E=new Float32Array(NC+2),c=new Float32Array(QM),Rc=new Float32Array(NC+1),RA=new Float32Array(h2+1),RB=new Float32Array(h2+1),out=new Float32Array(n),ws=new Float32Array(n),
      m0=new Int16Array(h2+1),mf=new Float32Array(h2+1),c0=new Int16Array(NC),cf=new Float32Array(NC);
  for(k=0;k<=h2;k++){var p1=Math.max(0,Math.min(NC-1,(k-1.5)/4));m0[k]=Math.min(NC-1,Math.floor(p1));mf[k]=p1-m0[k];}
  for(j=0;j<NC;j++){var p0=Math.max(0,Math.min(NC-1,((4*j+1.5)/a-1.5)/4));c0[j]=Math.min(NC-1,Math.floor(p0));cf[j]=p0-c0[j];}
  /* envelope of one frame -> per-bin gain E(f/a)/E(f). Voiced frames: each cell takes the strongest bin within ±f0/2 (an envelope through the
     harmonic peaks, not the valleys between them), liftered just under the period so the harmonics themselves are never "moved". */
  function ratio(t0,Rk){var j,k,q,fk=A?Math.min(A.F-1,Math.max(0,Math.round((t0+h2)/A.hop))):0,mi=A?A.m[fk]:NaN,Q=QM,hw=0;
    if(!isNaN(mi)){var f0=440*Math.pow(2,(mi-69)/12);Q=Math.max(14,Math.min(QM,Math.round(0.9*sr/f0)));hw=Math.round(0.5*f0/bz);}
    for(j=0;j<NC;j++){var e2=0,lo=Math.max(0,j*4-hw),hi=Math.min(h2,j*4+3+hw);if(hw){for(k=lo;k<=hi;k++)if(Pw[k]>e2)e2=Pw[k];}else{for(k=j*4;k<j*4+4;k++)e2+=Pw[k];e2/=4;}L[j]=0.5*Math.log(e2+1e-14);}
    for(q=0;q<Q;q++){var s3=0,o=q*NC;for(j=0;j<NC;j++)s3+=L[j]*T[o+j];c[q]=s3/NC*(q?2:1)*(q<Q-6?1:0.5+0.5*Math.cos(Math.PI*(q-Q+6)/6));}
    for(j=0;j<NC;j++){var s4=0;for(q=0;q<Q;q++)s4+=c[q]*T[q*NC+j];E[j]=s4;}E[NC]=E[NC+1]=E[NC-1];
    for(j=0;j<NC;j++){var d=E[c0[j]]*(1-cf[j])+E[c0[j]+1]*cf[j]-E[j];Rc[j]=Math.exp(d>3.5?3.5:d<-3.5?-3.5:d);}Rc[NC]=Rc[NC-1];
    for(k=0;k<=h2;k++)Rk[k]=Rc[m0[k]]*(1-mf[k])+Rc[m0[k]+1]*mf[k];}
  /* two real frames per complex FFT (frame t0 in re, frame t0+H in im) */
  for(var t0=-N+H;t0<n;t0+=2*H){var eA=0,eB=0,s,sB;
    for(i=0;i<N;i++){s=t0+i;sB=s+H;var va=s>=0&&s<n?x[s]*W[i]:0,vb=sB>=0&&sB<n?x[sB]*W[i]:0;re[i]=va;im[i]=vb;eA+=va*va;eB+=vb*vb;}
    if(eA>1e-9||eB>1e-9){fft(F,re,im,false);
      for(k=0;k<=h2;k++){var nk=(N-k)%N;ar[k]=(re[k]+re[nk])/2;ai[k]=(im[k]-im[nk])/2;br[k]=(im[k]+im[nk])/2;bi[k]=-(re[k]-re[nk])/2;}
      if(eA>1e-9){for(k=0;k<=h2;k++)Pw[k]=ar[k]*ar[k]+ai[k]*ai[k];ratio(t0,RA);}else RA.fill(1);
      if(eB>1e-9){for(k=0;k<=h2;k++)Pw[k]=br[k]*br[k]+bi[k]*bi[k];ratio(t0+H,RB);}else RB.fill(1);
      for(k=0;k<=h2;k++){var xr=ar[k]*RA[k],xi=ai[k]*RA[k],yr=br[k]*RB[k],yi=bi[k]*RB[k];re[k]=xr-yi;im[k]=xi+yr;if(k>0&&k<h2){re[N-k]=xr+yi;im[N-k]=-xi+yr;}}
      fft(F,re,im,true);}
    for(i=0;i<N;i++){var w=W[i];s=t0+i;if(s>=0&&s<n){out[s]+=re[i]*w;ws[s]+=w*w;}sB=s+H;if(sB>=0&&sB<n){out[sB]+=im[i]*w;ws[sB]+=w*w;}}}
  for(i=0;i<n;i++)out[i]=ws[i]>1e-6?out[i]/ws[i]:x[i];return out;}
function vmRender(b,v,A,N,sh,MK,vc){var sr=b.sampleRate,C=b.numberOfChannels,n=b.length,s2=vmCurve(A,N,sh,vc),fs=(v.fmt||0)-vc.body,thr=(v.thr||0)/100,
    op={jit:vc.gr/100,gw:vc.gw/100,seed:11},lv=vc.dbl/100*0.55,wd=vc.wid/100,st=lv>0&&wd>0,ys=[],xs=[],w0=null,ch,i,k;
  for(ch=0;ch<C;ch++){var x0=b.getChannelData(ch),xw=vmWarp(x0,sr,fs,A);if(!ch)w0=xw;xs.push(x0);var y=vtLvl(vtPsola(xw,A,s2,MK,1,op),x0);if(thr)vtThroat(y,sr,thr);ys.push(y);}
  if(st&&ys.length===1){ys.push(new Float32Array(ys[0]));xs.push(xs[0]);}
  if(lv>0){var sa=new Float32Array(s2.length),sb=new Float32Array(s2.length);for(k=0;k<s2.length;k++){var vo=!isNaN(A.m[k]);sa[k]=s2[k]+(vo?0.08:0);sb[k]=s2[k]-(vo?0.08:0);}
    var xd=C===1?w0:vmWarp(A.x,sr,fs,A),d1=vtPsola(xd,A,sa,MK,1,{jit:op.jit,gw:op.gw,seed:23}),d2=vtPsola(xd,A,sb,MK,1,{jit:op.jit,gw:op.gw,seed:37}),L1=Math.round(vc.dly/1000*sr),L2=Math.round(Math.min(25,vc.dly+5)/1000*sr);
    for(ch=0;ch<ys.length;ch++){var yy=ys[ch],pa=ys.length===1?0.5:ch===0?(1+wd)/2:(1-wd)/2,pb=1-pa;for(i=0;i<n;i++)yy[i]+=lv*(pa*(i>=L1?d1[i-L1]:0)+pb*(i>=L2?d2[i-L2]:0));}}
  ys.forEach(function(y,c2){vmPost(y,A,vc,sr,101+c2);});
  /* loudness: every output channel gets its own input channel's RMS (a hard-panned double no longer leaves one side quieter); peaks above 0.9 are bent softly instead of turning the whole take down */
  var nb=ctx.createBuffer(ys.length,n,sr);ys.forEach(function(y,c2){var x=xs[c2],ei=0,eo=0;for(i=0;i<n;i++){ei+=x[i]*x[i];eo+=y[i]*y[i];}var g=eo>1e-12?Math.sqrt(ei/eo):1;g=Math.max(0.1,Math.min(8,g));
    for(i=0;i<n;i++){var q2=y[i]*g,aq=q2<0?-q2:q2;if(aq>0.9)q2=(q2<0?-1:1)*(0.9+0.0999*Math.tanh((aq-0.9)/0.0999));y[i]=q2;}nb.getChannelData(c2).set(y);});return nb;}
/* names for "New singer": two invented words, checked against a blocklist of common first/last names and accent/language/region/ethnicity words */
var VMADJ=['Copper','Silver','Paper','Midnight','Hollow','Static','Neon','Cobalt','Dusty','Lunar','Velour','Rusty','Quiet','Electric','Woolen','Marble','Ember','Tidal','Frosted','Smoky','Amber','Crimson','Pale','Wired','Gentle','Golden'];
var VMNOUN=['Moth','Lantern','Comet','Harbor','Kettle','Falcon','Thistle','Engine','Meadow','Raven','Pebble','Signal','Orchard','Cinder','Ferry','Bramble','Beacon','Otter','Glacier','Mirror','Sparrow','Tram','Kite','Echo','Robin','Stone'];
var VMBLOCK=('grace rose ruby jade amber pearl hope faith joy will mark bill jack frank drake prince robin sky river summer autumn dawn eve ivy lily daisy hunter king smith brown young bell wolf fox stone cash raven taylor jones miller davis garcia wilson moore lee '+
  'african american arab arabic asian british cajun celtic chinese creole english eastern european french german gypsy roma hispanic indian irish italian japanese jewish korean latin latino latina mexican native nordic oriental russian scottish slavic southern spanish tribal western black white accent dialect brogue cockney yankee ethnic').split(' ');
function vmNameOk(nm){return nm.toLowerCase().split(/\s+/).every(function(w){return VMBLOCK.indexOf(w)<0;});}
function vmName(R){R=R||Math.random;for(var t=0;t<60;t++){var nm=VMADJ[Math.floor(R()*VMADJ.length)]+' '+VMNOUN[Math.floor(R()*VMNOUN.length)];if(vmNameOk(nm)&&!vmCards().some(function(c){return c.n===nm;}))return nm;}return 'Paper Comet';}
/* coherent randomiser: bigger body pulls the register down, more growl takes brightness away */
function vmRoll(R){R=R||Math.random;var cl=function(x,a,b){return Math.max(a,Math.min(b,x));},r2=function(x){return Math.round(x*2)/2;},body=Math.round((-3+R()*7)*10)/10,gw=R()<0.35?Math.round(R()*60):0;
  return {body:body,reg:cl(r2(-body*1.3+R()*3-1.5),-12,12),br:Math.round(R()*50),gr:Math.round(cl(R()*35+gw*0.4,0,100)),gw:gw,bri:cl(r2(2.5-gw/15-body*0.5+R()*2-1),-6,6),nas:Math.round((R()*1.2-0.6)*10)/10,
    vd:Math.round(R()*40),vr:Math.round((4+R()*2.5)*10)/10,vo:Math.round(150+R()*350),ent:['straight','scoop','fall','slide'][Math.floor(R()*4)],dbl:R()<0.4?Math.round(R()*50):0,dly:Math.round(12+R()*13),wid:0};}
function vmWave(c,col){c=vmClean(c);var p='',i;for(i=0;i<=48;i++){var x=i/48,amp=4+Math.min(4,Math.abs(c.body))+c.gw/30,f=3+c.bri/3+c.reg/8,j=(c.gr/100)*Math.sin(i*7.3)*2.5,y=12-Math.sin(x*f*Math.PI)*amp*Math.exp(-x*(1.4-c.br/100))-j;p+=(i?'L':'M')+(x*100).toFixed(1)+' '+y.toFixed(1);}
  return '<svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><path d="'+p+'" fill="none" stroke="'+(col||'#ccc')+'" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';}
function vmMix(m){if(m.src==='ab'){var A=vmCard(m.a),B=vmCard(m.b);return [[A,100-m.t],[B,m.t]].filter(function(p){return p[0];}).sort(function(a,b){return b[1]-a[1];});}
  if(m.src!=='pad')return vmActive(m.c)?[[{n:m.nm||'Custom card',col:'#D4FF3A'},100]]:[];var P=vmPadW(m.x,m.y);if(P.amt<0.04)return [];return P.w.map(function(p){return [vmCard(m.cor[p[0]]),Math.round(p[1]*100)];}).filter(function(p){return p[0]&&p[1]>0;});}
function vmLocked(){return !!(VT.c&&VT.c.imp&&!VT.c.vmOk);}
function vmApply(now){var v=vtSet(),m=v&&v.vm;if(!m)return;vmUI();if(vmLocked())return;
  if(VTL.on&&VT.live){VTL.vm=vmEff(v);vtLivePush(VT.live);}
  clearTimeout(VM.t);VM.t=setTimeout(function(){VM.t=null;var was=VT.au&&!VT.auRaw,p=vtPos();vtRender();if(was)vtPreview(true,false,p);vmUI();},now?0:160);}
function vmShow(){var sh=$('#vtSheet');if(!sh)return;sh.classList.toggle('vm',VM.tab==='vm');sh.classList.toggle('vmpro',!!(VT.all||document.body.classList.contains('is-pro')));
  $$('[data-vmt]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-vmt')===VM.tab);});if(VM.tab==='vm'){vmV();VM.sig='';vmUI();}}
function vmUI(){var v=vtSet(),m=v&&v.vm;if(!m||$('#vtSheet').hidden)return;var c=m.c||vmClean(null);
  $$('#vmPad .vm-cor').forEach(function(el,i){var k=vmCard(m.cor[i])||vmCard('velvet');el.innerHTML='<b><i style="background:'+k.col+'"></i>'+escapeH(k.n)+'</b><span>'+escapeH(k.d||'')+'</span>'+vmWave(k,k.col);});
  var pk=$('#vmPuck');pk.style.left=(m.x*100)+'%';pk.style.top=(m.y*100)+'%';
  var mx=vmMix(m),tx=mx.length?mx.map(function(p){return escapeH(p[0].n)+' '+p[1];}).join(' · '):'Your own voice';$('#vmRd').innerHTML=tx;$('#vmPad').setAttribute('aria-valuetext',tx);
  $('#vmBar').innerHTML=mx.map(function(p){return '<i style="flex:'+Math.max(1,p[1])+';background:'+(p[0].col||'#ccc')+'"></i>';}).join('')||'<i style="flex:1;background:#FB7185"></i>';
  $('#vmLv').textContent=VTL.on&&VT.live?'LIVE':VT.au&&!VT.auRaw?'PLAYING':'PREVIEW';
  var cs=vmCards(),sig=JSON.stringify([m.cor,m.rc?m.rc.n:'',cs.map(function(k){return k.id;})]);
  if(sig!==VM.sig){VM.sig=sig;var rc=m.rc&&m.cor.indexOf('__roll')>=0?m.rc:null,rolled=rc?'<button class="vm-sc" data-vmc="__roll" style="border-color:#D4FF3A"><em style="background:#D4FF3A">'+VMCN[m.cor.indexOf('__roll')]+'</em>'+vmWave(rc,'#D4FF3A')+'<b>'+escapeH(rc.n)+'</b><span>just rolled</span></button>':'';
    $('#vmShelf').innerHTML='<button class="vm-sc new" id="vmNew"><b style="font-size:22px">🎲</b><b>New singer</b><span>roll a voice</span></button>'+rolled+cs.map(function(k){var ci=m.cor.indexOf(k.id);
      return '<button class="vm-sc" data-vmc="'+escapeH(k.id)+'"'+(ci>=0?' style="border-color:'+k.col+'"':'')+' aria-label="'+escapeH(k.n+' card: '+(k.d||'')+'. Drag onto a corner of the voice space')+'">'+(ci>=0?'<em style="background:'+k.col+'">'+VMCN[ci]+'</em>':'')+vmWave(k,k.col)+'<b>'+escapeH(k.n)+'</b><span>'+escapeH(k.d||'')+'</span></button>';}).join('');
    var opt=cs.map(function(k){return '<option value="'+escapeH(k.id)+'">'+escapeH(k.n)+'</option>';}).join('');$('#vmA').innerHTML=opt;$('#vmB').innerHTML=opt;}
  $('#vmA').value=m.a;$('#vmB').value=m.b;$('#vmT').value=m.t;$('#vmTo').textContent='A ← '+Math.round(m.t)+'% → B';
  VMS.forEach(function(q){var e=$('#vmS_'+q[0]);if(!e)return;if(document.activeElement!==e)e.value=c[q[0]];var val=c[q[0]];$('#vmO_'+q[0]).textContent=(val>0&&q[2]<0?'+':'')+(Math.round(val*10)/10)+q[5];});
  $$('[data-vme]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-vme')===c.ent);});
  $('#vmConsent').hidden=!vmLocked();$('#vmBox').classList.toggle('lock',vmLocked());$('#vmTag').checked=!!VM.tag;
  $('#vmPlay').textContent=VT.au&&!VT.auRaw?'■ Stop':'▶ Play take';vmChUI();
  $('#vmInfo').textContent=(vmEff(v)?'Voice card on':'Your own voice')+(VT.ms?' · rendered in '+Math.round(VT.ms)+' ms':'')+' · LIVE controls are heard while monitoring with headphones; RENDER controls apply to the take.';}
function vmChUI(){var v=vtSet(),el=$('#vmCh');if(!el||!v)return;var hs=vtHs(v),cs=vmCards();
  var s=hs.map(function(h){var t=tracks[h.ti],p=t?t.pan||0:0,k=h.hv.vmid&&vmCard(h.hv.vmid);return '<div class="vm-hc" data-vmh="'+h.id+'" style="border-color:'+(k?k.col:'#34344a')+'"><b>'+escapeH(k?k.n:'Same as lead')+'</b><span class="mu" style="font:12px ui-monospace,monospace">'+escapeH(vtIntName(h.hv.st))+' · '+(p<-0.05?'L'+Math.round(-p*100):p>0.05?'R'+Math.round(p*100):'C')+'</span>'+
    '<select aria-label="Voice card for this harmony"><option value="">Same as lead</option>'+cs.map(function(c){return '<option value="'+escapeH(c.id)+'"'+(h.hv.vmid===c.id?' selected':'')+'>'+escapeH(c.n)+'</option>';}).join('')+'</select></div>';}).join('');
  el.innerHTML=s||'<span class="mu" style="font-size:13px">No harmonies yet. Make choir adds three, each sung by a different card.</span>';}
function vmChoir(){var v=vtSet();if(!v){toast('Open a take first.');return;}if(vmLocked()){toast('Confirm permission first.');return;}
  var plan=[[2,'choirboy',-0.4],[-12,'giant',0],[4,'glass',0.4]],n0=vtHs(v).length;plan.forEach(function(p){vtHarmony(p[0],vmCard(p[1]),p[2]);});
  var n=vtHs(v).length-n0;VM.sig='';vmUI();if(n)toast('Choir: '+n+' harmony voices added, each with its own card and place in the stereo field.',2600);}
function vmSaveCard(){var v=vtSet(),m=v&&v.vm;if(!m)return;var ri=m.rc?m.cor.indexOf('__roll'):-1;
  if(ri>=0){var kr=Object.assign(vmClean(m.rc),{id:'u'+Date.now().toString(36)+Math.floor(Math.random()*1e4),n:m.rc.n,d:'rolled',col:['#D4FF3A','#F9A8D4','#67E8F9','#FDBA74'][VM.lib.length%4]});
    VM.lib.push(kr);vmLibSave();m.cor[ri]=kr.id;delete m.rc;vmFromPad(m);markDirty();VM.sig='';vmUI();toast('Saved “'+kr.n+'” to your cards.',2000);return kr;}
  var nm=m.src==='roll'&&m.nm?m.nm:vmName(),mx=vmMix(m);
  var k=Object.assign(vmClean(m.c),{id:'u'+Date.now().toString(36)+Math.floor(Math.random()*1e4),n:nm,d:mx.length>1?mx.slice(0,2).map(function(p){return p[0].n.toLowerCase();}).join(' + '):'my card',col:['#D4FF3A','#F9A8D4','#67E8F9','#FDBA74'][VM.lib.length%4]});
  VM.lib.push(k);vmLibSave();markDirty();VM.sig='';vmUI();toast('Saved “'+nm+'” to your cards.',2000);return k;}
function vmTagWav(u8){try{if(!VM.tag||!daw.clips.some(function(c){return (c.vt&&vmEff(c.vt))||(c.hv&&c.hv.vm);}))return u8;}catch(e){return u8;}
  var s='Voice transformed with Ecou\0',pad=s.length&1,len=12+s.length+pad,out=new Uint8Array(u8.length+8+len),dv=new DataView(out.buffer),o=u8.length;out.set(u8);
  function str(t){for(var i=0;i<t.length;i++)out[o++]=t.charCodeAt(i);}str('LIST');dv.setUint32(o,len,true);o+=4;str('INFO');str('ICMT');dv.setUint32(o,s.length,true);o+=4;str(s);if(pad)out[o++]=0;dv.setUint32(4,out.length-8,true);return out;}
function vmInit(){var pad=$('#vmPad');if(!pad)return;
  $('#vmSl').innerHTML=VMS.map(function(q){return '<label class="vm-row"><span>'+q[1]+'</span><input type="range" id="vmS_'+q[0]+'" min="'+q[2]+'" max="'+q[3]+'" step="'+q[4]+'" aria-label="'+q[1]+'"><output id="vmO_'+q[0]+'"></output><span class="vm-tg'+(q[6]?'':' r')+'">'+(q[6]?'LIVE':'RENDER')+'</span></label>';}).join('');
  $$('[data-vmt]').forEach(function(b){b.addEventListener('click',function(){VM.tab=b.getAttribute('data-vmt');vmShow();if(VM.tab==='tune')requestAnimationFrame(vtDraw);});});
  $('#vmPro').addEventListener('change',function(e){VT.all=e.target.checked;try{localStorage.setItem('ecou.vtAll',VT.all?'1':'0');}catch(x){}$('#vtSheet').classList.toggle('all',VT.all);$('#vtSheet').classList.toggle('vmpro',VT.all||document.body.classList.contains('is-pro'));vmUI();});
  function zone(m){for(var i=0;i<4;i++){var dx=m.x-VMCOR[i][0],dy=m.y-VMCOR[i][1];if(dx*dx+dy*dy<0.03)return i;}var cx=m.x-0.5,cy=m.y-0.5;return cx*cx+cy*cy<0.006?'c':null;}
  function move(e){var m=vmV(),r=pad.getBoundingClientRect();m.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));m.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));vmFromPad(m);
    var z=zone(m);if(z!==VM.zone&&z!=null&&navigator.vibrate)try{navigator.vibrate(z==='c'?[6,40,6]:8);}catch(x){}VM.zone=z;vmApply();}
  pad.addEventListener('pointerdown',function(e){if(vmLocked())return;e.preventDefault();var now=Date.now();
    if(now-VM.lt<320){VM.lt=0;vtPushUndo();var m=vmV();m.x=0.5;m.y=0.5;vmFromPad(m);if(navigator.vibrate)try{navigator.vibrate([6,40,6]);}catch(x){}vmApply(true);toast('Back to your own voice.',1200);return;}
    VM.lt=now;vtPushUndo();VM.drag=e.pointerId;pad.classList.add('drag');try{pad.setPointerCapture(e.pointerId);}catch(x){}move(e);});
  pad.addEventListener('pointermove',function(e){if(VM.drag===e.pointerId)move(e);});
  function up(e){if(VM.drag!==e.pointerId)return;VM.drag=null;pad.classList.remove('drag');vmApply(true);}pad.addEventListener('pointerup',up);pad.addEventListener('pointercancel',up);
  /* shelf: tap a card = put it on the corner nearest to YOU; drag it onto a corner = swap that corner */
  var sh=$('#vmShelf'),gh=null,sd=null;
  sh.addEventListener('pointerdown',function(e){var b=e.target.closest('[data-vmc]');if(!b||vmLocked())return;sd={id:b.getAttribute('data-vmc'),x:e.clientX,y:e.clientY,lx:e.clientX,mv:false,h:false,el:b,pid:e.pointerId};try{b.setPointerCapture(e.pointerId);}catch(x){}});
  sh.addEventListener('pointermove',function(e){if(!sd||sd.pid!==e.pointerId)return;if(!sd.mv&&(sd.h||Math.abs(e.clientX-sd.x)>10&&Math.abs(e.clientX-sd.x)>2*Math.abs(e.clientY-sd.y))){sd.h=true;sh.scrollLeft-=e.clientX-sd.lx;sd.lx=e.clientX;return;}if(!sd.mv&&Math.abs(e.clientY-sd.y)>10){sd.mv=true;try{sd.el.setPointerCapture(e.pointerId);}catch(x){}gh=sd.el.cloneNode(true);gh.classList.add('vm-ghost');document.body.appendChild(gh);}
    if(sd.mv){sd.px=e.clientX;sd.py=e.clientY;gh.style.left=e.clientX+'px';gh.style.top=e.clientY+'px';var hit=document.elementFromPoint(e.clientX,e.clientY),cor=hit&&hit.closest&&hit.closest('#vmPad')?vmNearCor(e):-1;$$('#vmPad .vm-cor').forEach(function(el,i){el.classList.toggle('hot',i===cor);});}});
  function vmNearCor(e){var r=pad.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;return (x<0.5?0:1)+(y<0.5?0:2);}
  function place(id,ci){var m=vmV();vtPushUndo();var old=m.cor.indexOf(id);if(old>=0&&old!==ci)m.cor[old]=m.cor[ci];m.cor[ci]=id;if(m.src!=='pad')m.src='pad';vmFromPad(m);VM.sig='';if(navigator.vibrate)try{navigator.vibrate(8);}catch(x){}vmApply(true);toast((vmCard(id)||{}).n+' is now the '+['top-left','top-right','bottom-left','bottom-right'][ci]+' corner.',1600);}
  function sup(e){if(!sd||sd.pid!==e.pointerId)return;var d=sd;sd=null;if(gh){gh.remove();gh=null;}$$('#vmPad .vm-cor').forEach(function(el){el.classList.remove('hot');});
    if(d.mv){var r=pad.getBoundingClientRect(),pt={clientX:d.px!=null?d.px:e.clientX,clientY:d.py!=null?d.py:e.clientY};if(pt.clientX>=r.left&&pt.clientX<=r.right&&pt.clientY>=r.top&&pt.clientY<=r.bottom)place(d.id,vmNearCor(pt));}
    else if(e.type==='pointerup'&&!d.h){var m=vmV();if(m.cor.indexOf(d.id)>=0){toast('That card is already on the pad.',1200);return;}var best=0,bd=9;VMCOR.forEach(function(p,i){var q=(m.x-p[0])*(m.x-p[0])+(m.y-p[1])*(m.y-p[1]);if(q<bd){bd=q;best=i;}});place(d.id,best);}}
  sh.addEventListener('pointerup',sup);sh.addEventListener('pointercancel',sup);
  sh.addEventListener('click',function(e){if(e.target.closest('#vmNew')&&!vmLocked()){var m=vmV();vtPushUndo();var nm=vmName(),ci=m.cor.indexOf('__roll');
      if(ci<0){var bd=9;ci=1;VMCOR.forEach(function(p,i){var q=(m.x-p[0])*(m.x-p[0])+(m.y-p[1])*(m.y-p[1]);if(q<bd-1e-9){bd=q;ci=i;}});if(Math.abs(m.x-0.5)<0.06&&Math.abs(m.y-0.5)<0.06)ci=1;}
      m.rc=Object.assign(vmRoll(),{n:nm,d:'just rolled',col:'#D4FF3A'});m.nm=nm;m.cor[ci]='__roll';m.x=VMCOR[ci][0];m.y=VMCOR[ci][1];vmFromPad(m);VM.sig='';vmApply(true);
      toast('New singer: '+nm+' is on the '+['top-left','top-right','bottom-left','bottom-right'][ci]+' corner, and YOU are on it. Save card to keep it.',2400);}});
  var hold=$('#vmHold');function hdn(e){e.preventDefault();if(VM.hold)return;VM.hold=1;VM.hw=!!(VT.au&&!VT.auRaw);if(VT.au)vtPreview(true,true,vtPos());else vtPreview(false,true);hold.setAttribute('aria-pressed','true');}
  function hup(){if(!VM.hold)return;VM.hold=0;hold.setAttribute('aria-pressed','false');if(VM.hw&&VT.au)vtPreview(true,false,vtPos());else{vtStopAu();vtUI();}vmUI();}
  hold.addEventListener('pointerdown',hdn);['pointerup','pointercancel','pointerleave'].forEach(function(t){hold.addEventListener(t,hup);});hold.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#vmSave').addEventListener('click',vmSaveCard);$('#vmSave2').addEventListener('click',vmSaveCard);$('#vmChoir').addEventListener('click',vmChoir);$('#vmChoir2').addEventListener('click',vmChoir);
  $('#vmPlay').addEventListener('click',function(){vtPreview(false,false);vmUI();});$('#vmSong').addEventListener('click',function(){if(VT.c)vtGoClip(VT.c.id);else{vtClose();toast('Your morphed voice is in the Capture source.',1800);}});
  $('#vmOk').addEventListener('click',function(){if(VT.c){VT.c.vmOk=1;markDirty();}vmUI();toast('Thanks. Only share transformed voices with the speaker’s consent.',2200);});
  $('#vmTag').addEventListener('change',function(e){VM.tag=e.target.checked;try{localStorage.setItem('ecou.vmTag',VM.tag?'1':'0');}catch(x){}});
  function ab(){var m=vmV();m.src='ab';m.c=vmBlend([[vmCard(m.a),100-m.t],[vmCard(m.b),m.t]]);vmApply();}
  $('#vmA').addEventListener('change',function(e){vtPushUndo();vmV().a=e.target.value;ab();});$('#vmB').addEventListener('change',function(e){vtPushUndo();vmV().b=e.target.value;ab();});
  $('#vmT').addEventListener('pointerdown',function(){vtPushUndo();});$('#vmT').addEventListener('input',function(e){vmV().t=+e.target.value;ab();});
  $('#vmSl').addEventListener('pointerdown',function(){vtPushUndo();});
  $('#vmSl').addEventListener('input',function(e){var k=e.target.id.replace('vmS_','');if(VM0[k]==null)return;var m=vmV();m.c=vmClean(m.c);m.c[k]=+e.target.value;if(m.src!=='roll')m.src='edit';vmApply();});
  $$('[data-vme]').forEach(function(b){b.addEventListener('click',function(){var m=vmV();if(!m)return;vtPushUndo();m.c=vmClean(m.c);m.c.ent=b.getAttribute('data-vme');if(m.src!=='roll')m.src='edit';vmApply(true);});});
  $('#vmCh').addEventListener('change',function(e){var r=e.target.closest('[data-vmh]');if(!r)return;var h=clipById(+r.getAttribute('data-vmh'))||clipById(r.getAttribute('data-vmh'));if(!h)return;var k=vmCard(e.target.value);
    if(k){h.hv.vm=vmClean(k);h.hv.vmid=k.id;}else{delete h.hv.vm;delete h.hv.vmid;}vtHarmRender(h);vmChUI();if(VT.au&&!VT.auRaw)vtPreview(true,false,vtPos());});}
