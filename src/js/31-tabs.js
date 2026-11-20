var TABT={
  g:[['std','Standard EADGBE',[40,45,50,55,59,64]],['dropd','Drop D (DADGBE)',[38,45,50,55,59,64]],['half','Half step down',[39,44,49,54,58,63]],['full','Full step down',[38,43,48,53,57,62]],['dadgad','DADGAD',[38,45,50,55,57,62]],['openg','Open G (DGDGBD)',[38,43,50,55,59,62]]],
  b:[['b4','4-string EADG',[28,33,38,43]],['b4d','4-string Drop D',[26,33,38,43]],['b5','5-string BEADG',[23,28,33,38,43]],['b4h','4-string half step down',[27,32,37,42]]]};
var TAB={inst:'g',tun:{g:0,b:0},capo:0,cols:[],moved:0,dropped:0,bars:1,on:false,pos:0,startT:null,src:null,mode:'rec',raf:0,tw:0,hl:[],row:-1};
var TABNN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function tabTuning(){var L=TABT[TAB.inst];return L[Math.min(TAB.tun[TAB.inst],L.length-1)];}
function tabStrName(m,top){var n=TABNN[((m%12)+12)%12];return top&&TAB.inst==='g'?n.toLowerCase():n;}
/* ---- choose strings and frets ---- */
function tabCompute(){
  var tun=tabTuning()[2],capo=TAB.inst==='g'?TAB.capo:0,maxF=(TAB.inst==='g'?20:20)-capo,open=tun.map(function(m){return m+capo;}),lo=open[0],hi=open[open.length-1]+(TAB.inst==='b'?7:maxF);
  var q=trxQuant(),by={},moved=0,dropped=0;
  q.forEach(function(n){var m=n.m;while(m<lo){m+=12;}while(m>hi){m-=12;}if(m!==n.m)moved++;(by[n.s]=by[n.s]||[]);if(!by[n.s].some(function(x){return x.m===m;}))by[n.s].push({m:m,l:n.l,v:n.v});});
  var steps=Object.keys(by).map(Number).sort(function(a,b){return a-b;}),slices=[];
  steps.forEach(function(s){var ns=by[s].sort(function(a,b){return b.m-a.m;});
    if(TAB.inst==='b'){if(ns.length>1)dropped+=ns.length-1;ns=[ns[ns.length-1]];}
    else if(ns.length>open.length){var keep=[ns[0],ns[ns.length-1]],mid=ns.slice(1,-1).sort(function(a,b){return b.v-a.v;}).slice(0,open.length-2);dropped+=ns.length-open.length;ns=keep.concat(mid).sort(function(a,b){return b.m-a.m;});}
    slices.push({s:s,l:Math.max.apply(null,ns.map(function(x){return x.l;})),ns:ns});});
  function shapes(ns){var out=[],cur=[],used={};
    function cost(sh){var fr=sh.filter(function(x){return x.f>0;}).map(function(x){return x.f;}),c=0;sh.forEach(function(x){c+=x.f===0?-0.25:0.14*x.f+(x.f>12?(x.f-12)*0.25:0);});
      if(fr.length){var mn=Math.min.apply(null,fr),mx=Math.max.apply(null,fr);c+=0.45*(mx-mn);if(mn>7&&sh.some(function(x){return x.f===0;}))c+=0.6;}return c;}
    (function dfs(i){if(out.length>400)return;if(i===ns.length){var fr=cur.filter(function(x){return x.f>0;}).map(function(x){return x.f;});if(fr.length&&Math.max.apply(null,fr)-Math.min.apply(null,fr)>4)return;var sh=cur.slice();out.push({sh:sh,c:cost(sh)});return;}
      for(var st=0;st<open.length;st++){if(used[st])continue;var f=ns[i].m-open[st];if(f<0||f>maxF)continue;used[st]=1;cur.push({m:ns[i].m,str:st,f:f});dfs(i+1);cur.pop();used[st]=0;}})(0);
    return out.sort(function(a,b){return a.c-b.c;}).slice(0,14);}
  function pos(sh){var fr=sh.filter(function(x){return x.f>0;}).map(function(x){return x.f;});return fr.length?Math.min.apply(null,fr):null;}
  var layers=[],sd=16;
  slices.forEach(function(sl){var ns=sl.ns,sh=shapes(ns);
    while(!sh.length&&ns.length>1){ns=ns.length>2?[ns[0]].concat(ns.slice(2)):[ns[0]];dropped++;sh=shapes(ns);}
    if(!sh.length)return;sl.ns=ns;layers.push({sl:sl,st:sh});});
  if(!layers.length){TAB.cols=[];TAB.moved=moved;TAB.dropped=dropped;return;}
  var prev=layers[0].st.map(function(x){return {c:x.c,b:-1};});layers[0].dp=prev;
  for(var i=1;i<layers.length;i++){var A=layers[i-1],B=layers[i],gap=(B.sl.s-A.sl.s)/4,w=1/(1+gap*0.6);
    B.dp=B.st.map(function(x){var px=pos(x.sh),best=1e9,bi=0;A.st.forEach(function(y,j){var py=pos(y.sh),t=(px==null||py==null)?0.15:Math.abs(px-py)*w+(Math.abs(px-py)>4?1:0);var v=A.dp[j].c+t;if(v<best){best=v;bi=j;}});return {c:best+x.c,b:bi};});}
  var last=layers[layers.length-1],bi=0;last.dp.forEach(function(x,j){if(x.c<last.dp[bi].c)bi=j;});
  var cols=new Array(layers.length);for(i=layers.length-1;i>=0;i--){var L=layers[i];cols[i]={s:L.sl.s,l:L.sl.l,n:L.st[bi].sh};bi=L.dp[bi].b;}
  for(i=0;i<cols.length-1;i++)cols[i].d=Math.max(1,Math.min(cols[i].l,cols[i+1].s-cols[i].s));if(cols.length)cols[cols.length-1].d=Math.max(1,cols[cols.length-1].l);
  TAB.cols=cols;TAB.moved=moved;TAB.dropped=dropped;TAB.bars=Math.max(1,Math.ceil((cols[cols.length-1].s+1)/16));}
/* ---- drawing ---- */
function tabSvgRows(width,opt){opt=opt||{};var tun=tabTuning()[2],capo=TAB.inst==='g'?TAB.capo:0,nS=tun.length,LS=opt.print?15:14,top=22,lw=24,bpr=opt.bpr||(width<470?1:width<820?2:width<1100?3:4),bw=(width-lw-4)/bpr,H=top+LS*(nS-1)+26,rows=[],ink=opt.print?'#000':'#14141A',mu='#8A8A98';
  for(var r=0;r*bpr<TAB.bars;r++){var b0=r*bpr,b1=Math.min(TAB.bars,b0+bpr),h='<svg xmlns="http://www.w3.org/2000/svg" class="tab-row" data-row="'+r+'" viewBox="0 0 '+width+' '+H+'" width="'+width+'" height="'+H+'" font-family="Inter,system-ui,sans-serif">';
    h+='<rect width="'+width+'" height="'+H+'" fill="#fff"/>';
    for(var s=0;s<nS;s++){var y=top+LS*(nS-1-s);h+='<text x="'+(lw-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="'+mu+'" font-weight="600">'+tabStrName(tun[s],s===nS-1)+'</text><line x1="'+lw+'" x2="'+(lw+bw*(b1-b0))+'" y1="'+y+'" y2="'+y+'" stroke="#B8B8C4" stroke-width="1"/>';}
    for(var b=b0;b<=b1;b++){var x=lw+bw*(b-b0);h+='<line x1="'+x+'" x2="'+x+'" y1="'+top+'" y2="'+(top+LS*(nS-1))+'" stroke="'+ink+'" stroke-width="'+(b===TAB.bars?2:1)+'"/>';
      if(b<b1){h+='<text x="'+(x+3)+'" y="'+(top-8)+'" font-size="9" fill="'+mu+'">'+(b+1)+'</text>';for(var bt=0;bt<4;bt++){var bx=x+6+(bt*4+0.5)*(bw-12)/16;h+='<line x1="'+bx+'" x2="'+bx+'" y1="'+(top+LS*(nS-1)+8)+'" y2="'+(top+LS*(nS-1)+(bt===0?14:11))+'" stroke="#C8C8D2"/>';}}}
    if(r===0&&capo)h+='<text x="'+(width-4)+'" y="10" text-anchor="end" font-size="10" fill="'+mu+'">Capo '+capo+'</text>';
    TAB.cols.forEach(function(c,ci){var bar=Math.floor(c.s/16);if(bar<b0||bar>=b1)return;var x=lw+bw*(bar-b0)+6+((c.s%16)+0.5)*(bw-12)/16;
      h+='<g class="tc" data-c="'+ci+'">';
      c.n.forEach(function(n){var y=top+LS*(nS-1-n.str),t=String(n.f),tw=t.length*7+4;h+='<rect x="'+(x-tw/2)+'" y="'+(y-7)+'" width="'+tw+'" height="14" rx="3" fill="#fff"/><text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+ink+'">'+t+'</text>';});
      h+='</g>';});
    rows.push(h+'</svg>');}
  return rows;}
function tabRender(){tabCompute();var p=$('#tabPaper'),inner=$('#tabInner');TAB.hl=[];TAB.row=-1;
  if(!TAB.cols.length){inner.innerHTML='<p style="color:#555;padding:20px">No notes in the range of this instrument.</p>';$('#tabInfo').textContent='';return;}
  var w=Math.max(300,Math.min(1200,(p.clientWidth||360)-16));inner.innerHTML=tabSvgRows(w).join('');
  var t=tabTuning(),bits=[TAB.cols.length+' positions'];if(TAB.moved)bits.push(TAB.moved+' notes moved an octave to fit');if(TAB.dropped)bits.push(TAB.dropped+' extra notes left out');
  $('#tabInfo').textContent=bits.join(' · ');}
/* ---- follow playback ---- */
function tabNow(){return TAB.startT==null?TAB.pos:TAB.pos+(ctx.currentTime-TAB.startT);}
function tabFmt(x){x=Math.max(0,x);var m=Math.floor(x/60),s=Math.floor(x%60);return m+':'+(s<10?'0':'')+s;}
function tabTime(){var d=tabDur();$('#tabT').textContent=tabFmt(TAB.on?tabNow():TAB.pos)+' / '+tabFmt(d);}
function tabDur(){var sd=60/TRX.bpm/4,end=0;TAB.cols.forEach(function(c){end=Math.max(end,(c.s+c.d)*sd);});end+=TRX.t0||0;return TAB.mode==='rec'&&TRX.orig?TRX.orig.duration:end+0.5;}
function tabLight(t){var sd=60/TRX.bpm/4,st=(t-(TRX.t0||0))/sd,on=[];
  TAB.cols.forEach(function(c,i){if(c.s<=st+0.05&&c.s+c.d>st+0.05)on.push(i);});
  var key=on.join(',');if(key===TAB.hlKey)return;TAB.hlKey=key;
  $$('#tabInner .tc.on').forEach(function(g){g.classList.remove('on');});
  on.forEach(function(i){var g=$('#tabInner .tc[data-c="'+i+'"]');if(!g)return;g.classList.add('on');var row=g.closest('svg');if(row){var r=+row.getAttribute('data-row');if(r!==TAB.row){TAB.row=r;var pp=$('#tabPaper'),rr=row.getBoundingClientRect(),pr=pp.getBoundingClientRect();if(rr.top<pr.top+10||rr.bottom>pr.bottom-10)pp.scrollTo({top:pp.scrollTop+(rr.top-pr.top)-pr.height*0.25,behavior:'smooth'});}}});}
function tabStop(keep){TAB.on=false;cancelAnimationFrame(TAB.raf);clearTimeout(TAB.tw);if(TAB.src){try{TAB.src.stop();}catch(e){}TAB.src=null;}
  if(TAB.startT!=null){TAB.pos=Math.min(tabNow(),tabDur());TAB.startT=null;}if(TAB.notes){try{transportStop();}catch(e){}TAB.notes=false;}
  var b=$('#tabPP');if(b){b.textContent='▶';b.setAttribute('aria-label','Play');}if(!keep){$$('#tabInner .tc.on').forEach(function(g){g.classList.remove('on');});TAB.hlKey='';}}
function tabPlay(){if(!TAB.cols.length||!ensureAudio())return;tabStop(true);var lat=(ctx.outputLatency||0)+(ctx.baseLatency||0),now=ctx.currentTime+0.12,dur=tabDur(),off=Math.max(0,Math.min(TAB.pos,dur-0.05)),sd=60/TRX.bpm/4,t0=TRX.t0||0;
  if(off>=dur-0.1){off=0;TAB.pos=0;}
  if(TAB.mode==='rec'&&TRX.orig){var s=ctx.createBufferSource();s.buffer=TRX.orig;s.connect(ctx.destination);s.start(now,off);TAB.src=s;s.onended=function(){if(TAB.src===s&&TAB.on){tabStop();TAB.pos=0;tabTime();}};}
  else{var ti=KEYSI()[0]||1;TAB.cols.forEach(function(c){var at=t0+c.s*sd-off;if(at<-0.01)return;c.n.forEach(function(n){playNote(ti,n.m,0.75,now+at,Math.max(0.08,c.d*sd));});});TAB.notes=true;}
  TAB.pos=off;TAB.startT=now;TAB.on=true;var b=$('#tabPP');b.textContent='❚❚';b.setAttribute('aria-label','Pause');
  (function loop(){if(!TAB.on)return;if($('#tabOv').hidden){tabStop();return;}var p=tabNow();$('#tabSeek').value=String(p);tabTime();tabLight(p-lat);if(p>=dur+0.2){tabStop();TAB.pos=0;tabTime();return;}TAB.raf=requestAnimationFrame(loop);})();}
/* ---- exports ---- */
function tabText(){var t=tabTuning(),tun=t[2],nS=tun.length,capo=TAB.inst==='g'?TAB.capo:0,lines=[],head=[(TRX.name||'Untitled')+' — '+(TAB.inst==='g'?'Guitar':'Bass')+' tab','Tuning: '+t[1]+(capo?' · Capo '+capo:'')+' · '+Math.round(TRX.bpm)+' BPM · 4/4','Made with Ecou · ecou.geoptimize.io',''];
  var bars=[];for(var b=0;b<TAB.bars;b++){var cs=TAB.cols.filter(function(c){return Math.floor(c.s/16)===b;}),res=cs.every(function(c){return c.s%2===0;})?8:16,cw=cs.some(function(c){return c.n.some(function(n){return n.f>9;});})?3:2,str=[];
    for(var s=0;s<nS;s++){var row='';for(var k=0;k<res;k++){var step=b*16+k*(16/res),c=cs.find(function(x){return x.s===step;}),n=c&&c.n.find(function(x){return x.str===s;}),cell=n?String(n.f):'';while(cell.length<cw)cell+='-';row+=cell;}str.push(row+'-|');}
    bars.push(str);}
  var per=0,w=0,grp=[];function flush(){if(!grp.length)return;for(var s=nS-1;s>=0;s--){var nm=tabStrName(tun[s],s===nS-1);while(nm.length<2)nm+=' ';lines.push(nm+'|-'+grp.map(function(g){return g[s];}).join('-'));}lines.push('');grp=[];w=0;}
  bars.forEach(function(br){if(w+br[0].length>74&&grp.length)flush();grp.push(br);w+=br[0].length+1;});flush();
  return head.concat(lines).join('\n');}
function tabXml(){var t=tabTuning(),tun=t[2],nS=tun.length,capo=TAB.inst==='g'?TAB.capo:0,STEP=[['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
  var TY=[[16,'whole',0],[12,'half',1],[8,'half',0],[6,'quarter',1],[4,'quarter',0],[3,'eighth',1],[2,'eighth',0],[1,'16th',0]];
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function pitch(m){var w=m+12,p=STEP[w%12];return '<pitch><step>'+p[0]+'</step>'+(p[1]?'<alter>1</alter>':'')+'<octave>'+(Math.floor(w/12)-1)+'</octave></pitch>';}
  function split(d){var out=[];while(d>0){for(var i=0;i<TY.length;i++)if(TY[i][0]<=d){out.push(TY[i]);d-=TY[i][0];break;}}return out;}
  function rest(d){return split(d).map(function(ty){return '<note><rest/><duration>'+ty[0]+'</duration><voice>1</voice><type>'+ty[1]+'</type>'+(ty[2]?'<dot/>':'')+'</note>';}).join('');}
  var x='<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0"><work><work-title>'+esc(TRX.name||'Untitled')+'</work-title></work><identification><encoding><software>Ecou</software></encoding></identification><part-list><score-part id="P1"><part-name>'+(TAB.inst==='g'?'Guitar':'Bass')+'</part-name></score-part></part-list><part id="P1">';
  for(var b=0;b<TAB.bars;b++){x+='<measure number="'+(b+1)+'">';
    if(b===0){x+='<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>TAB</sign><line>5</line></clef><staff-details><staff-lines>'+nS+'</staff-lines>';
      tun.forEach(function(m,i){var p=STEP[m%12];x+='<staff-tuning line="'+(i+1)+'"><tuning-step>'+p[0]+'</tuning-step>'+(p[1]?'<tuning-alter>1</tuning-alter>':'')+'<tuning-octave>'+(Math.floor(m/12)-1)+'</tuning-octave></staff-tuning>';});
      x+=(capo?'<capo>'+capo+'</capo>':'')+'</staff-details><transpose><diatonic>0</diatonic><chromatic>0</chromatic><octave-change>-1</octave-change></transpose></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>'+Math.round(TRX.bpm)+'</per-minute></metronome></direction-type><sound tempo="'+Math.round(TRX.bpm)+'"/></direction>';}
    var cur=b*16,end=b*16+16;TAB.cols.forEach(function(c){if(c.s<cur||c.s>=end)return;if(c.s>cur)x+=rest(c.s-cur);var d=Math.min(c.d,end-c.s),parts=split(d),ty=parts[0];
      c.n.slice().sort(function(a,b2){return a.m-b2.m;}).forEach(function(n,k){x+='<note>'+(k?'<chord/>':'')+pitch(n.m)+'<duration>'+ty[0]+'</duration><voice>1</voice><type>'+ty[1]+'</type>'+(ty[2]?'<dot/>':'')+'<notations><technical><string>'+(nS-n.str)+'</string><fret>'+n.f+'</fret></technical></notations></note>';});
      if(d>ty[0])x+=rest(d-ty[0]);cur=c.s+d;});
    if(cur<end)x+=rest(end-cur);
    x+=(b===TAB.bars-1?'<barline location="right"><bar-style>light-heavy</bar-style></barline>':'')+'</measure>';}
  return x+'</part></score-partwise>\n';}
function tabBase(){return safeName(TRX.name||'tab')+'-'+(TAB.inst==='g'?'guitar':'bass')+'-tab';}
function tabExport(kind){if(!TAB.cols.length){toast('No notes to export.');return;}
  if(kind==='txt'){saveBlob(new Blob([tabText()],{type:'text/plain'}),tabBase()+'.txt','Tab saved as text.');return;}
  if(kind==='xml'){saveBlob(new Blob([tabXml()],{type:'application/vnd.recordare.musicxml+xml'}),tabBase()+'.musicxml','Tab saved as MusicXML. Open it in MuseScore or Guitar Pro.');return;}
  if(kind==='pdf'){var host=$('#scorePrint'),PW=1240,PH=1754,M=80;host.innerHTML=tabSvgRows(700,{print:true,bpr:3}).join('');var svgs=$$('#scorePrint svg'),chain=Promise.resolve([]);toast('Rendering PDF…',1200);
    svgs.forEach(function(svg){chain=chain.then(function(arr){return svgToCanvas(svg,PW-2*M).then(function(c){arr.push(c);return arr;});});});
    chain.then(function(cvs){var pages=[],pg=null,y=0,t=tabTuning();
      function newPage(){pg=document.createElement('canvas');pg.width=PW;pg.height=PH;var g=pg.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,PW,PH);g.fillStyle='#666';g.font='20px sans-serif';g.fillText((TRX.name||'Untitled')+' · Ecou · page '+(pages.length+1),M,PH-40);pages.push(pg);y=M;
        if(pages.length===1){g.fillStyle='#000';g.font='bold 36px sans-serif';g.fillText((TRX.name||'Untitled'),M,y+30);g.fillStyle='#444';g.font='22px sans-serif';g.fillText((TAB.inst==='g'?'Guitar':'Bass')+' tab · '+t[1]+(TAB.inst==='g'&&TAB.capo?' · Capo '+TAB.capo:'')+' · '+Math.round(TRX.bpm)+' BPM',M,y+66);y+=100;}}
      newPage();cvs.forEach(function(c){if(y+c.height>PH-M&&y>M)newPage();pg.getContext('2d').drawImage(c,M,y);y+=c.height+8;});
      return Promise.all(pages.map(jpegBytes)).then(function(j){return buildPDF(j.map(function(x){return {jpg:x,w:PW,h:PH};}));});
    }).then(function(pdf){host.innerHTML='';saveBlob(pdf,tabBase()+'.pdf','Tab PDF saved.');}).catch(function(){host.innerHTML='';toast('Couldn’t render the PDF in this browser.');});}}
/* ---- overlay ---- */
function tabUI(){var t=TABT[TAB.inst];$('#tabTun').innerHTML=t.map(function(x,i){return '<option value="'+i+'"'+(i===TAB.tun[TAB.inst]?' selected':'')+'>'+x[1]+'</option>';}).join('');
  $('#tabCapo').hidden=TAB.inst!=='g';$$('#tabInst [data-ti]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-ti')===TAB.inst);});
  $$('#tabMode [data-tbm]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-tbm')===TAB.mode);});}
function tabRefresh(){var was=TAB.on;tabStop();tabUI();tabRender();$('#tabSeek').max=String(Math.ceil(tabDur()));tabTime();if(was)tabPlay();}
function openTab(){if(!TRX.parts){toast('Choose a recording first.');return;}
  try{TAB.inst=localStorage.getItem('ecou.tabInst')==='b'?'b':TAB.inst;}catch(e){}
  if(TRX.parts.some(function(p){return p.show&&p.id==='bass';})&&!TRX.parts.some(function(p){return p.show&&p.id!=='bass'&&p.k!=='drum';}))TAB.inst='b';
  $('#tabOv').hidden=false;pushOverlay('tab');TAB.pos=0;TAB.mode=TRX.orig?'rec':'notes';$('#tabMode').hidden=!TRX.orig;tabRefresh();$('#tabPaper').scrollTop=0;setTimeout(function(){$('#tabClose').focus();},50);}
function tabHide(){tabStop();$('#tabOv').hidden=true;$('#tabInner').innerHTML='';}
function initTab(){var ov=$('#tabOv');if(!ov)return;
  $('#tabClose').addEventListener('click',function(){closeOverlay('tab');});
  $$('#tabInst [data-ti]').forEach(function(b){b.addEventListener('click',function(){TAB.inst=b.getAttribute('data-ti');try{localStorage.setItem('ecou.tabInst',TAB.inst);}catch(e){}tabRefresh();});});
  $('#tabTun').addEventListener('change',function(){TAB.tun[TAB.inst]=+this.value;tabRefresh();});
  var cp=$('#tabCapo');cp.innerHTML='<option value="0">No capo</option>'+[1,2,3,4,5,6,7].map(function(i){return '<option value="'+i+'">Capo '+i+'</option>';}).join('');cp.addEventListener('change',function(){TAB.capo=+this.value;tabRefresh();});
  $('#tabExp').addEventListener('change',function(){var v=this.value;this.value='';if(v)tabExport(v);});
  $('#tabPP').addEventListener('click',function(){if(TAB.on)tabStop(true);else tabPlay();});
  $$('#tabMode [data-tbm]').forEach(function(b){b.addEventListener('click',function(){TAB.mode=b.getAttribute('data-tbm');tabUI();$('#tabSeek').max=String(Math.ceil(tabDur()));if(TAB.on)tabPlay();});});
  var sk=$('#tabSeek');sk.addEventListener('input',function(){var was=TAB.on;if(was)tabStop(true);TAB.pos=+sk.value;tabTime();tabLight(TAB.pos);if(was)tabPlay();});
  $('#tabInner').addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('.tc');if(!g)return;var c=TAB.cols[+g.getAttribute('data-c')];if(!c)return;var was=TAB.on;if(was)tabStop(true);TAB.pos=Math.max(0,(TRX.t0||0)+c.s*60/TRX.bpm/4);$('#tabSeek').value=String(TAB.pos);tabTime();TAB.hlKey='';tabLight(TAB.pos);if(was)tabPlay();});
  var rt=0;window.addEventListener('resize',function(){if(ov.hidden)return;clearTimeout(rt);rt=setTimeout(function(){tabRender();TAB.hlKey='';},200);});
  var tb=$('#trxTab');if(tb)tb.addEventListener('click',openTab);}

/* ===================== AUDIO → SHEET MUSIC =====================
   One instrument: Spotify's Basic Pitch (Apache-2.0) writes the notes. A full song: HT-Demucs (via the demucs JS port and
   ONNX Runtime Web) first splits it into vocals, bass, other and drums on the phone, then each stem gets its own staff.
   Both models run in Web Workers so the screen stays responsive. */
