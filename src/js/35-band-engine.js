var BKS={pads:'Pads',quarters:'Quarter notes',shuffle:'Shuffle',stabs:'Funk stabs',offbeat:'Offbeats',comp:'Jazz comping',bossa:'Bossa',skank:'Skank (2 and 4)',stabsOff:'House stabs',
  'g:pads':'Held chords','g:beats':'On the beats','g:offs':'Off the beats','g:waltz':'Oom-pah-pah','g:arp':'Arpeggio','g:arp16':'Fast arpeggio','g:strum':'Strum pattern',off:'Off'};
var BGEN={
  pop:{n:'Pop',sub:'Steady backbeat',m:'4/4',d:'pop',b:'pop',k:'pads',f:'s16',sw:0},
  rock:{n:'Rock',sub:'Driving eighths',m:'4/4',d:'rock',b:'rock',k:'quarters',f:'straight',sw:0},
  blues:{n:'Blues shuffle',sub:'Boogie bass',m:'4/4',d:'blues',b:'boogie',k:'shuffle',f:'s8',sw:0.9},
  funk:{n:'Funk',sub:'Sixteenths, stabs',m:'4/4',d:'funk',b:'funk',k:'stabs',f:'s16',sw:0.25},
  soul:{n:'Soul / R&B',sub:'Pocket groove',m:'4/4',d:'soul',b:'soul',k:'offbeat',f:'s16',sw:0.25},
  jazz:{n:'Jazz swing',sub:'Walking bass',m:'4/4',d:'jazz',b:'walk',k:'comp',f:'s8',sw:0.75},
  bossa:{n:'Bossa nova',sub:'Clave groove',m:'4/4',d:'bossa',b:'bossa',k:'bossa',f:'straight',sw:0},
  reggae:{n:'Reggae',sub:'One drop, skank',m:'4/4',d:'onedrop',b:'onedrop',k:'skank',f:'s16',sw:0.3},
  country:{n:'Country',sub:'Train beat',m:'4/4',d:'country',b:'alt',k:'quarters',f:'straight',sw:0},
  hiphop:{n:'Hip-hop',sub:'Laid-back',m:'4/4',d:'hiphop',b:'sub',k:'pads',f:'s16',sw:0.6},
  house:{n:'House',sub:'Four on the floor',m:'4/4',d:'house',b:'offbeat',k:'stabsOff',f:'straight',sw:0},
  metal:{n:'Metal',sub:'Double kick',m:'4/4',d:'metal',b:'chug',k:'off',f:'straight',sw:0},
  waltz:{n:'Waltz',sub:'3/4, oom-pah-pah',m:'3/4',d:'g:waltz',b:'g:root',k:'g:waltz',f:'straight',sw:0},
  jwaltz:{n:'Jazz waltz',sub:'3/4 swing',m:'3/4',d:'g:jazz',b:'g:walk',k:'g:offs',f:'s8',sw:0.7},
  ballad68:{n:'6/8 ballad',sub:'Rolling feel',m:'6/8',d:'g:half',b:'g:15',k:'g:arp',f:'straight',sw:0},
  afro:{n:'Afro 12/8',sub:'Bell pattern',m:'12/8',d:'g:afro',b:'g:pa',k:'g:offs',f:'straight',sw:0},
  balkan:{n:'Balkan 7/8',sub:'Hora / geamparale',m:'7/8',d:'g:folk',b:'g:pa',k:'g:offs',f:'straight',sw:0},
  aksak:{n:'Aksak 9/8',sub:'2+2+2+3',m:'9/8',d:'g:folk',b:'g:pa',k:'g:beats',f:'straight',sw:0},
  five:{n:'Jazz 5/4',sub:'Odd-meter cool',m:'5/4',d:'g:jazz',b:'g:15',k:'g:beats',f:'s8',sw:0.6},
  modal:{n:'Modal drone',sub:'Pedal bass, any mode',m:'4/4',d:'g:tribal',b:'g:pedal',k:'g:arp',f:'straight',sw:0}};
var BPROG=[['I–V–vi–IV',[[0,'maj'],[7,'maj'],[9,'min'],[5,'maj']]],['I–vi–IV–V',[[0,'maj'],[9,'min'],[5,'maj'],[7,'maj']]],['ii–V–I',[[2,'m7'],[7,'7'],[0,'maj7'],[0,'maj7']]],
  ['12-bar blues',[[0,'7'],[5,'7'],[0,'7'],[0,'7'],[5,'7'],[5,'7'],[0,'7'],[0,'7'],[7,'7'],[5,'7'],[0,'7'],[7,'7']]],['i–VI–III–VII',[[0,'min'],[8,'maj'],[3,'maj'],[10,'maj']]],
  ['i–iv–V–i',[[0,'min'],[5,'min'],[7,'7'],[0,'min']]],['Andalusian',[[0,'min'],[10,'maj'],[8,'maj'],[7,'maj']]],['I–IV (reggae)',[[0,'maj'],[5,'maj'],[0,'maj'],[5,'maj']]],['i7 vamp',[[0,'m7'],[0,'m7'],[5,'7'],[0,'m7']]],
  ['Dorian vamp',[[0,'m7'],[5,'7'],[0,'m7'],[5,'7']]],['Mixolydian rock',[[0,'maj'],[10,'maj'],[5,'maj'],[0,'maj']]],['Phrygian (Balkan)',[[0,'maj'],[1,'maj'],[0,'maj'],[1,'maj']]],
  ['Romanian minor',[[0,'min'],[2,'7'],[0,'min'],[2,'7']]],['Lydian float',[[0,'maj7'],[2,'maj'],[0,'maj7'],[2,'maj']]],['Coltrane-ish',[[0,'maj7'],[3,'7'],[8,'maj7'],[11,'7']]]];
GAR.band={tr:{on:true,int:'normal',len:'bar',at:'bar',d:true,b:true,k:true},genre:'pop',meter:'4/4',dS:'pop',bS:'pop',kS:'pads',feel:'s16',swing:0,human:0.35,dyn:0.7,fills:0.6,fillEvery:4,lvD:0.9,lvB:0.9,lvK:0.6,count:true,
  mode:'ionian',color:'tri',voicing:'close',kReg:0,bReg:0,kLen:'long',approach:true,push:false,solo:'mode',time:'normal',mD:false,mB:false,mK:false,
  edit:'A',sel:0,learnBars:4,seed:7,parts:{A:null,B:null,C:null},pen:{A:0.5,B:0.7,C:0.35},groove:{},gOn:{d:false,b:false,k:false},open:{harm:true},gTool:0};
var BR=null;
function bandN(m){var g=BMET[m||GAR.band.meter]||BMET['4/4'];return 2*g.reduce(function(a,b){return a+b;},0);}
function bandGroups(m){var g=BMET[m||GAR.band.meter]||BMET['4/4'],s=0;return g.map(function(x){var o={s:s,l:x*2,e8:x};s+=x*2;return o;});}
function bandScaleSet(){var M=BMODE[GAR.band.mode]||BMODE.ionian;return M.s.map(function(x){return (GAR.key+x)%12;});}
/* chord built on scale degree i by stacking thirds; for pentatonic/blues modes the palette falls back to the parent major/minor */
function bandDegChord(i,seventh){var M=BMODE[GAR.band.mode]||BMODE.ionian,s=M.pent?(M.mi?BMODE.aeolian.s:BMODE.ionian.s):M.s,n=s.length,r=s[i%n],iv=[0,2,4,6].map(function(k){var j=i+k;return (s[j%n]+12*Math.floor(j/n)-r+24)%12;}),t=iv[1],f=iv[2],sv=iv[3],q;
  if(t===4&&f===7)q=seventh?(sv===11?'maj7':'7'):'maj';else if(t===3&&f===7)q=seventh?(sv===10?'m7':'mmaj7'):'min';else if(t===3&&f===6)q=seventh?(sv===9?'dim7':'m7b5'):'dim';else if(t===4&&f===8)q=seventh?'augmaj7':'aug';else q=t===4?'maj':t===3?'min':t<3?'sus2':'sus4';
  return [(GAR.key+r)%12,q];}
function bandPalette(){var M=BMODE[GAR.band.mode]||BMODE.ionian,n=M.pent?7:M.s.length,out=[];for(var i=0;i<n;i++)out.push(bandDegChord(i,GAR.band.color==='7th'));return out;}
function bandRoman(i,c){var R=['I','II','III','IV','V','VI','VII'][i]||'',q=c[1],lo=/^(min|m7|m6|m9|mmaj7|dim|dim7|m7b5)$/.test(q);return (lo?R.toLowerCase():R)+(/dim|m7b5/.test(q)?'°':q==='aug'||q==='augmaj7'?'+':'');}
function bandDef(part){var m=BMODE[GAR.band.mode]||BMODE.ionian,mi=!!m.mi,P0=part==='B'?(mi?[[3,'maj'],[10,'maj'],[8,'maj'],[7,'7']]:[[9,'min'],[5,'maj'],[0,'maj'],[7,'maj']]):part==='C'?(mi?[[8,'maj'],[10,'maj'],[0,'min'],[0,'min']]:[[5,'maj'],[5,'maj'],[7,'maj'],[7,'maj']]):(mi?[[0,'min'],[8,'maj'],[3,'maj'],[10,'maj']]:[[0,'maj'],[7,'maj'],[9,'min'],[5,'maj']]);
  return P0.map(function(c){return [(GAR.key+c[0])%12,c[1]];});}
function bandPart(p){var B=GAR.band;if(!B.parts[p]||!B.parts[p].length)B.parts[p]=bandDef(p);return B.parts[p];}
function bandChName(c){if(!c)return '—';var a=garChName(c);return c[2]?a+' / '+garChName(c[2]):a;}
function bandSplitAt(){var N=bandN(),best=0;bandGroups().forEach(function(g){if(Math.abs(g.s-N/2)<Math.abs(best-N/2))best=g.s;});return best||N/2;}
/* ---- voicing: close, open, power, add 9; smooth voice leading from the previous chord ---- */
function bandTonesOf(c){return GCHQ[c[1]]?GCHQ[c[1]].iv:[0,4,7];}
function bandVoice(c,prev){var B=GAR.band,iv=bandTonesOf(c).slice(),r=c[0];
  if(B.voicing==='power')iv=[0,7,12];else if(B.voicing==='nine'&&iv.indexOf(14)<0)iv=iv.concat([14]);
  var pcs=iv.map(function(x){return (r+x)%12;}),center=60+B.kReg*12,best=null,bs=1e9;
  if(B.voicing==='open'){var lo=garBassRoot(c,center-24+5)+0,t=iv.filter(function(x){return x<12;}),v=[lo,lo+(t[2]||7),lo+12+(t[1]||4),lo+(t[3]?12+t[3]:24)];if(iv.indexOf(14)>=0)v.push(lo+26);return v;}
  for(var inv=0;inv<pcs.length;inv++){var base=pcs.slice(inv).concat(pcs.slice(0,inv)),v=[],last=-99;
    base.forEach(function(pc,j){var m=center-7+((pc-(center-7))%12+12)%12;while(m<=last)m+=12;v.push(m);last=m;});
    var d=prev&&prev.length?v.reduce(function(a,m,j){return a+Math.abs(m-(prev[j]!=null?prev[j]:prev[prev.length-1]));},0):Math.abs(v[0]-center+3)*2;
    var mid=v.reduce(function(a,b){return a+b;},0)/v.length;d+=Math.max(0,Math.abs(mid-center-2)-6)*3;if(d<bs){bs=d;best=v;}}
  return best;}
/* ---- drums ---- */
function bandDrumFeels(){var four=GAR.band.meter==='4/4';return Object.keys(BDF).filter(function(k){return four||k.indexOf('g:')===0;});}
function bandBassStyles(){var four=GAR.band.meter==='4/4';return Object.keys(BBS).filter(function(k){return four||k.indexOf('g:')===0;});}
function bandKeysStyles(){var four=GAR.band.meter==='4/4';return Object.keys(BKS).filter(function(k){return four||k.indexOf('g:')===0||k==='off';});}
function bandFix(){var B=GAR.band;if(bandDrumFeels().indexOf(B.dS)<0)B.dS='g:back';if(bandBassStyles().indexOf(B.bS)<0)B.bS='g:root';if(bandKeysStyles().indexOf(B.kS)<0)B.kS='g:beats';}
function bandHit(out,pad,s,v,r){if(pad<0)return;out[pad]=out[pad]||{};out[pad][s]={v:Math.round(clamp(v,0.05,1)*100)/100,r:r||1};}
function bandDrumGen(E,rnd){var B=GAR.band,f=B.dS,out={},N=bandN(),G=bandGroups(),K=garPad('kick'),S=garPad('snare'),H=garPad('hat'),RI=garPad('ride'),RM=garPad('rim')>=0?garPad('rim'):garPad('snare');
  if(f.indexOf('g:')!==0){var D=BDR[f]||GSTY[f]||GSTY.pop,vary=0.3;
    garLine(out,K,garLadder(D.kick,E),0,1,rnd,vary);var sn=garPad(D.sn);if(sn<0)sn=S;garLine(out,sn,garLadder(D.snare,E),0,D.soft?0.8:1,rnd,vary);
    var cy=D.cy==='ride'||(D.ride&&E>0.72)?RI:garPad(D.cy||'hat');if(cy<0)cy=H;garLine(out,cy,garLadder(D.cym,E),0,0.85,rnd,vary);
    if(D.foot&&H>=0&&H!==cy)garLine(out,H,'....x.......x...',0,0.55,rnd,0);
    if(D.oh&&E>0.5)garLine(out,garPad('ohat'),garLadder(GDL.ohat,E-0.45),0,0.7,rnd,0);
    if((D.perc||D.pc)&&E>0.6)garLine(out,garPad(D.pc||'shaker'),garLadder(D.perc&&D.perc.length?D.perc:GDL.shaker,E-0.3),0,0.6,rnd,vary);
    if(D.crashy)bandHit(out,garPad('crash'),0,0.8);return out;}
  var last=G.length-1;
  G.forEach(function(g,gi){var s0=g.s,L=g.l,acc=gi===0?1:0.85;
    /* time keeping: 8ths, 16ths when busy, only beats when sparse */
    var cyP=f==='g:jazz'?RI:H;if(cyP<0)cyP=H;
    if(f==='g:jazz'){bandHit(out,cyP,s0,0.85*acc);if(gi%2===1||L===6)bandHit(out,cyP,s0+L-2+(L===6?0:0),0.55);if(H>=0&&gi%2===1&&H!==cyP)bandHit(out,H,s0,0.5);if(E>0.4&&rnd()<E*0.6)bandHit(out,S,s0+(rnd()<0.5?2:L-1),0.3);if(gi===0||E>0.7&&rnd()<0.4)bandHit(out,K,s0,0.45);return;}
    if(f==='g:afro'){var bell=garPad('cowbell')>=0?garPad('cowbell'):RI,bp=N===24?[0,4,8,10,14,18,22]:[0,4];
      (N===24?bp.filter(function(x){return x>=s0&&x<s0+L;}):bp.map(function(x){return s0+x;}).filter(function(x){return x<s0+L;})).forEach(function(x){bandHit(out,bell,x,x===0?0.9:0.7);});
      bandHit(out,K,s0,gi===0?0.95:0.7);if(E>0.4)for(var q=2;q<L;q+=2)bandHit(out,H,s0+q,0.4);if(gi%2===1)bandHit(out,RM,s0+(L===6?4:2),0.6);
      if(E>0.6){bandHit(out,garPad('tomlo'),s0+L-2,0.55);}return;}
    if(f==='g:tribal'){var TL=garPad('tomlo'),TM=garPad('tommid');bandHit(out,K,s0,gi===0?0.95:0.75);bandHit(out,TL>=0?TL:S,s0+2,0.6);if(E>0.35)bandHit(out,TM>=0?TM:S,s0+L-1,0.45);if(E>0.6)for(var q2=1;q2<L;q2+=2)bandHit(out,H,s0+q2,0.35);if(gi===last)bandHit(out,garPad('shaker'),s0,0.5);return;}
    var cs=E<0.25?L:E>0.72?1:2;for(var q3=0;q3<L;q3+=cs)bandHit(out,cyP,s0+q3,(q3===0?0.9:q3%2?0.45:0.65)*(f==='g:half'?0.8:1));
    if(f==='g:back'){if(gi%2===0)bandHit(out,K,s0,gi===0?1:0.85);else bandHit(out,S,s0,0.95);if(E>0.45&&gi%2===1&&rnd()<0.7)bandHit(out,K,s0+L-2,0.7);if(E>0.6&&rnd()<0.5)bandHit(out,S,s0+L-1,0.3);}
    else if(f==='g:waltz'){if(gi===0)bandHit(out,K,s0,1);else bandHit(out,S,s0,0.55);if(E>0.6&&gi===last)bandHit(out,K,s0+2,0.6);}
    else if(f==='g:folk'){bandHit(out,K,s0,gi===0?1:0.8);bandHit(out,S,s0+2,gi===last?0.9:0.7);if(L===6)bandHit(out,S,s0+4,0.6);if(E>0.55)bandHit(out,S,s0+(L===6?5:3),0.3);}
    else if(f==='g:half'){if(gi===0)bandHit(out,K,s0,1);if(G.length>2&&gi===Math.floor(G.length/2))bandHit(out,S,s0,0.9);else if(G.length<=2&&gi===1)bandHit(out,S,s0,0.9);if(E>0.4&&gi===last&&L===6)bandHit(out,K,s0+4,0.6);if(E>0.6&&gi===0)bandHit(out,K,s0+L-2,0.55);}});
  return out;}
/* ---- bass ---- */
function bandBassGen(c,n,E,rnd){var B=GAR.band,kind=B.bS,N=bandN(),lo=28+B.bReg*12,R=garBassRoot(c,lo),iv=bandTonesOf(c),t3=R+(iv[1]||4),f5=R+(iv[2]||7),b7=R+(iv.length>3&&iv[3]<12?iv[3]:10),M6=R+9,o=R+12,NR=garBassRoot(n||c,lo),ap=B.approach?NR+(NR>R?-1:1):R,ev,i;
  if(kind.indexOf('g:')===0){var G=bandGroups(),last=G.length-1;ev=[];
    G.forEach(function(g,gi){var s0=g.s,L=g.l;
      if(kind==='g:root')ev.push([s0,L-1,R,gi?0.8:0.92]);
      else if(kind==='g:15')ev.push([s0,L-1,gi===0?R:gi%2?f5:o,gi?0.78:0.92]);
      else if(kind==='g:walk'){var w=[R,t3,f5,M6,o,f5];ev.push([s0,L-1,gi===last&&gi>0?ap:w[gi%w.length],gi?0.8:0.9]);}
      else if(kind==='g:8'){for(var q=0;q<L;q+=2)ev.push([s0+q,2,gi===last&&q===L-2?ap:R,q?0.7:0.9]);}
      else if(kind==='g:pa'){ev.push([s0,2,gi===0?R:gi%2?f5-12>=lo-2?f5-12:f5:R,0.92]);ev.push([s0+2,2,f5,0.65]);if(L===6)ev.push([s0+4,2,o,0.6]);}
      else if(kind==='g:pedal'){var P0=garBassRoot([GAR.key,'maj'],lo);ev.push([s0,L-1,P0,gi?0.78:0.92]);if(E>0.6&&L>=4)ev.push([s0+L-2,1,P0+12,0.6]);}
      else if(kind==='g:arp'){var arp=[R,f5,o,t3+12];for(var q2=0;q2<L;q2+=2)ev.push([s0+q2,2,arp[((gi*3)+q2/2)%arp.length],q2?0.7:0.88]);}});
    if(E<0.3)ev=ev.filter(function(e,j){return j===0||G.some(function(g){return g.s===e[0];});});
    return ev;}
  switch(kind){
    case 'roots':ev=[[0,7,R,.9],[8,7,R,.8]];if(E>0.6)ev.push([14,2,f5,.7]);break;
    case 'eighths':ev=[];for(i=0;i<8;i++)ev.push([i*2,2,i===7&&E>0.45?ap:R,i%2?.7:.85]);break;
    case 'pop':ev=[[0,3,R,.9],[3,1,R,.6],[6,2,R,.75],[8,3,f5,.85],[11,1,R,.6],[14,2,o,.7]];break;
    case 'rock':ev=[];for(i=0;i<8;i++)ev.push([i*2,2,i===7?ap:(i===4&&E>0.6?f5:R),i%2?.72:.9]);break;
    case 'octaves':ev=[];for(i=0;i<8;i++)ev.push([i*2,2,i%2?o:R,i%2?.7:.88]);break;
    case 'boogie':var bq=iv[1]===3?[R,t3,f5,M6,b7,M6,f5,t3]:[R,R+4,f5,M6,R+10,M6,f5,R+4];ev=bq.map(function(m,j){return [j*2,2,m,j%2?.7:.88];});break;
    case 'walk':var w2=rnd()<0.5?t3:f5,w3=rnd()<0.5?f5:(rnd()<0.5?M6:o);ev=[[0,3,R,.9],[4,3,w2,.78],[8,3,w3,.82],[12,3,ap,.78]];break;
    case 'twofeel':ev=[[0,7,R,.9],[8,5,f5,.8],[14,2,ap,.7]];break;
    case 'funk':ev=[[0,2,R,.95],[3,1,o,.75],[6,1,R,.7],[7,1,R,.4],[10,2,b7,.8],[12,1,R,.75],[14,1,o,.7]];break;
    case 'octpop':ev=[[0,2,R,.95],[2,1,o,.7],[4,1,R,.6],[6,1,o,.75],[8,2,R,.9],[10,1,o,.7],[11,1,f5,.6],[14,2,b7,.75]];break;
    case 'funk2':ev=[[0,3,R,.95],[4,1,o,.65],[6,2,f5,.75],[9,1,R,.6],[10,2,b7,.8],[13,1,o,.65],[14,2,R,.7]];break;
    case 'soul':ev=[[0,3,R,.9],[4,2,f5,.75],[6,2,o,.7],[8,3,R,.85],[12,2,t3,.72],[14,2,ap,.7]];break;
    case 'bossa':ev=[[0,5,R,.88],[6,2,f5-12>=24?f5-12:f5,.72],[8,5,R,.82],[14,2,f5,.7]];break;
    case 'onedrop':ev=[[2,3,R,.9],[6,2,R,.75],[8,3,f5,.85],[12,2,iv[1]===3?b7:M6,.7],[14,2,f5,.72]];break;
    case 'steppers':ev=[[0,2,R,.9],[4,2,R,.8],[6,2,f5,.75],[8,2,R,.85],[12,2,o,.75],[14,2,f5,.72]];break;
    case 'alt':ev=[[0,4,R,.9],[8,4,f5-12>=24?f5-12:f5,.82]];if(E>0.5){ev.push([4,2,R,.6]);ev.push([12,2,f5,.6]);}break;
    case 'walkup':ev=[[0,4,R,.9],[8,2,f5-12>=24?f5-12:f5,.8],[12,2,NR-3,.7],[14,2,ap,.75]];break;
    case 'sub':ev=[[0,6,R,.95],[7,3,R,.8],[10,5,R,.7]];break;
    case 'sub2':ev=[[0,3,R,.95],[6,2,R,.75],[10,5,f5-12>=24?f5-12:R,.8]];break;
    case 'offbeat':ev=[[2,2,o,.85],[6,2,o,.8],[10,2,o,.85],[14,2,o,.8]];if(E>0.6)ev.push([0,1,R,.6]);break;
    case 'chug':ev=[];var st=E>0.6?1:2;for(i=0;i<16;i+=st)ev.push([i,st===1?1:2,R,i%4?.7:.95]);break;
    default:ev=[[0,15,R,.9]];}
  if(E<0.3&&!/offbeat|onedrop|steppers|funk|octpop|sub|bossa|boogie/.test(kind))ev=ev.filter(function(e){return e[0]%8===0;}).map(function(e){return [e[0],Math.max(e[1],6),e[2],e[3]];});
  return ev;}
/* ---- keys ---- */
function bandKeysGen(c,E,rnd,vo){var B=GAR.band,kind=B.kS,N=bandN(),hi=vo.map(function(x){return x+12;}),ev=[];if(kind==='off')return [];
  if(kind.indexOf('g:')===0){var G=bandGroups(),last=G.length-1,tones=vo.slice().sort(function(a,b){return a-b;});
    G.forEach(function(g,gi){var s0=g.s,L=g.l;
      if(kind==='g:pads'){if(gi===0)ev.push([0,N-1,vo,0.6]);}
      else if(kind==='g:beats')ev.push([s0,L-1,vo,gi?0.55:0.68]);
      else if(kind==='g:offs'){ev.push([s0+2,2,hi,0.62]);if(L===6)ev.push([s0+4,2,hi,0.5]);}
      else if(kind==='g:waltz'){if(gi>0)ev.push([s0,2,vo,0.6]);else if(E>0.6)ev.push([s0+2,1,vo,0.4]);}
      else if(kind==='g:arp'||kind==='g:arp16'){var st=kind==='g:arp16'||E>0.75?1:2,seq=tones.concat([tones[0]+12]).concat(tones.slice(1).reverse().map(function(x){return x;}));
        for(var q=0;q<L;q+=st){var k=(s0+q)/st;ev.push([s0+q,st,[seq[k%seq.length]],q?0.5:0.62]);}}
      else if(kind==='g:strum'){var pat=L===6?[0,3,4]:[0,2,3];pat.forEach(function(x,j){if(x<L)ev.push([s0+x,j?1:2,vo,j?0.5:0.66]);});}});
    if(E<0.3&&kind!=='g:pads')ev=ev.filter(function(e,i){return i%2===0;});return ev;}
  switch(kind){
    case 'pads':ev=[[0,15,vo,.62]];break;
    case 'quarters':ev=[[0,3,vo,.7],[4,3,vo,.55],[8,3,vo,.65],[12,3,vo,.55]];break;
    case 'shuffle':ev=[[0,2,vo,.7],[2,1,vo,.55],[6,2,vo,.6],[8,2,vo,.65],[10,1,vo,.5],[14,2,vo,.6]];break;
    case 'stabs':ev=[[0,1,hi,.8],[3,1,hi,.55],[6,1,hi,.7],[10,1,hi,.75],[12,1,hi,.55]];break;
    case 'offbeat':ev=[[2,2,vo,.6],[6,2,vo,.55],[10,2,vo,.6],[14,2,vo,.55]];break;
    case 'comp':var p0=rnd();ev=p0<0.4?[[0,2,vo,.62],[6,2,vo,.58]]:p0<0.7?[[2,2,vo,.6],[10,3,vo,.6]]:[[6,2,vo,.6],[14,2,vo,.55]];break;
    case 'bossa':ev=[[0,2,vo,.6],[3,2,vo,.55],[6,2,vo,.6],[10,2,vo,.6],[13,2,vo,.55]];break;
    case 'skank':ev=[[4,1,hi,.75],[12,1,hi,.75]];if(E>0.6){ev.push([6,1,hi,.45]);ev.push([14,1,hi,.45]);}break;
    case 'stabsOff':ev=[[2,1,hi,.7],[6,1,hi,.65],[10,1,hi,.7],[14,1,hi,.65]];break;}
  if(E<0.3&&kind!=='pads')ev=ev.filter(function(e,i){return i%2===0;});
  return ev;}
/* ---- step editor (groove) ---- */
var BGL=[['kick','Kick'],['snare','Snare'],['rim','Rim'],['clap','Clap'],['hat','Hi-hat'],['ohat','Open hat'],['ride','Ride'],['crash','Crash'],['tomhi','Tom hi'],['tomlo','Tom lo'],['shaker','Shaker'],['cowbell','Bell']];
var BDEG=['','R','3','5','7','8','6','↗'];
function bandGroove(){var B=GAR.band,k=B.meter,N=bandN();if(!B.groove[k]||B.groove[k].N!==N){B.groove[k]={N:N,d:{},b:new Array(N).fill(''),k:new Array(N).fill(0)};}return B.groove[k];}
function bandCapture(){var B=GAR.band,g=bandGroove(),N=g.N,c=bandPart(B.edit)[0],rnd=garRng(B.seed*31),E=B.pen[B.edit],d=bandDrumGen(E,rnd);g.d={};
  BGL.forEach(function(L){var p=garPad(L[0]);if(p<0)return;var row=new Array(N).fill(0);if(d[p])Object.keys(d[p]).forEach(function(s){var v=d[p][s].v;row[+s]=v>=0.9?2:v<0.5?3:1;});g.d[L[0]]=row;});
  var R=garBassRoot(c,28+B.bReg*12);g.b=new Array(N).fill('');bandBassGen(c,c,E,rnd).forEach(function(e){if(e[0]>=N)return;var iv=(e[2]-R+120)%12,code=e[2]>=R+12&&iv===0?'8':iv===0?'R':iv===3||iv===4?'3':iv===7?'5':iv===10||iv===11?'7':iv===9?'6':'↗';g.b[e[0]]=code;});
  g.k=new Array(N).fill(0);bandKeysGen(c,E,rnd,bandVoice(c)).forEach(function(e){if(e[0]<N)g.k[e[0]]=e[3]>=0.66?2:1;});
  B.gOn={d:true,b:true,k:true};markDirty();}
function bandGrooveBar(c,n,E){var B=GAR.band,g=bandGroove(),N=g.N,out={},bev=[],kev=[];
  if(B.gOn.d)Object.keys(g.d).forEach(function(nm){var p=garPad(nm);if(p<0)return;g.d[nm].forEach(function(v,s){if(v)bandHit(out,p,s,v===2?1:v===3?0.38:0.78);});});
  var R=garBassRoot(c,28+B.bReg*12),iv=bandTonesOf(c),NR=garBassRoot(n||c,28+B.bReg*12),hits=[];
  g.b.forEach(function(code,s){if(code)hits.push(s);});
  hits.forEach(function(s,j){var code=g.b[s],nx=j+1<hits.length?hits[j+1]:N,len=Math.max(1,Math.min(8,nx-s)),m=code==='R'?R:code==='8'?R+12:code==='3'?R+(iv[1]||4):code==='5'?R+(iv[2]||7):code==='7'?R+(iv.length>3&&iv[3]<12?iv[3]:10):code==='6'?R+9:NR+(NR>R?-1:1);bev.push([s,len,m,bandGroups().some(function(G){return G.s===s;})?0.92:0.78]);});
  var kh=[];g.k.forEach(function(v,s){if(v)kh.push(s);});
  kh.forEach(function(s,j){var nx=j+1<kh.length?kh[j+1]:N,len=B.kLen==='short'?Math.min(2,nx-s):Math.max(1,nx-s);kev.push([s,len,null,g.k[s]===2?0.75:0.58]);});
  return {d:out,b:bev,k:kev};}
/* ---- one bar of music ---- */
function bandPlan(o){var B=GAR.band,N=bandN(),E=clamp(o.E,0,1),rnd=garRng(B.seed*31+o.bar*7+(o.fill?3:0)),c=o.c,c2=c&&c[2]?c[2]:null,c1=c2?[c[0],c[1]]:c,sp=c2?bandSplitAt():N,pl={d:{},b:[],k:[],c:c1,c2:c2,sp:sp,N:N,vo:null};
  if(o.end||o.brk){var vo0=bandVoice(c1,o.prev);pl.vo=vo0;bandHit(pl.d,garPad('kick'),0,1);bandHit(pl.d,garPad('crash'),0,o.end?1:0.8);if(o.brk)bandHit(pl.d,garPad('snare'),0,0.8);
    pl.b=[[0,o.end?N-1:2,garBassRoot(c1,28+B.bReg*12),1]];pl.k=[[0,o.end?N-1:2,vo0,0.8]];return pl;}
  /* drums: half time stretches a bar over two, double time squeezes it */
  var dr;if(B.gOn.d){dr=bandGrooveBar(c1,o.n,E).d;}else if(B.time==='half'){var base=bandDrumGen(E,garRng(B.seed*31+(o.bar>>1)*7)),half=o.bar%2;dr={};
      Object.keys(base).forEach(function(p){Object.keys(base[p]).forEach(function(s){s=+s;if((s<N/2)===!half){var t=(s-(half?N/2:0))*2;if(t<N)bandHit(dr,+p,t,base[p][s].v,base[p][s].r);}});});}
    else if(B.time==='double'){var base2=bandDrumGen(E,rnd);dr={};Object.keys(base2).forEach(function(p){Object.keys(base2[p]).forEach(function(s){s=+s;if(s%2)return;[s/2,s/2+N/2].forEach(function(t){bandHit(dr,+p,t,base2[p][s].v,base2[p][s].r);});});});}
    else dr=bandDrumGen(E,rnd);
  if(o.fill)garFill(dr,N,Math.max(0.35,B.fills),1,rnd);
  if(o.first&&E>0.3&&!o.fill){bandHit(dr,garPad('crash'),0,0.55+0.4*E);}
  pl.d=dr;
  /* bass + keys: split bars use the second chord from the split point */
  var pieces=c2?[[c1,c2,0,sp],[c2,o.n,sp,N]]:[[c1,o.n,0,N]],prev=o.prev;
  pieces.forEach(function(P1){var ch=P1[0],nx=P1[1]||ch,a=P1[2],b=P1[3],vo=bandVoice(ch,prev);prev=vo;if(!pl.vo)pl.vo=vo;
    var gb=B.gOn.b||B.gOn.k?bandGrooveBar(ch,nx,E):null,bev=B.gOn.b?gb.b:bandBassGen(ch,nx,E,rnd),kev=B.gOn.k?gb.k.map(function(e){return [e[0],e[1],vo,e[3]];}):bandKeysGen(ch,E,rnd,vo).map(function(e){return [e[0],e[1],e[2],e[3]];});
    if(B.kLen==='short'&&!B.gOn.k)kev=kev.map(function(e){return [e[0],Math.min(e[1],2),e[2],e[3]];});
    bev.forEach(function(e){if(e[0]>=a&&e[0]<b)pl.b.push([e[0],Math.min(e[1],b-e[0]),e[2],e[3]]);});
    kev.forEach(function(e){if(e[0]>=a&&e[0]<b)pl.k.push([e[0],Math.min(e[1],b-e[0]),e[2],e[3]]);});});
  pl.vLast=prev;
  if(o.fill&&!/walk/.test(B.bS)&&!B.gOn.b){var R=garBassRoot(pieces[pieces.length-1][0],28+B.bReg*12),NR=garBassRoot(o.n||c1,28+B.bReg*12);pl.b=pl.b.filter(function(e){return e[0]<N-4;});pl.b.push([N-4,2,NR-2>R?NR-2:NR+2,.75]);pl.b.push([N-2,2,NR+(NR>R?-1:1),.8]);pl.k=pl.k.filter(function(e){return e[0]<N-4;});}
  /* push: hit the next chord an eighth early */
  if(B.push&&o.n&&!o.fill&&!o.noPush){var nb=o.n[2]?[o.n[0],o.n[1]]:o.n,lastC=pieces[pieces.length-1][0];if(nb[0]!==lastC[0]||nb[1]!==lastC[1]){pl.b=pl.b.filter(function(e){return e[0]<N-2;}).map(function(e){return [e[0],Math.min(e[1],N-2-e[0]),e[2],e[3]];});pl.k=pl.k.filter(function(e){return e[0]<N-2;}).map(function(e){return [e[0],Math.min(e[1],N-2-e[0]),e[2],e[3]];});
    var nv=bandVoice(nb,prev);pl.b.push([N-2,4,garBassRoot(nb,28+B.bReg*12),0.9]);if(B.kS!=='off')pl.k.push([N-2,4,nv,0.72]);pl.pushed=true;pl.vLast=nv;}}
  if(o.pushedIn){pl.b=pl.b.filter(function(e){return e[0]!==0;});pl.k=pl.k.filter(function(e){return e[0]!==0;});}
  return pl;}
function bandSwingOff(s,sd){var B=GAR.band,a=clamp(B.swing,0,1);if(!a||B.feel==='straight')return 0;
  if(B.feel==='s8'){var G=bandGroups(),g=null;G.forEach(function(x){if(s>=x.s&&s<x.s+x.l)g=x;});if(g&&g.l===4&&s-g.s===2)return sd*0.667*a;if(g&&g.l===4&&s-g.s===3)return sd*0.333*a;return 0;}
  return s%2===1?sd*0.5*a:0;}
function bandScaleName(c){var B=GAR.band,M=BMODE[B.mode]||BMODE.ionian;
  if(B.solo==='chord'&&c){var q=c[1],nm=GNOTE[c[0]];return nm+(/^(m7|min|m9|m6)$/.test(q)?' Dorian':/^(7|9|7sus4)$/.test(q)?' Mixolydian':/dim|m7b5/.test(q)?' Locrian':q==='mmaj7'?' melodic minor':q==='aug'||q==='augmaj7'?' whole-tone':/maj7|maj9/.test(q)?' Lydian':' Ionian');}
  return GNOTE[GAR.key]+' '+M.n;}
/* ---- transport ---- */
function bandTrack(kind){var f=-1;tracks.forEach(function(t,i){if(f<0&&i>0&&t.kind==='keys'&&(kind==='bass'?/bass/i.test(t.name):!/bass|guitar|gtr/i.test(t.name)))f=i;});
  if(f<0&&kind==='bass'){f=addInstTrack('Bass',true,'ebass');if(f>=0)toast('Added a Bass track.',1400);}return f<0?1:f;}
function bandRunning(){return !!(BR&&BR.on);}
function bandStart(){if(!ensureAudio())return;if(seq.on)transportStop();if(GAR.apOn>=0)garApStop();bandFix();var B=GAR.band,t0=ctx.currentTime+0.12;
  BR={on:true,part:B.edit,pb:0,barN:0,s:0,N:bandN(),next:t0,q:null,fillReq:false,brk:false,end:false,endBar:-1,marks:[],sq:[],bass:bandTrack('bass'),keys:bandTrack('keys'),prev:null,pushed:false};
  if(B.count){var G=bandGroups(),sd=stepDur();G.forEach(function(g,i){click(t0+g.s*sd,i===0);});BR.next=t0+bandN()*sd;}BR.t0=BR.next;BR.countEnd=BR.next;
  bandTrSnap();BR.timer=setInterval(bandTick,25);bandTick();bandUI();garUpd();}
function bandStop(){if(!BR)return;if(BR.T)bandTrFire(ctx.currentTime);clearInterval(BR.timer);BR.on=false;bandUI();garUpd();}
function bandToggle(){if(bandRunning())bandStop();else bandStart();}
function bandTick(){if(!BR||!BR.on||!ctx)return;var B=GAR.band,now=ctx.currentTime,sd=stepDur();
  while(BR.on&&BR.next<now+0.15){var t=BR.next;
    if(BR.s===0){if(BR.T&&BR.barN>=BR.T.bar){bandTrFire(t);sd=stepDur();}var N=bandN();BR.N=N;var prog=bandLive();
      if(BR.end){if(BR.endBar<0){BR.endBar=BR.barN;BR.plan=bandPlan({c:prog[BR.pb%prog.length]||prog[0],end:true,bar:BR.barN,E:B.pen[BR.part],prev:BR.prev});BR.marks.push({bar:BR.barN,t:t,part:BR.part,pb:BR.pb%prog.length,len:prog.length,c:BR.plan.c,c2:null,n:null,end:true,N:N,G:bandGroups()});}
        else{BR.on=false;clearInterval(BR.timer);setTimeout(function(){bandUI();garUpd();},Math.max(0,(t-now)*1000));return;}}
      else{if(BR.pb>=prog.length){BR.pb=0;if(BR.q){BR.part=BR.q;BR.q=null;prog=bandLive();}}
        var c=prog[BR.pb],last=BR.pb===prog.length-1,tk=BR.T&&!BR.T.cut?BR.T.bar-1-BR.barN:-1,inTr=tk>=0&&BR.T.L-tk*N>0,n=tk===0?bandTrTarget():last?(BR.q?bandPart(BR.q)[0]:prog[0]):prog[BR.pb+1],fe=B.fillEvery,auto=fe>0&&B.fills>0.05&&((prog.length>=fe?(BR.pb+1)%fe===0:last)),
            fill=BR.fillReq||(last&&!!BR.q)||auto,brk=BR.brk;BR.fillReq=false;BR.brk=false;
        BR.planO={c:c,n:n,fill:fill&&!brk&&!inTr,first:BR.pb===0,bar:BR.barN,E:B.pen[BR.part],prev:BR.prev,brk:brk,pushedIn:BR.pushed,noPush:tk===0};BR.plan=bandPlan(BR.planO);
        if(BR.accent){BR.accent=false;if(!brk){bandHit(BR.plan.d,garPad('crash'),0,0.9);var kp=garPad('kick');if(kp>=0&&!(BR.plan.d[kp]&&BR.plan.d[kp][0]))bandHit(BR.plan.d,kp,0,0.95);}}
        if(inTr&&!brk)bandTrApply(BR.plan,0);BR.prev=BR.plan.vLast||BR.plan.vo;BR.pushed=!!BR.plan.pushed;
        BR.marks.push({bar:BR.barN,t:t,part:BR.part,pb:BR.pb,len:prog.length,c:BR.plan.c,c2:BR.plan.c2,sp:BR.plan.sp,n:n,fill:fill,brk:brk,N:N,G:bandGroups()});if(BR.marks.length>8)BR.marks.shift();}}
    if(BR.T&&BR.T.items.tempo&&!BR.T.cut){var tp=BR.T.items.tempo,lf=(BR.T.bar-BR.barN)*BR.N-BR.s,rs=Math.abs(tp.bpm-tp.b0)<3?0:bandTr().int==='subtle'?Math.max(BR.N,BR.T.L):BR.T.L;if(lf>0&&lf<rs){BR.int=true;setParam('bpm',P.bpm.v+(tp.bpm-P.bpm.v)/(lf+1));BR.int=false;sd=stepDur();}}
    BR.sq.push([t,BR.barN,BR.s]);if(BR.sq.length>160)BR.sq.shift();
    bandPlayStep(BR.plan,BR.s,t,sd);
    BR.next+=sd;BR.s++;if(BR.s>=BR.N){BR.s=0;BR.pb++;BR.barN++;}}}
function bandPlayStep(pl,s,t,sd){var B=GAR.band,hum=B.human,dy=0.35+0.65*B.dyn,off=bandSwingOff(s,sd),jit=function(){return (Math.random()-0.5)*0.018*hum;},vh=function(v){return clamp(v*dy*(1-hum*0.18+Math.random()*hum*0.18),0.04,1);};
  if(!B.mD)Object.keys(pl.d).forEach(function(p){var e=pl.d[p][s];if(!e)return;var tt=t+off+jit(),v=vh(e.v)*B.lvD;if(e.r>1){for(var r=0;r<e.r;r++)trigPad(+p,v*(r?0.8:1),tt+r*sd/e.r);}else trigPad(+p,v,tt);});
  if(!B.mB&&BR.bass>0&&B.lvB>0.01)pl.b.forEach(function(e){if(e[0]!==s)return;playNote(BR.bass,e[2],vh(e[3])*B.lvB,t+off+jit(),Math.max(0.05,e[1]*sd*0.92));});
  if(!B.mK&&BR.keys>0&&B.lvK>0.01)pl.k.forEach(function(e){if(e[0]!==s)return;var tt=t+off+jit();e[2].forEach(function(m,j){playNote(BR.keys,m,vh(e[3])*B.lvK*(1-j*0.04),tt+j*0.004,Math.max(0.06,e[1]*sd*0.9));});});}
function bandSetPart(p){if(!bandRunning()){GAR.band.edit=p;garBand();return;}
  if(bandTrOn()){var qp=BR.T&&BR.T.items.part;if(qp&&(qp.p===p||BR.part===p))bandTrCancel('part');else if(BR.part!==p){bandTrQueue('part',{p:p});GAR.band.edit=p;}else GAR.band.edit=p;garBand();return;}
  BR.q=BR.part===p?null:p;GAR.band.edit=p;garBand();toast(BR.q?'Part '+p+' starts after this phrase, with a fill.':'Staying on part '+p+'.',1500);}
/* where the band is AUDIBLY: the last scheduled step at or before audio time `now`, with that bar's own meter groups (tempo/meter changes safe) */
function bandAt(now){var q=BR&&BR.sq||[],e=null,i,m=null,gi=0;for(i=q.length-1;i>=0;i--)if(q[i][0]<=now+1e-4){e=q[i];break;}if(!e)return null;
  BR.marks.forEach(function(x){if(x.bar===e[1])m=x;});var G=m&&m.G||bandGroups();G.forEach(function(g,j){if(e[2]>=g.s)gi=j;});return {bar:e[1],s:e[2],gi:gi,G:G};}
function bandPos(){var now=ctx.currentTime-(ctx.outputLatency||0),a=now<BR.t0?null:bandAt(now);if(!a)return {t:'Count in',c:true};return {t:(a.bar+1)+'.'+(a.gi+1),c:false};}
/* ---- smooth transitions, stage 1 (live only: bandToSong never sees them). While the band plays, a new key / tempo / meter / chord edit / part is queued
   (BR.T) to a bar line; the last T.L steps before it get lead-in material (pivot chords, bass walk, fill layer, tempo ramp). The downbeat never moves. ---- */
var BTRL={beat:'1 beat',half:'½ bar',bar:'1 bar',two:'2 bars'};
function bandTr(){var B=GAR.band;if(!B.tr)B.tr={};var d={on:true,int:'normal',len:'bar',at:'bar',d:true,b:true,k:true};Object.keys(d).forEach(function(k){if(B.tr[k]==null)B.tr[k]=d[k];});return B.tr;}
function bandTrOn(){return bandRunning()&&!BR.end&&bandTr().on;}
function bandTrSnap(){BR.live=JSON.parse(JSON.stringify(bandPart(BR.part)));BR.liveS=JSON.stringify(BR.live);BR.liveP=BR.part;}
function bandLive(){if(!bandTr().on)return bandPart(BR.part);if(!BR.live||BR.liveP!==BR.part)bandTrSnap();return BR.live;}
function bandTrLen(N){var l=bandTr().len,G=bandGroups();return l==='beat'?G[G.length-1].l:l==='half'?N-bandSplitAt():l==='two'?2*N:N;}
function bandTrTarget(){var T=BR.T,it=T.items,p=it.part?it.part.p:BR.part,prog=bandPart(p),c=prog[it.part?0:(BR.pb+(T.bar-BR.barN))%prog.length]||prog[0];c=[c[0],c[1]];if(it.key)c[0]=(c[0]+it.key.k-GAR.key+24)%12;return c;}
function bandTrQueue(type,it){var R=bandTr(),N=BR.N||bandN(),T=BR.T;
  if(!T){var L=bandTrLen(N),need=type==='tempo'&&R.int==='subtle'?Math.max(L,N):L,cur=BR.s>0?BR.barN:BR.barN-1,done=BR.s>0?BR.s:N,bar=cur+1,room;
    if(R.at==='phrase'||type==='part'){var len=bandLive().length,pbc=BR.s>0?BR.pb:BR.pb-1;bar=cur+Math.max(1,len-pbc);room=(bar-cur)*N-done;if(room<3){bar+=len;room+=len*N;}L=Math.min(L,room-1);}
    /* rule: land on the NEXT bar line if at least one beat is left in this bar (the lead-in is shortened to fit); with less than a beat left, the bar
       line after. "2 bars" keeps at least one full bar of lead-in. */
    else{var GG=bandGroups(),bt=GG[GG.length-1].l,need0=Math.max(bt,need-N+bt);room=N-done;while(room<need0){bar++;room+=N;}L=Math.min(L,room-1);}
    T=BR.T={bar:bar,L:L,items:{},cut:false,seed:BR.trN=(BR.trN||0)+1};}
  T.items[type]=it;if(BR.s>0&&BR.plan&&!BR.end){bandTrApply(BR.plan,BR.s+1);BR.prev=BR.plan.vLast||BR.plan.vo;}bandTrCue();}
function bandTrReplan(){if(BR.s>0&&BR.plan&&BR.plan._tr&&BR.planO){BR.plan=bandPlan(BR.planO);BR.prev=BR.plan.vLast||BR.plan.vo;}}
function bandTrCancel(type){var T=BR&&BR.T;if(!T)return;var it=T.items,n=0;Object.keys(it).forEach(function(k){if(type&&k!==type)return;n++;
    if(k==='prog')GAR.band.parts[BR.part]=JSON.parse(BR.liveS);if(k==='tempo'){BR.int=true;setParam('bpm',it[k].b0);BR.int=false;}if(k==='part')GAR.band.edit=BR.part;delete it[k];});
  if(!Object.keys(it).length){BR.T=null;bandTrReplan();}if(!n)return;markDirty();bandTrCue();if(GAR.inst==='band'&&GAR.view==='play'&&$('#bdNow'))garBand();toast('Change cancelled: the band carries on as it was.',1300);}
function bandTrCut(){var T=BR&&BR.T;if(!T||T.cut)return;T.cut=true;T.L=0;T.bar=BR.s>0?BR.barN+1:BR.barN;bandTrReplan();bandTrCue();toast('Hard cut on the next bar.',1000);}
function bandTrFire(t){var T=BR.T,it=T.items,B=GAR.band;BR.T=null;BR.firing=true;
  try{if(it.part){BR.part=it.part.p;BR.pb=0;BR.q=null;}
    if(it.key){var ok=GAR.key,om=GAR.minor;GAR.key=it.key.k;B.mode=it.key.mode;if(GAR.minor!==it.key.mi){GAR.minor=it.key.mi;}GAR.chords=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(GAR.minor?'m':'');if(!it.key.nk)bandKeyChanged(ok,om);if(typeof harmPaintKeys==='function')harmPaintKeys();}
    if(it.meter){B.meter=it.meter.m;bandFix();}
    if(it.tempo){BR.int=true;setParam('bpm',it.tempo.bpm);BR.int=false;}}catch(e){BR.int=false;}
  bandTrSnap();(BR.log=BR.log||[]).push({t:t,bar:BR.barN,items:Object.keys(it),cut:T.cut});if(BR.log.length>32)BR.log.shift();
  BR.firing=false;markDirty();setTimeout(function(){if(GAR.inst==='band'&&GAR.view==='play'&&$('#bdNow'))garBand();},Math.max(0,(t-ctx.currentTime)*1000));}
/* lead-in material for the bar being planned (or, from step `from`, for the bar already playing). Only steps inside the window are touched;
   step-editor grooves are never rewritten: user drums only get extra hits on empty steps, user bass/keys rows are left as written. */
function bandTrApply(pl,from){var T=BR.T;if(!T||T.cut||!pl||pl._tr||BR.end)return;var B=GAR.band,R=bandTr(),N=pl.N,k=T.bar-1-BR.barN;if(k<0)return;var span=T.L-k*N;if(span<=0)return;
  var ws=Math.max(N-span,0,from||0);if(ws>=N-1)return;var it=T.items,kind=it.key?'key':it.meter?'meter':(it.part||it.prog)?'prog':null;if(!kind)return;pl._tr=1;
  var lvl=R.int==='subtle'?0:R.int==='dramatic'?2:1,last=k===0,rnd=garRng(B.seed*131+T.seed*977+BR.barN*7),lo=28+B.bReg*12,G=bandGroups(),lb=G[G.length-1].s,tg=bandTrTarget(),i,
      cut=function(a,s){return a.filter(function(e){return e[0]<s;}).map(function(e){return [e[0],Math.min(e[1],s-e[0]),e[2],e[3]];});},
      prev=pl.vLast||pl.vo,segs=[],K=it.key?it.key.k:GAR.key,M=BMODE[it.key?it.key.mode:B.mode]||BMODE.ionian,mi=!!M.mi;
  /* key changes lead to the chord the band will actually land on (tg), not to the new tonic: V7/landing, or ii–V of it */
  if(kind==='key'){var tmi=/^(min|m7|m$|dim)/.test(tg[1]||''),V=[(tg[0]+7)%12,'7'],II=[(tg[0]+2)%12,tmi?'dim':'m7'];
    if(lvl===0){if(last)segs=[[Math.max(ws,lb),V]];}
    else{var sm=T.L>=4?Math.round((N+k*N-T.L/2)/2)*2:-1;if(sm>ws&&sm<N)segs=[[ws,II],[sm,V]];else if(sm>=N)segs=[[ws,II]];else segs=[[ws,V]];
      if(lvl===2&&last){var vs=segs[segs.length-1][0],hm=Math.round((vs+N)/4)*2;if(N-vs>=8&&hm>vs&&hm<N){segs[segs.length-1][1]=[(tg[0]+7)%12,'sus4'];segs.push([hm,V]);}}}}
  else if(lvl>0&&last&&lb>=ws){var v=Math.floor(rnd()*3);if(v===BR.trCh)v=(v+1)%3;BR.trCh=v;var t0=tg[0];
    if(lvl===2&&G.length>2&&G[G.length-2].s>=ws)segs.push([G[G.length-2].s,[(t0+2)%12,'m7']]);
    segs.push([lb,v===0?[(t0+7)%12,'7']:v===1?[(t0+11)%12,'dim']:[(t0+1)%12,'7']]);}
  if(R.k&&!B.gOn.k&&B.kS!=='off'&&segs.length){pl.k=cut(pl.k,segs[0][0]);
    segs.forEach(function(sg,j){var e=j+1<segs.length?segs[j+1][0]:N,vo=bandVoice(sg[1],prev);prev=vo;pl.k.push([sg[0],e-sg[0],vo,[0.5,0.66,0.82][lvl]]);
      if(lvl===2)G.forEach(function(g){if(g.s>sg[0]&&g.s<e)pl.k.push([g.s,Math.min(g.l,e-g.s),vo,0.7]);});});pl.vLast=prev;pl.pushed=false;}
  if(R.b&&!B.gOn.b){var NR=garBassRoot(tg,lo),wn=last?lvl+1:0,wp=[];for(i=wn;i>=1;i--)if(N-2*i>=ws)wp.push(N-2*i);
    var b0=wp.length?wp[0]:N,bs=segs.length?Math.min(segs[0][0],b0):b0;
    if(bs<N){pl.b=cut(pl.b,bs);pl.pushed=false;
      segs.forEach(function(sg,j){var e=Math.min(b0,j+1<segs.length?segs[j+1][0]:N);if(sg[0]<e)pl.b.push([sg[0],e-sg[0],garBassRoot(sg[1],lo),0.85]);});
      var sc=(kind==='key'&&mi?[0,2,3,5,7,8,11]:M.pent?(mi?BMODE.aeolian.s:BMODE.ionian.s):M.s).map(function(x){return (K+x)%12;}),up=rnd()<0.7,wk=[],q=NR;
      if(lvl===2&&kind!=='key'){for(i=wp.length;i>=1;i--)wk.push(up?NR-i:NR+i);}
      else{while(wk.length<wp.length){q+=up?-1:1;if(sc.indexOf(((q%12)+12)%12)>=0){if(up)wk.unshift(q);else wk.unshift(q);}if(Math.abs(q-NR)>12)break;}}
      wp.forEach(function(s,j){if(wk[j]!=null)pl.b.push([s,2,wk[j],0.76+0.05*j]);});}}
  if(R.d){var D=pl.d,K0=garPad('kick'),S=garPad('snare'),H=garPad('hat'),add=function(p,s,vv,r){if(p<0||s<ws||s>=N)return;if(B.gOn.d&&D[p]&&D[p][s])return;bandHit(D,p,s,vv,r);};
    if(!last){if(lvl===2)G.forEach(function(g,j){if(g.s>=N/2)add(S,g.s,0.45+0.08*j);});}
    else if(lvl===0){add(H,N-2,0.6);add(S,N-1,0.3);}
    else{var amt=kind==='key'?(lvl===2?0.75:0.3):(lvl===2?0.95:0.55),F,sig,tries=0;
      do{var tmp={};garFill(tmp,N,amt,1,rnd);F=[];Object.keys(tmp).forEach(function(p){Object.keys(tmp[p]).forEach(function(s){F.push([+p,+s,tmp[p][s].v,tmp[p][s].r]);});});
        var fv=BR.trVar=((BR.trVar||0)+1+Math.floor(rnd()*2))%3;
        if(fv===1)F=F.filter(function(h){return (N-h[1])%4!==3||h[1]>=N-2;});
        else if(fv===2){F=F.filter(function(h){return (N-h[1])%4!==2||h[1]>=N-3;});[N-6,N-3].forEach(function(s){if(s>=0&&K0>=0)F.push([K0,s,0.8,1]);});}
        F=F.filter(function(h){return h[1]>=ws;});F.sort(function(a,b){return a[1]-b[1]||a[0]-b[0];});sig=JSON.stringify(F);}while(sig===BR.trSig&&++tries<4);
      BR.trSig=sig;if(!B.gOn.d&&F.length){var f0=F[0][1];Object.keys(D).forEach(function(p){if(+p===K0)return;for(var s=f0;s<N;s++)delete D[p][s];});}
      F.forEach(function(h){add(h[0],h[1],h[2],h[3]);});}
    if(last&&(lvl===2||kind==='meter'))BR.accent=true;}}
function bandTrTempo(v){if(!bandTrOn()||BR.int)return false;v=clamp(v,P.bpm.min,P.bpm.max);var q=BR.T&&BR.T.items.tempo,b0=q?q.b0:P.bpm.v;
  if(Math.abs(v-b0)<0.01){if(q)bandTrCancel('tempo');return !!q;}if(q){q.bpm=v;bandTrCue();return true;}bandTrQueue('tempo',{bpm:v,b0:b0});return true;}
function bandKeyReq(k,mi,mode,nk){if(!bandTrOn())return false;var B=GAR.band,q=BR.T&&BR.T.items.key;if(k==null)k=q?q.k:GAR.key;if(mode==null)mode=mi==null?(q?q.mode:B.mode):(mi?'aeolian':'ionian');
  if(k===GAR.key&&mode===B.mode){if(q)bandTrCancel('key');else garBand();return true;}
  bandTrQueue('key',{k:k,mi:!!(BMODE[mode]||{}).mi,mode:mode,nk:!!nk&&k===GAR.key});garBand();return true;}
function bandTrCheck(){if(!bandTrOn()||BR.firing)return;bandLive();var q=BR.T&&BR.T.items.prog;
  if(JSON.stringify(bandPart(BR.part))!==BR.liveS){if(!q)bandTrQueue('prog',{});}else if(q){delete BR.T.items.prog;if(!Object.keys(BR.T.items).length){BR.T=null;bandTrReplan();}}}
function bandTrLabel(T){var it=T.items,a=[];if(it.part)a.push('Part '+it.part.p);if(it.key)a.push(GNOTE[it.key.k]+' '+(it.key.mode==='ionian'?'major':it.key.mode==='aeolian'?'minor':(BMODE[it.key.mode]||{}).n));
  if(it.meter)a.push(BMETN[it.meter.m]||it.meter.m);if(it.tempo)a.push(Math.round(it.tempo.bpm)+' BPM');if(it.prog&&!it.part)a.push('new chords');return '→ '+a.join(' · ');}
function bandTrCue(){var e=$('#bdTr');if(!e)return;var T=bandRunning()&&BR.T,R=bandTr(),txt,cb=e.querySelector('[data-trx="cut"]'),cc=e.querySelector('[data-trx="cancel"]');
  if(!T)txt=R.on?'Smooth transitions on · changes wait for the '+(R.at==='phrase'?'phrase end':'bar line'):'Smooth transitions off · changes apply at once';
  else{var G=bandGroups(),left,au=bandAt(ctx.currentTime-(ctx.outputLatency||0));
    if(!au)left=(T.bar+(GAR.band.count?1:0))*G.length;else{G=au.G;left=Math.max(1,(T.bar-au.bar)*G.length-au.gi);}
    var bars=left/G.length;txt=bandTrLabel(T)+' in '+(left%G.length===0?bars+(bars===1?' bar':' bars'):left+(left===1?' beat':' beats'))+(T.cut?' · cut':'');}
  if(e._s!==txt){e._s=txt;$('#bdTrT').textContent=txt;e.title='A change lands on the next bar line; with less than a beat left in the bar it lands on the one after, and the lead-in is shortened to fit.';e.classList.toggle('q',!!T);cc.hidden=!T;cb.hidden=!T||!!T.cut;}}
/* ---- learn chords from the mic ---- */
var BTPL={maj:[0,4,7],min:[0,3,7],'7':[0,4,7,10],m7:[0,3,7,10]};
function bandChroma(x,sr,a,b){var F=8192,FF=fftInit(F),win=new Float64Array(F),S=new Float64Array(128),n=0,i;for(i=0;i<F;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/F);
  for(var st=a;st+F<=b;st+=F/2){var re=new Float64Array(F),im=new Float64Array(F),e=0;for(i=0;i<F;i++){re[i]=x[st+i]*win[i];e+=x[st+i]*x[st+i];}if(e/F<1e-6)continue;fft(FF,re,im,false);n++;
    var T=new Float64Array(128);for(var k=Math.ceil(60*F/sr);k<Math.min(F/2,2100*F/sr);k++){var f=k*sr/F,m=Math.round(12*Math.log2(f/440))+69,v=Math.hypot(re[k],im[k]);if(v>T[m])T[m]=v;}
    for(var m=36;m<100;m++)S[m]+=T[m];}
  if(!n)return null;var H=[[12,0.7],[19,0.6],[24,0.5],[28,0.4],[31,0.35]];for(var m=36;m<100;m++){if(S[m]<=0)continue;H.forEach(function(h){var j=m+h[0];if(j<128)S[j]=Math.max(0,S[j]-S[m]*h[1]);});}
  var ch=new Array(12).fill(0),mx=0;for(m=36;m<100;m++)ch[m%12]+=Math.sqrt(S[m]);for(i=0;i<12;i++)mx=Math.max(mx,ch[i]);return mx>0?ch.map(function(v){return v/mx;}):null;}
function bandMatch(ch){var best=null,bs=-1e9,tot=0;for(var p=0;p<12;p++)tot+=ch[p];for(var r=0;r<12;r++){Object.keys(BTPL).forEach(function(q){var iv=BTPL[q],inS=0,outS=0;for(var p=0;p<12;p++){var d=((p-r)%12+12)%12;if(iv.indexOf(d)>=0)inS+=ch[p]*(d===0?1.4:d===10||d===11?0.8:1);else outS+=ch[p];}
 var s=inS/Math.sqrt(iv.length)-0.6*outS/Math.sqrt(12-iv.length);if(iv.length>3)s-=0.12;if(s>bs){bs=s;best=[r,q];}});}return best;}
function bandKey(tot){var MJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],MN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17],best=[0,false],bs=-1e9;
  for(var r=0;r<12;r++)[[MJ,false],[MN,true]].forEach(function(P1){var s=0;for(var p=0;p<12;p++)s+=tot[(p+r)%12]*P1[0][p];if(s>bs){bs=s;best=[r,P1[1]];}});return best;}
function bandLearn(){if(!ensureAudio())return;if(bandRunning())bandStop();if(seq.on)transportStop();var B=GAR.band,bars=B.learnBars,btn=$('#bdLearn');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('This browser cannot use the microphone.');return;}
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(st){
    var src=ctx.createMediaStreamSource(st),sp=ctx.createScriptProcessor(4096,1,1),mute=G(0),chunks=[],sd=stepDur(),N=bandN(),barT=N*sd,GR=bandGroups(),t0=ctx.currentTime+0.2,ts=t0+barT,te=ts+bars*barT,lat=(typeof recLatency==='function'?recLatency():0.04);
    for(var k=0;k<=bars;k++)GR.forEach(function(g,i){click(t0+k*barT+g.s*sd,i===0);});
    sp.onaudioprocess=function(e){var d=e.inputBuffer.getChannelData(0);chunks.push({t:e.playbackTime-lat-d.length/ctx.sampleRate,d:new Float32Array(d)});
      var now=ctx.currentTime;if(btn)btn.textContent=now<ts?'Count-in…':'Listening… bar '+Math.min(bars,Math.floor((now-ts)/barT)+1)+'/'+bars;};
    src.connect(sp);sp.connect(mute);mute.connect(ctx.destination);
    setTimeout(function(){try{src.disconnect();sp.disconnect();mute.disconnect();}catch(e){}st.getTracks().forEach(function(x){x.stop();});if(btn)btn.textContent='Analysing…';
      setTimeout(function(){var sr=ctx.sampleRate,n=Math.ceil((te-ts)*sr),x=new Float32Array(n);chunks.forEach(function(c){var o=Math.round((c.t-ts)*sr);for(var i=0;i<c.d.length;i++){var j=o+i;if(j>=0&&j<n)x[j]=c.d[i];}});
        var bl=Math.round(barT*sr),res=[],tot=new Array(12).fill(0),prev=null,heard=0;
        for(var i=0;i<bars;i++){var ch=bandChroma(x,sr,i*bl+Math.round(bl*0.04),(i+1)*bl);if(ch){heard++;ch.forEach(function(v,p){tot[p]+=v;});prev=bandMatch(ch);}res.push(prev);}
        if(btn)btn.textContent='Learn chords from my playing';
        if(!heard){toast('I could not hear anything. Play louder or closer to the microphone, then try again.',3000);return;}
        for(i=0;i<res.length;i++)if(!res[i])res[i]=res.find(function(r){return r;});
        var ky=bandKey(tot);B.parts[B.edit]=res;markDirty();
        toast('Learned '+bars+' bars: '+res.map(bandChName).join(' · ')+'. Key looks like '+GNOTE[ky[0]]+(ky[1]?' minor':' major')+'.',4200);
        if(ky[0]!==GAR.key||ky[1]!==!!(BMODE[B.mode]||{}).mi)B.keyHint=ky;garBand();},30);},Math.max(0,(te-ctx.currentTime+0.3)*1000));
    toast('Count-in, then play your chords for '+bars+' bars — one chord per bar.',2600);
  }).catch(function(){toast('Microphone permission was refused.');});}
/* ---- add to song: same generator as live, written as patterns + timeline clips ---- */
function bandToSong(reps){var B=GAR.band;bandFix();var prog=bandPart(B.edit),N=bandN(),per=Math.max(1,Math.floor(64/N)),bars=prog.length*reps,chunks=Math.ceil(bars/per),free=[];
  for(var i=0;i<patterns.length&&free.length<chunks;i++)if(!patHas(patterns[i]))free.push(i);
  if(free.length<chunks){toast('Not enough empty patterns ('+chunks+' needed). Clear some patterns, or use fewer bars.',3200);return false;}
  var bassT=bandTrack('bass'),keysT=bandTrack('keys'),st0=Math.ceil(arrEnd()/16)*16,pos=st0,prev=null,pushed=false;
  for(var ck=0;ck<chunks;ck++){var pi=free[ck],pt=patterns[pi],nb=Math.min(per,bars-ck*per),len=nb*N;pt.len=len;pt.locks=pt.locks||{};pt.drums.forEach(function(a){for(var s=0;s<64;s++)a[s]=false;});pt.notes[bassT]=[];pt.notes[keysT]=[];
    for(var bb=0;bb<nb;bb++){var gb=ck*per+bb,pb=gb%prog.length,c=prog[pb],n=prog[(pb+1)%prog.length],fe=B.fillEvery,fill=fe>0&&B.fills>0.05&&(prog.length>=fe?(pb+1)%fe===0:pb===prog.length-1);
      var pl=bandPlan({c:c,n:n,fill:fill,first:pb===0,bar:gb,E:B.pen[B.edit],prev:prev,pushedIn:pushed});prev=pl.vLast||pl.vo;pushed=!!pl.pushed;var off=bb*N,dy=0.35+0.65*B.dyn;
      var shift=function(s){return off+s+bandSwingOff(s,1);};
      if(!B.mD)Object.keys(pl.d).forEach(function(p){Object.keys(pl.d[p]).forEach(function(s){var e=pl.d[p][s],k=off+(+s);if(k<64){pt.drums[+p][k]=Math.round(clamp(e.v*dy*B.lvD,0.05,1)*100)/100;if(e.r>1)pt.locks[p+':'+k]={p:0,l:1,r:e.r};}});});
      if(!B.mB)pl.b.forEach(function(e){pt.notes[bassT].push({s:Math.round(shift(e[0])*100)/100,l:e[1],m:e[2],v:Math.round(e[3]*dy*B.lvB*100)/100});});
      if(!B.mK)pl.k.forEach(function(e){e[2].forEach(function(m){pt.notes[keysT].push({s:Math.round(shift(e[0])*100)/100,l:e[1],m:m,v:Math.round(e[3]*dy*B.lvK*100)/100});});});}
    [0,bassT,keysT].forEach(function(ti){if(ti===0||pt.notes[ti].length)newClip({type:'pat',ti:ti,s:pos,l:len,p:pi,o:0});});pos+=len;}
  if(B.feel==='s16'&&B.swing>0)setParam('swing',clamp(B.swing*0.5,0,P.swing.max));renderPatSegs();dawNeed=true;markDirty();
  toast('Part '+B.edit+' ×'+reps+' added to Tracks from bar '+(st0/16+1)+(N!==16?' ('+B.meter+' bars; the rest of the song stays in 4/4)':'')+'.',3600);return st0;}
/* ===== Song › Sections (composer section cards) + Smooth Transitions stage 2 =====
   Sections and the Studio timeline are two views of the same song: "Build song" writes each section's band/pads material and the
   transition material onto the timeline as tagged clips (c.gen = section key, c.tx = 'auto' for transitions). Rebuilding regenerates
   only untouched generated clips; a generated clip the user edited (moved, resized, notes changed) or froze becomes the user's and is never touched. */
