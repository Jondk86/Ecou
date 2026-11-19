var aiSample=null,aiUndo=null,aiBusy=false;
var AI_CHIPS=['Darker','Brighter','Dreamy & wide','80s tape','Underwater','Telephone','Leslie organ','Aggressive','Lo-fi hip-hop','Shimmer','Tight & punchy','Glitchy texture','Clean'];
var AI_RULES=[
 {re:/\b(clean|dry|reset|neutral)\b/,lbl:'clean',fxAll:false,set:{space:0.12,dmix:0}},
 {re:/dark|warm|muffl|mellow|soft top/,lbl:'darker',add:{cutoff:-0.18},set:{eqHigh:-5},fx:{eq:true}},
 {re:/bright|airy|crisp|sparkl|open/,lbl:'brighter',add:{cutoff:0.12},set:{eqHigh:5,eqLow:-2},fx:{eq:true}},
 {re:/dream|ethereal|ambient|spacious|wide|lush/,lbl:'dreamy & wide',set:{space:0.6,chMix:0.45,chDepth:0.6,dmix:0.25,attack:0.25,release:3},fx:{chorus:true},sync:'1/8D'},
 {re:/shimmer|angelic|heaven/,lbl:'shimmer',set:{psShift:12,psMix:0.3,space:0.75,release:4},fx:{pitch:true}},
 {re:/80s|eighties|tape|vintage|retro|vhs|cassette/,lbl:'80s tape',set:{chRate:0.4,chDepth:0.5,chMix:0.4,drive:0.25,dTone:5200,dMix:0.8,eqHp:60,eqLp:9000},fx:{chorus:true,drive:true,eq:true}},
 {re:/underwater|submerged|ocean|liquid/,lbl:'underwater',set:{cutoff:0.38,reso:6,phRate:0.18,phDepth:0.85,phMix:0.5,space:0.5},fx:{phaser:true}},
 {re:/telephone|phone|radio|walkie|megaphone/,lbl:'telephone',set:{eqHp:450,eqLp:3200,eqMidF:1500,eqMid:6,drive:0.3,dMix:1},fx:{eq:true,drive:true}},
 {re:/leslie|organ|rotary|rotor/,lbl:'rotary',set:{roMix:1},fx:{rotary:true},rot:true},
 {re:/metal|djent|high.?gain|hi-?gain/,lbl:'high-gain amp',amp:'higain',set:{ampGain:0.75,ampBass:3,ampMid:-3,ampTreble:3},fx:{amp:true}},
 {re:/guitar|crunch|blues|rock|overdrive|amp\b/,lbl:'crunch amp',amp:'crunch',set:{ampGain:0.5,ampMid:2},fx:{amp:true}},
 {re:/bass amp|fat bass|warm bass/,lbl:'bass amp',amp:'bass',set:{ampGain:0.35,ampBass:4},fx:{amp:true}},
 {re:/tube|valve|analog/,lbl:'tube',amp:'tube',set:{ampGain:0.45},fx:{amp:true}},
 {re:/aggress|distort|dirty|grit|angry|heavy/,lbl:'aggressive',set:{drive:0.7,dMix:1,dTone:7000,cThr:-24,cRatio:6},add:{cutoff:0.1},fx:{drive:true,comp:true}},
 {re:/lo-?fi|bitcrush|crushed|8.?bit|\bchiptune\b/,lbl:'lo-fi',set:{lfBits:6,lfTone:4500,lfMix:1},fx:{lofi:true}},
 {re:/hip.?hop|boom.?bap|chill|dusty/,lbl:'lo-fi hip-hop',set:{lfBits:10,lfTone:6000,lfMix:0.8,eqLp:7500,swing:0.25,drive:0.2,dMix:0.6},fx:{lofi:true,eq:true,drive:true}},
 {re:/glitch|broken|stutter|granul|texture|cloud/,lbl:'glitchy texture',engine:'granular',set:{gspray:0.6,gjit:40,gsize:0.035,gdens:50}},
 {re:/tight|punch|short|pluck|staccato|snappy/,lbl:'tight & punchy',set:{attack:0.002,release:0.15,cAtt:0.02,cRatio:4,cThr:-20},fx:{comp:true}},
 {re:/swell|slow attack|gentle|pad\b|evolving/,lbl:'slow swell',set:{attack:0.7,release:3.5}},
 {re:/flang|jet/,lbl:'flanger',set:{flMix:0.5},fx:{flanger:true}},
 {re:/phas/,lbl:'phaser',set:{phMix:0.5},fx:{phaser:true}},
 {re:/octave up|higher|chipmunk/,lbl:'octave up',set:{psShift:12,psMix:0.6},fx:{pitch:true}},
 {re:/octave down|sub\b|lower|deeper|deep/,lbl:'deeper',set:{psShift:-12,psMix:0.55,eqLow:4},fx:{pitch:true,eq:true}},
 {re:/metallic|robot|cyborg/,lbl:'metallic',set:{flFb:0.88,flRate:0.1,flDepth:0.4,flMix:0.6},fx:{flanger:true}},
 {re:/echo|delay|dub/,lbl:'echo',set:{dmix:0.4,dfb:0.5},sync:'1/8D'},
 {re:/huge|cathedral|hall|church|cave|massive/,lbl:'huge space',set:{space:0.85,release:4}}
];
function aiSnapshot(){var p={};Object.keys(P).forEach(function(k){p[k]=P[k].v;});return {p:p,fx:JSON.parse(JSON.stringify(fxOn)),order:FXORDER.slice(),ro:roFast,ds:dsync,eng:engine,amp:ampModel,cab:cabCustom};}
function aiRestore(s){Object.keys(s.p).forEach(function(k){setParam(k,s.p[k]);});fxOn=s.fx;FXORDER.splice(0,FXORDER.length);s.order.forEach(function(x){FXORDER.push(x);});setRotary(s.ro);setSync(s.ds);setEngine(s.eng);if(s.amp){cabCustom=s.cab||null;setAmpModel(s.amp);if(cabCustom&&FX.amp){FX.amp.cab.buffer=cabCustom;FX.amp.cabWet.gain.value=1;FX.amp.cabDry.gain.value=0;}}buildFxUI();routeFX();}
function setParam(k,v){var p=P[k];if(!p||typeof v!=='number'||!isFinite(v))return false;if(k==='bpm'&&typeof bandTrTempo==='function'&&bandTrTempo(v))return true;v=clamp(v,p.min,p.max);p.v=v;syncParam(k);if(p.on&&ctx)p.on(v);if(p.set)p.set(v);return true;}
function setSync(v){if(!DSYNC.some(function(d){return d[0]===v;}))return;dsync=v;$$('[data-ds]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-ds')===v?'true':'false');});updDelayTime();}
function setEngine(v){if(v!=='sampler'&&v!=='granular'&&v!=='fm')return;if(ctx)allOff();engine=v;if(v==='fm'&&!fmP)fmP=FMV[0].p.slice();$$('[data-engine]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-engine')===v?'true':'false');});renderFM();}
var aiScope='track',TRACKP=IKEYS;
function aiApply(ch){
  var before=aiSnapshot(),trNote=[];before.tr={i:selTrack,rev:tracks[selTrack].rev,dly:tracks[selTrack].dly};
  var autoMix=aiScope==='track'&&!Object.keys(ch.params||{}).some(function(k){return IKEYS.indexOf(k)>=0||k==='space'||k==='dmix';})&&!!(Object.keys(ch.fx||{}).length||ch.ampModel||ch.rotary);
  if(aiScope==='track'&&!autoMix){ /* keep the change on the sound being edited: no global timing, shared inserts or master FX */
    var pp={},t=tracks[selTrack];Object.keys(ch.params||{}).forEach(function(k){var v=+ch.params[k];if(IKEYS.indexOf(k)>=0)pp[k]=v;
      else if(k==='space'){t.rev=clamp(v,0,1);trNote.push(t.name+' reverb send → '+fPct(t.rev));}else if(k==='dmix'){t.dly=clamp(v*1.5,0,1);trNote.push(t.name+' delay send → '+fPct(t.dly));}});
    var skipped=Object.keys(ch.fx||{}).length+(ch.ampModel?1:0)+(ch.rotary?1:0);
    ch={params:pp,engine:ch.engine,summary:ch.summary};if(trNote.length){applyMix();renderMixer();}
    if(skipped)trNote.push('Effect changes skipped (they would affect every track) — choose “Whole mix” to apply them.');
  }else{var gp={};Object.keys(ch.params||{}).forEach(function(k){if(k!=='bpm'&&k!=='swing')gp[k]=ch.params[k];});ch.params=gp;}
  if(ch.fxAll===false)FXORDER.forEach(function(id){fxOn[id]=false;});
  Object.keys(ch.params||{}).forEach(function(k){setParam(k,+ch.params[k]);});
  Object.keys(ch.fx||{}).forEach(function(id){if(FXDEF[id])fxOn[id]=!!ch.fx[id];});
  if(ch.rotary)setRotary(ch.rotary==='fast');
  if(ch.delaySync)setSync(ch.delaySync);
  if(ch.engine)setEngine(ch.engine);
  var beforeAmp=ampModel;if(ch.ampModel&&AMPM[ch.ampModel]){cabCustom=null;setAmpModel(ch.ampModel);}
  buildFxUI();routeFX();
  var lines=[];
  var grp={};Object.keys(FXDEF).forEach(function(id){FXDEF[id].params.forEach(function(k){grp[k]=FXDEF[id].name+' · ';});});
  Object.keys(P).forEach(function(k){var a=before.p[k],b=P[k].v;if(Math.abs(a-b)>1e-6)lines.push((grp[k]||'')+P[k].label+': '+P[k].fmt(a)+' → '+P[k].fmt(b));});
  FXORDER.forEach(function(id){if(!!before.fx[id]!==!!fxOn[id])lines.unshift((fxOn[id]?'+ ':'− ')+FXDEF[id].name);});
  if(before.eng!==engine)lines.unshift('Engine: '+engine);
  if(before.ds!==dsync)lines.push('Delay sync: '+dsync);
  if(beforeAmp!==ampModel)lines.unshift('Amp model: '+AMPM[ampModel].name);
  lines=trNote.concat(lines);if(autoMix)lines.unshift('This look comes from shared effects, so it was applied to the whole mix.');if(!lines.length)lines.push('Nothing to change for this track.');
  aiUndo=before;$('#aiUndo').hidden=false;
  return lines;
}
function aiLocal(text){
  var t=text.toLowerCase(),ch={params:{},fx:{}},hit=[];
  AI_RULES.forEach(function(r){var mm=t.match(r.re);if(!mm)return;var pre=t.slice(Math.max(0,mm.index-14),mm.index);if(/\b(not|no|less|without|never)\b[^,.;]*$/.test(pre))return;if(r.amp&&ch.ampModel)return;hit.push(r.lbl);
    if(r.fxAll===false){ch.fxAll=false;}
    Object.keys(r.set||{}).forEach(function(k){ch.params[k]=r.set[k];});
    Object.keys(r.add||{}).forEach(function(k){ch.params[k]=(ch.params[k]!=null?ch.params[k]:P[k].v)+r.add[k];});
    Object.keys(r.fx||{}).forEach(function(k){ch.fx[k]=r.fx[k];});
    if(r.rot)ch.rotary=/fast|fast|chorale|spin/.test(t)?'fast':'slow';
    if(r.engine)ch.engine=r.engine;if(r.sync)ch.delaySync=r.sync;if(r.amp&&!ch.ampModel)ch.ampModel=r.amp;});
  ch.summary=hit.length?'Matched: '+hit.join(', ')+'.':'';
  return hit.length?ch:null;
}
function aiPrompt(text){
  var ps=Object.keys(P).filter(function(k){return !/^pad|^morph$|^vol$/.test(k);}).map(function(k){var p=P[k];return k+' ('+p.label+') range '+p.min+'..'+p.max+', current '+(Math.round(p.v*1000)/1000);}).join('\n');
  return 'You are the sound-design engine of Ecou, a mobile sampler/synth for music producers. Translate the producer\'s description into parameter changes.\n\n'+
  'Description: "'+text.replace(/"/g,"'")+'"\n\nSignal flow: sources → lowpass filter (cutoff is 0..1 mapped log 40 Hz–18 kHz, reso = Q) → insert chain in this order: '+FXORDER.join(' → ')+' → reverb send (space) + delay send (dmix).\n'+
  'Current insert states: '+FXORDER.map(function(id){return id+'='+(fxOn[id]?'on':'off');}).join(', ')+'. Engine: '+engine+'. Delay sync: '+dsync+'. Rotary speed: '+(roFast?'fast':'slow')+'.\n\nParameters (seconds for times, Hz for frequencies, dB for gains, 0..1 for mixes):\n'+ps+
  '\n\nReply with ONLY a JSON object containing just what should change:\n{"summary":"one short sentence for the producer","params":{"key":number},"fx":{"eq|comp|drive|pitch|chorus|flanger|phaser|rotary|lofi":true|false},"rotary":"slow|fast","engine":"sampler|granular","delaySync":"free|1/4|1/8|1/8D|1/16|1/4T","ampModel":"clean|crunch|higain|bass|tube"}\n'+
  'Rules: stay inside ranges; enable any insert whose params you rely on; prefer musical, mix-ready settings; change only what the description implies.';
}
function aiRun(text){
  text=(text||'').trim();if(!text||aiBusy)return;ensureAudio();
  var out=$('#aiOut');
  if(aiSample){
    aiBusy=true;$('#aiGo').disabled=true;out.textContent='Thinking…';
    aiSample.json(aiPrompt(text),{modelTier:'quick'}).then(function(r){
      if(!r||typeof r!=='object')throw {code:'invalid_json'};
      var lines=aiApply(r);out.innerHTML='<strong>'+escapeH(r.summary||'Applied.')+'</strong><br>'+lines.slice(0,10).map(escapeH).join('<br>');
    }).catch(function(e){
      var code=e&&e.code;
      if(code==='not_granted'||code==='sampling_disabled'||code==='not_declared'||code==='capability_disabled'){aiSample=null;$('#aiEngine').textContent='On-device engine';}
      var ch=aiLocal(text);
      if(ch){var lines=aiApply(ch);out.innerHTML='<strong>'+escapeH(ch.summary)+'</strong> (on-device)<br>'+lines.slice(0,10).map(escapeH).join('<br>');}
      else out.textContent=code==='rate_limited'?'Claude is busy — try again in a moment.':'Couldn’t interpret that. Try words like darker, dreamy, 80s tape, telephone, aggressive.';
    }).then(function(){aiBusy=false;$('#aiGo').disabled=false;});
    return;
  }
  var ch=aiLocal(text);
  if(!ch){out.textContent='No match on-device. Try words like darker, dreamy & wide, 80s tape, underwater, telephone, aggressive, lo-fi, shimmer, glitchy.';return;}
  var lines=aiApply(ch);out.innerHTML='<strong>'+escapeH(ch.summary)+'</strong><br>'+lines.slice(0,10).map(escapeH).join('<br>');
}
function escapeH(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function initAI(){
  $('#aiChips').innerHTML=AI_CHIPS.map(function(c){return '<button type="button" data-chip="'+c+'">'+c+'</button>';}).join('');
  $$('[data-chip]').forEach(function(b){b.addEventListener('click',function(){$('#aiText').value=b.getAttribute('data-chip');aiRun(b.getAttribute('data-chip'));});});
  $('#aiForm').addEventListener('submit',function(e){e.preventDefault();aiRun($('#aiText').value);});
  $$('[data-aisc]').forEach(function(b){b.addEventListener('click',function(){aiScope=b.getAttribute('data-aisc');$$('[data-aisc]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
  $('#aiUndo').addEventListener('click',function(){if(!aiUndo)return;if(aiUndo.tr&&tracks[aiUndo.tr.i]){tracks[aiUndo.tr.i].rev=aiUndo.tr.rev;tracks[aiUndo.tr.i].dly=aiUndo.tr.dly;applyMix();renderMixer();}aiRestore(aiUndo);aiUndo=null;$('#aiUndo').hidden=true;$('#aiOut').textContent='Reverted.';});
  $('#aiEngine').textContent='On-device engine';
  if(window.claude&&typeof window.claude.use==='function'){window.claude.use('sample').then(function(fn){if(fn){aiSample=fn;$('#aiEngine').textContent='Powered by Claude · falls back to on-device';}}).catch(function(){});}
}

/* ---------- SPECTRAL MORPH ---------- */
var morphMode='blend',morphBuf=null,morphTimer=null,morphRoot=261.63;
function fft(re,im,inv){
  var n=re.length,i,j,k,l;
  for(i=1,j=0;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){var t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(l=2;l<=n;l<<=1){var ang=(inv?2:-2)*Math.PI/l,wr=Math.cos(ang),wi=Math.sin(ang);
    for(i=0;i<n;i+=l){var cr=1,ci=0;for(k=0;k<l/2;k++){var a=i+k,b=a+l/2,xr=re[b]*cr-im[b]*ci,xi=re[b]*ci+im[b]*cr;re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;var nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}
  if(inv)for(i=0;i<n;i++){re[i]/=n;im[i]/=n;}
}
function stft(x,N,H){var win=new Float64Array(N),F=[],i;for(i=0;i<N;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
  for(var s=0;s+N<=x.length;s+=H){var re=new Float64Array(N),im=new Float64Array(N);for(i=0;i<N;i++)re[i]=x[s+i]*win[i];fft(re,im,false);
    var mag=new Float64Array(N/2+1),ph=new Float64Array(N/2+1);for(i=0;i<=N/2;i++){mag[i]=Math.hypot(re[i],im[i]);ph[i]=Math.atan2(im[i],re[i]);}F.push({mag:mag,ph:ph});}
  return {F:F,win:win};}
function smoothEnv(m,w){var n=m.length,o=new Float64Array(n),acc=0,c=0,i;for(i=0;i<n;i++){var lo=Math.max(0,i-w),hi=Math.min(n-1,i+w);if(i===0){for(var j=lo;j<=hi;j++)acc+=m[j];c=hi-lo+1;}else{if(i-w-1>=0){acc-=m[i-w-1];c--;}if(i+w<n){acc+=m[i+w];c++;}}o[i]=acc/c+1e-9;}return o;}
function renderMorph(){
  if(!ctx||!slots.A.buf||!slots.B.buf)return;var t0=performance.now();
  var r=renderMorphCore(slots.A,slots.B,P.morph.v,morphMode);if(!r)return;morphBuf=r;morphRoot=slots.A.root;
  $('#morphState').textContent='Rendered in '+Math.round(performance.now()-t0)+' ms · '+dec(r.duration,1)+' s';markDirty();
}
function renderMorphCore(SA_,SB_,m,mode){
  var sr=SA_.buf.sampleRate,N=2048,H=512;
  var a=SA_.buf.getChannelData(0),bsrc=SB_.buf.getChannelData(0);
  var maxLen=Math.min(a.length,Math.floor(sr*6));a=a.subarray(0,maxLen);
  var ratio=SB_.root/SA_.root,bl=Math.floor(bsrc.length/ratio),b=new Float32Array(Math.max(bl,N+1));
  for(var i=0;i<bl;i++){var p=i*ratio,i0=Math.floor(p),fr=p-i0;b[i]=(bsrc[i0]||0)*(1-fr)+(bsrc[i0+1]||0)*fr;}
  if(a.length<N+1){toast('Source A is too short for spectral morph.');return null;}
  var SA=stft(a,N,H),SB=stft(b,N,H),FA=SA.F,FB=SB.F,win=SA.win,out=new Float64Array(a.length+N),norm=new Float64Array(a.length+N);
  for(var k=0;k<FA.length;k++){
    var fa=FA[k],fb=FB[Math.min(FB.length-1,Math.round(k*(FB.length-1)/Math.max(1,FA.length-1)))]||fa,nb=N/2+1,mag=new Float64Array(nb),ph;
    if(mode==='transfer'){var ea=smoothEnv(fa.mag,10),eb=smoothEnv(fb.mag,10);for(var q=0;q<nb;q++)mag[q]=fa.mag[q]/ea[q]*Math.pow(ea[q],1-m)*Math.pow(eb[q],m);ph=fa.ph;}
    else{for(q=0;q<nb;q++)mag[q]=Math.pow(fa.mag[q]+1e-9,1-m)*Math.pow(fb.mag[q]+1e-9,m);ph=m<0.5?fa.ph:fb.ph;}
    var re=new Float64Array(N),im=new Float64Array(N);
    for(q=0;q<nb;q++){re[q]=mag[q]*Math.cos(ph[q]);im[q]=mag[q]*Math.sin(ph[q]);if(q>0&&q<N/2){re[N-q]=re[q];im[N-q]=-im[q];}}
    fft(re,im,true);var s0=k*H;for(i=0;i<N;i++){out[s0+i]+=re[i]*win[i];norm[s0+i]+=win[i]*win[i];}
  }
  var len=Math.min(a.length,(FA.length-1)*H+N),res=ctx.createBuffer(1,len,sr),d=res.getChannelData(0);
  for(i=0;i<len;i++)d[i]=norm[i]>0.05?out[i]/norm[i]:0;
  normalize(d);var f=Math.floor(sr*0.004);for(i=0;i<f;i++){d[i]*=i/f;d[len-1-i]*=i/f;}
  return res;
}
function scheduleMorph(){if(morphMode==='blend'||loadingSound)return;clearTimeout(morphTimer);$('#morphState').textContent='Rendering…';morphTimer=setTimeout(function(){renderMorph();},250);}
function setMorphMode(v){
  morphMode=v;$$('[data-mm]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-mm')===v?'true':'false');});
  if(ctx)allOff();
  $('#morphState').textContent=v==='blend'?'Crossfade: both sources play, mixed by level.':'';
  if(v!=='blend'){ensureAudio();scheduleMorph();}
}

/* ---------- TRACKS ---------- */
