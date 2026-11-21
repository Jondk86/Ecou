function wetGain(w){return (MIX&&MIX.rAm?0:1)*w*1.3*2.8*dbg(P.rvRet?P.rvRet.v:0);}
var curVerb='hall';
function verbIdByName(){var nm=$('#irName')?$('#irName').textContent:'';for(var k in VERBS)if(VERBS[k].name===nm)return k;return null;}
function verbResize(){if(offlineRender)return;clearTimeout(verbResize.t);verbResize.t=setTimeout(function(){if(!ctx||!N.conv)return;var id=verbIdByName();if(!id){return;}N.conv.buffer=makeVerb(id);if(PF&&PF.vConv){try{PF.vConv.buffer=N.conv.buffer;}catch(e){}}$('#irRt').textContent='RT60 ≈ '+dec(VERBS[id].rt*(P.rvSize?P.rvSize.v:1),1)+' s';},160);}
function setVerb(id){if(!ensureAudio())return;var V=VERBS[id];curVerb=id;N.conv.buffer=makeVerb(id);if(PF&&PF.vConv){try{PF.vConv.buffer=N.conv.buffer;}catch(e){var nc=ctx.createConvolver();nc.buffer=N.conv.buffer;}}
  $('#irName').textContent=V.name;$('#irRt').textContent='RT60 ≈ '+dec(V.rt*(P.rvSize?P.rvSize.v:1),1)+' s';$$('[data-verb]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-verb')===id?'true':'false');});markDirty();toast(V.name+' reverb.',1000);}
function initDrums2(){
  $('#kitChips').innerHTML='<button data-kit="acoustic">Acoustic</button>'+Object.keys(KITS).map(function(k){return '<button data-kit="'+k+'">'+KITS[k].name+'</button>';}).join('')+'<button data-kit="reggae">Reggae</button>';
  $$('[data-kit]').forEach(function(b){b.addEventListener('click',function(){loadKit(b.getAttribute('data-kit'));});});
  $('#verbChips').innerHTML=Object.keys(VERBS).map(function(k){return '<button data-verb="'+k+'" aria-pressed="'+(k==='hall')+'">'+VERBS[k].name+'</button>';}).join('');
  $$('[data-verb]').forEach(function(b){b.addEventListener('click',function(){setVerb(b.getAttribute('data-verb'));});});
}

/* ---------- MASTER EQ + REFERENCE TRACK MATCH ---------- */
var MQB=[{f:60,t:'lowshelf',lbl:'60'},{f:160,t:'peaking',lbl:'160'},{f:400,t:'peaking',lbl:'400'},{f:1000,t:'peaking',lbl:'1k'},{f:3000,t:'peaking',lbl:'3k'},{f:10000,t:'highshelf',lbl:'10k'}];
var MQG=[0,0,0,0,0,0],MQF=MQB.map(function(b){return b.f;}),MQQ=MQB.map(function(b){return b.t==='peaking'?0.9:0.7;}),mqSel=3;
function mqReset(){MQG=[0,0,0,0,0,0];MQF=MQB.map(function(b){return b.f;});MQQ=MQB.map(function(b){return b.t==='peaking'?0.9:0.7;});}
function buildMasterEq(){N.mq=MQB.map(function(b,i){var q=BQ(b.t,MQF[i],MQQ[i]);q.gain.value=MQG[i];return q;});for(var i=0;i<N.mq.length-1;i++)N.mq[i].connect(N.mq[i+1]);N.mAv=ctx.createGain();N.mAf=BQ('lowpass',ctx.sampleRate/2,0.707);N.master.connect(N.mAv);N.mAv.connect(N.mAf);N.mAf.connect(N.mq[0]);N.mOut=N.mq[N.mq.length-1];}
function applyMasterEq(){if(!N.mq)return;N.mq.forEach(function(q,i){q.gain.setTargetAtTime(MQG[i],ctx.currentTime,0.03);q.frequency.setTargetAtTime(MQF[i],ctx.currentTime,0.03);q.Q.setTargetAtTime(MQQ[i],ctx.currentTime,0.03);});}
/* RBJ biquads in JS (so the offline reverb tail gets the same master EQ) */
function rbj(type,f,q,gdb,sr){var A=Math.pow(10,gdb/40),w=2*Math.PI*f/sr,c=Math.cos(w),sn=Math.sin(w),al=sn/(2*q),b0,b1,b2,a0,a1,a2;
  if(type==='peaking'){b0=1+al*A;b1=-2*c;b2=1-al*A;a0=1+al/A;a1=-2*c;a2=1-al/A;}
  else{var sq=2*Math.sqrt(A)*al;if(type==='lowshelf'){b0=A*((A+1)-(A-1)*c+sq);b1=2*A*((A-1)-(A+1)*c);b2=A*((A+1)-(A-1)*c-sq);a0=(A+1)+(A-1)*c+sq;a1=-2*((A-1)+(A+1)*c);a2=(A+1)+(A-1)*c-sq;}
    else{b0=A*((A+1)+(A-1)*c+sq);b1=-2*A*((A-1)+(A+1)*c);b2=A*((A+1)+(A-1)*c-sq);a0=(A+1)-(A-1)*c+sq;a1=2*((A-1)-(A+1)*c);a2=(A+1)-(A-1)*c-sq;}}
  return [b0/a0,b1/a0,b2/a0,a1/a0,a2/a0];}
function eqJS(x,sr){MQB.forEach(function(b,i){if(!MQG[i])return;var k=rbj(b.t,MQF[i],MQQ[i],MQG[i],sr),x1=0,x2=0,y1=0,y2=0;for(var n=0;n<x.length;n++){var v=k[0]*x[n]+k[1]*x1+k[2]*x2-k[3]*y1-k[4]*y2;x2=x1;x1=x[n];y2=y1;y1=v;x[n]=v;}});return x;}
/* tonal fingerprint: power share per master-EQ band (dB), from a mono mix */
var BANDS=[[20,95],[95,250],[250,630],[630,1600],[1600,5000],[5000,16000]];
function bandProfile(mono,sr){var N2=8192,F=fftInit(N2),re=new Float64Array(N2),im=new Float64Array(N2),P=new Float64Array(N2/2),win=new Float64Array(N2),cnt=0;for(var i=0;i<N2;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/N2);
  var hop=Math.max(N2,Math.floor(mono.length/220));for(var s=0;s+N2<=mono.length;s+=hop){for(i=0;i<N2;i++){re[i]=mono[s+i]*win[i];im[i]=0;}fft(F,re,im,false);for(i=0;i<N2/2;i++)P[i]+=re[i]*re[i]+im[i]*im[i];cnt++;}
  var tot=0,b=BANDS.map(function(r){var e=0;for(var k=Math.floor(r[0]*N2/sr);k<Math.min(N2/2,Math.ceil(r[1]*N2/sr));k++)e+=P[k];tot+=e;return e;});return b.map(function(e){return 10*Math.log10(e/(tot||1)+1e-12);});}
function monoOf(b){var n=b.length,m=new Float32Array(n);for(var c=0;c<b.numberOfChannels;c++){var d=b.getChannelData(c);for(var i=0;i<n;i++)m[i]+=d[i]/b.numberOfChannels;}return m;}
var REF=null,MIXP=null;
function loadRef(file){if(!file||!ensureAudio())return;$('#refInfo').textContent='Analysing…';
  file.arrayBuffer().then(decodeAB).then(function(b){var chs=[];for(var c=0;c<Math.min(2,b.numberOfChannels);c++)chs.push(b.getChannelData(c));
    REF={name:(file.name||'reference').replace(/\.[^.]+$/,''),lufs:loudness(chs,b.sampleRate),tp:truePeak(chs),prof:bandProfile(monoOf(b),b.sampleRate)};
    $('#refInfo').textContent=REF.name+' · '+dec(REF.lufs,1)+' LUFS · TP '+dec(REF.tp,1)+' dBTP';$('#refCmp').disabled=false;renderRef();toast('Reference loaded. Tap Compare to analyse your mix against it.',2400);})
  .catch(function(){$('#refInfo').textContent='Couldn’t decode that file.';});}
function compareRef(){if(!REF||!ensureAudio())return;var btn=$('#refCmp');btn.textContent='Rendering your mix…';
  renderOffline({mode:'mix',spatial:false,src:daw.clips.length?'arrange':'song'}).then(function(r){var len=tailLength(r.buf,r.end),chs=cutBuffer(r.buf,len,false,r.js?Math.round(TRACKLAT*r.buf.sampleRate):0),m=new Float32Array(chs[0].length);for(var i=0;i<m.length;i++)m[i]=(chs[0][i]+chs[1][i])/2;
    MIXP={lufs:loudness(chs,r.buf.sampleRate),prof:bandProfile(m,r.buf.sampleRate)};renderRef();}).catch(function(){toast('Couldn’t render the mix.');}).then(function(){btn.textContent='Compare';});}
function renderRef(){var w=$('#refBars');if(!w)return;if(!REF){w.innerHTML='';return;}
  w.innerHTML=MQB.map(function(b,i){var d=MIXP?REF.prof[i]-MIXP.prof[i]:0;return '<div class="rb"><span>'+b.lbl+'</span><i style="height:'+Math.min(28,Math.abs(d)*3)+'px;'+(d>=0?'bottom:50%;':'top:50%;')+'background:'+(Math.abs(d)<1.5?'var(--ac)':'var(--or)')+'"></i><b>'+(MIXP?(d>0?'+':'')+dec(d,1):'·')+'</b></div>';}).join('');
  $('#refMatch').disabled=!MIXP;$('#refNote').textContent=MIXP?('Your mix '+dec(MIXP.lufs,1)+' LUFS vs reference '+dec(REF.lufs,1)+' LUFS ('+(MIXP.lufs<REF.lufs?'raise':'lower')+' Master by about '+dec(Math.abs(REF.lufs-MIXP.lufs),1)+' dB). Bars show what your mix needs per band.'):'Tap Compare.';}
function refMatchEq(amount){if(!REF||!MIXP)return;MQB.forEach(function(b,i){MQG[i]=clamp(Math.round((REF.prof[i]-MIXP.prof[i])*amount*2)/2,-6,6);});applyMasterEq();renderMqUI();markDirty();toast('Master EQ matched ('+Math.round(amount*100)+'%) — re-run Compare to check.',2200);}
function fLbl(f){return f>=1000?(Math.round(f/100)/10+'k').replace('.0k','k'):String(Math.round(f));}
function renderMqUI(){var w=$('#mqUI');if(!w)return;w.innerHTML=MQB.map(function(b,i){return '<label class="mqb'+(i===mqSel?' sel':'')+'"><output>'+(MQG[i]>0?'+':'')+dec(MQG[i],1)+'</output><input type="range" min="-12" max="12" step="0.5" value="'+MQG[i]+'" data-mq="'+i+'" aria-label="Master EQ band '+(i+1)+' gain"><button class="mqsel" data-mqs="'+i+'" aria-label="Edit band '+(i+1)+' frequency">'+fLbl(MQF[i])+'</button></label>';}).join('')+
    '<div class="mqp"><span class="mu">Band '+(mqSel+1)+' ('+(MQB[mqSel].t==='peaking'?'bell':MQB[mqSel].t==='lowshelf'?'low shelf':'high shelf')+')</span><label class="ctl"><span class="row"><span>Frequency</span><output id="mqFo">'+Math.round(MQF[mqSel])+' Hz</output></span><input type="range" id="mqF" min="0" max="1" step="0.001" value="'+(Math.log(MQF[mqSel]/20)/Math.log(1000))+'" aria-label="Band frequency"></label>'+
    (MQB[mqSel].t==='peaking'?'<label class="ctl"><span class="row"><span>Width (Q)</span><output id="mqQo">'+dec(MQQ[mqSel],1)+'</output></span><input type="range" id="mqQ" min="0.3" max="6" step="0.1" value="'+MQQ[mqSel]+'" aria-label="Band Q"></label>':'')+'</div>';
  $$('[data-mqs]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();mqSel=+b.getAttribute('data-mqs');renderMqUI();});});
  $('#mqF').addEventListener('input',function(e){MQF[mqSel]=Math.round(20*Math.pow(1000,+e.target.value));$('#mqFo').textContent=MQF[mqSel]+' Hz';var sb=$('[data-mqs="'+mqSel+'"]');if(sb)sb.textContent=fLbl(MQF[mqSel]);ensureAudio();applyMasterEq();markDirty();});
  if($('#mqQ'))$('#mqQ').addEventListener('input',function(e){MQQ[mqSel]=+e.target.value;$('#mqQo').textContent=dec(MQQ[mqSel],1);ensureAudio();applyMasterEq();markDirty();});
  $$('[data-mq]').forEach(function(inp){inp.addEventListener('input',function(){var i=+inp.getAttribute('data-mq');MQG[i]=+inp.value;inp.parentNode.querySelector('output').textContent=(MQG[i]>0?'+':'')+dec(MQG[i],1);ensureAudio();applyMasterEq();markDirty();});});}
function initRef(){renderMqUI();$('#f-MREF').addEventListener('change',function(e){loadRef(e.target.files[0]);e.target.value='';});$('#refCmp').addEventListener('click',compareRef);$('#refMatch').addEventListener('click',function(){refMatchEq(0.7);});
  $('#mqFlat').addEventListener('click',function(){mqReset();applyMasterEq();renderMqUI();markDirty();});}

