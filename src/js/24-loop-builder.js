var lb={layer:0,undo:[],recEnd:0,counting:false};
function lbLayers(){return tracks.map(function(t,i){return {t:t,i:i};}).filter(function(x){return x.t.kind!=='audio';});}
function lbCount(pt,i){if(i===0){var n=0;pt.drums.forEach(function(a){for(var k=0;k<pt.len;k++)if(a[k])n++;});return n;}return (pt.notes[i]||[]).length;}
function lbSound(t,i){if(i===0)return 'pads';var S=i===selTrack?{engine:engine,fmP:fmP,slots:slots}:t.sound;if(!S)return '';if(S.engine==='fm')return 'FM · '+FMC.name(S.fmP||FMV[0].p);return (S.slots&&S.slots.A&&S.slots.A.name)||'';}
function lbRender(){var w=$('#lbLayers');if(!w)return;var pt=patterns[curPat];
  w.innerHTML=lbLayers().map(function(x){var n=lbCount(pt,x.i),sel=x.i===lb.layer;return '<div class="lbr'+(n?' has':'')+'" role="listitem" aria-selected="'+sel+'"><span class="dot"></span><button class="lbn" data-lbs="'+x.i+'"><strong>'+x.t.name+'</strong><small>'+lbSound(x.t,x.i)+'</small></button><span class="mu lbc">'+(n?n+(x.i===0?' hits':' notes'):'empty')+'</span>'+
    '<button class="mv" data-lbm="'+x.i+'" aria-pressed="'+!!x.t.mute+'" aria-label="Mute '+x.t.name+'">M</button><button class="mv" data-lbx="'+x.i+'" aria-label="Clear '+x.t.name+' in this loop"'+(n?'':' disabled')+'>✕</button></div>';}).join('');
  $$('[data-lbs]').forEach(function(b){b.addEventListener('click',function(){lbSelect(+b.getAttribute('data-lbs'));});});
  $$('[data-lbm]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-lbm')];t.mute=!t.mute;ensureAudio();applyMix();renderMixer();renderDawHeads();markDirty();lbRender();});});
  $$('[data-lbx]').forEach(function(b){armTap(b,'Tap again to clear',function(){var i=+b.getAttribute('data-lbx');lbSnap();var pt=patterns[curPat];if(i===0)pt.drums.forEach(function(a){for(var k=0;k<a.length;k++)a[k]=false;});else pt.notes[i]=[];markDirty();paintSteps();renderPadDots();drawRoll();renderPatSegs();lbRender();});});
  var bpm=Math.round(P.bpm.v);$('#lbBpm').textContent=bpm+' BPM';$('#lbInfo').textContent='Pattern '+pt.name+' · '+(pt.len/16)+' bar'+(pt.len>16?'s':'');
  $$('[data-lbl]').forEach(function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-lbl')===pt.len));});
  $('#lbUndo').disabled=!lb.undo.length;var on=seq.on&&seq.mode==='pattern';$('#lbPlay').textContent=on||lb.counting?'■ Stop':'▶ Loop';
  $('#lbRec').classList.toggle('live',!!seq.rec&&on);$('#lbRec').textContent=lb.counting?'Count-in…':(seq.rec&&on?'● Recording '+tracks[lb.layer].name:'● Record layer');}
function lbSelect(i){lb.layer=i;var t=tracks[i];if(!t)return;if(i>0&&t.kind==='keys'){keysSrc=i;renderKeysSrc();selectTrack(i);setKbCollapsed(false);toast('Layer: '+t.name+' — play it on the keys below.',1600);}else{setKbCollapsed(true);toast('Layer: Drums — play the pads.',1400);}lbRender();}
function lbSnap(){var pt=patterns[curPat];lb.undo.push({pi:curPat,d:JSON.stringify({drums:pt.drums,notes:pt.notes,locks:pt.locks||{},len:pt.len})});if(lb.undo.length>20)lb.undo.shift();}
function lbUndo(){var u=lb.undo.pop();if(!u)return;var pt=patterns[u.pi],d=JSON.parse(u.d);pt.drums=d.drums;pt.notes=d.notes;pt.locks=d.locks;pt.len=d.len;if(seq.rec){recPend.clear&&recPend.clear();}markDirty();bindPads();paintSteps();renderPadDots();drawRoll();renderPatSegs();lbRender();toast('Last take undone.',1200);}
function lbLoopDur(){return patterns[curPat].len*stepDur();}
function lbStartLoop(thenRec){if(!ensureAudio())return;seq.metro=$('#lbMetro').checked;
  if(thenRec&&$('#lbCount').checked){var b=60/P.bpm.v,t0=ctx.currentTime+0.1;for(var k=0;k<4;k++)click(t0+k*b,k===0);lb.counting=true;lbRender();
    setTimeout(function(){lb.counting=false;if(seq.on)transportStop();transportStart('pattern');lbBeginTake();},Math.max(0,(t0+4*b-ctx.currentTime-0.08)*1000));return;}
  if(seq.on)transportStop();transportStart('pattern');if(thenRec)lbBeginTake();lbRender();}
function lbBeginTake(){lbSnap();seq.quant=$('#lbQ').checked;seq.rec=true;lb.recEnd=$('#lbOne').checked?ctx.currentTime+lbLoopDur()+0.05:0;updTransportUI();lbRender();}
function lbEndTake(msg){recFlush();seq.rec=false;lb.recEnd=0;updTransportUI();lbRender();if(msg){var pt=patterns[curPat],n=lbCount(pt,lb.layer);toast(tracks[lb.layer].name+' recorded ('+n+(lb.layer===0?' hits':' notes')+'). The loop keeps playing: pick the next layer and press ● again.',3200);}}
function lbRecBtn(){if(lb.counting)return;if(seq.rec&&seq.on){lbEndTake(true);return;}if(lb.layer>0&&tracks[lb.layer].kind==='keys'&&selTrack!==lb.layer)selectTrack(lb.layer);
  if(seq.on&&seq.mode==='pattern'){seq.metro=$('#lbMetro').checked;lbBeginTake();toast('Recording '+tracks[lb.layer].name+'…',1000);}else lbStartLoop(true);}
function lbNextPart(){var pt=patterns[curPat],j=-1;for(var k=0;k<patterns.length;k++){var q=(curPat+1+k)%patterns.length;if(q!==curPat&&!patHas(patterns[q])){j=q;break;}}if(j<0){toast('All patterns are in use. Clear one first.');return;}
  var dst=patterns[j],d=JSON.parse(JSON.stringify({drums:pt.drums,notes:pt.notes,locks:pt.locks||{},len:pt.len}));dst.drums=d.drums;dst.notes=d.notes;dst.locks=d.locks;dst.len=d.len;setPattern(j);markDirty();lbRender();
  toast('Part '+dst.name+' starts as a copy of '+pt.name+'. Change or clear layers to make the variation (it plays from the next bar).',3200);}
function lbAddSong(){var pt=patterns[curPat];if(!patHas(pt)){toast('Record something in this loop first.');return;}var reps=2,st=Math.ceil(arrEnd()/16)*16,n=0;
  for(var ti=0;ti<tracks.length;ti++){if(tracks[ti].kind==='audio')continue;if(lbCount(pt,ti)>0){newClip({type:'pat',ti:ti,s:st,l:pt.len*reps,p:curPat,o:0});n++;}}
  for(var r=0;r<reps;r++)song.push(curPat);renderSongUI&&renderSongUI();dawNeed=true;markDirty();
  toast('Pattern '+pt.name+' added to the song: bars '+(st/16+1)+'–'+((st+pt.len*reps)/16)+' in Studio ('+n+' layer'+(n===1?'':'s')+').',3000);}
/* timing correction (quantize) with strength; g = grid in 16th-note steps */
var lbGrid=1;
function lbQuantize(layers){var pt=patterns[curPat],g=lbGrid,st=(+$('#lbStr').value||80)/100,moved=0;lbSnap();
  layers.forEach(function(ti){
    if(ti===0){if(g%1!==0)return;var L=pt.len,nd=pt.drums.map(function(){return new Array(Math.max(64,L)).fill(false);}),nl={},lk=pt.locks||{};
      pt.drums.forEach(function(a,i){for(var k=0;k<L;k++){if(!a[k])continue;var tg=Math.round(k/g)*g,dst=st>=0.5?tg%L:k;if(dst!==k)moved++;var v=a[k]===true?1:a[k],ov=nd[i][dst];nd[i][dst]=ov&&ov!==true?Math.max(ov,v):(ov===true?true:a[k]);if(lk[i+':'+k])nl[i+':'+dst]=lk[i+':'+k];}});
      pt.drums=nd;Object.keys(lk).forEach(function(key){if(!/^\d+:\d+$/.test(key))nl[key]=lk[key];});pt.locks=nl;return;}
    var ns=pt.notes[ti]||[];ns.forEach(function(n){var tg=Math.round(n.s/g)*g,ns2=n.s+(tg-n.s)*st;ns2=Math.round(ns2*100)/100;if(ns2>=pt.len)ns2-=pt.len;if(Math.abs(ns2-n.s)>0.01)moved++;n.s=Math.max(0,ns2);
      if(st>=0.99&&n.l>=g*0.6){n.l=Math.max(g,Math.round(n.l/g)*g);}else if(n.s+n.l>pt.len)n.l=Math.max(0.25,pt.len-n.s);});});
  markDirty();paintSteps();renderPadDots();drawRoll();renderPatSegs();lbRender();
  toast(moved?'Timing fixed: '+moved+' note'+(moved===1?'':'s')+' moved to the '+({1:'1/16',2:'1/8',4:'1/4'}[g]||'1/8 triplet')+' grid ('+Math.round(st*100)+'%).':'Already on the grid.',2400);}
function initLoopB(){
  $$('[data-lbg]').forEach(function(b){b.addEventListener('click',function(){lbGrid=+b.getAttribute('data-lbg');$$('[data-lbg]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});});});
  $('#lbStr').addEventListener('input',function(e){$('#lbStrO').textContent=e.target.value+'%';});
  $('#lbFixOne').addEventListener('click',function(){lbQuantize([lb.layer]);});$('#lbFixAll').addEventListener('click',function(){lbQuantize(lbLayers().map(function(x){return x.i;}));});
  $$('[data-lbl]').forEach(function(b){b.addEventListener('click',function(){setPatLen(+b.getAttribute('data-lbl'));lbRender();});});
  $('#lbBpmD').addEventListener('click',function(){setParam('bpm',Math.round(P.bpm.v)-1);markDirty();lbRender();});$('#lbBpmU').addEventListener('click',function(){setParam('bpm',Math.round(P.bpm.v)+1);markDirty();lbRender();});
  $('#lbPlay').addEventListener('click',function(){if(lb.counting){lb.counting=false;lbRender();return;}if(seq.on&&seq.mode==='pattern'){if(seq.rec)lbEndTake(false);transportStop();lbRender();}else lbStartLoop(false);});
  $('#lbRec').addEventListener('click',lbRecBtn);$('#lbUndo').addEventListener('click',lbUndo);$('#lbNext').addEventListener('click',lbNextPart);$('#lbSong').addEventListener('click',lbAddSong);
  $('#lbMetro').addEventListener('change',function(e){seq.metro=e.target.checked;});
  setInterval(function(){if(lb.recEnd&&seq.rec&&ctx&&ctx.currentTime>=lb.recEnd)lbEndTake(true);if(seq.rec&&!seq.on&&lb.recEnd)lbEndTake(false);},50);
  setInterval(function(){if($('#t-pad').classList.contains('active')){var c=lbLayers().map(function(x){return lbCount(patterns[curPat],x.i);}).join(',')+curPat+seq.on+seq.rec;if(c!==lb.sig){lb.sig=c;lbRender();}}},400);
  lbRender();}
/* ---------- STUDIO: timeline DAW ---------- */
