var HARM={on:true,prev:null,cur:null,t:null,hide:null};
try{if(localStorage.getItem('ecou.harm')==='0')HARM.on=false;}catch(e){}
var DEGC=['#FFC94D','#FF8A5B','#FF6B8B','#B69CFF','#5CE1E6','#7CF2A6','#8FB3FF'];
var DEGW=['the root','the second','the third','the fourth','the fifth','the sixth','the seventh'];
var ROMAN=['I','♭II','II','♭III','III','IV','♯IV','V','♭VI','VI','♭VII','VII'];
var HQ=[['maj',[0,4,7]],['min',[0,3,7]],['7',[0,4,7,10]],['maj7',[0,4,7,11]],['m7',[0,3,7,10]],['dim',[0,3,6]],['aug',[0,4,8]],['sus4',[0,5,7]],['sus2',[0,2,7]],['add9',[0,2,4,7]],['5',[0,7]]];
function harmScale(){return GAR.minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];}
function harmDeg(pc){return harmScale().indexOf(((pc-GAR.key)%12+12)%12);}
function harmCol(pc){var d=harmDeg(pc);return d<0?'#6E6E7E':DEGC[d];}
function harmPaintKeys(){document.body.classList.toggle('harm',HARM.on);$$('#kb [data-midi]').forEach(function(k){var m=+k.getAttribute('data-midi'),d=harmDeg(m%12);k.classList.toggle('insc',d>=0);if(d>=0){k.style.setProperty('--dc',DEGC[d]);k.setAttribute('data-deg',d===0?'1':'');}else{k.style.removeProperty('--dc');k.removeAttribute('data-deg');}});}
/* name a set of MIDI notes: chord (root + quality) or a single note */
function harmName(ms){if(!ms.length)return null;var lo=Math.min.apply(null,ms),pcs=[];ms.forEach(function(m){var p=m%12;if(pcs.indexOf(p)<0)pcs.push(p);});
  if(pcs.length===1)return {root:pcs[0],q:'note'};
  var best=null;pcs.concat().sort(function(a,b){return ((a-lo%12+12)%12)-((b-lo%12+12)%12);}).forEach(function(r){var rel=pcs.map(function(p){return (p-r+12)%12;}).sort(function(a,b){return a-b;});
    HQ.forEach(function(q,qi){var t=q[1],ok=rel.every(function(x){return t.indexOf(x)>=0;})&&(t.length-rel.length<=1)&&(rel.length>=2)&&(t.length<4||rel.indexOf(t[3])>=0||q[0]==='add9');if(!ok)return;var miss=t.length-rel.length,sc=miss*3+qi*0.1+(r===lo%12?-1:0);if(!best||sc<best.sc)best={root:r,q:q[0],sc:sc};});});
  if(!best)return {root:lo%12,q:'note'};return best;}
function harmInfo(n){var semi=((n.root-GAR.key)%12+12)%12,minorish=n.q==='min'||n.q==='m7'||n.q==='dim',num=ROMAN[semi];if(minorish)num=num.toLowerCase();if(n.q==='dim')num+='°';else if(n.q==='aug')num+='+';else if(n.q==='7'||n.q==='m7')num+='7';else if(n.q==='maj7')num+='maj7';
  var d=harmDeg(n.root),word=n.q==='note'?(d>=0?DEGW[d]:'outside the key'):(d>=0?DEGW[d]:'a borrowed chord');
  var nm=GNOTE[n.root].replace('♯','#')+(n.q==='note'?'':n.q==='maj'?'':n.q==='min'?'m':n.q==='dim'?'°':n.q==='5'?'5':n.q);
  return {num:n.q==='note'?String(d>=0?d+1:'·'):num,name:nm,word:word,col:harmCol(n.root),minor:minorish,major:n.q==='maj'||n.q==='7'||n.q==='maj7',chord:n.q!=='note',key:n.root+n.q};}
function harmShow(info){if(!HARM.on)return;var P=HARM.cur;
  if(info&&info.chord&&P&&P.chord&&P.key!==info.key){HARM.prev=P;if(P.major&&info.minor)info.move='the minor fall';else if(P.minor&&info.major)info.move='the major lift';}
  if(info)HARM.cur=info;clearTimeout(HARM.hide);
  $$('.harm-badge').forEach(function(b){if(!info){b.classList.remove('show');return;}b.style.setProperty('--hc',info.col);b.innerHTML='<b>'+info.num+'</b><span><em>'+info.name+'</em><small>'+(info.move||info.word)+'</small></span>';b.classList.add('show');});
  if(info)HARM.hide=setTimeout(function(){$$('.harm-badge').forEach(function(b){b.classList.remove('show');});},2200);}
function harmFromChord(c){if(!HARM.on)return;harmShow(harmInfo({root:c[0],q:c[1]==='maj'?'maj':c[1]==='min'?'min':c[1]}));}
function harmLive(){clearTimeout(HARM.t);HARM.t=setTimeout(function(){if(!HARM.on)return;var ms=[];voices.forEach(function(v){if(v&&v.midi!=null&&v.ti===selTrack)ms.push(v.midi);});if(!ms.length)return;var n=harmName(ms);if(n)harmShow(harmInfo(n));},25);}
function harmToggle(on){HARM.on=on;try{localStorage.setItem('ecou.harm',on?'1':'0');}catch(e){}harmPaintKeys();if(!on)harmShow(null);if(typeof garStrips==='function'&&GAR.view==='play'&&/skeys|gtr|bass/.test(GAR.inst||'')&&!GAR.amp)garStrips();}

/* ===================== FOLLOW THE SCORE =====================
   After a recording is transcribed, play it (or the written notes, or both) while the score highlights each note in its
   scale-degree colour, a cursor moves through the bars and a keyboard below shows the notes being played. */
var SCVIS=null,SCF={on:false,mode:'rec',pos:0,t0:0,src:null,timer:null,startT:null,raf:0,sd:null,kb:null,lo:48,hi:84,lit:{},cur:[]};
function scDegCol(m,sd){var k=sd&&sd.key?sd.key:SKEYS[0],minor=k[2]==='minor',ton=TONIC[minor?k[0].replace('m',''):k[0]];if(ton==null)ton=0;
  var sc=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],d=sc.indexOf(((m-ton)%12+12)%12);return d<0?'#6E6E7E':DEGC[d];}
function scFollowReady(sd){var bar=$('#scPlay');SCF.sd=sd;scStop(true);
  if(!bar||!(SCOREX&&TRX.parts&&TRX.orig)){if(bar)bar.hidden=true;return;}scStemsUI();
  bar.hidden=false;var q=trxQuant();SCF.lo=127;SCF.hi=0;q.forEach(function(n){SCF.lo=Math.min(SCF.lo,n.m);SCF.hi=Math.max(SCF.hi,n.m);});
  SCF.lo=Math.max(21,Math.min(SCF.lo,60)-2);SCF.hi=Math.min(108,Math.max(SCF.hi,72)+2);SCF.pos=0;$('#scSeek').max=String(Math.ceil(TRX.orig.duration));$('#scSeek').value='0';scTime();
  var inner=$('#scoreInner');inner.style.position='relative';if(!$('#scCursor')){var c=document.createElement('div');c.id='scCursor';inner.appendChild(c);}
  scKb();}
function scTime(){var p=SCF.on?scNow():SCF.pos,d=TRX.orig?TRX.orig.duration:0;function f(x){x=Math.max(0,x);var m=Math.floor(x/60),s=Math.floor(x%60);return m+':'+(s<10?'0':'')+s;}$('#scT').textContent=f(p)+' / '+f(d);}
function scNow(){return SCF.startT==null?SCF.pos:SCF.pos+(ctx.currentTime-SCF.startT);}
function scClear(){$$('#scoreInner .scf-hl').forEach(function(e){e.classList.remove('scf-hl');e.style.removeProperty('--scc');});SCF.lit={};scKbDraw();}
function scActive(t){var sd=60/TRX.bpm/4,out=[];(SCF.q||[]).forEach(function(n){if(n.s*sd<=t+0.02&&(n.s+n.l)*sd>t+0.02)out.push(n.m);});return out.sort(function(a,b){return b-a;});}
function scEvent(ev){if(!ev){return;}
  $$('#scoreInner .scf-hl').forEach(function(e){e.classList.remove('scf-hl');});var lit={},ps=scActive((ev.milliseconds||0)/1000);
  (ev.elements||[]).forEach(function(group,gi){(group||[]).forEach(function(el){if(!el||!el.classList)return;var col=scDegCol(ps[Math.min(gi,ps.length-1)]||60,SCF.sd);el.classList.add('scf-hl');el.style.setProperty('--scc',col);});});
  var c=$('#scCursor'),svg=$('#scoreInner svg');if(c&&svg&&ev.left!=null){var vb=svg.viewBox&&svg.viewBox.baseVal,sr=svg.getBoundingClientRect(),ir=$('#scoreInner').getBoundingClientRect(),k=vb&&vb.width?sr.width/vb.width:1;
    c.style.left=(sr.left-ir.left+ev.left*k-7)+'px';c.style.top=(sr.top-ir.top+ev.top*k)+'px';c.style.height=(ev.height*k)+'px';c.hidden=false;
    var paper=$('#scorePaper'),r=c.getBoundingClientRect(),pr=paper.getBoundingClientRect();if(r.top<pr.top+20||r.bottom>pr.bottom-20)paper.scrollTo({top:paper.scrollTop+(r.top-pr.top)-pr.height*0.3,behavior:'smooth'});}}
function scKb(){var cv=$('#scKb');if(!cv)return;var r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);SCF.kb={w:r.width,h:r.height,dpr:dpr};scKbDraw();}
function scKbDraw(){var cv=$('#scKb');if(!cv||!SCF.kb)return;var g=cv.getContext('2d'),W=SCF.kb.w,H=SCF.kb.h,isB=function(m){return [1,3,6,8,10].indexOf(m%12)>=0;};g.setTransform(SCF.kb.dpr,0,0,SCF.kb.dpr,0,0);g.clearRect(0,0,W,H);
  var whites=[];for(var m=SCF.lo;m<=SCF.hi;m++)if(!isB(m))whites.push(m);var ww=W/whites.length,xi={};
  whites.forEach(function(m,i){xi[m]=i;var on=SCF.lit[m];g.fillStyle=on?scDegCol(m,SCF.sd):'#EDEDF2';g.fillRect(i*ww+0.5,0,ww-1,H);if(m%12===0){g.fillStyle=on?'#0B0B10':'#8A8A98';g.font='9px Inter, system-ui, sans-serif';g.fillText('C'+(m/12-1),i*ww+2,H-4);}});
  for(m=SCF.lo;m<=SCF.hi;m++){if(!isB(m)||xi[m-1]==null)continue;var x=(xi[m-1]+1)*ww-ww*0.32,on2=SCF.lit[m];g.fillStyle=on2?scDegCol(m,SCF.sd):'#1E1E28';g.fillRect(x,0,ww*0.64,H*0.6);}}
function scStop(silent){SCF.on=false;cancelAnimationFrame(SCF.raf);if(SCF.timer){try{SCF.timer.stop();}catch(e){}SCF.timer=null;}clearTimeout(SCF.tw);
  if(SCF.src){try{SCF.src.stop();}catch(e){}SCF.src=null;}(SCF.srcs||[]).forEach(function(x){try{x.stop();}catch(e){}});SCF.srcs=[];if(SCF.startT!=null){SCF.pos=Math.min(scNow(),TRX.orig?TRX.orig.duration:0);SCF.startT=null;}
  if(SCF.notes){try{transportStop();}catch(e){}SCF.notes=false;}var b=$('#scPP');if(b){b.textContent='▶';b.setAttribute('aria-label','Play');}if(!silent)scClear();var c=$('#scCursor');if(c&&!silent)c.hidden=true;}
function scPlay(){if(!TRX.orig||!SCVIS||!SCVIS[0]||!ensureAudio())return;scStop(true);
  var lat=(ctx.outputLatency||0)+(ctx.baseLatency||0),now=ctx.currentTime+0.12,off=Math.max(0,Math.min(SCF.pos,TRX.orig.duration-0.05)),t0=TRX.t0||0,sd=60/TRX.bpm/4,mode=SCF.mode;
  if(off>=TRX.orig.duration-0.1){off=0;SCF.pos=0;}
  SCF.srcs=[];
  if(mode==='rec'){var s=ctx.createBufferSource();s.buffer=TRX.orig;s.connect(ctx.destination);s.start(now,off);SCF.src=s;s.onended=function(){if(SCF.src===s&&SCF.on)scStop();};}
  if(mode==='stems'){TRX.parts.forEach(function(p){if(!p.buf)return;var s2=ctx.createBufferSource(),g2=ctx.createGain();g2.gain.value=p.aud?1:0;s2.buffer=p.buf;s2.connect(g2);g2.connect(ctx.destination);s2.start(now,off);p._g=g2;SCF.srcs.push(s2);});}
  if(mode==='notes'){var ti=KEYSI()[0]||1;trxQuant().forEach(function(n){var at=t0+n.s*sd-off;if(at<-0.01)return;playNote(ti,n.m,n.v*0.85,now+at,Math.max(0.08,n.l*sd));});SCF.notes=true;
    TRX.parts.forEach(function(p){if(p.k!=='drum'||!p.show)return;trxQP(p).forEach(function(n){var at=t0+n.s*sd-off;if(at<-0.01)return;var pd=n.pad===0?garPad('kick'):n.pad===1?garPad('snare'):garPad('hat');if(pd>=0)trigPad(pd,0.8,now+at);});});
    if(mode==='notes'){var endS=0;trxQuant().forEach(function(n){endS=Math.max(endS,t0+(n.s+n.l)*sd);});SCF.tw2=setTimeout(function(){if(SCF.on&&SCF.mode==='notes')scStop();},Math.max(0,(endS-off+0.8))*1000);}}
  SCF.q=trxQuant();SCF.startT=now;SCF.on=true;var b=$('#scPP');b.textContent='❚❚';b.setAttribute('aria-label','Pause');
  SCF.timer=new ABCJS.TimingCallbacks(SCVIS[0],{qpm:TRX.bpm,eventCallback:scEvent});
  var scoreSec=off-t0,delay=(now-ctx.currentTime)+lat;
  if(scoreSec>=0){SCF.tw=setTimeout(function(){if(SCF.on&&SCF.timer)SCF.timer.start(scoreSec+lat*0,'seconds');},delay*1000);}
  else SCF.tw=setTimeout(function(){if(SCF.on&&SCF.timer)SCF.timer.start(0,'seconds');},(delay-scoreSec)*1000);
  (function loop(){if(!SCF.on)return;if($('#scoreOv').hidden){scStop();return;}var p=scNow();$('#scSeek').value=String(p);scTime();var act=scActive(p-lat-(TRX.t0||0)),key=act.join(',');if(key!==SCF.litKey){SCF.litKey=key;var L={};act.forEach(function(m){L[m]=1;});SCF.lit=L;scKbDraw();}if(p>=TRX.orig.duration+0.3&&SCF.mode!=='notes'){scStop();scClear();SCF.pos=0;return;}SCF.raf=requestAnimationFrame(loop);})();}
function initScf(){
  var ov=$('#scoreOv');if(!ov||$('#scPlay'))return;var d=document.createElement('div');d.id='scPlay';d.hidden=true;
  d.innerHTML='<canvas id="scKb" aria-hidden="true"></canvas><div class="sc-row"><button id="scPP" class="sc-pp" aria-label="Play">▶</button><div class="sc-mid"><input type="range" id="scSeek" min="0" max="1" step="0.1" value="0" aria-label="Position"><div class="sc-sub"><span id="scT">0:00 / 0:00</span><div class="seg" role="group" aria-label="What to hear" id="scMode"><button data-scm="rec" aria-pressed="true">Original</button><button data-scm="stems" aria-pressed="false">Stems</button><button data-scm="notes" aria-pressed="false">Notes</button></div></div></div></div><div class="chips" id="scStems" hidden></div>';
  ov.appendChild(d);
  $('#scPP').addEventListener('click',function(){if(SCF.on)scStop(true);else scPlay();});
  $$('#scMode [data-scm]').forEach(function(b){b.addEventListener('click',function(){SCF.mode=b.getAttribute('data-scm');scStemsUI();if(SCF.on)scPlay();});});
  var sk=$('#scSeek');sk.addEventListener('input',function(){var was=SCF.on;if(was)scStop(true);SCF.pos=+sk.value;scTime();if(was)scPlay();});
  $('#scoreClose').addEventListener('click',function(){scStop();});
  window.addEventListener('resize',function(){if(!$('#scPlay').hidden)scKb();});
}
function scStemsUI(){var multi=TRX.parts&&TRX.parts.length>1;var sb=$('#scMode [data-scm="stems"]');if(sb)sb.hidden=!multi;if(!multi&&SCF.mode==='stems')SCF.mode='rec';
  $$('#scMode [data-scm]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-scm')===SCF.mode);});
  var w=$('#scStems');w.hidden=!(multi&&SCF.mode==='stems');if(!multi)return;
  w.innerHTML=TRX.parts.map(function(p,i){return '<button data-sst="'+i+'" aria-pressed="'+!!p.aud+'">'+p.name+'</button>';}).join('')+'<button data-sso="1">All</button><span class="mu" style="font-size:11px;width:100%">Tap to mute or unmute. Hold to hear one alone.</span>';
  $$('#scStems [data-sst]').forEach(function(b){b.addEventListener('click',function(){var p=TRX.parts[+b.getAttribute('data-sst')];p.aud=!p.aud;b.setAttribute('aria-pressed',p.aud);if(p._g)p._g.gain.setTargetAtTime(p.aud?1:0,ctx.currentTime,0.02);});
    var lp=null;b.addEventListener('pointerdown',function(){lp=setTimeout(function(){var i=+b.getAttribute('data-sst');TRX.parts.forEach(function(p,j){p.aud=j===i;if(p._g)p._g.gain.setTargetAtTime(p.aud?1:0,ctx.currentTime,0.02);});scStemsUI();toast('Solo: '+TRX.parts[i].name,1000);},500);});['pointerup','pointerleave'].forEach(function(ev){b.addEventListener(ev,function(){clearTimeout(lp);});});});
  var so=w.querySelector('[data-sso]');so.textContent='All';so.addEventListener('click',function(){TRX.parts.forEach(function(p){p.aud=true;if(p._g)p._g.gain.setTargetAtTime(1,ctx.currentTime,0.02);});scStemsUI();});}

/* ===================== GUITAR & BASS TABS =====================
   Turns the transcribed notes into tablature. Each note gets a string and a fret chosen so the hand moves as little
   as possible (a Viterbi search over playable shapes), then the tab is drawn, followed during playback and exported
   as text, PDF or MusicXML with string/fret technical marks. */
