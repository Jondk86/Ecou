function setKbCollapsed(c){$('#kbwrap').classList.toggle('collapsed',c);if(!c)requestAnimationFrame(layoutBlacks);$('#kbToggle').textContent=c?'Show keys':'Hide keys';$('#kbToggle').setAttribute('aria-expanded',!c);}
function armTap(btn,label,fn){var armed=false,orig=btn.textContent;btn.addEventListener('click',function(){if(!armed){armed=true;btn.textContent=label;setTimeout(function(){armed=false;btn.textContent=orig;},3000);return;}armed=false;btn.textContent=orig;fn();});}
function initStudio(){
  $('#kbToggle').addEventListener('click',function(){var c=!$('#kbwrap').classList.contains('collapsed');setKbCollapsed(c);if(showTab.cur)(showTab.kb||(showTab.kb={}))[showTab.cur]=c;});
  $('#undoBtn').addEventListener('click',function(){histGo(-1);});$('#redoBtn').addEventListener('click',function(){histGo(1);});
  document.addEventListener('keydown',function(e){if(!(e.ctrlKey||e.metaKey))return;var k=e.key.toLowerCase();if(k==='z'&&!e.shiftKey){e.preventDefault();histGo(-1);}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();histGo(1);}});
  $('#kbTrack').addEventListener('click',function(){var keys=KEYSI(),i=keys.indexOf(selTrack);var n=keys[(i+1)%keys.length];songSel=n;selectTrack(n);fitRoll();renderTrackSegs();drawRoll();toast('Keyboard plays: '+tracks[n].name,1500);});
  try{if(window.matchMedia&&window.matchMedia('(max-height: 500px)').matches)setKbCollapsed(true);}catch(e){}
  initPatterns();renderPatSegs();renderTrackSegs();renderMixer();updTransportUI();
  $('#hPlay').addEventListener('click',function(){transportToggle();});
  $('#trPlay').addEventListener('click',function(){transportToggle();});
  $('#trRec').addEventListener('click',function(){seq.rec=!seq.rec;if(seq.rec&&!seq.on)transportToggle();updTransportUI();});
  $('#trQuant').addEventListener('change',function(e){seq.quant=e.target.checked;});
  $('#trMetro').addEventListener('change',function(e){seq.metro=e.target.checked;});
  $$('[data-mode]').forEach(function(b){b.addEventListener('click',function(){var was=seq.on;seq.mode=b.getAttribute('data-mode');seq.src='pattern';if(was)transportStart(seq.mode);updTransportUI();});});
  $$('[data-len]').forEach(function(b){b.addEventListener('click',function(){setPatLen(+b.getAttribute('data-len'));});});
  $('#patCopy').addEventListener('click',copyPattern);
  var clArmed=false;$('#patClear').addEventListener('click',function(){var b=$('#patClear');if(!clArmed){clArmed=true;b.textContent='Tap again to clear';setTimeout(function(){clArmed=false;b.textContent='Clear pattern';},3000);return;}clArmed=false;b.textContent='Clear pattern';clearPattern();});
  $('#songAdd').addEventListener('click',function(){song.push(curPat);markDirty();renderSongUI();});
  armTap($('#songClear'),'Tap again to clear',function(){song=[];markDirty();renderSongUI();toast('Arrangement cleared.');});
  $('#bounceBtn').addEventListener('click',function(){exportSongOffline(false);});
  $('#rollUp').addEventListener('click',function(){roll.base=Math.min(96,roll.base+12);drawRoll();});
  $('#rollDn').addEventListener('click',function(){roll.base=Math.max(12,roll.base-12);drawRoll();});
  $$('[data-nl]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-nl')===roll.nl?'true':'false');b.addEventListener('click',function(){roll.nl=+b.getAttribute('data-nl');$$('[data-nl]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
  armTap($('#rollClear'),'Tap again to clear this track',function(){patterns[curPat].notes[songSel]=[];markDirty();drawRoll();renderPatSegs();toast('Track cleared in pattern '+patterns[curPat].name+'.');});
  $('#goSound').addEventListener('click',function(){showTab('t-ins');});
  $('#projSave').addEventListener('click',function(){ensureAudio();saveProject(false);});
  $('#projOpen').addEventListener('click',function(){var w=$('#projList');if(!w.hidden){w.hidden=true;$('#storeUse').hidden=true;return;}listProjects();});
  var nArmed=false;$('#projNew').addEventListener('click',function(){var b=$('#projNew');if(!nArmed){nArmed=true;b.textContent='Tap again';setTimeout(function(){nArmed=false;b.textContent='New';},3000);return;}nArmed=false;b.textContent='New';var go=function(){resetProject();clearPatternsAll();setTimeout(histReset,0);toast('New empty project. The previous one is in Open….');};if(dirty&&ctx)saveProject(true).then(go);else go();});
  $('#projExport').addEventListener('click',exportProject);
  $('#projImport').addEventListener('click',function(){ensureAudio();});
  $('#f-PROJ').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';importProject(f);});
  $('#projName').addEventListener('change',function(){project.name=$('#projName').value.trim()||'Untitled beat';markDirty();});
  setInterval(function(){if(dirty&&ctx)saveProject(true);},20000);
  document.addEventListener('visibilitychange',function(){if(document.hidden&&dirty&&ctx)saveProject(true);});
}

/* ---------- SPATIAL 3D ---------- */
var spatialOn=false,spSel=1,spFollow=false,spLast=0;
var SPCOL=['#D4FF3A','#5CE1E6','#FF8A5B','#B69CFF'];
tracks.forEach(function(t,i){if(!t.sp)t.sp={az:[0,-40,40,0][i]||0,el:0,dist:[1.8,1.5,1.5,0.9][i]||1.5,orbit:0};});
function ensureSp(){tracks.forEach(function(t,i){if(!t.sp)t.sp={az:[0,-40,40,0][i]||0,el:0,dist:[1.8,1.5,1.5,0.9][i]||1.5,orbit:0};});}
function spBuild(t){
  var n=t.n,sp=ctx.createPanner();sp.panningModel='HRTF';sp.distanceModel='inverse';sp.refDistance=1;sp.maxDistance=50;sp.rolloffFactor=0.6;
  n.sp=sp;n.post=G(1);
  try{n.vol.disconnect(n.pan);}catch(e){}
  n.pan.connect(n.post);sp.connect(n.post);
  n.post.connect(n.sr);n.post.connect(n.sd);try{n.pan.disconnect(n.sr);n.pan.disconnect(n.sd);}catch(e){}
  n.out=n.post;
}
function spRoute(){
  if(!ctx)return;ensureSp();
  tracks.forEach(function(t){var n=t.n;if(!n||!n.sp)return;try{n.vol.disconnect();}catch(e){}try{n.sp.disconnect();}catch(e){}n.vol.connect(spatialOn?n.sp:n.pan);if(spatialOn)n.sp.connect(n.post);});
  spUpdate(true);
}
function spPos(t,yaw){var a=(t.sp.az+(yaw||0))*Math.PI/180,e=t.sp.el*Math.PI/180,d=t.sp.dist;return {x:Math.sin(a)*Math.cos(e)*d,y:Math.sin(e)*d,z:-Math.cos(a)*Math.cos(e)*d};}
function spUpdate(force){
  if(!ctx||!spatialOn)return;var now=ctx.currentTime,dt=spLast?Math.min(0.1,now-spLast):0;spLast=now;
  var yaw=spFollow?src.roll*90:0;
  tracks.forEach(function(t){var n=t.n;if(!n||!n.sp)return;
    if(t.sp.orbit){t.sp.az=((t.sp.az+t.sp.orbit*360*dt+180)%360+360)%360-180;}
    var p=spPos(t,yaw);
    if(n.sp.positionX){n.sp.positionX.setTargetAtTime(p.x,now,0.03);n.sp.positionY.setTargetAtTime(p.y,now,0.03);n.sp.positionZ.setTargetAtTime(p.z,now,0.03);}else n.sp.setPosition(p.x,p.y,p.z);
  });
  if(spFollow){var L=ctx.listener,pitch=src.tilt*0.6;if(L.forwardY){L.forwardY.setTargetAtTime(Math.sin(pitch),now,0.05);L.forwardZ.setTargetAtTime(-Math.cos(pitch),now,0.05);}}
  if(force||$('#t-fx').classList.contains('active')){drawRadar();var t=tracks[spSel];$('#spInfo').textContent=t.name+' · az '+Math.round(t.sp.az)+'° · '+dec(t.sp.dist,1)+' m';}
}
function drawRadar(){
  var cv=$('#radar');if(!cv)return;var dpr=window.devicePixelRatio||1,W=cv.clientWidth||300,H=W;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.height=H+'px';}
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  var cx=W/2,cy=H/2,R=W/2-14;
  g.strokeStyle='#2A2A36';g.lineWidth=1;[1,2,3].forEach(function(k){g.beginPath();g.arc(cx,cy,R*k/3,0,Math.PI*2);g.stroke();});
  g.beginPath();g.moveTo(cx,cy-R);g.lineTo(cx,cy+R);g.moveTo(cx-R,cy);g.lineTo(cx+R,cy);g.stroke();
  g.fillStyle='#8A8A9A';g.font='600 10px Inter, system-ui, sans-serif';g.fillText('FRONT',cx-16,12);g.fillText('BACK',cx-13,H-4);g.fillText('L',4,cy-4);g.fillText('R',W-10,cy-4);
  g.fillStyle='#F4F4F7';g.beginPath();g.arc(cx,cy,7,0,Math.PI*2);g.fill();g.fillStyle='#0B0B10';g.fillRect(cx-1,cy-6,2,5);
  tracks.forEach(function(t,i){var a=t.sp.az*Math.PI/180,r=Math.min(1,t.sp.dist/4)*R,x=cx+Math.sin(a)*r,y=cy-Math.cos(a)*r,sz=7+t.sp.el/15;
    g.globalAlpha=spatialOn?1:0.45;g.fillStyle=SPCOL[i];g.beginPath();g.arc(x,y,Math.max(4,sz),0,Math.PI*2);g.fill();
    if(i===spSel){g.strokeStyle='#F4F4F7';g.lineWidth=2;g.beginPath();g.arc(x,y,Math.max(4,sz)+4,0,Math.PI*2);g.stroke();}
    g.fillStyle='#F4F4F7';g.fillText(t.name,x+10,y+3);g.globalAlpha=1;});
}
function radarPointer(e){
  var cv=$('#radar'),r=cv.getBoundingClientRect(),cx=r.width/2,cy=r.height/2,R=r.width/2-14,x=e.clientX-r.left-cx,y=e.clientY-r.top-cy;
  if(e.type==='pointerdown'){var best=-1,bd=1e9;tracks.forEach(function(t,i){var a=t.sp.az*Math.PI/180,rr=Math.min(1,t.sp.dist/4)*R,dx=Math.sin(a)*rr-x,dy=-Math.cos(a)*rr-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=i;}});if(bd<44*44){spSel=best;renderSpUI();}}
  var t=tracks[spSel],dist=Math.sqrt(x*x+y*y)/R*4;t.sp.az=Math.round(Math.atan2(x,-y)*180/Math.PI);t.sp.dist=clamp(dist,0.3,4);
  syncSpSliders();spUpdate(true);drawRadar();markDirty();
}
function syncSpSliders(){var t=tracks[spSel];$('#spEl').value=t.sp.el;$('#spElO').textContent=Math.round(t.sp.el)+'°';$('#spOr').value=t.sp.orbit;$('#spOrO').textContent=t.sp.orbit?dec(t.sp.orbit,2)+' Hz':'off';$('#spInfo').textContent=t.name+' · az '+Math.round(t.sp.az)+'° · '+dec(t.sp.dist,1)+' m';}
function renderSpUI(){
  $('#spSeg').innerHTML=tracks.map(function(t,i){return '<button data-sps="'+i+'" aria-pressed="'+(i===spSel)+'"><span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:'+SPCOL[i]+';margin-right:6px"></span>'+t.name+'</button>';}).join('');
  $$('[data-sps]').forEach(function(b){b.addEventListener('click',function(){spSel=+b.getAttribute('data-sps');renderSpUI();});});
  syncSpSliders();drawRadar();
}
function setSpatial(on){spatialOn=on;$('#spOn').checked=on;if(ctx)spRoute();drawRadar();markDirty();}
/* stems export (Atmos-ready) */
var stemsRunning=false;
function stemFmt(){var v='mix';try{v=localStorage.getItem('ecou.stemfmt')||'mix';}catch(e){}return v;}
function stemFmtUI(){var f=stemFmt();$$('[data-sf]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-sf')===f));});var n=$('#stemNote');if(n)n.textContent=f==='mix'?'One stereo 32-bit float WAV per track, exactly as it sits in the mix: EQ, compression, ducking, panning, its own reverb and delay, punch-in FX and master EQ. Float files cannot clip; dropped together at bar 1 they add up to the mix before the limiter.':'Atmos-ready: one dry mono 24-bit WAV per track, FX returns, positions.json and import steps for Logic Pro / Pro Tools, where the Dolby Atmos master is made. Dolby Atmos is a trademark of Dolby Laboratories.';}
function exportMixStems(ssrc){
  transportStop();stemsRunning=true;var btn=$('#stemsBtn'),orig=btn.textContent,files=[],skipped=[],peaks=[],sr=ctx.sampleRate,len=0,t0=performance.now(),lat=Math.round(TRACKLAT*sr);
  btn.textContent=calPending()?'Measuring compressors…':'Rendering full mix…';
  waitCal().then(function(){btn.textContent='Rendering full mix…';return renderOffline({mode:'mix',spatial:false,src:ssrc});}).then(function(r){
    len=tailLength(r.buf,r.end);files.push({name:'00-full-mix.wav',data:encodeWav(cutBuffer(r.buf,len,false,lat),sr)});
    var chain=Promise.resolve();
    tracks.forEach(function(t,i){chain=chain.then(function(){if(t.mute){skipped.push(t.name+' (muted)');return;}btn.textContent='Stem '+(i+1)+'/'+tracks.length+' · '+t.name+'…';
      return renderOffline({mode:'mstem',track:i,src:ssrc,spatial:false,onProgress:function(f){btn.textContent='Stem '+(i+1)+'/'+tracks.length+' · '+t.name+' '+Math.round(f*100)+'%';}}).then(function(x){
        var chs=cutBuffer(x.buf,len,false,lat),pk=peakDb(chs);if(pk<-90){skipped.push(t.name);return;}peaks.push(t.name+': peak '+dec(pk,1)+' dBFS');
        files.push({name:String(i+1).padStart(2,'0')+'-'+safeName(t.name)+'.wav',data:encodeWavF(chs,sr)});});});});
    return chain;
  }).then(function(){
    var readme='Ecou – mix stems\n\nProject: '+project.name+' · '+Math.round(P.bpm.v)+' BPM · '+sr+' Hz\nAll files start exactly at bar 1 and have identical length ('+len+' samples).\n\n00-full-mix.wav   the finished stereo mix (24-bit, through the master limiter)\nNN-<track>.wav    one stereo stem per track, 32-bit float, post-fader, with the track\'s EQ, compressor, kick ducking, panning, its own reverb/delay, punch-in FX and the master EQ. No master limiter.\n\nSummed at unity gain the stems rebuild the mix before the limiter. Float WAV cannot clip: if a stem peaks above 0 dBFS, just lower its fader in your DAW.\n\nStem peaks:\n'+peaks.join('\n')+(skipped.length?'\n\nSkipped (silent or muted): '+skipped.join(', '):'')+'\n';
    files.push({name:'README.txt',data:u8(readme)});
    saveBlob(zipFiles(files),safeName(project.name)+'-stems.zip','Stems exported ('+(files.length-2)+' stereo stems + mix, rendered in '+dec((performance.now()-t0)/1000,1)+' s'+(skipped.length?'; skipped: '+skipped.join(', '):'')+').');
  }).catch(function(e){console.error(e);toast('Stem rendering failed in this browser.');}).then(function(){stemsRunning=false;btn.textContent=orig;});
}
function exportStems(){
  if(stemFmt()==='mix'){if(!ensureAudio())return;var ss=stemSrc();if(ss==='song'&&!song.length){toast('Add patterns to the arrangement first.');return;}if(seq.bounce||stemsRunning){toast('An export is already running.');return;}exportMixStems(ss);return;}
  if(!ensureAudio())return;var ssrc=stemSrc();if(ssrc==='song'&&!song.length){toast('Add patterns to the arrangement first.');return;}
  if(seq.bounce||stemsRunning){toast('An export is already running.');return;}
  transportStop();stemsRunning=true;var btn=$('#stemsBtn'),orig=btn.textContent,files=[],skipped=[],sr=ctx.sampleRate,len=0,t0=performance.now();
  btn.textContent='Rendering full mix…';
  renderOffline({mode:'mix',spatial:false,src:ssrc}).then(function(r){
    len=tailLength(r.buf,r.end);files.push({name:'00-full-mix.wav',data:encodeWav(cutBuffer(r.buf,len,false,r.js?Math.round(TRACKLAT*sr):masterLatency(sr)),sr)});
    var chain=Promise.resolve();
    tracks.forEach(function(t,i){chain=chain.then(function(){btn.textContent='Rendering stem '+(i+1)+'/'+tracks.length+' · '+t.name+'…';
      return renderOffline({mode:'stem',track:i,src:ssrc,onProgress:function(f){btn.textContent='Stem '+(i+1)+'/'+tracks.length+' · '+t.name+' '+Math.round(f*100)+'%';}}).then(function(x){var c0=x.buf.getChannelData(0),c1=x.buf.getChannelData(1),pk=0;for(var q=0;q<c0.length;q+=7){var a=Math.abs(c0[q])+Math.abs(c1[q]);if(a>pk)pk=a;}if(pk<1e-5){skipped.push(t.name);files.push(null);return;}files.push({name:String(i+1).padStart(2,'0')+'-'+safeName(t.name)+'-dry-mono.wav',data:encodeWav(cutBuffer(x.buf,len,true,Math.round(TRACKLAT*sr)),sr)});});});});
    return chain.then(function(){btn.textContent='Rendering FX returns…';return renderOffline({mode:'returns',src:ssrc}).then(function(x){files.push({name:'99-fx-returns-stereo.wav',data:encodeWav(cutBuffer(x.buf,len,false,Math.round(TRACKLAT*sr)),sr)});});});
  }).then(function(){finishStems(files,len,performance.now()-t0,skipped);}).catch(function(){toast('Stem rendering failed in this browser.');}).then(function(){stemsRunning=false;btn.textContent=orig;});
}
function finishStems(files,len,ms,skipped){
  var objs=tracks.map(function(t,i){if(!files[i+1])return null;var az=t.sp.az,el=t.sp.el,a=az*Math.PI/180,e=el*Math.PI/180,x=Math.sin(a)*Math.cos(e),y=Math.cos(a)*Math.cos(e),m=Math.max(Math.abs(x),Math.abs(y))||1,sc=Math.min(1,t.sp.dist/1.5);
    return {track:t.name,file:files[i+1].name,channels:'mono, dry (no reverb/delay, centred)',
      polar_adm:{azimuth_deg:-Math.round(az),elevation_deg:Math.round(el),distance:Math.round(Math.min(1,t.sp.dist/4)*100)/100},
      cartesian_adm:{x:Math.round(x/m*sc*1000)/1000,y:Math.round(y/m*sc*1000)/1000,z:Math.round(Math.max(0,Math.sin(e))*1000)/1000},
      ecou:{azimuth_deg_clockwise:Math.round(az),elevation_deg:Math.round(el),distance_m:Math.round(t.sp.dist*100)/100,orbit_hz:t.sp.orbit}};}).filter(Boolean);files=files.filter(Boolean);
  var meta={format:'ecou-spatial-2',project:project.name,bpm:Math.round(P.bpm.v),sampleRate:ctx.sampleRate,lengthSamples:len,
    conventions:'polar_adm and cartesian_adm follow ITU-R BS.2076 (ADM): azimuth +90° = LEFT, x −1 = left / +1 = right, y +1 = front / −1 = back, z 0 = ear level / 1 = top. "ecou" holds the app’s own clockwise azimuth.',
    bed:{file:'99-fx-returns-stereo.wav',note:'shared reverb + delay returns; place on the bed (L/R) or as a wide object pair'},reference:'00-full-mix.wav',objects:objs};
  var readme='Ecou – Atmos-ready stem package\n\nAll files are 24-bit WAV at '+ctx.sampleRate+' Hz, rendered offline, sample-aligned, identical length ('+len+' samples), starting exactly at bar 1.\n\n00-full-mix.wav            reference stereo mix (through the master limiter)\nNN-<track>-dry-mono.wav    one dry mono object per track (no reverb/delay, centred, no master limiter)\n99-fx-returns-stereo.wav   shared reverb and delay returns (stereo, no master limiter)\npositions.json             object positions in ADM conventions (polar and cartesian)\n\nThe dry stems (panned as in positions.json) plus the FX returns rebuild the pre-limiter mix; insert effects are rendered per stem.\n\nDolby Atmos in Logic Pro:\n1. File > Project Settings > Audio: Spatial Audio Mixing = Dolby Atmos.\n2. Import all stems at bar 1; set the tempo to '+Math.round(P.bpm.v)+' BPM.\n3. Put 99-fx-returns-stereo.wav on the bed. Set each dry stem to a 3D Object Panner and enter the cartesian_adm (or polar_adm) position from positions.json.\n4. Tracks with orbit_hz ≠ 0 rotate in Ecou; recreate the movement with panner automation.\n5. File > Export > Project as ADM BWF.\n\nDolby, Dolby Atmos and the double-D symbol are trademarks of Dolby Laboratories. Ecou produces stems and position data only; the Atmos master is created in licensed software.\n';
  files.push({name:'positions.json',data:u8(JSON.stringify(meta,null,2))});files.push({name:'README.txt',data:u8(readme)});
  saveBlob(zipFiles(files),safeName(project.name)+'-stems-atmos-ready.zip','Stems exported ('+(files.length-2)+' files, rendered in '+dec(ms/1000,1)+' s'+(skipped&&skipped.length?'; silent tracks skipped: '+skipped.join(', '):'')+').');
}
function initSpatial(){
  ensureSp();renderSpUI();
  $('#spOn').addEventListener('change',function(e){ensureAudio();setSpatial(e.target.checked);});
  $('#spEl').addEventListener('input',function(e){tracks[spSel].sp.el=+e.target.value;syncSpSliders();spUpdate(true);markDirty();});
  $('#spOr').addEventListener('input',function(e){tracks[spSel].sp.orbit=+e.target.value;syncSpSliders();markDirty();});
  $('#spFollow').addEventListener('change',function(e){spFollow=e.target.checked;if(spFollow)$('#motOn').click();});
  $('#spReset').addEventListener('click',function(){tracks.forEach(function(t,i){t.sp={az:[0,-40,40,0][i]||0,el:0,dist:[1.8,1.5,1.5,0.9][i]||1.5,orbit:0};});renderSpUI();spUpdate(true);markDirty();});
  var cv=$('#radar'),drag=false;
  cv.addEventListener('pointerdown',function(e){e.preventDefault();drag=true;try{cv.setPointerCapture(e.pointerId);}catch(x){}radarPointer(e);});
  cv.addEventListener('pointermove',function(e){if(drag)radarPointer(e);});
  cv.addEventListener('pointerup',function(){drag=false;});
  $('#binBtn').addEventListener('click',function(){exportSongOffline(true);});
  $('#stemsBtn').addEventListener('click',exportStems);
  $$('[data-sf]').forEach(function(b){b.addEventListener('click',function(){try{localStorage.setItem('ecou.stemfmt',b.getAttribute('data-sf'));}catch(e){}stemFmtUI();});});stemFmtUI();
}

/* ---------- AMP & TONE ---------- */
