var ID={mode:'hum',st:'idle',last:null,taps:[],raf:0,lp:false,lpT:0,t0:0,cancel:false,raw:null,msg:''};
var IDM={hum:['Hum','melody','<path d="M3 12c2-6 3-6 4 0s2 6 4 0 2-6 4 0 2 6 4 0 1-4 2-2"/>'],strum:['Strum','chords','<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M17 3l3 3"/>'],memo:['Voice','memo','<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>'],tap:['Tap','tempo','<path d="M9 11V5a2 2 0 0 1 4 0v6l4 1.2a2 2 0 0 1 1.4 2.3L17.5 20H10l-4-5 1.5-1.5L9 15"/>']};
function idModesHTML(sel){return Object.keys(IDM).map(function(k){var m=IDM[k];return '<button data-idm="'+k+'"'+(sel?' role="tab" aria-selected="false"':'')+' aria-label="'+m[0]+' '+m[1]+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+m[2]+'</svg>'+m[0]+'<span>'+m[1]+'</span></button>';}).join('');}
function ideaFabSync(){var f=$('#ideaFab');if(!f)return;var cur=showTab.cur,sf=$('#startFresh'),
    hide=!cur||cur==='t-home'||document.body.classList.contains('ln-on')||!!document.querySelector('.gx-sheet:not([hidden])')||!!(sf&&sf.offsetParent)||($('#take')&&$('#take').classList.contains('show'))||($('#scoreOv')&&!$('#scoreOv').hidden)||($('#lnBub')&&!$('#lnBub').hidden);
  if(f.hidden!==hide){f.hidden=hide;document.body.classList.toggle('fab-on',!hide);}if(hide)return;
  var top=window.innerHeight;['nav','#kbwrap'].forEach(function(s){var e=$(s);if(e&&e.offsetParent){var r=e.getBoundingClientRect();if(r.height>0&&r.top<top&&r.top>window.innerHeight*0.35)top=r.top;}});
  var b=Math.round(window.innerHeight-top+14)+'px';if(f.style.bottom!==b)f.style.bottom=b;}
function ideaOpen(m){if(m&&IDM[m]&&m!==ID.mode){if(capture&&capture.target==='IDEA'){ID.cancel=true;stopCapture();}ID.mode=m;ID.st='idle';ID.msg='';}else if(ID.st==='res'&&!m){ID.st='idle';ID.msg='';}
  var s=$('#ideaSheet');s.hidden=false;ideaRender();ideaFabSync();setTimeout(function(){var f=s.querySelector('[data-idm="'+ID.mode+'"]');if(f&&document.activeElement===document.body)f.focus();},30);}
function ideaClose(){if(capture&&capture.target==='IDEA'){ID.cancel=true;stopCapture();}ID.st=ID.st==='rec'||ID.st==='busy'?'idle':ID.st;$('#ideaSheet').hidden=true;ideaFabSync();}
function ideaSt(t){ID.msg=t;var e=$('#idSt');if(e)e.textContent=t;}
function ideaHint(){var b=Math.round(P.bpm.v);return {hum:'Hum or sing a tune. I’ll write the notes, find the key and put it on the grid at '+b+' BPM.',strum:'Strum or play chords, about one chord per bar at '+b+' BPM. I’ll name them.',memo:'Say or sing anything. Add a note so you remember it.',tap:'Tap the pad in time, at least 4 times.'}[ID.mode];}
function ideaRender(){var B=$('#idBody');if(!B)return;$$('#ideaSheet [data-idm]').forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-idm')===ID.mode?'true':'false');});
  var h='';if(ID.mode==='tap'){h='<button class="id-tap" id="idTap" aria-describedby="idSt">Tap here</button><p class="id-bpm" id="idBpm" aria-live="polite">'+(ID.tapBpm?ID.tapBpm:'–')+'</p><p class="id-st" id="idSt" role="status">'+(ID.msg||ideaHint())+'</p>'+
      '<div class="id-row"><button id="idSetT"'+(ID.tapBpm?'':' disabled')+'>Set project tempo</button><button class="pri" id="idSaveT"'+(ID.tapBpm?'':' disabled')+'>Save idea</button></div>';}
  else if(ID.st==='res'&&ID.last)h=ideaResHTML(ID.last);
  else{var on=ID.st==='rec';h='<button class="id-rec'+(on?' on':'')+'" id="idRec" aria-pressed="'+on+'" aria-label="'+(on?'Stop and keep it':'Start recording: '+IDM[ID.mode][0]+' '+IDM[ID.mode][1])+'">'+(on?'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>')+'</button>'+
      '<p class="id-st" id="idSt" role="status" aria-live="polite">'+escapeH(ID.st==='busy'?'Listening back…':ID.msg||ideaHint())+'</p><div class="id-lv" aria-hidden="true"><i id="idLv"></i></div>'+
      '<label class="id-imp" for="f-IDEA">or import a recording</label><input type="file" id="f-IDEA" accept="audio/*" hidden>';}
  B.innerHTML=h;ideaBind(B);}
function ideaBind(B){var r=$('#idRec');if(r)r.addEventListener('click',ideaRec);
  var f=$('#f-IDEA');if(f)f.addEventListener('change',function(e){var x=e.target.files&&e.target.files[0];e.target.value='';if(x){ID.st='busy';ideaRender();upload('IDEA',x);}});
  var t=$('#idTap');if(t){t.addEventListener('pointerdown',function(e){e.preventDefault();ideaTap();});t.addEventListener('click',function(e){if(e.detail===0)ideaTap();});
    $('#idSetT').addEventListener('click',function(){if(!ID.tapBpm)return;setParam('bpm',ID.tapBpm);markDirty();toast('Project tempo set to '+ID.tapBpm+' BPM.',1800);});
    $('#idSaveT').addEventListener('click',function(){if(!ID.tapBpm)return;var it={id:'i'+Date.now().toString(36),kind:'idea',sub:'tap',name:'Tempo '+ID.tapBpm,buf:null,t:Date.now(),x:{bpm:ID.tapBpm}};shelfAdd(it);markDirty();toast('Saved “'+it.name+'” to Sounds & ideas.',1800);});}
  B.querySelectorAll('[data-idd]').forEach(function(b){b.addEventListener('click',function(){var a=b.getAttribute('data-idd');if(a==='again'){ID.st='idle';ID.msg='';ideaRender();return;}if(a==='hear'){ideaHear(ID.last);return;}if(a==='usedet'){var it=ID.last,x=it&&it.x;if(!x||!x.det||!it.buf)return;setParam('bpm',x.det);var S=strumAnalyse(it.buf.getChannelData(0),it.buf.sampleRate);if(S){x.chords=S.chords;x.key=S.key;}x.bpm=x.det;x.auto=true;markDirty();try{renderShelf();}catch(e){}ideaRender();toast('Project tempo set to '+x.det+' BPM.',1800);return;}ideaClose();ideaDev(ID.last,a);});});
  var tx=$('#idMemo');if(tx)tx.addEventListener('input',function(){if(ID.last&&ID.last.x){ID.last.x.text=this.value.slice(0,400);markDirty();}});if(tx)tx.addEventListener('change',renderShelf);
  var st=$('#idTi'),sp=$('#idPi');if(st&&sp){var mv=function(){ideaPlaceHum(ID.last,+st.value,+sp.value);renderShelf();};st.addEventListener('change',mv);sp.addEventListener('change',mv);}
  var cv=$('#idCv');if(cv&&ID.last)requestAnimationFrame(function(){ideaDraw(cv,ID.last);});}
function patName(i){return typeof PATN!=='undefined'&&PATN[i]?PATN[i]:String.fromCharCode(65+i);}
function keyName(k){return k?GNOTE[k[0]]+(k[1]?' minor':' major'):'';}
function ideaResHTML(it){var x=it.x||{},h='<div class="id-res" role="region" aria-label="Your idea">';
  if(it.sub==='hum'){var pl=x.pl||{};h+='<b class="id-big">'+escapeH(it.name)+'</b><canvas id="idCv" role="img" aria-label="Melody: '+x.notes.length+' notes in '+keyName(x.key)+'"></canvas><p>'+x.notes.length+' notes · '+keyName(x.key)+' · '+(x.len/16)+' bar'+(x.len>16?'s':'')+' at '+x.bpm+' BPM, on the 1/16 grid</p>'+
      '<p class="id-lbl">Saved as notes on</p><div class="id-row"><select id="idTi" aria-label="Instrument track">'+tracks.map(function(t,i){return t.kind==='keys'?'<option value="'+i+'"'+(i===pl.ti?' selected':'')+'>'+escapeH(t.name)+'</option>':'';}).join('')+'</select>'+
      '<select id="idPi" aria-label="Pattern">'+patterns.map(function(p,i){return '<option value="'+i+'"'+(i===pl.pi?' selected':'')+'>Pattern '+patName(i)+(i!==pl.pi&&patHas(p)?' (has notes)':'')+'</option>';}).join('')+'</select></div>'+
      '<div class="id-row"><button data-idd="hear">▶ Hear it</button><button data-idd="again">Hum again</button></div><p class="id-lbl">Develop</p><div class="id-row"><button class="pri" data-idd="play">Play</button><button data-idd="song">Song</button><button data-idd="band">Backing Band</button></div>';}
  else if(it.sub==='strum'){h+='<b class="id-big">'+escapeH(it.name)+'</b><div class="id-ch" aria-label="Chords, one per bar">'+x.chords.map(function(c){return '<b>'+escapeH(bandChName(c))+'</b>';}).join('')+'</div><p>'+x.chords.length+' bar'+(x.chords.length>1?'s':'')+' · key looks like '+keyName(x.key)+' · '+(x.auto?x.bpm+' BPM, detected from your strum':'at the project tempo, '+x.bpm+' BPM'+(x.det&&Math.abs(x.det-x.bpm)>=2?' (your strum sounds like '+x.det+')':''))+'</p>'+
      '<div class="id-row"><button data-idd="hear">▶ Hear chords</button>'+(!x.auto&&x.det&&Math.abs(x.det-x.bpm)>=2?'<button data-idd="usedet">Use detected '+x.det+' BPM</button>':'')+'<button data-idd="again">Strum again</button></div><p class="id-lbl">Develop</p><div class="id-row"><button class="pri" data-idd="band">Use as Backing Band part</button><button data-idd="song">Song</button></div>';}
  else{h+='<b class="id-big">'+escapeH(it.name)+'</b><canvas id="idCv" role="img" aria-label="Waveform of the memo, '+dec(it.buf.duration,1)+' seconds"></canvas><textarea class="id-memo" id="idMemo" aria-label="Note for this memo" placeholder="What is this idea? (lyrics, a reminder…)">'+escapeH(x.text||'')+'</textarea>'+
      '<div class="id-row"><button data-idd="hear">▶ Hear it</button><button data-idd="again">Record again</button></div><p class="id-lbl">Develop</p><div class="id-row"><button class="pri" data-idd="card">Sound card</button><button data-idd="song">Song</button></div>';}
  return h+'<p>It’s on Home › Sounds &amp; ideas.</p></div>';}
function ideaDraw(cv,it){var x=it.x||{};if(it.sub==='hum'&&x.notes&&x.notes.length){var dpr=window.devicePixelRatio||1,w=cv.clientWidth||140,h=cv.clientHeight||44;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
    var lo=99,hi=0;x.notes.forEach(function(n){lo=Math.min(lo,n.m);hi=Math.max(hi,n.m);});lo-=1;hi+=1;var L=x.len||64,rh=(h-6)/(hi-lo+1);g.fillStyle='rgba(255,255,255,.06)';for(var b=16;b<L;b+=16)g.fillRect(b/L*w,0,1,h);g.fillStyle='#FF7A9A';
    x.notes.forEach(function(n){g.fillRect(n.s/L*w+0.5,3+(hi-n.m)*rh,Math.max(2,n.l/L*w-1),Math.max(2,rh-1));});return;}
  if(it.buf){pkDraw(cv,it.buf.getChannelData(0),it.sub==='strum'?'#FF8A5B':it.kind==='idea'?'#FF7A9A':'#7CF29A');
    if(it.sub==='strum'&&x.chords){var g2=cv.getContext('2d');g2.font='700 13px Inter,system-ui,sans-serif';g2.fillStyle='#fff';g2.fillText(x.chords.slice(0,4).map(bandChName).join(' · ')+(x.chords.length>4?' …':''),6,(cv.clientHeight||44)-6);}return;}
  if(it.sub==='tap'){var d=window.devicePixelRatio||1,W=cv.clientWidth||140,H=cv.clientHeight||44;cv.width=Math.round(W*d);cv.height=Math.round(H*d);var c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.fillStyle='#FFC94D';c.font='800 22px "JetBrains Mono",monospace';c.textAlign='center';c.fillText((x.bpm||'')+' BPM',W/2,H/2+8);}}
function ideaRec(){if(!ensureAudio())return;var c=capture;
  if(c&&c.target==='IDEA'){if(performance.now()-ID.t0<500)return;ID.st='busy';ideaRender();stopCapture();return;}
  if(ID.st==='rec')return;ID.cancel=false;ID.st='rec';ID.snd=ID.loud=0;ID.msg='';ID.t0=performance.now();startCapture('IDEA');ideaRender();ideaSt(ID.mode==='hum'?'Hum now (up to 16 bars, stops when you go quiet)… tap to stop':ID.mode==='strum'?'Play your chords… tap to stop':'Recording… tap to stop');
  try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}if(!ID.raf)ID.raf=requestAnimationFrame(ideaTick);}
function ideaTick(){if(ID.st!=='rec'){ID.raf=0;return;}ID.raf=requestAnimationFrame(ideaTick);var c=capture,l=$('#idLv');if(!c||c.target!=='IDEA'||!l)return;var ch=c.chunks[c.chunks.length-1];if(!ch)return;var m=0;for(var i=0;i<ch.length;i+=4){var v=ch[i]<0?-ch[i]:ch[i];if(v>m)m=v;}
  l.style.width=Math.round(clamp((20*Math.log10(m+1e-6)+50)/50,0,1)*100)+'%';
  /* Hum: stop by itself after ~2.2 s of quiet once at least 1.2 s was sung, or at 16 bars of the project tempo */
  if(ID.mode==='hum'){var nw=performance.now();if(m>0.03){if(!ID.snd)ID.snd=nw;ID.loud=nw;}if((ID.snd&&ID.loud-ID.snd>1200&&nw-ID.loud>2200)||nw-ID.t0>16*bandN()*stepDur()*1000+1500){ID.snd=0;ideaRec();return;}}var s=$('#idSt'),t=dec((performance.now()-ID.t0)/1000,1)+' s';if(s&&s.textContent.indexOf(' · ')<0)s.textContent=s.textContent+' · '+t;else if(s)s.textContent=s.textContent.replace(/ · [\d.]+ s$/,' · '+t);}
function ideaBlocked(){ID.st='idle';ID.msg='The microphone is blocked here. Allow it in the site settings, or import a recording.';ideaRender();}
function ideaTap(){var now=performance.now(),T=ID.taps;if(T.length&&now-T[T.length-1]>2000)T.length=0;T.push(now);if(T.length>9)T.shift();
  var t=$('#idTap');if(t){t.classList.add('hit');setTimeout(function(){t.classList.remove('hit');},90);}
  try{if(ensureAudio()&&ctx)click(ctx.currentTime+0.005,T.length===1);}catch(e){}
  if(T.length<4){ideaSt(T.length+' tap'+(T.length>1?'s':'')+'… keep going');return;}
  var iv=[];for(var i=1;i<T.length;i++)iv.push(T[i]-T[i-1]);iv.sort(function(a,b){return a-b;});var bpm=Math.round(clamp(60000/iv[iv.length>>1],30,300));ID.tapBpm=bpm;
  $('#idBpm').textContent=bpm;ideaSt('Tempo '+bpm+' BPM from '+T.length+' taps');$('#idSetT').disabled=false;$('#idSaveT').disabled=false;}
/* Hum: YIN pitch track (vtAnalyse) → global tuning offset → notes → key → 1/16 grid at the project tempo */
function humAnalyse(buf){var A=vtAnalyse(buf),m=A.m,F=A.F,fr=A.hop/A.sr,k,i,sx=0,sy=0,n=0;
  for(k=0;k<F;k++)if(!isNaN(m[k])){var d=m[k]-Math.round(m[k]);sx+=Math.cos(2*Math.PI*d);sy+=Math.sin(2*Math.PI*d);n++;}
  if(n<20)return {raw:[],notes:[]};var off=Math.atan2(sy,sx)/(2*Math.PI),q=new Float32Array(F),sm=new Float32Array(F);
  for(k=0;k<F;k++)q[k]=isNaN(m[k])?NaN:m[k]-off;
  for(k=0;k<F;k++){if(isNaN(q[k])){sm[k]=NaN;continue;}var w=[];for(i=Math.max(0,k-3);i<=Math.min(F-1,k+3);i++)if(!isNaN(q[i]))w.push(q[i]);w.sort(function(a,b){return a-b;});sm[k]=w[w.length>>1];}
  var segs=[],cur=null,gap=0,dS=-1;
  for(k=0;k<F;k++){var v=sm[k];if(isNaN(v)){if(cur&&++gap>=6){segs.push(cur);cur=null;}continue;}gap=0;
    if(!cur){cur={a:k,b:k+1,p:Math.round(v)};dS=-1;continue;}cur.b=k+1;var r=Math.round(v);
    if(r!==cur.p&&Math.abs(v-cur.p)>0.6){if(dS<0)dS=k;if(k-dS>=7){cur.b=dS;segs.push(cur);cur={a:dS,b:k+1,p:r};dS=-1;}}else dS=-1;}
  if(cur)segs.push(cur);
  /* re-articulated notes on the same pitch: split at deep level dips */
  var E=A.rms;if(E&&E.length>=F){var S2=[];segs.forEach(function(s){var a=s.a,pk=0,j;for(j=s.a;j<s.b;j++)pk=Math.max(pk,E[j]);
      for(j=s.a+14;j<s.b-14;j++){if(E[j]<0.3*pk&&E[j]<=E[j-1]&&E[j]<=E[j+1]&&j-a>=14){var up=0;for(var u=j;u<Math.min(s.b,j+20);u++)up=Math.max(up,E[u]);if(up>0.65*pk){S2.push({a:a,b:j,p:s.p});a=j;}}}S2.push({a:a,b:s.b,p:s.p});});segs=S2;}
  var raw=[];segs.forEach(function(s){if(s.b-s.a<14)return;var w=[];for(var j=s.a;j<s.b;j++)if(!isNaN(q[j]))w.push(q[j]);if(w.length<10)return;w.sort(function(a,b){return a-b;});var med=w[w.length>>1];
    raw.push({t0:s.a*fr,t1:s.b*fr,m:Math.round(med),hz:440*Math.pow(2,(med+off-69)/12)});});
  if(!raw.length)return {raw:[],notes:[]};
  var hist=new Array(12).fill(0);raw.forEach(function(o){hist[((o.m%12)+12)%12]+=o.t1-o.t0;});var key=bandKey(hist);
  var sd=stepDur(),T0=raw[0].t0,notes=[];
  raw.forEach(function(o){var s=Math.round((o.t0-T0)/sd),e=Math.round((o.t1-T0)/sd),l=Math.max(1,e-s);if(s>=256)return;l=Math.min(l,256-s);var pv=notes[notes.length-1];
    if(pv&&pv.s===s){if(l>pv.l){pv.l=l;pv.m=o.m;}return;}if(pv&&pv.s+pv.l>s)pv.l=Math.max(1,s-pv.s);notes.push({s:s,l:l,m:o.m,v:0.8});});
  var end=0;notes.forEach(function(o){end=Math.max(end,o.s+o.l);});
  return {raw:raw,notes:notes,key:key,off:off,len:Math.min(256,Math.max(16,Math.ceil(end/16)*16))};}
/* Strum: chroma per bar at the project tempo (Backing Band chord learner) */
/* tempo of a strum: onset-strength autocorrelation (100 fps), double/half support, 80–160 bpm preferred; null when there is no clear pulse */
function strumTempo(x,sr){var hop=Math.round(sr/100),n=Math.floor(x.length/hop),i,j;if(n<300)return null;var env=new Float32Array(n),pe=0,lp=0;
  for(i=0;i<n;i++){var e=0;for(j=i*hop;j<(i+1)*hop;j++){var d=x[j]-lp;lp=x[j];e+=d*d;}e=Math.log(1e-9+e);env[i]=Math.max(0,e-pe);pe=e;}
  var mu=0;for(i=0;i<n;i++)mu+=env[i];mu/=n;for(i=0;i<n;i++)env[i]=Math.max(0,env[i]-mu);
  var ac=function(b){var lag=6000/b,L=Math.floor(lag),f=lag-L,s=0,c=0;for(var k=0;k+L+1<n;k++){s+=env[k]*(env[k+L]*(1-f)+env[k+L+1]*f);c++;}return c?s/c:0;};
  var best=0,bb=0,tot=0,cnt=0;for(var b=60;b<=200;b++){var v=ac(b)+0.5*ac(2*b)+0.25*ac(b/2),w=b<80?Math.exp(-Math.pow(Math.log2(b/80),2)*14):b>160?Math.exp(-Math.pow(Math.log2(b/160),2)*14):1;v*=w;tot+=v;cnt++;if(v>best){best=v;bb=b;}}
  var conf=tot>0?best/(tot/cnt):0;return conf<1.3?null:{bpm:bb,conf:Math.round(conf*100)/100};}
function strumAnalyse(x,sr,bpm){var bl=Math.round(bandN()*(bpm?15/bpm:stepDur())*sr);if(x.length<8192)return null;var bars=Math.min(16,Math.max(1,Math.round(x.length/bl))),res=[],tot=new Array(12).fill(0),prev=null,heard=0;
  for(var i=0;i<bars;i++){var a=i*bl+Math.round(bl*0.04),b=Math.min(x.length,(i+1)*bl);if(b-a<8192)a=Math.max(0,b-8192);var ch=b-a>=8192?bandChroma(x,sr,a,b):null;if(ch){heard++;ch.forEach(function(v,p){tot[p]+=v;});prev=bandMatch(ch);}res.push(prev);}
  if(!heard)return null;for(i=0;i<res.length;i++)if(!res[i])res[i]=res.filter(Boolean)[0];return {chords:res,key:bandKey(tot)};}
function ideaStamp(){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
/* ideas keep the whole take (trim() caps samples at 12 s): cut only the silence before and after */
function ideaTrim(d,sr){var pk=0,i,n=d.length;for(i=0;i<n;i++){var v=d[i]<0?-d[i]:d[i];if(v>pk)pk=v;}if(pk<0.004||n<sr*0.25)return null;var th=Math.max(0.003,pk*0.03),a=0,b=n-1;while(a<n&&Math.abs(d[a])<th)a++;while(b>a&&Math.abs(d[b])<th)b--;
  a=Math.max(0,a-Math.round(sr*0.05));b=Math.min(n,b+Math.round(sr*0.15));return b-a<sr*0.2?null:d.slice(a,b);}
function ideaDone(data,sr){if(ID.cancel){ID.cancel=false;ID.st='idle';return null;}
  var tr=ideaTrim(capClean(Float32Array.from(data),sr),sr);if(!tr){ID.st='idle';ID.msg='That was too quiet or too short. Move closer to the mic and try again.';ideaRender();return null;}
  normCap(tr,sr);var buf=ctx.createBuffer(1,tr.length,sr);buf.getChannelData(0).set(tr);buf._cap=1;
  var it={id:'i'+Date.now().toString(36)+Math.floor(Math.random()*1e4),kind:'idea',sub:ID.mode,buf:buf,t:Date.now(),root:261.63,det:false,conf:0,cents:0,sus:false,perc:true,x:{}};
  if(ID.mode==='hum'){var H=humAnalyse(buf);ID.raw=H;if(!H.notes.length){ID.st='idle';ID.msg='I couldn’t hear a clear tune. Hum a little louder, on “mm” or “la”.';ideaRender();return null;}
    it.name='Hum '+ideaStamp();it.x={notes:H.notes,key:H.key,len:H.len,bpm:Math.round(P.bpm.v)};ideaPlaceHum(it);}
  else if(ID.mode==='strum'){var TB=strumTempo(tr,sr),fresh=PRJ_UNT&&!project.id&&Math.round(P.bpm.v)===Math.round(PDEF.bpm);if(TB&&fresh&&TB.bpm!==Math.round(P.bpm.v))setParam('bpm',TB.bpm);var S=strumAnalyse(tr,sr);ID.raw=S;if(!S){ID.st='idle';ID.msg='I couldn’t hear chords. Play a little longer and louder.';ideaRender();return null;}
    it.name='Chords '+ideaStamp();it.x={chords:S.chords,key:S.key,bpm:Math.round(P.bpm.v),det:TB?TB.bpm:0,auto:!!(TB&&fresh)};}
  else{ID.mode='memo';it.sub='memo';it.name='Memo '+ideaStamp();it.x={text:''};var pe=detectPitchEx(tr,sr);if(pe){it.root=pe.hz;it.det=true;it.conf=pe.conf;it.cents=pe.cents;}it.perc=!it.det;}
  shelfAdd(it);markDirty();ID.last=it;ID.st='res';ideaRender();try{if(navigator.vibrate)navigator.vibrate([12,40,24]);}catch(e){}return it;}
/* a hum longer than 4 bars (one pattern = 64 steps) continues on the next empty patterns, up to 16 bars; an untouched one-pattern song gets them in order */
function ideaPlaceHum(it,ti,pi){var x=it.x,o=x.pl;
  if(o){[o].concat(o.more||[]).forEach(function(q){var pt=patterns[q.pi];if(pt){pt.notes[o.ti]=q.prev||[];pt.len=q.plen||pt.len;}});if(o.song)song=o.song.slice();}
  if(ti==null){ti=keysTi();pi=-1;for(var i=0;i<patterns.length;i++)if(!patHas(patterns[i])){pi=i;break;}if(pi<0)pi=curPat;}
  var L=x.len||16,nch=Math.max(1,Math.ceil(L/64)),pis=[pi],pl={ti:ti,pi:pi,more:[]};for(var j=pi+1;pis.length<nch&&j<patterns.length;j++)if(!patHas(patterns[j]))pis.push(j);
  pis.forEach(function(p,c){var pt=patterns[p];noteArr(pt,ti);var q={pi:p,prev:pt.notes[ti].slice(),plen:pt.len};if(c)pl.more.push(q);else{pl.prev=q.prev;pl.plen=q.plen;}
    var a=c*64,ln=Math.max(16,Math.min(64,L-a));pt.notes[ti]=x.notes.filter(function(n){return n.s>=a&&n.s<a+64;}).map(function(n){return {s:n.s-a,l:Math.min(n.l,a+64-n.s),m:n.m,v:n.v};});if(pt.len<ln)pt.len=ln;});
  if(pis.length>1){pl.song=song.slice();if(song.length<=1)song=pis.slice();}
  x.pl=pl;markDirty();try{renderPatSegs();drawRoll();if(pis.length>1&&typeof renderSongUI==='function')renderSongUI();}catch(e){}}
function ideaHear(it){if(!it||!ensureAudio())return;var x=it.x||{},sd=stepDur(),t0=ctx.currentTime+0.08,ti=x.pl?x.pl.ti:keysTi();
  if(it.sub==='hum')(x.notes||[]).forEach(function(n){playNote(ti,n.m,n.v,t0+n.s*sd,Math.max(0.06,n.l*sd*0.95));});
  else if(it.sub==='strum'){var bt=bandN()*sd;(x.chords||[]).slice(0,8).forEach(function(c,i){if(!c)return;(BTPL[c[1]]||BTPL.maj).forEach(function(iv){var mm=48+((c[0]+iv)%12);while(mm<55)mm+=12;[0,0.5].forEach(function(h){playNote(ti,mm,0.6,t0+i*bt+h*bt,bt*0.45);});});playNote(ti,36+c[0],0.7,t0+i*bt,bt*0.9);});}
  else if(it.sub==='tap'){var d=60/(x.bpm||120);for(var k=0;k<8;k++)click(t0+k*d,k%4===0);}
  else hearBuf(it.buf);}
function ideaDev(it,a){if(!it||!ensureAudio())return;var x=it.x||{},B=GAR.band;
  if(a==='card'){scOpen(it);return;}
  if(it.sub==='hum'){var pl=x.pl||{ti:keysTi(),pi:curPat};
    if(a==='play'){if(curPat!==pl.pi){curPat=pl.pi;try{renderPatSegs();paintSteps();drawRoll();}catch(e){}}GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('keys',pl.ti);toast('“'+it.name+'” is Pattern '+patName(pl.pi)+' on '+tracks[pl.ti].name+'. Play along in '+keyName(x.key)+'.',2800);}
    else if(a==='song'){var s=Math.floor((daw.play||0)/16)*16,c=newClip({type:'pat',ti:pl.ti,s:s,l:patterns[pl.pi].len,p:pl.pi,o:0});daw.sel=c.id;dawNeed=true;markDirty();try{renderDawHeads();}catch(e){}showTab('t-daw');toast('“'+it.name+'” added to the timeline at bar '+(s/16+1)+'.',2400);}
    else if(a==='band'){B.keyHint=x.key;GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('band');toast('Your melody is in '+keyName(x.key)+'. Set the band to that key and press play.',2800);}
    return;}
  if(it.sub==='strum'){B.parts[B.edit]=x.chords.slice(0,16).map(function(c){return c?c.slice():c;});B.keyHint=x.key;markDirty();
    if(a==='song'){if(bandToSong(1)!==false){navGo('song');}return;}
    GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('band');toast('Backing Band part '+B.edit+': '+x.chords.map(bandChName).join(' · ')+'.',3000);return;}
  if(it.sub==='tap'){setParam('bpm',x.bpm);markDirty();toast('Project tempo set to '+x.bpm+' BPM.',1800);return;}
  if(a==='song'){scClip(it);return;}scOpen(it);}
function ideaDevSheet(it){var acts=it.sub==='hum'?[['play','Play it on the keys'],['song','Put it in the song'],['band','Jam with the Backing Band']]:it.sub==='strum'?[['band','Use as Backing Band part'],['song','Build song sections from it']]:it.sub==='tap'?[['tempo','Set project tempo to '+(it.x||{}).bpm+' BPM']]:[['card','Open the sound card'],['song','Add it to the song']];
  garSheet('Develop “'+it.name+'”',(it.sub==='memo'&&it.x&&it.x.text?'<p class="note">'+escapeH(it.x.text)+'</p>':'')+acts.map(function(a){return '<button class="gx-btn" data-dev="'+a[0]+'">'+a[1]+'</button>';}).join(''),function(el){
    el.querySelectorAll('[data-dev]').forEach(function(b){b.addEventListener('click',function(){garSheetClose();ideaDev(it,b.getAttribute('data-dev'));});});});}
function ideaInit(){var f=$('#ideaFab');
  f.addEventListener('pointerdown',function(e){if(e.button>0)return;e.preventDefault();try{f.setPointerCapture(e.pointerId);}catch(x){}ID.lp=false;f.classList.add('lp');clearTimeout(ID.lpT);
    ID.lpT=setTimeout(function(){ID.lp=true;f.classList.remove('lp');ideaOpen('hum');ideaRec();},450);});
  f.addEventListener('pointerup',function(){clearTimeout(ID.lpT);f.classList.remove('lp');if(ID.lp){ID.lp=false;return;}ideaOpen();});
  f.addEventListener('pointercancel',function(){clearTimeout(ID.lpT);f.classList.remove('lp');});
  f.addEventListener('click',function(e){if(e.detail===0)ideaOpen();});f.addEventListener('contextmenu',function(e){e.preventDefault();});
  $('#idModes').innerHTML=idModesHTML(true);$$('#idModes [data-idm]').forEach(function(b){b.addEventListener('click',function(){ideaOpen(b.getAttribute('data-idm'));});});
  $('#hmModes').innerHTML=idModesHTML(false);$$('#hmModes [data-idm]').forEach(function(b){b.addEventListener('click',function(){ensureAudio();ideaOpen(b.getAttribute('data-idm'));});});
  $$('#ideaSheet [data-idclose]').forEach(function(b){b.addEventListener('click',ideaClose);});
  scBuild($('#scSheetC'));$$('#scSheet [data-scclose]').forEach(function(b){b.addEventListener('click',scClose);});
  $$('[data-scslot]').forEach(function(b){b.addEventListener('click',function(){var it=scSlotItem(b.getAttribute('data-scslot'));if(it)scOpen(it);});});
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!$('#ideaSheet').hidden){ideaClose();e.stopPropagation();}else if(!$('#scSheet').hidden){scClose();e.stopPropagation();}},true);
  setInterval(ideaFabSync,250);window.addEventListener('resize',ideaFabSync);ideaFabSync();}
ideaInit();
/* ---------- Learn: interactive beginner course v1. Idle unless a lesson runs: no timers, no document listeners. ---------- */
