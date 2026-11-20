function docWorker(){
  var FFTC={},CLO=self.CLO||50,CPW=self.CPW==null?1:self.CPW;
  function prog(f,m){self.postMessage({t:'prog',f:f,msg:m});}
  function fftPlan(n){if(FFTC[n])return FFTC[n];var rev=new Uint32Array(n),lg=Math.round(Math.log(n)/Math.LN2),i,j;for(i=0;i<n;i++){var r=0,x=i;for(j=0;j<lg;j++){r=(r<<1)|(x&1);x>>=1;}rev[i]=r;}
    var cs=new Float64Array(n/2),sn=new Float64Array(n/2);for(i=0;i<n/2;i++){cs[i]=Math.cos(-2*Math.PI*i/n);sn[i]=Math.sin(-2*Math.PI*i/n);}return (FFTC[n]={rev:rev,cs:cs,sn:sn,n:n});}
  function fft(P,re,im){var n=P.n,rev=P.rev,i,j,t;for(i=0;i<n;i++){j=rev[i];if(j>i){t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
    for(var size=2;size<=n;size<<=1){var h=size>>1,step=n/size;for(i=0;i<n;i+=size){for(j=0;j<h;j++){var k=j*step,wr=P.cs[k],wi=P.sn[k],a=i+j,b=a+h,xr=re[b]*wr-im[b]*wi,xi=re[b]*wi+im[b]*wr;re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;}}}}
  function bq(x,c,y){var b0=c[0],b1=c[1],b2=c[2],a1=c[3],a2=c[4],x1=0,x2=0,y1=0,y2=0,n=x.length;y=y||new Float32Array(n);for(var i=0;i<n;i++){var xi=x[i],v=b0*xi+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=xi;y2=y1;y1=v;y[i]=v;}return y;}
  function rbj(t,f,q,g,sr){var A=Math.pow(10,g/40),w=2*Math.PI*f/sr,cw=Math.cos(w),sw=Math.sin(w),al=sw/(2*q),sA=2*Math.sqrt(A)*al,b0,b1,b2,a0,a1,a2;
    if(t==='pk'){b0=1+al*A;b1=-2*cw;b2=1-al*A;a0=1+al/A;a1=-2*cw;a2=1-al/A;}
    else if(t==='ls'){b0=A*((A+1)-(A-1)*cw+sA);b1=2*A*((A-1)-(A+1)*cw);b2=A*((A+1)-(A-1)*cw-sA);a0=(A+1)+(A-1)*cw+sA;a1=-2*((A-1)+(A+1)*cw);a2=(A+1)+(A-1)*cw-sA;}
    else if(t==='hs'){b0=A*((A+1)+(A-1)*cw+sA);b1=-2*A*((A-1)+(A+1)*cw);b2=A*((A+1)+(A-1)*cw-sA);a0=(A+1)-(A-1)*cw+sA;a1=2*((A-1)-(A+1)*cw);a2=(A+1)-(A-1)*cw-sA;}
    else {b0=(1-cw)/2;b1=1-cw;b2=(1-cw)/2;a0=1+al;a1=-2*cw;a2=1-al;}
    return [b0/a0,b1/a0,b2/a0,a1/a0,a2/a0];}
  /* ITU-R BS.1770-4 K-weighting (same pre-filter + RLB constants as the app's loudness()) */
  function kco(sr){var f0=1681.974450955533,G0=3.999843853973347,Q=0.7071752369554196,K=Math.tan(Math.PI*f0/sr),Vh=Math.pow(10,G0/20),Vb=Math.pow(Vh,0.4996667741545416),a0=1+K/Q+K*K;
    var s1=[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0,2*(K*K-1)/a0,(1-K/Q+K*K)/a0];
    var f1=38.13547087602444,Q1=0.5003270373238773,K1=Math.tan(Math.PI*f1/sr),a1=1+K1/Q1+K1*K1;return [s1,[1,-2,1,2*(K1*K1-1)/a1,(1-K1/Q1+K1*K1)/a1]];}
  var KT=null;
  function segE(L,R,sr){var C=kco(sr),H=Math.round(0.1*sr),n=Math.floor(L.length/H),E=new Float64Array(n);if(!KT||KT.length!==L.length)KT=new Float32Array(L.length);var t=KT;
    [L,R].forEach(function(x){bq(x,C[0],t);bq(t,C[1],t);for(var j=0;j<n;j++){var s=0,o=j*H,e=o+H;for(var i=o;i<e;i++)s+=t[i]*t[i];E[j]+=s/H;}});return E;}
  function LU(e){return -0.691+10*Math.log10(e+1e-20);}
  function integ(E){var b=[],j;for(j=0;j+4<=E.length;j++)b.push((E[j]+E[j+1]+E[j+2]+E[j+3])/4);var g=b.filter(function(e){return LU(e)>-70;});if(!g.length)return -70;
    var m=0;g.forEach(function(e){m+=e;});m/=g.length;var th=LU(m)-10,s=0,c=0;g.forEach(function(e){if(LU(e)>th){s+=e;c++;}});return LU(s/Math.max(1,c));}
  function stCurve(E){var o=[],s=0;for(var j=0;j<E.length;j++){s+=E[j];if(j>=30)s-=E[j-30];if(j>=29)o.push(LU(Math.max(0,s)/30));}return o;}
  function lra(st){var g=st.filter(function(v){return v>-70;});if(g.length<2)return 0;var m=0;g.forEach(function(v){m+=Math.pow(10,(v+0.691)/10);});var th=LU(m/g.length)-20;
    g=g.filter(function(v){return v>th;}).sort(function(a,b){return a-b;});if(g.length<2)return 0;var q=function(p){return g[Math.min(g.length-1,Math.round(p*(g.length-1)))];};return q(0.95)-q(0.10);}
  /* 4x oversampled true peak: 24-tap Kaiser-windowed sinc per phase, evaluated wherever the signal is within 6 dB of its sample peak */
  var TPF=null;
  function tpTaps(){if(TPF)return TPF;TPF=[];var K=12,beta=7;function bes(x){var s=1,t=1;for(var k=1;k<30;k++){t*=(x/2)/k;s+=t*t;}return s;}var I0=bes(beta);
    for(var p=1;p<4;p++){var t=p/4,h=new Float64Array(2*K),sum=0,k;for(k=-K+1;k<=K;k++){var d=k-t,sc=Math.sin(Math.PI*d)/(Math.PI*d),r=d/(K+0.5),w=Math.abs(r)<1?bes(beta*Math.sqrt(1-r*r))/I0:0;h[k+K-1]=sc*w;sum+=sc*w;}for(k=0;k<2*K;k++)h[k]/=sum;TPF.push(h);}return TPF;}
  function tpeak(chs){var T=tpTaps(),K=12,pk=0;chs.forEach(function(x){var n=x.length,sp=0,i;for(i=0;i<n;i++){var a=x[i]<0?-x[i]:x[i];if(a>sp)sp=a;}if(sp>pk)pk=sp;var thr=sp*0.5;
      for(i=K;i<n-K-1;i++){var a0=x[i]<0?-x[i]:x[i],a1=x[i+1]<0?-x[i+1]:x[i+1];if(a0<thr&&a1<thr)continue;for(var p=0;p<3;p++){var h=T[p],s=0,o=i-K+1;for(var k=0;k<24;k++)s+=x[o+k]*h[k];if(s<0)s=-s;if(s>pk)pk=s;}}});return 20*Math.log10(pk+1e-12);}
  /* reference: pink-ish modern pop/rock long-term spectrum, level per octave (dB) at log2-spaced points */
  var REF=[[20,-9],[30,-3],[50,0],[100,0],[200,-2],[400,-5],[800,-8],[1600,-11],[3200,-14],[6400,-18],[12800,-24],[20000,-32]];
  function refDb(f){if(f<=REF[0][0])return REF[0][1];for(var i=1;i<REF.length;i++){if(f<=REF[i][0]){var a=REF[i-1],b=REF[i],u=Math.log(f/a[0])/Math.log(b[0]/a[0]);return a[1]+(b[1]-a[1])*u;}}return REF[REF.length-1][1];}
  var BANDS=[['sub',20,60],['bass',60,250],['lowmid',250,500],['mid',500,2000],['presence',2000,6000],['air',6000,20000]];
  var KMAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],KMIN=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  function pcorr(h,p,r){var mh=0,mp=0,i;for(i=0;i<12;i++){mh+=h[(i+r)%12];mp+=p[i];}mh/=12;mp/=12;var num=0,dh=0,dp=0;for(i=0;i<12;i++){var x=h[(i+r)%12]-mh,y=p[i]-mp;num+=x*y;dh+=x*x;dp+=y*y;}return num/Math.sqrt(dh*dp+1e-12);}
  function tempo(M,sr){
    /* rate-independent: 5 ms frames placed in seconds, fixed-Hz band filters (low <200 Hz, mid, high >2 kHz), log-energy flux per band = onset strength.
       Autocorrelation per lag, comb support at 2x and 1/2x, log-normal prior around 120 bpm (0.9 octave). A second number only for a near-equal half/double reading. */
    var s0=0,s1=M.length,lim=Math.round(sr*90);if(M.length>lim){s0=Math.floor((M.length-lim)/2);s1=s0+lim;}var fps=200,n=Math.floor((s1-s0)/sr*fps);if(n<400)return {bpm:0,alt:0};
    var aL=Math.exp(-2*Math.PI*200/sr),aH=Math.exp(-2*Math.PI*2000/sr),l1=0,h1=0,env=new Float32Array(n),pv=[0,0,0],i,j,c;
    for(i=0;i<n;i++){var o0=s0+Math.round(i*sr/fps),o1=s0+Math.round((i+1)*sr/fps),e=[0,0,0];for(j=o0;j<o1;j++){var x=M[j];l1=x+(l1-x)*aL;h1=x+(h1-x)*aH;var lo=l1,hi=x-h1,mi=h1-l1;e[0]+=lo*lo;e[1]+=mi*mi;e[2]+=hi*hi;}
      var v=0;for(c=0;c<3;c++){var le=Math.log(1e-10+e[c]/Math.max(1,o1-o0));if(i)v+=Math.max(0,le-pv[c]);pv[c]=le;}env[i]=v;}
    var m=0;for(i=0;i<n;i++)m+=env[i];m/=n;for(i=0;i<n;i++)env[i]=Math.max(0,env[i]-m);
    var R0={},raw=function(b){var key=Math.round(b*4);if(R0[key]!=null)return R0[key];var lag=60*fps/b,Lg=Math.floor(lag),f=lag-Lg,s=0;if(Lg+1>=n)return R0[key]=0;for(var k=0;k+Lg+1<n;k++)s+=env[k]*(env[k+Lg]*(1-f)+env[k+Lg+1]*f);return R0[key]=s/(n-Lg);};
    var sc=[];for(var b=50;b<=220;b+=0.5){var s=raw(b)+0.5*raw(2*b)+0.5*raw(b/2);sc.push([b,s*Math.exp(-0.5*Math.pow(Math.log2(b/120)/0.9,2))]);}
    var mean=0;sc.forEach(function(x){mean+=x[1];});mean/=sc.length;var pk=sc.filter(function(x,k){return (k===0||x[1]>=sc[k-1][1])&&(k===sc.length-1||x[1]>=sc[k+1][1]);}).sort(function(a,b){return b[1]-a[1];});
    if(!pk.length||pk[0][1]<mean*1.15)return {bpm:0,alt:0};var best=pk[0],alt=0;
    for(i=1;i<pk.length;i++){var q=pk[i][0]/best[0];if(pk[i][1]>best[1]*0.92&&(Math.abs(q/2-1)<0.03||Math.abs(q*2-1)<0.03)){alt=Math.round(pk[i][0]);break;}}
    return {bpm:Math.round(best[0]),alt:alt,conf:best[1]/mean};}
  function analyse(L,R,sr){
    var n=L.length,dur=n/sr,res={sr:sr,dur:dur},i,j,k;
    prog(0.03,'Measuring loudness');
    var E=segE(L,R,sr);res.lufs=integ(E);var st=stCurve(E);res.lra=lra(st);res.st=[];for(k=0;k<st.length;k+=5)res.st.push(Math.max(-60,st[k]));res.stHop=0.5;res.stOff=3;
    res.stMax=-70;st.forEach(function(v){if(v>res.stMax)res.stMax=v;});var mom=[];for(j=0;j+4<=E.length;j++)mom.push(LU((E[j]+E[j+1]+E[j+2]+E[j+3])/4));res.momMax=-70;mom.forEach(function(v){if(v>res.momMax)res.momMax=v;});
    prog(0.15,'Checking peaks (4x oversampled)');res.tp=tpeak([L,R]);var sp=0;for(i=0;i<n;i++){var a=Math.abs(L[i]),b=Math.abs(R[i]);if(a>sp)sp=a;if(b>sp)sp=b;}res.peak=20*Math.log10(sp+1e-12);
    var clip=0;for(i=1;i<n;i++){if((Math.abs(L[i])>0.9995&&Math.abs(L[i-1])>0.9995)||(Math.abs(R[i])>0.9995&&Math.abs(R[i-1])>0.9995))clip++;}res.clip=clip;
    prog(0.3,'Stereo image');
    var M=new Float32Array(n),S=new Float32Array(n),sLL=0,sRR=0,sLR=0,eM=0,eS=0,W=Math.round(sr),neg=0,win=0,wl=0,wr=0,wlr=0;
    for(i=0;i<n;i++){var l=L[i],r=R[i];sLL+=l*l;sRR+=r*r;sLR+=l*r;var mm=(l+r)*0.5,ss=(l-r)*0.5;M[i]=mm;S[i]=ss;eM+=mm*mm;eS+=ss*ss;wl+=l*l;wr+=r*r;wlr+=l*r;if((i+1)%W===0){if(wl>1e-6*W&&wr>1e-6*W){win++;if(wlr/Math.sqrt(wl*wr)<0)neg++;}wl=wr=wlr=0;}}
    res.corr=sLR/Math.sqrt(sLL*sRR+1e-20);res.widthDb=10*Math.log10((eS+1e-20)/(eM+1e-20));res.width=Math.sqrt((eS+1e-20)/(eM+1e-20));res.negFrac=win?neg/win:0;res.monoLoss=10*Math.log10((eM+1e-20)/((sLL+sRR)/2+1e-20));
    var lpc=rbj('lp',120,0.707,0,sr),Ml=bq(M,lpc),Sl=bq(S,lpc,S),eMl=0,eSl=0;for(i=0;i<n;i++){eMl+=Ml[i]*Ml[i];eSl+=Sl[i]*Sl[i];}res.lowSide=10*Math.log10((eSl+1e-20)/(eMl+1e-20));Ml=null;S=null;Sl=null;
    res.short=L.length/sr<30;prog(0.38,'Tempo');var T=tempo(M,sr);res.bpm=T.bpm;res.bpmAlt=T.alt;
    /* spectrum frames: two real frames per complex FFT (N=8192, 50% overlap) */
    var N=8192,HOP=4096,half=N/2,P=fftPlan(N),re=new Float64Array(N),im=new Float64Array(N),hw=new Float64Array(N),avg=new Float64Array(half),nf=Math.max(0,Math.floor((n-N)/HOP)+1);
    for(i=0;i<N;i++)hw[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
    var NM=24,pc=new Int8Array(half),mb=new Int8Array(half),pw=new Float32Array(half),smc=new Float32Array(128),smi=new Int16Array(half);for(k=0;k<half;k++){var fq=k*sr/N,sm=fq>0?Math.round(12*Math.log2(fq/440)+69):-1;smi[k]=sm;pc[k]=fq>=CLO&&fq<=2500?((sm%12)+12)%12:-1;if(pc[k]>=0)smc[sm]++;mb[k]=fq>=50&&fq<16000?Math.floor(NM*Math.log(fq/50)/Math.log(16000/50)):-1;}for(k=0;k<half;k++)pw[k]=pc[k]>=0?1/smc[smi[k]]:0;
    var CH=new Float32Array(nf*12),MEL=new Float32Array(nf*NM),FT=new Float32Array(nf);
    function acc(f,k,p){avg[k]+=p;var c=pc[k];if(c>=0)CH[f*12+c]+=CPW?Math.sqrt(p)*pw[k]:Math.sqrt(p);var b=mb[k];if(b>=0)MEL[f*NM+b]+=p;}
    for(var f=0;f<nf;f+=2){var oa=f*HOP,ob=(f+1)*HOP,two=f+1<nf;for(i=0;i<N;i++){re[i]=M[oa+i]*hw[i];im[i]=two?M[ob+i]*hw[i]:0;}fft(P,re,im);
      for(k=0;k<half;k++){var nk=k?N-k:0,ar=re[k]+re[nk],ai=im[k]-im[nk],br=im[k]+im[nk],bi=re[k]-re[nk];acc(f,k,(ar*ar+ai*ai)/4);if(two)acc(f+1,k,(br*br+bi*bi)/4);}
      FT[f]=(oa+N/2)/sr;if(two)FT[f+1]=(ob+N/2)/sr;if(f%240===0)prog(0.4+0.4*f/nf,'Listening to the music');}
    M=null;
    /* frequency balance vs reference */
    var bands=BANDS.map(function(B){var s=0,r=0;for(k=1;k<half;k++){var fq=k*sr/N;if(fq<B[1]||fq>=B[2])continue;s+=avg[k];r+=Math.pow(10,refDb(fq)/10)/(fq*Math.LN2);}return {id:B[0],lo:B[1],hi:B[2],db:10*Math.log10(s+1e-30),ref:10*Math.log10(r+1e-30)};});
    var dv=bands.map(function(b){return b.db-b.ref;}).sort(function(a,b){return a-b;}),med=(dv[2]+dv[3])/2;bands.forEach(function(b){b.dev=Math.round((b.db-b.ref-med)*10)/10;});res.bands=bands;
    prog(0.82,'Key and chords');
    var tot=new Float64Array(12);for(f=0;f<nf;f++)for(k=0;k<12;k++)tot[k]+=CH[f*12+k];var keys=[];for(var rt=0;rt<12;rt++){keys.push([rt,'maj',pcorr(tot,KMAJ,rt)]);keys.push([rt,'min',pcorr(tot,KMIN,rt)]);}
    keys.sort(function(a,b){return b[2]-a[2];});res.key=keys[0];res.key2=keys[1];
    /* bars */
    var t0=0;for(j=0;j<mom.length;j++){if(mom[j]>res.lufs-20){t0=j*0.1;break;}}var bar=res.bpm?240/res.bpm:2;while(bar<1.6)bar*=2;res.bar=bar;res.t0=t0;
    var nb=Math.max(0,Math.floor((dur-t0)/bar)),bars=[],feat=[];
    for(var bi2=0;bi2<nb;bi2++){var ta=t0+bi2*bar,tb=ta+bar,ch=new Float64Array(12),ml=new Float64Array(NM),cnt=0;for(f=0;f<nf;f++){if(FT[f]<ta||FT[f]>=tb)continue;cnt++;for(k=0;k<12;k++)ch[k]+=CH[f*12+k];for(k=0;k<NM;k++)ml[k]+=MEL[f*NM+k];}
      var e0=Math.floor(ta*10),e1=Math.min(E.length,Math.ceil(tb*10)),es=0;for(j=e0;j<e1;j++)es+=E[j];var lu=LU(es/Math.max(1,e1-e0));
      var mf=[];for(var c=1;c<=12;c++){var s=0;for(k=0;k<NM;k++)s+=Math.log10(ml[k]/Math.max(1,cnt)+1e-10)*Math.cos(Math.PI*c*(k+0.5)/NM);mf.push(s);}
      var cs=0;for(k=0;k<12;k++)cs+=ch[k];var chn=[];for(k=0;k<12;k++)chn.push(cs>0?ch[k]/cs:0);
      var bc='',bs=-1,ks=res.key[0],kmin=res.key[1]==='min',dia=kmin?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];for(var r0=0;r0<12;r0++){[[0,4,7,'maj'],[0,3,7,'min']].forEach(function(tp){var v=chn[(r0+tp[0])%12]+chn[(r0+tp[1])%12]+chn[(r0+tp[2])%12],inK=dia.indexOf(((r0-ks)%12+12)%12)>=0;if(inK)v+=0.03;if(v>bs){bs=v;bc=r0+(tp[3]==='min'?'m':'');}});}
      bars.push({t:Math.round(ta*100)/100,lu:Math.round(lu*10)/10,ch:bs>0.36?bc:''});feat.push({c:chn,m:mf,e:lu});}
    res.bars=bars;
    prog(0.9,'Finding the sections');
    var secs=[];if(nb>=4&&!res.short){
      var D=12+12+1,mean=new Float64Array(D),sd=new Float64Array(D),V=feat.map(function(x){var cn=0,q;for(q=0;q<12;q++)cn+=x.c[q]*x.c[q];cn=Math.sqrt(cn)||1;return x.c.map(function(v){return v/cn;}).concat(x.m).concat([x.e]);});
      for(k=12;k<D;k++){var s1=0,s2=0;V.forEach(function(v){s1+=v[k];s2+=v[k]*v[k];});mean[k]=s1/nb;sd[k]=Math.sqrt(Math.max(1e-9,s2/nb-mean[k]*mean[k]));}
      V=V.map(function(v){var o=v.slice(),q;for(q=0;q<12;q++)o[q]=v[q]/Math.sqrt(12)*2.2;for(q=12;q<24;q++)o[q]=(v[q]-mean[q])/sd[q]/Math.sqrt(12);o[24]=(v[24]-mean[24])/sd[24]*0.6;var nn=0;for(q=0;q<D;q++)nn+=o[q]*o[q];nn=Math.sqrt(nn)||1;for(q=0;q<D;q++)o[q]/=nn;return o;});
      var Sm=[];for(i=0;i<nb;i++){Sm.push(new Float32Array(nb));for(j=0;j<nb;j++){var dd=0;for(k=0;k<D;k++)dd+=V[i][k]*V[j][k];Sm[i][j]=dd;}}
      var Kk=nb>=24?4:2,nov=new Float64Array(nb);for(i=1;i<nb;i++){var sv=0;for(var aa=-Kk;aa<Kk;aa++)for(var b2=-Kk;b2<Kk;b2++){var x1=i+aa,x2=i+b2;if(x1<0||x2<0||x1>=nb||x2>=nb)continue;var g=Math.exp(-((aa+0.5)*(aa+0.5)+(b2+0.5)*(b2+0.5))/(Kk*Kk));sv+=((aa<0)===(b2<0)?1:-1)*g*Sm[x1][x2];}nov[i]=sv;}
      var nm=0,ns=0;for(i=1;i<nb;i++){nm+=nov[i];ns+=nov[i]*nov[i];}nm/=Math.max(1,nb-1);ns=Math.sqrt(Math.max(0,ns/Math.max(1,nb-1)-nm*nm));
      var cand=[];for(i=2;i<nb-1;i++){var ok=nov[i]>nm+0.35*ns;for(j=Math.max(1,i-3);j<=Math.min(nb-1,i+3);j++)if(nov[j]>nov[i])ok=false;if(ok)cand.push(i);}
      cand.sort(function(a,b){return nov[b]-nov[a];});var bnd=[];cand.forEach(function(c){if(bnd.length>=11)return;if(bnd.every(function(x){return Math.abs(x-c)>=4;})&&c>=2&&nb-c>=2)bnd.push(c);});bnd.sort(function(a,b){return a-b;});
      var edges=[0].concat(bnd).concat([nb]);for(i=0;i+1<edges.length;i++){var s0=edges[i],s1b=edges[i+1],cen=new Float64Array(D),es2=0;for(j=s0;j<s1b;j++){for(k=0;k<D;k++)cen[k]+=V[j][k];es2+=Math.pow(10,feat[j].e/10);}var cn2=0;for(k=0;k<D;k++)cn2+=cen[k]*cen[k];cn2=Math.sqrt(cn2)||1;for(k=0;k<D;k++)cen[k]/=cn2;
        secs.push({b0:s0,b1:s1b,t0:t0+s0*bar,t1:t0+s1b*bar,lu:Math.round(10*Math.log10(es2/(s1b-s0)+1e-20)*10)/10,cen:cen});}
      var sims=[];for(i=0;i<secs.length;i++)for(j=i+1;j<secs.length;j++){var d3=0;for(k=0;k<D;k++)d3+=secs[i].cen[k]*secs[j].cen[k];sims.push(d3);}sims.sort(function(a,b){return a-b;});
      var thr=sims.length?Math.max(0.55,sims[Math.floor(sims.length*0.6)]):1,protos=[];
      secs.forEach(function(s){var best=-1,bv=-2;protos.forEach(function(p,pi){var d4=0;for(k=0;k<D;k++)d4+=p[k]*s.cen[k];if(d4>bv){bv=d4;best=pi;}});if(bv>=thr)s.lab=best;else{s.lab=protos.length;protos.push(s.cen);}});
      var mg=[];secs.forEach(function(s){delete s.cen;var p=mg[mg.length-1];if(p&&p.lab===s.lab){p.b1=s.b1;p.t1=s.t1;}else mg.push(s);});var lmap={};mg.forEach(function(s){if(lmap[s.lab]==null)lmap[s.lab]=Object.keys(lmap).length;s.lab=lmap[s.lab];s.L='ABCDEFGHIJ'.charAt(Math.min(9,s.lab));var e=0;for(var q=s.b0;q<s.b1;q++)e+=Math.pow(10,bars[q].lu/10);s.lu=Math.round(10*Math.log10(e/(s.b1-s.b0)+1e-20)*10)/10;});secs=mg;
      /* sections shorter than 12 s join the neighbour closest in level, then equal neighbours merge and letters are reassigned */
      var mrg=true;while(mrg&&secs.length>1){mrg=false;for(i=0;i<secs.length;i++){var sx=secs[i];if(sx.t1-sx.t0>=12)continue;var pv=secs[i-1],nx=secs[i+1],tg=!pv?nx:!nx?pv:(Math.abs(pv.lu-sx.lu)<=Math.abs(nx.lu-sx.lu)?pv:nx);
        if(tg===pv){pv.b1=sx.b1;pv.t1=sx.t1;}else{nx.b0=sx.b0;nx.t0=sx.t0;}secs.splice(i,1);mrg=true;break;}}
      var mg2=[];secs.forEach(function(s){var p=mg2[mg2.length-1];if(p&&p.lab===s.lab){p.b1=s.b1;p.t1=s.t1;}else mg2.push(s);});var lm2={};
      mg2.forEach(function(s){if(lm2[s.lab]==null)lm2[s.lab]=Object.keys(lm2).length;s.lab=lm2[s.lab];s.L='ABCDEFGHIJ'.charAt(Math.min(9,s.lab));var e=0;for(var q=s.b0;q<s.b1;q++)e+=Math.pow(10,bars[q].lu/10);s.lu=Math.round(10*Math.log10(e/(s.b1-s.b0)+1e-20)*10)/10;});secs=mg2;
    } else if(nb>0)secs.push({b0:0,b1:nb,t0:t0,t1:t0+nb*bar,lu:res.lufs,lab:0,L:'A'});
    res.secs=secs;bars.forEach(function(b,bi3){secs.forEach(function(s){if(bi3>=s.b0&&bi3<s.b1)b.L=s.L;});});
    prog(1,'Writing the report');return res;}
  /* ---- auto-master ---- */
  var LB={};
  function limit(L,R,pre,ceil,sr,oL,oR){var n=L.length,LA=Math.max(1,Math.round(0.003*sr)),rel=1-Math.exp(-1/(0.08*sr));if(!LB.n||LB.n!==n){LB={n:n,q:new Float32Array(n),m:new Float32Array(n),dq:new Int32Array(n)};}
    var q=LB.q,m=LB.m,dq=LB.dq,i,h=0,t=0;for(i=0;i<n;i++){var a=Math.abs(L[i]),b=Math.abs(R[i]),p=(a>b?a:b)*pre;q[i]=p>ceil?ceil/p:1;}
    for(i=n-1;i>=0;i--){while(t>h&&q[dq[t-1]]>=q[i])t--;dq[t++]=i;while(dq[h]>i+LA)h++;m[i]=q[dq[h]];}
    var s=0,g=1,grs=0,grm=1;for(i=0;i<n;i++){s+=m[i];if(i>LA)s-=m[i-LA-1];var av=s/Math.min(i+1,LA+1);if(av<g)g=av;else g+=(av-g)*rel;if(g>av)g=av;oL[i]=L[i]*pre*g;oR[i]=R[i]*pre*g;grs+=g;if(g<grm)grm=g;}
    return {avg:-20*Math.log10(grs/n),max:-20*Math.log10(grm)};}
  function master(L,R,sr,o){var n=L.length,i;prog(0.05,'Shaping the tone');
    /* the A/B plays the loudest section: measure that same stretch (BS.1770 gated) before and after, so the level match is exact there */
    var abR=o.ab?[Math.max(0,Math.round(o.ab[0]*sr)),Math.min(n,Math.round(o.ab[1]*sr))]:null;if(abR&&abR[1]-abR[0]<sr)abR=null;var luA=abR?integ(segE(L.subarray(abR[0],abR[1]),R.subarray(abR[0],abR[1]),sr)):null;
    var F=[['ls',60,0.707,o.g[0]],['pk',130,0.9,o.g[1]],['pk',380,1.0,o.g[2]],['pk',1100,0.7,o.g[3]],['pk',3500,0.9,o.g[4]],['hs',9000,0.707,o.g[5]]];
    F.forEach(function(f){if(Math.abs(f[3])<0.05)return;var c=rbj(f[0],f[1],f[2],f[3],sr);bq(L,c,L);bq(R,c,R);});
    if(o.width){prog(0.15,'Widening');var lp=rbj('lp',300,0.707,0,sr),Sd=new Float32Array(n);for(i=0;i<n;i++)Sd[i]=(L[i]-R[i])*0.5;var Sl=bq(Sd,lp);for(i=0;i<n;i++){var add=(Sd[i]-Sl[i])*0.2;L[i]+=add;R[i]-=add;}}
    if(o.monoBass){var lp2=rbj('lp',110,0.707,0,sr),Sd2=new Float32Array(n);for(i=0;i<n;i++)Sd2[i]=(L[i]-R[i])*0.5;var Sl2=bq(Sd2,lp2);for(i=0;i<n;i++){L[i]-=Sl2[i];R[i]+=Sl2[i];}}
    prog(0.25,'Glue compression');var ms=0;for(i=0;i<n;i++)ms+=(L[i]*L[i]+R[i]*R[i])*0.5;var thr=10*Math.log10(ms/n+1e-20)+3,ratio=1.6,knee=6,ea=Math.exp(-1/(0.03*sr)),ga=1-Math.exp(-1/(0.015*sr)),gr2=1-Math.exp(-1/(0.25*sr)),env=ms/n,gdb=0,gsum=0;
    for(i=0;i<n;i++){var x=(L[i]*L[i]+R[i]*R[i])*0.5;env=ea*env+(1-ea)*x;var lv=10*Math.log10(env+1e-20),ov=lv-thr,tg=0;if(ov>knee/2)tg=ov*(1-1/ratio);else if(ov>-knee/2){var u=ov+knee/2;tg=(1-1/ratio)*u*u/(2*knee);}if(tg>4)tg=4;gdb+=(tg-gdb)*(tg>gdb?ga:gr2);var gg=Math.pow(10,-gdb/20);L[i]*=gg;R[i]*=gg;gsum+=gdb;}
    var glue=gsum/n,oL=new Float32Array(n),oR=new Float32Array(n),ceil=Math.pow(10,-1.4/20),tgt=o.target,lu0=integ(segE(L,R,sr)),best=null,tp=0,gr=null;
    for(var pass=0;pass<4;pass++){var pdb=tgt-lu0,pts=[];for(var it=0;it<8;it++){prog(0.3+0.6*(pass*8+it)/24,'Matching '+tgt+' LUFS');gr=limit(L,R,Math.pow(10,pdb/20),ceil,sr,oL,oR);var lu=integ(segE(oL,oR,sr));pts.push([pdb,lu]);if(Math.abs(lu-tgt)<0.08)break;
        if(pts.length>1){var a=pts[pts.length-2],b=pts[pts.length-1],sl=(b[1]-a[1])/((b[0]-a[0])||1e-6);sl=Math.max(0.15,Math.min(1.2,sl));pdb=b[0]+(tgt-b[1])/sl;}else pdb+=tgt-lu;pdb=Math.max(-30,Math.min(30,pdb));}
      tp=tpeak([oL,oR]);best={lu:pts[pts.length-1][1],pdb:pdb};if(tp<=-1.1)break;ceil*=Math.pow(10,-(tp+1.15)/20);}
    var st=stCurve(segE(oL,oR,sr));prog(1,'Done');return {L:oL,R:oR,lu:best.lu,tp:tp,lra:lra(st),gr:gr,glue:glue,pre:best.pdb,luA:luA,luB:abR?integ(segE(oL.subarray(abR[0],abR[1]),oR.subarray(abR[0],abR[1]),sr)):null};}
  var SRC=null;self.onmessage=function(e){var d=e.data;try{if(d.cmd==='load'){SRC={L:d.L,R:d.R,sr:d.sr};self.postMessage({t:'done',r:1});}else if(d.cmd==='analyse'){SRC={L:d.L,R:d.R,sr:d.sr};self.postMessage({t:'done',r:analyse(d.L,d.R,d.sr)});}else if(d.cmd==='master'){if(!SRC)throw new Error('no source');var r=master(new Float32Array(SRC.L),new Float32Array(SRC.R),SRC.sr,d.o);self.postMessage({t:'done',r:r},[r.L.buffer,r.R.buffer]);}}
    catch(err){self.postMessage({t:'err',msg:String((err&&err.message)||err)});}};
}
var DOC={view:false,w:null,res:null,L:null,R:null,sr:0,name:'',mast:null,ab:null,tgt:-14,width:false,match:true,side:'B',busy:false,rej:null};
function docCall(msg,tr,onP){return new Promise(function(res,rej){if(!DOC.w){var u=URL.createObjectURL(new Blob(['('+docWorker.toString()+')();'],{type:'application/javascript'}));DOC.w=new Worker(u);}
  var w=DOC.w;DOC.rej=rej;w.onmessage=function(e){var d=e.data;if(d.t==='prog'){if(onP)onP(d.f,d.msg);}else{DOC.rej=null;if(d.t==='err')rej(new Error(d.msg));else res(d.r);}};
  w.onerror=function(e){DOC.rej=null;rej(new Error(e.message||'worker error'));};w.postMessage(msg,tr||[]);});}
function docCancel(){if(DOC.w){DOC.w.terminate();DOC.w=null;}if(DOC.rej){var r=DOC.rej;DOC.rej=null;r(new Error('cancel'));}}
function docBusy(on,msg){DOC.busy=on;$('#docProg').hidden=!on;$('#docSrc').classList.toggle('dis',on);if(msg!=null)$('#docProgT').textContent=msg;if(!on)$('#docProgB').style.width='0%';}
function docP(f,m){$('#docProgB').style.width=Math.round(f*100)+'%';if(m)$('#docProgT').textContent=m+'… '+Math.round(f*100)+'%';}
function docT(t){t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function docCopy(L,R){return new Promise(function(ok){var n=L.length,a=new Float32Array(n),b=new Float32Array(n),i=0;(function step(){var e=Math.min(n,i+524288);a.set(L.subarray(i,e),i);b.set(R.subarray(i,e),i);i=e;if(i<n)setTimeout(step,0);else ok([a,b]);})();});}
function docStart(L,R,sr,name){docStop();if(DOC.w){DOC.w.terminate();DOC.w=null;}DOC.L=L;DOC.R=R;DOC.sr=sr;DOC.name=name;DOC.mast=null;DOC.bA=DOC.bB=null;var t0=performance.now();docBusy(true,'Preparing…');
  return docCopy(L,R).then(function(c){return docCall({cmd:'analyse',L:c[0],R:c[1],sr:sr},[c[0].buffer,c[1].buffer],docP);}).then(function(r){r.ms=Math.round(performance.now()-t0);r.name=name;DOC.res=r;docBusy(false);docRender();})
    .catch(function(e){docBusy(false);if(e.message!=='cancel'){console.error(e);toast('Song Doctor could not analyse this audio.');}else toast('Analysis cancelled.');});}
/* the file's own sample rate (WAV/FLAC/Ogg/MP3/M4A headers), so decoding, analysis and the mastered WAV stay at 44.1/48 kHz instead of the device rate; 0 = unknown */
function docSrcRate(ab){try{var b=new Uint8Array(ab),n=b.length,i,s=function(o,t){for(var k=0;k<t.length;k++)if(b[o+k]!==t.charCodeAt(k))return false;return true;},ok=function(r){return r>=8000&&r<=192000?r:0;},u32=function(o){return (b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0;};
  if(s(0,'RIFF')&&s(8,'WAVE')){for(i=12;i+8<n&&i<4e6;){var sz=u32(i+4);if(s(i,'fmt '))return ok(u32(i+12));i+=8+sz+(sz&1);}return 0;}
  if(s(0,'fLaC'))return ok(b[18]<<12|b[19]<<4|b[20]>>4);
  if(s(0,'OggS')){for(i=0;i<Math.min(n-16,8192);i++){if(s(i,'OpusHead'))return 48000;if(b[i]===1&&s(i+1,'vorbis'))return ok(u32(i+12));}return 0;}
  if(s(4,'ftyp')){for(i=0;i+40<n;i++)if(b[i]===109&&s(i,'mp4a'))return ok(b[i+28]<<8|b[i+29]);return 0;}
  var p=s(0,'ID3')?10+((b[6]&127)<<21|(b[7]&127)<<14|(b[8]&127)<<7|(b[9]&127))+(b[5]&16?10:0):0;
  for(i=p;i<Math.min(n-4,p+65536);i++){if(b[i]===255&&(b[i+1]&224)===224){var v=b[i+1]>>3&3,l=b[i+1]>>1&3,si=b[i+2]>>2&3,bi=b[i+2]>>4;if(v!==1&&l!==0&&si!==3&&bi!==0&&bi!==15){var base=[44100,48000,32000][si];return v===3?base:v===2?base/2:base/4;}}}}catch(e){}return 0;}
function docImport(file){if(!file||DOC.busy)return;docBusy(true,'Opening '+file.name+'…');DOC.t0=performance.now();
  var OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  file.arrayBuffer().then(function(ab){var sr0=docSrcRate(ab),oc=new OAC(2,1,sr0||(ctx?ctx.sampleRate:48000));DOC.srcSr=sr0;return new Promise(function(ok,no){oc.decodeAudioData(ab,ok,no);});}).then(function(buf){
    if(buf.duration<4){docBusy(false);toast('That file is very short: Song Doctor needs at least a few seconds of music.');return;}
    if(buf.duration>900){docBusy(false);toast('Songs up to 15 minutes, please.');return;}
    var L=buf.getChannelData(0),R=buf.numberOfChannels>1?buf.getChannelData(1):L;DOC.decMs=Math.round(performance.now()-DOC.t0);docBusy(false);return docStart(L,R,buf.sampleRate,file.name.replace(/\.[a-z0-9]+$/i,''));})
  .catch(function(e){console.error(e);docBusy(false);toast('This file could not be decoded here (try WAV, MP3, M4A or OGG).');});}
function docProject(){if(DOC.busy||!ensureAudio())return;if(seq.bounce||stemsRunning){toast('An export is already running.');return;}
  transportStop();seq.bounce=true;docBusy(true,calPending()?'Measuring compressors…':'Rendering your project…');var src=daw.clips.length?'arrange':'song';
  waitCal().then(function(){return renderOffline({mode:'mix',spatial:false,src:src,onProgress:function(f){docP(f*0.98,'Rendering your project');}});}).then(function(r){
    seq.bounce=false;var len=tailLength(r.buf,r.end),chs=cutBuffer(r.buf,len,false,r.js?Math.round(TRACKLAT*r.buf.sampleRate):masterLatency(r.buf.sampleRate));docBusy(false);
    if(peakDb(chs)<-60){toast('Your project is silent: play, record or add notes first.');return;}if(chs[0].length<r.buf.sampleRate*4){toast('Your project is shorter than 4 s: add patterns to the song or clips to the timeline first.');return;}
    return docStart(chs[0],chs[1],r.buf.sampleRate,project.name||'project');})
  .catch(function(e){console.error(e);toast('Rendering failed in this browser.');}).then(function(){seq.bounce=false;if(DOC.busy&&!DOC.rej)docBusy(false);});}
var BANDNM={sub:['Deep sub','20–60 Hz'],bass:['Bass','60–250 Hz'],lowmid:['Low mids','250–500 Hz'],mid:['Mids','500 Hz–2 kHz'],presence:['Presence','2–6 kHz'],air:['Air / highs','6–20 kHz']};
var BANDTIP={sub:['Too much deep rumble: high-pass everything except kick and bass at 30–40 Hz.','Little deep sub: for modern pop/hip-hop, boost the bass or kick a little around 50 Hz (check on headphones).'],
  bass:['The low end is heavy: cut 2–3 dB around 100–200 Hz on the bass or kick, or high-pass guitars, keys and pads at 100–150 Hz.','The low end is thin: turn the bass/kick up a little or boost 80–120 Hz.'],
  lowmid:['Muddy low mids: cut 2–3 dB around 300 Hz on guitars, keys and pads.','Hollow low mids: add a little warmth at 250–400 Hz on guitars or keys.'],
  mid:['Boxy, honky mids: cut the busiest instrument around 800 Hz–1 kHz.','Scooped mids: the vocal and leads may sound far away; boost 1–2 kHz on the lead.'],
  presence:['Harsh presence: tame 3–4 kHz on vocals or guitars, or use a de-esser.','Dull presence: vocals and guitars lack bite. Boost 2–4 kHz on the lead vocal, or cut what competes with it.'],
  air:['A bright, sizzly top: soften cymbals and hi-hats or de-ess the vocal.','Not much air: a +2 dB high shelf at 10 kHz on the vocal or the master opens it up.']};
var NOTEN=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
function docChord(c){if(!c)return '·';var m=/m$/.test(c),r=parseInt(c,10);return NOTEN[r]+(m?'m':'');}
function docNames(r){var S=r.secs,labs={};S.forEach(function(s){var o=labs[s.L]||(labs[s.L]={n:0,e:0,first:s});o.n++;o.e+=Math.pow(10,s.lu/10);});
  Object.keys(labs).forEach(function(k){labs[k].lu=10*Math.log10(labs[k].e/labs[k].n);});
  var rep=Object.keys(labs).filter(function(k){return labs[k].n>=2;}),ch=null,vs=null;rep.sort(function(a,b){return labs[b].lu-labs[a].lu;});
  if(rep.length)ch=rep[0];if(rep.length>1){vs=rep.slice(1).sort(function(a,b){return labs[a].first.t0-labs[b].first.t0;})[0];}
  S.forEach(function(s,i){var o=labs[s.L];s.name=s.L===ch?'chorus?':s.L===vs?'verse?':(i===0&&o.n===1&&s.lu<r.lufs-2)?'intro?':(i===S.length-1&&o.n===1&&s.lu<r.lufs-1.5)?'outro?':o.n===1&&i>0&&i<S.length-1?'bridge?':'';});
  r.chorus=ch?labs[ch].lu:null;r.verse=vs?labs[vs].lu:null;r.labs=labs;}
function docAdvice(r){var A=[],B=r.bars;if(r.short)A.push(['Short clip','Under 30 seconds, so there is no section or arrangement advice and the loudness reading is approximate (it needs about half a minute to settle). Import the whole song for the full check.','length '+dec(r.dur,0)+' s']);
  if(r.chorus!=null&&r.verse!=null){var d=r.chorus-r.verse;r.cvd=d;if(d<2)A.push(['Arrangement','Your chorus is only '+(d>=0?'+':'')+dec(d,1)+' dB louder than the verse. Thin the verses (drop a layer, the pad or half the drums for the first bars) so the chorus can lift.','chorus '+dec(r.chorus,1)+' vs verse '+dec(r.verse,1)+' LUFS (K-weighted, per section)']);}
  else if(r.secs.length<=1&&!r.short)A.push(['Arrangement','The song sounds like one long section. Change something every 8–16 bars: a new layer, a drum fill, a breakdown.','no clear section boundaries found']);
  var run=0,best=[0,0],i,j;for(i=0;i<B.length;i++){var lo=B[i].lu,hi=B[i].lu;for(j=i;j<B.length;j++){lo=Math.min(lo,B[j].lu);hi=Math.max(hi,B[j].lu);if(hi-lo>2)break;}if(j-i>best[1]-best[0])best=[i,j];}
  var fl=(best[1]-best[0])*r.bar;r.flat={t0:r.t0+best[0]*r.bar,t1:r.t0+best[1]*r.bar,s:fl};
  if(fl>=45)A.push(['Arrangement','No real change in energy for '+Math.round(fl)+' s ('+docT(r.flat.t0)+'–'+docT(r.flat.t1)+'). Add a breakdown, a drop or a new layer to keep the ear interested.','per-bar loudness stays within 2 dB for '+(best[1]-best[0])+' bars']);
  var s0=r.secs[0];if(s0&&s0.name==='intro?'&&s0.t1>25)A.push(['Arrangement','The intro takes '+docT(s0.t1)+' before the song really starts. Many listeners skip in the first 30 s: try a shorter intro.','intro '+dec(s0.t1-s0.t0,1)+' s']);
  r.bands.slice().filter(function(b){return Math.abs(b.dev)>=2.5;}).sort(function(a,b){return Math.abs(b.dev)-Math.abs(a.dev);}).slice(0,2).forEach(function(b){A.push(['Mix',BANDTIP[b.id][b.dev>0?0:1],BANDNM[b.id][0]+' '+BANDNM[b.id][1]+' '+(b.dev>0?'+':'')+dec(b.dev,1)+' dB vs reference']);});
  if(r.lowSide>-12)A.push(['Mix','Bass is spread wide in stereo. Keep everything below ~120 Hz in the centre (mono): it sounds tighter and survives phone speakers and clubs.','side/mid below 120 Hz '+dec(r.lowSide,1)+' dB']);
  if(r.corr<0.2||r.monoLoss<-2.5||r.negFrac>0.1)A.push(['Mix','Parts of the mix may disappear in mono (phone speakers, Bluetooth boxes). Check wide effects and stereo wideners; reduce them.','L/R correlation '+dec(r.corr,2)+', mono loss '+dec(r.monoLoss,1)+' dB, '+Math.round(r.negFrac*100)+'% of seconds out of phase']);
  else if(r.widthDb<-18)A.push(['Mix','The mix is almost mono. Pan some parts (guitars, keys, backing vocals) left and right for a wider picture.','side/mid '+dec(r.widthDb,1)+' dB']);
  if(r.lufs<-16)A.push(['Master','Quieter than streaming level ('+dec(r.lufs,1)+' vs −14 LUFS). Auto-master below brings it up safely.','integrated '+dec(r.lufs,1)+' LUFS']);
  else if(r.lufs>-8)A.push(['Master','Very loud ('+dec(r.lufs,1)+' LUFS): streaming apps will turn it down and the punch is squashed. A −11 or −14 master keeps the drums alive.','integrated '+dec(r.lufs,1)+' LUFS, PLR '+dec(r.tp-r.lufs,1)+' dB']);
  if(r.tp>-1)A.push(['Master','The peaks are too hot ('+dec(r.tp,1)+' dBTP): it may crackle after MP3/AAC conversion. Keep true peak at −1 dBTP (Auto-master does).','true peak '+dec(r.tp,1)+' dBTP'+(r.clip?', '+r.clip+' clipped samples':'')]);
  return A.slice(0,6);}
function docCol(L){var v=['--f-keys','--f-gtr','--f-bass','--f-drums','--f-vox','--f-smp','--fn-t','--fn-s'],cs=getComputedStyle(document.body);return (cs.getPropertyValue(v[Math.max(0,'ABCDEFGHIJ'.indexOf(L))%v.length])||'#5CE1E6').trim();}
function docCanvas(cv,h){var dpr=window.devicePixelRatio||1,w=cv.clientWidth||340;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);return {g:g,w:w,h:h};}
function docDrawArc(){var r=DOC.res,cv=$('#docArc');if(!cv||!r)return;var C=docCanvas(cv,170),g=C.g,w=C.w,h=C.h,cs=getComputedStyle(document.body),tx=cs.getPropertyValue('--tx2').trim(),ln=cs.getPropertyValue('--line').trim(),sg=cs.getPropertyValue('--signal').trim();
  var top=-70,bot=0;r.bars.forEach(function(b){top=Math.max(top,b.lu);bot=Math.min(bot,b.lu);});top=Math.ceil(Math.max(top,r.stMax)+1.5);bot=Math.max(bot,r.lufs-24);bot=Math.floor(Math.min(bot-3,top-12));var y=function(v){return 14+(h-34)*(top-Math.max(bot,Math.min(top,v)))/(top-bot);},x=function(t){return w*t/r.dur;};
  r.bars.forEach(function(b){g.fillStyle=docCol(b.L);g.globalAlpha=0.75;var x0=x(b.t),x1=x(b.t+r.bar);g.fillRect(x0+0.5,y(b.lu),Math.max(1,x1-x0-1),h-20-y(b.lu));});g.globalAlpha=1;
  g.font='11px system-ui';g.fillStyle=tx;g.strokeStyle=ln;g.lineWidth=1;[r.lufs].concat([-6,-12,-18,-24,-30,-36].filter(function(v){return v>bot&&v<top;})).forEach(function(v,k){g.globalAlpha=k?0.5:0.9;g.setLineDash(k?[]:[4,3]);g.beginPath();g.moveTo(0,y(v));g.lineTo(w,y(v));g.stroke();g.fillText(k?v+'':'avg '+dec(v,1),w-(k?22:54),y(v)-3);});g.setLineDash([]);g.globalAlpha=1;
  g.strokeStyle=sg;g.lineWidth=1.6;g.beginPath();r.st.forEach(function(v,k){var t=r.stOff+k*r.stHop-1.5,X=x(t),Y=y(v);if(k)g.lineTo(X,Y);else g.moveTo(X,Y);});g.stroke();
  g.fillStyle=tx;var lx=-99;r.secs.forEach(function(s){var X=x(s.t0);g.fillRect(X,h-18,1,6);if(X-lx>=13){g.fillText(s.L,X+3,h-6);lx=X;}});}
function docDrawBal(){var r=DOC.res,cv=$('#docBal');if(!cv||!r)return;var C=docCanvas(cv,150),g=C.g,w=C.w,h=C.h,cs=getComputedStyle(document.body),tx=cs.getPropertyValue('--tx2').trim(),ln=cs.getPropertyValue('--line').trim(),ok=cs.getPropertyValue('--ok').trim(),wn=cs.getPropertyValue('--warn').trim(),rc=cs.getPropertyValue('--rec').trim();
  var bw=w/6,mid=(h-22)/2+4,sc=(h-30)/2/8;g.strokeStyle=ln;g.beginPath();g.moveTo(0,mid);g.lineTo(w,mid);g.stroke();g.font='11px system-ui';g.textAlign='center';
  r.bands.forEach(function(b,i){var d=Math.max(-8,Math.min(8,b.dev)),a=Math.abs(b.dev);g.fillStyle=a<1.5?ok:a<3?wn:rc;var X=i*bw+bw*0.2,H=d*sc;g.fillRect(X,H>0?mid-H:mid,bw*0.6,Math.max(2,Math.abs(H)));
    g.fillStyle=tx;g.fillText((b.dev>0?'+':'')+dec(b.dev,1),i*bw+bw/2,H>0?mid-H-4:mid-H+12);g.fillText(BANDNM[b.id][0].split(' ')[0],i*bw+bw/2,h-4);});g.textAlign='left';}
function docWord(r){var l=r.lufs;return l<-18?'quiet':l<-15?'a bit quiet for streaming':l<-12.5?'streaming-ready':l<-9?'loud':'very loud';}
function docRender(){var r=DOC.res,o=$('#docOut');if(!r){o.innerHTML='';return;}docNames(r);var adv=docAdvice(r);r.advice=adv;
  var kn=NOTEN[r.key[0]]+(r.key[1]==='min'?' minor':' major'),kconf=r.key[2]-r.key2[2]<0.03?' (or '+NOTEN[r.key2[0]]+(r.key2[1]==='min'?' minor':' major')+')':'';
  var chords=[],cnt={};r.bars.forEach(function(b){if(b.ch){cnt[b.ch]=(cnt[b.ch]||0)+1;}});var top=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a];}).slice(0,4);
  var prog8=[];r.bars.slice(0,24).forEach(function(b){if(!b.ch)return;var c=docChord(b.ch);if(prog8[prog8.length-1]!==c)prog8.push(c);});
  var wd=r.widthDb<-18?'narrow':r.widthDb<-9?'natural':r.widthDb<-4?'wide':'very wide',tile=function(k,v,s){return '<div class="dtile"><span class="mu">'+k+'</span><b>'+v+'</b><small>'+s+'</small></div>';};
  var tempo=r.bpm?'about '+r.bpm+' bpm'+(r.bpmAlt?' (could also be counted at '+r.bpmAlt+')':''):'tempo unclear';
  var h=(r.short?'<div class="card"><p class="note">Short clip ('+dec(r.dur,0)+' s): no section analysis, and loudness is approximate.</p></div>':'')+'<div class="card"><div class="row"><span class="kicker">Report · '+docEsc(r.name)+'</span><span class="mu">'+docT(r.dur)+'</span></div>'+
    '<div class="dtiles">'+tile('Loudness',dec(r.lufs,1)+' LUFS',docWord(r))+tile('Peaks',dec(r.tp,1)+' dBTP',r.tp>-1?'too hot':'safe')+tile('Stereo',wd,'correlation '+dec(r.corr,2))+tile('Key · tempo',kn,tempo)+'</div>'+
    '<p class="mu" style="margin:0">Analysed on this device in '+dec((r.ms+(DOC.decMs||0))/1000,1)+' s.</p></div>';
  h+='<div class="card"><span class="kicker">What to fix first</span>'+(adv.length?'<ol class="dadv">'+adv.map(function(a){return '<li><span class="dtag dt-'+a[0].toLowerCase()+'">'+a[0]+'</span> '+docEsc(a[1])+'<details class="dpro"><summary>Pro numbers</summary>'+docEsc(a[2])+'</details></li>';}).join('')+'</ol>':'<p class="note">Nothing major: this already sounds balanced and well levelled. Trust your ears for the rest.</p>')+'</div>';
  h+='<div class="card"><span class="kicker">Song shape · energy per bar</span><canvas id="docArc" class="dcv" aria-label="Energy per bar, coloured by section, with the short-term loudness line"></canvas>'+
    '<div class="dsecs">'+r.secs.map(function(s){return '<span class="dsec" style="border-color:'+docCol(s.L)+'"><b>'+s.L+'</b> '+docT(s.t0)+(s.name?' · '+s.name:'')+'</span>';}).join('')+'</div>'+
    '<p class="note">Same letter = similar music. Names with “?” are only guesses.'+(r.cvd!=null?' Chorus vs verse: '+(r.cvd>=0?'+':'')+dec(r.cvd,1)+' dB.':'')+(r.flat&&r.flat.s>=30?' Longest stretch without a change in energy: '+Math.round(r.flat.s)+' s.':'')+'</p>'+
    '<details class="dpro"><summary>Pro numbers</summary>'+r.secs.map(function(s){return s.L+' '+docT(s.t0)+'–'+docT(s.t1)+' '+dec(s.lu,1)+' LUFS ('+(s.b1-s.b0)+' bars)';}).join('<br>')+'<br>Bar grid '+dec(r.bar,2)+' s from '+dec(r.t0,1)+' s.</details></div>';
  h+='<div class="card"><span class="kicker">Tone balance vs a modern pop/rock reference</span><canvas id="docBal" class="dcv" aria-label="Deviation per frequency band from the reference curve"></canvas>'+
    '<p class="note">Bars above the line: more than the reference. Green is close, amber noticeable, red strong.</p><details class="dpro"><summary>Pro numbers</summary>'+r.bands.map(function(b){return BANDNM[b.id][0]+' '+BANDNM[b.id][1]+': '+(b.dev>0?'+':'')+dec(b.dev,1)+' dB';}).join('<br>')+'<br>Reference: pink-ish long-term spectrum, deviations relative to the median band.</details></div>';
  var wpct=Math.round(Math.min(100,r.width*100));
  h+='<div class="card"><span class="kicker">Stereo</span><div class="dmeter"><span>Width</span><i><em style="width:'+wpct+'%"></em></i><b>'+wd+'</b></div><div class="dmeter"><span>Mono-safe</span><i><em style="width:'+Math.round(Math.max(0,r.corr)*100)+'%"></em></i><b>'+(r.corr<0.2?'risky':r.corr<0.5?'ok':'good')+'</b></div>'+
    (r.lowSide>-12?'<p class="note dwarn">Bass is wide in the sides: keep below 120 Hz in mono.</p>':'')+(r.corr<0.2||r.negFrac>0.1?'<p class="note dwarn">Mono warning: parts may cancel on a phone speaker.</p>':'')+
    '<details class="dpro"><summary>Pro numbers</summary>L/R correlation '+dec(r.corr,2)+' · side/mid '+dec(r.widthDb,1)+' dB · side/mid &lt;120 Hz '+dec(r.lowSide,1)+' dB · mono fold-down '+dec(r.monoLoss,1)+' dB · out-of-phase seconds '+Math.round(r.negFrac*100)+'%</details></div>';
  h+='<div class="card"><span class="kicker">Loudness</span><p class="note">Streaming apps play songs at about −14 LUFS. Yours is '+dec(r.lufs,1)+' LUFS: '+docWord(r)+'. Dynamic range (LRA) '+dec(r.lra,1)+' LU: '+(r.lra<4?'the whole song sits at one level.':r.lra<9?'normal for pop/rock.':'big changes between loud and quiet parts.')+'</p>'+
    '<details class="dpro"><summary>Pro numbers</summary>Integrated '+dec(r.lufs,1)+' LUFS (BS.1770-4, gated) · true peak '+dec(r.tp,1)+' dBTP (4x) · sample peak '+dec(r.peak,1)+' dBFS · LRA '+dec(r.lra,1)+' LU · max short-term '+dec(r.stMax,1)+' · max momentary '+dec(r.momMax,1)+' · PLR '+dec(r.tp-r.lufs,1)+' dB'+(r.clip?' · '+r.clip+' clipped samples':'')+'</details></div>';
  h+='<div class="card"><span class="kicker">Key, tempo, chords (approximate)</span><p class="note">Key: <b>'+kn+'</b>'+kconf+' · Tempo: <b>'+tempo+'</b></p><p class="note">Opening chords: '+prog8.slice(0,8).join(' → ')+'<br>Most used: '+(top.map(docChord).join(', ')||'unclear')+'</p></div>';
  h+='<div class="card" id="docMaster"><span class="kicker">Auto-master</span><p class="note">Gentle tone shaping toward the reference (max ±3 dB), glue compression and a true-peak limiter at −1 dBTP. The A/B is loudness-matched, so you judge the tone, not the volume.</p>'+
    '<div class="seg" id="docTgt" role="group" aria-label="Loudness target">'+[[-14,'−14 Streaming'],[-11,'−11 Loud'],[-9,'−9 Very loud']].map(function(t){return '<button data-tg="'+t[0]+'" aria-pressed="'+(DOC.tgt===t[0])+'">'+t[1]+'</button>';}).join('')+'</div>'+
    '<label class="chk"><span>Wider stereo (+20% sides above 300 Hz)</span><input type="checkbox" id="docWide"'+(DOC.width?' checked':'')+'></label>'+
    '<button class="btn primary" id="docMas">Master it</button><div id="docAB"></div></div>';
  o.innerHTML=h;docDrawArc();docDrawBal();
  $$('#docTgt button').forEach(function(b){b.addEventListener('click',function(){DOC.tgt=+b.getAttribute('data-tg');$$('#docTgt button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
  $('#docWide').addEventListener('change',function(e){DOC.width=e.target.checked;});$('#docMas').addEventListener('click',docMaster);if(DOC.mast)docABui();}
function docEsc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function docMaster(){var r=DOC.res;if(!r||DOC.busy)return;docStop();var g=r.bands.map(function(b){return Math.round(clamp(-b.dev*0.6,-3,b.id==='sub'||b.id==='lowmid'?1.5:3)*10)/10;}),btn=$('#docMas'),t0=performance.now();
  var o={target:DOC.tgt,width:DOC.width,monoBass:r.lowSide>-12,g:g},ldS=r.secs.slice().sort(function(x,y){return y.lu-x.lu;})[0];if(ldS)o.ab=[ldS.t0,ldS.t1];docBusy(true,'Mastering…');btn.disabled=true;
  (DOC.w?Promise.resolve():docCopy(DOC.L,DOC.R).then(function(c){return docCall({cmd:'load',L:c[0],R:c[1],sr:DOC.sr},[c[0].buffer,c[1].buffer]);})).then(function(){return docCall({cmd:'master',o:o},[],function(f,m){docP(f,m);btn.textContent=m+'… '+Math.round(f*100)+'%';});}).then(function(m){m.o=o;m.ms=Math.round(performance.now()-t0);DOC.mast=m;DOC.bB=null;docABui();})
  .catch(function(e){if(e.message!=='cancel'){console.error(e);toast('Mastering failed.');}}).then(function(){docBusy(false);btn.disabled=false;btn.textContent='Master again';});}
function docABui(){var m=DOC.mast,el=$('#docAB');if(!m||!el)return;var g=m.o.g,nm=['sub','bass','low mids','mids','presence','air'],eq=g.map(function(v,i){return Math.abs(v)>=0.3?nm[i]+' '+(v>0?'+':'')+dec(v,1):'';}).filter(Boolean).join(', ')||'none needed';
  el.innerHTML='<p class="note dok">Mastered: <b>'+dec(m.lu,1)+' LUFS</b> · true peak <b>'+dec(m.tp,1)+' dBTP</b> · LRA '+dec(m.lra,1)+' LU</p>'+
    '<details class="dpro"><summary>Pro numbers</summary>EQ: '+eq+' dB · glue −'+dec(m.glue,1)+' dB avg · limiter −'+dec(m.gr.avg,1)+' dB avg / −'+dec(m.gr.max,1)+' max · gain '+(m.pre>0?'+':'')+dec(m.pre,1)+' dB'+(m.o.monoBass?' · bass below 110 Hz made mono':'')+(m.o.width?' · sides +20%':'')+' · '+dec(m.ms/1000,1)+' s</details>'+
    '<div class="row" style="gap:8px"><button class="btn" id="docPlay" style="flex:1">'+(DOC.ab?'■ Stop':'▶ Play the loudest part')+'</button></div>'+
    '<div class="seg" id="docSide" role="group" aria-label="A/B"><button data-ab="A" aria-pressed="'+(DOC.side==='A')+'">A · Original</button><button data-ab="B" aria-pressed="'+(DOC.side==='B')+'">B · Mastered</button></div>'+
    '<label class="chk"><span>Loudness-matched (hear tone, not volume)</span><input type="checkbox" id="docMatch"'+(DOC.match?' checked':'')+'></label>'+
    '<button class="btn primary" id="docExp">Export mastered WAV (24-bit)</button>';
  $('#docPlay').addEventListener('click',docPlay);$$('#docSide button').forEach(function(b){b.addEventListener('click',function(){DOC.side=b.getAttribute('data-ab');$$('#docSide button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});docGain();});});
  $('#docMatch').addEventListener('change',function(e){DOC.match=e.target.checked;docGain();});
  $('#docExp').addEventListener('click',function(){saveWav(encodeWav([DOC.mast.L,DOC.mast.R],DOC.sr),'ecou-'+safeName(DOC.name)+'-master'+Math.abs(DOC.mast.o.target));});}
function docGain(){var a=DOC.ab;if(!a)return;var M_=DOC.mast,lo=M_.luA!=null?M_.luA:DOC.res.lufs,lm=M_.luB!=null?M_.luB:M_.lu,gA=1,gB=1;if(DOC.match){gA=Math.min(1,dbg(lm-lo));gB=Math.min(1,dbg(lo-lm));}var t=ctx.currentTime;
  a.gA.gain.setTargetAtTime(DOC.side==='A'?gA:0,t,0.015);a.gB.gain.setTargetAtTime(DOC.side==='B'?gB:0,t,0.015);}
function docPlay(){if(DOC.ab){docStop();return;}if(!DOC.mast||!ensureAudio())return;transportStop();var c=ctx,mk=function(L,R){var b=c.createBuffer(2,L.length,DOC.sr);b.copyToChannel(L,0);b.copyToChannel(R,1);return b;};
  DOC.bA=DOC.bA||mk(DOC.L,DOC.R);DOC.bB=DOC.bB||mk(DOC.mast.L,DOC.mast.R);var r=DOC.res,ld=r.secs.slice().sort(function(x,y){return y.lu-x.lu;})[0],from=ld?ld.t0:0;
  var sA=c.createBufferSource(),sB=c.createBufferSource(),gA=c.createGain(),gB=c.createGain();gA.gain.value=0;gB.gain.value=0;sA.buffer=DOC.bA;sB.buffer=DOC.bB;sA.connect(gA);sB.connect(gB);gA.connect(c.destination);gB.connect(c.destination);
  var t=c.currentTime+0.05;sA.start(t,from);sB.start(t,from);DOC.ab={sA:sA,sB:sB,gA:gA,gB:gB};sA.onended=function(){if(DOC.ab&&DOC.ab.sA===sA)docStop();};docGain();var p=$('#docPlay');if(p)p.textContent='■ Stop';}
function docStop(){var a=DOC.ab;DOC.ab=null;if(a){try{a.sA.stop();a.sB.stop();}catch(e){}try{a.gA.disconnect();a.gB.disconnect();}catch(e){}}var p=$('#docPlay');if(p)p.textContent='▶ Play the loudest part';}
function docShow(on){DOC.view=!!on;document.body.classList.toggle('doc-on',DOC.view);if(!on)docStop();if(on&&DOC.res)setTimeout(function(){docDrawArc();docDrawBal();},30);}
function initDoctor(){$('#docFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';docImport(f);});
  $('#docProj').addEventListener('click',docProject);$('#docCancel').addEventListener('click',function(){docCancel();docBusy(false);if(seq.bounce&&!stemsRunning){}});
  $('#docOpen').addEventListener('click',function(){subGo('doctor');});var tk=$('#takeDoc');if(tk)tk.addEventListener('click',function(){if(!lastTake)return;var bytes=lastTake.bytes,nm=lastTake.name;closeOverlay('take');subGo('doctor');docImport(new File([bytes],nm+'.wav',{type:'audio/wav'}));});
  window.addEventListener('resize',function(){if(DOC.view&&DOC.res){docDrawArc();docDrawBal();}});}
initDoctor();try{initMix();}catch(e){errLog.push('mix: '+e.message);}

/* ---------- UNDO / REDO ---------- */
