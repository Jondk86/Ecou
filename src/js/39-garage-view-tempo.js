function garRenderPlay(){
  var inst=GAR.inst||'skeys';GAR.inst=inst;var I=GINST[inst],fam=FAM[IFAM[inst]];$('#t-gar').style.setProperty('--fam',fam);
  $('#garInstName').textContent=I.name;garTrackSel();garSoundSel();
  var apk=garApKind(),smart=inst==='skeys'||inst==='gtr'||inst==='bass',rigOk=inst==='gtr'||inst==='bass'||inst==='audio'||inst==='vocal',amp=rigOk&&GAR.amp;GAR.amp=amp;
  $('#garMode').hidden=!rigOk;$$('#garMode [data-md]').forEach(function(b){b.setAttribute('aria-pressed',(b.getAttribute('data-md')==='amp')===amp);});
  $('#garApRow').hidden=!smart||amp;$('#garOpts').hidden=!(smart||inst==='keys'||rigOk||I.track==='drums');garSoundSel();
  if(smart){var a=$('#garAp');a.innerHTML='<button data-ap="0">Off</button>'+GAP[apk].map(function(p,i){return '<button data-ap="'+(i+1)+'" aria-label="'+p.n+'">'+(i+1)+'</button>';}).join('');
    $$('#garAp [data-ap]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-ap')===GAR.ap[apk]);b.addEventListener('click',function(){GAR.ap[apk]=+b.getAttribute('data-ap');$$('#garAp [data-ap]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});if(GAR.ap[apk]===0)garApStop();garHint();});});}
  $('#kbwrap').hidden=inst!=='keys';if(inst==='keys')setKbCollapsed(false);
  if(amp)garRigUI();else if(smart)garStrips();else if(inst==='kit')garKit();else if(inst==='sdrums')garSmartDrums();else if(inst==='drummer')garDrummer();else if(inst==='band')garBand();else if(inst==='audio')garAudioUI();else if(inst==='vocal'){if(!VTL.on){try{vtLiveToggle(true,true);}catch(e){}}garAudioUI();}else if(inst==='keys')garKeysUI();
  garHint();if(amp)$('#garHint').hidden=true;garBanner();
}
function garHint(){var inst=GAR.inst,t='';
  if(inst==='skeys'||inst==='gtr'||inst==='bass'){var k=garApKind(),a=GAR.ap[k];t=a?'Autoplay plays “'+GAP[k][a-1].n+'” in time. Tap a chord to start it, another to change, the same one to stop.':(inst==='gtr'?'Tap a chord name to strum it, or drag across the strings.':inst==='bass'?'Each column has root at the bottom, then third, fifth and octave.':'Top three rows play the chord in different positions. The two darker rows are bass notes.');}
  else if(inst==='kit')t='Hit higher on a pad to play louder.';else if(inst==='sdrums')t='Choose a drum, then place it: further right plays more notes, higher plays louder.';else if(inst==='band')t='Pick a genre to start, press Play and solo over it. Open the sections below to change the mode, meter, players or write your own groove. Part changes wait for the end of the phrase, like a real band.';else if(inst==='drummer')t='Drag the dot: further right plays busier, higher plays harder. Changes are heard on the next loop.';
  $('#garHint').textContent=t;$('#garHint').hidden=!t;}
function garBanner(){var b=$('#garBanner'),R=GAR.ll.rec;if(R&&seq.rec&&seq.mode==='loops'){b.hidden=false;b.innerHTML='<span>Recording into '+escapeH(tracks[R.ti].name)+', loop '+PATN[R.p]+'</span><button id="garBanStop">Stop</button>';$('#garBanStop').onclick=function(){llRecStop();};}else b.hidden=true;}

/* ---------- Live Loops UI ---------- */
function garMini(ti,p){var pt=patterns[p],len=pt.len,W=100,H=40,h='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">',col=garFamT(ti);
  if(ti===0){var rows=[];pt.drums.forEach(function(a,i){if(a.slice(0,len).some(Boolean))rows.push(i);});rows=rows.slice(0,6);var rh=H/Math.max(3,rows.length);
    rows.forEach(function(i,r){for(var s=0;s<len;s++){var v=pt.drums[i][s];if(!v)continue;var vv=typeof v==='number'?v:0.8;h+='<rect x="'+(s/len*W+0.4)+'" y="'+(r*rh+rh*0.2)+'" width="'+Math.max(1.4,W/len-0.8)+'" height="'+(rh*0.6)+'" rx="0.6" fill="'+col+'" fill-opacity="'+(0.35+0.65*vv)+'"/>';}});}
  else{var ns=pt.notes[ti]||[];if(!ns.length)return '';var lo=127,hi=0;ns.forEach(function(n){lo=Math.min(lo,n.m);hi=Math.max(hi,n.m);});var span=Math.max(12,hi-lo+1);
    ns.forEach(function(n){var y=H-((n.m-lo+0.5)/span)*H;h+='<rect x="'+(n.s/len*W)+'" y="'+(y-1.6)+'" width="'+Math.max(1.5,n.l/len*W-0.6)+'" height="3.2" rx="1" fill="'+col+'"/>';});}
  return h+'</svg>';}
function llRender(){
  var w=$('#garGrid');if(!w||$('#gv-loops').hidden)return;var rows=llRows(),L=GAR.ll,h='<span></span>';
  for(var p=0;p<8;p++){var any=rows.some(function(ti){return llHas(ti,p);}),on=rows.some(function(ti){return L.act[ti]&&L.act[ti].p===p;});h+='<button class="gx-colh'+(on?' on':'')+'" data-scn="'+p+'" aria-label="Play every loop in column '+PATN[p]+'"'+(any?'':' disabled')+'>'+GSVG.play+PATN[p]+'</button>';}
  rows.forEach(function(ti){var t=tracks[ti],on=!!L.act[ti],c=garFamT(ti);h+='<button class="gx-rh'+(on?' on':'')+'" data-rst="'+ti+'" style="--c:'+c+'" aria-label="'+(on?'Stop ':'')+escapeH(t.name)+'"><i>'+garSvg(garIconT(ti))+'</i><span>'+escapeH(t.name)+'</span></button>';
    for(var p=0;p<8;p++){var has=llHas(ti,p),pl=on&&L.act[ti].p===p,q=L.q[ti]===p||(pl&&L.q[ti]===-1),rc=L.rec&&L.rec.ti===ti&&L.rec.p===p;
      h+='<button class="gx-cell'+(has?' has':'')+(pl?' play':'')+(q?' q':'')+(rc?' rc':'')+'" style="--c:'+c+'" data-cell="'+ti+':'+p+'" aria-label="'+escapeH(t.name)+', loop '+PATN[p]+(has?(pl?', playing':''):', empty')+'">'+(has?garMini(ti,p):'<span class="pl">+</span>')+(pl?'<b data-pr="'+ti+'"></b>':'')+'</button>';}});
  w.innerHTML=h;$('#garPerf').setAttribute('aria-pressed',!!L.perf);
}
function llProgress(){if(!llRunning()||$('#gv-loops').hidden)return;var L=GAR.ll,pos=(ctx.currentTime-(ctx.outputLatency||0)-seq.audStart)/stepDur();
  $$('#garGrid [data-pr]').forEach(function(b){var a=L.act[+b.getAttribute('data-pr')];if(!a)return;var len=patterns[a.p].len,f=pos<a.g0?0:((pos-a.g0)%len)/len;b.style.width=(f*100)+'%';});}
function llInstFor(ti){return ti===0?'kit':/guitar/i.test(tracks[ti].name)?'gtr':/bass/i.test(tracks[ti].name)?'bass':'skeys';}
function llCellSheet(ti,p){var has=llHas(ti,p),t=tracks[ti],nm=t.name+', loop '+PATN[p],h='';
  h+='<button class="gx-act" data-a="rec"><span class="dot"></span>'+(has?'Record over this loop':'Record a new loop with '+GINST[llInstFor(ti)].name)+'</button>';
  if(ti===0)h+='<button class="gx-act" data-a="drum">'+GSVG.drum+(has?'Replace with Drummer':'Let Drummer play this loop')+'</button>';
  if(has){h+='<button class="gx-act" data-a="copy">'+GSVG.copy+'Duplicate to the next empty cell</button><button class="gx-act" data-a="edit">'+GSVG.edit+'Edit notes in Song</button><button class="gx-act danger" data-a="clr">'+GSVG.trash+'Delete loop</button>';}
  garSheet(nm,h,function(b){$$('#garSheetB [data-a]').forEach(function(x){x.addEventListener('click',function(){var a=x.getAttribute('data-a');garSheetClose();
    if(a==='rec')llRecord(ti,p);
    else if(a==='drum'){GAR.drum.pat=p;garApplyDrummer();llRender();toast('Drummer is playing loop '+PATN[p]+'. Adjust it in Instruments → Drummer.',2400);}
    else if(a==='copy'){var to=-1;for(var k=0;k<8;k++)if(k!==p&&!llHas(ti,k)){to=k;break;}if(to<0){toast('This row has no empty cell.');return;}var A=patterns[p],B=patterns[to];if(ti===0){A.drums.forEach(function(r,i){B.drums[i]=r.slice();});}else{noteArr(B,ti);B.notes[ti]=JSON.parse(JSON.stringify(A.notes[ti]));}if(!patHas(B)||B.len<A.len)B.len=A.len;markDirty();renderPatSegs();llRender();toast('Duplicated to '+PATN[to]+'.',1200);}
    else if(a==='edit'){setPattern(p);if(ti>0)try{selectTrack(ti);songSel=ti;}catch(e){}showTab(ti===0?'t-pad':'t-song');}
    else if(a==='clr'){var pt=patterns[p];if(ti===0){pt.drums.forEach(function(r){for(var s=0;s<r.length;s++)r[s]=false;});pt.locks={};}else pt.notes[ti]=[];if(GAR.ll.act[ti]&&GAR.ll.act[ti].p===p)GAR.ll.q[ti]=-1;markDirty();renderPatSegs();if(p===curPat){try{paintSteps();renderPadDots();drawRoll();}catch(e){}}llRender();toast('Loop deleted.',1200);}
  });});});}

/* ---------- Tracks UI ---------- */
function garTl(){
  var w=$('#garTl');if(!w||$('#gv-tracks').hidden)return;
  if(!daw.clips.length){w.innerHTML='<div class="gx-empty"><b>Your song is empty</b><p>Record an instrument, add a Drummer, or capture a Live Loops performance. Everything you add shows up here.</p><div class="gx-acts" style="width:100%"><button class="gx-btn pri" id="garEmI">Choose an instrument</button><button class="gx-btn" id="garEmL">Open Live Loops</button></div></div>';
    $('#garEmI').onclick=function(){garView('sounds');};$('#garEmL').onclick=function(){garView('loops');};w._end=0;$('#gv-tracks .gx-tfoot').hidden=true;return;}
  $('#gv-tracks .gx-tfoot').hidden=false;
  var end=Math.max(32,Math.ceil((arrEnd()+8)/16)*16),h='<div class="gx-ruler"><span></span><div id="garRuler">',bars=end/16,step=bars>24?8:bars>12?4:bars>6?2:1;
  for(var b=0;b<bars;b+=step)h+='<span style="left:'+(b*16/end*100)+'%">'+(b+1)+'</span>';h+='</div></div>';
  tracks.forEach(function(t,i){var c=garFamT(i);h+='<div class="gx-trow"><div class="gx-th'+(i===GAR.ti?' sel':'')+'" style="--c:'+c+'"><button class="gx-tn" data-gt="'+i+'" aria-label="Play '+escapeH(t.name)+'"><b>'+escapeH(t.name)+'</b></button><span class="gx-ms"><button data-gm="'+i+'" aria-pressed="'+!!t.mute+'" aria-label="Mute '+escapeH(t.name)+'">M</button><button data-gso="'+i+'" aria-pressed="'+!!t.solo+'" aria-label="Solo '+escapeH(t.name)+'">S</button></span></div><div class="gx-lane" data-gl="'+i+'"><canvas></canvas></div></div>';});
  w.innerHTML=h+'<div class="gx-ph" id="garPh"></div>';w._end=end;
  $$('#garTl .gx-lane').forEach(function(l){garLane(l,+l.getAttribute('data-gl'),end);});
  $$('#garTl [data-gt]').forEach(function(d){d.addEventListener('click',function(e){if(e.target.closest('[data-gm],[data-gso]'))return;var i=+d.getAttribute('data-gt'),t=tracks[i];GAR.ti=i;garOpen(i===0?'drummer':t.kind==='audio'?'audio':llInstFor(i),i);});});
  $$('#garTl [data-gm]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-gm')];t.mute=!t.mute;applyMix();renderMixer();markDirty();garTl();});});
  $$('#garTl [data-gso]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-gso')];t.solo=!t.solo;applyMix();renderMixer();markDirty();garTl();});});
  function seek(el,e){var r=el.getBoundingClientRect(),g=Math.round(clamp((e.clientX-r.left)/r.width,0,1)*end/4)*4;if(seq.on&&seq.mode!=='arrange')transportStop();setPlayhead(g);garPh();garUpd();}
  $$('#garTl .gx-lane, #garRuler').forEach(function(l){l.addEventListener('click',function(e){seek(l,e);});});
  garPh();
}
function garLane(l,ti,end){var cv=l.querySelector('canvas'),r=l.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);var g=cv.getContext('2d'),W=r.width,H=r.height,col=garFamT(ti);g.scale(dpr,dpr);
  g.fillStyle='#1A1A23';for(var b=1;b<end/16;b++){g.fillRect(Math.round(b*16/end*W),0,1,H);}
  daw.clips.forEach(function(c){if(c.ti!==ti)return;var x0=c.s/end*W,len=c.type==='pat'?c.l:clipLen(c),w=Math.max(3,len/end*W-1.5);
    g.globalAlpha=c.mute?0.25:1;g.fillStyle=col+'2E';g.strokeStyle=col+'99';g.lineWidth=1;g.beginPath();if(g.roundRect)g.roundRect(x0+0.5,5.5,w,H-11,6);else g.rect(x0+0.5,5.5,w,H-11);g.fill();g.stroke();
    g.save();g.beginPath();g.rect(x0+1,6,w-1,H-12);g.clip();g.fillStyle=col;
    if(c.type==='pat'){var pt=patterns[c.p];if(pt){var pl=pt.len,o=c.o||0;
      if(ti===0){var rows=[];pt.drums.forEach(function(a,i){if(a.slice(0,pl).some(Boolean))rows.push(i);});rows=rows.slice(0,5);var rh=(H-18)/Math.max(3,rows.length);
        for(var s=0;s<len;s++){var ps=((s+o)%pl+pl)%pl;rows.forEach(function(i,k){if(pt.drums[i][ps])g.fillRect(x0+s/end*W+1,9+k*rh,Math.max(1,W/end-0.5),Math.max(1.5,rh*0.55));});}}
      else{var ns=pt.notes[ti]||[],lo=127,hi=0;ns.forEach(function(n){lo=Math.min(lo,n.m);hi=Math.max(hi,n.m);});var span=Math.max(12,hi-lo+1);
        for(var rep=-1;rep*pl<len;rep++)ns.forEach(function(n){var s0=rep*pl+n.s-o;if(s0+n.l<0||s0>=len)return;var y=H-9-((n.m-lo+0.5)/span)*(H-18);g.fillRect(x0+s0/end*W+1,y-1.2,Math.max(1.5,n.l/end*W-0.5),2.4);});}}}
    else if(c.type==='aud'){var ab=abuf[c.buf];if(ab){var pk=peaksOf(ab),sr=ab.sampleRate,du=ab.duration,n=Math.max(1,Math.floor(w)),spx=c.dur/n,mid=H/2,amp=dbg(c.gain||0);g.globalAlpha*=0.9;
      for(var x=0;x<n;x++){var a=c.off+x*spx;if(c.loop)a=((a%du)+du)%du;if(a>=du)break;var i0=Math.floor(a*sr/256),i1=Math.max(i0+1,Math.ceil((a+spx)*sr/256)),m=0;for(var j=i0;j<i1&&j<pk.length;j++)if(pk[j]>m)m=pk[j];var hh=Math.max(1,Math.min(1,m*amp)*(H-16)/2);g.fillRect(x0+x+1,mid-hh,1,hh*2);}}}
    g.restore();g.globalAlpha=1;
    if(c.name&&w>48){g.fillStyle='#F4F4F7';g.font='600 10px Inter, system-ui, sans-serif';g.fillText(String(c.name).slice(0,24),x0+6,16);}});
}
function garPh(){var ph=$('#garPh'),w=$('#garTl');if(!ph||!w||!w._end)return;var lane=w.querySelector('.gx-lane');if(!lane){ph.hidden=true;return;}
  var pos=seq.on&&seq.mode==='arrange'?Math.max(0,arrPosNow()):daw.play,wr=w.getBoundingClientRect(),lr=lane.getBoundingClientRect();ph.hidden=false;ph.style.left=(lr.left-wr.left+clamp(pos/w._end,0,1)*lr.width-1)+'px';ph.style.top=(lr.top-wr.top)+'px';}

/* ---------- views, transport, status ---------- */
function garView(v){if(v==='inst')v=GAR.inst&&GAR.surf?'play':'sounds';GAR.view=v;if(v==='play')GAR.surf=true;if(v==='sounds')GAR.surf=false;
  ['sounds','play','loops','tracks'].forEach(function(k){$('#gv-'+k).hidden=k!==v;});
  var tab=v==='sounds'||v==='play'?'inst':v;$$('#garViews [data-gv]').forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-gv')===tab);});
  $('#kbwrap').hidden=!(v==='play'&&GAR.inst==='keys');if(v!=='play'&&GAR.apOn>=0)garApStop();
  if(v==='play')garRenderPlay();if(v==='loops'){$('#t-gar').style.setProperty('--fam',FAM.l);llRender();}if(v==='tracks')garTl();if(v==='sounds')garBrowse();garUpd();$('main').scrollTop=0;if(v==='play')requestAnimationFrame(garFit);if(showTab.cur==='t-gar')navSync();}
function garPlay(){
  if(bandRunning()){bandStop();garUpd();return;}if(GAR.inst==='band'&&GAR.view==='play'){bandStart();return;}
  if(GAR.view==='loops'){if(llRunning()){transportStop();}else{var L=GAR.ll,rows=llRows(),any=false;L.act={};L.q={};rows.forEach(function(ti){var p=-1;if(llHas(ti,curPat))p=curPat;else for(var k=0;k<8;k++)if(llHas(ti,k)){p=k;break;}if(p>=0){L.q[ti]=p;any=true;}});if(!any){toast('Record a loop first: tap an empty cell.',1800);return;}llStart();}garUpd();return;}
  if(seq.on){transportStop();}else{
    if(!arrEnd()&&!arr.rec){ /* empty song: never start and silently stop */
      var pv=GAR.view==='play'?(GAR.inst==='drummer'?$('#garDpv [data-pv="1"]'):GAR.inst==='sdrums'?$('#garSpv [data-pv="1"]'):null):null;if(pv){pv.click();return;}
      if(GAR.view==='play'&&GINST[GAR.inst]&&GINST[GAR.inst].track){arr.jam=true;toast('Click track: play along, then press Record to capture it.',2400);}
      else{toast('Nothing to play yet — record or add something first.',2400);return;}
    }
    transportStart('arrange');}garUpd();
}
function garRecord(){
  if(GAR.view==='loops'){if(GAR.ll.rec&&seq.rec){llRecStop();return;}toast('Tap an empty cell to record a loop into it.',2000);return;}
  if(seq.on&&seq.mode==='loops'&&GAR.ll.rec){llRecStop();return;}
  if(arr.rec){transportStop();setTimeout(garUpd,200);return;}
  if(GAR.inst==='audio'||GAR.inst==='vocal'){var ti=GAR.ti;tracks.forEach(function(t,i){if(t.kind==='audio')t.arm=i===ti;});daw.lane=ti;dawRecord();setTimeout(garUpd,300);return;}
  if(seq.on&&seq.mode==='arrange'&&seq.rec){seq.rec=false;recFlush();transportStop();garUpd();if(GAR.view==='tracks')garTl();return;}
  if(!GAR.inst||GAR.view!=='play'){toast('Choose an instrument first, then record.',1800);garView('sounds');return;}
  if(GAR.inst==='band'&&GAR.view==='play'){bandJam();return;}
  if(GAR.inst==='drummer'||GAR.inst==='sdrums'){toast('The drum part is written for you. Use “Add to song” to place it, or record into a loop in Live Loops.',2800);return;}
  if(!ensureAudio())return;if(seq.on)transportStop();if(GAR.ti>0&&tracks[GAR.ti].kind==='keys'&&GAR.ti!==selTrack)selectTrack(GAR.ti);
  seq.rec=true;seq.src='arrange';jamSess++;jamTarget.warned=false;arr.pre=daw.count?16:0;transportStart('arrange');garUpd();
}
function garPosTxt(){var g,cnt=false;if(bandRunning())return bandPos();if(seq.on&&seq.mode==='arrange'){g=arrPosNow();if(g<arr.startG){cnt=true;}}else if(seq.on){g=Math.max(0,(ctx.currentTime-(ctx.outputLatency||0)-seq.audStart)/stepDur());}else g=daw.play;
  if(cnt)return {t:'Count in '+(4-Math.floor(((g-arr.startG+16)%16)/4)),c:true};g=Math.max(0,g);return {t:(Math.floor(g/16)+1)+'.'+(Math.floor((g%16)/4)+1),c:false};}
function garUpd(){
  var p=$('#garPlay');if(!p)return;var lo=GAR.view==='loops',on=lo?llRunning():(seq.on&&seq.mode!=='loops')||bandRunning();
  p.classList.toggle('on',on);p.setAttribute('aria-label',on?'Stop':'Play');var recOn=(seq.rec&&seq.on)||!!arr.rec;$('#garRec').classList.toggle('on',recOn);$('#garRec').setAttribute('aria-label',recOn?'Stop recording':'Record');
  $('#garBpm').textContent=Math.round(P.bpm.v);$('#garClick').hidden=!seq.metro;
  var st='',rc=false;if(recOn){rc=true;st=GAR.ll.rec&&seq.mode==='loops'?'Recording into '+tracks[GAR.ll.rec.ti].name+', loop '+PATN[GAR.ll.rec.p]:'Recording '+(arr.rec?'audio':(tracks[GAR.ti]?tracks[GAR.ti].name:''));}
  else if(seq.on&&seq.mode==='loops'&&GAR.ll.perfLog){st='Capturing your performance to Tracks';rc=true;}else if(seq.on&&seq.mode==='pattern')st='Previewing loop '+PATN[curPat];
  var se=$('#garSt');se.textContent=st;se.classList.toggle('rec',rc);garBanner();
  var mr=$('#garMicRec');if(mr)mr.classList.toggle('on',!!arr.rec);
  if(GAR.view==='loops')llRender();
  $$('#garSpv [data-pv="1"], #garDpv [data-pv="1"]').forEach(function(b){b.innerHTML=seq.on&&seq.mode==='pattern'?'Stop preview':GSVG.play+'Preview';});
}
function garTick(){if(!$('#t-gar').classList.contains('active'))return;if(GAR.view==='loops')llProgress();if(GAR.view==='tracks')garPh();
  var ps=garPosTxt();if(ps.t!==GAR.ui.pos){GAR.ui.pos=ps.t;$('#garPos').textContent=ps.t;$('#garPosBtn').classList.toggle('cnt',ps.c);}
  var tx=(seq.on?'1':'0')+seq.mode+(seq.rec?1:0)+(arr.rec?1:0)+Math.round(P.bpm.v)+(seq.metro?1:0);if(tx!==GAR.ui.last){var was=GAR.ui.last;GAR.ui.last=tx;garUpd();if(GAR.view==='tracks'&&was&&was[0]==='1'&&tx[0]==='0')garTl();}
  var ll=JSON.stringify(GAR.ll.act)+JSON.stringify(GAR.ll.q);if(GAR.view==='loops'&&ll!==GAR.ui.ll){GAR.ui.ll=ll;llRender();}}
function garShown(){garView(GAR.view==='play'&&!GAR.inst?'sounds':GAR.view);}
function garTempoSheet(){var h='<div class="gx-tempo"><button id="gtDn" aria-label="Slower">−</button><b id="gtV">'+Math.round(P.bpm.v)+'</b><button id="gtUp" aria-label="Faster">+</button></div><button class="gx-btn" id="gtTap">Tap tempo</button>'+
  '<div class="gx-sec"><div class="gx-row"><span>Song key</span><select id="gtKey" class="dsel" aria-label="Song key" style="max-width:150px">'+$('#garKey').innerHTML+'</select></div></div><div class="gx-sec"><div class="gx-row"><span>Metronome</span><button class="gx-sw" id="gtMet" aria-pressed="'+!!seq.metro+'" aria-label="Metronome"></button></div><div class="gx-row"><span>Count in one bar before recording</span><button class="gx-sw" id="gtCnt" aria-pressed="'+!!daw.count+'" aria-label="Count-in"></button></div><div class="gx-row"><span>Harmony colours on keys and chords</span><button class="gx-sw" id="gtHarm" aria-pressed="'+!!HARM.on+'" aria-label="Harmony colours"></button></div></div>';
  garSheet('Tempo, click and colours',h,function(){function v(){$('#gtV').textContent=Math.round(P.bpm.v);garUpd();}
    var rep=null;function hold(b,d){b.addEventListener('pointerdown',function(){$(d).click();v();rep=setTimeout(function r(){$(d).click();v();rep=setTimeout(r,70);},380);});['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){clearTimeout(rep);});});}
    hold($('#gtDn'),'#dawBpmDn');hold($('#gtUp'),'#dawBpmUp');$('#gtTap').addEventListener('click',function(){$('#dawTap').click();v();});var gk=$('#gtKey');gk.value=$('#garKey').value;gk.addEventListener('change',function(){var k=$('#garKey');k.value=gk.value;k.dispatchEvent(new Event('change'));});
    $('#gtMet').addEventListener('click',function(){seq.metro=!seq.metro;this.setAttribute('aria-pressed',seq.metro);var tm=$('#trMetro');if(tm)tm.checked=seq.metro;updDawTr();garUpd();});
    $('#gtCnt').addEventListener('click',function(){daw.count=!daw.count;this.setAttribute('aria-pressed',daw.count);updDawTr();});
    $('#gtHarm').addEventListener('click',function(){harmToggle(!HARM.on);this.setAttribute('aria-pressed',HARM.on);});});}
function initGarage(){
  var ks=$('#garKey'),h='<optgroup label="Major">';for(var i=0;i<12;i++)h+='<option value="'+i+'">'+GNOTE[i]+' major</option>';h+='</optgroup><optgroup label="Minor">';for(i=0;i<12;i++)h+='<option value="'+i+'m">'+GNOTE[i]+' minor</option>';ks.innerHTML=h+'</optgroup>';ks.value='0';
  ks.addEventListener('change',function(){var ok=GAR.key,om=GAR.minor;GAR.minor=/m$/.test(ks.value);GAR.key=parseInt(ks.value,10);if(typeof bandKeyChanged==='function')bandKeyChanged(ok,om);GAR.chords=null;markDirty();harmPaintKeys();HARM.cur=null;if(GAR.view==='play')garRenderPlay();garUpd();});
  $$('#garViews [data-gv]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-gv');if(v==='inst'&&(GAR.view==='play'||GAR.view==='sounds'))v=GAR.view==='play'?'sounds':'sounds';garView(v);});});
  $('#garBack').addEventListener('click',function(){garView('sounds');});
  $('#garPlay').addEventListener('click',garPlay);$('#garRec').addEventListener('click',garRecord);
  $('#garHome').addEventListener('click',function(){if(seq.on)transportStop();setPlayhead(0);garPh();garUpd();});
  $('#garPosBtn').addEventListener('click',garTempoSheet);
  $('#garSheet').addEventListener('click',function(e){if(e.target.getAttribute('data-close'))garSheetClose();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#garSheet').hidden)garSheetClose();});
  $('#garSnd').addEventListener('change',function(){var v=this.value;if(!v)return;if(v.indexOf('kit:')===0){loadKit(v.slice(4));GAR.kit=v.slice(4);setTimeout(garSoundSel,50);return;}if(GAR.ti!==selTrack)selectTrack(GAR.ti);loadStock(v);garSoundSel();});
  $$('#garMode [data-md]').forEach(function(b){b.addEventListener('click',function(){GAR.amp=b.getAttribute('data-md')==='amp';if(GAR.apOn>=0)garApStop();garRenderPlay();});});
  $('#garTrack').addEventListener('change',function(){if(GAR.apOn>=0)garApStop();GAR.ti=+this.value;if(tracks[GAR.ti].kind==='keys')selectTrack(GAR.ti);garRenderPlay();});
  var grid=$('#garGrid'),lp=null,lpFired=false;
  grid.addEventListener('pointerdown',function(e){var c=e.target.closest('[data-cell]');if(!c)return;lpFired=false;clearTimeout(lp);lp=setTimeout(function(){var v=c.getAttribute('data-cell').split(':');if(llHas(+v[0],+v[1])){lpFired=true;if(navigator.vibrate)try{navigator.vibrate(12);}catch(x){}llCellSheet(+v[0],+v[1]);}},450);});
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){grid.addEventListener(ev,function(){clearTimeout(lp);});});
  grid.addEventListener('contextmenu',function(e){if(e.target.closest('[data-cell]'))e.preventDefault();});
  grid.addEventListener('click',function(e){var L=GAR.ll,b=e.target.closest('button');if(!b)return;ensureAudio();
    if(b.hasAttribute('data-scn')){var p=+b.getAttribute('data-scn'),rows=llRows();if(!llRunning()){L.act={};L.q={};}rows.forEach(function(ti){L.q[ti]=llHas(ti,p)?p:-1;});if(!llRunning())llStart();llRender();garUpd();return;}
    if(b.hasAttribute('data-rst')){var ti=+b.getAttribute('data-rst');if(llRunning()&&L.act[ti])L.q[ti]=-1;llRender();return;}
    if(b.hasAttribute('data-cell')){if(lpFired){lpFired=false;return;}var v=b.getAttribute('data-cell').split(':'),ti2=+v[0],p2=+v[1];
      if(!llHas(ti2,p2)){llCellSheet(ti2,p2);return;}
      if(llRunning()&&L.act[ti2]&&L.act[ti2].p===p2&&L.q[ti2]==null)L.q[ti2]=-1;else llLaunch(ti2,p2);llRender();garUpd();}});
  $('#garStopAll').addEventListener('click',function(){if(llRunning())transportStop();GAR.ll.act={};GAR.ll.q={};llRender();garUpd();});
  $('#garPerf').addEventListener('click',function(){var L=GAR.ll;L.perf=!L.perf;if(L.perf&&llRunning()){L.perfLog=[];Object.keys(L.act).forEach(function(k){L.perfLog.push({ti:+k,p:L.act[k].p,g:Math.ceil(seq.step/16)*16});});}if(!L.perf)L.perfLog=null;llRender();garUpd();toast(L.perf?'What you play from now on is added to Tracks when you stop.':'Capture to Tracks is off.',2000);});
  $('#garAddTr').addEventListener('click',function(){garView('sounds');});
  $('#garToStudio').addEventListener('click',function(){showTab('t-daw');});
  window.addEventListener('resize',function(){if($('#t-gar').classList.contains('active')){garFit();if(GAR.view==='tracks')garTl();}});
  setInterval(garTick,60);
}

buildControls();initStudio();initDaw();initJam();initPocket();initRoll2();initDrums2();initRef();initFM();initFm1();initF1();initLoopB();requestAnimationFrame(meterTick);initGarage();initTrx();initScf();initTab();
$('#hitTgt').addEventListener('click',hitTarget);$$('[data-tgt]').forEach(function(b){b.addEventListener('click',function(){MT.tgt=+b.getAttribute('data-tgt');$$('[data-tgt]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});initSpatial();initAmp();initScore();initPads();initSlicer();initAI();buildFxUI();buildDsync();updDelayTime();buildMatrix();buildKeyboard();requestAnimationFrame(loop);
/* ---------- design v2: global LCD transport ---------- */
