var VTSTY={natural:{n:'Natural',amt:100,mor:25,dz:8,ctr:1,tw:1.2,uf:0.3,ns:1},pop:{n:'Pop',amt:100,mor:62,dz:6,ctr:1,tw:1.2,uf:0.3},hard:{n:'Hard-tune',amt:100,mor:100,dz:0,ctr:0}};
/* one Natural↔Hard morph drives retune speed and humanize (the two things that make tuning audible) */
function vtMorph(v,m){v.mor=m;var x=m/100;v.spd=Math.round(160*(1-x)*(1-x)/5)*5;v.hum=Math.round(100*(1-x));}
(function(){for(var k in VTSTY){var o={};vtMorph(o,VTSTY[k].mor);VTSTY[k].spd=o.spd;VTSTY[k].hum=o.hum;}})();
var VTQ={maj:[0,4,7],min:[0,3,7],dim:[0,3,6],aug:[0,4,8],sus2:[0,2,7],sus4:[0,5,7]};
var VT={c:null,slot:null,A:null,N:null,sel:-1,t:null,au:null,drag:null,cache:typeof WeakMap!=='undefined'?new WeakMap():null};
function vtDef(st){var p=VTSTY[st||'pop'];return {on:true,st:st||'pop',amt:p.amt,mor:p.mor,spd:p.spd,hum:p.hum,sc:'song',k:null,band:false,ed:{},fmt:0,thr:0,vib:0,vibR:5.5,sp:[],mg:[]};}
function vtMono(b){var n=b.length,C=b.numberOfChannels,x=new Float32Array(n);for(var c=0;c<C;c++){var d=b.getChannelData(c);for(var i=0;i<n;i++)x[i]+=d[i]/C;}return x;}
/* pitch tracker (5 ms hop, 75–1050 Hz): YIN difference function at ~8 kHz, up to 4 candidate lags per frame (the earliest clear dips + the deepest; lags longer than the first dip that is about as deep as the best one pay a sub-harmonic penalty),
   then one Viterbi path through candidates + an "unvoiced" state: continuity cost per semitone, octave jumps expensive, voicing decided by
   aperiodicity + energy with hysteresis. Full-rate refinement of the chosen lag, 5-frame median, short holes bridged, blips dropped. */
function vtAnalyse(b){
  if(VT.cache&&VT.cache.has(b))return VT.cache.get(b);
  var x=vtMono(b),sr=b.sampleRate,D=Math.max(1,Math.round(sr/8000)),sd=sr/D,n=Math.floor(x.length/D),y=new Float32Array(n),i,k,t,c,j,o;
  var a1=Math.exp(-2*Math.PI*2000/sr),s1=0,s2=0;for(i=0;i<x.length;i++){s1=x[i]+(s1-x[i])*a1;s2=s1+(s2-s1)*a1;if(i%D===0&&i/D<n)y[i/D]=s2;}
  var hop=Math.round(sr*0.005),W=Math.round(sd*0.025),maxL=Math.ceil(sd/75),minL=Math.max(3,Math.floor(sd/1050)),F=Math.ceil(x.length/hop),NC=4,S=NC+1,
      rms=new Float32Array(F),d=new Float32Array(maxL+3),cl=new Float32Array(F*NC),cd=new Float32Array(F*NC),lg=new Float32Array(F*NC),tl=new Float32Array(24),td=new Float32Array(24),pk=0;
  for(k=0;k<F;k++){var c0=k*hop,e=0,j0=Math.max(0,c0-hop),j1=Math.min(x.length,c0+hop);for(i=j0;i<j1;i++)e+=x[i]*x[i];rms[k]=Math.sqrt(e/Math.max(1,j1-j0));if(rms[k]>pk)pk=rms[k];}
  var gate=Math.max(0.002,pk*0.03);
  for(k=0;k<F;k++){if(rms[k]<gate)continue;var st=Math.max(0,Math.min(n-W-maxL-3,Math.round(k*hop/D-(W+maxL)/2)));if(st<0)continue;
    var cum=0,nc=0;d[0]=1;o=k*NC;
    var e0=0,et=0;for(i=0;i<W;i++){e0+=y[st+i]*y[st+i];et+=y[st+i+1]*y[st+i+1];}
    for(t=1;t<=maxL+1;t++){var r=0,yb=st+t;for(i=0;i<W;i++)r+=y[st+i]*y[yb+i];var s=Math.max(0,e0+et-2*r);et+=y[yb+W]*y[yb+W]-y[yb]*y[yb];cum+=s;d[t]=cum>0?s*t/cum:1;}
    var nd=0;
    for(t=minL;t<=maxL&&nd<24;t++){if(!(d[t]<0.6&&d[t]<d[t-1]&&d[t]<=d[t+1]))continue;
      var den=d[t-1]-2*d[t]+d[t+1],off=den>0?0.5*(d[t-1]-d[t+1])/den:0;tl[nd]=t+off;td[nd++]=Math.max(0,d[t]-0.25*(d[t-1]-d[t+1])*off);}
    for(j=0;j<nd&&nc<3;j++)if(td[j]<0.3){cl[o+nc]=tl[j];cd[o+nc]=td[j];td[j]=9;nc++;}
    while(nc<NC){var bj=-1,bd=0.6;for(j=0;j<nd;j++)if(td[j]<bd){bd=td[j];bj=j;}if(bj<0)break;cl[o+nc]=tl[bj];cd[o+nc]=bd;td[bj]=9;nc++;}
    for(c=0;c<nc;c++)lg[o+c]=Math.log2(cl[o+c]);}
  var UV=0.35,TV=0.15,cost=new Float64Array(S),nx=new Float64Array(S),bp=new Uint8Array(F*S),lag=new Float32Array(F),f0=new Float32Array(F);
  for(c=0;c<NC;c++)cost[c]=1e12;
  for(k=0;k<F;k++){o=k*NC;var po=o-NC,lmin=99,db=9;for(c=0;c<NC;c++)if(cl[o+c]>0&&cd[o+c]<db)db=cd[o+c];for(c=0;c<NC;c++)if(cl[o+c]>0&&cd[o+c]<db+0.04&&lg[o+c]<lmin)lmin=lg[o+c];
    for(c=0;c<NC;c++){if(!(cl[o+c]>0)){nx[c]=1e12;continue;}var best=cost[NC]+TV,bi=NC;
      if(k>0)for(j=0;j<NC;j++){if(cost[j]>=1e12)continue;var tc=cost[j]+Math.min(0.6,0.96*Math.abs(lg[o+c]-lg[po+j]));if(tc<best){best=tc;bi=j;}}
      nx[c]=best+cd[o+c]+0.15*Math.max(0,lg[o+c]-lmin);bp[k*S+c]=bi;}
    var bu=cost[NC],bui=NC;for(j=0;j<NC;j++)if(cost[j]+TV<bu){bu=cost[j]+TV;bui=j;}
    nx[NC]=bu+(rms[k]<gate?0:UV);bp[k*S+NC]=bui;for(c=0;c<S;c++)cost[c]=nx[c];}
  var stt=NC,bc=cost[NC];for(c=0;c<NC;c++)if(cost[c]<bc){bc=cost[c];stt=c;}
  for(k=F-1;k>=0;k--){if(stt<NC)lag[k]=cl[k*NC+stt];stt=bp[k*S+stt];}
  for(k=0;k<F;k++){var ft=lag[k];if(!(ft>0))continue;
    var L0=Math.round(ft*D),Wf=Math.min(W*D,Math.max(3*L0,256)),cs=Math.round(k*hop-(Wf+L0)/2),bst=-1,bv=1e30,dv2=[];
    if(D<2||cs<0||cs+Wf+L0+D+2>=x.length){f0[k]=sd/ft;continue;}
    for(var L=L0-D-1;L<=L0+D+1;L++){var s3=0;for(i=0;i<Wf;i++){var q2=x[cs+i]-x[cs+i+L];s3+=q2*q2;}dv2.push(s3);if(s3<bv){bv=s3;bst=dv2.length-1;}}
    var P=L0-D-1+bst;if(bst>0&&bst<dv2.length-1){var dn=dv2[bst-1]-2*dv2[bst]+dv2[bst+1];if(dn>0)P+=0.5*(dv2[bst-1]-dv2[bst+1])/dn;}
    f0[k]=sr/P;}
  var m=new Float32Array(F),m2=new Float32Array(F),num=function(p,q){return p-q;};for(k=0;k<F;k++)m2[k]=f0[k]>0?ftom(f0[k]):NaN;
  for(k=0;k<F;k++){if(isNaN(m2[k])){m[k]=NaN;continue;}var w=[];for(i=Math.max(0,k-2);i<=Math.min(F-1,k+2);i++)if(!isNaN(m2[i]))w.push(m2[i]);w.sort(num);m[k]=w.length>=3?w[w.length>>1]:m2[k];}
  for(k=1;k<F;k++){if(!isNaN(m[k])||isNaN(m[k-1]))continue;var e2=k,ok=true;while(e2<F&&isNaN(m[e2])){if(rms[e2]<gate)ok=false;e2++;}
    if(ok&&e2<F&&e2-k<=4&&Math.abs(m[e2]-m[k-1])<1)for(i=k;i<e2;i++)m[i]=m[k-1]+(m[e2]-m[k-1])*(i-k+1)/(e2-k+1);k=e2;}
  for(k=0;k<F;k++){if(isNaN(m[k]))continue;var r0=k;while(k<F&&!isNaN(m[k]))k++;if(k-r0<8)for(i=r0;i<k;i++)m[i]=NaN;}
  var A={sr:sr,hop:hop,F:F,m:m,rms:rms,x:x};if(VT.cache)VT.cache.set(b,A);return A;}
function vtChordPcs(c){var q=c[1]||'maj',iv=VTQ[q]||(/^dim|m7b5/.test(q)?VTQ.dim:/^aug/.test(q)?VTQ.aug:/^sus2/.test(q)?VTQ.sus2:/^sus4/.test(q)?VTQ.sus4:/^m(?!aj)/.test(q)?VTQ.min:VTQ.maj).slice();
  if(/7/.test(q))iv.push(/maj7/.test(q)?11:q==='dim7'?9:10);return iv.map(function(v){return (c[0]+v)%12;});}
function vtScale(v){var key=v&&v.k!=null?v.k:GAR.key,sc=v&&v.sc||'song',M;
  if(sc==='chrom')return [0,1,2,3,4,5,6,7,8,9,10,11];if(sc==='custom'&&v.pcs&&v.pcs.length)return v.pcs.slice();
  if(sc==='song'){M=BMODE[GAR.band&&GAR.band.mode]||BMODE.ionian;if(GAR.minor&&!M.mi)M=BMODE.aeolian;}else M=BMODE[sc]||BMODE.ionian;
  return M.s.map(function(s){return (key+s)%12;});}
function vtScaleName(v){var sc=v.sc||'song',k=v.k!=null?v.k:GAR.key;if(sc==='chrom')return 'Chromatic';if(sc==='custom')return 'Custom notes: '+vtScale(v).map(function(p){return GNOTE[p];}).join(' ');var M=sc==='song'?((BMODE[GAR.band&&GAR.band.mode]||BMODE.ionian).mi||!GAR.minor?BMODE[GAR.band&&GAR.band.mode]||BMODE.ionian:BMODE.aeolian):BMODE[sc]||BMODE.ionian;return GNOTE[k]+' '+M.n;}
/* allowed pitch classes at frame k: the song scale, or the band chord sounding at that point of the timeline */
function vtPcsAt(v,c,A,k){if(!v.band||!c)return VT._sc;var sd=stepDur(),g=c.s+(k*A.hop/A.sr-(c.off||0))/sd,prog=bandPart(GAR.band.edit||'A'),bar=Math.max(0,Math.floor(g/bandN()));return vtChordPcs(prog[bar%prog.length]||prog[0]);}
function vtSnap(m,pcs){var best=Math.round(m),bd=99;for(var t=Math.floor(m)-7;t<=Math.ceil(m)+7;t++){if(pcs.indexOf(((t%12)+12)%12)<0)continue;var dd=Math.abs(t-m);if(dd<bd){bd=dd;best=t;}}return best;}
function vtStep(T,steps,pcs){var t=T;while(steps>0){t++;if(pcs.indexOf(((t%12)+12)%12)>=0)steps--;}while(steps<0){t--;if(pcs.indexOf(((t%12)+12)%12)>=0)steps++;}return t;}
/* notes: inside each voiced run the ~100 ms-smoothed pitch must leave the current note's centre by more than 0.7 semitone for 70 ms before a new
   note starts (hysteresis: vibrato, scoops and drift never split); fragments under 80 ms and same-pitch neighbours are merged back.
   A note's centre (med) is the median of its steady frames; a note with no steady part (glide, blip) is flagged st=false */
function vtNotes(A,v,c){VT._sc=vtScale(v);var F=A.F,m=A.m,ms=new Float32Array(F),k,i,N=[],num=function(p,q){return p-q;};
  function medOf(a,b){var w=[];for(var q=a;q<b;q++)if(!isNaN(m[q]))w.push(m[q]);w.sort(num);return w.length?w[w.length>>1]:NaN;}
  for(k=0;k<F;k++){if(isNaN(m[k]))continue;var r0=k;while(k<F&&!isNaN(m[k]))k++;var r1=k,R=[];
    for(i=r0;i<r1;i++){var s=0,n=0;for(var q=Math.max(r0,i-10);q<=Math.min(r1-1,i+10);q++){s+=m[q];n++;}ms[i]=s/n;}
    var a=r0,cen=ms[r0],ds=-1,sg=0;
    for(i=r0;i<r1;i++){var dv=ms[i]-cen;
      if(Math.abs(dv)>0.7){var g=dv>0?1:-1;if(ds<0||g!==sg){ds=i;sg=g;}
        if(i-ds>=13){var bb=ds,bj=0;for(q=Math.max(a+2,ds-10);q<=Math.min(r1-3,ds+12);q++){var jj=Math.abs(m[q+2]-m[q-2]);if(jj>bj){bj=jj;bb=q;}}
          if(bb-a>=4){R.push({a:a,b:bb});a=bb;}cen=ms[Math.min(r1-1,i+4)];ds=-1;}}
      else{ds=-1;cen+=(ms[i]-cen)*0.04;}}
    R.push({a:a,b:r1});R.forEach(function(o){o.med=medOf(o.a,o.b);});
    for(var ch=true;ch&&R.length>1;){ch=false;
      for(i=0;i<R.length&&R.length>1;i++){var o=R[i],L=R[i-1],X=R[i+1],sh=o.b-o.a<16,dl=L?Math.abs(L.med-o.med):99,dx=X?Math.abs(X.med-o.med):99;
        if(!sh&&dl>=0.5&&dx>=0.5)continue;var tl=sh?dl<=dx:dl<0.5&&dl<=dx;if(!sh&&!tl&&dx>=0.5)continue;
        if(tl){L.b=o.b;L.med=medOf(L.a,L.b);}else{X.a=o.a;X.med=medOf(X.a,X.b);}R.splice(i,1);ch=true;i--;}}
    R.forEach(function(o){N.push({a:o.a,b:o.b});});}
  if(v.sp&&v.sp.length){var N2=[];N.forEach(function(o){var a=o.a;v.sp.filter(function(f){return f>o.a+3&&f<o.b-3;}).sort(function(p,q){return p-q;}).forEach(function(f){N2.push({a:a,b:f});a=f;});N2.push({a:a,b:o.b});});N=N2;}
  if(v.mg&&v.mg.length){var N3=[];N.forEach(function(o){var L=N3[N3.length-1];if(L&&v.mg.indexOf(o.a)>=0&&o.a-L.b<40)L.b=o.b;else N3.push(o);});N=N3;}
  N.forEach(function(o){o.med=medOf(o.a,o.b);var w=[],nv=0;for(i=o.a;i<o.b;i++){if(isNaN(m[i]))continue;nv++;var p=Math.max(o.a,i-3),q=Math.min(o.b-1,i+3);if(!isNaN(m[p])&&!isNaN(m[q])&&Math.abs(ms[q]-ms[p])<0.02*(q-p))w.push(ms[i]);}
    o.st=o.b-o.a>=12&&w.length>=Math.max(6,0.3*nv);if(o.st){w.sort(num);o.med=w[w.length>>1];}var mid=(o.a+o.b)>>1;o.pcs=vtPcsAt(v,c,A,mid);o.T0=vtSnap(o.med,o.pcs);var e=v.ed&&v.ed[o.a];o.dt=e&&e.dt||0;o.flat=!!(e&&e.flat);o.tr=e&&e.tr!=null?e.tr:null;o.hum=e&&e.hum!=null?e.hum:null;o.T=o.T0+o.dt;});
  return N;}
/* per-frame shift in semitones. Natural/Pop move the note's CENTRE fully onto the target (target − note median) and take out part of the slow drift
   inside the note (dr) and part of the 4–8 Hz wobble around a ~185 ms mean (vk; Humanize = share of vibrato kept: Natural 75 %, Pop 38 %; drift keeps half that);
   the centre move glides in at the retune Speed, the flattening is immediate; frames more than ~1.2 st from the centre (transitions, scoops) only get the centre offset. Notes whose centre is inside the style's dead-zone (Natural 8 ct, Pop 6 ct) keep their centre but still get the modulation scaling. Left alone: speech/unpitched takes in Natural (few steady notes, pitch rarely near a note centre), and
   glides/blips with no pitch plateau. Hard-tune (and "flat" notes) pull every frame. Smoothed by Speed. */
function vtHShift(T,h){return h===12||h===-12?T+h:vtStep(T,h,VT._sc);}
function vtCurve(A,N,v,harm){var F=A.F,m=A.m,sh=new Float32Array(F),dfa=new Float32Array(F),amt=(v.amt==null?100:v.amt)/100,fr=A.hop/A.sr,vib=(v.vib||0)/100,vr=v.vibR||5.5,k,i,
    SP=VTSTY[v.st]||{},dz=(v.dz!=null?v.dz:SP.dz||0)/100,ctr0=v.ctr!=null?v.ctr:SP.ctr||0,inTune=false;
  if(ctr0>0){var dv=[];N.forEach(function(o){for(k=o.a;k<o.b;k++)if(!isNaN(m[k]))dv.push(Math.abs(m[k]-o.T0));});dv.sort(function(p,q){return p-q;});inTune=dv.length>0&&dv[dv.length>>1]<(SP.it!=null?SP.it:0.1);}
  VT._inTune=inTune;
  /* Natural leaves speech / unpitched takes alone: few frames sit in steady notes */
  var vf=0,sf=0,vn=0,vi=0;N.forEach(function(o){vf+=o.b-o.a;if(o.st)sf+=o.b-o.a;for(k=o.a;k<o.b;k++)if(!isNaN(m[k])){vn++;if(Math.abs(m[k]-o.med)<0.6)vi++;}});
  var unp=!!SP.ns&&ctr0>0&&vf>0&&sf<0.45*vf&&vi<0.65*vn;VT._unp=unp;
  N.forEach(function(o){var spd=o.tr!=null?o.tr:v.spd,al=spd>0?1-Math.exp(-fr/(spd/1000)):1,hum=o.flat?0:(o.hum!=null?o.hum:(v.hum||0))/100,dF=null,T=o.T,H=harm?vtHShift(T,harm)-T:0,
      d0=T-o.med,ctr=o.flat?0:ctr0,inDz=!o.flat&&!o.dt&&Math.abs(d0)<dz,rest=!o.flat&&!o.dt&&(ctr>0?unp:inDz),dr=clamp(1-0.5*hum,0,1),vk=clamp(1-hum,0,1),tw=SP.tw||1.2;
    if(!rest&&ctr>0&&o.st===false&&!o.dt){var nn=0,ni=0;for(k=o.a;k<o.b;k++)if(!isNaN(m[k])){nn++;if(Math.abs(m[k]-o.med)<0.6)ni++;}rest=o.b-o.a<(SP.ul||14)||ni<(SP.uf||0.6)*nn;}
    for(k=o.a;k<o.b;k++){if(isNaN(m[k])){dfa[k]=dF||0;sh[k]=0;continue;}var d=0,fl=0;
      if(!rest){var s=0,n=0,tr;
        if(ctr>0){for(i=Math.max(o.a,k-18);i<Math.min(o.b,k+19);i++)if(!isNaN(m[i])){s+=m[i];n++;}tr=s/n;d=inDz?0:d0;fl=-clamp(1-(Math.abs(m[k]-o.med)-tw)/0.4,0,1)*(dr*(tr-o.med)+vk*(m[k]-tr));}
        else{for(i=Math.max(o.a,k-12);i<Math.min(o.b,k+13);i++)if(!isNaN(m[i])){s+=m[i];n++;}tr=s/n;d=Math.abs(m[k]-o.med)>5?d0:T-((1-hum)*m[k]+hum*tr);}}
      if(dF==null)dF=spd>0&&o.a>0&&!isNaN(m[o.a-1])?dfa[o.a-1]:d;dF+=(d-dF)*al;dfa[k]=dF;var vb=0;if(vib>0){var tt=(k-o.a)*fr;vb=vib*Math.min(1,Math.max(0,(tt-0.18)/0.25))*Math.sin(2*Math.PI*vr*tt);}sh[k]=amt*(dF+fl)+H+vb;}});
  var out=new Float32Array(F);for(k=0;k<F;k++){var s2=0,w2=0;for(i=Math.max(0,k-2);i<=Math.min(F-1,k+2);i++){var ww=3-Math.abs(i-k);s2+=sh[i]*ww;w2+=ww;}out[k]=Math.abs(s2/w2)<0.002?0:s2/w2;}
  return out;}
/* TD-PSOLA: analysis marks one per period (aligned on waveform peaks), unvoiced marks every 5 ms; synthesis marks re-spaced by period/ratio.
   Grains are asymmetric Hann halves that always reach the neighbouring mark, so voiced/unvoiced borders and period changes cross-fade without holes.
   Where the shift is zero (unvoiced, breath, notes left alone) grains are laid back exactly on their own marks = the untouched input (bypass).
   The window sum is normalised only down to a floor: the output is a convex mix of input samples, never louder, never a hard switch between grains. */
function vtMarks(A){var x=A.x,sr=A.sr,hop=A.hop,n=x.length,M=[],Pp=[],Vv=[],t=0,prevV=false,U=Math.round(sr*0.005),lo=sr/1100,hi=sr/60,last=-1;
  while(t<n){var k=Math.min(A.F-1,Math.round(t/hop)),vo=!isNaN(A.m[k]),P=vo?Math.max(lo,Math.min(hi,sr/(440*Math.pow(2,(A.m[k]-69)/12)))):U;
    if(vo){var a=Math.round(t+(prevV?-0.15*P:0)),b=Math.round(t+(prevV?0.15*P:P)),bi=Math.round(t),bv=-1e9;for(var i=Math.max(0,a);i<=Math.min(n-1,b);i++)if(x[i]>bv){bv=x[i];bi=i;}t=bi;}
    if(t<=last)t=last+1;M.push(t);Pp.push(P);Vv.push(vo);last=t;prevV=vo;t=Math.round(t+P);}
  return {M:M,P:Pp,V:Vv};}
var VTH=(function(){var h=new Float32Array(1026);for(var i=0;i<1026;i++)h[i]=i>1024?0:0.5+0.5*Math.cos(Math.PI*i/1024);return h;})();
/* level guard after PSOLA: where the shifted voice comes out more than 2 dB under the input's own 23 ms level (same instants, the marks stay in place)
   it is lifted back, at most +12 dB, smoothly; it never turns anything down. */
function vtLvl(y,x){var n=Math.min(y.length,x.length),H=1024,F=Math.ceil(n/H),g=new Float32Array(F+1),k,i;
  for(k=0;k<F;k++){var a=k*H,b=Math.min(n,a+H),ex=0,ey=0;for(i=a;i<b;i++){ex+=x[i]*x[i];ey+=y[i]*y[i];}var rx=Math.sqrt(ex/(b-a)),ry=Math.sqrt(ey/(b-a));g[k]=rx>0.001&&ry<0.8*rx?Math.min(4,rx/Math.max(ry,1e-9)):1;}
  g[F]=g[F-1];var s=new Float32Array(F+1);for(k=0;k<=F;k++)s[k]=Math.max(g[k],0.5*(g[Math.max(0,k-1)]+g[Math.min(F,k+1)]));
  for(k=0;k<F;k++){if(s[k]===1&&s[k+1]===1)continue;var a2=k*H,b2=Math.min(n,a2+H);for(i=a2;i<b2;i++){var f=(i-a2)/H;y[i]*=s[k]*(1-f)+s[k+1]*f;}}return y;}
function vtPsola(src,A,sh,MK,phi,op){phi=phi||1;var RR=op?vmRand(op.seed):null,gc=0,gg=1;var sr=A.sr,hop=A.hop,n=src.length,acc=new Float32Array(n),ws=new Float32Array(n),M=MK.M,PP=MK.P,VV=MK.V||[],nM=M.length,j=0,jp=-1,ts=0,last=-1,disp=0,inBy=false,cap=sr*0.03,i;
  while(ts<n&&nM){var k=Math.min(A.F-1,Math.round(ts/hop)),s=sh[k],r=Math.pow(2,s/12);
    if(s===0&&phi===1){ /* bypass: grain j goes back on mark j; a leftover offset from a shifted stretch is eased out over a few periods */
      if(!inBy){while(j+1<nM&&Math.abs(M[j+1]-ts)<=Math.abs(M[j]-ts))j++;if(j<=jp)j=jp+1;if(j>=nM)break;disp=VV[j]?ts-M[j]:0;if(Math.abs(disp)>PP[j])disp=0;inBy=true;}
      else{j=jp+1;if(j>=nM)break;disp*=0.6;if(Math.abs(disp)<1)disp=0;}
      ts=M[j]+disp;}
    else{inBy=false;while(j+1<nM&&Math.abs(M[j+1]-ts)<=Math.abs(M[j]-ts))j++;}
    if(ts<=last)ts=last+1;gg=1;if(op&&VV[j]){if(op.jit)gg*=1+(RR()*2-1)*op.jit*0.3;if(op.gw)gg*=1+((gc&1)?-1:1)*op.gw*0.45;}gc++;
    var ma=M[j],P=PP[j],Ll=Math.min(cap,Math.max(P,j>0?ma-M[j-1]:P)),Lr=Math.min(cap,Math.max(P,j+1<nM?M[j+1]-ma:P)),t0=Math.floor(ts),fr=ts-t0;
    /* raising pitch: grains only as long as the new period. Grains of a whole input period laid at period/r resolve the input harmonics,
       so at large ratios (e.g. +12 on a steady 340 Hz note) the new harmonics land between them and the note cancels to −20 dB. */
    if(r>1.001&&VV[j]){var Ls=P/r;Ll=Math.min(Ll,Math.max(Ls,last>=0?ts-last:Ls));Lr=Math.min(Lr,Ls*1.08);}
    var 
        i0=j===0?-t0:-Math.ceil(Ll),i1=j===nM-1?n-1-t0:Math.ceil(Lr),HL=VTH,kl=1024/Ll,kr=1024/Lr;
    for(i=i0;i<=i1;i++){var o=t0+i;if(o<0||o>=n)continue;var u=i-fr,w;
      if(u<0){if(j===0)w=1;else{if(u<=-Ll)continue;w=HL[Math.round(-u*kl)];}}
      else{if(j===nM-1)w=1;else{if(u>=Lr)continue;w=HL[Math.round(u*kr)];}}
      var si=ma+u*phi;if(si<0)si=0;else if(si>n-1)si=n-1;var s0=Math.floor(si),f=si-s0,xv=(s0>=0&&s0<n?src[s0]:0)*(1-f)+(s0+1>=0&&s0+1<n?src[s0+1]:0)*f;acc[o]+=w*xv*gg;ws[o]+=w;}
    jp=j;last=ts;ts+=P/r*(op&&op.jit&&VV[j]?1+(RR()*2-1)*op.jit*0.06:1);}
  for(i=0;i<n;i++)acc[i]=ws[i]>0?acc[i]/Math.max(ws[i],0.6):0;return acc;}
function vtRenderBuf(b,v,c,harm){var vc=vmEff(v);if(vc&&vc.rob)v=Object.assign({},v,{st:'hard',amt:100,spd:0,hum:0,mor:100});var A=vtAnalyse(b),N=vtNotes(A,v,c),sh=vtCurve(A,N,v,harm),MK=A.mk||(A.mk=vtMarks(A)),C=b.numberOfChannels,nb=ctx.createBuffer(C,b.length,b.sampleRate);
  if(vc)return {buf:vmRender(b,v,A,N,sh,MK,vc),N:N,sh:sh,A:A};
  var phi=Math.pow(2,(v.fmt||0)/12),thr=(v.thr||0)/100;
  for(var ch=0;ch<C;ch++){var y=vtLvl(vtPsola(b.getChannelData(ch),A,sh,MK,phi),b.getChannelData(ch));if(thr)vtThroat(y,b.sampleRate,thr);nb.getChannelData(ch).set(y);}return {buf:nb,N:N,sh:sh,A:A};}
/* throat: + darker/chestier (low-passed body mixed in, top tamed), − thinner/brighter (body removed) */
function vtThroat(y,sr,t){var n=y.length,i,lp=0,a=Math.exp(-2*Math.PI*(t>0?1400:420)/sr),k=Math.abs(t),pk0=0,pk1=0;for(i=0;i<n;i++)pk0=Math.max(pk0,Math.abs(y[i]));
  for(i=0;i<n;i++){lp=y[i]+(lp-y[i])*a;y[i]=t>0?y[i]*(1-0.55*k)+lp*0.9*k:y[i]-lp*0.75*k;pk1=Math.max(pk1,Math.abs(y[i]));}if(pk1>1e-6){var g=Math.min(4,pk0/pk1);for(i=0;i<n;i++)y[i]*=g;}}
/* ---------- clip / slot binding (non-destructive: original kept in vt.src, settings on the clip, saved with the project) ---------- */
function vtSrcBuf(){if(VT.c)return abuf[VT.c.vt.src];if(VT.slot)return slots[VT.slot].vtSrc;return null;}
function vtSet(){return VT.c?VT.c.vt:VT.slot?slots[VT.slot].vt:null;}
function vtRender(){var v=vtSet(),b=vtSrcBuf();if(!v||!b)return;var t0=performance.now(),R=vtRenderBuf(b,v,VT.c);VT.N=R.N;VT.sh=R.sh;VT.A=R.A;VT.ms=performance.now()-t0;
  if(VT.c){var c=VT.c,old=c.vt.out,id=abufAdd(R.buf),k=c.takes.indexOf(c.buf);c.vt.out=id;if(c.vt.on){c.buf=id;if(k>=0)c.takes[k]=id;}else if(k>=0&&c.takes[k]===old)c.takes[k]=c.vt.src;
    if(old&&old!==id&&old!==c.vt.src&&c.takes.indexOf(old)<0)delete abuf[old];dawNeed=true;markDirty();}
  else{var s=slots[VT.slot],keep=s.vtSrc,vv=s.vt;s.vtOut=R.buf;setSlot.keep=true;setSlot(VT.slot,v.on?R.buf:keep,s.name,s.root,s.det);setSlot.keep=false;s=slots[VT.slot];s.vtSrc=keep;s.vt=vv;s.vtOut=R.buf;saveSound(selTrack);}
  vtDraw();vtInfo();vtUI();if(VT.au&&!VT.auRaw&&!VT.drag)vtPreview(true,false,vtPos());
  var hs=vtHs(v);if(hs.length){clearTimeout(VT.th);VT.th=setTimeout(function(){if(vtSet()!==v)return;hs.forEach(vtHarmRender);if(VT.au&&!VT.auRaw)vtPreview(true,false,vtPos());},500);}}
function vtSchedule(ms){clearTimeout(VT.t);VT.t=setTimeout(vtRender,ms||120);}
function vtOpenClip(c){if(!ensureAudio()||!c||c.type!=='aud')return;
  if(!c.vt||(c.buf!==c.vt.out&&c.buf!==c.vt.src)){var keep=c.vt;c.vt=vtDef('pop');if(keep){['st','amt','mor','spd','hum','sc','k','band','fmt','thr','vib','vibR','pcs','hs','vm'].forEach(function(q){c.vt[q]=keep[q];});}c.vt.src=c.buf;c.vt.out=null;}
  VT.c=c;VT.slot=null;VT.sel=-1;vtShow();vtRender();}
function vtOpenSlot(k){if(!ensureAudio())return;var s=slots[k];if(!s||!s.buf){toast('Record or import your voice into Source '+k+' first.');return;}
  if(!s.vtSrc||(s.buf!==s.vtSrc&&s.buf!==s.vtOut)){s.vtSrc=s.buf;s.vt=vtDef('pop');}VT.slot=k;VT.c=null;VT.sel=-1;vtShow();vtRender();}
function vtAB(on){var v=vtSet();if(!v)return;v.on=on;if(VT.c){var c=VT.c,k=c.takes.indexOf(c.buf),nb=on?c.vt.out:c.vt.src;if(nb){c.buf=nb;if(k>=0)c.takes[k]=nb;}dawNeed=true;markDirty();renderInsp();}
  else{var s=slots[VT.slot],src=s.vtSrc,out=s.vtOut,vv=s.vt;setSlot.keep=true;setSlot(VT.slot,on?out:src,s.name,s.root,s.det);setSlot.keep=false;s=slots[VT.slot];s.vtSrc=src;s.vtOut=out;s.vt=vv;saveSound(selTrack);}
  vtUI();vtPreview(true);}
function vtRemove(){if(!VT.c)return;var c=VT.c,k=c.takes.indexOf(c.buf);c.buf=c.vt.src;if(k>=0)c.takes[k]=c.buf;delete c.vt;dawNeed=true;markDirty();vtClose();renderInsp();toast('Tuning removed — the original take is back.',1800);}
function vtStopAu(){var a=VT.au;VT.au=null;if(a){try{a.stop();}catch(e){}}(VT.hau||[]).forEach(function(x){try{x.stop();}catch(e){}});VT.hau=[];var vp=document.getElementById('vmPlay');if(vp)vp.textContent='▶ Play take';var lv=document.getElementById('vmLv');if(lv&&lv.textContent==='PLAYING')lv.textContent='PREVIEW';}
function vtRegion(){var b=vtSrcBuf(),off=VT.c?VT.c.off||0:0,end=VT.c?off+VT.c.dur:(b?b.duration:0);
  if(VT.loop&&VT.N&&VT.sel>=0&&VT.A&&VT.N[VT.sel]){var n=VT.N[VT.sel],h=VT.A.hop/VT.A.sr;return [Math.max(off,n.a*h-0.25),Math.min(end,n.b*h+0.25)];}return [off,end];}
function vtPos(){if(!VT.au)return -1;var t=ctx.currentTime-VT.auT,a=VT.auA;if(VT.loop&&t>a[1]&&a[1]>a[0])t=a[0]+((t-a[1])%(a[1]-a[0]));return t;}
/* preview: the voice through its own track (or raw, straight to the output: no tuning, no reverb, no FX) plus every harmony voice through its track */
function vtPreview(force,raw,at){var now=performance.now();if(!force){if(now-(VT.tgT||0)<150)return;VT.tgT=now;}else if(VT.want===false)return;
  var wasRaw=VT.auRaw;if(VT.au){vtStopAu();if(!force&&wasRaw===!!raw){VT.want=false;clearTimeout(VM.t);vtUI();vtNowUI(-1);if(typeof vmUI==='function')vmUI();return;}}if(!force)VT.want=true;
  var v=vtSet();if(!v||!ensureAudio())return;var b=raw?vtSrcBuf():(VT.c?abuf[VT.c.buf]:slots[VT.slot].buf);if(!b)return;
  var R=vtRegion(),a0=R[0],a1=Math.min(R[1],b.duration),st=at!=null&&at>=0?Math.min(Math.max(at,a0),a1-0.02):a0,t0=ctx.currentTime+0.03;
  function play(buf,dst,gain){var x=ctx.createBufferSource(),g=ctx.createGain();x.buffer=buf;g.gain.value=gain;x.connect(g);g.connect(dst);if(VT.loop){x.loop=true;x.loopStart=a0;x.loopEnd=a1;x.start(t0,st);}else x.start(t0,st,Math.max(0.02,a1-st));return x;}
  var tr=VT.c&&tracks[VT.c.ti],s=play(b,!raw&&tr&&tr.n?tr.n.in:ctx.destination,VT.c&&!raw?dbg(VT.c.gain||0):1);VT.hau=[];
  if(!raw)vtHs(v).forEach(function(h){var hb=abuf[h.buf],ht=tracks[h.ti];if(!hb||!ht||st>=hb.duration)return;VT.hau.push(play(hb,ht.n?ht.n.in:ctx.destination,dbg(h.gain||0)));});
  VT.au=s;VT.auRaw=!!raw;(function(){var vp=document.getElementById('vmPlay');if(vp)vp.textContent=raw?'▶ Play take':'■ Stop';})();VT.auT=t0-st;VT.auA=[a0,a1];s.onended=function(){if(VT.au===s){vtStopAu();vtUI();vtNowUI(-1);}};vtUI();
  (function tick(){if(VT.au!==s||$('#vtSheet').hidden)return;vtDraw();vtNowUI(vtPos());requestAnimationFrame(tick);})();}
/* big live readout: note you hear now, cents from its target note */
function vtNowUI(t){var nE=$('#vtNowN'),sE=$('#vtNowS'),iE=$('#vtNowI'),A=VT.A,v=vtSet();if(!nE)return;
  if(t<0||!A||!v){nE.textContent='–';sE.textContent='Press Play to see your pitch live';iE.style.left='50%';return;}
  var k=Math.max(0,Math.min(A.F-1,Math.round(t*A.sr/A.hop))),m=A.m[k];if(isNaN(m)){nE.textContent='·';sE.textContent='no pitch here (breath, consonant, silence)';return;}
  var tun=v.on&&!VT.auRaw&&VT.sh?m+VT.sh[k]:m,nt=null;(VT.N||[]).forEach(function(n){if(k>=n.a&&k<n.b)nt=n;});var T=nt?nt.T:Math.round(tun),c=Math.round((tun-T)*100),c0=Math.round((m-T)*100);
  nE.textContent=nname(T);nE.style.color=Math.abs(c)<=10?'#4ADE80':Math.abs(c)<=30?'#FACC15':'#FB7185';sE.textContent=(VT.auRaw||!v.on?'original ':'you sang ')+(c0>=0?'+':'')+c0+' ct'+(v.on&&!VT.auRaw?' → now '+(c>=0?'+':'')+c+' ct':'');iE.style.left=(50+Math.max(-50,Math.min(50,c)))+'%';}
function vtClose(){$('#vtSheet').hidden=true;vtStopAu();VT.want=false;clearTimeout(VT.th);VT.c=null;VT.slot=null;VT.drag=null;}
/* ---------- harmony voices: each its own audio clip/track in the song (from a clip or from a Capture slot), rendered from the original take ---------- */
var VTINT=[[-12,'Octave below'],[-2,'3rd below'],[2,'3rd above'],[3,'4th above'],[4,'5th above'],[5,'6th above'],[12,'Octave above']];
function vtIntName(st){for(var i=0;i<VTINT.length;i++)if(VTINT[i][0]===st)return VTINT[i][1];return 'Harmony';}
function vtHs(v){if(!v||!v.hs)return [];v.hs=v.hs.filter(function(id){var h=clipById(id);return h&&tracks[h.ti];});return v.hs.map(clipById);}
function vtWhere(c){return (tracks[c.ti]?tracks[c.ti].name:'Audio')+' · Song › Tracks · bar '+(Math.floor((c.s||0)/16)+1);}
function vtHarmRender(h){var v=vtSet(),b=vtSrcBuf();if(!v||!b||!h||!h.hv)return;var vv=Object.assign({},v,{hum:Math.max(v.hum||0,40),fmt:(v.fmt||0)+(h.hv.fmt||0),vm:h.hv.vm?{on:true,c:h.hv.vm}:v.vm}),R=vtRenderBuf(b,vv,VT.c,h.hv.st),old=h.buf;
  h.buf=abufAdd(R.buf);h.takes=[h.buf];h.name='Harmony · '+vtIntName(h.hv.st);if(old&&old!==h.buf&&!daw.clips.some(function(c){return c!==h&&c.buf===old;}))delete abuf[old];dawNeed=true;markDirty();}
function vtHarmony(steps,card,pan){var v=vtSet(),b=vtSrcBuf();if(!v||!b){toast('Record or open a take first.');return;}
  if(audioCount()>=MAXAUD){vtHmsg('No room for another voice: all '+MAXAUD+' audio tracks are in use. Delete a harmony (or an audio track in Song › Tracks) and try again.');toast('All '+MAXAUD+' audio tracks are in use.',3000);return;}
  var c=VT.c,base=c?tracks[c.ti].name:((slots[VT.slot]&&slots[VT.slot].name)||'Voice'),ni=addAudioTrack(base+' · '+vtIntName(steps).toLowerCase(),true);if(ni<0)return;
  var s0=c?c.s:Math.max(0,Math.floor((daw.play||0)/16)*16),h=newClip({type:'aud',ti:ni,s:s0,off:c?c.off||0:0,dur:c?c.dur:b.duration,buf:null,gain:(c?c.gain||0:0)-4,name:'Harmony'});
  h.hv={st:steps,fmt:0};if(card){h.hv.vm=vmClean(card);h.hv.vmid=card.id;}vtHarmRender(h);var k=(v.hs||[]).length;tracks[ni].vol=0.6;tracks[ni].pan=pan!=null?pan:[-0.35,0.35,-0.6,0.6,0][k%5];try{applyMix();}catch(e){}
  (v.hs||(v.hs=[])).push(h.id);try{if(dcv)renderDawHeads();}catch(e){}dawNeed=true;markDirty();
  vtHmsg('Added '+vtIntName(steps).toLowerCase()+' on '+vtWhere(h)+'. Press Play to hear it with your voice.',h.id);vtHarmUI();if(VT.au&&!VT.auRaw)vtPreview(true,false,vtPos());
  toast(vtIntName(steps)+' added on '+tracks[ni].name+'.',2200);}
function vtHmsg(tx,id){var e=$('#vtHmsg');e.hidden=false;e.style.color=id?'var(--ac)':'#FBBF24';e.innerHTML=escapeH(tx)+(id?' <button class="btn" data-hjump="'+id+'" style="min-height:44px;margin-top:6px">Show in Song</button>':'');}
function vtHarmDel(id){var h=clipById(id),v=vtSet();if(!h)return;var ti=h.ti,wasAu=VT.au&&!VT.auRaw,p=vtPos();vtStopAu();daw.clips=daw.clips.filter(function(c){return c.id!==id;});if(v&&v.hs)v.hs=v.hs.filter(function(x){return x!==id;});
  if(ti>=4&&tracks[ti]&&!daw.clips.some(function(c){return c.ti===ti;}))removeTrack(ti);dawNeed=true;markDirty();try{if(dcv)renderDawHeads();}catch(e){}$('#vtHmsg').hidden=true;vtHarmUI();if(wasAu)vtPreview(true,false,p);else vtUI();toast('Harmony voice deleted.',1400);}
function vtHarmUI(){var v=vtSet(),el=$('#vtHl');if(!v||!el)return;var hs=vtHs(v);
  el.innerHTML=hs.map(function(h,i){var t=tracks[h.ti];return '<div class="vt-hv" data-hid="'+h.id+'"><div class="row"><b>Voice '+(i+2)+'</b><select data-hint aria-label="Interval of voice '+(i+2)+'">'+VTINT.map(function(q){return '<option value="'+q[0]+'"'+(q[0]===h.hv.st?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select></div>'+
    '<div class="vt-g3"><label>Level<input type="range" data-hk="vol" min="0" max="1" step="0.01" value="'+t.vol+'" aria-label="Level of voice '+(i+2)+'"></label><label>Pan<input type="range" data-hk="pan" min="-1" max="1" step="0.05" value="'+t.pan+'" aria-label="Pan of voice '+(i+2)+'"></label><label>Formant<input type="range" data-hk="fmt" min="-6" max="6" step="0.5" value="'+(h.hv.fmt||0)+'" aria-label="Formant of voice '+(i+2)+'"></label></div>'+
    '<div class="vt-g2"><button class="btn" data-hgo>Show in Song</button><button class="btn" data-hdel>Delete voice</button></div></div>';}).join('');
  el.hidden=!hs.length;var full=audioCount()>=MAXAUD;$$('[data-vth]').forEach(function(b){b.style.opacity=full?0.45:1;});}
function vtGoClip(id){var c=clipById(id);if(!c)return;vtClose();vtStopTP();daw.sel=id;daw.lane=c.ti;subGo('tracks');setTimeout(function(){try{garTl();}catch(e){}try{renderInsp();}catch(e){}},80);toast('Here it is: '+vtWhere(c),2200);}
/* ---------- sheet UI ---------- */
function vtShow(){var sh=$('#vtSheet');sh.hidden=false;sh.classList.toggle('all',!!VT.all);$('#vtAll').setAttribute('aria-pressed',!!VT.all);$('#vtAll').textContent=VT.all?'Hide extra options':'Show all options';
  $('#vtT').textContent=VT.c?'Vocal Studio · '+clipName(VT.c):'Vocal Studio · Source '+VT.slot;$('#vtSub').textContent=VT.c?'Saved in '+vtWhere(VT.c):'Capture Source '+VT.slot+' · harmonies go into the song as new audio tracks';
  $('#vtBand').disabled=!VT.c;$('#vtHarm').hidden=false;$('#vtRm').hidden=!VT.c;$('#vtHmsg').hidden=true;VT.undo=[];VT.redo=[];VT.loop=false;vtHarmUI();vtUI();vtNowUI(-1);try{vmShow();}catch(e){errLog.push('vm: '+e.message);}}
function vtUI(){var v=vtSet();if(!v)return;$$('[data-vts]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-vts')===v.st);});
  if(v.mor==null)v.mor=v.spd<=0?100:v.spd>=100?25:62;
  [['vtAmt','amt','%'],['vtSpd','spd',' ms'],['vtHum','hum','%'],['vtMor','mor',''],['vtFmt','fmt',' st'],['vtThr','thr',''],['vtVib','vib',' ct'],['vtVibR','vibR',' Hz']].forEach(function(q){var e=$('#'+q[0]);if(!e)return;var val=v[q[1]];if(val==null)val=+e.defaultValue;e.value=val;
    $('#'+q[0]+'O').textContent=q[1]==='spd'&&!val?'0 ms · hard':q[1]==='thr'?(val>0?'deeper '+val:val<0?'brighter '+(-val):'neutral'):q[1]==='mor'?(val<35?'natural':val<80?'pop':'robotic')+' · '+val:(q[1]==='fmt'&&val>0?'+':'')+val+q[2];});
  $('#vtA').setAttribute('aria-pressed',!v.on);$('#vtB').setAttribute('aria-pressed',!!v.on);$('#vtBand').checked=!!v.band;$('#vtSc').value=v.sc||'song';$('#vtKey').value=v.k==null?'':v.k;
  var pcs=vtScale(v),key=v.k!=null?v.k:GAR.key;$('#vtKeys').innerHTML=GNOTE.map(function(n,i){return '<button data-vpc="'+i+'" aria-pressed="'+(pcs.indexOf(i)>=0)+'"'+(i===key?' class="tonic"':'')+'>'+n+'</button>';}).join('');
  var nh=vtHs(v).length;$('#vtPlay').textContent=VT.au&&!VT.auRaw?'■ Stop':'▶ Play'+(nh?' + '+nh:'');$('#vtRaw').textContent=VT.au&&VT.auRaw?'■ Stop':'▶ Original';$('#vtLoop').setAttribute('aria-pressed',!!VT.loop);
  var n=VT.N&&VT.sel>=0?VT.N[VT.sel]:null;$('#vtNote').hidden=!n;$('#vtHint').textContent=n?'Selected '+nname(n.T)+' · drag it, or use the note tools'+(VT.all||document.body.classList.contains('is-pro')?' below':' (Show all options)'):'Tap a blue note to select it, drag it up or down to change it.';
  if(n){$('#vtNl').textContent=nname(n.T)+(n.dt?' (moved '+(n.dt>0?'+':'')+n.dt+')':'')+' · sung '+nname(Math.round(n.med))+' '+(Math.round((n.med-Math.round(n.med))*100)>=0?'+':'')+Math.round((n.med-Math.round(n.med))*100)+' ct';$('#vtFlat').setAttribute('aria-pressed',n.flat);$('#vtFlat').textContent=n.flat?'Restore vibrato':'Flatten vibrato';
    $('#vtNTr').value=n.tr!=null?n.tr:v.spd;$('#vtNTrO').textContent=n.tr!=null?n.tr+' ms':'auto';$('#vtNHum').value=n.hum!=null?n.hum:v.hum;$('#vtNHumO').textContent=n.hum!=null?n.hum+'%':'auto';$('#vtMerge').disabled=VT.sel>=VT.N.length-1;}
  $('#vtUndo').disabled=!(VT.undo&&VT.undo.length);$('#vtRedo').disabled=!(VT.redo&&VT.redo.length);
  var none=!!(VT.N&&!VT.N.length);$('#vtNone').hidden=!none;$('#vtHint').hidden=none;$('#vtNow').hidden=none;vtInfo();}
function vtInfo(){var v=vtSet(),e=$('#vtInfo');if(!v||!e)return;e.textContent=(v.band&&VT.c?'Following the band chords (part '+(GAR.band.edit||'A')+')':vtScaleName(v))+' · '+(VT.N?VT.N.length:0)+' notes'+(VT.ms?' · rendered in '+Math.round(VT.ms)+' ms':'');}
function vtPushUndo(){var v=vtSet();if(!v)return;VT.redo=[];(VT.undo||(VT.undo=[])).push(JSON.stringify({ed:v.ed||{},sp:v.sp||[],mg:v.mg||[],vm:v.vm||null}));if(VT.undo.length>50)VT.undo.shift();}
function vtEd(n,o){var v=vtSet();v.ed=v.ed||{};var e=v.ed[n.a]||{};Object.assign(e,o);['tr','hum'].forEach(function(q){if(e[q]==null)delete e[q];});if(!e.dt&&!e.flat&&e.tr==null&&e.hum==null)delete v.ed[n.a];else v.ed[n.a]=e;vtSchedule();}
function vtGeom(){var cv=$('#vtCv'),A=VT.A,N=VT.N||[];if(!A||!cv)return null;var lo=99,hi=0;N.forEach(function(n){lo=Math.min(lo,n.T,n.med);hi=Math.max(hi,n.T,n.med);});if(lo>hi){lo=57;hi=69;}
  lo=Math.floor(lo)-2;hi=Math.ceil(hi)+2;if(hi-lo<12){var c=(hi+lo)/2;lo=Math.floor(c-6);hi=lo+12;}
  var rows=hi-lo+1,Hd=Math.max(260,Math.min(540,rows*28));if(cv.style.height!==Hd+'px')cv.style.height=Hd+'px';
  var W=cv.clientWidth||340,H=cv.clientHeight||Hd,f0=0,f1=A.F;if(VT.c){f0=Math.floor((VT.c.off||0)*A.sr/A.hop);f1=Math.min(A.F,Math.ceil(((VT.c.off||0)+VT.c.dur)*A.sr/A.hop));}
  return {W:W,H:H,lo:lo,hi:hi,rh:H/rows,f0:f0,f1:f1,x:function(k){return (k-f0)/Math.max(1,f1-f0)*W;},y:function(m){return H-(m-lo+0.5)*H/rows;}};}
function vtDraw(){var cv=$('#vtCv');if(!cv||$('#vtSheet').hidden)return;var G=vtGeom();if(!G)return;var dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(G.W*dpr)||cv.height!==Math.round(G.H*dpr)){cv.width=Math.round(G.W*dpr);cv.height=Math.round(G.H*dpr);}var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,G.W,G.H);
  var sc=VT._sc||vtScale(vtSet()),A=VT.A,k,m;g.font='600 10px Inter, system-ui, sans-serif';
  for(m=G.lo;m<=G.hi;m++){var y=G.y(m),ins=sc.indexOf(((m%12)+12)%12)>=0;g.fillStyle=ins?'rgba(255,255,255,.055)':'rgba(0,0,0,.18)';g.fillRect(0,y-G.rh/2,G.W,G.rh-1);if(ins){g.fillStyle='rgba(255,255,255,.4)';g.fillText(nname(m),3,y+3);}}
  if(VT.loop&&VT.au){var R=VT.auA;g.fillStyle='rgba(212,255,58,.08)';var xa=G.x(R[0]*A.sr/A.hop),xb=G.x(R[1]*A.sr/A.hop);g.fillRect(xa,0,xb-xa,G.H);}
  (VT.N||[]).forEach(function(n,i){var x0=G.x(n.a),x1=G.x(n.b),y=G.y(n.T);g.fillStyle=i===VT.sel?'rgba(250,204,21,.55)':'rgba(56,189,248,.34)';rr(g,x0,y-G.rh/2+1,Math.max(6,x1-x0-1),Math.max(8,G.rh-2),5);g.fill();
    if(i===VT.sel){g.strokeStyle='#FACC15';g.lineWidth=2;g.stroke();}});
  function line(off,col,wd){g.strokeStyle=col;g.lineWidth=wd;g.beginPath();var on=false;for(k=G.f0;k<G.f1;k++){m=A.m[k];if(isNaN(m)){on=false;continue;}var yy=G.y(m+(off?off[k]:0)),xx=G.x(k);if(on)g.lineTo(xx,yy);else g.moveTo(xx,yy);on=true;}g.stroke();}
  line(null,'rgba(255,255,255,.5)',1.3);var v=vtSet();if(v&&v.on&&VT.sh)line(VT.sh,'#FB7185',2);
  var t=vtPos();if(t>=0){var xx=G.x(t*A.sr/A.hop);g.fillStyle='#fff';g.fillRect(xx,0,2,G.H);}}
/* hit test: a note's whole row (>= 24 px tall) plus 14 px either side, nearest centre wins */
/* CSS zoom (text size / TWA fit) scales getBoundingClientRect and clientX but not clientWidth: zRect gives a rect in the element's own CSS px for event e, so (e.clientX-r.left) matches canvas geometry */
function zRect(el,e){var r=el.getBoundingClientRect(),z=el.currentCSSZoom||1;if(z===1||!e)return r;var cx=e.clientX,cy=e.clientY;return {left:cx-(cx-r.left)/z,top:cy-(cy-r.top)/z,width:r.width/z,height:r.height/z,right:cx+(r.right-cx)/z,bottom:cy+(r.bottom-cy)/z};}
function vtHit(e){var G=vtGeom(),cv=$('#vtCv');if(!G)return -1;var r=zRect(cv,e),x=e.clientX-r.left,y=e.clientY-r.top,best=-1,bd=1e9,tol=Math.max(24,G.rh*0.75);
  (VT.N||[]).forEach(function(n,i){var x0=G.x(n.a),x1=G.x(n.b);if(x<x0-14||x>x1+14)return;var dy=Math.abs(G.y(n.T)-y),dx=x<x0?x0-x:x>x1?x-x1:0;if(dy<tol&&dy+dx<bd){bd=dy+dx;best=i;}});return best;}
function vtWkInit(){if(vtWkInit.p)return vtWkInit.p;if(!ctx.audioWorklet)return (vtWkInit.p=Promise.resolve(false));
  vtWkInit.p=ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([VOX_WORKLET],{type:'application/javascript'}))).then(function(){VT.wk=true;return true;},function(e){errLog.push('vox worklet: '+e.message);return false;});return vtWkInit.p;}
/* ---------- live auto-tune insert (headphone monitoring): ecou-vox worklet, 12.5 ms look-behind ---------- */
var VTL=(function(){try{return JSON.parse(localStorage.getItem('ecou.vtLive'))||null;}catch(e){return null;}})()||{on:false,amt:100,spd:15,band:false};
function vtLiveSave(){try{localStorage.setItem('ecou.vtLive',JSON.stringify(VTL));}catch(e){}}
function vtLiveNode(src){if(!VTL.on||!VT.wk)return null;var nd=new AudioWorkletNode(ctx,'ecou-vox',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});
  src.connect(nd);vtLivePush(nd);nd._t=setInterval(function(){vtLivePush(nd);},120);VT.live=nd;return nd;}
function vtLivePush(nd){var pcs=vtScale({sc:'song'});if(VTL.band&&BR&&BR.on&&BR.plan&&BR.plan.c)pcs=vtChordPcs(BR.plan.c);try{nd.port.postMessage({amt:VTL.amt/100,spd:VTL.spd/1000,pcs:pcs,vm:VTL.vm||null});}catch(e){}}
function vtLiveDrop(nd){if(!nd)return;clearInterval(nd._t);try{nd.disconnect();}catch(e){}if(VT.live===nd)VT.live=null;}
function vtLiveLat(){return Math.round(0.0125*1000*10)/10;}
/* ---------- headphones gate for live monitoring (asked once per session) ---------- */
VT.hp=(function(){try{return sessionStorage.getItem('ecou.hp')==='1';}catch(e){return false;}})();
var HP_WARN='Without headphones the speaker leaks into the microphone: the take picks up the echo (it sounds like reverb) and any click or backing you hear.';
function hpSet(){VT.hp=true;try{sessionStorage.setItem('ecou.hp','1');}catch(e){}}
function hpAsk(why,yes,no){if(VT.hp){if(yes)yes();return;}var sh=$('#hpSheet');$('#hpTx').textContent=why+' '+HP_WARN;sh.hidden=false;
  function done(ok){sh.hidden=true;$('#hpYes').onclick=$('#hpNo').onclick=$('#hpScrim').onclick=null;if(ok){hpSet();if(yes)yes();}else if(no)no();garReAud();}
  $('#hpYes').onclick=function(){done(true);};$('#hpNo').onclick=function(){done(false);};$('#hpScrim').onclick=function(){done(false);};}
function garReAud(){try{if(showTab.cur==='t-gar'&&GAR.view==='play'&&(GAR.inst==='audio'||GAR.inst==='vocal')&&!GAR.amp)garAudioUI();}catch(e){}}
function vtLiveToggle(on,quiet){
  if(on&&!VT.hp){VTL.on=true;vtLiveSave();if(ctx)vtWkInit();vtLiveUI();garReAud();if(quiet)return;
    hpAsk('Live auto-tune lets you hear your tuned voice while you sing.',function(){vtLiveToggle(true);},function(){toast('Live monitoring stays off (no headphones). Your takes are still auto-tuned after recording.',3200);});return;}
  VTL.on=on;vtLiveSave();if(on&&ctx)vtWkInit();vtLiveUI();if(!quiet)toast(on?'Live auto-tune on for monitoring: '+vtLiveLat()+' ms added (+ your device output latency). Your take is recorded dry and tuned afterwards in better quality.':'Live auto-tune off.',on?4200:1600);
  if(live&&ctx){vtLiveAttach(live);}garReAud();}
function vtLiveAttach(L){if(!L||!L.src)return;vtLiveDrop(L.vox);L.vox=null;try{L.src.disconnect();}catch(e){}
  if(!VTL.on){L.src.connect(N.liveIn);return;}vtWkInit().then(function(ok){if(live!==L)return;var nd=ok&&vtLiveNode(L.src);if(nd){L.vox=nd;nd.connect(N.liveIn);}else L.src.connect(N.liveIn);});}
function vtLiveUI(){var a=$('#vtLiveCap');if(a){a.setAttribute('aria-pressed',!!VTL.on);a.textContent='Auto-tune: '+(VTL.on?'on':'off');}var d=$('#dawVt');if(d)d.checked=!!VTL.on;var g=$('#garVt');if(g)g.setAttribute('aria-pressed',!!VTL.on);}
function vtAfterRec(ids){ids.forEach(function(id){var c=clipById(id);if(!c||c.type!=='aud')return;c.vt=vtDef(VTSTY[VTL.st]?VTL.st:(VTL.spd<10?'hard':'pop'));c.vt.amt=VTL.amt;c.vt.band=!!VTL.band;c.vt.src=c.buf;VT.c=c;VT.slot=null;try{vtRender();}catch(e){errLog.push('vt rec: '+e.message);}VT.c=null;});}
function vtInspRow(c){return vtTakeCard(c);}
function vtInspRowOld(c){return '<div class="btn3 vt-row"><button class="btn vt-chip" id="ciTune" aria-pressed="'+!!(c.vt&&c.vt.on)+'">'+(c.vt?'Tune':'Tune voice')+(c.vt?' · '+(c.vt.on?VTSTY[c.vt.st]?VTSTY[c.vt.st].n:'on':'A/B: original'):'')+'</button></div>';}
function vtBindInsp(c){vtTakeBind($('#dawInsp'),c);}
function initVocal(){var $0=$;$=function(q){var e=$0(q);if(e)return e;return {addEventListener:function(){},setAttribute:function(){}};};try{initVocal2();}finally{$=$0;}}
function initVocal2(){
  var sty=$('#vtSty');sty.innerHTML=Object.keys(VTSTY).map(function(k){return '<button data-vts="'+k+'">'+VTSTY[k].n+'</button>';}).join('');
  $('#vtSc').innerHTML='<option value="song">Scale of the song</option><option value="chrom">Chromatic (every note)</option><option value="custom">Custom (tap the notes below)</option>'+Object.keys(BMODE).map(function(k){return '<option value="'+k+'">'+BMODE[k].n+'</option>';}).join('');
  $('#vtKey').innerHTML='<option value="">Key of the song</option>'+GNOTE.map(function(n,i){return '<option value="'+i+'">'+n+'</option>';}).join('');
  try{VT.all=localStorage.getItem('ecou.vtAll')==='1';}catch(e){}
  $$('[data-vts]').forEach(function(b){b.addEventListener('click',function(){var v=vtSet(),p=VTSTY[b.getAttribute('data-vts')];v.st=b.getAttribute('data-vts');v.amt=p.amt;vtMorph(v,p.mor);vtUI();vtSchedule();});});
  $('#vtMor').addEventListener('input',function(e){var v=vtSet();vtMorph(v,+e.target.value);v.st='';vtUI();vtSchedule();});
  [['vtAmt','amt'],['vtSpd','spd'],['vtHum','hum'],['vtFmt','fmt'],['vtThr','thr'],['vtVib','vib'],['vtVibR','vibR']].forEach(function(q){$('#'+q[0]).addEventListener('input',function(e){var v=vtSet();v[q[1]]=+e.target.value;if(q[1]==='spd'||q[1]==='hum')v.st='';vtUI();vtSchedule();});});
  $('#vtBand').addEventListener('change',function(e){vtSet().band=e.target.checked;vtSchedule();});
  $('#vtSc').addEventListener('change',function(e){var v=vtSet();if(e.target.value==='custom'&&!v.pcs)v.pcs=vtScale(v);v.sc=e.target.value;vtUI();vtSchedule();});$('#vtKey').addEventListener('change',function(e){vtSet().k=e.target.value===''?null:+e.target.value;vtUI();vtSchedule();});
  $('#vtKeys').addEventListener('click',function(e){var b=e.target.closest('[data-vpc]');if(!b)return;var v=vtSet(),pc=+b.getAttribute('data-vpc'),p=vtScale(v),i=p.indexOf(pc);if(i>=0){if(p.length<2){toast('Keep at least one target note.');return;}p.splice(i,1);}else p.push(pc);p.sort(function(a,c){return a-c;});v.pcs=p;v.sc='custom';vtUI();vtSchedule();});
  $('#vtDet').addEventListener('click',function(){var v=vtSet(),A=VT.A;if(!v||!A)return;var h=new Float32Array(12),k,i;for(k=0;k<A.F;k++){var m=A.m[k];if(!isNaN(m))h[((Math.round(m)%12)+12)%12]+=A.rms[k];}
    var MJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],MN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17],best=-1e9,bk=0,bm=0;
    for(var r=0;r<12;r++)for(var q=0;q<2;q++){var P=q?MN:MJ,s=0;for(i=0;i<12;i++)s+=h[(r+i)%12]*P[i];if(s>best){best=s;bk=r;bm=q;}}
    v.k=bk;v.sc=bm?'aeolian':'ionian';vtUI();vtSchedule();toast('Your voice sounds like '+GNOTE[bk]+(bm?' minor':' major')+' — tuning to it.',2400);});
  $('#vtAll').addEventListener('click',function(){VT.all=!VT.all;try{localStorage.setItem('ecou.vtAll',VT.all?'1':'0');}catch(e){}$('#vtSheet').classList.toggle('all',VT.all);this.setAttribute('aria-pressed',VT.all);this.textContent=VT.all?'Hide extra options':'Show all options';vtUI();requestAnimationFrame(vtDraw);});
  $('#vtA').addEventListener('click',function(){vtAB(false);});$('#vtB').addEventListener('click',function(){vtAB(true);});
  $('#vtPlay').addEventListener('click',function(){vtPreview(false,false);});$('#vtRaw').addEventListener('click',function(){vtPreview(false,true);});
  $('#vtLoop').addEventListener('click',function(){VT.loop=!VT.loop;if(VT.au)vtPreview(true,VT.auRaw,vtPos());else vtUI();});
  $('#vtX').addEventListener('click',vtClose);$('#vtRm').addEventListener('click',vtRemove);
  $('#vtSheet').addEventListener('click',function(e){if(e.target.getAttribute('data-vtclose'))vtClose();var j=e.target.closest('[data-hjump]');if(j)vtGoClip(+j.getAttribute('data-hjump')||j.getAttribute('data-hjump'));});
  $$('[data-vth]').forEach(function(b){b.addEventListener('click',function(){vtHarmony(+b.getAttribute('data-vth'));});});
  var hl=$('#vtHl');function hid(e){var r=e.target.closest('[data-hid]');if(!r)return null;var id=r.getAttribute('data-hid');return clipById(+id)||clipById(id);}
  hl.addEventListener('click',function(e){var h=hid(e);if(!h)return;if(e.target.closest('[data-hgo]'))vtGoClip(h.id);if(e.target.closest('[data-hdel]'))vtHarmDel(h.id);});
  hl.addEventListener('input',function(e){var h=hid(e),k=e.target.getAttribute('data-hk');if(!h||!k)return;var t=tracks[h.ti];if(k==='vol'||k==='pan'){t[k]=+e.target.value;try{applyMix();}catch(x){}markDirty();}});
  hl.addEventListener('change',function(e){var h=hid(e);if(!h)return;if(e.target.hasAttribute('data-hint')){h.hv.st=+e.target.value;vtHarmRender(h);vtHarmUI();}else if(e.target.getAttribute('data-hk')==='fmt'){h.hv.fmt=+e.target.value;vtHarmRender(h);}else return;if(VT.au&&!VT.auRaw)vtPreview(true,false,vtPos());});
  function cur(){return VT.N&&VT.N[VT.sel];}
  function mv(d){var n=cur();if(!n)return;vtPushUndo();var T=vtStep(n.T,d,n.pcs||VT._sc);vtEd(n,{dt:T-n.T0});n.T=T;n.dt=T-n.T0;vtDraw();vtUI();}
  $('#vtUp').addEventListener('click',function(){mv(1);});$('#vtDn').addEventListener('click',function(){mv(-1);});
  $('#vtFlat').addEventListener('click',function(){var n=cur();if(!n)return;vtPushUndo();n.flat=!n.flat;vtEd(n,{flat:n.flat});vtUI();});
  $('#vtRst').addEventListener('click',function(){var n=cur();if(!n)return;vtPushUndo();n.dt=0;n.flat=false;n.T=n.T0;n.tr=null;n.hum=null;vtEd(n,{dt:0,flat:false,tr:null,hum:null});vtDraw();vtUI();});
  $('#vtSplit').addEventListener('click',function(){var n=cur(),v=vtSet();if(!n)return;if(n.b-n.a<16){toast('This note is too short to split.');return;}vtPushUndo();(v.sp||(v.sp=[])).push((n.a+n.b)>>1);vtRender();toast('Note split in two — move each half on its own.',1800);});
  $('#vtMerge').addEventListener('click',function(){var v=vtSet(),nx=VT.N&&VT.N[VT.sel+1];if(!nx)return;vtPushUndo();(v.mg||(v.mg=[])).push(nx.a);if(v.sp)v.sp=v.sp.filter(function(f){return f!==nx.a;});vtRender();toast('Merged with the next note.',1500);});
  $('#vtNTr').addEventListener('input',function(e){var n=cur();if(!n)return;if(!VT.ntr){vtPushUndo();VT.ntr=1;}n.tr=+e.target.value;vtEd(n,{tr:n.tr});vtUI();});
  $('#vtNHum').addEventListener('input',function(e){var n=cur();if(!n)return;if(!VT.ntr){vtPushUndo();VT.ntr=1;}n.hum=+e.target.value;vtEd(n,{hum:n.hum});vtUI();});
  ['vtNTr','vtNHum'].forEach(function(id){$('#'+id).addEventListener('change',function(){VT.ntr=0;});});
  function vtSnapEd(v){return JSON.stringify({ed:v.ed||{},sp:v.sp||[],mg:v.mg||[],vm:v.vm||null});}
  $('#vtUndo').addEventListener('click',function(){var v=vtSet();if(!v||!VT.undo||!VT.undo.length)return;(VT.redo||(VT.redo=[])).push(vtSnapEd(v));var o=JSON.parse(VT.undo.pop());v.ed=o.ed;v.sp=o.sp;v.mg=o.mg;if('vm' in o){if(o.vm)v.vm=o.vm;else delete v.vm;VM.sig='';}clearTimeout(VT.t);vtRender();vmUI();toast('Undone.',1000);});
  $('#vtRedo').addEventListener('click',function(){var v=vtSet();if(!v||!VT.redo||!VT.redo.length)return;(VT.undo||(VT.undo=[])).push(vtSnapEd(v));var o=JSON.parse(VT.redo.pop());v.ed=o.ed;v.sp=o.sp;v.mg=o.mg;if('vm' in o){if(o.vm)v.vm=o.vm;else delete v.vm;VM.sig='';}clearTimeout(VT.t);vtRender();vmUI();toast('Redone.',1000);});
  /* pitch editor: pointer events work for touch, pen and mouse; touch-action:none on the canvas, capture while dragging, the sheet cannot scroll mid-drag */
  var cv=$('#vtCv');
  cv.addEventListener('pointerdown',function(e){if(e.button>0)return;var i=vtHit(e);VT.sel=i;if(i<0){vtDraw();vtUI();return;}e.preventDefault();var n=VT.N[i];vtPushUndo();VT.drag={id:e.pointerId,y:e.clientY,T:n.T};try{cv.setPointerCapture(e.pointerId);}catch(x){}cv.classList.add('drag');if(navigator.vibrate)try{navigator.vibrate(8);}catch(x){}vtDraw();vtUI();});
  cv.addEventListener('pointermove',function(e){var D=VT.drag;if(!D||D.id!==e.pointerId)return;e.preventDefault();var G=vtGeom(),n=VT.N[VT.sel];if(!G||!n)return;var raw=D.T+Math.round((D.y-e.clientY)/(cv.currentCSSZoom||1)/G.rh),pcs=n.pcs||VT._sc,T=raw,off=pcs.indexOf(((raw%12)+12)%12)<0;
    if(off){var dir=raw>=D.T?1:-1,q;T=null;for(q=1;q<12&&T==null;q++){if(pcs.indexOf((((raw+dir*q)%12)+12)%12)>=0)T=raw+dir*q;else if(pcs.indexOf((((raw-dir*q)%12)+12)%12)>=0)T=raw-dir*q;}if(T==null)T=n.T;
      if(D.sn!==raw){D.sn=raw;toast(GNOTE[((raw%12)+12)%12]+' is switched off in your notes — snapped to '+nname(T)+'.',1400);}}else D.sn=null;
    if(T!==n.T){n.T=T;n.dt=T-n.T0;vtDraw();vtUI();}});
  function up(e){var D=VT.drag;if(!D||D.id!==e.pointerId)return;VT.drag=null;cv.classList.remove('drag');try{cv.releasePointerCapture(e.pointerId);}catch(x){}var n=VT.N[VT.sel];if(n&&n.T!==D.T){vtEd(n,{dt:n.T-n.T0});toast('Note moved to '+nname(n.T)+'.',1000);}else if(VT.undo)VT.undo.pop();vtUI();}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('lostpointercapture',up);
  cv.addEventListener('touchstart',function(e){if(VT.A&&vtHit(e.touches[0])>=0)e.preventDefault();},{passive:false});
  cv.addEventListener('touchmove',function(e){if(VT.drag)e.preventDefault();},{passive:false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault();});
  document.addEventListener('click',function(e){if(e.target&&e.target.id==='vtCapBtn')vtOpenSlot('A');});
  $('#vtLiveCap').addEventListener('click',function(){vtLiveToggle(!VTL.on);});
  $('#dawVt').addEventListener('change',function(e){vtLiveToggle(e.target.checked);});
  vtLiveUI();document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#vtSheet').hidden)vtClose();});
}
/* ---------- VOICE MORPH v1 (Sound › 02 Transform › Vocal Studio): voice cards on top of vtDef ----------
   A card is a set of physical/artistic settings, never a person. Engine choices:
   - body (vocal-tract length): the source is spectral-envelope warped (vmWarp, cepstral envelope, STFT) by 2^(-body/12) before PSOLA; grain resampling
     alone under-delivered (±4 st moved the LPC formants only 1–4.5 st). PSOLA then runs at phi=1, so the pitch is untouched.
   - register: semitones added to the PSOLA shift curve on voiced frames (formants kept).
   - grit: per-grain period jitter + amplitude shimmer; growl (render only): alternating grain gain = sub-octave + soft saturation.
   - breath: band-passed noise shaped by the take's envelope, boosted after onsets; bright: 3 kHz peak + linked de-ess; nasal: 500 Hz dip + 1 kHz peak.
   - vibrato depth/rate/onset and entry style (scoop/fall/slide on notes >=150 ms) are added to the shift curve (render only).
   - double: two extra PSOLA voices at ±8 ct, 12–25 ms; L/R sum equals the mono mix (mono-safe). Output RMS is matched to the input. */
