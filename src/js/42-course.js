var LN={run:null,iv:0,ev:null,on:false},LNK='ecou.course';
function lnLoad(){var o=null;try{o=JSON.parse(localStorage.getItem(LNK)||'null');}catch(e){}if(!o||typeof o!=='object')o={};if(!o.done||typeof o.done!=='object')o.done={};if(!Array.isArray(o.days))o.days=[];if(!o.rev||typeof o.rev!=='object')o.rev={};if(!o.reps||typeof o.reps!=='object')o.reps={};if(!o.cur||typeof o.cur!=='object')o.cur=null;o.v=1;return o;}
function lnSave(o){try{localStorage.setItem(LNK,JSON.stringify(o));}catch(e){}}
function lnDay(t){t=t||new Date();return t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}
function lnMade(){var o=lnLoad(),d=lnDay();if(o.days.indexOf(d)<0){o.days.push(d);if(o.days.length>90)o.days=o.days.slice(-90);lnSave(o);}}
function lnStreak(o){var s={},n=0,t=new Date();o.days.forEach(function(d){s[d]=1;});if(!s[lnDay(t)])t.setDate(t.getDate()-1);while(s[lnDay(t)]){n++;t.setDate(t.getDate()-1);}return n;}
function lnMerge(c){if(!c||typeof c!=='object')return;var o=lnLoad(),k;if(c.done&&typeof c.done==='object')for(k in c.done)if(LNL[k]&&!o.done[k])o.done[k]=+c.done[k]||Date.now();
  if(Array.isArray(c.days))c.days.forEach(function(d){if(typeof d==='string'&&/^\d{4}-\d\d-\d\d$/.test(d)&&o.days.indexOf(d)<0)o.days.push(d);});o.days.sort();lnSave(o);lnCardUI();}
/* live-state helpers for predicates */
var LH={pad:function(q){if(typeof q==='number')return q;var i,s=String(q).toLowerCase();for(i=0;i<pads.length;i++)if(pads[i].name.toLowerCase()===s)return i;for(i=0;i<pads.length;i++)if(pads[i].cls===s)return i;return -1;},
  hits:function(q){var i=LH.pad(q),o=[],p=pads[i];if(!p||!p.pat)return o;var L=patterns[curPat].len;for(var s=0;s<L;s++)if(p.pat[s])o.push(s);return o;},
  on:function(q,st){var h=LH.hits(q);return st.every(function(s){return h.indexOf(s)>=0;});},
  bars:function(n){return n*240/P.bpm.v;},perc:function(){return !!(ECHO.item&&ECHO.item.perc);},
  freePad:function(){for(var i=pads.length-1;i>=0;i--){var p=pads[i];if(!slUser(p)&&p.cls!=='kick'&&p.cls!=='snare')return i;}return pads.length-1;}};
var LNR={home:function(){showTab('t-home');},'sound/capture':function(){showTab('t-cap');},'sound/shape':function(){showTab('t-ins');},'play/pads':function(){showTab('t-pad');},
  'play/sounds':function(){GAR.view='sounds';if(showTab.cur==='t-gar')garView('sounds');else showTab('t-gar');},song:function(){navGo('song');},mix:function(){navGo('mix');}};
/* setup ops: a short whitelist. freePattern only ever moves to an EMPTY pattern; fill writes only into an empty one. */
function lnOp(op,resume){var k=op.op,i;if(resume&&k!=='go'&&k!=='reveal')return;
  if(k==='stop'){if(seq.on)transportStop();if(capture)stopCapture();}
  else if(k==='go'){if(LNR[op.to])LNR[op.to]();}
  else if(k==='param')setParam(op.k,op.v);
  else if(k==='reveal'){var e=$(op.sel);if(e)e.classList.add('ln-rev');}
  else if(k==='selectPad'){i=typeof op.pad==='function'?op.pad():LH.pad(op.pad);if(i>=0)selectPad(i);}
  else if(k==='freePattern'){if(!(op.keep&&patHas(patterns[curPat]))&&patHas(patterns[curPat])){var f=-1;for(i=0;i<patterns.length;i++)if(!patHas(patterns[i])){f=i;break;}
      if(f>=0)setPattern(f);else if(!op.keep)toast('All 8 patterns hold music, so this lesson uses the current one. Nothing is deleted.',3200);}
    if(op.fill&&!patHas(patterns[curPat])){var kk=LH.pad('kick'),sn=LH.pad('snare'),hh=LH.pad('closed hat');if(hh<0)hh=LH.pad('hat');
      [[kk,[0,8]],[sn,[4,12]],[hh,[0,2,4,6,8,10,12,14]]].forEach(function(m){if(m[0]>=0)m[1].forEach(function(s){pads[m[0]].pat[s]=true;});});markDirty();paintSteps();renderPadDots();renderPatSegs();}}}
/* examples: the app's own voices */
function lnNotes(ti,list,bpm){if(!ensureAudio())return;var sd=60/(bpm||100)/4,t0=ctx.currentTime+0.08;list.forEach(function(n){playNote(ti,n[1],0.8,t0+n[0]*sd,sd*1.8);});}
function lnBeat(map,bpm,bars){if(!ensureAudio())return;var sd=60/(bpm||P.bpm.v)/4,t0=ctx.currentTime+0.08;for(var b=0;b<(bars||2);b++)map.forEach(function(m){if(m[0]<0||!pads[m[0]])return;m[1].forEach(function(s){trigPad(m[0],0.9,t0+(b*16+s)*sd);});});}
var KB='#kb .wk,#kb .bk';
/* step dependencies: need() says a step can be done; fix() makes it so (used when an earlier step was skipped). No fix → the step is skipped, never left impassable. */
function lnHasKit(){return LH.pad('kick')>=0&&LH.pad('snare')>=0;}
function lnFixKit(){if(!lnHasKit()){var b=$('#kitChips [data-kit="acoustic"]')||$('#kitChips button');if(b)b.click();}LNR['play/pads']();}
function lnSel(r){return function(){return lnHasKit()&&padSel===LH.pad(r);};}
function lnSelFix(r){return function(){lnFixKit();setTimeout(function(){var i=LH.pad(r);if(i>=0)selectPad(i);},250);};}
function lnSlOpen(){return !$('#slSheet').hidden;}
function lnSlFix(){if(slots.A&&slots.A.buf){showTab('t-cap');slOpen('A');}}
function lnDrumV(){return showTab.cur==='t-gar'&&GAR.inst==='drummer'&&GAR.view==='play';}
function lnDrumFix(){GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('drummer');}
function lnKit(){return {id:'kit',at:'play/pads',hl:['#kitChips'],say:'This part needs a kick and a snare, and your pads now hold your own sounds. Pick a kit here; Undo brings your sounds back.',pred:function(){return LH.pad('kick')>=0&&LH.pad('snare')>=0;}};}
var LNL={
u1l1:{id:'u1l1',u:'u1',t:'Catch a sound',min:3,flow:'Capture',badge:'First Echo',
  concept:'Every sound has a story. A tapped mug, a hum, a knock on the door: Ecou listens to one short sound, finds its note and puts it on the keys. No music words needed. If you can make a noise, you can make an instrument.',
  setup:[{op:'stop'},{op:'go',to:'home'}],
  made:'an instrument made from your own sound',win:'You turned a real sound into an instrument. It is saved under Sounds & ideas.',ch:'Catch a very different sound, like a breath or a hum, and compare the two.',
  steps:[{id:'find',say:'Look around. Pick something that makes a short, clear sound: a mug, a door, or your voice saying “ahh”.',cont:'I have one'},
   {id:'drop',at:'home',hl:['#echoBtn'],say:'Hold the big mic button, make your sound, then let go. Ecou keeps it.',base:function(){return {it:ECHO.item};},pred:function(B){return !ECHO.rec&&!!ECHO.item&&ECHO.item!==B.it;},
    hints:[[8,'If the phone asks for the microphone, tap Allow. Nothing leaves your phone.'],[18,'You can also tap once to start and tap again to stop.']]},
   {id:'hear',at:'home',hl:['#echoPlay'],need:function(){return !!ECHO.item;},say:'Hear it sing back? That tune is made from your sound. Tap Play it.',ex:function(){if(ECHO.item)echoSing(ECHO.item);},exL:'Hear it again',
    pred:function(){return showTab.cur==='t-pad'||(showTab.cur==='t-gar'&&GAR.inst==='keys'&&GAR.view==='play');}},
   {id:'keys',need:function(){return showTab.cur==='t-pad'||(showTab.cur==='t-gar'&&GAR.inst==='keys'&&GAR.view==='play');},
    fix:function(){if(ECHO.item){echoPlayIt(ECHO.item);return;}GAR.view='play';if(showTab.cur!=='t-gar')showTab('t-gar');garOpen('keys');},hl:function(){return LH.perc()?['#pads .pad.sel']:['#kb'];},say:function(){return LH.perc()?'Your sound is on this pad. Tap it five times, fast and slow.':'That is your sound on every key. Tap five keys, low and high.';},
    ev:{type:'pointerdown',sel:KB+',#pads .pad',n:5},hints:[[12,'Low keys on the left sound deep. High keys on the right sound bright.']]},
   {id:'tune',say:'Listen: a little tune played with what you just caught.',cont:'Done',exL:'Hear an idea',
    ex:function(){if(LH.perc())lnBeat([[padSel,[0,3,6,8,11,14]]],100,2);else lnNotes(ECHO.ti!=null?ECHO.ti:keysTi(),[[0,60],[2,64],[4,67],[6,72],[8,67],[10,64],[12,60]],100);}}]},
u1l2:{id:'u1l2',u:'u1',t:'Bend it',min:4,flow:'Transform',badge:'Shape Shifter',
  concept:'One recording can become many instruments. Granular chops your sound into tiny grains and scatters them, like light through frosted glass. There is no right setting: move a control, listen, keep what you like.',
  setup:[{op:'stop'},{op:'go',to:'sound/shape'},{op:'reveal',sel:'#granCard'},{op:'param',k:'gspray',v:0.1}],
  made:'a new instrument: your sound bent into grains',win:'You transformed a sound by ear. That is sound design.',ch:'Make your sound unrecognisable in three moves, then tap Sampler to compare.',
  steps:[{id:'before',at:'sound/shape',hl:['#kb'],say:'Tap a key and listen. This is your sound as you caught it.',ev:{type:'pointerdown',sel:KB,n:1}},
   {id:'engine',at:'sound/shape',hl:['[data-engine="granular"]'],say:'Tap Granular. Your sound is now cut into tiny grains.',pred:function(){return engine==='granular';}},
   {id:'size',at:'sound/shape',say:'Drag Grain size, then play a key. Stop when it sounds good to you.',base:function(){return {g:P.gsize.v};},pred:function(B){return Math.abs(P.gsize.v-B.g)/B.g>0.25;},
    hl:function(R){return R.pok?['#kb']:['[data-p="gsize"]'];},ev:{type:'pointerdown',sel:KB,n:1},after:'Now play a key to hear it.',
    hints:[[10,'Drag further. Left is smooth and glassy, right is choppy.']]},
   {id:'spray',at:'sound/shape',hl:['[data-p="gspray"]'],say:'Now push Spray past the middle. Hear the grains scatter into a cloud?',pred:function(){return P.gspray.v>=0.5;}},
   {id:'ab',at:'sound/shape',hl:function(R){return [R.seq?'[data-engine="granular"]':'[data-engine="sampler"]'];},say:'Tap Sampler to hear the original, then Granular again. Same recording, two instruments.',
    seq:[function(){return engine==='sampler';},function(){return engine==='granular';}]},
   {id:'jam',at:'sound/shape',hl:['#kb'],say:'Play a few keys with your new sound.',ev:{type:'pointerdown',sel:KB,n:4}}]},
u1l3:{id:'u1l3',u:'u1',t:'Make it groove',min:5,flow:'Play',badge:'First Loop',
  concept:'A loop is a short pattern that repeats. The row of 16 lights is one trip around the loop; a lit light means “play the sound here”. The numbered lights are the pulse you tap your foot to.',
  setup:[{op:'stop'},{op:'go',to:'play/pads'},{op:'freePattern'},{op:'param',k:'bpm',v:96},{op:'param',k:'swing',v:0},{op:'selectPad',pad:function(){return LH.freePad();}}],
  made:'a loop with your own sound and a kick on the beat',win:'Your first loop, built on a sound nobody else has.',ch:'Add Closed Hat on every second light, then take away one kick. Does it still feel good?',
  steps:[{id:'pad',at:'play/pads',hl:['#padRec'],say:'This pad is yours. Tap Record to pad, make a short sound (a knock, a clap, a “tss”), then tap Stop.',
    base:function(){return {i:padSel,buf:pads[padSel].buf};},pred:function(B){var p=pads[B.i];return !capture&&p.buf!==B.buf&&p.cls==='other';},hints:[[8,'Tap once to start, make the sound, tap again to stop. No mic? Skip step.']]},
   {id:'hit',at:'play/pads',hl:['#pads .pad.sel'],say:'Tap your pad three times and listen.',ev:{type:'pointerdown',sel:'#pads .pad.sel',n:3}},
   {id:'steps',at:'play/pads',hl:['#steps'],say:'Light up any three of these 16 lights. Each one plays your sound.',pred:function(){return LH.hits(padSel).length>=3;},exL:'Hear an idea',
    ex:function(){lnBeat([[LH.pad('kick'),[0,8]],[padSel,[4,10,12]]],96,2);},hints:[[12,'Tap a light once to turn it on, again to turn it off.']]},
   {id:'play',at:'play/pads',hl:['#seqPlay'],say:'Press Play. Your sound is now a rhythm.',pred:function(){return seq.on&&seq.mode==='pattern';}},
   lnKit(),
   {id:'kpad',at:'play/pads',need:lnHasKit,fix:lnFixKit,hl:function(){return ['#pads .pad[data-pad="'+LH.pad('kick')+'"]'];},say:'Keep it playing. Tap the Kick pad: the lights now show the kick.',pred:function(){return padSel===LH.pad('kick');}},
   {id:'kick',at:'play/pads',need:lnSel('kick'),fix:lnSelFix('kick'),hl:['#steps'],say:'Light number 1 and number 3. Boom on the beat.',pred:function(){return LH.on('kick',[0,8]);},hints:[[12,'The lights marked 1 and 3. If the wrong pad is lit, tap Kick first.']]},
   {id:'listen',say:'Let it go round twice. Move a light if you want a different feel.',hold:{pred:function(){return seq.on;},s:function(){return LH.bars(2);}},hints:[[2,'If it stopped, press Play again.']]}]},
u1l4:{id:'u1l4',u:'u1',t:'Beatbox flip',min:4,flow:'Capture → Transform',badge:'Beatbox Flip',
  concept:'Your mouth is a drum kit. Boom, tss, ka: beatbox a few seconds and the Smart Slicer cuts every hit into its own pad. One recording becomes an instrument you can drum on.',
  setup:[{op:'stop'},{op:'go',to:'sound/capture'}],
  made:'a drum kit cut from your own beatbox',win:'You flipped your voice into a drum kit.',ch:'Try the AI Beatbox card on Pads: it also writes the pattern for you.',
  steps:[{id:'rec',at:'sound/capture',hl:['[data-cap="A"]'],say:'Tap Record sample and beatbox for a few seconds: “boom, tss, ka, tss”. Tap Stop when you are done.',
    base:function(){return {buf:slots.A&&slots.A.buf};},pred:function(B){return !capture&&!!slots.A&&!!slots.A.buf&&slots.A.buf!==B.buf;},hints:[[10,'Tap the same button again to stop. It also stops by itself after 10 seconds.']]},
   {id:'slice',at:'sound/capture',need:function(){return !!(slots.A&&slots.A.buf);},hl:['[data-slice="A"]'],say:'Now tap Slice to pads. The Smart Slicer finds every hit.',pred:function(){return !$('#slSheet').hidden&&SL.from==='A';}},
   {id:'hear',need:lnSlOpen,fix:lnSlFix,hl:['#slChips'],say:'Each chip is one hit. Tap three of them to hear the pieces.',ev:{type:'click',sel:'#slChips [data-sli]',n:3}},
   {id:'send',need:lnSlOpen,fix:lnSlFix,hl:['#slSend'],say:'Tap Send to pads.',base:function(){return {b:pads.map(function(p){return p.buf;})};},
    pred:function(B){var n=0;pads.forEach(function(p,i){if(p.buf&&p.buf._slc&&p.buf!==B.b[i])n++;});return n>=2;},hints:[[6,'If it asks to replace pads, tap again to confirm. Undo brings the old pads back.']]},
   {id:'drum',at:'play/pads',need:function(){return $('#slSheet').hidden&&showTab.cur==='t-pad';},fix:function(){slClose();LNR['play/pads']();},hl:['#pads'],say:'Your beatbox is now a kit. Drum on the slice pads.',ev:{type:'pointerdown',sel:'#pads .pad',n:6}},
   {id:'idea',say:'Hear an idea: your own slices played as a groove. You can light them up in the steps any time.',cont:'Done',exL:'Hear an idea',
    ex:function(){var s=SL.start||0;lnBeat([[s,[0,8]],[s+1,[4,12]],[s+2,[2,6,10,14]]],96,2);}}]},
u2l1:{id:'u2l1',u:'u2',t:'Boom and tap',min:4,flow:'Play',badge:'Backbeat',
  concept:'Most songs you know stand on two sounds: a deep boom (the kick) and a sharp tap (the snare). Boom on 1 and 3, tap on 2 and 4. That is the backbeat, and your body already knows it.',
  setup:[{op:'stop'},{op:'go',to:'play/pads'},{op:'freePattern'},{op:'param',k:'swing',v:0},{op:'selectPad',pad:'kick'}],
  made:'a backbeat: boom on 1 and 3, tap on 2 and 4',win:'That is the backbeat: the heart of pop, rock and hip-hop.',ch:'Swap the snare for a pad you recorded yourself.',
  steps:[lnKit(),{id:'kpad',at:'play/pads',need:lnHasKit,fix:lnFixKit,hl:function(){return ['#pads .pad[data-pad="'+LH.pad('kick')+'"]'];},say:'Tap the Kick pad: the deep boom.',pred:function(){return padSel===LH.pad('kick');}},
   {id:'kick',at:'play/pads',need:lnSel('kick'),fix:lnSelFix('kick'),hl:['#steps'],say:'Now light number 1 and number 3.',pred:function(){return LH.on('kick',[0,8]);},hints:[[12,'If other lights show, tap the Kick pad first.']]},
   {id:'spad',at:'play/pads',need:lnHasKit,fix:lnFixKit,hl:function(){return ['#pads .pad[data-pad="'+LH.pad('snare')+'"]'];},say:'Now tap the Snare pad.',pred:function(){return padSel===LH.pad('snare');}},
   {id:'snare',at:'play/pads',need:lnSel('snare'),fix:lnSelFix('snare'),hl:['#steps'],say:'Light number 2 and number 4.',pred:function(){return LH.on('snare',[4,12]);}},
   {id:'play',at:'play/pads',hl:['#seqPlay'],say:'Press Play.',pred:function(){return seq.on;}},
   {id:'groove',say:'Boom, tap, boom, tap. Nod along while it goes round twice.',hold:{pred:function(){return seq.on;},s:function(){return LH.bars(2);}},exL:'Hear an idea',
    ex:function(){lnBeat([[LH.pad('kick'),[0,8,10]],[LH.pad('snare'),[4,12]]],P.bpm.v,1);}}]},
u2l2:{id:'u2l2',u:'u2',t:'Fast, slow, bouncy',min:3,flow:'Play',badge:'Groove Feel',
  concept:'Tempo is how fast the beat goes; Swing is how bouncy it feels. Slow feels heavy, fast feels urgent, swing makes it strut. Trust your ears: there are no wrong numbers.',
  setup:[{op:'stop'},{op:'go',to:'play/pads'},{op:'freePattern',keep:true,fill:true},{op:'param',k:'swing',v:0}],
  made:'the same beat with your own tempo and swing',win:'You changed the feel without changing a single note.',ch:'Walk around the room, then set the tempo to match your steps.',
  steps:[{id:'play',at:'play/pads',hl:['#seqPlay'],say:'Press Play to start the beat.',pred:function(){return seq.on;}},
   {id:'tempo',at:'play/pads',hl:['#t-pad [data-p="bpm"]'],say:'Drag Tempo until it feels like walking, or like running. Listen while you drag.',base:function(){return {b:P.bpm.v};},pred:function(B){return Math.abs(P.bpm.v-B.b)>=10;}},
   {id:'swing',at:'play/pads',hl:['#t-pad [data-p="swing"]'],say:'Now push Swing to the right. The in-between hits arrive late: bouncy.',pred:function(){return P.swing.v>=0.2;}},
   {id:'feel',say:'Tempo is speed, Swing is bounce. Keep a feel you like; it is saved with your project.',cont:'Done'}]},
u2l3:{id:'u2l3',u:'u2',t:'A drummer for you',min:4,flow:'Play',badge:'Bandleader',
  concept:'You do not have to place every hit. The Drummer plays a real-feeling part for you. Drag one dot: right plays busier, up plays harder. You stay the boss; it follows.',
  setup:[{op:'stop'},{op:'go',to:'play/sounds'}],
  made:'a drummer part, placed in your song',win:'You have a drummer that plays what you ask for.',ch:'Try three styles and keep the one that makes you move.',
  steps:[{id:'pick',at:'play/sounds',hl:['[data-gi="drummer"]'],say:'Tap Drummer.',pred:function(){return showTab.cur==='t-gar'&&GAR.inst==='drummer'&&GAR.view==='play';}},
   {id:'prev',need:lnDrumV,fix:lnDrumFix,hl:['#garDpv [data-pv="1"]'],say:'Tap Preview to hear your drummer.',pred:function(){return seq.on;}},
   {id:'dot',need:lnDrumV,fix:lnDrumFix,hl:['#garDxy'],say:'Drag the dot. Right plays busier, up plays harder. Changes come in on the next loop.',base:function(){return {x:GAR.drum.cx,y:GAR.drum.ly};},
    pred:function(B){return Math.abs(GAR.drum.cx-B.x)>0.15||Math.abs(GAR.drum.ly-B.y)>0.15;},hints:[[10,'Put your finger on the dot and slide it to another corner.']]},
   {id:'style',need:lnDrumV,fix:lnDrumFix,hl:['#garDst'],say:'Pick another style from this row and listen.',base:function(){return {s:GAR.drum.style};},pred:function(B){return GAR.drum.style!==B.s;}},
   {id:'add',need:lnDrumV,fix:lnDrumFix,hl:['#garDpv [data-pv="2"]'],say:'Like it? Tap Add to song to place this part in your song.',
    base:function(){return {c:daw.clips.slice()};},pred:function(B){return daw.clips.some(function(c){return c.ti===0&&c.type==='pat'&&B.c.indexOf(c)<0;});}},
   {id:'keep',say:'It is in your song now. Open Song any time to hear it, or come back and change the style.',cont:'Done'}]}};
var LNU=[['u1','Catch a sound','Capture → Transform → Play',['u1l1','u1l2','u1l3','u1l4']],['u2','Feel the beat','Play',['u2l1','u2l2','u2l3','u2l4','u2l5']],
  ['u3','Notes that belong together','Play → Create',['u3l1','u3l2','u3l3','u3l4','u3l5','u3l6']],['u4','From loop to song','Create',['u4l1','u4l2','u4l3','u4l4']],['u5','Record and mix','Produce',['u5l1','u5l2','u5l3','u5l4']],['u6','Finish and share','Share',['u6l1','u6l2','u6l3']]];
var LNS={u2l4:['Play it live','Record a pad performance into the grid.'],u2l5:['Three, not four','Feel a waltz with the Backing Band.'],u3l1:['Tunes that cannot go wrong','Keys mode: pads play only notes that fit.'],
  u3l2:['Colours of chords','Smart Keys: tap chord strips; colours show the role.'],u3l3:['Home, away, back','Play home, away and back again.'],u3l4:['The minor fall, the major lift','Go to the sad chord and back.'],
  u3l5:['A band behind you','The Backing Band follows your chords; change genre.'],u3l6:['Bass holds it together','Smart Bass under your chords.'],u4l1:['Two parts','Make pattern B different from A.'],u4l2:['Chain a song','Arrange A A B A.'],
  u4l3:['Verse and chorus','Band parts A and B with different energy.'],u4l4:['Loops you launch','Live Loops: record two cells, launch a column.'],u5l1:['Your voice on top','Record voice or guitar over the song.'],
  u5l2:['Loud and quiet','Balance track volumes.'],u5l3:['Left, right, far away','Pan and reverb.'],u5l4:['Punch-in FX','Hold a punch-in effect while it plays.'],u6l1:['Finish line','Export the song as audio.'],
  u6l2:['See your music','Turn a melody into sheet music or tabs.'],u6l3:['Tell its story','Name the song, note what you sampled, share.']};
var LNORD=['u1l1','u1l2','u1l3','u1l4','u2l1','u2l2','u2l3'];
function lnNextId(o){o=o||lnLoad();for(var i=0;i<LNORD.length;i++)if(!o.done[LNORD[i]])return LNORD[i];return null;}
/* engine */
function lnVis(s){try{var a=document.querySelectorAll(s);for(var i=0;i<a.length;i++){var r=a[i].getBoundingClientRect();if(r.width>0&&r.height>0)return a[i];}}catch(e){}return null;}
function lnHl(R,st){var h=typeof st.hl==='function'?st.hl(R):st.hl;return h||[];}
function lnTarget(R,st){var h=lnHl(R,st);for(var i=0;i<h.length;i++){var e=lnVis(h[i]);if(e)return e;}return null;}
function lnTry(f,B){try{return !!f(B);}catch(e){return false;}}
/* fixed bottom nav: the bubble and the spotlight stay above it (portrait and landscape) */
function lnNavTop(){var vh=window.innerHeight,n=LN.nav;if(!n||!n.isConnected){var x=document.querySelector('nav [data-nav]');n=LN.nav=x?x.closest('nav'):null;}
  if(!n)return vh;var r=n.getBoundingClientRect();return r.height>0&&r.top>vh*0.4&&r.top<vh?r.top:vh;}
/* a target inside a fixed overlay (sheet, dialog) sits above the nav, so the nav band does not apply to it */
function lnNT(e){var p=e;while(p&&p!==document.body){if(getComputedStyle(p).position==='fixed')return window.innerHeight;p=p.parentElement;}return lnNavTop();}
function lnSide(){return window.innerWidth>window.innerHeight&&window.innerWidth>=560;}
function lnPlace(){var R=LN.run;if(!R)return;var st=R.steps[R.i],hole=$('#lnHole'),bub=$('#lnBub'),bs=bub.style,e=R.fin?null:lnTarget(R,st),vh=window.innerHeight,vw=window.innerWidth,nt=e?lnNT(e):lnNavTop(),side=lnSide(),inV=false;
  bs.top='';bs.left='';bs.right='';bs.width='';bs.margin='';var nb=lnNavTop();bs.bottom=(vh-nb+8)+'px';bs.maxHeight=Math.max(120,nb-16)+'px';bs.overflowY='auto';bub.classList.remove('top');
  if(e){var r=e.getBoundingClientRect(),p=6;inV=r.bottom>4&&r.top<nt-4&&r.right>0&&r.left<vw;
    if(side){var w=Math.min(340,Math.round(vw*0.44));bs.width=w+'px';bs.margin='0';bs.top='8px';bs.bottom='auto';if(r.left+r.width/2<vw/2){bs.right='10px';bs.left='auto';}else{bs.left='10px';bs.right='auto';}}
    else{var bh=bub.offsetHeight||150,lowHit=r.bottom>nt-8-bh,topHit=r.top<8+bh;if(lowHit&&(!topHit||r.top+r.height/2>nt*0.5)){bs.bottom='auto';bub.classList.add('top');}}
    hole.hidden=!inV;var t=Math.max(r.top-p,0),btm=Math.min(r.bottom+p,nt);hole.style.left=(r.left-p)+'px';hole.style.top=t+'px';hole.style.width=(r.width+2*p)+'px';hole.style.height=Math.max(0,btm-t)+'px';
    /* covered target (B2): ask the browser what a tap at its centre would hit; if it is not the target, move it out from under the cover */
    if(inV&&!R.busy){var cx=Math.min(Math.max(r.left+r.width/2,1),vw-1),cy=Math.min(Math.max(r.top+r.height/2,1),nt-1),h=document.elementFromPoint(cx,cy);
      if(h&&h!==e&&!e.contains(h)&&!h.contains(e)&&(R.cov||0)<4){R.cov=(R.cov||0)+1;var hr=h.getBoundingClientRect(),sc=lnScroller(e),d=hr.top+hr.height/2>cy?(r.bottom-hr.top+12):-(hr.bottom-r.top+12);
        if(bub.contains(h)){lnScroll(true);}else{lnNudge(e,d);}R.covBy=(h.id||String(h.className||h.tagName)).slice(0,40);}}}
  else hole.hidden=true;
  R.vis=inV;$('#lnShow').hidden=inV||!!R.fin||!lnHl(R,st).length||!(st.at||e);}
/* scroll by d px using every scrollable ancestor in turn (sheet, page), so sticky bars and nested scrollers are handled */
function lnNudge(e,d){var p=e.parentElement;while(p&&p!==document.body&&p!==document.documentElement&&Math.abs(d)>=2){var cs=getComputedStyle(p);if(/(auto|scroll)/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+1){var b0=p.scrollTop;p.scrollTop+=d;d-=p.scrollTop-b0;}p=p.parentElement;}if(Math.abs(d)>=2){try{window.scrollBy(0,d);}catch(x){}}}
function lnScroller(e){var p=e.parentElement;while(p&&p!==document.body&&p!==document.documentElement){var cs=getComputedStyle(p);if(/(auto|scroll)/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+1)return p;p=p.parentElement;}return document.scrollingElement||document.documentElement;}
/* scroll the target into the free band (between the top and the bubble, above the bottom nav), then re-measure */
function lnScroll(inner){var R=LN.run;if(!R||R.fin)return;var e=lnTarget(R,R.steps[R.i]);if(!e)return;
  try{e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}catch(x){}
  var r=e.getBoundingClientRect(),nt=lnNT(e),bh=$('#lnBub').offsetHeight||150,side=lnSide(),lo=8,hi=side?nt-8:nt-bh-16;
  if(!side&&r.height>hi-lo){lo=bh+16;hi=nt-8;}
  if(r.top<lo||r.bottom>hi){var want=r.height>hi-lo?lo:(lo+hi)/2-r.height/2,d=r.top-want;lnNudge(e,d);}
  if(!inner)lnPlace();}
function lnSay(st){return typeof st.say==='function'?st.say():st.say;}
function lnRender(){var R=LN.run,st=R.steps[R.i];$('#lnBub').hidden=false;$('#lnBub').classList.remove('ok');$('#lnTtl').textContent=R.L.t+' · step '+(R.i+1)+' of '+R.steps.length;
  $('#lnSay').textContent=lnSay(st);$('#lnHint').hidden=true;$('#lnProg').textContent=st.ev&&!st.pred?'0 / '+st.ev.n:'';
  $('#lnDots').innerHTML=R.steps.map(function(s,k){return '<i class="'+(k<R.i?'d':k===R.i?'c':'')+'"></i>';}).join('');
  $('#lnEx').hidden=!st.ex;$('#lnEx').textContent=st.exL||'Hear an idea';$('#lnGo').hidden=!st.cont;$('#lnGo').textContent=st.cont||'Next';
  $('#lnSkip').hidden=!!st.cont;$('#lnSkip').textContent='Skip step';$('#lnX').textContent='Exit';lnPlace();}
function lnEvOff(){if(LN.ev){document.removeEventListener(LN.ev.type,LN.ev.fn,true);LN.ev=null;}}
function lnEvOn(ev,st){var R=LN.run;LN.ev={type:ev.type,fn:function(e){var t=e.target;if(LN.run!==R||R.busy||!t||!t.closest||t.closest('#lnBub'))return;if(!t.closest(ev.sel))return;
  if(st&&st.pred){if(!R.pok)return;R.cnt++;return;}R.cnt++;$('#lnProg').textContent=Math.min(R.cnt,ev.n)+' / '+ev.n;if(R.cnt>=ev.n)lnDone();}};document.addEventListener(ev.type,LN.ev.fn,true);}
function lnEnter(i,fx){var R=LN.run;if(!R)return;if(i>=R.steps.length){lnFinish();return;}
  var st=R.steps[i];
  /* B3: a step whose precondition is missing (an earlier step was skipped) gets a minimal make-it-so setup, or is skipped itself */
  if(st.need&&!lnTry(st.need,{})){if(st.fix&&!fx){R.busy=true;lnEvOff();try{st.fix();}catch(e){errLog.push('lesson fix: '+e.message);}setTimeout(function(){if(LN.run===R)lnEnter(i,1);},450);return;}lnEnter(i+1);return;}
  R.i=i;R.t0=R.tl=performance.now();R.cnt=0;R.seq=0;R.hold=0;R.hint=-1;R.busy=false;R.pok=false;R.cov=0;R.scN=0;R.scT=0;R.B=st.base?st.base():{};
  var o=lnLoad();o.cur={l:R.L.id,s:i};lnSave(o);lnEvOff();if(st.ev)lnEvOn(st.ev,st);lnRender();lnScroll();setTimeout(lnScroll,60);setTimeout(function(){if(LN.run===R&&R.i===i)lnScroll();},400);
  if(st.pred&&!st.base&&lnTry(st.pred,R.B))lnDone(true);}
function lnTick(){var R=LN.run;if(!R||R.fin)return;var st=R.steps[R.i],now=performance.now(),el=(now-R.t0)/1000,dt=(now-R.tl)/1000;R.tl=now;lnPlace();
  if(!R.vis&&!R.busy&&R.scN<3&&now-R.scT>700&&lnTarget(R,st)){R.scN++;R.scT=now;lnScroll();}
  if(st.hints){var h=-1;st.hints.forEach(function(x,k){if(el>=x[0])h=k;});if(h!==R.hint){R.hint=h;if(h>=0){$('#lnHint').hidden=false;$('#lnHint').textContent=st.hints[h][1];}}}
  if(R.busy)return;var ok=false;
  if(st.seq){if(lnTry(st.seq[R.seq],R.B)){R.seq++;if(R.seq<st.seq.length){$('#lnProg').textContent=R.seq+' / '+st.seq.length;lnPlace();}}ok=R.seq>=st.seq.length;}
  else if(st.hold){if(lnTry(st.hold.pred,R.B))R.hold+=dt;var need=st.hold.s();$('#lnProg').textContent=Math.min(100,Math.round(R.hold/need*100))+'%';ok=R.hold>=need;}
  else if(st.pred){var pk=lnTry(st.pred,R.B);if(st.ev){if(pk&&!R.pok){R.pok=true;$('#lnProg').textContent=st.after||'';lnScroll();}ok=pk&&R.cnt>=st.ev.n;}else ok=pk;}
  if(ok)lnDone();}
function lnDone(already){var R=LN.run;if(!R||R.busy)return;var st=R.steps[R.i];R.busy=true;lnEvOff();if(!st.cont)lnMade();
  $('#lnBub').classList.add('ok');$('#lnProg').textContent=already?'Already done ✓':'Nice ✓';try{if(!st.cont&&navigator.vibrate)navigator.vibrate(12);}catch(e){}
  var i=R.i;setTimeout(function(){if(LN.run===R&&R.i===i)lnEnter(i+1);},st.cont?0:already?500:750);}
function lnOn(){if(LN.on)return;LN.on=true;LN.iv=setInterval(lnTick,200);document.addEventListener('scroll',lnPlace,true);window.addEventListener('resize',lnPlace);document.body.classList.add('ln-on');lnQSync();}
function lnOff(){if(!LN.on)return;LN.on=false;clearInterval(LN.iv);LN.iv=0;document.removeEventListener('scroll',lnPlace,true);window.removeEventListener('resize',lnPlace);document.body.classList.remove('ln-on');$('#lnHole').hidden=true;}
function lnStart(id,si,resume){var L=LNL[id];if(!L)return;lnStop(true);lnMapClose();if(!ctx)ensureAudio();
  (L.setup||[]).forEach(function(op){try{lnOp(op,resume);}catch(e){errLog.push('lesson op: '+e.message);}});
  LN.run={L:L,steps:[{id:'concept',say:L.concept,cont:resume?'Continue':'Start'}].concat(L.steps),i:0};lnOn();
  if(resume){si=Math.min(si||0,LN.run.steps.length-1);for(var k=1;k<si;k++){var ps=LN.run.steps[k];if(ps.pred&&!ps.base&&!lnTry(ps.pred,{})){si=k;break;}}}
  lnEnter(resume?si:0);}
function lnStop(keep){var R=LN.run;lnEvOff();lnOff();LN.run=null;$('#lnBub').hidden=true;$$('.ln-rev').forEach(function(e){e.classList.remove('ln-rev');});
  if(!keep&&R){var o=lnLoad();o.cur=null;lnSave(o);}lnQSync();if(showTab.cur==='t-home')lnCardUI();}
function lnFinish(){var R=LN.run,L=R.L,o=lnLoad(),n=(o.reps[L.id]||0)+1;lnEvOff();lnOff();R.fin=true;
  o.done[L.id]=o.done[L.id]||Date.now();o.reps[L.id]=n;o.rev[L.id]=Date.now()+[1,4,10,30][Math.min(n-1,3)]*864e5;o.cur=null;lnSave(o);lnMade();
  var nx=lnNextId();$('#lnBub').hidden=false;$('#lnBub').classList.add('ok');$('#lnBub').classList.remove('top');$('#lnTtl').textContent=L.t+' · done · '+L.badge;
  $('#lnSay').textContent='Done! What you made: '+(L.made||L.win)+'.';$('#lnHint').hidden=false;$('#lnHint').textContent=L.win+' Try next: '+L.ch;$('#lnProg').textContent='';$('#lnDots').innerHTML='';
  $('#lnEx').hidden=true;$('#lnShow').hidden=true;$('#lnSkip').hidden=false;$('#lnSkip').textContent='Back to map';$('#lnGo').hidden=!nx;$('#lnGo').textContent='Next lesson';if(nx)$('#lnGo').setAttribute('aria-label','Next lesson: '+LNL[nx].t);$('#lnX').textContent='Close';
  lnPlace();lnQSync();
  try{if(navigator.vibrate)navigator.vibrate([12,40,24]);}catch(e){}}
/* entry points: Home card, course map, "?" in the sub-header */
function lnCardUI(){var s=$('#lnCardS');if(!s||!LNORD)return;var o=lnLoad(),d=LNORD.filter(function(k){return o.done[k];}).length,nx=lnNextId(o),st=lnStreak(o);
  if(o.cur&&LNL[o.cur.l]){s.textContent='Resume: '+LNL[o.cur.l].t+' · step '+(o.cur.s+1)+(d?' · '+d+' of '+LNORD.length+' done':'');return;}s.textContent=d?(nx?'Next: '+LNL[nx].t+' · '+d+' of '+LNORD.length+' done':'All '+LNORD.length+' lessons done')+(st?' · '+st+'-day streak':''):'3–5 min lessons · start with your first sound';}
function lnMapOpen(){var o=lnLoad(),nx=lnNextId(o),now=Date.now(),st=lnStreak(o),cur=o.cur&&LNL[o.cur.l]?o.cur.l:null;
  $('#lnMapS').textContent=LNORD.filter(function(k){return o.done[k];}).length+' of '+LNORD.length+' lessons done'+(st?' · '+st+'-day streak':'')+' · each takes 3–5 minutes';
  $('#lnUnits').innerHTML=LNU.map(function(u,ui){return '<section class="ln-u"><h4>Unit '+(ui+1)+' · '+u[1]+'</h4><span class="mu">'+u[2]+'</span><div class="ln-ls">'+u[3].map(function(k,li){var L=LNL[k];
      if(!L){var s=LNS[k]||[k,''];return '<div class="ln-l soon"><span class="n">'+(li+1)+'</span><span class="tx"><b>'+s[0]+'</b><small>Coming soon · '+s[1]+'</small></span></div>';}
      var dn=!!o.done[k],due=dn&&o.rev[k]&&o.rev[k]<=now,cl=dn?'done':k===(cur||nx)?'next':'',lab=k===cur?'Resume':dn?(due?'Review':'Done ✓'):k===nx?'Next':'';
      return '<button class="ln-l '+cl+'" data-ln="'+k+'" aria-label="Lesson '+(li+1)+': '+L.t+'. '+(lab||'Not started')+'"><span class="n">'+(dn?'✓':li+1)+'</span><span class="tx"><b>'+L.t+'</b><small>'+L.min+' min · '+L.flow+'</small></span><span class="st">'+lab+'</span></button>';}).join('')+'</div></section>';}).join('');
  $$('#lnUnits [data-ln]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-ln'),c=lnLoad().cur;if(c&&c.l===k)lnStart(k,c.s,true);else lnStart(k);});});
  $('#lnMap').hidden=false;document.addEventListener('keydown',lnEsc);var n=$('#lnUnits .ln-l.next');if(n)setTimeout(function(){try{n.scrollIntoView({block:'nearest'});}catch(e){}},30);}
function lnEsc(e){if(e.key==='Escape')lnMapClose();}
function lnMapClose(){var m=$('#lnMap');if(m)m.hidden=true;document.removeEventListener('keydown',lnEsc);}
var LNQ={'t-cap':['u1l4'],'t-ins':['u1l2'],'t-pad':['u1l3','u2l1','u2l2'],'t-gar':['u2l3']};
function lnQSync(){var q=$('#lnQ');if(!q||!LNQ)return;var c=showTab.cur,L=LNQ[c];if(c==='t-gar'&&GAR.view!=='sounds'&&GAR.inst!=='drummer')L=null;
  var o=lnLoad(),k=L?(L.filter(function(x){return !o.done[x];})[0]||L[0]):null,on=!!k&&(!LN.run||!!LN.run.fin)&&!$('#subnav').hidden;q.hidden=!on;document.body.classList.toggle('ln-qon',on);
  if(k){q.setAttribute('data-ln',k);q.setAttribute('aria-label','Lesson: '+LNL[k].t);q.title='Lesson: '+LNL[k].t;}}
function initLearn(){
  $('#lnCard').addEventListener('click',lnMapOpen);$('#lnMapX').addEventListener('click',lnMapClose);$('#lnMap').addEventListener('click',function(e){if(e.target.getAttribute('data-lnclose'))lnMapClose();});
  $('#lnQ').addEventListener('click',function(){var k=this.getAttribute('data-ln');if(k)lnStart(k);});
  $('#lnX').addEventListener('click',function(){lnStop(true);});/* Exit keeps progress, exactly like a reload: the map offers Resume */
  $('#lnSkip').addEventListener('click',function(){var R=LN.run;if(!R)return;if(R.fin){lnStop(true);lnMapOpen();return;}if(!R.busy)lnEnter(R.i+1);});
  $('#lnGo').addEventListener('click',function(){var R=LN.run;if(!R)return;if(R.fin){var nx=lnNextId();lnStop(true);if(nx)lnStart(nx);return;}lnDone();});
  $('#lnEx').addEventListener('click',function(){var R=LN.run;if(R&&R.steps[R.i].ex){try{R.steps[R.i].ex();}catch(e){}}});
  $('#lnShow').addEventListener('click',function(){var R=LN.run;if(!R)return;var st=R.steps[R.i];if(st.need&&!lnTry(st.need,{})&&st.fix){try{st.fix();}catch(e){}}else if(st.at&&LNR[st.at])LNR[st.at]();R.scN=0;R.cov=0;setTimeout(lnScroll,80);setTimeout(lnScroll,400);});
  var c=lnLoad().cur;if(c&&LNL[c.l]){var go=function(){setTimeout(function(){if(!LN.run)lnStart(c.l,c.s,true);},450);};['#startBtn','#startFresh'].forEach(function(s){var b=$(s);if(b)b.addEventListener('click',go,{once:true});});}
  lnCardUI();lnQSync();}
