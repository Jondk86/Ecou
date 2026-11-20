var RH=24,RLAB=40,rollKey={root:0,mode:'minor'},rollTool='note',rollChord='triad',rollClip=null,rp=null;
function scaleOf(){return rollKey.mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];}
function inScale(m){return scaleOf().indexOf(((m-rollKey.root)%12+12)%12)>=0;}
function scaleNotes(){var sc=scaleOf(),out=[];for(var o=0;o<10;o++)sc.forEach(function(d){out.push(rollKey.root+12*o+d);});return out;}
var CHORDST={triad:[0,2,4],sev:[0,2,4,6],nine:[0,2,4,6,8],sus4:[0,3,4],sus2:[0,1,4],power:null};
var rollHm=true,rollInv='auto',rollSel=[],rollBox=null;
function hmFix(notes,root){if(rollKey.mode!=='minor'||!rollHm)return notes;var rpc=((root-rollKey.root)%12+12)%12;if(rpc!==7)return notes;var lt=(rollKey.root+10)%12;return notes.map(function(n){return ((n%12)+12)%12===lt?n+1:n;});}
function invert(v,inv){v=v.slice().sort(function(a,b){return a-b;});if(inv==='open'){if(v.length>=3){v[1]+=12;v.sort(function(a,b){return a-b;});}return v;}var k=+inv||0;for(var i=0;i<k&&i<v.length-1;i++){v[0]+=12;v.sort(function(a,b){return a-b;});}return v;}
function chordAt(m,type){var r=chordAt0(m,type);if(type!=='power')r=hmFix(r,m);if(rollInv!=='auto'&&type!=='power')r=invert(r,rollInv);return r;}
function chordAt0(m,type){
  if(type==='power')return [m,m+7,m+12];
  var sn=scaleNotes(),i=0;while(i<sn.length-1&&sn[i+1]<=m)i++;if(sn[i]!==m&&!inScale(m)){/* off-scale root: chromatic triad */return [m,m+(rollKey.mode==='major'?4:3),m+7];}
  return CHORDST[type].map(function(k){return sn[i+k];});
}
function voiceNear(pcs,prev,lo,hi){ /* pick the inversion closest to the previous chord */
  var best=null,bc=1e9;for(var inv=0;inv<pcs.length;inv++){var r=pcs.slice(inv).concat(pcs.slice(0,inv)),v=[],b=r[0];while(b<lo)b+=12;while(b>=lo+12)b-=12;v.push(b);
    for(var k=1;k<r.length;k++){var x=r[k];while(x<=v[k-1])x+=12;while(x-12>v[k-1])x-=12;v.push(x);}if(v[v.length-1]>hi+5)continue;
    var c=0;if(prev){for(var q=0;q<v.length;q++){var dmin=1e9;prev.forEach(function(p){dmin=Math.min(dmin,Math.abs(p-v[q]));});c+=dmin;}}else c=Math.abs(v[0]-(lo+5));if(c<bc){bc=c;best=v;}}
  return best||pcs.map(function(p){return lo+p%12;});
}
var PROGS=[['i–VI–III–VII',[0,5,2,6]],['i–iv–V–i',[0,3,4,0]],['I–V–vi–IV',[0,4,5,3]],['vi–IV–I–V',[5,3,0,4]],['ii–V–I–I',[1,4,0,0]],['i–VII–VI–V',[0,6,5,4]]];
function stampProg(degs,label){
  if(!ensureAudio())return;var pt=patterns[curPat],ti=songSel,ns=noteArr(pt,ti);var bass=tracks[ti].name==='Bass'||ti===3,bars=pt.len/16,per=bars>=4?16:bars===2?8:4,count=Math.round(pt.len/per);
  pt.notes[ti]=[];var sn=scaleNotes(),prev=null,type=rollChord==='power'?'triad':rollChord;
  for(var k=0;k<count;k++){var d=degs[k%degs.length],root=rollKey.root+48+scaleOf()[d],idx=sn.indexOf(root),st=CHORDST[type]||CHORDST.triad,pcs=st.map(function(q){return sn[idx+q];});
    if(bass){pt.notes[ti].push({s:k*per,l:per,m:36+((root-36)%12+12)%12,v:0.9});continue;}
    pcs=hmFix(pcs,root);var v=rollInv==='auto'?voiceNear(pcs,prev,55,72):(function(){var b=pcs.map(function(x){while(x<55)x+=12;while(x>=67)x-=12;return x;});var base=b.slice().sort(function(a,c){return a-c;});var rp0=((pcs[0]%12)+12)%12,lo=base.filter(function(x){return x%12===rp0;})[0],ord=[lo];pcs.slice(1).forEach(function(x){var y=x;while(y<=ord[ord.length-1])y+=12;while(y-12>ord[ord.length-1])y-=12;ord.push(y);});return invert(ord,rollInv);})();prev=v;v.forEach(function(m){pt.notes[ti].push({s:k*per,l:per,m:m,v:0.78});});}
  markDirty();fitRoll();drawRoll();renderPatSegs();toast((bass?'Bass roots: ':'Chords: ')+label+' in '+NN[rollKey.root]+' '+rollKey.mode+' — voiced for smooth movement.',2400);
}
function rollGeom(e){var cv=$('#roll'),r=zRect(cv,e);return {cv:cv,r:r,cw:(r.width-RLAB)/16};}
function selBar(){var b=$('#rSelBar');if(!b)return;b.hidden=!rollSel.length;$('#rSelN').textContent=rollSel.length+' selected';}
function rollHit(e){var G=rollGeom(e),x=e.clientX-G.r.left,y=e.clientY-G.r.top;if(x<RLAB)return null;var col=(x-RLAB)/G.cw,row=Math.floor(y/RH),m=roll.base+roll.rows-1-row,s=page*16+col;return {x:x,y:y,col:col,row:row,m:m,s:s,cw:G.cw};}
function noteAt(ns,m,s){for(var i=ns.length-1;i>=0;i--){var n=ns[i];if(n.m===m&&n.s<=s&&n.s+n.l>s)return n;}return null;}
function rollDown(e){
  if(!ensureAudio())return;var h=rollHit(e);if(!h||h.row<0||h.row>=roll.rows)return;var pt=patterns[curPat],ns=noteArr(pt,songSel);if(h.s>=pt.len)return;
  try{$('#roll').setPointerCapture(e.pointerId);}catch(x){}
  var n=noteAt(ns,h.m,h.s);
  if(rollTool==='select'){if(n&&rollSel.indexOf(n)>=0){rp={mode:'gmove',h:h,moved:false,o:rollSel.map(function(q){return {n:q,s:q.s,m:q.m};})};return;}
    if(n){rollSel=[n];rp={mode:'gmove',h:h,moved:false,o:[{n:n,s:n.s,m:n.m}]};selBar();drawRoll();return;}
    rollBox={x0:h.x,y0:h.y,x1:h.x,y1:h.y,h:h};rp={mode:'box',h:h,moved:false};return;}
  if(n){var xEnd=RLAB+(n.s+n.l-page*16)*h.cw;rp={mode:(xEnd-h.x<Math.max(10,h.cw*0.35))?'resize':'move',n:n,o:{s:n.s,l:n.l,m:n.m},h:h,moved:false};return;}
  var s0=Math.floor(h.s);
  if(rollTool==='chord'){var ch=chordAt(h.m,rollChord),l=Math.min(roll.nl,pt.len-s0);ch.forEach(function(m){ns.push({s:s0,l:l,m:m,v:0.8});playNote(songSel,m,0.7,ctx.currentTime,Math.min(0.6,l*stepDur()));});markDirty();drawRoll();renderPatSegs();rp=null;return;}
  var nn={s:s0,l:Math.min(roll.nl,pt.len-s0),m:h.m,v:0.85};ns.push(nn);playNote(songSel,h.m,0.8,ctx.currentTime,Math.min(0.4,nn.l*stepDur()));rp={mode:'draw',n:nn,o:{s:nn.s,l:nn.l,m:nn.m},h:h,moved:false};drawRoll();
}
function rollMove(e){
  if(!rp)return;var h=rollHit(e);if(!h)return;var pt=patterns[curPat],dc=h.col-rp.h.col,dr=Math.round((h.y-rp.h.y)/RH);if(Math.abs(h.x-rp.h.x)>6||Math.abs(h.y-rp.h.y)>6)rp.moved=true;if(!rp.moved)return;var n=rp.n,o=rp.o;
  if(rp.mode==='box'){rollBox.x1=h.x;rollBox.y1=h.y;drawRoll();return;}
  if(rp.mode==='gmove'){var dcs=Math.round(dc),mn=1e9,mx=-1e9;o.forEach(function(q){mn=Math.min(mn,q.s);mx=Math.max(mx,q.s);});dcs=clamp(dcs,-mn,pt.len-1-mx);o.forEach(function(q){q.n.s=q.s+dcs;q.n.m=clamp(q.m-dr,0,127);q.n.l=Math.min(q.n.l,pt.len-q.n.s);});drawRoll();return;}
  if(rp.mode==='resize'||rp.mode==='draw'){n.l=clamp(Math.round(o.l+dc),1,pt.len-n.s);}
  else{var ns=clamp(Math.round(o.s+dc),0,pt.len-1),nm=clamp(o.m-dr,0,127);if(nm!==n.m){playNote(songSel,nm,0.6,ctx.currentTime,0.15);}n.s=ns;n.m=nm;n.l=Math.min(o.l,pt.len-ns);}
  drawRoll();
}
function rollUp(){if(!rp)return;var pt=patterns[curPat],ns=pt.notes[songSel];
  if(rp.mode==='box'){var G=rollGeom(),b=rollBox,off=page*16;rollBox=null;if(!rp.moved){rollSel=[];}else{var xa=Math.min(b.x0,b.x1),xb=Math.max(b.x0,b.x1),ya=Math.min(b.y0,b.y1),yb=Math.max(b.y0,b.y1);
      rollSel=(ns||[]).filter(function(n){var x0=RLAB+(n.s-off)*G.cw,x1=x0+n.l*G.cw,y=(roll.base+roll.rows-1-n.m)*RH;return x1>xa&&x0<xb&&y+RH>ya&&y<yb;});}rp=null;selBar();drawRoll();return;}
  if(rp.mode==='gmove'){if(rp.moved){markDirty();renderPatSegs();}rp=null;drawRoll();return;}if(rp.mode==='move'&&!rp.moved){var i=ns.indexOf(rp.n);if(i>=0)ns.splice(i,1);}rp=null;markDirty();drawRoll();renderPatSegs();}
function drawRoll(){
  var cv=$('#roll');if(!cv||!$('#t-song').classList.contains('active')||tracks[songSel].kind!=='keys')return;
  var dpr=window.devicePixelRatio||1,W=cv.clientWidth||340,rh=RH,H=roll.rows*rh,lab=RLAB,cw=(W-lab)/16;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.height=H+'px';}
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  for(var r=0;r<roll.rows;r++){var m=roll.base+roll.rows-1-r,blk=[1,3,6,8,10].indexOf(m%12)>=0,isc=inScale(m),root=((m-rollKey.root)%12+12)%12===0;
    g.fillStyle=root?'#24301A':isc?(blk?'#1A1A24':'#21212D'):(blk?'#111117':'#16161D');g.fillRect(lab,r*rh,W-lab,rh-1);
    g.fillStyle=blk?'#2A2A36':'#3A3A48';g.fillRect(0,r*rh,lab-3,rh-1);g.fillStyle=root?'#D4FF3A':isc?'#F4F4F7':'#7A7A8A';g.font=(m%12===0?'700 ':'600 ')+'10px Inter, system-ui, sans-serif';g.fillText(nname(m),4,r*rh+16);}
  for(var c=0;c<=16;c++){g.fillStyle=c%4===0?'#3A3A48':'#262633';g.fillRect(lab+c*cw,0,1,H);}
  var pt=patterns[curPat],ns=pt.notes[songSel]||[],off=page*16;
  ns.forEach(function(n){if(n.s+n.l<=off||n.s>=off+16||n.m<roll.base||n.m>=roll.base+roll.rows)return;
    var x=lab+(n.s-off)*cw,w=Math.max(6,n.l*cw-2),y=(roll.base+roll.rows-1-n.m)*rh;g.globalAlpha=0.45+0.55*n.v;g.fillStyle=rp&&rp.n===n?'#F4F4F7':'#D4FF3A';g.fillRect(x+1,y+2,w,rh-5);g.globalAlpha=1;if(rollSel.indexOf(n)>=0){g.strokeStyle='#5CE1E6';g.lineWidth=2;g.strokeRect(x+1,y+2,w,rh-5);g.lineWidth=1;}
    g.fillStyle='rgba(11,11,16,.55)';g.fillRect(x+w-4,y+5,2,rh-11);if(w>34){g.fillStyle='#0B0B10';g.font='700 9px Inter, system-ui, sans-serif';g.fillText(nname(n.m),x+4,y+15);}});
  if(seq.on&&seq.audPat===curPat&&curStep>=off&&curStep<off+16){g.fillStyle='#5CE1E6';g.fillRect(lab+(curStep-off)*cw,0,2,H);}
  if(rollBox){g.fillStyle='rgba(92,225,230,.12)';g.strokeStyle='#5CE1E6';var bx=Math.min(rollBox.x0,rollBox.x1),by=Math.min(rollBox.y0,rollBox.y1);g.fillRect(bx,by,Math.abs(rollBox.x1-rollBox.x0),Math.abs(rollBox.y1-rollBox.y0));g.strokeRect(bx,by,Math.abs(rollBox.x1-rollBox.x0),Math.abs(rollBox.y1-rollBox.y0));}
  drawVel();
}
function drawVel(){var cv=$('#rollVel');if(!cv)return;var dpr=window.devicePixelRatio||1,W=cv.clientWidth||340,H=56,lab=RLAB,cw=(W-lab)/16;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.fillStyle='#101018';g.fillRect(0,0,W,H);g.fillStyle='#8A8A9A';g.font='600 9px Inter, system-ui, sans-serif';g.fillText('VEL',6,32);
  var pt=patterns[curPat],ns=pt.notes[songSel]||[],off=page*16;for(var c=0;c<=16;c++){g.fillStyle=c%4===0?'#3A3A48':'#20202A';g.fillRect(lab+c*cw,0,1,H);}
  ns.forEach(function(n){if(n.s<off||n.s>=off+16)return;var x=lab+(n.s-off)*cw+cw*0.25,h=(H-6)*n.v;g.fillStyle='#D4FF3A';g.globalAlpha=0.8;g.fillRect(x,H-h-2,Math.max(3,cw*0.5),h);g.globalAlpha=1;});}
function velSet(e){var cv=$('#rollVel'),r=zRect(cv,e),x=e.clientX-r.left,y=e.clientY-r.top;if(x<RLAB)return;var cw=(r.width-RLAB)/16,s=page*16+Math.floor((x-RLAB)/cw),v=clamp(1-(y-2)/(r.height-6),0.05,1);
  var ns=patterns[curPat].notes[songSel]||[],hit=false;ns.forEach(function(n){if(Math.floor(n.s)===s){n.v=Math.round(v*100)/100;hit=true;}});if(hit){drawRoll();}}
function barOp(op){
  var pt=patterns[curPat],ti=songSel,ns=noteArr(pt,ti),o=page*16,inBar=function(n){return n.s>=o&&n.s<o+16;};if(!ns)return;
  if(op==='copy'){rollClip=ns.filter(inBar).map(function(n){return {s:n.s-o,l:n.l,m:n.m,v:n.v};});toast('Bar '+(page+1)+' copied ('+rollClip.length+' notes).',1200);return;}
  if(op==='paste'){if(!rollClip){toast('Copy a bar first.');return;}pt.notes[ti]=ns.filter(function(n){return !inBar(n);}).concat(rollClip.map(function(n){return {s:n.s+o,l:Math.min(n.l,pt.len-(n.s+o)),m:n.m,v:n.v};}));}
  else if(op==='all'){var src=ns.filter(inBar),bars=pt.len/16,out=[];for(var b=0;b<bars;b++)src.forEach(function(n){out.push({s:n.s-o+b*16,l:n.l,m:n.m,v:n.v});});pt.notes[ti]=out;toast('Bar '+(page+1)+' copied to all '+bars+' bars.',1400);}
  else{var d=+op;ns.forEach(function(n){if(inBar(n))n.m=clamp(n.m+d,0,127);});}
  markDirty();drawRoll();renderPatSegs();
}
function initRoll2(){
  var cv=$('#roll');cv.addEventListener('pointerdown',function(e){e.preventDefault();rollDown(e);});cv.addEventListener('pointermove',rollMove);['pointerup','pointercancel'].forEach(function(ev){cv.addEventListener(ev,rollUp);});
  var vc=$('#rollVel'),vd=false;vc.addEventListener('pointerdown',function(e){e.preventDefault();vd=true;try{vc.setPointerCapture(e.pointerId);}catch(x){}velSet(e);});vc.addEventListener('pointermove',function(e){if(vd)velSet(e);});['pointerup','pointercancel'].forEach(function(ev){vc.addEventListener(ev,function(){if(vd){vd=false;markDirty();}});});
  $$('[data-rtool]').forEach(function(b){b.addEventListener('click',function(){rollTool=b.getAttribute('data-rtool');$$('[data-rtool]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});$('#rChordType').hidden=rollTool!=='chord';$('#rInv').hidden=rollTool!=='chord';if(rollTool!=='select'){rollSel=[];selBar();drawRoll();}});});
  $('#rChordType').addEventListener('change',function(e){rollChord=e.target.value;});
  $('#rInv').addEventListener('change',function(e){rollInv=e.target.value;});$('#rHm').addEventListener('change',function(e){rollHm=e.target.checked;});
  $$('[data-rsel]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-rsel'),pt=patterns[curPat],ns=noteArr(pt,songSel);rollSel=rollSel.filter(function(n){return ns.indexOf(n)>=0;});if(!rollSel.length){selBar();return;}
    if(k==='del'){pt.notes[songSel]=ns.filter(function(n){return rollSel.indexOf(n)<0;});rollSel=[];}
    else if(k==='dup'){var mn=1e9,mx=0;rollSel.forEach(function(n){mn=Math.min(mn,n.s);mx=Math.max(mx,n.s+n.l);});var L=Math.max(1,Math.ceil((mx-mn)/4)*4),cp=[];rollSel.forEach(function(n){if(n.s+L<pt.len)cp.push({s:n.s+L,l:Math.min(n.l,pt.len-n.s-L),m:n.m,v:n.v});});cp.forEach(function(n){ns.push(n);});rollSel=cp;}
    else{var d=+k;rollSel.forEach(function(n){n.m=clamp(n.m+d,0,127);});if(rollSel[0])playNote(songSel,rollSel[0].m,0.6,ctx?ctx.currentTime:0,0.2);}
    selBar();markDirty();drawRoll();renderPatSegs();});});
  $('#rKey').innerHTML=NN.map(function(n,i){return '<option value="'+i+'">'+n+'</option>';}).join('');$('#rKey').value=rollKey.root;
  $('#rKey').addEventListener('change',function(e){rollKey.root=+e.target.value;drawRoll();});
  $$('[data-rmode]').forEach(function(b){b.addEventListener('click',function(){rollKey.mode=b.getAttribute('data-rmode');$$('[data-rmode]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});$('#rHmWrap').hidden=rollKey.mode!=='minor';drawRoll();});});
  $('#rProgs').innerHTML=PROGS.map(function(p,i){return '<button data-prog="'+i+'">'+p[0]+'</button>';}).join('');
  $$('[data-prog]').forEach(function(b){b.addEventListener('click',function(){var p=PROGS[+b.getAttribute('data-prog')];stampProg(p[1],p[0]);});});
  $$('[data-bar]').forEach(function(b){b.addEventListener('click',function(){barOp(b.getAttribute('data-bar'));});});
}

/* ---------- DRUM KITS 2 (filtered, layered, metallic) + ALGORITHMIC-STYLE REVERB IRS ---------- */
function dkNoise(n,seed){var s=seed>>>0||1,d=new Float32Array(n);for(var i=0;i<n;i++){s=(s*1664525+1013904223)>>>0;d[i]=s/4294967296*2-1;}return d;}
function dkMetal(n,sr,base){var R=[1,1.4826,1.8002,2.5456,2.6302,3.8968],d=new Float32Array(n);for(var k=0;k<6;k++){var f=base*R[k],ph=k*0.37;for(var i=0;i<n;i++){ph+=f/sr;d[i]+=(ph%1<0.5?1:-1)/6;}}return d;}
function dkBuf(arr){var sr=ctx.sampleRate,b=ctx.createBuffer(1,arr.length,sr);normalize(arr);var f=Math.min(arr.length,Math.floor(sr*0.004));for(var j=0;j<f;j++)arr[arr.length-1-j]*=j/f;b.getChannelData(0).set(arr);return b;}
function dkEnv(d,sr,att,dec){for(var i=0;i<d.length;i++){var t=i/sr;d[i]*=Math.min(1,t/Math.max(1e-4,att))*Math.exp(-t/dec);}return d;}
function dkMix(){var a=arguments,n=0,i,k;for(k=0;k<a.length;k+=2)n=Math.max(n,a[k].length);var o=new Float32Array(n);for(k=0;k<a.length;k+=2){var g=a[k+1];for(i=0;i<a[k].length;i++)o[i]+=a[k][i]*g;}return o;}
function dkKick(sr,o){var n=Math.floor(sr*o.dur),d=new Float32Array(n),ph=0;for(var i=0;i<n;i++){var t=i/sr;ph+=2*Math.PI*(o.f1+(o.f0-o.f1)*Math.exp(-t*o.sw))/sr;d[i]=Math.sin(ph)*Math.exp(-t/o.dec);}
  if(o.drive)for(i=0;i<n;i++)d[i]=Math.tanh(d[i]*o.drive)/Math.tanh(o.drive);
  var cl=dkEnv(biq(dkNoise(Math.floor(sr*0.012),7),'bp',o.click||3500,0.9,sr),sr,0.0005,0.003);var out=dkMix(d,1,cl,o.clickAmt||0.35);return o.lp?biq(out,'lp',o.lp,0.7,sr):out;}
function dkSnare(sr,o){var n=Math.floor(sr*o.dur),body=new Float32Array(n);for(var i=0;i<n;i++){var t=i/sr,pe=1+0.25*Math.exp(-t*40);body[i]=(Math.sin(2*Math.PI*o.f*pe*t)+0.5*Math.sin(2*Math.PI*o.f*1.78*pe*t))*Math.exp(-t/o.bdec);}
  var nz=biq(biq(dkNoise(n,11),'hp',o.hp||1200,0.7,sr),'lp',o.lp||9000,0.7,sr);dkEnv(nz,sr,0.0008,o.ndec);return dkMix(body,o.body||0.55,nz,1);}
function dkClap(sr,o){var n=Math.floor(sr*o.dur),nz=biq(dkNoise(n,23),'bp',o.f||1300,1.1,sr),e=new Float32Array(n);
  for(var i=0;i<n;i++){var t=i/sr,v=0;[0,0.009,0.019,0.03].forEach(function(s,k){if(t>=s)v+=Math.exp(-(t-s)/(k===3?o.tail:0.006));});e[i]=nz[i]*v;}return e;}
function dkHat(sr,o){var n=Math.floor(sr*o.dur),m=dkMetal(n,sr,o.base||320),x=biq(biq(dkMix(m,1,dkNoise(n,31),o.noise||0.35),'bp',o.bp||9500,0.9,sr),'hp',o.hp||7000,0.7,sr);if(o.lp)x=biq(x,'lp',o.lp,0.7,sr);return dkEnv(x,sr,0.0004,o.dec);}
function dkShaker(sr,o){var n=Math.floor(sr*o.dur),x=biq(dkNoise(n,41),'bp',o.f||6500,0.8,sr);for(var i=0;i<n;i++){var t=i/sr;x[i]*=Math.min(1,t/0.014)*Math.exp(-Math.max(0,t-0.014)/o.dec);}return x;}
function dkTom(sr,o){var n=Math.floor(sr*o.dur),d=new Float32Array(n),ph=0;for(var i=0;i<n;i++){var t=i/sr;ph+=2*Math.PI*o.f*(1+0.5*Math.exp(-t*18))/sr;d[i]=Math.sin(ph)*Math.exp(-t/o.dec);}return dkMix(d,1,dkEnv(biq(dkNoise(n,51),'bp',o.f*4,1,sr),sr,0.0005,0.02),0.25);}
function dkRim(sr,o){var n=Math.floor(sr*0.09),d=new Float32Array(n);for(var i=0;i<n;i++){var t=i/sr;d[i]=(Math.sin(2*Math.PI*o.f*t)*0.7+Math.sin(2*Math.PI*o.f*2.3*t)*0.4)*Math.exp(-t/0.012);}return dkMix(d,1,dkEnv(biq(dkNoise(n,61),'bp',3200,1.2,sr),sr,0.0003,0.006),0.6);}
function dkCrash(sr,o){var n=Math.floor(sr*o.dur),m=dkMetal(n,sr,o.base||420),x=biq(dkMix(m,0.6,dkNoise(n,71),1),'hp',o.hp||4500,0.7,sr);x=biq(x,'lp',o.lp||14000,0.7,sr);return dkEnv(x,sr,0.0008,o.dec);}
function dkCow(sr){var n=Math.floor(sr*0.4),d=new Float32Array(n),p1=0,p2=0;for(var i=0;i<n;i++){p1+=540/sr;p2+=800/sr;d[i]=((p1%1<0.5?1:-1)+(p2%1<0.5?1:-1))*0.5;}return dkEnv(biq(d,'bp',950,2,sr),sr,0.0005,0.09);}
function dk808(sr,o){var n=Math.floor(sr*o.dur),d=new Float32Array(n),ph=0;for(var i=0;i<n;i++){var t=i/sr;ph+=2*Math.PI*(o.f*(1+0.9*Math.exp(-t*30)))/sr;d[i]=Math.tanh(Math.sin(ph)*o.drive)*Math.exp(-t/o.dec);}return d;}
var KITS={
  studio:{name:'Studio',k:{f0:150,f1:48,sw:28,dec:0.16,drive:1.6},s:{f:190,bdec:0.06,ndec:0.11,lp:9000},c:{tail:0.14},h:{dec:0.035},oh:{dec:0.3},sh:{dec:0.05}},
  boombap:{name:'Boom Bap',k:{f0:120,f1:50,sw:22,dec:0.2,drive:2.4,lp:3500,clickAmt:0.2},s:{f:205,bdec:0.08,ndec:0.17,lp:6500,body:0.75},c:{tail:0.18,f:1100},h:{dec:0.04,lp:8000,base:290},oh:{dec:0.28,lp:8500},sh:{dec:0.06,f:5200}},
  trap:{name:'Trap',k:{f0:170,f1:45,sw:35,dec:0.35,drive:2.8},s:{f:230,bdec:0.04,ndec:0.09,hp:1800,lp:11000,body:0.4},c:{tail:0.12,f:1500},h:{dec:0.022,bp:10500,base:360},oh:{dec:0.25},sh:{dec:0.035,f:7500}},
  house:{name:'House',k:{f0:220,f1:46,sw:40,dec:0.22,drive:1.4,click:4500,clickAmt:0.45},s:{f:180,bdec:0.05,ndec:0.15,lp:10000},c:{tail:0.22,f:1250},h:{dec:0.045,bp:9000,base:310},oh:{dec:0.42},sh:{dec:0.045}}
};
function loadKit(id,quiet){
  if(!ensureAudio())return;if(id==='acoustic'){loadAcousticKit(quiet);return;}pads.forEach(function(p){p.vb=null;});if(!quiet)GAR.kit=id;if(id==='reggae'){reggaeKit();renderPads();selectPad(padSel);markDirty();toast('Reggae kit loaded.',1400);return;}
  var K=KITS[id],sr=ctx.sampleRate;if(!K)return;
  var B=[['Kick','kick',dkKick(sr,Object.assign({dur:0.7},K.k))],['Snare','snare',dkSnare(sr,Object.assign({dur:0.4},K.s))],['Clap','snare',dkClap(sr,Object.assign({dur:0.45},K.c))],['Rim','perc',dkRim(sr,{f:1700})],
    ['Closed Hat','hat',dkHat(sr,Object.assign({dur:0.12},K.h))],['Open Hat','hat',dkHat(sr,Object.assign({dur:0.7},K.oh))],['Shaker','hat',dkShaker(sr,Object.assign({dur:0.16},K.sh))],['Cowbell','perc',dkCow(sr)],
    ['Tom Lo','perc',dkTom(sr,{f:92,dur:0.6,dec:0.18})],['Tom Mid','perc',dkTom(sr,{f:132,dur:0.5,dec:0.15})],['Tom Hi','perc',dkTom(sr,{f:185,dur:0.45,dec:0.13})],['Crash','hat',dkCrash(sr,{dur:2.2,dec:0.7})],
    ['808','kick',dk808(sr,{f:44,dur:id==='trap'?2.2:1.5,dec:id==='trap'?0.7:0.45,drive:id==='trap'?2.2:1.6})],['Ride','hat',dkCrash(sr,{dur:1.6,dec:0.45,base:610,hp:6000,lp:12000})]];
  var LV={kick:0.95,snare:0.85,hat:0.5,perc:0.75};
  B.forEach(function(x,i){var p=pads[i];p.buf=dkBuf(x[2]);p.name=x[0];p.cls=x[1];p.tune=0;p.decay=1;p.level=LV[x[1]];p.pan=x[1]==='hat'?0.18:(i>=8&&i<=10?[-0.35,0,0.35][i-8]:0);p.choke=(i===4||i===5)?1:0;});
  if(quiet)return;renderPads();selectPad(padSel);markDirty();toast(K.name+' kit loaded — filtered hats, layered snare and kick click. Your pattern is unchanged.',2200);
}
/* reverb impulse responses: early reflections + 3-band late tail with high-frequency damping, decorrelated L/R */
var VERBS={room:{name:'Room',rt:0.7,pre:0.004,er:0.9,damp:0.5,size:0.35},chamber:{name:'Chamber',rt:1.3,pre:0.01,er:0.7,damp:0.55,size:0.6},hall:{name:'Hall',rt:2.4,pre:0.022,er:0.55,damp:0.45,size:1},
  plate:{name:'Plate',rt:1.8,pre:0.002,er:0,damp:0.8,size:0.5},spring:{name:'Spring',rt:1.6,pre:0.006,er:0,damp:0.4,size:0.4,spring:true},cathedral:{name:'Cathedral',rt:4.5,pre:0.04,er:0.4,damp:0.38,size:1.6}};
function makeVerb(id){
  var V0=VERBS[id],sz=(P.rvSize?P.rvSize.v:1),V=Object.assign({},V0,{rt:V0.rt*sz,size:V0.size*Math.sqrt(sz)}),sr=ctx.sampleRate,n=Math.floor((V.pre+V.rt*1.15)*sr),b=ctx.createBuffer(2,n,sr),p0=Math.floor(V.pre*sr);
  for(var ch=0;ch<2;ch++){var x=dkNoise(n,101+ch*977),lo=biq(x,'lp',350,0.7,sr),hi=biq(x,'hp',3500,0.7,sr),mid=biq(biq(x,'hp',350,0.7,sr),'lp',3500,0.7,sr),d=b.getChannelData(ch);
    var rl=V.rt*1.15,rm=V.rt,rh=V.rt*V.damp,build=V.er?0.012+0.03*V.size:0.004;
    for(var i=p0;i<n;i++){var t=(i-p0)/sr,f=Math.min(1,t/build);d[i]=(lo[i]*Math.exp(-6.9*t/rl)*0.9+mid[i]*Math.exp(-6.9*t/rm)+hi[i]*Math.exp(-6.9*t/rh)*0.8)*f*(V.er?0.55:1);}
    if(V.er){var s=1234+ch*77;for(var k=0;k<12;k++){s=(s*1664525+1013904223)>>>0;var tt=V.pre+0.004+(s/4294967296)*0.07*V.size+k*0.0025,j=Math.floor(tt*sr);if(j<n)d[j]+=(ch?1:-1)*(k%2?1:-1)*V.er*Math.pow(0.82,k)*1.6;}}
    if(V.spring){for(var r=0;r<14;r++){var o=p0+Math.floor(r*0.031*sr),g=Math.pow(0.78,r)*0.6;for(var q=0;q<Math.floor(0.03*sr)&&o+q<n;q++){var tq=q/sr;d[o+q]+=Math.sin(2*Math.PI*(3200-60000*tq)*tq)*g*Math.exp(-tq*90);}}}
  }
  return b;
}
/* reverb return: +9 dB over the old level (it was ~30 dB under the mix at the default Space) */
