var LCD={pos:'',bpm:'',key:'',n:4,b:-2,play:null,rec:null};
function lcdPos(){if(!ctx)return {t:'1.1.1',b:-1,n:4};
  if(bandRunning()){var sd=stepDur(),el=ctx.currentTime-(ctx.outputLatency||0)-BR.t0,N=BR.N||bandN(),G=bandGroups();if(el<0)return {t:'IN',c:1,b:-1,n:G.length};
    var st=Math.floor(el/sd),bar=Math.floor(st/N),s=st%N,b=0;G.forEach(function(g,i){if(s>=g.s)b=i;});return {t:(bar+1)+'.'+(b+1)+'.'+(s-G[b].s+1),b:b,n:G.length};}
  var g,cnt=false;if(seq.on&&seq.mode==='arrange'){g=arrPosNow();if(g<arr.startG)cnt=true;}else if(seq.on){g=Math.max(0,(ctx.currentTime-(ctx.outputLatency||0)-seq.audStart)/stepDur());}else g=daw.play||0;
  if(cnt){var c=Math.floor(((g-arr.startG+16)%16)/4);return {t:'IN '+(4-c),c:1,b:c,n:4};}
  g=Math.max(0,g);return {t:(Math.floor(g/16)+1)+'.'+(Math.floor((g%16)/4)+1)+'.'+(Math.floor(g%4)+1),b:seq.on?Math.floor((g%16)/4):-1,n:4};}
function lcdTick(){var p=lcdPos(),e;
  if(p.t!==LCD.pos){LCD.pos=p.t;e=$('#lcdPos');e.textContent=p.t;e.classList.toggle('cnt',!!p.c);}
  var bpm=String(Math.round(P.bpm.v));if(bpm!==LCD.bpm){LCD.bpm=bpm;$('#lcdBpm').textContent=bpm;}
  var key=GNOTE[GAR.key||0]+(GAR.minor?' min':' maj')+' · '+((GAR.band&&GAR.band.meter)||'4/4');if(key!==LCD.key){LCD.key=key;$('#lcdKey').textContent=key;}
  var n=Math.max(2,Math.min(7,p.n||4));if(n!==LCD.n){LCD.n=n;var h='';for(var i=0;i<n;i++)h+='<i></i>';$('#lcdBeat').innerHTML=h;LCD.b=-2;}
  if(p.b!==LCD.b){LCD.b=p.b;$$('#lcdBeat i').forEach(function(x,i){x.className=i===p.b?(i===0?'on':'on dn'):'';});}
  var on=!!(seq.on||bandRunning()||(typeof llRunning==='function'&&llRunning())||prevPlaying());if(on!==LCD.play){LCD.play=on;var hp=$('#hPlay');hp.textContent=on?'■':'▶';hp.setAttribute('aria-label',on?'Stop':'Play');hp.classList.toggle('on',on);}
  var rc=!!((seq.on&&seq.rec)||arr.rec||wavRec||capture||ECHO.rec);if(rc!==LCD.rec){LCD.rec=rc;var r=$('#tRec');r.classList.toggle('on',rc);r.setAttribute('aria-label',rc?'Stop recording':'Record');r.setAttribute('aria-pressed',rc);}}
function tRecGo(){var id=showTab.cur;
  if(ECHO.rec){echoStop();return;}if(capture){stopCapture();return;}
  if(wavRec&&id!=='t-fx'){$('#rec').click();return;}
  if(id==='t-gar'){garRecord();return;}if(id==='t-home'){echoStart();return;}
  var m={'t-daw':'#dawRec','t-song':'#trRec','t-pad':'#jamRec','t-fx':'#rec','t-cap':'[data-cap="A"]','t-ins':'[data-cap="A"]','t-mod':'[data-cap="A"]'}[id],b=m&&$(m);if(b)b.click();}
/* ---------- design v2: Home, sounds & ideas shelf, Echo Drop ---------- */
var SHELF=SHELF||[],ECHO={rec:false,down:0,pend:false,raf:0,pk:[],ci:0,item:null,on:true,ti:1,tap:false};
try{ECHO.on=localStorage.getItem('ecou.echo')!=='0';}catch(e){}
var RMOT=function(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function shelfSave(bid){return (SHELF||[]).map(function(it){return {id:it.id,name:it.name,root:it.root,det:!!it.det,conf:it.conf||0,cents:it.cents||0,sus:!!it.sus,perc:!!it.perc,t:it.t,kind:it.kind||'sound',sub:it.sub||null,x:it.x||null,buf:bid(it.buf)};});}
function shelfLoad(a,gb){SHELF=(Array.isArray(a)?a:[]).map(function(o){var b=o.buf==null?null:gb(o.buf);if(!b&&!(o.kind==='idea'&&o.x))return null;if(b)b._cap=1;var it={};for(var k in o)it[k]=o[k];it.buf=b;return it;}).filter(Boolean);ECHO.item=null;var c=$('#echoCard');if(c)c.hidden=true;renderShelf();}
function shelfAdd(it){SHELF=(SHELF||[]).filter(function(x){return x!==it&&x.id!==it.id;});it.t=it.t||Date.now();SHELF.unshift(it);if(SHELF.length>24)SHELF.length=24;renderShelf();}
function pkDraw(cv,d,col){var dpr=window.devicePixelRatio||1,w=cv.clientWidth||140,h=cv.clientHeight||44;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);g.fillStyle=col;
  var bars=Math.max(8,Math.floor(w/3)),st=d.length/bars,mid=h/2;for(var x=0;x<bars;x++){var m=0,a=Math.floor(x*st),b=Math.floor((x+1)*st);for(var i=a;i<b;i+=3){var v=d[i]<0?-d[i]:d[i];if(v>m)m=v;}var hh=Math.max(0.75,Math.min(1,m*1.1)*(h-8)/2);g.fillRect(x*3+1,mid-hh,2,hh*2);}}
var SHI={play:'<svg class="f" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',inst:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',song:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="9" height="4" rx="1.5"/><rect x="8" y="10.5" width="13" height="4" rx="1.5"/><rect x="5" y="16" width="8" height="4" rx="1.5"/></svg>'};
function itNote(it){return it.det?nname(ftom(it.root)):'no pitch';}
function renderShelf(){var w=$('#shelf');if(!w)return;var L=(SHELF||[]).slice().sort(function(a,b){return (b.t||0)-(a.t||0);});
  if(!L.length){w.innerHTML='<p class="hm-empty">Sounds you catch land here, newest first. Hold the button above to catch your first one.</p>';return;}
  w.innerHTML=L.map(function(it){var n=escapeH(it.name),id=it.kind==='idea',x=it.x||{},sub=id?(it.sub==='hum'?'melody'+(x.key?' '+GNOTE[x.key[0]]+(x.key[1]?'m':''):''):it.sub==='strum'?(x.chords?x.chords.length:0)+' bars of chords':it.sub==='tap'?(x.bpm||'')+' BPM':'voice memo'):itNote(it)+(it.perc?' · hit':'');
    return '<div class="hm-so" role="listitem" data-shid="'+it.id+'"><canvas aria-hidden="true"></canvas><b>'+n+'</b><span>'+(id?'Idea':'Sound')+' · '+escapeH(sub)+'</span><div class="r3"><button data-sh="hear" aria-label="Hear '+n+'">'+SHI.play+'</button>'+
      (id?'<button data-sh="dev" aria-label="Develop '+n+'">'+SHI.inst+'</button>':'<button data-sh="card" aria-label="Open the sound card for '+n+'">'+SHI.inst+'</button>')+'<button data-sh="song" aria-label="Use '+n+' in a song">'+SHI.song+'</button></div></div>';}).join('');
  $$('#shelf .hm-so').forEach(function(el){var it=shelfGet(el.getAttribute('data-shid'));if(it)ideaDraw(el.querySelector('canvas'),it);});}
function shelfGet(id){for(var i=0;i<(SHELF||[]).length;i++)if(SHELF[i].id===id)return SHELF[i];return null;}
function hearBuf(b){if(!ensureAudio()||!b)return;var s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=0.9;s.buffer=b;s.connect(g);g.connect(N.post);s.start();}
function keysTi(){if(tracks[1]&&tracks[1].kind==='keys')return 1;for(var i=0;i<tracks.length;i++)if(tracks[i].kind==='keys')return i;return 1;}
/* make a sound the Keys track's instrument, the way Capture does: Source A of the selected keys track, A only, sampler */
function echoAsKeys(it){var ti=keysTi();if(ti!==selTrack)selectTrack(ti);
  if(!(slots.A&&slots.A.buf===it.buf&&engine==='sampler'&&P.morph.v===0)){setEngine('sampler');setParam('morph',0);loopOn=!!it.sus;var lb=$('#loop');if(lb)lb.checked=loopOn;setSlot('A',it.buf,it.name,it.root,!!it.det,it.conf);}
  tracks[ti].own=1;saveSound(ti);ECHO.ti=ti;return ti;}
function echoSt(t){var e=$('#echoSt');if(e)e.textContent=t;}
function echoUI(){var h=$('#echoHero'),b=$('#echoBtn');if(!h)return;h.classList.toggle('rec',ECHO.rec);document.body.classList.toggle('echo-rec',ECHO.rec);b.setAttribute('aria-pressed',ECHO.rec?'true':'false');
  b.setAttribute('aria-label',ECHO.rec?'Stop recording and keep the sound':'Echo Drop: hold to record a sound and release, or tap to start and tap again to stop');if(!ECHO.rec){var l=$('#echoLvl');if(l)l.style.transform='';}}
function echoStart(){if(ECHO.rec||!ensureAudio())return;if(capture)stopCapture();$('#echoDenied').hidden=true;ECHO.rec=true;ECHO.pend=false;ECHO.pk=[];ECHO.ci=0;echoUI();echoSt('Listening… release to keep it');
  startCapture('ECHO');if(!ECHO.raf)ECHO.raf=requestAnimationFrame(echoTick);}
function echoStop(){if(!ECHO.rec)return;var c=capture;if(c&&c.target==='ECHO'){if(performance.now()-c.t0<450){ECHO.pend=true;return;}ECHO.rec=false;echoUI();$('#echoHero').classList.add('busy');echoSt('Listening back…');stopCapture();}else ECHO.pend=true;}
function echoDenied(){ECHO.rec=false;ECHO.pend=false;echoUI();$('#echoHero').classList.remove('busy');$('#echoDenied').hidden=false;echoSt('The microphone is blocked, so Echo Drop can’t listen.');}
function echoTick(){var c=capture;if(!ECHO.rec){ECHO.raf=0;return;}ECHO.raf=requestAnimationFrame(echoTick);if(!c||c.target!=='ECHO')return;
  var lv=0;while(ECHO.ci<c.chunks.length){var ch=c.chunks[ECHO.ci++],q=ch.length>>2;for(var s=0;s<4;s++){var m=0;for(var i=s*q;i<(s+1)*q;i+=2){var v=ch[i]<0?-ch[i]:ch[i];if(v>m)m=v;}ECHO.pk.push(m);if(m>lv)lv=m;}}
  if(lv){var f=clamp((20*Math.log10(lv+1e-6)+50)/50,0,1);$('#echoLvl').style.transform='scale('+(1+f*0.35).toFixed(3)+')';}
  var cv=$('#echoWave');if(cv&&cv.offsetWidth){var dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
    var g=cv.getContext('2d'),n=ECHO.pk.length,span=Math.max(n,Math.ceil(2.5*ctx.sampleRate/1024)),bw=W/span;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.fillStyle='#FF5470';
    for(var k=0;k<n;k++){var hh=Math.max(0.75,Math.min(1,ECHO.pk[k]*1.4)*(H-2)/2);g.fillRect(k*bw,H/2-hh,Math.max(1,bw*0.7),hh*2);}}
  if(ECHO.pend&&performance.now()-c.t0>=450){ECHO.pend=false;echoStop();}}
function echoNextName(){var n=0;(SHELF||[]).forEach(function(x){var m=/^Sound (\d+)$/.exec(x.name);if(m)n=Math.max(n,+m[1]);});return 'Sound '+(Math.max(n,(SHELF||[]).length)+1);}
function echoDone(data,sr){ECHO.rec=false;ECHO.pend=false;echoUI();$('#echoHero').classList.remove('busy');$('#echoDenied').hidden=true;
  var tr=trim(capClean(Float32Array.from(data),sr),sr);if(!tr){echoSt('That was too quiet or too short. Move closer to the mic and try again.');return;}
  normCap(tr,sr);var buf=ctx.createBuffer(1,tr.length,sr);buf.getChannelData(0).set(tr);buf._cap=1;
  var pe=detectPitchEx(tr,sr),lp=findLoop(tr,sr,pe?sr/pe.hz:0);
  var it={id:'s'+Date.now().toString(36)+Math.floor(Math.random()*1e4),name:echoNextName(),buf:buf,root:pe?pe.hz:261.63,det:!!pe,conf:pe?pe.conf:0,cents:pe?pe.cents:0,sus:!!lp,t:Date.now(),kind:'sound'};
  it.perc=!it.sus||!it.det;ECHO.item=it;shelfAdd(it);echoAsKeys(it);markDirty();
  echoRipple();try{if(navigator.vibrate)navigator.vibrate([12,40,24]);}catch(e){}
  var kn=GNOTE[GAR.key||0]+(GAR.minor?' minor':' major');
  if(ECHO.on){echoSing(it);echoSt('Caught “'+it.name+'”'+(it.det?' ('+itNote(it)+')':'')+'. It’s singing back in '+kn+'.');}else echoSt('Caught “'+it.name+'”. It’s ready on the keys.');
  echoCard(it);}
/* the sound sings back: a short arpeggio in the project key on the keys track, using the sound itself */
function echoSing(it){if(!ctx)return 0;var ti=ECHO.ti,k=GAR.key||0,mi=!!GAR.minor,base=60+k;if(base>66)base-=12;var iv=[0,mi?3:4,7,12,7],d=clamp(30/P.bpm.v,0.13,0.24),t0=ctx.currentTime+0.12,n=0;
  iv.forEach(function(x,i){playNote(ti,base+x,0.82,t0+i*d,d*0.92);n++;});playNote(ti,base,0.78,t0+iv.length*d,d*3);return n+1;}
function echoRipple(){var r=$('#echoRip');if(!r)return;clearTimeout(echoRipple.t);if(RMOT()){r.className='hm-rip static';r.innerHTML='<i></i>';echoRipple.t=setTimeout(function(){r.innerHTML='';},900);}
  else{r.className='hm-rip';r.innerHTML='';void r.offsetWidth;r.innerHTML='<i></i><i></i><i></i>';echoRipple.t=setTimeout(function(){r.innerHTML='';},2000);}}
function echoCard(it){var c=$('#echoCard');if(!it){c.hidden=true;return;}ECHO.item=it;c.hidden=false;scFill(c,it);
  setTimeout(function(){try{c.scrollIntoView({block:'nearest',behavior:RMOT()?'auto':'smooth'});}catch(e){}},60);}
function echoNoteUI(it){var c=$('#echoCard');if(c&&c._it===it)scNoteUI(c,it);}
function echoOct(d){var it=ECHO.item;if(!it||!it.det)return;var r=it.root*Math.pow(2,d);if(r<16||r>8000)return;it.root=r;
  if(slots.A&&slots.A.buf===it.buf){slots.A.root=r;slots.A.conf=1;slotUI('A');saveSound(selTrack);}echoNoteUI(it);renderShelf();markDirty();
  if(ctx&&slots.A&&slots.A.buf===it.buf){var b=60+(GAR.key||0);if(b>66)b-=12;playNote(selTrack,b,0.8,ctx.currentTime+0.02,0.45);}
  toast('“'+it.name+'” now plays as '+itNote(it)+' on the keys.',1800);}
function echoPlayIt(it){if(!it||!ensureAudio())return;
  if(it.perc){var pi=echoPadFor(it);if(pi!==padSel)selectPad(pi);var pd=pads[padSel];pd.buf=it.buf;pd.name=it.name.slice(0,14);pd.cls='other';renderPads();selectPad(padSel);markDirty();showTab('t-pad');toast('“'+it.name+'” is on pad '+(padSel+1)+'. Tap it, or put it in the steps.',2600);return;}
  var ti=echoAsKeys(it);GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('keys',ti);toast('Play “'+it.name+'” on the keys.',2000);}
/* a percussive Echo goes to a free/user pad, never onto a kit pad (kick/snare/hat) that lessons and grooves rely on */
function echoPadFor(it){var i,kit=function(p){return p&&!!p.buf&&p.cls!=='other'&&!slUser(p);};for(i=0;i<pads.length;i++)if(pads[i].buf===it.buf)return i;
  if(pads[padSel]&&!kit(pads[padSel]))return padSel;for(i=0;i<pads.length;i++)if(!pads[i].buf)return i;for(i=pads.length-1;i>=0;i--)if(!kit(pads[i]))return i;
  for(i=pads.length-1;i>=0;i--)if(['kick','snare','hat'].indexOf(pads[i].cls)<0)return i;return pads.length-1;}
function echoTransform(it){if(!it||!ensureAudio())return;echoAsKeys(it);showTab('t-cap');setTimeout(function(){slOpen('A');},40);}
function echoSong(it){if(!it)return;shelfAdd(it);echoAsKeys(it);markDirty();navGo('song');toast('“'+it.name+'” is on '+tracks[ECHO.ti].name+'. Record a part, or add it to a section.',2600);}
function agoTxt(t){var m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago';}
function homeProj(){var w=$('#homeProj');if(!w)return;
  idbReq('meta','readonly',function(st){return st.getAll();}).then(function(list){list=(list||[]).sort(function(a,b){return b.updated-a.updated;}).slice(0,4);
    if(!list.length){w.innerHTML='<p class="hm-empty">Your saved projects appear here.</p>';return;}
    w.innerHTML=list.map(function(m){return '<button data-hp="'+escapeH(m.id)+'" aria-label="Open project '+escapeH(m.name)+'"><span class="ic">'+SHI.song+'</span><span class="tx"><b>'+escapeH(m.name)+'</b><span>'+(m.bars||0)+' bar'+(m.bars===1?'':'s')+' · '+(m.bpm||'')+' BPM · '+agoTxt(m.updated)+'</span></span></button>';}).join('');
    $$('#homeProj [data-hp]').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-hp'),go=function(){openProject(id).then(function(){if(showTab.cur==='t-home')homeShown();});};if(dirty&&ctx)saveProject(true).then(go);else go();});});
  }).catch(function(){w.innerHTML='<p class="hm-empty">Device storage isn’t available in this view.</p>';});}
function homeShown(){renderShelf();homeProj();lnCardUI();}
function initHome(){
  document.body.appendChild($('#garSheet'));
  $('#lcd').addEventListener('click',garTempoSheet);$('#tRec').addEventListener('click',tRecGo);setInterval(lcdTick,60);lcdTick();
  var b=$('#echoBtn');
  b.addEventListener('pointerdown',function(e){if(e.button>0)return;e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(x){}if(ECHO.rec){ECHO.tap=true;echoStop();return;}ECHO.down=performance.now();echoStart();});
  b.addEventListener('pointerup',function(){if(ECHO.tap){ECHO.tap=false;return;}if(!ECHO.rec)return;if(performance.now()-ECHO.down>=400)echoStop();else echoSt('Recording… tap again to stop');});
  b.addEventListener('pointercancel',function(){if(ECHO.rec&&performance.now()-ECHO.down>=400)echoStop();});
  b.addEventListener('click',function(e){if(e.detail===0){if(ECHO.rec)echoStop();else echoStart();}});
  b.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#echoRetry').addEventListener('click',echoStart);$('#echoImp').addEventListener('click',function(){ensureAudio();});
  $('#f-ECHO').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(f){$('#echoHero').classList.add('busy');echoSt('Importing…');upload('ECHO',f);}});
  var sw=$('#echoOn');function swUI(){sw.setAttribute('aria-checked',ECHO.on?'true':'false');$('#echoOnT').textContent=ECHO.on?'Echo Drop is on':'Echo Drop is off';}swUI();
  sw.addEventListener('click',function(){ECHO.on=!ECHO.on;try{localStorage.setItem('ecou.echo',ECHO.on?'1':'0');}catch(e){}swUI();});
  scBuild($('#echoCard'));$('#echoCard [data-sca="play"]').id='echoPlay';$('#echoCard [data-sca="xf"]').id='echoXf';$('#echoCard [data-sca="song"]').id='echoSong';$('#echoCard [data-sc="name"]').id='echoName';
  $('#shelf').addEventListener('click',function(e){var x=e.target.closest('[data-sh]');if(!x)return;var it=shelfGet(x.closest('[data-shid]').getAttribute('data-shid'));if(!it)return;var k=x.getAttribute('data-sh');
    if(it.kind==='idea'){ensureAudio();if(k==='hear')ideaHear(it);else if(k==='dev')ideaDevSheet(it);else ideaDev(it,'song');return;}
    if(k==='hear')hearBuf(it.buf);else if(k==='card')scOpen(it);else echoSong(it);});
  $$('#t-home [data-qs]').forEach(function(q){q.addEventListener('click',function(){var k=q.getAttribute('data-qs');ensureAudio();
    if(k==='band'){GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('band');}else if(k==='inst'){GAR.view='sounds';showTab('t-gar');}else if(k==='pads')showTab('t-pad');else if(k==='morph'){showTab('t-ins');try{setEngine('sampler');}catch(e){}setTimeout(function(){var m=$('#morphState');if(m&&m.closest('.card'))m.closest('.card').scrollIntoView({block:'center'});},120);}else if(k==='sing'){GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('vocal');}else navGo('song');});});
  $('#shelfLib').addEventListener('click',function(){showTab('t-ins');});
  $('#homeAllProj').addEventListener('click',function(){navGo('song');listProjects();setTimeout(function(){var p=$('#projList');if(p)p.scrollIntoView({block:'center'});},120);});
  renderShelf();
}
initHome();
/* ---------- design v2: sound card (one card for every captured sound: Echo Drop, Capture A/B, shelf) ---------- */
function scBuild(root){root.classList.add('sc');
  root.innerHTML='<div class="hm-ch"><p class="hm-eye" data-sc="meta">Captured just now</p><input class="hm-name" data-sc="name" aria-label="Sound name" maxlength="28" autocomplete="off"></div>'+
  '<canvas class="hm-wv" data-sc="wave" role="img" aria-label="Waveform"></canvas>'+
  '<div class="hm-det"><div class="hm-dl"><span class="hm-sm">Detected note</span><div class="hm-note"><b data-sc="note">–</b><span data-sc="hz"></span></div><div class="hm-conf"><span class="hm-bar"><i data-sc="bar"></i></span><span data-sc="conf"></span></div></div>'+
  '<div class="hm-oct"><span class="hm-sm">Octave</span><div><button data-sca="oct-" aria-label="Octave down">−</button><button data-sca="oct+" aria-label="Octave up">+</button></div></div></div>'+
  '<div class="hm-act"><button class="pri" data-sca="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>Play it</button><button data-sca="xf" aria-expanded="false">Transform</button><button data-sca="song">Use in song</button><button data-sca="send" aria-expanded="false" aria-label="Send to a pad, the keys, the song or the mixer">→</button></div>'+
  '<div class="sc-xf" data-sc="xfg" role="group" aria-label="Transform" hidden>'+
   '<button data-sca="slice"><b>Slice</b><span>hits → pads</span></button><button data-sca="gran"><b>Granular</b><span>cloud · pad</span></button>'+
   '<button data-sca="morph"><b>Morph with…</b><span>A ↔ this sound</span></button><button data-sca="voice"><b>Voice tools</b><span>tune · voice morph</span></button>'+
   '<button data-sca="fx"><b>FX</b><span>space · drive</span></button></div>'+
  '<p class="sc-dl" data-sc="dl" hidden>Tap where to send it</p><div class="sc-dock" data-sc="dock" role="group" aria-label="Send to" hidden>'+
   '<button data-sca="pad">Pad</button><button data-sca="keys">Keys</button><button data-sca="clip">Song</button><button data-sca="mix">Mix</button></div>';
  root.addEventListener('click',function(e){var b=e.target.closest('[data-sca]');if(!b||!root._it)return;scAct(root._it,b.getAttribute('data-sca'),root);});
  var nm=root.querySelector('[data-sc="name"]');
  nm.addEventListener('input',function(){var it=root._it;if(!it)return;it.name=this.value.trim()||it.name;var sk=it.slot||(slots.A&&slots.A.buf===it.buf?'A':null);if(sk&&slots[sk]&&slots[sk].buf===it.buf){slots[sk].name=it.name;slotUI(sk);}});
  nm.addEventListener('change',function(){renderShelf();markDirty();});}
function scQ(root,k){return root.querySelector('[data-sc="'+k+'"]');}
function scFill(root,it){root._it=it;scQ(root,'name').value=it.name;
  scQ(root,'meta').textContent=(it.slot?'Source '+it.slot:(Date.now()-it.t<60000?'Captured just now':'Captured '+new Date(it.t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})))+' · '+dec(it.buf.duration,1)+' s · '+(it.sus?'sustained':'decaying');
  var cv=scQ(root,'wave');cv.setAttribute('aria-label','Waveform of '+it.name+', '+dec(it.buf.duration,1)+' seconds');requestAnimationFrame(function(){pkDraw(cv,it.buf.getChannelData(0),'#7CF29A');});
  scNoteUI(root,it);scPanel(root,null);
  root.querySelector('[data-sca="play"]').setAttribute('aria-label','Play it: open '+(it.perc&&!it.slot?'the pads':'the keys')+' with '+it.name);
  var v=root.querySelector('[data-sca="voice"]');v.disabled=!it.det;v.setAttribute('aria-label',it.det?'Voice tools: tune or voice-morph '+it.name:'Voice tools need a voiced, pitched sound');}
function scNoteUI(root,it){var n=scQ(root,'note');n.textContent=it.det?itNote(it):'No pitch';n.classList.toggle('np',!it.det);var ct=Math.round(it.cents||0);
  scQ(root,'hz').textContent=it.det?Math.round(it.root)+' Hz · '+(ct<0?'−':'+')+Math.abs(ct)+' ct':'plays like percussion';
  var cf=it.det?Math.round((it.conf||0)*100):0;scQ(root,'bar').style.width=cf+'%';scQ(root,'conf').textContent=it.det?cf+'% sure'+(cf<60?' · check the octave':''):'unpitched';
  root.querySelector('[data-sca="oct-"]').disabled=!it.det;root.querySelector('[data-sca="oct+"]').disabled=!it.det;}
function scPanel(root,which){var x=scQ(root,'xfg'),d=scQ(root,'dock'),bx=root.querySelector('[data-sca="xf"]'),bs=root.querySelector('[data-sca="send"]');
  x.hidden=which!=='xf';d.hidden=which!=='send';scQ(root,'dl').hidden=which!=='send';bx.setAttribute('aria-expanded',which==='xf'?'true':'false');bs.setAttribute('aria-expanded',which==='send'?'true':'false');
  if(which==='send'&&root._it){var pb=root.querySelector('[data-sca="pad"]'),pi=echoPadFor(root._it);pb.textContent='Pad '+(pi+1);pb.setAttribute('aria-label','Send to pad '+(pi+1));
    root.querySelector('[data-sca="keys"]').setAttribute('aria-label','Send to the Keys sampler');root.querySelector('[data-sca="clip"]').setAttribute('aria-label','Add to the song as an audio clip at the playhead');root.querySelector('[data-sca="mix"]').setAttribute('aria-label','Open its mixer strip');}
  if(which){var el=which==='xf'?x:d;setTimeout(function(){try{el.scrollIntoView({block:'nearest',behavior:RMOT()?'auto':'smooth'});}catch(e){}},30);}}
function scSlotItem(k){var s=slots[k];if(!s||!s.buf){toast('Record or import a sound into Source '+k+' first.');return null;}
  return {id:'slot'+k,name:s.name,buf:s.buf,root:s.root,det:!!s.det,conf:s.conf==null?(s.det?1:0):s.conf,cents:0,sus:!!loopOn,perc:!s.det,t:Date.now(),kind:'sound',slot:k};}
function scDetach(it){if(!it.slot)return it;var o={};for(var k in it)if(k!=='slot')o[k]=it[k];o.id='s'+Date.now().toString(36)+Math.floor(Math.random()*1e4);o.t=Date.now();return o;}
function scPrep(it){if(it.slot)return selTrack;return echoAsKeys(it);}
function scOpen(it){if(!it||!it.buf)return;var s=$('#scSheet');s.hidden=false;scFill($('#scSheetC'),it);ideaFabSync();setTimeout(function(){var f=s.querySelector('[data-sca="play"]');if(f)f.focus();},30);}
function scClose(){var s=$('#scSheet');if(s&&!s.hidden){s.hidden=true;ideaFabSync();}}
function scOct(root,d){var it=root._it;if(!it||!it.det)return;
  if(it.slot){var b=$('[data-oct="'+it.slot+'"][data-d="'+d+'"]');if(b)b.click();it.root=slots[it.slot].root;it.conf=1;scNoteUI(root,it);return;}
  ECHO.item=it;echoOct(d);scNoteUI(root,it);var ec=$('#echoCard');if(ec&&ec._it===it&&ec!==root)scNoteUI(ec,it);}
function scScroll(sel){setTimeout(function(){var m=$(sel);if(m){var c=m.closest('.card')||m;try{c.scrollIntoView({block:'center'});}catch(e){}}},140);}
function scAct(it,a,root){if(a==='xf'||a==='send'){var open=root.querySelector('[data-sca="'+a+'"]').getAttribute('aria-expanded')==='true';scPanel(root,open?null:a);return;}
  if(a==='oct-'||a==='oct+'){scOct(root,a==='oct+'?1:-1);return;}
  if(!ensureAudio())return;var nm='“'+it.name+'”',ti;
  if(a!=='voice'||it.det)scClose();
  if(a==='play'){if(it.slot){GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('keys',selTrack);toast('Play '+nm+' on the keys.',2000);}else echoPlayIt(it);}
  else if(a==='song')echoSong(scDetach(it));
  else if(a==='slice'){if(it.slot){showTab('t-cap');setTimeout(function(){slOpen(it.slot);},40);}else echoTransform(it);}
  else if(a==='gran'){scPrep(it);setEngine('granular');showTab('t-ins');scScroll('[data-engine="granular"]');toast(nm+' is now a granular cloud on '+tracks[selTrack].name+'. Play the keys; Grain size and Spray shape it.',3000);}
  else if(a==='morph'){if(!it.slot){ti=keysTi();if(ti!==selTrack)selectTrack(ti);setEngine('sampler');setSlot('B',it.buf,it.name,it.root,!!it.det,it.conf);if(P.morph.v<0.05)setParam('morph',0.5);tracks[ti].own=1;saveSound(ti);markDirty();}
    showTab('t-ins');scScroll('#morphState');toast('Morph: Source A ↔ '+(it.slot?'Source '+(it.slot==='A'?'B':'A'):nm+' (Source B)')+'. Slide A ↔ B to blend.',3000);}
  else if(a==='voice'){if(!it.det){toast('Voice tools work on sung or spoken sounds with a clear pitch. Try Granular or FX for this one.',2800);return;}scPrep(it);vtOpenSlot(it.slot||'A');}
  else if(a==='fx'){ti=scPrep(it);showTab('t-fx');toast(nm+' plays on '+tracks[ti].name+'. Shape it with the effects here.',2600);}
  else if(a==='pad'){var pi=echoPadFor(it);if(pi!==padSel)selectPad(pi);var pd=pads[padSel];pd.buf=it.buf;pd.name=it.name.slice(0,14);pd.cls='other';renderPads();selectPad(padSel);markDirty();showTab('t-pad');toast(nm+' is on pad '+(padSel+1)+'.',2200);}
  else if(a==='keys'){ti=scPrep(it);if(!it.slot)setEngine('sampler');toast(nm+' is now the Keys sampler on '+tracks[ti].name+'.',2200);}
  else if(a==='clip')scClip(it);
  else if(a==='mix'){ti=scPrep(it);navGo('mix');setTimeout(function(){var el=$('#t-fx [data-t="'+ti+'"]');if(el)try{el.scrollIntoView({block:'center'});}catch(e){}},140);toast('Mixer: '+tracks[ti].name+' carries '+nm+'.',2400);}
  try{if(navigator.vibrate)navigator.vibrate(10);}catch(e){}}
function scClip(it){var b=it.buf,st=Math.max(1,Math.ceil(b.duration/stepDur()));placeName=it.name.slice(0,16);var pl=placeAudio(Math.floor((daw.play||0)/16)*16,st);placeName=null;
  if(!pl||pl.ti<0){toast('There is no free audio track for it.');return null;}
  var c=newClip({type:'aud',ti:pl.ti,s:pl.s,off:0,dur:b.duration,buf:abufAdd(b),name:it.name});daw.sel=c.id;daw.lane=pl.ti;dawNeed=true;markDirty();
  try{renderMixer();renderSpUI();renderDawHeads();renderInsp();}catch(e){}showTab('t-daw');toast('“'+it.name+'” added to '+tracks[pl.ti].name+' at bar '+(pl.s/16+1)+'.',2400);return c;}
/* ---------- design v2: global Idea button + capture sheet (Hum, Strum, Voice memo, Tap tempo) ---------- */
