var SMPBASE='samples/';
/* n = root notes; g = per-zone gain trim in dB (loudness-matched offline: RMS of the first 300 ms, fitted across the range);
   l = precomputed pitch-synchronous loop [start s, end s, crossfade s, linear?] per zone for sustained instruments (0 = none) */
var SMPM={"gtr-electric":{"n":[37,40,45,48,51,54,57,60,63,66,69,72,75,78,81,84],"g":[4.5,0.5,-0.3,0,-1.1,1.5,-0.4,0.1,-1.6,0,-2.7,-0.5,-2.3,3.3,3.9,0.8]},"gtr-acoustic":{"n":[38,41,44,47,50,53,56,59,62,65,68,71,74],"g":[-1.5,1.6,0.1,-0.2,0.3,0,-2.3,-1.1,1.7,0.8,-1.7,3.4,-1.8]},"gtr-nylon":{"n":[35,38,42,45,49,52,55,59,63,66,69,73,76,79,82],"g":[3.1,2.1,-1,0.6,-0.8,1.3,-1.6,-1.7,-3.2,3.6,4.8,0,-0.8,3.7,0]},"bass-electric":{"n":[25,28,31,34,37,40,43,46,49,52,55,58,61,64,67,70,73],"g":[-0.7,-0.2,-0.5,0.4,0.2,-0.4,-0.4,1.1,1.2,0.9,0.6,-0.4,0.5,0,-1.1,-1,0.2]},"violin":{"n":[55,60,64,67,72,76,79,84,88,91,96],"g":[0.1,-1.4,0.9,1.8,0,-0.8,-0.4,-1.6,2.6,0.8,-1.1],"l":[[0.18619,0.48719,0.0102,1],[0.36723,0.76848,0.00764,1],[0.7293,1.02937,0.1,0],[0.91034,1.21156,0.1,0],[0.51206,0.81218,0.00601,1],[0.58447,0.8849,0.04,0],[0.2224,0.52206,0.1,0],[0.36723,0.66721,0.1,0],[0.36723,0.66757,0.1,0],[0.83791,1.33794,0.1,0],[0.7293,1.02941,0.04,0]]},"cello":{"n":[36,39,43,46,49,52,55,58,61,64,67,71],"g":[-1.7,-5.6,-6,-6.1,-7.7,-8.5,-4,-4.5,-4.2,6,-4.4,-6.8],"l":[[0.83791,1.14372,0.03,1],[1.01896,1.31481,0.02571,1],[0.76551,1.06175,0.02041,1],[0.87413,1.17433,0.01717,1],[0.91034,1.61029,0.01442,1],[0.51206,0.80984,0.1,0],[1.09136,1.59145,0.1,0],[0.91034,1.21098,0.04,0],[0.51206,0.8112,0.00721,1],[0.7293,1.02986,0.04,0],[0.87413,1.17531,0.04,0],[1.16379,1.46358,0.00601,1]]},"flute":{"n":[60,64,69,72,76,81,84,88,93,96],"g":[5.1,-1.3,-3,-2.1,-3.7,-3.3,-0.7,-1.7,6,-2.1],"l":[[0.65689,0.95531,0.1,0],[0.36723,0.66769,0.04,0],[1.12757,1.52776,0.1,0],[0.69308,0.99297,0.04,0],[0.47585,0.7761,0.00601,1],[0.69308,0.99315,0.00601,1],[0.15,0.44998,0.00601,1],[0.18619,0.5858,0.1,0],[0.94653,1.2466,0.00601,1],[0.15,0.45002,0.00601,1]]},"clarinet":{"n":[50,53,58,62,65,70,74,77,82,86,89],"g":[4.1,-2.8,-5.5,-5.4,-5.7,-6.4,-4.7,6,-4.6,-4.9,-3],"l":[[0.83791,1.1371,0.01363,1],[0.33102,0.62855,0.01145,1],[0.51206,0.81227,0.00857,1],[0.80172,1.10111,0.0068,1],[0.7293,1.02973,0.1,0],[0.94653,1.24667,0.00601,1],[0.76551,1.16549,0.1,0],[0.69308,0.99379,0.1,0],[0.65689,1.05705,0.1,0],[0.87413,1.17372,0.00601,1],[0.65689,0.95676,0.1,0]]},"sax":{"n":[49,52,55,58,61,64,67,70,73,76,79],"g":[-3.2,1.5,3.2,-1.5,2.7,-2.1,3.4,-1,1.5,-0.4,0],"l":[[0.94653,1.24957,0.01442,1],[1.16379,1.46109,0.01213,1],[1.12757,2.72971,0.0102,1],[0.58447,2.18476,0.00857,1],[0.58447,1.78576,0.00721,1],[0.58447,1.48544,0.00608,1],[0.36723,0.86721,0.00601,1],[0.51206,0.91122,0.00601,1],[1.01896,1.91916,0.00601,1],[0.98274,2.5829,0.00601,1],[0.76551,1.06528,0.00601,1]]},"trumpet":{"n":[48,53,57,63,67,74,77,81,84],"g":[-0.9,1,1.8,1.5,-0.8,-1.4,0,-0.4,2.2],"l":[[0.80172,1.09946,0.01528,1],[0.25862,0.55639,0.1,0],[0.43964,0.83984,0.1,0],[0.83791,1.33955,0.1,0],[0.43964,0.74068,0.00601,1],[0.7293,1.12955,0.00601,1],[0.18619,0.48673,0.1,0],[0.87413,1.17404,0.1,0],[0.58447,0.88447,0.00601,1]]},"trombone":{"n":[34,37,41,44,48,51,56,60,63],"g":[-8.1,-11.6,-10,0.9,6,0.9,-4.8,-18,-18],"l":[[0.47585,0.76746,0.03,1],[0.98274,1.28585,0.02887,1],[0.91034,1.20819,0.0229,1],[0.51206,0.81032,0.01925,1],[1.05517,1.3532,0.01528,1],[0.65689,0.95952,0.1,0],[0.51206,0.81102,0.00964,1],[0.62068,0.91878,0.00764,1],[0.36723,0.66619,0.00642,1]]},"horn":{"n":[33,36,39,43,50,53,57,60,74,77],"g":[1,-0.9,-0.5,2.9,1.9,-0.8,0.3,-0.3,-1.2,2.3],"l":[[0.76551,1.16553,0.03,1],[0.36723,0.67299,0.03,1],[0.83791,1.13363,0.02571,1],[0.76551,1.06143,0.02041,1],[0.54825,0.84785,0.01363,1],[0.91034,1.20812,0.01145,1],[0.98274,1.48279,0.00909,1],[0.25862,0.55671,0.00764,1],[0.65689,0.95653,0.00601,1],[0.83791,1.13857,0.00601,1]]},"tuba":{"n":[29,34,39,46,50,53,58,62],"g":[0.7,-0.3,-0.3,0.9,-0.9,-2.1,0.3,1.4],"l":[[0.29481,0.59075,0.1,0],[0.80172,1.19778,0.03,1],[0.76551,1.06186,0.02571,1],[1.01896,1.3198,0.01717,1],[0.58447,0.88449,0.01363,1],[0.43964,0.73735,0.01145,1],[0.25862,0.55927,0.04,0],[0.76551,1.06544,0.0068,1]]},"harp":{"n":[28,31,35,38,41,45,48,52,55,59,62,65,69,72,76,79,83,86,89,93,98,101],"g":[1.1,4.4,0.8,0.2,0.6,-1,-2.8,-0.6,-1.8,-3.4,-1.6,-5.4,2.2,2.6,-4.9,1.7,-4.8,-0.8,0.3,0,0,1.5]},"xylophone":{"n":[67,72,79,84,91,96,103,108],"g":[2.5,-0.1,-3.3,-3.3,1,-2.5,0.1,1.3]},"organ":{"n":[24,27,30,33,36,39,42,45,48,51,54,57,60,63,66,69,72,75,78,81,84],"g":[-0.6,1.5,0,-1.2,0.8,0.4,0.6,0.3,0,-1.7,-2,-2,2.8,0.5,-1.1,-0.7,0.1,-0.5,1.5,-1.5,1.5],"l":[[0.87413,1.36397,0.1,0],[0.94653,1.35703,0.1,0],[0.62068,0.92281,0.1,0],[0.47585,0.87546,0.03,1],[0.94653,1.45009,0.1,0],[0.2224,0.51764,0.1,0],[1.01896,1.41898,0.1,0],[0.18619,0.68692,0.1,0],[0.36723,1.07113,0.1,0],[0.69308,0.99542,0.01286,1],[0.33102,0.73109,0.04,0],[0.58447,0.88447,0.04,0],[0.43964,0.84079,0.1,0],[0.80172,1.10088,0.1,0],[0.65689,0.95689,0.04,0],[0.43964,0.73946,0.1,0],[0.65689,0.95683,0.04,0],[0.7293,1.02993,0.04,0],[0.7293,1.02941,0.00601,1],[0.69308,0.99299,0.1,0],[0.43964,0.73975,0.1,0]]},"harmonium":{"n":[36,39,42,45,48,51,54,57,60,63,67,70,73],"g":[0,0.2,-1,0.1,1.6,-0.9,2.4,-2.9,-0.9,-2,-0.1,0.7,1.1],"l":[[1.05517,1.45254,0.04,0],[0.94653,1.44689,0.1,0],[0.76551,1.06735,0.02163,1],[0.33102,0.63122,0.1,0],[0.43964,0.83735,0.1,0],[0.15,0.65134,0.1,0],[0.43964,0.73719,0.1,0],[0.29481,0.59517,0.1,0],[0.98274,1.28116,0.1,0],[0.87413,1.37526,0.1,0],[0.87413,1.37433,0.1,0],[0.7293,1.02943,0.1,0],[0.62068,0.92011,0.1,0]]},"piano":{"n":[23,27,31,35,38,41,45,48,52,55,58,62,65,69,72,76,79,82,85,88,91],"v":2,"g":[2.6,0.1,-0.2,2.1,-0.9,-3.1,-3.9,-3,-2.5,0.5,-6.6,-2.3,-6.1,-5.2,-6.4,-0.5,3.5,-0.8,-0.8,3.9,6]},"rhodes":{"n":[29,35,40,45,50,55,59,62,65,71,76,81,86,91,96],"v":2,"g":[-0.1,-0.6,-1.2,-3,-2.5,-3.1,-4.2,-4.4,-3.2,-1.7,-3.5,-1,-2.5,0,6]},"upright":{"n":[24,31,38,41,45,48,52,55],"v":2,"g":[0.2,-1.1,-2.6,0.5,-0.2,0.5,0.2,-1.8]}};
var SMP={cache:{},loading:{},fail:{}};
function smpDecode(ab){return new Promise(function(res,rej){try{var p=ctx.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej);}catch(e){rej(e);}});}
/* drop encoder padding and silence before the attack, so hits land on the grid */
function smpTrim(b){var d=b.getChannelData(0),n=d.length,i=0,th=0.0025;while(i<n&&Math.abs(d[i])<th)i++;i=Math.max(0,i-24);if(i<8)return b;var o=ctx.createBuffer(b.numberOfChannels,n-i,b.sampleRate);for(var c=0;c<b.numberOfChannels;c++)o.getChannelData(c).set(b.getChannelData(c).subarray(i));return o;}
var SMPALT='https://ecou.geoptimize.io/';
function smpGet(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status+' '+url);return r.arrayBuffer();});}
/* samples live next to the page; if they are not there (for example inside a preview), fall back to the published copy */
function smpFetch(url){var alt=SMPALT+url;var first=SMP.alt?smpGet(alt):smpGet(url).catch(function(){return smpGet(alt).then(function(ab){SMP.alt=true;return ab;});});return first.then(smpDecode).then(smpTrim);}
/* level trim baked into the decoded buffer (no second lossy encode) */
function smpGain(b,db){if(!db)return b;var g=Math.pow(10,db/20);for(var c=0;c<b.numberOfChannels;c++){var d=b.getChannelData(c);for(var i=0;i<d.length;i++)d[i]*=g;}return b;}
function smpLoad(id){
  if(SMP.cache[id])return Promise.resolve(SMP.cache[id]);if(SMP.loading[id])return SMP.loading[id];
  var M=SMPM[id];if(!M||!ctx)return Promise.reject(new Error('unknown'));var L=M.v||1,jobs=[];
  M.n.forEach(function(m,zi){for(var v=1;v<=L;v++)(function(m,v){jobs.push(smpFetch(SMPBASE+id+'/'+m+(M.v?'_'+v:'')+'.mp3').then(function(b){smpGain(b,M.g?M.g[zi]:0);if(M.l&&M.l[zi])b._lp=M.l[zi];return {buf:b,root:mtof(m),m:m,v:v,vn:L};}));})(m,v);});
  SMP.loading[id]=Promise.all(jobs).then(function(z){SMP.cache[id]=z;delete SMP.loading[id];return z;},function(e){delete SMP.loading[id];SMP.fail[id]=1;throw e;});
  return SMP.loading[id];
}
/* replace the stand-in sound on every track that uses this recorded instrument */
function smpUpgrade(sid){
  tracks.forEach(function(t,ti){var S=ti===selTrack?null:t.sound;if(S&&S.slots&&S.slots.A&&S.slots.A.stock===sid){var nw=stockSlot(sid);if(nw)S.slots.A=nw;}});
  if(slots.A&&slots.A.stock===sid){var s=stockSlot(sid);if(s){slots.A=s;try{slotUI('A');saveSound(selTrack);}catch(e){}}}
  try{renderStockChips();}catch(e){}try{if(typeof garSoundSel==='function')garSoundSel();}catch(e){}
}
function smpEnsure(sid,quiet){var D=STOCK[sid];if(!D||!D.smp||SMP.cache[D.smp]||SMP.fail[D.smp])return;
  if(!quiet&&!SMP.loading[D.smp])toast('Loading '+D.name+'…',1400);
  smpLoad(D.smp).then(function(){smpUpgrade(sid);if(!quiet)toast(D.name+' ready.',1000);},function(){if(!quiet)toast(D.name+' could not be loaded, so a synthesized version plays. Check your connection.',3200);});}
/* velocity-aware zone pick: nearest pitch, then the layer that matches how hard the note is played */
function zoneFor(slot,freq,vel){if(!slot.zones)return slot;var best=slot.zones[0],bd=1e9;slot.zones.forEach(function(z){var d=Math.abs(Math.log(freq/z.root));if(d<bd-1e-9){bd=d;best=z;}});
  if(best.vn>1){var want=vel==null?best.vn:Math.min(best.vn,1+Math.floor(clamp(vel,0,0.999)*best.vn*1.15));slot.zones.forEach(function(z){if(z.m===best.m&&z.v===want)best=z;});}return best;}
/* acoustic drum kit with three velocity layers per drum */
var KITAC=[['Kick','kick'],['Snare','snare'],['Clap','snare'],['Rim','perc'],['Closed Hat','hat'],['Open Hat','hat'],['Shaker','hat'],['Cowbell','perc'],['Tom Lo','perc'],['Tom Mid','perc'],['Tom Hi','perc'],['Crash','hat'],['Pedal Hat','hat'],['Ride','hat']];
/* per-piece trims in dB (measured offline, RMS of the first 300 ms) so pieces sit at musical levels: kick/snare 0, toms -2..-3, crash -5, open hat -6, closed hat/ride -8, rim -7, shaker/cowbell -9..-10, pedal hat -11 */
var KITAC_G=[-1.9, 1.1, 3.0, 1.2, 2.4, -0.0, -2.6, -2.3, -4.4, -4.5, -7.6, -3.4, 1.9, 0.3];
function loadAcousticKit(quiet,auto){
  if(!ensureAudio())return Promise.resolve();
  var go=function(z){if(auto&&(GAR.kit||kitSig()!==KITFAC))return;if(auto)histQuiet(function(){go2(z);});else go2(z);};
  var go2=function(z){pads.forEach(function(p){p.vb=null;});KITAC.forEach(function(x,i){var p=pads[i],L=z[i];p.vb=L;p.buf=L[1];p.name=x[0];p.cls=x[1];p.tune=0;p.decay=1;p.level=0.9;p.pan=x[1]==='hat'?0.15:(i>=8&&i<=10?[-0.3,0,0.3][i-8]:i===13?0.25:i===11?-0.2:0);p.choke=(i===4||i===5||i===12)?1:0;});
    try{renderPads();selectPad(padSel);}catch(e){}markDirty();if(!quiet)toast('Acoustic kit loaded: real drums with three dynamics each.',2000);GAR.kit='acoustic';};
  if(SMP.cache.kit)return Promise.resolve(go(SMP.cache.kit));
  if(!quiet)toast('Loading the acoustic kit…',1400);
  var jobs=KITAC.map(function(x,i){return Promise.all([1,2,3].map(function(v){return smpFetch(SMPBASE+'kit-acoustic/'+i+'_'+v+'.mp3').then(function(b){return smpGain(b,KITAC_G[i]);});}));});
  return Promise.all(jobs).then(function(z){SMP.cache.kit=z;go(z);},function(){toast('The acoustic kit could not be loaded. Check your connection.',3000);});
}

/* ===================== AMPS & PEDALS (per track) =====================
   A guitar rig inserted after the track's filter: compressor → overdrive → distortion → fuzz → amp (preamp, tone stack,
   power stage) → cabinet → chorus → phaser → tremolo → delay → reverb. Built inside buildTrackNode, so exports include it. */
var RAMP={
  clean:{n:'Clean Combo',d:'Glassy and open',k:1.2,k2:0.6,asym:0,pre:[{t:'highshelf',f:2400,g:3}],cab:'2x12',gain:0.25,bass:0.5,mid:0.45,treble:0.62,pres:0.55,master:0.7},
  jazz:{n:'Jazz Clean',d:'Warm and round',k:0.9,k2:0.5,asym:0,pre:[{t:'highshelf',f:2400,g:-3}],cab:'1x12',gain:0.2,bass:0.6,mid:0.55,treble:0.35,pres:0.3,master:0.7},
  chime:{n:'British Chime',d:'Jangly, breaks up early',k:3,k2:1.4,asym:0.15,pre:[{t:'peaking',f:1800,g:4,q:0.9}],cab:'2x12',gain:0.4,bass:0.45,mid:0.55,treble:0.65,pres:0.6,master:0.65},
  crunch:{n:'British Crunch',d:'Classic rock rhythm',k:7,k2:2,asym:0.25,pre:[{t:'peaking',f:900,g:3,q:0.8}],cab:'4x12',gain:0.5,bass:0.5,mid:0.6,treble:0.6,pres:0.55,master:0.6},
  lead:{n:'Lead Stack',d:'Singing sustain for solos',k:18,k2:3,asym:0.3,pre:[{t:'highpass',f:110},{t:'peaking',f:1100,g:4,q:0.8}],cab:'4x12',gain:0.6,bass:0.5,mid:0.55,treble:0.6,pres:0.6,master:0.55},
  modern:{n:'Modern High Gain',d:'Tight and heavy',k:40,k2:4,asym:0.2,pre:[{t:'highpass',f:160},{t:'peaking',f:700,g:-3,q:0.7}],cab:'4x12',gain:0.6,bass:0.6,mid:0.4,treble:0.62,pres:0.62,master:0.5},
  bass:{n:'Bass Amp',d:'Deep, punchy bass',k:1.5,k2:0.8,asym:0.1,pre:[{t:'lowshelf',f:90,g:3}],cab:'1x15',gain:0.3,bass:0.6,mid:0.5,treble:0.45,pres:0.4,master:0.7}
};
var RCAB={'1x12':{n:'1×12 open back',lp:6200,hp:95,res:[[2700,0.5],[150,0.5]]},'2x12':{n:'2×12 open back',lp:5400,hp:85,res:[[2500,0.55],[130,0.7]]},'4x12':{n:'4×12 closed back',lp:4400,hp:72,res:[[2200,0.7],[105,0.9],[3400,0.3]]},'1x15':{n:'1×15 bass cabinet',lp:3600,hp:40,res:[[800,0.4],[70,1]]},none:{n:'No cabinet (direct)'}};
var RPED=[
  {id:'comp',n:'Compressor',c:'#5CE1E6',k:[['sus','Sustain',0.5],['lvl','Level',0.5]]},
  {id:'od',n:'Overdrive',c:'#7CF2A6',k:[['drive','Drive',0.4],['tone','Tone',0.55],['lvl','Level',0.5]]},
  {id:'dist',n:'Distortion',c:'#FF8A5B',k:[['drive','Drive',0.55],['tone','Tone',0.5],['lvl','Level',0.45]]},
  {id:'fuzz',n:'Fuzz',c:'#FF6B8B',k:[['fuzz','Fuzz',0.7],['tone','Tone',0.5],['lvl','Level',0.4]]},
  {id:'chorus',n:'Chorus',c:'#8FB3FF',k:[['rate','Rate',0.3],['depth','Depth',0.5],['mix','Mix',0.5]]},
  {id:'phaser',n:'Phaser',c:'#B69CFF',k:[['rate','Rate',0.3],['depth','Depth',0.6]]},
  {id:'trem',n:'Tremolo',c:'#FFC94D',k:[['rate','Rate',0.45],['depth','Depth',0.5]]},
  {id:'delay',n:'Delay',c:'#D4FF3A',k:[['time','Time',0.35],['fb','Repeats',0.35],['mix','Mix',0.3]]},
  {id:'verb',n:'Reverb',c:'#F4F4F7',k:[['size','Size',0.4],['mix','Mix',0.3]]}
];
var RPRE=[
  {n:'Clean & bright',a:'clean',p:{verb:{mix:0.22}}},
  {n:'Funk clean',a:'clean',p:{comp:{sus:0.65}},A:{treble:0.7,mid:0.4}},
  {n:'Reggae skank',a:'clean',p:{comp:{sus:0.55},verb:{size:0.3,mix:0.28}},A:{bass:0.35,treble:0.7}},
  {n:'Jazz box',a:'jazz',p:{verb:{mix:0.18}}},
  {n:'Indie chime',a:'chime',p:{chorus:{depth:0.45,mix:0.4},verb:{mix:0.25}}},
  {n:'Blues drive',a:'chime',p:{od:{drive:0.45,tone:0.5}},A:{gain:0.45}},
  {n:'Classic rock',a:'crunch',p:{verb:{mix:0.18}}},
  {n:'Lead solo',a:'lead',p:{delay:{time:0.42,fb:0.35,mix:0.25},verb:{mix:0.2}}},
  {n:'Heavy rhythm',a:'modern',p:{comp:{sus:0.3,lvl:0.5}},A:{gain:0.65}},
  {n:'Vintage fuzz',a:'clean',p:{fuzz:{fuzz:0.75}},A:{gain:0.35}},
  {n:'Surf',a:'clean',p:{trem:{rate:0.55,depth:0.45},verb:{size:0.55,mix:0.42}}},
  {n:'Ambient swells',a:'clean',p:{chorus:{depth:0.4,mix:0.35},delay:{time:0.6,fb:0.55,mix:0.38},verb:{size:0.9,mix:0.5}},A:{treble:0.55}},
  {n:'Bass clean',a:'bass',p:{comp:{sus:0.5}}},
  {n:'Bass drive',a:'bass',p:{od:{drive:0.5,tone:0.45}},A:{gain:0.45}}
];
function rigDefault(model){var M=RAMP[model||'clean'],r={on:true,preset:null,amp:{model:model||'clean',gain:M.gain,bass:M.bass,mid:M.mid,treble:M.treble,pres:M.pres,master:M.master,cab:M.cab},ped:{}};
  RPED.forEach(function(P0){var o={on:false};P0.k.forEach(function(k){o[k[0]]=k[2];});r.ped[P0.id]=o;});return r;}
function rigFromPreset(i){var R=RPRE[i],r=rigDefault(R.a);r.preset=i;Object.keys(R.p).forEach(function(k){r.ped[k].on=true;Object.assign(r.ped[k],R.p[k]);});if(R.A)Object.assign(r.amp,R.A);return r;}
var rigCurveCache={};
function rigCurve(k,asym,kind){var key=k.toFixed(2)+'|'+asym+'|'+(kind||'');if(rigCurveCache[key])return rigCurveCache[key];var n=2048,c=new Float32Array(n),i,x,y,norm;
  if(kind==='fuzz'){for(i=0;i<n;i++){x=i/(n-1)*2-1;y=Math.tanh(k*(x+0.12));c[i]=Math.sign(y)*Math.pow(Math.abs(y),0.5);}}
  else if(kind==='hard'){for(i=0;i<n;i++){x=i/(n-1)*2-1;y=Math.max(-1,Math.min(1,k*x*(1+asym*(x>0?1:-0.6))));c[i]=y-y*y*y/3;}norm=Math.max(Math.abs(c[0]),Math.abs(c[n-1]))||1;for(i=0;i<n;i++)c[i]/=norm;}
  else{norm=Math.tanh(k*(1+asym));for(i=0;i<n;i++){x=i/(n-1)*2-1;c[i]=Math.tanh(k*(x+asym*x*x))/norm;}}
  rigCurveCache[key]=c;return c;}
var rigIRCache=new WeakMap();
function rigCabIR(type){var C=RCAB[type];if(!C||!C.lp)return null;var m=rigIRCache.get(ctx);if(!m){m={};rigIRCache.set(ctx,m);}if(m[type])return m[type];
  var sr=ctx.sampleRate,n=Math.floor(sr*0.05),b=ctx.createBuffer(1,n,sr),d=b.getChannelData(0),al=1-Math.exp(-2*Math.PI*C.lp/sr),ah=1-Math.exp(-2*Math.PI*C.hp/sr),l=0,l2=0,l3=0,lo=0,seed=7;
  function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;}
  for(var i=0;i<n;i++){var t=i/sr,x=rnd()*Math.exp(-t*240);l+=al*(x-l);l2+=al*(l-l2);l3+=al*(l2-l3);lo+=ah*(l3-lo);var y=l3-lo;C.res.forEach(function(r){y+=r[1]*0.15*Math.sin(2*Math.PI*r[0]*t)*Math.exp(-t*(r[0]<300?90:420));});d[i]=y;}
  var e=0;for(i=0;i<n;i++)e+=d[i]*d[i];var g=1/Math.sqrt(e+1e-12);for(i=0;i<n;i++)d[i]*=g*0.42;m[type]=b;return b;}
function rigVerbIR(){var m=rigIRCache.get(ctx);if(!m){m={};rigIRCache.set(ctx,m);}if(!m._verb){try{m._verb=makeVerb('plate');}catch(e){m._verb=makeVerb('room');}}return m._verb;}
function lfo(f,depth,target){var o=ctx.createOscillator(),g=G(depth);o.frequency.value=f;o.connect(g);g.connect(target);o.start();return {o:o,g:g};}
/* build the rig between n.rigIn and n.rigOut */
function rigBuild(n,rig){
  n.rigIn=G(1);n.rigOut=G(1);n.R={};
  if(!rig||!rig.on){n.rigIn.connect(n.rigOut);return;}
  var R=n.R,cur=n.rigIn,P=rig.ped,A=rig.amp,M=RAMP[A.model]||RAMP.clean;function to(x){cur.connect(x);cur=x;return x;}
  if(P.comp.on){R.comp=ctx.createDynamicsCompressor();R.comp.knee.value=6;R.comp.ratio.value=6;R.comp.attack.value=0.004;R.comp.release.value=0.18;to(R.comp);R.compG=to(G(1));}
  if(P.od.on){R.odHp=to(BQ('highpass',330,0.6));R.odMid=to(BQ('peaking',720,0.9));R.odMid.gain.value=6;R.odIn=to(G(1));R.odSh=to(ctx.createWaveShaper());R.odSh.oversample='2x';R.odTone=to(BQ('lowpass',4000,0.7));R.odOut=to(G(1));}
  if(P.dist.on){R.dsHp=to(BQ('highpass',120,0.7));R.dsIn=to(G(1));R.dsSh=to(ctx.createWaveShaper());R.dsSh.oversample='4x';R.dsTone=to(BQ('lowpass',3500,0.7));R.dsOut=to(G(1));}
  if(P.fuzz.on){R.fzIn=to(G(1));R.fzSh=to(ctx.createWaveShaper());R.fzSh.oversample='4x';R.fzTone=to(BQ('lowpass',3000,0.6));R.fzOut=to(G(1));}
  // amp
  R.aIn=to(G(1));M.pre.forEach(function(f){var b=to(BQ(f.t,f.f,f.q||0.707));if(f.g!=null)b.gain.value=f.g;});
  R.sh1=to(ctx.createWaveShaper());R.sh1.oversample='4x';R.tb=to(BQ('lowshelf',110,0.707));R.tm=to(BQ('peaking',650,0.8));R.tt=to(BQ('highshelf',3000,0.707));
  R.pw=to(G(1));R.sh2=to(ctx.createWaveShaper());R.sh2.oversample='2x';R.pres=to(BQ('highshelf',5000,0.707));R.master=to(G(1));
  if(A.cab!=='none'&&RCAB[A.cab]){R.cab=to(ctx.createConvolver());R.cab.normalize=false;R.cab.buffer=rigCabIR(A.cab);}
  if(P.chorus.on){var cin=cur,cOut=G(1),dry=G(1),wet=G(0.5),d=ctx.createDelay(0.05);d.delayTime.value=0.014;cin.connect(dry);dry.connect(cOut);cin.connect(d);d.connect(wet);wet.connect(cOut);R.chL=lfo(0.8,0.003,d.delayTime);R.chD=d;R.chWet=wet;R.chDry=dry;cur=cOut;}
  if(P.phaser.on){var pin=cur,pOut=G(1),pd=G(0.7),pw=G(0.7);pin.connect(pd);pd.connect(pOut);var ap=pin;R.phF=[];for(var k=0;k<4;k++){var f=BQ('allpass',700,0.6);ap.connect(f);ap=f;R.phF.push(f);}ap.connect(pw);pw.connect(pOut);var lg=G(1);R.phL=lfo(0.5,400,lg);R.phF.forEach(function(f){lg.connect(f.frequency);});cur=pOut;}
  if(P.trem.on){var tg=to(G(0.75));R.trL=lfo(5,0.25,tg.gain);R.trG=tg;}
  if(P.delay.on){var din=cur,dOut=G(1),dd=ctx.createDelay(2),fb=G(0.35),dl=BQ('lowpass',3200,0.7),dw=G(0.3);din.connect(dOut);din.connect(dd);dd.connect(dl);dl.connect(fb);fb.connect(dd);dl.connect(dw);dw.connect(dOut);R.dlD=dd;R.dlFb=fb;R.dlW=dw;cur=dOut;}
  if(P.verb.on){var vin=cur,vOut=G(1),cv=ctx.createConvolver(),vw=G(0.3),vhp=BQ('highpass',180,0.7);cv.buffer=rigVerbIR();vin.connect(vOut);vin.connect(vhp);vhp.connect(cv);cv.connect(vw);vw.connect(vOut);R.vbW=vw;R.vbC=cv;cur=vOut;}
  cur.connect(n.rigOut);rigApply(n,rig);
}
function rigApply(n,rig){if(!n||!n.R||!rig||!rig.on)return;var R=n.R,P=rig.ped,A=rig.amp,M=RAMP[A.model]||RAMP.clean,now=ctx.currentTime;
  function sv(p,v){if(!p)return;try{p.setTargetAtTime(v,now,0.02);}catch(e){p.value=v;}}
  if(R.comp){R.comp.threshold.value=-10-P.comp.sus*38;sv(R.compG.gain,(0.6+P.comp.lvl*1.4)*(1+P.comp.sus*1.2));}
  if(R.odSh){R.odSh.curve=rigCurve(1+P.od.drive*14,0.1);sv(R.odIn.gain,1+P.od.drive*3);sv(R.odTone.frequency,900+P.od.tone*5200);sv(R.odOut.gain,(0.25+P.od.lvl*1.1)/(1+P.od.drive*0.6));}
  if(R.dsSh){R.dsSh.curve=rigCurve(4+P.dist.drive*60,0.2,'hard');sv(R.dsIn.gain,1+P.dist.drive*4);sv(R.dsTone.frequency,800+P.dist.tone*5000);sv(R.dsOut.gain,0.15+P.dist.lvl*0.7);}
  if(R.fzSh){R.fzSh.curve=rigCurve(6+P.fuzz.fuzz*80,0,'fuzz');sv(R.fzIn.gain,2+P.fuzz.fuzz*6);sv(R.fzTone.frequency,700+P.fuzz.tone*4500);sv(R.fzOut.gain,0.12+P.fuzz.lvl*0.6);}
  var drive=M.k*(0.15+A.gain*1.9);R.sh1.curve=rigCurve(drive,M.asym);sv(R.aIn.gain,0.8+A.gain*1.2);
  sv(R.tb.gain,(A.bass-0.5)*24);sv(R.tm.gain,(A.mid-0.5)*20);sv(R.tt.gain,(A.treble-0.5)*22);
  R.sh2.curve=rigCurve(M.k2*(0.6+A.master*0.8),M.asym*0.5);sv(R.pres.gain,(A.pres-0.5)*16);
  sv(R.master.gain,(0.25+A.master*0.9)/Math.max(1,Math.sqrt(drive)*0.55));
  if(R.chD){R.chL.o.frequency.setTargetAtTime(0.15+P.chorus.rate*3,now,0.05);sv(R.chL.g.gain,0.0005+P.chorus.depth*0.006);sv(R.chWet.gain,P.chorus.mix*0.9);sv(R.chDry.gain,1-P.chorus.mix*0.35);}
  if(R.phF){R.phL.o.frequency.setTargetAtTime(0.08+P.phaser.rate*2.5,now,0.05);sv(R.phL.g.gain,150+P.phaser.depth*900);}
  if(R.trG){R.trL.o.frequency.setTargetAtTime(1.5+P.trem.rate*9,now,0.05);sv(R.trL.g.gain,P.trem.depth*0.5);sv(R.trG.gain,1-P.trem.depth*0.5);}
  if(R.dlD){sv(R.dlD.delayTime,0.06+P.delay.time*0.9);sv(R.dlFb.gain,P.delay.fb*0.85);sv(R.dlW.gain,P.delay.mix*0.9);}
  if(R.vbW){sv(R.vbW.gain,P.verb.mix*(0.6+P.verb.size*0.9));}
}
/* rebuild one track's rig in place (on/off, pedal switches, amp model, cabinet) */
function rigRebuild(ti){var t=tracks[ti],n=t&&t.n;if(!n||!ctx)return;
  try{n.f.disconnect(n.rigIn);}catch(e){}try{n.rigOut.disconnect();}catch(e){}
  if(n.R){Object.keys(n.R).forEach(function(k){var x=n.R[k];if(x&&x.o){try{x.o.stop();}catch(e){}}});}
  rigBuild(n,t.rig);n.f.connect(n.rigIn);n.rigOut.connect(n.af);}

/* ---------- Amp & pedals UI ---------- */
function garKnob(key,label,v,col,big){var s=big?58:46;return '<div class="gx-knob'+(big?' big':'')+'" data-kn="'+key+'" style="--kc:'+(col||'var(--fam)')+'" role="slider" tabindex="0" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(v*100)+'"><svg viewBox="0 0 48 48" width="'+s+'" height="'+s+'" aria-hidden="true">'+garKnobSvg(v)+'</svg><span>'+label+'</span></div>';}
function garArc(a0,a1,r){var p=function(a){return [24+r*Math.cos(a),24+r*Math.sin(a)];},s=p(a0),e=p(a1),lg=a1-a0>Math.PI?1:0;return 'M'+s[0].toFixed(2)+' '+s[1].toFixed(2)+'A'+r+' '+r+' 0 '+lg+' 1 '+e[0].toFixed(2)+' '+e[1].toFixed(2);}
function garKnobSvg(v){var a0=Math.PI*0.75,a1=Math.PI*2.25,av=a0+(a1-a0)*clamp(v,0,1),ix=24+12*Math.cos(av),iy=24+12*Math.sin(av);
  return '<path d="'+garArc(a0,a1,20)+'" class="tr"/>'+(v>0.004?'<path d="'+garArc(a0,av,20)+'" class="va"/>':'')+'<circle cx="24" cy="24" r="15" class="kb"/><line x1="24" y1="24" x2="'+ix.toFixed(2)+'" y2="'+iy.toFixed(2)+'" class="ix"/>';}
function garKnobBind(root,get,set){
  Array.prototype.slice.call(root.querySelectorAll('[data-kn]')).forEach(function(k){var key=k.getAttribute('data-kn'),start=null;
    function upd(v){v=clamp(Math.round(v*100)/100,0,1);set(key,v);k.querySelector('svg').innerHTML=garKnobSvg(v);k.setAttribute('aria-valuenow',Math.round(v*100));}
    k.addEventListener('pointerdown',function(e){e.preventDefault();ensureAudio();start={y:e.clientY,x:e.clientX,v:get(key)};try{k.setPointerCapture(e.pointerId);}catch(x){}k.classList.add('on');});
    k.addEventListener('pointermove',function(e){if(!start)return;upd(start.v+((start.y-e.clientY)+(e.clientX-start.x)*0.5)/160);});
    function end(){start=null;k.classList.remove('on');}k.addEventListener('pointerup',end);k.addEventListener('pointercancel',end);
    k.addEventListener('keydown',function(e){var d=e.key==='ArrowUp'||e.key==='ArrowRight'?0.02:e.key==='ArrowDown'||e.key==='ArrowLeft'?-0.02:0;if(d){e.preventDefault();upd(get(key)+d);}});});
}
var garRigSaveT=null;function garRigDirty(){clearTimeout(garRigSaveT);garRigSaveT=setTimeout(markDirty,400);}
function garRigUI(){
  var t=tracks[GAR.ti],el=$('#garInst');el.classList.remove('fret');if(!t)return;if(!t.rig){t.rig=rigDefault(GAR.inst==='bass'?'bass':'clean');t.rig.on=false;}
  var R=t.rig,h='<div class="gx-rigtop"><div><b>Amp and pedals</b><small>'+(R.on?(R.preset!=null?RPRE[R.preset].n:'Custom sound'):'Off: you hear the dry instrument')+'</small></div><button class="gx-btn" id="garRigTry">'+GSVG.play+'Try it</button><button class="gx-sw" id="garRigOn" aria-pressed="'+!!R.on+'" aria-label="Amp and pedals on"></button></div>';
  h+='<div class="gx-styles" id="garRigPre" role="group" aria-label="Presets">';RPRE.forEach(function(p,i){h+='<button class="gx-sty" data-rp="'+i+'" aria-pressed="'+(R.on&&R.preset===i)+'"><b>'+p.n+'</b><small>'+RAMP[p.a].n+'</small></button>';});h+='</div>';
  h+='<div class="gx-board'+(R.on?'':' off')+'" id="garBoard">';
  RPED.forEach(function(P0){var o=R.ped[P0.id];h+='<div class="gx-ped'+(o.on?' on':'')+'" style="--pc:'+P0.c+'"><b>'+P0.n+'</b><div class="gx-pk">';P0.k.forEach(function(k){h+=garKnob('p.'+P0.id+'.'+k[0],k[1],o[k[0]],P0.c);});
    h+='</div><button class="gx-foot" data-ped="'+P0.id+'" aria-pressed="'+!!o.on+'" aria-label="'+P0.n+' '+(o.on?'on':'off')+'"><i></i></button></div>';});
  h+='</div><div class="gx-amp'+(R.on?'':' off')+'" id="garAmp"><div class="gx-ampm" id="garAmpM">';
  Object.keys(RAMP).forEach(function(k){h+='<button data-am="'+k+'" aria-pressed="'+(R.amp.model===k)+'"><b>'+RAMP[k].n+'</b><small>'+RAMP[k].d+'</small></button>';});
  h+='</div><div class="gx-ampk">';[['gain','Gain'],['bass','Bass'],['mid','Middle'],['treble','Treble'],['pres','Presence'],['master','Master']].forEach(function(k){h+=garKnob('a.'+k[0],k[1],R.amp[k[0]],'#F4F4F7',true);});
  h+='</div><div class="gx-row"><span>Cabinet</span><select class="gx-pill" id="garCab" style="max-width:62%">'+Object.keys(RCAB).map(function(k){return '<option value="'+k+'"'+(R.amp.cab===k?' selected':'')+'>'+RCAB[k].n+'</option>';}).join('')+'</select></div></div>';
  el.innerHTML=h;
  function rebuild(){rigRebuild(GAR.ti);garRigDirty();garRigUI();}
  $('#garRigOn').addEventListener('click',function(){R.on=!R.on;if(R.on&&R.preset==null&&!Object.keys(R.ped).some(function(k){return R.ped[k].on;})){t.rig=rigFromPreset(GAR.inst==='bass'?12:0);}rebuild();});
  $$('#garRigPre [data-rp]').forEach(function(b){b.addEventListener('click',function(){t.rig=rigFromPreset(+b.getAttribute('data-rp'));rigRebuild(GAR.ti);garRigDirty();garRigUI();garRigTry();});});
  $$('#garBoard [data-ped]').forEach(function(b){b.addEventListener('click',function(){var o=R.ped[b.getAttribute('data-ped')];o.on=!o.on;R.preset=null;if(!R.on)R.on=true;rebuild();});});
  $$('#garAmpM [data-am]').forEach(function(b){b.addEventListener('click',function(){var m=b.getAttribute('data-am'),M=RAMP[m];R.amp.model=m;R.amp.cab=M.cab;['gain','bass','mid','treble','pres','master'].forEach(function(k){R.amp[k]=M[k];});R.preset=null;if(!R.on)R.on=true;rebuild();});});
  $('#garCab').addEventListener('change',function(){R.amp.cab=this.value;R.preset=null;rebuild();});
  $('#garRigTry').addEventListener('click',garRigTry);
  garKnobBind(el,function(key){var p=key.split('.');return p[0]==='a'?R.amp[p[1]]:R.ped[p[1]][p[2]];},function(key,v){var p=key.split('.');if(p[0]==='a')R.amp[p[1]]=v;else R.ped[p[1]][p[2]]=v;R.preset=null;rigApply(t.n,R);garRigDirty();var sm=el.querySelector('.gx-rigtop small');if(sm)sm.textContent='Custom sound';});
  [el.querySelector('#garRigPre [aria-pressed="true"]'),el.querySelector('#garAmpM [aria-pressed="true"]')].forEach(function(x){if(x&&x.parentNode){var p=x.parentNode;p.scrollLeft=x.offsetLeft-p.offsetLeft-(p.clientWidth-x.offsetWidth)/2;}});
}
/* audition: a strummed chord (guitar), a short riff (bass), or nothing for audio tracks */
function garRigTry(){if(!ensureAudio())return;var t=tracks[GAR.ti];if(!t||t.kind!=='keys'){toast('Play or record your instrument to hear the amp.',1800);return;}
  var c=garChords()[0],now=ctx.currentTime+0.03;
  if(GAR.inst==='bass'){var b=garBassNotes(c);[[0,b[0]],[0.25,b[0]],[0.5,b[2]],[0.75,b[3]]].forEach(function(x){playNote(GAR.ti,x[1],0.85,now+x[0],0.22);});return;}
  var v=garGtrVoice(c);v.forEach(function(m,j){playNote(GAR.ti,m,0.85,now+j*0.016,1.4);});var v2=garGtrVoice(garChords()[4]);v2.forEach(function(m,j){playNote(GAR.ti,m,0.8,now+0.9+j*0.016,1.4);});}

/* ===================== GARAGE MODE =====================
   A guided, band-in-a-phone layer over Ecou's engine: instrument browser, Smart Keys / Guitar / Bass with chord strips
   and autoplay, Drum Kit, Smart Drums, a virtual Drummer, Live Loops (tracks × patterns A–H) and a simple Tracks view.
   Everything writes to the same tracks, patterns and timeline clips as the Pro tabs. */
