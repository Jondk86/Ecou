var pads=[],padSel=0,padVoices=[],flashQ=[],stepQ=[],curStep=-1;
var PADCOL={kick:'#D4FF3A',snare:'#5CE1E6',hat:'#FF8A5B',perc:'#B69CFF',fx:'#F4F4F7',other:'#8A8A9A'};
var PADNAMES=['Kick','Snare','Clap','Rim','Closed Hat','Open Hat','Shaker','Cowbell','Tom Lo','Tom Mid','Tom Hi','Crash','808 Sub','Zap','Glass','Choir'];
var PADCLS=['kick','snare','snare','perc','hat','hat','hat','perc','perc','perc','perc','hat','kick','fx','fx','fx'];
for(var pi0=0;pi0<16;pi0++)pads.push({name:PADNAMES[pi0],cls:PADCLS[pi0],buf:null,level:1,tune:0,decay:1,pan:0,choke:(pi0===4||pi0===5)?1:0,pat:new Array(16).fill(false)});
function trigPad(i,vel,when,semi){
  if(!ensureAudio())return;if(fm1Out(0)&&!offlineRender){var tw=Math.max(when||0,ctx.currentTime),nn=36+i,v7=Math.max(1,Math.min(127,Math.round((vel==null?0.8:vel)*127)));fm1Note(0,nn,v7,tw,true);fm1Note(0,nn,0,tw+0.09,false);return;}if(roSkip(0)){var pk=pads[i];if(pk&&pk.buf&&pk.cls==='kick')duckAt(Math.max(when||0,ctx.currentTime));return;}var p=pads[i];if(!p||!p.buf)return;
  var t=Math.max(when||0,ctx.currentTime);
  if(p.choke){padVoices.forEach(function(v){if(v.choke===p.choke&&!v.dead){v.dead=true;v.g.gain.cancelScheduledValues(t);v.g.gain.setTargetAtTime(0,t,0.008);try{v.src.stop(t+0.06);}catch(e){}}});}
  var src=ctx.createBufferSource(),vb=p.vb;src.buffer=vb&&vb.length?vb[Math.min(vb.length-1,Math.floor(clamp(vel==null?0.8:vel,0,0.999)*vb.length*1.1))]:p.buf;src.playbackRate.value=Math.pow(2,(p.tune+(semi||0))/12);
  var g=ctx.createGain(),lv=p.level*vel;g.gain.setValueAtTime(lv,t);
  if(p.decay<0.99)g.gain.setTargetAtTime(0,t+0.008,0.01+p.decay*p.decay*0.6);
  var pan=PAN(p.pan);src.connect(g);g.connect(pan);pan.connect(tracks[0].n.in);src.start(t);if(offlineRender)offNodes.push({e:t+p.buf.duration/src.playbackRate.value+0.05,n:pan});if(p.cls==='kick')duckAt(t);
  var v={src:src,g:g,choke:p.choke,dead:false,end:t+p.buf.duration/src.playbackRate.value};padVoices.push(v);
  src.onended=function(){v.dead=true;try{pan.disconnect();}catch(e){}padVoices=padVoices.filter(function(x){return x!==v;});};
  flashQ.push({i:i,t:t});
}
function keysBase(){if(!(keysSrc>0&&tracks[keysSrc]))return 60;return keysSrc===3||/bass/i.test(tracks[keysSrc].name)?48:72;}
function padKeyLabels(){if(!keysMode)return;$$('#pads .pad').forEach(function(el,i){var b=el.querySelector('b');if(b)b.textContent=nname(keysBase()+keySemi(i)+12*keysOct);});}
var keysSrc=1,keysOct=0,keysDown={};
function renderKeysSrc(){var sel=$('#keysSrc');if(!sel)return;var opts=tracks.map(function(t,i){return t.kind==='keys'?'<option value="'+i+'"'+(i===keysSrc?' selected':'')+'>'+t.name+'</option>':'';}).join('')+'<option value="0"'+(keysSrc===0?' selected':'')+'>Selected pad sound</option>';sel.innerHTML=opts;}
function renderPads(){
  var w=$('#pads');
  w.innerHTML=pads.map(function(p,i){var has=p.pat.some(Boolean);return '<button class="pad'+(i===padSel?' sel':'')+(p.buf?'':' empty')+'" data-pad="'+i+'" aria-pressed="'+(i===padSel)+'" aria-label="Pad '+(i+1)+' '+p.name+'"><b>'+p.name+'</b>'+(has?'<span class="dot"></span>':'')+'<i style="background:'+(PADCOL[p.cls]||PADCOL.other)+'"></i></button>';}).join('');
  padKeyLabels();
}
function selectPad(i){
  padSel=i;var p=pads[i];
  $$('#pads .pad').forEach(function(el,j){el.classList.toggle('sel',j===i);el.setAttribute('aria-pressed',j===i?'true':'false');});
  $('#padName').textContent=(i+1)+' · '+p.name;
  P.padLevel.v=p.level;P.padTune.v=p.tune;P.padDecay.v=p.decay;P.padPan.v=p.pan;
  ['padLevel','padTune','padDecay','padPan'].forEach(function(k){syncParam(k);});
  $$('[data-ch]').forEach(function(b){b.setAttribute('aria-pressed',(+b.getAttribute('data-ch')===p.choke)?'true':'false');});
  var cv=$('#padWave');if(p.buf)drawWave(cv,p.buf.getChannelData(0));else{var g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);}
  paintSteps();
}
function paintSteps(){
  var p=pads[padSel],w=$('#steps'),off=page*16;
  if(!w.children.length){var h='';for(var q=0;q<16;q++)h+='<button data-st="'+q+'" aria-pressed="false" aria-label="Step '+(q+1)+'"'+(q%4===0?' class="beat"':'')+'>'+(q%4===0?(q/4+1):'')+'</button>';w.innerHTML=h;
    $$('#steps button').forEach(function(b){b.addEventListener('click',function(){var q=+b.getAttribute('data-st')+page*16;if(q>=patterns[curPat].len)return;pads[padSel].pat[q]=!pads[padSel].pat[q];markDirty();paintSteps();renderPadDots();renderPatSegs();});});}
  $$('#steps button').forEach(function(b,q){var k=off+q,on=!!p.pat[k],ap=on?'true':'false',lb='Step '+(k+1)+' of '+p.name;b.classList.toggle('on',on);if(b.getAttribute('aria-pressed')!==ap)b.setAttribute('aria-pressed',ap);if(b.getAttribute('aria-label')!==lb)b.setAttribute('aria-label',lb);b.classList.toggle('now',seq.on&&seq.audPat===curPat&&k===curStep);});paintSteps.k=padSel+':'+page+':'+curPat;
  $('#seqInfo').textContent=p.name+' · pattern '+patterns[curPat].name+(patterns[curPat].len>16?' · bar '+(page+1):'')+' · '+Math.round(P.bpm.v)+' BPM';
  var cb=$('#seqCopyBar');if(cb)cb.hidden=patterns[curPat].len<=16;
}
function paintStepCursor(){var w=$('#steps');if(!w||!w.children.length||curStep%4===0||paintSteps.k!==padSel+':'+page+':'+curPat){paintSteps();return;}var off=page*16,k=seq.on&&seq.audPat===curPat?curStep-off:-1,pv=w.querySelector('.now');if(pv&&+pv.getAttribute('data-st')!==k)pv.classList.remove('now');if(k>=0&&k<16)w.children[k].classList.add('now');}
function renderPadDots(){$$('#pads .pad').forEach(function(el,i){var has=pads[i].pat.some(Boolean),d=el.querySelector('.dot');if(has&&!d){d=document.createElement('span');d.className='dot';el.appendChild(d);}if(!has&&d)d.remove();});}
/* demo kit synthesis */
function kitBuf(dur,fn){var sr=ctx.sampleRate,n=Math.floor(dur*sr),b=ctx.createBuffer(1,n,sr),d=b.getChannelData(0),st={};for(var i=0;i<n;i++)d[i]=fn(i/sr,st);normalize(d);var f=Math.floor(sr*0.003);for(var j=0;j<f;j++)d[n-1-j]*=j/f;return b;}
function hpN(st,a){var x=Math.random()*2-1,y=a*((st.y||0)+x-(st.x||0));st.x=x;st.y=y;return y;}
function bpN(st,a,b){var h=hpN(st,a);st.l=(st.l||0)+b*(h-(st.l||0));return st.l;}
var KITFAC='';function kitSig(){return pads.map(function(p){return [p.name,p.cls,p.level,p.tune,p.decay,p.pan,p.choke].join(':');}).join('|');}
function makeKit(){
  var TP=2*Math.PI,sr=ctx.sampleRate;
  var B=[
    kitBuf(0.55,function(t,s){s.ph=(s.ph||0)+TP*(44+120*Math.exp(-t*32))/sr;return Math.sin(s.ph)*Math.exp(-t*6.5)+(t<0.004?(Math.random()*2-1)*0.4:0);}),
    kitBuf(0.3,function(t,s){return Math.sin(TP*185*t)*Math.exp(-t*22)*0.55+hpN(s,0.9)*Math.exp(-t*15);}),
    kitBuf(0.4,function(t,s){var n=bpN(s,0.85,0.35),e=0;[0,0.011,0.023].forEach(function(o){if(t>=o)e+=Math.exp(-(t-o)*180);});return n*(e+0.6*Math.exp(-t*14)*(t>0.023?1:0));}),
    kitBuf(0.08,function(t,s){return Math.sin(TP*1750*t)*Math.exp(-t*90)+hpN(s,0.8)*Math.exp(-t*160)*0.35;}),
    kitBuf(0.09,function(t,s){return hpN(s,0.97)*Math.exp(-t*55);}),
    kitBuf(0.6,function(t,s){return hpN(s,0.97)*Math.exp(-t*6.5);}),
    kitBuf(0.14,function(t,s){return hpN(s,0.95)*Math.sin(Math.PI*Math.min(1,t/0.13));}),
    kitBuf(0.35,function(t,s){var q=(Math.sin(TP*540*t)>0?1:-1)+(Math.sin(TP*800*t)>0?1:-1);s.l=(s.l||0)+0.25*(q-(s.l||0));return s.l*Math.exp(-t*11);}),
    kitBuf(0.5,function(t,s){s.ph=(s.ph||0)+TP*90*(1+0.6*Math.exp(-t*25))/sr;return Math.sin(s.ph)*Math.exp(-t*7);}),
    kitBuf(0.45,function(t,s){s.ph=(s.ph||0)+TP*135*(1+0.6*Math.exp(-t*25))/sr;return Math.sin(s.ph)*Math.exp(-t*8);}),
    kitBuf(0.4,function(t,s){s.ph=(s.ph||0)+TP*190*(1+0.6*Math.exp(-t*25))/sr;return Math.sin(s.ph)*Math.exp(-t*9);}),
    kitBuf(2,function(t,s){return hpN(s,0.96)*Math.exp(-t*2.3)*(0.8+0.2*Math.sin(TP*6*t));}),
    kitBuf(1.6,function(t,s){s.ph=(s.ph||0)+TP*(48+18*Math.exp(-t*18))/sr;return Math.tanh(1.8*Math.sin(s.ph))*Math.exp(-t*1.6);}),
    kitBuf(0.3,function(t,s){s.ph=(s.ph||0)+TP*(120+2200*Math.exp(-t*16))/sr;return Math.sin(s.ph)*Math.exp(-t*9);})
  ];
  for(var i=0;i<16;i++){var p=pads[i];p.name=PADNAMES[i];p.cls=PADCLS[i];p.level=1;p.tune=0;p.decay=1;p.pan=0;p.choke=(i===4||i===5)?1:0;p.pat.fill(false);p.buf=B[i]||null;}
  loadKit('studio',true);pads[14].buf=slots.A.buf;pads[15].buf=slots.B.buf;pads[15].decay=0.55;pads[14].name=PADNAMES[14];pads[15].name=PADNAMES[15];
  [0,6,8].forEach(function(s){pads[0].pat[s]=true;});[4,12].forEach(function(s){pads[1].pat[s]=true;});
  [0,2,4,6,8,10,12].forEach(function(s){pads[4].pat[s]=true;});pads[5].pat[14]=true;pads[3].pat[11]=true;
  renderPads();selectPad(padSel);
}
/* beatbox -> kit */
function lpCoef(fc,sr){return 1-Math.exp(-2*Math.PI*fc/sr);}
function beatboxToKit(d,sr){
  var hop=Math.max(1,Math.round(sr*0.005)),nf=Math.floor(d.length/hop),E=new Float32Array(nf),pk=0,i,k;
  for(k=0;k<nf;k++){var s=0;for(i=k*hop;i<(k+1)*hop;i++)s+=d[i]*d[i];E[k]=10*Math.log10(s/hop+1e-10);if(E[k]>pk)pk=E[k];}
  var on=[],last=-999;
  for(k=4;k<nf;k++){var mn=Math.min(E[k-1],E[k-2],E[k-3],E[k-4]);if(E[k]-mn>8&&E[k]>pk-32&&k-last>13){var kk=k;while(kk+1<nf&&E[kk+1]>E[kk]&&kk-k<6)kk++;on.push(k*hop);last=k;}}
  if(on.length<2){$('#bbResult').textContent='Not enough hits detected — beatbox louder and closer, with clear gaps between sounds.';return;}
  var a150=lpCoef(150,sr),a4k=lpCoef(4000,sr),hits=[];
  for(var h=0;h<on.length;h++){
    var st=Math.max(0,on[h]-Math.floor(sr*0.004)),en=Math.min(d.length,h+1<on.length?on[h+1]-Math.floor(sr*0.004):on[h]+Math.floor(sr*0.45),on[h]+Math.floor(sr*0.45));
    if(en-st<sr*0.03)continue;
    var seg=d.slice(st,en),lo=0,l4=0,eL=0,eH=0,eT=0,zc=0,pa=0;
    for(i=0;i<seg.length;i++){var x=seg[i];lo+=a150*(x-lo);l4+=a4k*(x-l4);var hi=x-l4;eL+=lo*lo;eH+=hi*hi;eT+=x*x;if(i&&(x>0)!==(seg[i-1]>0))zc++;var ax=Math.abs(x);if(ax>pa)pa=ax;}
    var lr=eL/(eT+1e-12),hr=eH/(eT+1e-12),z=zc/seg.length,cls;
    if(lr>0.42)cls='kick';else if(hr>0.42)cls='hat';else if(hr>0.12||z>0.12)cls='snare';else cls='perc';
    var f=Math.floor(sr*0.004);for(i=0;i<f&&i<seg.length;i++)seg[seg.length-1-i]*=i/f;
    hits.push({t:on[h]/sr,seg:seg,cls:cls,peak:pa,energy:eT});
  }
  var SLOT={kick:0,snare:1,hat:4,perc:3},LBL={kick:'BB Kick',snare:'BB Snare',hat:'BB Hat',perc:'BB Perc'},best={},count={kick:0,snare:0,hat:0,perc:0};
  hits.forEach(function(x){count[x.cls]++;if(!best[x.cls]||x.energy>best[x.cls].energy)best[x.cls]=x;});
  var iois=[];for(i=1;i<hits.length;i++){var dt=hits[i].t-hits[i-1].t;if(dt>0.07&&dt<1.2)iois.push(dt);}
  iois.sort(function(a,b){return a-b;});var bpm=P.bpm.v;
  if(iois.length){var m=iois[Math.floor(iois.length/2)];bpm=60/(2*m);while(bpm<70)bpm*=2;while(bpm>140)bpm/=2;
    var bestB=bpm,be=1e9;for(var cand=bpm*0.94;cand<=bpm*1.06;cand+=0.25){var sdur=60/cand/4,err=0;hits.forEach(function(x){var q=(x.t-hits[0].t)/sdur;err+=Math.pow(q-Math.round(q),2);});if(err<be){be=err;bestB=cand;}}bpm=Math.round(bestB);P.bpm.v=bpm;syncParam('bpm');updDelayTime();}
  Object.keys(best).forEach(function(c){var x=best[c],b=ctx.createBuffer(1,x.seg.length,sr);b.getChannelData(0).set(normalize(x.seg));var p=pads[SLOT[c]];p.buf=b;p.name=LBL[c];p.cls=c;p.tune=0;p.decay=1;p.level=1;});
  pads.forEach(function(p){p.pat.fill(false);});
  var stepDur=60/bpm/4,t0=hits[0].t;
  hits.forEach(function(x){var sI=Math.round((x.t-t0)/stepDur);if(sI<patterns[curPat].len)pads[SLOT[x.cls]].pat[sI]=true;});
  renderPads();selectPad(SLOT[hits[0].cls]);renderPatSegs();markDirty();
  var parts=[];['kick','snare','hat','perc'].forEach(function(c){if(count[c])parts.push(count[c]+' '+c+(count[c]>1?'s':''));});
  $('#bbResult').textContent=hits.length+' hits · '+parts.join(', ')+' · '+bpm+' BPM. Pattern written to the sequencer — press Play.';
  toast('Kit built from your beatbox.');
}
/* ---------- SMART SLICER (Transform): any sound -> a playable kit on the pads ----------
   Hits: energy-rise onset function (broadband + first-difference/HF-weighted log energy, a cheap spectral-flux stand-in),
   adaptive threshold (local mean ±150 ms × k + δ), minimum gap, level gate; onsets refined to ~0.7 ms. Grid: 4/8/16 or beat-synced. Manual: tap/drag/tap. */
var SL={d:null,sr:48000,name:'',from:'A',mode:'tr',sens:0.5,grid:8,cuts:[],ons:[],sel:0,rev:{},pit:{},start:0,userStart:false,A:null,armed:false,bpm:0,ms:0};
var SLMAX=16,SLPRE=0.002;
function slMono(b){var n=Math.min(b.length,Math.floor(b.sampleRate*30)),c=b.numberOfChannels,d=new Float32Array(n),k,i;for(k=0;k<c;k++){var s=b.getChannelData(k);for(i=0;i<n;i++)d[i]+=s[i];}if(c>1)for(i=0;i<n;i++)d[i]/=c;return d;}
function slAnalyse(d,sr){
  var hop=Math.max(64,Math.round(sr*0.005)),nf=Math.floor(d.length/hop),L=new Float32Array(nf),H=new Float32Array(nf),o=new Float32Array(nf),prev=0,mx=-200,k,i;
  for(k=0;k<nf;k++){var e=0,h=0,end=(k+1)*hop;for(i=k*hop;i<end;i++){var x=d[i],df=x-prev;prev=x;e+=x*x;h+=df*df;}L[k]=10*Math.log(e/hop+1e-12)/Math.LN10;H[k]=10*Math.log(h/hop+1e-12)/Math.LN10;if(L[k]>mx)mx=L[k];}
  for(k=2;k<nf;k++){var r=0.5*(L[k]-Math.min(L[k-1],L[k-2]))+0.5*(H[k]-Math.min(H[k-1],H[k-2]));o[k]=r>0?r:0;}
  var cs=new Float64Array(nf+1);for(k=0;k<nf;k++)cs[k+1]=cs[k]+o[k];
  return {hop:hop,fps:sr/hop,L:L,o:o,cs:cs,mx:mx,nf:nf};
}
function slPick(A,d,sens){
  var o=A.o,L=A.L,nf=A.nf,W=Math.round(0.15*A.fps),delta=2.5+9*(1-sens),mult=1.2+0.8*(1-sens),gate=A.mx-(24+30*sens),gap=Math.round((0.03+0.06*(1-sens))*A.fps),c=[],k;
  for(k=2;k<nf-2;k++){var v=o[k];if(v<=delta||v<o[k-1]||v<=o[k+1]||v<o[k-2]||v<o[k+2])continue;
    var a=Math.max(0,k-W),b=Math.min(nf,k+W+1),thr=(A.cs[b]-A.cs[a])/(b-a)*mult+delta;if(v<=thr||Math.max(L[k],L[k+1])<gate)continue;
    var last=c[c.length-1];if(last&&k-last.k<gap){if(v>last.v){last.k=k;last.v=v;}continue;}c.push({k:k,v:v});}
  if(c.length>SLMAX){c.sort(function(x,y){return y.v-x.v;});c=c.slice(0,SLMAX).sort(function(x,y){return x.k-y.k;});}
  return c.map(function(x){return slRefine(d,x.k,A.hop);});
}
/* sample-accurate onset: first 32-sample block whose peak climbs 30 % of the way from the pre-onset level to the hit's peak */
function slRefine(d,k,hop){var B=32,a=Math.max(0,(k-2)*hop),b=Math.min(d.length,(k+2)*hop),nb=Math.floor((b-a)/B),p=new Float32Array(nb),j,i,top=0;if(nb<3)return k*hop;
  for(j=0;j<nb;j++){var m=0;for(i=a+j*B;i<a+j*B+B;i++){var x=d[i]<0?-d[i]:d[i];if(x>m)m=x;}p[j]=m;if(m>top)top=m;}
  var base=Math.min(p[0],p[1]),t=base+0.3*(top-base);for(j=0;j<nb;j++)if(p[j]>t)return a+j*B;return k*hop;}
function slTempoBpm(){if(SL.bpm)return SL.bpm;var b=SL.src&&SL.src.length>SL.sr*2.2?detectBpm(SL.src):0;SL.bpm=b||Math.round(P.bpm.v);return SL.bpm;}
function slCompute(){
  var d=SL.d,n=d.length,sr=SL.sr,pre=Math.round(sr*SLPRE);SL.rev={};SL.pit={};SL.armed=false;
  if(SL.mode==='tr'){var t0=performance.now();if(!SL.A)SL.A=slAnalyse(d,sr);SL.ons=slPick(SL.A,d,SL.sens);SL.ms=performance.now()-t0;SL.cuts=SL.ons.map(function(x){return Math.max(0,x-pre);});}
  else if(SL.mode==='grid'){var g=SL.grid,c=[];if(g==='beat'){if(!SL.A)SL.A=slAnalyse(d,sr);var on=slPick(SL.A,d,0.5),off=on.length&&on[0]<sr*0.5?Math.max(0,on[0]-pre):0,bpm=slTempoBpm(),st=60/bpm/2*sr;if((n-off)/st>SLMAX)st*=2;while((n-off)/st>SLMAX)st*=2;for(var x=off;x<n-sr*0.01&&c.length<SLMAX;x+=st)c.push(Math.round(x));}
    else for(var i=0;i<g;i++)c.push(Math.round(i*n/g));SL.cuts=c;}
  if(SL.sel>=SL.cuts.length)SL.sel=0;slFixStart();slUI();
}
function slUser(p){return !!(p&&p.buf&&(p.buf._cap||p.buf._slc||/^BB /.test(p.name)));}
function slFixStart(){var n=Math.max(1,SL.cuts.length),s,i,ok;if(!SL.userStart&&SL.from!=='pad'){SL.start=-1;
    var tries=[0,4,8,12];for(s=0;s<=16-n;s++)if(tries.indexOf(s)<0)tries.push(s);
    for(var t=0;t<tries.length&&SL.start<0;t++){s=tries[t];if(s+n>16)continue;ok=true;for(i=s;i<s+n;i++)if(slUser(pads[i])){ok=false;break;}if(ok)SL.start=s;}
    if(SL.start<0)SL.start=padSel;}
  SL.start=Math.max(0,Math.min(SL.start,16-n));}
function slBuild(i){var a=SL.cuts[i],b=i+1<SL.cuts.length?SL.cuts[i+1]:SL.d.length,seg=SL.d.slice(a,b),n=seg.length,sr=SL.sr,j;if(SL.rev[i])seg.reverse();
  var fi=Math.min(n>>2,Math.round(sr*0.002)),fo=Math.min(n>>1,Math.round(sr*0.008));for(j=0;j<fi;j++)seg[j]*=j/fi;for(j=0;j<fo;j++)seg[n-1-j]*=j/fo;
  normCap(seg,sr);var buf=ctx.createBuffer(1,Math.max(1,n),sr);buf.getChannelData(0).set(seg);buf._slc=1;return buf;}
function slPlay(i){if(!ensureAudio()||i<0||i>=SL.cuts.length)return;if(SL.au){try{SL.au.stop();}catch(e){}}var s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=slBuild(i);s.playbackRate.value=Math.pow(2,(SL.pit[i]||0)/12);g.gain.value=0.9;s.connect(g);g.connect(tracks[0].n.in);s.start();SL.au=s;s.onended=function(){try{g.disconnect();}catch(e){}};SL.sel=i;slDraw();slChips();slProUI();}
function slAt(x){var c=SL.cuts,i=-1;for(var j=0;j<c.length;j++)if(c[j]<=x)i=j;return i;}
function slDraw(){var cv=$('#slWave');if(!SL.d||!cv||$('#slSheet').hidden)return;drawWave(cv,SL.d);var g=cv.getContext('2d'),w=cv.clientWidth||300,h=cv.clientHeight||128,n=SL.d.length,c=SL.cuts;
  g.fillStyle='rgba(11,11,16,.6)';g.fillRect(0,0,c.length?c[0]/n*w:w,h);g.font='700 11px system-ui,sans-serif';
  for(var i=0;i<c.length;i++){var x0=c[i]/n*w,x1=(i+1<c.length?c[i+1]:n)/n*w;if(i===SL.sel){g.fillStyle='rgba(92,225,230,.18)';g.fillRect(x0,0,x1-x0,h);}
    g.fillStyle=i===SL.sel?'#5CE1E6':'#F4F4F7';g.fillRect(Math.round(x0),0,2,h);g.fillRect(Math.round(x0),0,9,3);if(x1-x0>14)g.fillText(String(i+1),x0+4,15);}}
function slChips(){$('#slChips').innerHTML=SL.cuts.map(function(c,i){return '<button data-sli="'+i+'" aria-pressed="'+(i===SL.sel)+'" aria-label="Play slice '+(i+1)+'"'+(i===SL.sel?' style="background:var(--ac);color:var(--bg);border-color:var(--ac)"':'')+'>▶ '+(i+1)+(SL.rev[i]?' ⇆':'')+(SL.pit[i]?' '+(SL.pit[i]>0?'+':'')+SL.pit[i]:'')+'</button>';}).join('');}
function slProUI(){var i=SL.sel;$('#slPT').textContent='Slice '+(i+1);$('#slRev').checked=!!SL.rev[i];$('#slPit').value=SL.pit[i]||0;$('#slPo').textContent=(SL.pit[i]>0?'+':'')+(SL.pit[i]||0)+' st';}
function slUI(){var n=SL.cuts.length,dur=SL.d.length/SL.sr;
  $('#slSub').textContent=SL.name+' · '+dur.toFixed(1)+' s · '+n+' slice'+(n===1?'':'s');
  $$('[data-slm]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-slm')===SL.mode?'true':'false');});
  $$('[data-slg]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-slg')===String(SL.grid)?'true':'false');});
  $('#slTrP').hidden=SL.mode!=='tr';$('#slGrP').hidden=SL.mode!=='grid';$('#slBpm').textContent=SL.grid==='beat'?slTempoBpm()+' BPM':'';
  $('#slHint').textContent=SL.mode==='man'?'Tap the wave to add a cut · drag a cut to move it · tap a cut to remove it.':SL.mode==='tr'?(n?'Found '+n+' hit'+(n===1?'':'s')+'. Tap a slice to hear it — drag a cut to fine-tune.':'No clear hits. Raise Sensitivity or try Grid.'):'Equal slices. Tap a slice to hear it.';
  var e=SL.start+n,ow=0;for(var i=SL.start;i<e;i++)if(slUser(pads[i]))ow++;
  $('#slPads').textContent=n?(n>1?'Pads '+(SL.start+1)+'–'+e:'Pad '+(SL.start+1)):'—';
  var sb=$('#slSend');sb.disabled=!n;sb.textContent=SL.armed?'Replace '+ow+' of your pad sound'+(ow>1?'s':'')+'? Tap again':'Send '+n+' slice'+(n===1?'':'s')+' to pads'+(ow?' (replaces '+ow+')':'');
  $('#slPat').textContent=SL.armed?'…or replace them and write the pattern: tap again':'Make a pattern from the groove';
  slChips();slProUI();slDraw();}
function slOpen(from){
  if(!ensureAudio())return;var b=from==='pad'?pads[padSel].buf:(slots[from]&&slots[from].buf);
  if(!b){toast(from==='pad'?'This pad is empty. Record or import a sound first.':'Record or import a sound into Source '+from+' first.');return;}
  if(b.length<b.sampleRate*0.05){toast('That sound is too short to slice.');return;}
  SL.src=b;SL.d=slMono(b);SL.sr=b.sampleRate;SL.from=from;SL.name=from==='pad'?pads[padSel].name:(slots[from].name||'Source '+from);SL.A=null;SL.bpm=0;SL.sel=0;SL.userStart=from==='pad';SL.start=padSel;
  $('#slSheet').hidden=false;SL.mode='tr';slCompute();if(SL.cuts.length<2){SL.mode='grid';SL.grid=SL.d.length/SL.sr>1.5?8:4;slCompute();}
}
function slClose(){$('#slSheet').hidden=true;if(SL.au){try{SL.au.stop();}catch(e){}SL.au=null;}}
function slSend(quiet){var n=SL.cuts.length,s=SL.start,i,ow=0;if(!n||!ensureAudio())return false;for(i=s;i<s+n;i++)if(slUser(pads[i]))ow++;
  if(ow&&!SL.armed&&!quiet){SL.armed=true;slUI();clearTimeout(SL.armT);SL.armT=setTimeout(function(){SL.armed=false;if(!$('#slSheet').hidden)slUI();},3000);return false;}
  SL.armed=false;clearTimeout(hist.timer);histCommit();
  for(i=0;i<n;i++){var p=pads[s+i];p.buf=slBuild(i);p.vb=null;p.name='Slice '+(i+1);p.cls='perc';p.level=1;p.tune=SL.pit[i]||0;p.decay=1;p.pan=0;p.choke=0;}
  renderPads();selectPad(s);markDirty();clearTimeout(hist.timer);histCommit();slUI();return true;}
/* groove -> sequencer: tempo that best explains the hit times on a 1/16 grid (project tempo preferred) */
function slGrooveBpm(){var c=SL.cuts,sr=SL.sr;if(c.length<2)return Math.round(P.bpm.v);
  function err(b){var sd=60/b/4*sr,e=0;for(var i=0;i<c.length;i++){var q=(c[i]-c[0])/sd;e+=Math.pow(q-Math.round(q),2);}return Math.sqrt(e/c.length);}
  var pb=Math.round(P.bpm.v);if(err(pb)<0.12)return pb;var cand=[],db=slTempoBpm();if(db)cand.push(db);
  var io=[];for(var i=1;i<c.length;i++)io.push((c[i]-c[i-1])/sr);io.sort(function(a,b){return a-b;});var m=io[io.length>>1],b0=60/(2*m);while(b0<70)b0*=2;while(b0>150)b0/=2;
  for(var b=b0*0.94;b<=b0*1.06;b+=0.25)cand.push(b);var best=pb,be=err(pb)+0.02;cand.forEach(function(b){var e=err(b);if(e<be){be=e;best=b;}});return Math.round(best);}
function slPattern(){if(!SL.cuts.length)return;var s=SL.start;if(!slSend())return;
  var bpm=slGrooveBpm(),sd=60/bpm/4*SL.sr,pt=patterns[curPat],drop=0,i,q;
  for(i=0;i<SL.cuts.length;i++){var a=pt.drums[s+i];for(q=0;q<a.length;q++)a[q]=false;}
  for(i=0;i<SL.cuts.length;i++){q=Math.round((SL.cuts[i]-SL.cuts[0])/sd);if(q<pt.len)pt.drums[s+i][q]=true;else drop++;}
  var tc=bpm!==Math.round(P.bpm.v);if(tc){P.bpm.v=bpm;syncParam('bpm');updDelayTime();}
  bindPads();paintSteps();renderPadDots();renderPatSegs();markDirty();clearTimeout(hist.timer);histCommit();
  toast('Groove written to pattern '+pt.name+(tc?' at '+bpm+' BPM':'')+(drop?' ('+drop+' hit'+(drop>1?'s':'')+' past the pattern end)':'')+'. Press Play.',3200);}
function initSlicer(){
  ['A','B'].forEach(function(k){var b=$('[data-slice="'+k+'"]');if(b)b.addEventListener('click',function(){slOpen(k);});});
  $('#padSlice').addEventListener('click',function(){slOpen('pad');});
  $('#slX').addEventListener('click',slClose);$('#slSheet').addEventListener('click',function(e){if(e.target.getAttribute('data-slclose'))slClose();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#slSheet').hidden)slClose();});
  $$('[data-slm]').forEach(function(b){b.addEventListener('click',function(){var m=b.getAttribute('data-slm');if(m===SL.mode)return;SL.mode=m;if(m==='man'){if(!SL.cuts.length)SL.cuts=[0];slUI();}else slCompute();});});
  $$('[data-slg]').forEach(function(b){b.addEventListener('click',function(){var g=b.getAttribute('data-slg');SL.grid=g==='beat'?g:+g;slCompute();});});
  $('#slS').addEventListener('input',function(e){SL.sens=+e.target.value;$('#slSo').textContent=Math.round(SL.sens*100)+'%';slCompute();});
  $('#slChips').addEventListener('click',function(e){var b=e.target.closest('[data-sli]');if(b)slPlay(+b.getAttribute('data-sli'));});
  $('#slRev').addEventListener('change',function(e){SL.rev[SL.sel]=e.target.checked;slChips();slPlay(SL.sel);});
  $('#slPit').addEventListener('input',function(e){SL.pit[SL.sel]=+e.target.value;slProUI();slChips();});$('#slPit').addEventListener('change',function(){slPlay(SL.sel);});
  $('#slPm').addEventListener('click',function(){SL.userStart=true;SL.start--;slFixStart();SL.armed=false;slUI();});
  $('#slPp').addEventListener('click',function(){SL.userStart=true;SL.start++;slFixStart();SL.armed=false;slUI();});
  $('#slSend').addEventListener('click',function(){var n=SL.cuts.length,s=SL.start;if(slSend()){slClose();showTab('t-pad');toast(n+' slice'+(n>1?'s':'')+' on pads '+(s+1)+(n>1?'–'+(s+n):'')+'. Tap to play · Undo restores the old pads.',3200);}});
  $('#slPat').addEventListener('click',function(){slPattern();});
  var cv=$('#slWave'),dr=null;
  function pos(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,s:clamp((e.clientX-r.left)/r.width,0,1)*SL.d.length,w:r.width};}
  cv.addEventListener('pointerdown',function(e){if(!SL.d)return;var p=pos(e),near=-1,bd=14;SL.cuts.forEach(function(c,i){var dx=Math.abs(c/SL.d.length*p.w-p.x);if(dx<bd){bd=dx;near=i;}});dr={near:near,x0:p.x,moved:false};try{cv.setPointerCapture(e.pointerId);}catch(x){}});
  cv.addEventListener('pointermove',function(e){if(!dr||dr.near<0)return;var p=pos(e);if(!dr.moved&&Math.abs(p.x-dr.x0)<5)return;
    if(!dr.moved){dr.moved=true;if(SL.mode!=='man'){SL.mode='man';}}var c=SL.cuts,i=dr.near,ml=SL.sr*0.01,lo=i?c[i-1]+ml:0,hi=i+1<c.length?c[i+1]-ml:SL.d.length-ml;c[i]=Math.round(clamp(p.s,lo,hi));SL.sel=i;slDraw();});
  cv.addEventListener('pointerup',function(e){if(!dr)return;var d0=dr;dr=null;var p=pos(e);if(d0.moved){slUI();slPlay(d0.near);return;}
    if(SL.mode==='man'){if(d0.near>=0){if(SL.cuts.length>1){SL.cuts.splice(d0.near,1);SL.rev={};SL.pit={};SL.sel=Math.max(0,d0.near-1);}}
      else if(SL.cuts.length<SLMAX){var ml=SL.sr*0.01,ok=SL.cuts.every(function(c){return Math.abs(c-p.s)>ml;});if(ok){SL.cuts.push(Math.round(p.s));SL.cuts.sort(function(a,b){return a-b;});SL.rev={};SL.pit={};SL.sel=SL.cuts.indexOf(Math.round(p.s));}}
      else toast('16 slices is the maximum — one per pad.');slFixStart();slUI();if(d0.near<0)slPlay(SL.sel);return;}
    slPlay(slAt(p.s));});
  cv.addEventListener('pointercancel',function(){dr=null;});
}
function initPads(){
  renderPads();paintSteps();
  var pw=$('#pads');
  pw.addEventListener('pointerdown',function(e){var b=e.target.closest('.pad');if(!b)return;e.preventDefault();var i=+b.getAttribute('data-pad'),r=b.getBoundingClientRect(),rel=clamp((e.clientY-r.top)/r.height,0,1),vel=0.35+0.65*rel;
    if(nrOn){nrStart(i,vel);if(!keysMode&&i!==padSel)selectPad(i);return;}
    if(keysMode&&keysSrc>0&&tracks[keysSrc]&&tracks[keysSrc].kind==='keys'){if(selTrack!==keysSrc)selectTrack(keysSrc);var mk=keysBase()+keySemi(i)+12*keysOct;try{b.setPointerCapture(e.pointerId);}catch(x){}keysDown[e.pointerId]='pk'+i;noteOn('pk'+i,mk,vel);b.classList.add('hit');return;}
    if(keysMode){var sm=keySemi(i);trigPad(padSel,vel,0,sm);recPad(padSel,vel,sm);b.classList.add('hit');setTimeout(function(){b.classList.remove('hit');},90);return;}
    trigPad(i,vel);recPad(i,vel);if(i!==padSel)selectPad(i);});
  ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(function(ev){pw.addEventListener(ev,function(e){if(keysDown[e.pointerId]){var k=keysDown[e.pointerId];delete keysDown[e.pointerId];noteOff(k);$$('#pads .pad.hit').forEach(function(x){if('pk'+x.getAttribute('data-pad')===k)x.classList.remove('hit');});}if(ev==='lostpointercapture')return;var b=e.target.closest&&e.target.closest('.pad');if(b)nrStop(+b.getAttribute('data-pad'));else nrHeld.forEach(function(j,k){nrStop(k);});});});
  pw.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#seqPlay').addEventListener('click',function(){transportToggle();});
  $('#seqCopyBar').addEventListener('click',function(){var pt=patterns[curPat],o=page*16,n=pt.len/16;pt.drums.forEach(function(a){for(var b=0;b<n;b++){if(b===page)continue;for(var q=0;q<16;q++)a[b*16+q]=a[o+q];}});pt.notes.forEach(function(ns,ti){if(!ti)return;var keep=ns.filter(function(x){return x.s>=o&&x.s<o+16;});pt.notes[ti]=[];for(var b=0;b<n;b++)keep.forEach(function(x){pt.notes[ti].push({s:x.s-o+b*16,l:x.l,m:x.m,v:x.v});});});bindPads();markDirty();paintSteps();renderPadDots();renderPatSegs();drawRoll();toast('Bar '+(page+1)+' copied to all '+n+' bars.',1800);});
  armTap($('#seqClear'),'Tap again to clear',function(){pads[padSel].pat.fill(false);paintSteps();renderPadDots();renderPatSegs();markDirty();toast('Steps cleared for '+pads[padSel].name+'.');});
  $$('[data-ch]').forEach(function(b){b.addEventListener('click',function(){pads[padSel].choke=+b.getAttribute('data-ch');selectPad(padSel);});});
  $('#kitDemo').addEventListener('click',function(){if(ensureAudio()){makeKit();toast('Demo kit loaded.');}});
  $('#padFromA').addEventListener('click',function(){ensureAudio();var p=pads[padSel];p.buf=slots.A.buf;p.name=slots.A.name.slice(0,14);p.cls='fx';renderPads();selectPad(padSel);});
  $('#padFromB').addEventListener('click',function(){ensureAudio();var p=pads[padSel];p.buf=slots.B.buf;p.name=slots.B.name.slice(0,14);p.cls='fx';renderPads();selectPad(padSel);});
  $('#padExp').addEventListener('click',function(){var p=pads[padSel];if(!p.buf)return;saveWav(encodeWav([p.buf.getChannelData(0)],p.buf.sampleRate),'ecou-pad-'+(padSel+1)+'-'+p.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase());});
  $('#padFx').addEventListener('change',function(){tracks[0].fx=$('#padFx').checked;if(ctx)trackRoute(0);renderMixer();markDirty();});
  selectPad(0);
}

/* ---------- DESCRIBE THE SOUND ---------- */
