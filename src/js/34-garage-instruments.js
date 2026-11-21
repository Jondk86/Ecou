var GAR={view:'sounds',surf:false,inst:null,ti:1,key:0,minor:false,chords:null,ap:{keys:0,gtr:0,bass:0},apOn:-1,
  drum:{style:'pop',cx:0.4,ly:0.65,fills:0.4,swing:0,cym:true,perc:false,seed:1,bars:4,pat:-1},
  smart:{pieces:{kick:{x:0.3,y:0.7},snare:{x:0.2,y:0.65},hat:{x:0.45,y:0.5}},sel:'kick',bars:2,pat:-1},
  ll:{act:{},q:{},rec:null,perf:null,edit:false,sel:null},
  ui:{}};
var GCOL=['#D4FF3A','#5CE1E6','#FF8A5B','#B69CFF','#FFD25C','#7CF2A6','#FF7AB6','#8FB3FF'];
var GNOTE=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
var GCHQ={maj:{n:'',iv:[0,4,7]},min:{n:'m',iv:[0,3,7]},'7':{n:'7',iv:[0,4,7,10]},maj7:{n:'maj7',iv:[0,4,7,11]},m7:{n:'m7',iv:[0,3,7,10]},sus2:{n:'sus2',iv:[0,2,7]},sus4:{n:'sus4',iv:[0,5,7]},dim:{n:'°',iv:[0,3,6]},add9:{n:'add9',iv:[0,4,7,14]}};
var GINST={
  keys:{name:'Keyboard',sub:'Piano keys with any sound',track:'keys'},
  skeys:{name:'Smart Keys',sub:'Chords and accompaniment',track:'keys'},
  gtr:{name:'Smart Guitar',sub:'Strum or pick chords',track:'gtr'},
  bass:{name:'Smart Bass',sub:'Bass lines that fit your chords',track:'bass'},
  kit:{name:'Drum Kit',sub:'Finger-drum on pads',track:'drums'},
  sdrums:{name:'Smart Drums',sub:'Build a beat by placing drums',track:'drums'},
  drummer:{name:'Drummer',sub:'A drummer that plays for you',track:'drums'},
  band:{name:'Backing Band',sub:'Drums, bass and keys follow your chords',track:'drums'},
  vocal:{name:'Vocals',sub:'Sing with auto-tune and harmonies',track:'audio'},audio:{name:'Audio Recorder',sub:'Voice or any real instrument',track:'audio'},
  sampler:{name:'Sampler',sub:'Turn a sound into an instrument',go:'t-cap'},
  loops:{name:'Live Loops',sub:'Launch loops in a grid',view:'loops'},
  score:{name:'Audio to Sheet Music',sub:'Turn a recording into notes',go:'t-song'}
};
var GICON={band:'<circle cx="7" cy="15" r="3"/><path d="M10 15V5l9-2v10"/><circle cx="16" cy="13" r="3"/>',keys:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v9M12 5v9M16 5v9"/>',skeys:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
  gtr:'<path d="M14 4l6 6M17 7l-6 6"/><circle cx="8" cy="16" r="4.5"/>',bass:'<path d="M15 3l6 6M18 6l-8 8"/><circle cx="7.5" cy="16.5" r="4"/><path d="M5 18l3-3"/>',
  kit:'<ellipse cx="12" cy="10" rx="8" ry="3"/><path d="M4 10v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',sdrums:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="15" r="1.6"/><circle cx="15" cy="9" r="1.6"/><circle cx="12" cy="13" r="1.6"/>',
  drummer:'<circle cx="12" cy="7" r="3"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/><path d="M3 12l5 2M21 12l-5 2"/>',vocal:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M3 5l2 2M21 5l-2 2"/>',audio:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
  sampler:'<path d="M2 12c2-4 4-6 6-6s4 12 8 12 4-6 6-6"/>',score:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',loops:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'};
function garIcon(k,c){return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+GICON[k]+'</svg>';}
function garCol(ti){return GCOL[ti%GCOL.length];}

/* ---------- key, chords, voicings ---------- */
function garDefChords(){var k=GAR.key,D=GAR.minor?[[0,'min'],[3,'maj'],[5,'min'],[7,'min'],[7,'7'],[8,'maj'],[10,'maj'],[2,'dim']]:[[0,'maj'],[2,'min'],[4,'min'],[5,'maj'],[7,'maj'],[9,'min'],[10,'maj'],[7,'7']];
  return D.map(function(d){return [(k+d[0])%12,d[1]];});}
function garChords(){return GAR.chords||garDefChords();}
function garChName(c){return GNOTE[c[0]].replace('♯','#')+GCHQ[c[1]].n;}
function garTones(c){return GCHQ[c[1]].iv;}
function garKeysVoice(c,inv){var r=c[0],iv=garTones(c).filter(function(x){return x<12;}),base=60+((r+12-0)%12);if(base>66)base-=12;
  var n=iv.map(function(x){return base+x;});for(var i=0;i<inv;i++){var lo=n.shift();n.push(lo+12);}
  while(n[0]>62)n=n.map(function(x){return x-12;});if(garTones(c).indexOf(14)>=0)n.push(base+14);return n;}
function garBassRoot(c,lo){var r=c[0],b=lo+((r-lo%12+12)%12);return b;}
function garThird(c){var iv=garTones(c);return iv[1];}
function garGtrVoice(c){var R=garBassRoot(c,40),iv=garTones(c),t3=iv[1],f5=iv[2],top=iv.length>3?(iv[3]===14?12+2:iv[3]):12;
  var n=[R,R+f5,R+12,R+12+t3,R+12+f5,R+12+top];if(n[5]<=n[4])n[5]+=12;return n;}
function garBassNotes(c){var R=garBassRoot(c,28);return [R,R+garThird(c),R+garTones(c)[2],R+12];}
/* segments per instrument, top to bottom: each → list of MIDI notes */
function garSegs(inst,c){
  if(inst==='gtr'){var v=garGtrVoice(c);return [[v[5]],[v[4]],[v[3]],[v[2]],[v[1]],[v[0]]];}
  if(inst==='bass'){var b=garBassNotes(c);return [[b[3]],[b[2]],[b[1]],[b[0]]];}
  var R=garBassRoot(c,36);return [garKeysVoice(c,2).map(function(x){return x+12;}),garKeysVoice(c,1),garKeysVoice(c,0),[R,R+7],[R]];
}

/* ---------- autoplay patterns (1 bar of 16ths): [step,len,what,vel] ---------- */
var GAP={
  keys:[{n:'Sustain',e:[[0,16,'B',.8],[0,16,'C',.65]]},
    {n:'Quarters',e:[[0,3,'C',.8],[4,3,'C',.6],[8,3,'C',.75],[12,3,'C',.6],[0,8,'B',.8],[8,8,'B',.75]]},
    {n:'Skank',e:[[2,1,'H',.85],[6,1,'H',.7],[10,1,'H',.85],[14,1,'H',.7],[0,6,'B',.8],[8,6,'B5',.7]]},
    {n:'Arpeggio',e:[[0,2,'A0',.8],[2,2,'A1',.6],[4,2,'A2',.7],[6,2,'A3',.6],[8,2,'A2',.75],[10,2,'A1',.6],[12,2,'A2',.7],[14,2,'A3',.6],[0,8,'B',.75],[8,8,'B',.7]]}],
  gtr:[{n:'Strum',e:[[0,16,'S',.85]]},
    {n:'Pop strum',e:[[0,4,'S',.9],[6,2,'S',.65],[8,2,'U',.6],[10,2,'U',.55],[12,2,'S',.75],[14,2,'U',.6]]},
    {n:'Skank',e:[[4,1,'T',.85],[12,1,'T',.85]]},
    {n:'Fingerpick',e:[[0,2,'G0',.8],[2,2,'G3',.6],[4,2,'G2',.65],[6,2,'G4',.6],[8,2,'G1',.75],[10,2,'G3',.6],[12,2,'G2',.65],[14,2,'G5',.55]]}],
  bass:[{n:'Roots',e:[[0,7,'B',.9],[8,7,'B',.85]]},
    {n:'Eighths',e:[[0,2,'B',.9],[2,2,'B',.7],[4,2,'B',.8],[6,2,'B',.7],[8,2,'B',.85],[10,2,'B',.7],[12,2,'B',.8],[14,2,'B5',.7]]},
    {n:'Walk',e:[[0,3,'B',.9],[4,3,'B3',.75],[8,3,'B5',.8],[12,3,'B8',.75]]},
    {n:'One drop',e:[[2,3,'B',.9],[6,2,'B',.75],[8,3,'B5',.85],[12,2,'B8',.7],[14,2,'B5',.7]]}]
};
function garApKind(){return GAR.inst==='gtr'?'gtr':GAR.inst==='bass'?'bass':'keys';}
function garRealize(what,c){
  if(GAR.inst==='gtr'){var v=garGtrVoice(c);if(what==='S'||what==='U')return {n:what==='U'?v.slice(2).reverse():v,strum:0.012};if(what==='T')return {n:v.slice(3),strum:0.006};if(what[0]==='G')return {n:[v[+what[1]]]};return {n:[]};}
  if(GAR.inst==='bass'){var b=garBassNotes(c);return {n:[what==='B'?b[0]:what==='B3'?b[1]:what==='B5'?b[2]:b[3]]};}
  var R=garBassRoot(c,36),vo=garKeysVoice(c,0);
  if(what==='C')return {n:vo};if(what==='H')return {n:garKeysVoice(c,1).map(function(x){return x+12;})};if(what==='B')return {n:[R]};if(what==='B5')return {n:[R+7]};
  if(what[0]==='A'){var i=+what[1],a=vo.concat([vo[0]+12]);return {n:[a[i%a.length]]};}return {n:[]};
}

/* ---------- clock shared with the transport ---------- */
function garClock(){
  var sd=stepDur();
  if(seq.on&&seq.mode==='arrange')return {id:'a'+arr.anchors.length+':'+arr.tl0,pos:function(T){var a=arr.anchors,k=a.length-1;while(k>0&&a[k].t>T)k--;return a[k].g+(T-a[k].t)/sd;},time:function(g){var a=arr.anchors[arr.anchors.length-1];return a.t+(g-a.g)*sd;}};
  if(seq.on)return {id:'s'+seq.audStart,pos:function(T){return (T-seq.audStart)/sd;},time:function(g){return seq.audStart+g*sd;}};
  if(GAR.free==null)GAR.free=ctx.currentTime+0.05;
  return {id:'f'+GAR.free,pos:function(T){return (T-GAR.free)/sd;},time:function(g){return GAR.free+g*sd;}};
}
/* record a scheduled (on-grid) note into whatever is recording: timeline (arrange) or a Live Loops cell */
function garRecNote(ti,m,v,t,lenSteps){
  if(!seq.on||!seq.rec)return;var ck=garClock(),pos=ck.pos(t),tg=null;
  if(seq.mode==='arrange')tg=jamTarget(ti,pos);else if(seq.mode==='loops')tg=llRecAt(ti,pos);
  if(!tg)return;var pt=patterns[tg.p];noteArr(pt,ti).push({s:Math.round(tg.s)%pt.len,l:lenSteps,m:m,v:Math.round(v*100)/100});markDirty();
}
var garApT=null;
function garApStart(ci){GAR.apOn=ci;try{harmFromChord(garChords()[ci]);}catch(e){}GAR.apNext=null;GAR.apId=null;if(!seq.on)GAR.free=null;if(!garApT)garApT=setInterval(garApTick,25);garApTick();garPaintStrips();}
function garApStop(){GAR.apOn=-1;clearInterval(garApT);garApT=null;garPaintStrips();}
function garApTick(){
  if(!ctx||GAR.apOn<0)return;var ck=garClock(),now=ctx.currentTime,sd=stepDur();
  if(ck.id!==GAR.apId){GAR.apId=ck.id;GAR.apNext=null;}
  var P0=GAP[garApKind()][GAR.ap[garApKind()]-1];if(!P0){garApStop();return;}
  for(var guard=0;guard<64;guard++){
    var g=GAR.apNext!=null?GAR.apNext:Math.ceil(ck.pos(now+0.03)-1e-6),t=ck.time(g);
    if(t>now+0.12)break;GAR.apNext=g+1;if(t<now-0.005)continue;
    if(seq.on&&seq.mode==='arrange'&&g<arr.startG)continue;
    var s=((g%16)+16)%16,c=garChords()[GAR.apOn];
    P0.e.forEach(function(ev){if(ev[0]!==s)return;var R=garRealize(ev[2],c),vel=ev[3]*(0.92+Math.random()*0.08);
      R.n.forEach(function(m,j){var tt=t+(R.strum||0)*j,du=Math.max(0.05,ev[1]*sd*0.95);playNote(GAR.ti,m,vel*(R.strum?1-j*0.03:1),tt,du);garRecNote(GAR.ti,m,vel,t,ev[1]);});
      garFlashSeg(GAR.apOn);});
  }
}

/* ---------- drum generators (Smart Drums + Drummer) ---------- */
var GDL={ // level ladders, 16 steps, x=accent o=normal g=ghost r=ratchet
  kick:['x.......x.......','x.......x.x.....','x..x....x.x.....','x..x..x.x.x..x.o'],
  snare:['....x.......x...','....x.......x..g','....x..g....x.g.','.g..x.gg.g..x.gg'],
  clap:['....x.......x...','....x.......x...','....x.......x..o','....x..o....x.o.'],
  rim:['........x.......','....x.......x...','..o.x..o..o.x...','.ox.x.oo.ox.x.oo'],
  hat:['x...x...x...x...','x.o.x.o.x.o.x.o.','xgogxgogxgogxgog','xooooooxoooooooo'],
  ohat:['..............x.','......x.......x.','..x...x...x...x.','..x.x.x...x.x.x.'],
  shaker:['..x...x...x...x.','x.o.x.o.x.o.x.o.','xgogxgogxgogxgog','xgggogggxgggoggg'],
  cowbell:['x.......x.......','x...x...x...x...','x..o..x...x.o...','x.oo.x.ox.o.x.oo'],
  toms:['............o.o.','..........o.o.oo','....o.....o.o.oo','o..o..o...ooo.oo'],
  crash:['x...............','x...............','x.......x.......','x...x...x...x...'],
  ride:['x...x...x...x...','x.ox.ox.x.ox.ox.','x.o.x.oxx.o.x.ox','xgoxxgoxxgoxxgox']
};
var GSTY={
  pop:{n:'Pop',kick:GDL.kick,snare:['....x.......x...','....x.......x...','....x..g....x...','.g..x..g.g..x.g.'],sn:'snare',cym:GDL.hat,cy:'hat',oh:true,perc:GDL.shaker,pc:'shaker'},
  rock:{n:'Rock',kick:['x.......x.......','x.......xx......','x.x.....x.x.....','x.xx..x.x.x..x..'],snare:['....x.......x...','....x.......x...','....x.......x..o','....x..o....x.oo'],sn:'snare',cym:['x.o.x.o.x.o.x.o.','x.o.x.o.x.o.x.o.','x.x.x.x.x.x.x.x.','xoxoxoxoxoxoxoxo'],cy:'hat',ride:true,perc:GDL.cowbell,pc:'cowbell'},
  hiphop:{n:'Hip-hop',kick:['x.........x.....','x......x..x.....','x..x...x..x..x..','x..x..xx..x.x..o'],snare:['....x.......x...','....x.......x...','....x..g....x...','....x..g.g..x.g.'],sn:'snare',cym:['x.x.x.x.x.x.x.x.','x.o.x.o.x.o.x.o.','x.ogx.o.x.ogx.o.','xgogxgogxgogxgog'],cy:'hat',swing:0.35,perc:GDL.shaker,pc:'shaker'},
  onedrop:{n:'One drop',kick:['........x.......','........x.......','........x.....o.','........x..o..o.'],snare:['........x.......','........x.......','........x...o...','..o.....x...o.o.'],sn:'rim',cym:['..x...x...x...x.','..x...x...x...x.','.gx..gx..gx..gx.','ogxoogxoogxoogxo'],cy:'hat',swing:0.15,perc:GDL.shaker,pc:'shaker'},
  steppers:{n:'Steppers',kick:['x...x...x...x...','x...x...x...x...','x...x...x...x.o.','x...x..ox...x.o.'],snare:['........x.......','........x.......','....o...x.......','..o.o...x...o.o.'],sn:'rim',cym:['..x...x...x...x.','..x...x...x...x.','.ox.oox..ox.oox.','ooxooox.ooxooox.'],cy:'hat',perc:GDL.shaker,pc:'shaker'},
  house:{n:'House',kick:['x...x...x...x...','x...x...x...x...','x...x...x...x..o','x...x...x..ox...'],snare:['....x.......x...','....x.......x...','....x.......x..o','....x..o....x.o.'],sn:'clap',cym:['..x...x...x...x.','..x...x...x...x.','o.x.o.x.o.x.o.x.','ooxoooxoooxoooxo'],cy:'hat',oh:true,perc:GDL.shaker,pc:'shaker'},
  funk:{n:'Funk',kick:['x.........x.....','x..x......x..x..','x..x..x...x.x...','x.xx..x..xx..x..'],snare:['....x.......x...','....x..g....x...','.g..x..g.g..x.g.','.g.gx.gg.g.gx.gg'],sn:'snare',cym:['x.x.x.x.x.x.x.x.','xoxoxoxoxoxoxoxo','xgogxgogxgogxgog','xgogxgogxgogxgox'],cy:'hat',swing:0.2,perc:GDL.cowbell,pc:'cowbell'},
  trap:{n:'Trap',kick:['x.........x.....','x......x..x.....','x..x...x.xx.....','x..x...x.xx..x.x'],snare:['........x.......','........x.......','........x......g','........x..g...g'],sn:'clap',cym:['x.x.x.x.x.x.x.x.','x.x.x.xrx.x.x.x.','xoxoxoxrxoxoxrxr','xrxoxrxrxoxrxrrr'],cy:'hat',perc:GDL.shaker,pc:'shaker'}
};
function garRng(seed){var s=(seed*2654435761)>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function garLadder(L,c){return L[clamp(Math.round(c*(L.length-1)),0,L.length-1)];}
/* write one ladder line into an out map: out[pad][step]={v,r} */
function garLine(out,pad,line,bar,loud,rnd,vary){if(pad<0)return;out[pad]=out[pad]||{};
  for(var s=0;s<16;s++){var ch=line[s];if(ch==='.')continue;if(vary&&ch==='g'&&rnd()<vary)continue;var v=ch==='x'?1:ch==='o'?0.78:ch==='r'?0.75:0.38;v*=0.35+0.65*loud;v*=0.94+rnd()*0.06;out[pad][bar*16+s]={v:Math.round(clamp(v,0.05,1)*100)/100,r:ch==='r'?(rnd()<0.5?2:3):1};}}
function garFill(out,len,amt,loud,rnd){
  if(amt<0.05)return;var n=amt<0.35?4:amt<0.7?8:12,s0=len-n,T=[garPad('tomhi'),garPad('tommid'),garPad('tomlo')].filter(function(x){return x>=0;}),sn=garPad('snare'),k=garPad('kick');
  Object.keys(out).forEach(function(p){if(+p===k)return;for(var s=s0;s<len;s++)delete out[p][s];});
  for(var s=s0;s<len;s++){var f=(s-s0)/n,step=s-s0;if(amt<0.6&&step%2===1&&rnd()<0.6)continue;var pad=f<0.34||!T.length?sn:T[Math.min(T.length-1,Math.floor((f-0.34)/0.66*T.length))];
    if(pad<0)continue;out[pad]=out[pad]||{};out[pad][s]={v:Math.round(clamp((0.55+0.45*f)*(0.4+0.6*loud),0.1,1)*100)/100,r:amt>0.85&&step===n-2?2:1};}
}
function garGenDrummer(len){var D=GAR.drum,S=GSTY[D.style]||GSTY.pop,rnd=garRng(D.seed*97+len),out={},bars=len/16;
  for(var b=0;b<bars;b++){var c=clamp(D.cx+(b%2?0.08:0)-(b===0?0.05:0),0,1),vary=0.25+0.5*rnd();
    garLine(out,garPad('kick'),garLadder(S.kick,c),b,D.ly,rnd,vary);
    garLine(out,garPad(S.sn),garLadder(S.snare,c),b,D.ly,rnd,vary);
    if(D.cym){var cy=S.ride&&c>0.75?garPad('ride'):garPad(S.cy);garLine(out,cy<0?garPad('hat'):cy,garLadder(S.cym,c),b,D.ly*0.85,rnd,vary);
      if(S.oh&&c>0.45)garLine(out,garPad('ohat'),garLadder(GDL.ohat,c-0.4),b,D.ly*0.7,rnd,0);}
    if(D.perc)garLine(out,garPad(S.pc),garLadder(S.perc,c),b,D.ly*0.75,rnd,vary);}
  if(len>=32||D.fills>0.6)garFill(out,len,D.fills,D.ly,rnd);
  if(D.cym&&D.fills>0.3){var cr=garPad('crash');if(cr>=0){out[cr]=out[cr]||{};out[cr][0]={v:Math.round((0.5+0.5*D.ly)*100)/100,r:1};}}
  return out;}
function garGenSmart(len){var S=GAR.smart,out={},rnd=garRng(7+len);
  Object.keys(S.pieces).forEach(function(k){var p=S.pieces[k],L=GDL[k==='hat'?'hat':k];if(!L)return;var pad=k==='toms'?-1:garPad(k);
    for(var b=0;b<len/16;b++){var c=clamp(p.x+(b%2?0.07:0),0,1);
      if(k==='toms'){var T=[garPad('tomhi'),garPad('tommid'),garPad('tomlo')];var ln=garLadder(L,c);for(var s=0;s<16;s++)if(ln[s]!=='.'){var tp=T[(s+b)%3];if(tp>=0){out[tp]=out[tp]||{};out[tp][b*16+s]={v:Math.round(clamp((ln[s]==='x'?1:0.75)*(0.35+0.65*p.y),0.05,1)*100)/100,r:1};}}}
      else garLine(out,pad,garLadder(L,c),b,p.y,rnd,0.3);}});
  return out;}
function garTargetPat(o){if(o.pat>=0&&patterns[o.pat])return o.pat;return curPat;}
function garWriteDrums(pi,out,len){var pt=patterns[pi];if(!pt)return;if(!pt.notes.some(function(n){return n.length;})||pt.len<len)pt.len=len;
  pt.locks=pt.locks||{};var used={};Object.keys(out).forEach(function(p){used[p]=1;});
  for(var i=0;i<pt.drums.length;i++){for(var s=0;s<64;s++){pt.drums[i][s]=false;delete pt.locks[i+':'+s];}}
  Object.keys(out).forEach(function(p){Object.keys(out[p]).forEach(function(s){var e=out[p][s];s=+s;if(s>=pt.len)return;pt.drums[+p][s]=e.v;if(e.r>1)pt.locks[p+':'+s]={p:0,l:1,r:e.r};});});
  if(pi===curPat){bindPads();try{paintSteps();renderPadDots();}catch(e){}}renderPatSegs();markDirty();
}
function garLenFor(pi,bars){var pt=patterns[pi],len=bars*16;if(pt&&pt.notes.some(function(n){return n.length;})&&pt.len>len)len=pt.len;return len;}
function garApplyDrummer(){var pi=garTargetPat(GAR.drum),len=garLenFor(pi,GAR.drum.bars);garWriteDrums(pi,garGenDrummer(len),len);var sw=(GSTY[GAR.drum.style].swing||0)+GAR.drum.swing;setParam('swing',clamp(sw,0,P.swing.max));}
function garApplySmart(){var pi=garTargetPat(GAR.smart),len=garLenFor(pi,GAR.smart.bars);garWriteDrums(pi,garGenSmart(len),len);}
var garDrT=null;function garDrumsChanged(fn){clearTimeout(garDrT);garDrT=setTimeout(fn,60);}
/* ---------- tracks for instruments ---------- */
function garFindTrack(kind){
  if(kind==='drums')return 0;
  if(kind==='audio'){var a=-1;tracks.forEach(function(t,i){if(a<0&&t.kind==='audio')a=i;});if(a<0&&typeof addAudioTrack==='function'){a=addAudioTrack();}return a;}
  var re=kind==='gtr'?/guitar|gtr/i:kind==='bass'?/bass/i:null,f=-1;
  if(re)tracks.forEach(function(t,i){if(f<0&&t.kind==='keys'&&re.test(t.name))f=i;});
  if(f<0&&kind==='gtr'){f=addInstTrack('Guitar',true,'egtr2');if(f>=0)toast('Added a Guitar track.',1400);}
  if(f<0&&kind==='keys'){f=selTrack&&tracks[selTrack]&&tracks[selTrack].kind==='keys'&&!/bass|guitar/i.test(tracks[selTrack].name)?selTrack:1;}
  if(f<0)f=selTrack;return f;
}
/* ---------- Live Loops ---------- */
function llRows(){var r=[];tracks.forEach(function(t,i){if(t.kind!=='audio')r.push(i);});return r;}
function llHas(ti,p){var pt=patterns[p];if(!pt)return false;if(ti===0)return pt.drums.some(function(a){return a.slice(0,pt.len).some(Boolean);});return (pt.notes[ti]||[]).length>0;}
function llRunning(){return seq.on&&seq.mode==='loops';}
function llStart(){if(!ensureAudio())return;if(seq.on)transportStop();GAR.ll.g=0;GAR.ll.perfLog=GAR.ll.perf?[]:null;transportStart('loops');}
function llLaunch(ti,p){var L=GAR.ll;if(!llRunning()){L.act={};L.q={};L.q[ti]=p;llStart();}else L.q[ti]=p;llRender();}
function llTick(){
  var L=GAR.ll,now=ctx.currentTime,look=0.12;
  while(seq.on&&seq.next<now+look){
    var g=seq.step,t=seq.next,sd=stepDur();
    if(g%16===0){Object.keys(L.q).forEach(function(k){var ti=+k,p=L.q[k];if(p<0)delete L.act[ti];else L.act[ti]={p:p,g0:g};if(L.perfLog)L.perfLog.push({ti:ti,p:p,g:g});});L.q={};}
    Object.keys(L.act).forEach(function(k){var ti=+k,a=L.act[k],pt=patterns[a.p];if(!pt||!tracks[ti])return;var s=((g-a.g0)%pt.len+pt.len)%pt.len;
      if(ti===0)drumStep(pt,s,t,sd);else if(tracks[ti].kind==='keys'){var ns=pt.notes[ti]||[];for(var j=0;j<ns.length;j++){var n=ns[j];if(n.s>=s&&n.s<s+1)playNote(ti,n.m,n.v,t+(n.s-s)*sd,Math.max(0.05,n.l*sd));}}});
    if(seq.metro&&g%4===0)click(t,g%16===0);
    var sw=P.swing.v*sd*0.5;seq.next+=sd+(g%2===0?sw:-sw);seq.step++;
  }
}
function llPosNow(){return (ctx.currentTime-recLatency()-seq.audStart)/stepDur();}
function llRecAt(ti,pos){var R=GAR.ll.rec,a=GAR.ll.act[ti];if(!R||R.ti!==ti||!a||a.p!==R.p)return null;var pt=patterns[a.p],s=((pos-a.g0)%pt.len+pt.len)%pt.len;if(pos<a.g0)return null;return {p:a.p,s:s};}
function llRecPad(i,vel){var tg=llRecAt(0,llPosNow());if(!tg||!seq.rec)return;var pt=patterns[tg.p],s=Math.round(tg.s)%pt.len;pt.drums[i][s]=Math.round(clamp(vel,0.05,1)*100)/100;markDirty();}
function llRecStop(){seq.rec=false;recFlush();GAR.ll.rec=null;garBanner();llRender();garUpd();}
function llRecord(ti,p){var L=GAR.ll;L.rec={ti:ti,p:p};seq.rec=true;
  if(ti===0){GAR.inst='kit';GAR.ti=0;}else{GAR.ti=ti;if(selTrack!==ti)selectTrack(ti);if(!GAR.inst||(GINST[GAR.inst]||{}).track==='drums'||GAR.inst==='audio'||GAR.inst==='vocal')GAR.inst=/guitar/i.test(tracks[ti].name)?'gtr':/bass/i.test(tracks[ti].name)?'bass':'skeys';}
  if(!llRunning()){L.act={};L.q={};}llLaunch(ti,p);garView('play');toast('Recording into '+tracks[ti].name+' · '+PATN[p]+' — it loops every '+patterns[p].len/16+' bar'+(patterns[p].len>16?'s':'')+'. Play over it to overdub.',2600);}
function llCommitPerf(gEnd){var L=GAR.ll,log=L.perfLog;L.perfLog=null;if(!log||!log.length)return;
  var base=Math.ceil(arrEnd()/16)*16,end=Math.ceil(gEnd/16)*16,open={},made=0;
  function close(ti,g){var o=open[ti];if(!o)return;if(g>o.g){newClip({type:'pat',ti:ti,s:base+o.g,l:g-o.g,p:o.p,o:0});made++;}delete open[ti];}
  log.forEach(function(e){close(e.ti,e.g);if(e.p>=0)open[e.ti]={p:e.p,g:e.g};});Object.keys(open).forEach(function(k){close(+k,end);});
  if(made){dawNeed=true;markDirty();toast('Performance captured: '+made+' region'+(made>1?'s':'')+' from bar '+(base/16+1)+' in Tracks.',2600);}}
function garSave(){try{bandPart('A');bandPart('B');bandPart('C');bandGroove();}catch(e){}return {kit:GAR.kit||null,key:GAR.key,minor:GAR.minor,chords:GAR.chords,ap:GAR.ap,drum:GAR.drum,smart:{pieces:GAR.smart.pieces,bars:GAR.smart.bars,pat:GAR.smart.pat},band:JSON.parse(JSON.stringify(Object.assign({},GAR.band,{keyHint:null,half:false,sel:0,open:{harm:true}})))};}
function garLoad(d){d=d||{};if(typeof bandStop==='function'&&!hist.keepBand)bandStop();if(d.band)bandMigrate(d.band);GAR.kit=typeof d.kit==='string'?d.kit:null;GAR.key=d.key|0;GAR.minor=!!d.minor;GAR.chords=Array.isArray(d.chords)&&d.chords.length===8?d.chords:null;if(d.ap)Object.assign(GAR.ap,d.ap);if(d.drum)Object.assign(GAR.drum,d.drum);if(d.smart){GAR.smart.pieces=d.smart.pieces||GAR.smart.pieces;GAR.smart.bars=d.smart.bars||2;GAR.smart.pat=d.smart.pat==null?-1:d.smart.pat;}
  GAR.ll.act={};GAR.ll.q={};GAR.ll.rec=null;GAR.ll.sel=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(GAR.minor?'m':'');if($('#t-gar').classList.contains('active'))garView(GAR.view);}
function llStopped(){llCommitPerf(seq.step);GAR.ll.act={};GAR.ll.q={};if(GAR.ll.rec){seq.rec=false;GAR.ll.rec=null;}seq.mode='pattern';}
/* ---------- design tokens shared with the CSS ---------- */
var FAM={k:'#5CE1E6',g:'#FF8A5B',b:'#B69CFF',d:'#FFC94D',a:'#FF6B8B',l:'#D4FF3A'};
var IFAM={band:'d',keys:'k',skeys:'k',gtr:'g',bass:'b',kit:'d',sdrums:'d',drummer:'d',vocal:'a',audio:'a',sampler:'l',loops:'l',score:'l'};
function garFamT(ti){var t=tracks[ti];if(!t)return FAM.k;if(ti===0)return FAM.d;if(t.kind==='audio')return FAM.a;if(/guitar|gtr/i.test(t.name))return FAM.g;if(/bass/i.test(t.name))return FAM.b;return FAM.k;}
function garIconT(ti){var t=tracks[ti];if(!t)return 'keys';if(ti===0)return 'kit';if(t.kind==='audio')return 'audio';if(/guitar|gtr/i.test(t.name))return 'gtr';if(/bass/i.test(t.name))return 'bass';return 'keys';}
function garSvg(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+GICON[k]+'</svg>';}
var GSVG={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',rec:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>',
  copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>',edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',drum:'<svg viewBox="0 0 24 24" aria-hidden="true">'+GICON.drummer+'</svg>'};

/* ---------- bottom sheet ---------- */
function garSheet(title,html,bind){var s=$('#garSheet');$('#garSheetT').textContent=title;$('#garSheetB').innerHTML=html;s.hidden=false;if(bind)bind($('#garSheetB'));var f=s.querySelector('#garSheetB button, #garSheetB input');if(f)f.focus();}
function garSheetClose(){$('#garSheet').hidden=true;}

/* ---------- instrument browser ---------- */
var GBR=[['Jam with a band',['band']],['Play an instrument',['skeys','keys','gtr','bass']],['Drums',['drummer','sdrums','kit']],['Record and create',['vocal','audio','sampler','loops','score']]];
function garBrowse(){var w=$('#garBrowse'),h='';
  GBR.forEach(function(g){h+='<div class="gx-grp"><h3>'+g[0]+'</h3><div class="gx-tiles">';
    g[1].forEach(function(k,i){var I=GINST[k],wide=g[1].length%2===1&&i===g[1].length-1;h+='<button class="gx-tile'+(wide?' wide':'')+'" style="--c:'+FAM[IFAM[k]]+'" data-gi="'+k+'"><span class="gx-ic">'+garSvg(k)+'</span><div><b>'+I.name+'</b><small>'+I.sub+'</small></div></button>';});
    h+='</div></div>';});
  w.innerHTML=h;$$('#garBrowse [data-gi]').forEach(function(b){b.addEventListener('click',function(){garOpen(b.getAttribute('data-gi'));});});}

/* ---------- instrument surface ---------- */
function garFit(){var el=$('#garInst');if(!el||$('#gv-play').hidden)return;var top=el.getBoundingClientRect().top,nav=$('nav'),nb=nav?nav.getBoundingClientRect().top:window.innerHeight,kb=$('#kbwrap'),kbt=kb&&!kb.hidden?kb.getBoundingClientRect().top:nb;
  var h=Math.max(300,Math.min(560,Math.min(nb,kbt)-top-34));el.style.setProperty('--sh',h+'px');}
function garStrips(){
  var inst=GAR.inst,el=$('#garInst'),C=garChords(),nseg=garSegs(inst,C[0]).length,fret=inst==='gtr'||inst==='bass';
  var SW=inst==='gtr'?[1.2,1.6,2,2.6,3.2,3.8]:[2.4,3,3.6,4.2];
  el.classList.toggle('fret',fret);
  var h='<div class="gx-strips" id="garStrips">';
  C.forEach(function(c,ci){var hi=harmInfo({root:c[0],q:c[1]==='maj'?'maj':c[1]==='min'?'min':c[1]});h+='<div class="gx-strip" data-ci="'+ci+'"'+(HARM.on?' style="--fam:'+hi.col+'"':'')+'><button class="gx-ch" data-ch="'+ci+'" aria-label="'+garChName(c)+' chord, '+hi.num+'">'+garChName(c)+(HARM.on?'<small>'+hi.num+'</small>':'')+'</button><div class="gx-segs">';
    for(var k=0;k<nseg;k++)h+='<div class="gx-seg'+(inst==='skeys'&&k>=3?' lo':'')+'" data-ci="'+ci+'" data-sg="'+k+'"'+(fret?' style="--sw:'+SW[k]+'px"':'')+'></div>';h+='</div></div>';});
  h+='</div><details class="gx-chedit"><summary>Change chords</summary><div class="gx-chgrid" id="garChEd"></div><div class="gx-acts" style="margin-top:8px"><button class="gx-btn" id="garChReset">Use the chords of the key</button></div></details>';
  el.innerHTML=h;garPaintStrips();garChEdit();garFit();
  var sp=$('#garStrips'),held=new Map();
  function segAt(x,y){var e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('#garStrips .gx-seg, #garStrips .gx-ch'):null;}
  function hit(e,id,first){var s=segAt(e.clientX,e.clientY),prev=held.get(id);if(!s){if(prev&&prev.key){noteGroupOff(prev.key);held.set(id,{el:null});}return;}if(prev&&prev.el===s)return;
    if(prev&&prev.key)noteGroupOff(prev.key);var vel=0.82;
    if(s.classList.contains('gx-ch')){var ci=+s.getAttribute('data-ch');if(!first){held.set(id,{el:s});return;}
      if(GAR.ap[garApKind()]>0){if(GAR.apOn===ci)garApStop();else garApStart(ci);held.set(id,{el:s});return;}
      var c=garChords()[ci],k='gch'+id,ns=inst==='gtr'?garGtrVoice(c):inst==='bass'?[garBassNotes(c)[0]]:garKeysVoice(c,0).concat([garBassRoot(c,36)]);
      s.classList.add('on');setTimeout(function(){s.classList.remove('on');},160);
      if(inst==='gtr'){garStrum(ns,0.85);harmFromChord(c);held.set(id,{el:s});return;}
      noteGroupOn(k,ns,vel);held.set(id,{el:s,key:k});return;}
    var ci2=+s.getAttribute('data-ci'),sg=+s.getAttribute('data-sg'),notes=garSegs(inst,garChords()[ci2])[sg],key='gsg'+id;
    noteGroupOn(key,notes,vel);held.set(id,{el:s,key:key});s.classList.add('hit');setTimeout(function(){s.classList.remove('hit');},170);
  }
  sp.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();try{sp.setPointerCapture(e.pointerId);}catch(x){}hit(e,e.pointerId,true);});
  sp.addEventListener('pointermove',function(e){if(held.has(e.pointerId))hit(e,e.pointerId,false);});
  function up(e){var h0=held.get(e.pointerId);if(h0&&h0.key)noteGroupOff(h0.key);held.delete(e.pointerId);}
  sp.addEventListener('pointerup',up);sp.addEventListener('pointercancel',up);
}
function noteGroupOn(k,ns,vel){ns.forEach(function(m,j){noteOn(k+'_'+j,m,vel);});}
function noteGroupOff(k){Array.from(voices.keys()).forEach(function(x){if(String(x).indexOf(k+'_')===0)noteOff(x);});}
function garStrum(ns,vel){if(!ensureAudio())return;var t=ctx.currentTime+0.01;ns.forEach(function(m,j){playNote(GAR.ti,m,vel*(1-j*0.03),t+j*0.014,1.6);garRecNoteNow(GAR.ti,m,vel);});}
function garRecNoteNow(ti,m,v){if(!seq.on||!seq.rec)return;var ck=garClock(),pos=ck.pos(ctx.currentTime-recLatency()),tg=seq.mode==='arrange'?jamTarget(ti,pos):seq.mode==='loops'?llRecAt(ti,pos):null;if(!tg)return;var pt=patterns[tg.p],s=seq.quant?Math.round(tg.s)%pt.len:Math.round(tg.s*100)/100;noteArr(pt,ti).push({s:s,l:8,m:m,v:Math.round(v*100)/100});markDirty();}
function garPaintStrips(){$$('#garStrips .gx-strip').forEach(function(s){s.classList.toggle('ap',GAR.apOn===+s.getAttribute('data-ci'));});}
function garFlashSeg(ci){var s=document.querySelector('#garStrips .gx-strip[data-ci="'+ci+'"] .gx-ch');if(!s)return;s.style.opacity='.75';setTimeout(function(){s.style.opacity='';},90);}
function garChEdit(){var w=$('#garChEd');if(!w)return;var C=garChords(),h='';
  C.forEach(function(c,i){h+='<select data-ce="'+i+'" aria-label="Chord '+(i+1)+'">';for(var r=0;r<12;r++)Object.keys(GCHQ).forEach(function(q){h+='<option value="'+r+'|'+q+'"'+(c[0]===r&&c[1]===q?' selected':'')+'>'+garChName([r,q])+'</option>';});h+='</select>';});
  w.innerHTML=h;$$('[data-ce]').forEach(function(s){s.addEventListener('change',function(){var C2=garChords().map(function(x){return x.slice();}),v=s.value.split('|');C2[+s.getAttribute('data-ce')]=[+v[0],v[1]];GAR.chords=C2;markDirty();garStrips();$('#garInst details').open=true;});});
  var rb=$('#garChReset');if(rb)rb.onclick=function(){GAR.chords=null;markDirty();garStrips();};
}
var GPADN={kick:[/^kick/i,0],snare:[/snare/i,1],clap:[/clap/i,2],rim:[/rim/i,3],hat:[/closed|^hat|hi.?hat/i,4],ohat:[/open/i,5],shaker:[/shak/i,6],cowbell:[/cow/i,7],tomlo:[/tom ?lo|low/i,8],tommid:[/tom ?mid|mid/i,9],tomhi:[/tom ?hi|high/i,10],crash:[/crash/i,11],ride:[/ride/i,13]};
function garPad(k){var d=GPADN[k];if(!d)return -1;for(var i=0;i<pads.length;i++)if(pads[i]&&pads[i].buf&&d[0].test(pads[i].name||''))return i;return pads[d[1]]&&pads[d[1]].buf?d[1]:-1;}
function garKit(){var L=[['crash','Crash'],['ohat','Open hat'],['hat','Hi-hat'],['tomhi','High tom'],['tomlo','Low tom'],['clap','Clap'],['kick','Kick',1],['snare','Snare']];
  var el=$('#garInst');el.classList.remove('fret');var h='<div class="gx-pads" id="garPads">';L.forEach(function(x){var i=garPad(x[0]);if(i<0)return;h+='<button class="gx-pad'+(x[2]?' big':'')+'" data-gp="'+i+'">'+x[1]+'</button>';});h+='</div>';
  el.innerHTML=h;garFit();
  $$('#garPads .gx-pad').forEach(function(b){b.addEventListener('pointerdown',function(e){e.preventDefault();if(!ensureAudio())return;var i=+b.getAttribute('data-gp'),r=b.getBoundingClientRect(),vel=clamp(0.55+0.45*(1-(e.clientY-r.top)/r.height),0.3,1);trigPad(i,vel);recPad(i,vel);b.classList.add('hit');setTimeout(function(){b.classList.remove('hit');},110);});});
}
/* drummer + smart drums shared parts */
function garRegion(o,id){var h='<div class="gx-sec"><div class="gx-row"><span>Length</span><div class="gx-seg2" id="'+id+'L">';[1,2,4].forEach(function(b){h+='<button data-bl="'+b+'" aria-pressed="'+(o.bars===b)+'">'+b+(b>1?' bars':' bar')+'</button>';});
  h+='</div></div><div class="gx-row"><span>Loop</span><div class="gx-seg2" id="'+id+'P" style="overflow-x:auto;max-width:66%">';for(var i=0;i<8;i++)h+='<button data-tp="'+i+'" aria-pressed="'+(garTargetPat(o)===i)+'"'+(patHas(patterns[i])?' class="has"':'')+' style="min-width:30px;padding:0 6px">'+PATN[i]+'</button>';
  return h+'</div></div></div>';}
function garBindRegion(o,id,fn){$$('#'+id+'L [data-bl]').forEach(function(b){b.addEventListener('click',function(){o.bars=+b.getAttribute('data-bl');$$('#'+id+'L [data-bl]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});fn();});});
  $$('#'+id+'P [data-tp]').forEach(function(b){b.addEventListener('click',function(){o.pat=+b.getAttribute('data-tp');setPattern(o.pat);$$('#'+id+'P [data-tp]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});});});}
function garActs(id){return '<div class="gx-acts" id="'+id+'"><button class="gx-btn pri" data-pv="1">'+GSVG.play+'Preview</button><button class="gx-btn" data-pv="2">Add to song</button></div>';}
function garBindActs(id,o,fn){var w=$('#'+id);if(!w)return;
  w.querySelector('[data-pv="1"]').addEventListener('click',function(){if(seq.on){transportStop();garUpd();return;}fn();setPattern(garTargetPat(o));transportStart('pattern');garUpd();});
  w.querySelector('[data-pv="2"]').addEventListener('click',function(){fn();var pi=garTargetPat(o),pt=patterns[pi],s0=Math.floor(Math.max(0,daw.play)/16)*16;
    daw.clips=daw.clips.filter(function(c){return !(c.ti===0&&c.type==='pat'&&c.s<s0+pt.len&&c.s+c.l>s0);});newClip({type:'pat',ti:0,s:s0,l:pt.len,p:pi,o:0});dawNeed=true;markDirty();toast('Drums added to the song at bar '+(s0/16+1)+'.',1800);});}
function garXY(id,getPts,onMove,labels){
  var h='<div class="gx-xy" id="'+id+'"><canvas></canvas><span class="gx-ax" style="left:10px;bottom:8px">'+labels[0]+'</span><span class="gx-ax" style="right:10px;bottom:8px">'+labels[1]+'</span><span class="gx-ax" style="left:10px;top:8px">'+labels[2]+'</span><span class="gx-ax" style="left:10px;top:50%;transform:translateY(-50%)"></span></div>';
  return {html:h,bind:function(){var box=$('#'+id),cv=box.querySelector('canvas'),drag=null,fam=getComputedStyle($('#t-gar')).getPropertyValue('--fam').trim()||FAM.d;
    function draw(){var r=box.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=r.width*dpr;cv.height=r.height*dpr;var g=cv.getContext('2d');g.scale(dpr,dpr);
      for(var i=1;i<6;i++){g.fillStyle='#22222D';for(var j=1;j<4;j++){g.beginPath();g.arc(r.width*i/6,r.height*j/4,1.4,0,7);g.fill();}}
      getPts().forEach(function(p){var x=8+p.x*(r.width-16),y=8+(1-p.y)*(r.height-16),rad=p.l?15:16;
        if(p.sel){g.fillStyle=fam+'33';g.beginPath();g.arc(x,y,rad+9,0,7);g.fill();}
        g.fillStyle=p.sel?fam:'#3A3A48';g.beginPath();g.arc(x,y,rad,0,7);g.fill();
        if(p.l){g.fillStyle=p.sel?'#0B0B10':'#F4F4F7';g.font='600 10px Inter, system-ui, sans-serif';g.textAlign='center';g.fillText(p.l,x,y+3.5);}});}
    function at(e){var r=box.getBoundingClientRect();return {x:clamp((e.clientX-r.left-8)/(r.width-16),0,1),y:clamp(1-(e.clientY-r.top-8)/(r.height-16),0,1)};}
    box.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();drag=e.pointerId;try{box.setPointerCapture(e.pointerId);}catch(x){}onMove(at(e),true);draw();});
    box.addEventListener('pointermove',function(e){if(drag!==e.pointerId)return;onMove(at(e),false);draw();});
    box.addEventListener('pointerup',function(){drag=null;});box.addEventListener('pointercancel',function(){drag=null;});
    draw();box._draw=draw;}};
}
var GSMP=[['kick','Kick','Kick'],['snare','Snare','Snare'],['clap','Clap','Clap'],['hat','Hi-hat','Hat'],['ohat','Open hat','Open'],['shaker','Shaker','Shkr'],['toms','Toms','Toms'],['crash','Crash','Crash'],['cowbell','Cowbell','Bell'],['ride','Ride','Ride']];
function garSmartDrums(){var S=GAR.smart,el=$('#garInst');el.classList.remove('fret');
  var h='<div class="gx-chips" id="garSmp" aria-label="Drums on the grid">';
  GSMP.forEach(function(p){if(p[0]!=='toms'&&garPad(p[0])<0)return;h+='<button class="gx-chip'+(S.pieces[p[0]]?' on':'')+'" data-sp="'+p[0]+'" aria-pressed="'+(S.sel===p[0])+'">'+p[1]+'</button>';});h+='</div>';
  var xy=garXY('garSxy',function(){return Object.keys(S.pieces).map(function(k){var n=(GSMP.filter(function(x){return x[0]===k;})[0]||[k,k,k])[2];return {x:S.pieces[k].x,y:S.pieces[k].y,l:n,sel:k===S.sel};});},
    function(pt){if(!S.sel)return;S.pieces[S.sel]={x:pt.x,y:pt.y};chips();garDrumsChanged(garApplySmart);},['Simple','Complex','Loud']);
  h+=xy.html+garRegion(S,'garSr')+garActs('garSpv')+'<div class="gx-acts"><button class="gx-btn" id="garSdice">Shuffle drums</button><button class="gx-btn" id="garSclr">Clear grid</button></div>';
  el.innerHTML=h;xy.bind();
  function chips(){$$('#garSmp [data-sp]').forEach(function(b){var k=b.getAttribute('data-sp');b.setAttribute('aria-pressed',S.sel===k);b.classList.toggle('on',!!S.pieces[k]);});}
  $$('#garSmp [data-sp]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-sp');if(S.sel===k&&S.pieces[k]){delete S.pieces[k];S.sel=null;}else{S.sel=k;if(!S.pieces[k])S.pieces[k]={x:0.35,y:0.6};var pd=garPad(k==='toms'?'tommid':k);if(pd>=0)trigPad(pd,0.8);}chips();$('#garSxy')._draw();garDrumsChanged(garApplySmart);});});
  $('#garSdice').addEventListener('click',function(){S.pieces={};var ks=['kick','snare','hat'];['clap','ohat','shaker','toms','cowbell','ride'].forEach(function(k){if(Math.random()<0.35)ks.push(k);});ks.forEach(function(k){S.pieces[k]={x:Math.random()*0.85,y:0.35+Math.random()*0.65};});S.sel=null;chips();$('#garSxy')._draw();garApplySmart();});
  $('#garSclr').addEventListener('click',function(){S.pieces={};S.sel=null;chips();$('#garSxy')._draw();garApplySmart();});
  garBindRegion(S,'garSr',garApplySmart);garBindActs('garSpv',S,garApplySmart);
}
var GSTD={pop:'Steady backbeat',rock:'Driving eighths',hiphop:'Laid-back swing',onedrop:'Reggae, kick on 3',steppers:'Reggae, kick on every beat',house:'Four on the floor',funk:'Busy sixteenths',trap:'Half-time with rolls'};
function garDrummer(){var D=GAR.drum,el=$('#garInst');el.classList.remove('fret');
  var h='<div class="gx-styles" id="garDst" role="group" aria-label="Style">';Object.keys(GSTY).forEach(function(k){h+='<button class="gx-sty" data-ds="'+k+'" aria-pressed="'+(D.style===k)+'"><b>'+GSTY[k].n+'</b><small>'+GSTD[k]+'</small></button>';});h+='</div>';
  var xy=garXY('garDxy',function(){return [{x:D.cx,y:D.ly,l:'',sel:true}];},function(pt){D.cx=pt.x;D.ly=pt.y;garDrumsChanged(garApplyDrummer);},['Simple','Complex','Loud']);
  h+=xy.html+'<div class="gx-sec"><div class="gx-row"><span>Cymbals and hi-hat</span><button class="gx-sw" id="garDcym" aria-pressed="'+D.cym+'" aria-label="Cymbals and hi-hat"></button></div><div class="gx-row"><span>Percussion</span><button class="gx-sw" id="garDperc" aria-pressed="'+D.perc+'" aria-label="Percussion"></button></div>'+
    '<div class="gx-row"><span>Fills</span><input type="range" class="gx-rng" id="garDf" min="0" max="1" step="0.01" value="'+D.fills+'" aria-label="Fills"></div><div class="gx-row"><span>Swing</span><input type="range" class="gx-rng" id="garDs" min="0" max="0.5" step="0.01" value="'+D.swing+'" aria-label="Swing"></div></div>'+
    garRegion(D,'garDr')+garActs('garDpv')+'<button class="gx-btn" id="garDvar">Play it differently</button>';
  el.innerHTML=h;xy.bind();
  var sel=el.querySelector('.gx-sty[aria-pressed="true"]');if(sel)sel.scrollIntoView({block:'nearest',inline:'center'});
  $$('#garDst [data-ds]').forEach(function(b){b.addEventListener('click',function(){D.style=b.getAttribute('data-ds');$$('#garDst [data-ds]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});if((D.style==='onedrop'||D.style==='steppers')&&garPad('rim')<0)toast('This style sounds best with the Reggae kit (Pads → Kit), which has a rim click.',2600);garApplyDrummer();});});
  $('#garDcym').addEventListener('click',function(){D.cym=!D.cym;this.setAttribute('aria-pressed',D.cym);garApplyDrummer();});
  $('#garDperc').addEventListener('click',function(){D.perc=!D.perc;this.setAttribute('aria-pressed',D.perc);garApplyDrummer();});
  $('#garDf').addEventListener('input',function(){D.fills=+this.value;garDrumsChanged(garApplyDrummer);});
  $('#garDs').addEventListener('input',function(){D.swing=+this.value;garDrumsChanged(garApplyDrummer);});
  $('#garDvar').addEventListener('click',function(){D.seed=1+Math.floor(Math.random()*9999);garApplyDrummer();toast('New variation.',1000);});
  garBindRegion(D,'garDr',garApplyDrummer);garBindActs('garDpv',D,garApplyDrummer);
}
function garLastAud(){var b=null;daw.clips.forEach(function(c){if(c.type==='aud'&&c.ti===GAR.ti&&(!b||c.id>b.id))b=c;});return b;}
/* ---------- "Your take" card (Garage Vocals/Audio Recorder and the Studio clip panel) ---------- */
function vtFmtDur(s){s=Math.max(0,s||0);var m=Math.floor(s/60),x=s-m*60;return m?m+':'+(x<10?'0':'')+x.toFixed(1):x.toFixed(1)+' s';}
function vtStopTP(){var a=VT.tp;VT.tp=null;if(a){try{a.stop();}catch(e){}}vtTakeBtns();}
function vtRawId(c){return c.vt&&c.vt.src&&(c.buf===c.vt.out||c.buf===c.vt.src)?c.vt.src:c.buf;}
function vtPlayTake(c,raw){if(!c||!ensureAudio())return;var same=VT.tp&&VT.tpRaw===raw&&VT.tpC===c;vtStopTP();if(same)return;var b=abuf[raw?vtRawId(c):c.buf];if(!b)return;
  var s=ctx.createBufferSource(),g=ctx.createGain(),tr=tracks[c.ti];s.buffer=b;g.gain.value=raw?1:dbg(c.gain||0);s.connect(g);g.connect(raw||!tr||!tr.n?ctx.destination:tr.n.in);
  var off=c.off||0;s.start(ctx.currentTime+0.02,off,Math.max(0.05,Math.min(c.dur,b.duration-off)));VT.tp=s;VT.tpRaw=raw;VT.tpC=c;s.onended=function(){if(VT.tp===s){VT.tp=null;vtTakeBtns();}};vtTakeBtns();}
function vtTakeBtns(){$$('[data-take]').forEach(function(el){var p=el.querySelector('[data-tk="play"]'),r=el.querySelector('[data-tk="raw"]'),on=VT.tp&&VT.tpC&&String(VT.tpC.id)===el.getAttribute('data-take');
  if(p)p.textContent=on&&!VT.tpRaw?'■ Stop':'▶ Play';if(r)r.textContent=on&&VT.tpRaw?'■ Stop':'▶ Original';});}
function vtTakeCard(c){var t=tracks[c.ti],tu=!!(c.vt&&c.vt.on&&c.vt.out&&c.buf===c.vt.out),rv=t?t.rev||0:0;
  return '<div class="vt-take" data-take="'+c.id+'"><div class="row"><b>Your take</b><span class="mu">'+vtFmtDur(c.dur)+(tu?' · tuned ('+(VTSTY[c.vt.st]?VTSTY[c.vt.st].n:'custom')+')':'')+'</span></div><canvas data-tkw aria-label="Waveform of your take"></canvas><span class="mu" style="font-size:13px">Saved in '+escapeH(vtWhere(c))+'</span>'+
    '<div class="vt-g2"><button class="btn" data-tk="play">▶ Play</button><button class="btn" data-tk="raw" aria-label="Play the original take: no tuning, no reverb, no effects">▶ Original</button><button class="btn vt-chip" data-tk="tune" aria-pressed="'+tu+'">Tune voice</button><button class="btn" data-tk="song">Open in Song</button><button class="btn vt-chip" data-tk="vm" style="grid-column:1/-1" aria-pressed="'+!!(c.vt&&vmEff(c.vt))+'">Voice Morph'+(c.vt&&vmEff(c.vt)?' · on':'')+'</button></div>'+
    '<label class="ctl"><span class="row"><span>Reverb on '+escapeH(t?t.name:'this track')+'</span><output data-tkro>'+(rv?fPct(rv):'dry')+'</output></span><input type="range" data-tkr min="0" max="1" step="0.01" value="'+rv+'" aria-label="Reverb for this track"></label></div>';}
function vtThumb(cv,b,c){if(!cv||!b)return;var dpr=window.devicePixelRatio||1,W=cv.clientWidth||300,H=cv.clientHeight||56;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  var p=peaksOf(b),i0=Math.floor((c.off||0)*b.sampleRate/256),i1=Math.max(i0+1,Math.min(p.length,Math.ceil(((c.off||0)+c.dur)*b.sampleRate/256))),n=i1-i0,mx=0.02,i,x;for(i=i0;i<i1;i++)if(p[i]>mx)mx=p[i];
  g.fillStyle='#D4FF3A';for(x=0;x<W;x++){var a=i0+Math.floor(x/W*n),e=Math.max(a+1,i0+Math.floor((x+1)/W*n)),m=0;for(i=a;i<e&&i<i1;i++)if(p[i]>m)m=p[i];var h=Math.max(1,m/mx*(H/2-3));g.fillRect(x,H/2-h,1,h*2);}}
function vtTakeBind(root,c){var el=root&&root.querySelector('[data-take="'+c.id+'"]');if(!el)return;var cv=el.querySelector('canvas');vtThumb(cv,abuf[c.buf],c);requestAnimationFrame(function(){vtThumb(cv,abuf[c.buf],c);});
  el.querySelector('[data-tk="play"]').addEventListener('click',function(){vtPlayTake(c,false);});el.querySelector('[data-tk="raw"]').addEventListener('click',function(){vtPlayTake(c,true);});
  el.querySelector('[data-tk="tune"]').addEventListener('click',function(){VM.tab='tune';vtStopTP();vtOpenClip(c);});el.querySelector('[data-tk="vm"]').addEventListener('click',function(){VM.tab='vm';vtStopTP();vtOpenClip(c);});el.querySelector('[data-tk="song"]').addEventListener('click',function(){vtGoClip(c.id);});
  var r=el.querySelector('[data-tkr]');r.addEventListener('input',function(){var t=tracks[c.ti];if(!t)return;t.rev=+r.value;el.querySelector('[data-tkro]').textContent=t.rev?fPct(t.rev):'dry';try{applyMix();}catch(e){}});r.addEventListener('change',function(){markDirty();try{renderMixer();}catch(e){}});vtTakeBtns();}
function garAudioUI(){var el=$('#garInst');el.classList.remove('fret');var t=tracks[GAR.ti],lc=arr.rec?null:garLastAud(),mon=daw.mon||VTL.on;
  var live=VTL.on?'<div class="gx-row"><span>Live style</span><div class="seg" role="group" aria-label="Live auto-tune style">'+Object.keys(VTSTY).map(function(k){return '<button data-gvs="'+k+'" aria-pressed="'+((VTL.st||'pop')===k)+'" style="min-height:44px">'+VTSTY[k].n+'</button>';}).join('')+'</div></div><label class="ctl"><span class="row"><span>Live amount</span><output id="garVtAo">'+VTL.amt+'%</output></span><input type="range" id="garVtA" min="0" max="100" step="1" value="'+VTL.amt+'" aria-label="Live auto-tune amount"></label>':'';
  var hp=VT.hp?'<p class="note" style="margin:0">Headphones confirmed for this session.</p>':'<div class="vt-warn">'+(mon?'You won’t hear yourself until you confirm headphones. ':'')+'Without headphones the speaker leaks into the mic (it sounds like echo or reverb). The count-in plays before the take starts and is not kept; the metronome is muted during the take.</div><button class="btn" id="garHp" style="min-height:44px">I’m wearing headphones</button>';
  el.innerHTML=(lc?vtTakeCard(lc):'')+'<div class="gx-mic"><button id="garMicRec" class="'+(arr.rec?'on':'')+'" aria-label="Record">'+GSVG.rec.replace('<svg','<svg style="width:34px;height:34px;fill:#F4F4F7;stroke:none"')+'</button><div class="rlvl" id="garLvl"'+(arr.rec?'':' hidden')+' role="img" aria-label="Input level"><i></i></div><canvas class="gx-rw" id="garRecWave"'+(arr.rec?'':' hidden')+' aria-hidden="true"></canvas><p>'+(lc?'Record again':'Records your microphone')+' onto '+escapeH(t?t.name:'an audio track')+' from the playhead, with one bar to count in.</p></div><div class="gx-sec"><div class="gx-row"><span>Hear yourself (headphones)</span><button class="gx-sw" id="garMon" aria-pressed="'+!!(daw.mon&&VT.hp)+'" aria-label="Hear yourself"></button></div><div class="gx-row"><span>Auto-tune my voice'+(VT.hp?' while I hear it':'')+'</span><button class="gx-sw" id="garVt" aria-pressed="'+!!VTL.on+'" aria-label="Live auto-tune"></button></div>'+live+hp+'</div>';
  $('#garMicRec').addEventListener('click',garRecord);$('#garVt').addEventListener('click',function(){vtLiveToggle(!VTL.on);});
  $('#garMon').addEventListener('click',function(){if(!daw.mon||!VT.hp){if(!VT.hp){hpAsk('“Hear yourself” sends your microphone to your ears while you record.',function(){daw.mon=true;garMonSync();},function(){daw.mon=false;garMonSync();toast('Hear yourself stays off. Plug in headphones to monitor.',2600);});return;}daw.mon=true;}else daw.mon=false;garMonSync();});
  if($('#garHp'))$('#garHp').addEventListener('click',function(){hpSet();garReAud();toast('Headphones confirmed: you can monitor yourself now.',1800);});
  $$('[data-gvs]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-gvs'),p=VTSTY[k];VTL.st=k;VTL.amt=p.amt;VTL.spd=Math.max(0,Math.min(60,p.spd));vtLiveSave();garReAud();});});
  if($('#garVtA'))$('#garVtA').addEventListener('input',function(e){VTL.amt=+e.target.value;$('#garVtAo').textContent=VTL.amt+'%';vtLiveSave();});
  if(lc)vtTakeBind(el,lc);}
function garMonSync(){var dm=$('#dawMon');if(dm)dm.checked=!!daw.mon;garReAud();}
function garKeysUI(){var el=$('#garInst');el.classList.remove('fret');el.innerHTML='<div class="gx-empty" style="padding:18px"><b>Play the keys below</b><p>Slide along the keyboard to change octave, and tap the record button above to record onto '+escapeH(tracks[GAR.ti].name)+'.</p></div>';}

var GSND={keys:['gpiano','epiano','churchorg','harmonium','organ','violin','cello','flute','clarinet','sax','trumpet','trombone','horn','harp','xylophone','strings','rhodes','piano','lead','pluck'],gtr:['egtr2','steel','nylon','harp','egtr','agtr'],bass:['ebass','upright','tuba','dub','sub','b808','sawbass','fbass']};
var GKITS=[['acoustic','Acoustic kit (recorded)'],['studio','Studio'],['boombap','Boom Bap'],['trap','Trap'],['house','House'],['reggae','Reggae']];
function garSoundSel(){var k=GAR.inst==='gtr'?'gtr':GAR.inst==='bass'?'bass':(GAR.inst==='keys'||GAR.inst==='skeys')?'keys':null,w=$('#garSnd'),dr=(GINST[GAR.inst]||{}).track==='drums';
  if(dr){w.hidden=false;w.innerHTML=GKITS.map(function(x){return '<option value="kit:'+x[0]+'"'+(GAR.kit===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('');if(!GAR.kit)w.insertAdjacentHTML('afterbegin','<option value="" selected>Current kit</option>');return;}
  w.hidden=!k||(GAR.amp&&k!=='keys');if(!k)return;var cur=tracks[GAR.ti]&&tracks[GAR.ti].sound&&tracks[GAR.ti].sound.slots&&tracks[GAR.ti].sound.slots.A.stock;if(GAR.ti===selTrack&&slots.A)cur=slots.A.stock;
  var ids=GSND[k].filter(function(id){return STOCK[id];}),more=Object.keys(STOCK).filter(function(id){return ids.indexOf(id)<0;});
  w.innerHTML=(cur?'':'<option value="">'+escapeH(slots.A&&GAR.ti===selTrack?slots.A.name:'Your sound')+'</option>')+'<optgroup label="Suggested">'+ids.map(function(id){return '<option value="'+id+'"'+(cur===id?' selected':'')+'>'+STOCK[id].name+'</option>';}).join('')+'</optgroup><optgroup label="More sounds">'+more.map(function(id){return '<option value="'+id+'"'+(cur===id?' selected':'')+'>'+STOCK[id].name+'</option>';}).join('')+'</optgroup>';}
function garTrackSel(){var s=$('#garTrack'),kind=(GINST[GAR.inst]||{}).track,h='',n=0;
  tracks.forEach(function(t,i){var ok=kind==='drums'?i===0:kind==='audio'?t.kind==='audio':t.kind==='keys';if(ok){n++;h+='<option value="'+i+'"'+(i===GAR.ti?' selected':'')+'>'+escapeH(t.name)+'</option>';}});s.innerHTML=h;s.hidden=n<2;}
function garOpen(inst,tiForce){
  var I=GINST[inst];if(!I)return;if(I.go){showTab(I.go);if(inst==='score')setTimeout(function(){var c=$('#trxCard');if(c)c.scrollIntoView({block:'start'});},60);return;}if(I.view){garView(I.view);return;}
  if(!ensureAudio())return;if(GAR.apOn>=0)garApStop();
  var ok=false;histQuiet(function(){
  GAR.inst=inst;var ti=tiForce!=null&&tracks[tiForce]?tiForce:garFindTrack(I.track);if(ti<0)return;ok=true;GAR.ti=ti;if(tracks[ti].kind==='keys'&&ti!==selTrack)selectTrack(ti);
  var cs=tracks[ti].sound&&tracks[ti].sound.slots&&tracks[ti].sound.slots.A&&tracks[ti].sound.slots.A.stock;if(ti===selTrack&&slots.A)cs=slots.A.stock;
  var up={piano:'gpiano',rhodes:'epiano',egtr:'egtr2',agtr:'steel',fbass:'ebass'};
  /* Garage's default sound only replaces an untouched factory sound, never one the user chose (t.own) */
  var fresh=!patterns.some(function(pt){return (pt.notes[ti]||[]).length;}),auto=tracks[ti].kind==='keys'&&!tracks[ti].own;if(auto&&inst==='bass'&&(!cs||up[cs]||(fresh&&cs!=='ebass'&&cs!=='upright')))loadStock('ebass',true);else if(auto&&(inst==='skeys'||inst==='keys'||inst==='gtr')&&up[cs])loadStock(up[cs],true);else if(cs)smpEnsure(cs,true);
  if(inst==='gtr'&&!tracks[ti].rig){tracks[ti].rig=rigFromPreset(0);rigRebuild(ti);}
  if(I.track==='drums'&&!GAR.kit&&kitSig()===KITFAC&&pads[0]&&pads[0].name==='Kick'&&pads[12]&&/808/.test(pads[12].name||'')){loadAcousticKit(false,true).then(function(){if(GAR.view==='play')garRenderPlay();});}
  });if(!ok)return;
  GAR.amp=false;garView('play');
}
/* ---------- BAND: auto-accompaniment (Trio-style) ----------
   Drums, bass and keys follow a chord progression. Everything is open: harmony mode, meter, feel, per-instrument styles,
   voicings, split bars, a step editor for each instrument, and live controls (XY pad, mutes, break, half/double time). */
Object.assign(GCHQ,{aug:{n:'+',iv:[0,4,8]},m7b5:{n:'m7♭5',iv:[0,3,6,10]},dim7:{n:'°7',iv:[0,3,6,9]},mmaj7:{n:'m(maj7)',iv:[0,3,7,11]},augmaj7:{n:'maj7♯5',iv:[0,4,8,11]},
  '6':{n:'6',iv:[0,4,7,9]},m6:{n:'m6',iv:[0,3,7,9]},'9':{n:'9',iv:[0,4,7,10,14]},m9:{n:'m9',iv:[0,3,7,10,14]},maj9:{n:'maj9',iv:[0,4,7,11,14]},'7sus4':{n:'7sus4',iv:[0,5,7,10]},'5':{n:'5',iv:[0,7]}});
var BMODE={ionian:{n:'Major (Ionian)',s:[0,2,4,5,7,9,11]},dorian:{n:'Dorian',s:[0,2,3,5,7,9,10],mi:1},phrygian:{n:'Phrygian',s:[0,1,3,5,7,8,10],mi:1},lydian:{n:'Lydian',s:[0,2,4,6,7,9,11]},
  mixolydian:{n:'Mixolydian',s:[0,2,4,5,7,9,10]},aeolian:{n:'Minor (Aeolian)',s:[0,2,3,5,7,8,10],mi:1},locrian:{n:'Locrian',s:[0,1,3,5,6,8,10],mi:1},harmminor:{n:'Harmonic minor',s:[0,2,3,5,7,8,11],mi:1},
  melminor:{n:'Melodic minor',s:[0,2,3,5,7,9,11],mi:1},phrygdom:{n:'Phrygian dominant',s:[0,1,4,5,7,8,10]},romanian:{n:'Romanian minor',s:[0,2,3,6,7,9,10],mi:1},hungarian:{n:'Hungarian minor',s:[0,2,3,6,7,8,11],mi:1},
  dblharm:{n:'Double harmonic',s:[0,1,4,5,7,8,11]},majpent:{n:'Major pentatonic',s:[0,2,4,7,9],pent:1},minpent:{n:'Minor pentatonic',s:[0,3,5,7,10],pent:1,mi:1},blues:{n:'Blues',s:[0,3,5,6,7,10],pent:1,mi:1}};
var BMET={'4/4':[2,2,2,2],'3/4':[2,2,2],'5/4':[2,2,2,2,2],'6/8':[3,3],'7/8':[2,2,3],'9/8':[2,2,2,3],'12/8':[3,3,3,3],'5/8':[2,3],'7/8b':[3,2,2]};
var BMETN={'7/8b':'7/8 (3+2+2)','7/8':'7/8 (2+2+3)','9/8':'9/8 (2+2+2+3)','5/8':'5/8 (2+3)'};
/* drum feels: ladder feels are 4/4 only; generic feels work in any meter */
var BDR={
  blues:{n:'Shuffle',kick:['x.......x.......','x.......x.......','x.....x.x.......','x.....x.x.....x.'],snare:['....x.......x...','....x.......x...','....x.......x..g','....x..g....x.g.'],sn:'snare',cym:['x...x...x...x...','x.x.x.x.x.x.x.x.','x.o.x.o.x.o.x.o.','x.o.x.o.x.o.x.o.'],cy:'hat',ride:true},
  soul:{n:'Soul',kick:['x.......x.......','x......xx.......','x..x...xx.......','x..x..x.x..x....'],snare:['....x.......x...','....x.......x...','....x..g....x...','.g..x..g.g..x.g.'],sn:'snare',cym:['x.x.x.x.x.x.x.x.','x.o.x.o.x.o.x.o.','xgogxgogxgogxgog','xgogxgogxgogxgog'],cy:'hat',perc:GDL.shaker,pc:'shaker'},
  jazz:{n:'Jazz ride',kick:['................','x.......x.......','x...x...x...x...','x..o..x.x...o.o.'],snare:['................','..........g.....','......g...g...g.','..g...g.g...g..g'],sn:'snare',cym:['x...x.x.x...x.x.','x...x.x.x...x.x.','x...x.x.x...x.x.','x.o.x.x.x.o.x.x.'],cy:'ride',foot:true,soft:true},
  bossa:{n:'Bossa',kick:['x..x....x..x....','x..x....x..x....','x..xx..xx..xx..x','x..xx..xx..xx..x'],snare:['x..x..x...x..x..','x..x..x...x..x..','x..x..x...x..x..','x..x..x...x..x..'],sn:'rim',cym:['x.x.x.x.x.x.x.x.','x.o.x.o.x.o.x.o.','xgogxgogxgogxgog','xgogxgogxgogxgog'],cy:'hat',soft:true},
  country:{n:'Train beat',kick:['x.......x.......','x.......x.......','x...x...x...x...','x...x...x...x.o.'],snare:['....x.......x...','....x.......x...','o.o.x.o.o.o.x.o.','ogo.xgo.ogo.xgo.'],sn:'snare',cym:['x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x.x.','x.o.x.o.x.o.x.o.','x.o.x.o.x.o.x.o.'],cy:'hat'},
  metal:{n:'Double kick',kick:['x.......x.......','x.x.....x.x.....','xxxx....xxxx....','xxxxxxxxxxxxxxxx'],snare:['....x.......x...','....x.......x...','....x.......x...','....x.......x...'],sn:'snare',cym:['x...x...x...x...','x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x.x.'],cy:'ride',crashy:true}};
var BDF={pop:'Pop',rock:'Rock',funk:'Funk',soul:'Soul',hiphop:'Hip-hop',trap:'Trap',house:'House',onedrop:'One drop',steppers:'Steppers',blues:'Shuffle',jazz:'Jazz ride',bossa:'Bossa',country:'Train beat',metal:'Double kick',
  'g:back':'Backbeat (any meter)','g:waltz':'Waltz (oom-pah-pah)','g:folk':'Folk / Balkan','g:jazz':'Jazz (any meter)','g:afro':'Afro bell','g:half':'Ballad','g:tribal':'Toms groove'};
var BBS={roots:'Roots',eighths:'Eighths',pop:'Pop',rock:'Rock',octaves:'Octaves',boogie:'Boogie',walk:'Walking',twofeel:'Two-feel',funk:'Funk',octpop:'Octave pops',funk2:'Funk 2',soul:'Soul',bossa:'Bossa',
  onedrop:'One drop',steppers:'Steppers',alt:'Root–fifth',walkup:'Walk-ups',sub:'Long sub',sub2:'Sub 2',offbeat:'Offbeat octaves',chug:'Chugs',
  'g:root':'Root per beat (any meter)','g:15':'Root–fifth–octave','g:walk':'Walking (any meter)','g:8':'Driving eighths','g:pa':'Oom-pa','g:pedal':'Pedal (drone on the key)','g:arp':'Arpeggio'};
