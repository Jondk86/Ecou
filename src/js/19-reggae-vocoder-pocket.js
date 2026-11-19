function hornLoad(id){if(hornBufs[id]&&hornBufs[id].sampleRate===ctx.sampleRate)return Promise.resolve(hornBufs[id]);if(id==='synth'){hornBufs.synth=dubHornBuf();return Promise.resolve(hornBufs.synth);}
  var bin=atob(HORNS[id].b64),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return ctx.decodeAudioData(u.buffer).then(function(b){var L=b.getChannelData(0),R=b.numberOfChannels>1?b.getChannelData(1):L,st=0;while(st<L.length&&Math.abs(L[st])<0.01&&Math.abs(R[st])<0.01)st++;st=Math.max(0,st-Math.round(0.002*b.sampleRate));
    var n=b.length-st,o=ctx.createBuffer(2,n,b.sampleRate);o.getChannelData(0).set(L.subarray(st));o.getChannelData(1).set(R.subarray(st));hornBufs[id]=fitRate(o);return hornBufs[id];});}
function setHorn(id,quiet){if(!ensureAudio())return;hornSel=id;var pad=pads[13];hornLoad(id).then(function(b){pad.buf=b;pad.name=id==='synth'?'Synth Horn':HORNS[id].name;pad.cls='perc';renderPads();renderHornChips();markDirty();if(!quiet){trigPad(13,0.9);toast(pad.name+' on pad 14'+(id==='ragga'?' — a D major phrase at 85 BPM; retune it with the pad Tune.':'')+'.',2200);}}).catch(function(e){toast('Could not decode the horn: '+e.message);});}
function hornPreload(){if(!ctx)return;['air','ragga'].forEach(function(id){if(!hornBufs[id]||hornBufs[id].sampleRate!==ctx.sampleRate)hornLoad(id).catch(function(e){errLog.push('horn: '+e.message);});});}
function hornToPad(id,i,name){var pad=pads[i];pad.name=name;pad.cls='perc';pad.level=0.9;pad.pan=0;pad.choke=0;hornLoad(id).then(function(b){pad.buf=b;pad.name=name;renderPads();}).catch(function(e){errLog.push('horn: '+e.message);});}
function renderHornChips(){var w0=$('#hornChips');if(w0){w0.innerHTML='';w0.hidden=true;}return;var w=$('#hornChips');if(!w)return;w.innerHTML='<span class="mu">Dub horn (pad 14):</span>'+[['air','Air Horn'],['ragga','Ragga Horn'],['synth','Synth Horn']].map(function(h){return '<button data-horn="'+h[0]+'" aria-pressed="'+(hornSel===h[0])+'">'+h[1]+'</button>';}).join('');
  $$('[data-horn]').forEach(function(b){b.addEventListener('click',function(){setHorn(b.getAttribute('data-horn'));});});}
/* riddims (EP-40 style): reggae kit + ready-made grooves */
function reggaeKit(){
  var TP=2*Math.PI,sr=ctx.sampleRate;function nz(){return Math.random()*2-1;}
  var K=[
    ['One-drop Kick','kick',kitBuf(0.6,function(t,s){s.ph=(s.ph||0)+TP*(42+70*Math.exp(-t*25))/sr;return Math.tanh(1.5*Math.sin(s.ph))*Math.exp(-t*5);})],
    ['Rim Click','perc',kitBuf(0.12,function(t){return (Math.sin(TP*1750*t)*0.6+Math.sin(TP*560*t))*Math.exp(-t*55)+nz()*0.3*Math.exp(-t*120);})],
    ['Spring Snare','snare',kitBuf(0.9,function(t,s){var tone=Math.sin(TP*200*t)*Math.exp(-t*22),n=nz()*Math.exp(-t*16),spr=Math.sin(TP*(2200+300*Math.sin(TP*7*t))*t)*0.25*Math.exp(-t*3.5)*Math.min(1,t*30);return tone*0.6+n*0.6+spr;})],
    ['Steppers Kick','kick',kitBuf(0.45,function(t,s){s.ph=(s.ph||0)+TP*(50+140*Math.exp(-t*35))/sr;return Math.sin(s.ph)*Math.exp(-t*7);})],
    ['Hat','hat',kitBuf(0.08,function(t,s){var w=nz(),h=w-(s.p||0);s.p=w;return h*Math.exp(-t*60);})],
    ['Open Hat','hat',kitBuf(0.45,function(t,s){var w=nz(),h=w-(s.p||0);s.p=w;return h*Math.exp(-t*8);})],
    ['Shaker','hat',kitBuf(0.12,function(t,s){var w=nz(),h=w-(s.p||0);s.p=w;return h*Math.min(1,t/0.015)*Math.exp(-t*35);})],
    ['Syndrum','perc',kitBuf(0.7,function(t,s){s.ph=(s.ph||0)+TP*(170+600*Math.exp(-t*9))/sr;return Math.sin(s.ph)*Math.exp(-t*4);})],
    ['Tom Lo','perc',kitBuf(0.5,function(t,s){s.ph=(s.ph||0)+TP*(95+40*Math.exp(-t*20))/sr;return Math.sin(s.ph)*Math.exp(-t*6);})],
    ['Tom Hi','perc',kitBuf(0.4,function(t,s){s.ph=(s.ph||0)+TP*(150+60*Math.exp(-t*20))/sr;return Math.sin(s.ph)*Math.exp(-t*7);})],
    ['Bongo','perc',kitBuf(0.25,function(t,s){s.ph=(s.ph||0)+TP*(330+120*Math.exp(-t*40))/sr;return Math.sin(s.ph)*Math.exp(-t*14);})],
    ['Crash','hat',kitBuf(1.6,function(t){return nz()*Math.exp(-t*2.2)*0.7;})],
    ['Laser','perc',kitBuf(0.5,function(t,s){s.ph=(s.ph||0)+TP*(2400*Math.exp(-t*7)+120)/sr;return Math.sin(s.ph)*Math.exp(-t*3);})],
    ['Synth Horn','perc',dubHornBuf()],
    ['Clap','snare',kitBuf(0.35,function(t){var e=0;[0,0.012,0.024].forEach(function(d){if(t>=d)e+=Math.exp(-(t-d)*(d===0.024?13:80));});return nz()*e;})],
    ['Sub Drop','kick',kitBuf(1.4,function(t,s){s.ph=(s.ph||0)+TP*(70*Math.exp(-t*1.4)+28)/sr;return Math.sin(s.ph)*Math.exp(-t*1.6);})]
  ];
  K.forEach(function(k,i){var p=pads[i];p.buf=k[2];p.name=k[0];p.cls=k[1];p.tune=0;p.decay=1;p.level=k[1]==='hat'?0.6:0.9;p.pan=k[1]==='hat'?0.2:0;p.choke=i===4||i===5?1:0;});
  hornPreload();
}
var RIDDIMS={
  onedrop:{name:'One drop',bpm:76,d:{0:[8],2:[8],1:[4,12],4:[2,6,10,14],5:[15],6:[1,3,5,7,9,11,13,15]},bass:[[0,3,36],[4,1,36],[6,2,43],[8,4,41],[14,2,39]]},
  steppers:{name:'Steppers',bpm:140,d:{3:[0,4,8,12],2:[4,12],4:[2,6,10,14],6:[0,2,4,6,8,10,12,14]},bass:[[0,2,36],[2,2,36],[4,2,43],[6,2,41],[8,2,39],[10,2,39],[12,4,36]]},
  rockers:{name:'Rockers',bpm:78,d:{0:[0,8],2:[4,12],1:[6,14],4:[0,2,4,6,8,10,12,14]},bass:[[0,2,36],[3,1,36],[4,2,39],[8,2,41],[11,1,41],[12,3,43]]},
  dancehall:{name:'Dancehall',bpm:96,d:{0:[0,3,8,11],14:[4,12],4:[2,6,10,14],10:[7,15]},bass:[[0,3,36],[3,3,36],[8,3,34],[11,3,34]]},
  dub:{name:'Dub',bpm:70,d:{0:[8],2:[4,12],7:[14],4:[2,6,10,14]},bass:[[0,4,36],[6,2,39],[8,6,43],[14,2,41]]},
  rocksteady:{name:'Rocksteady',bpm:76,sw:0.14,d:{0:[0,8],1:[4,12],4:[0,2,4,6,8,10,12,14],10:[7,15]},bass:[[0,2,38],[2,1,42],[3,1,45],[4,2,47],[8,2,43],[10,1,45],[11,1,47],[12,2,49]],ch:[62,66,69],sk:[2,6,10,14],bub:true},
  ska:{name:'Ska',bpm:126,sw:0.06,d:{0:[0,8],2:[4,12],4:[0,2,4,6,8,10,12,14],5:[14]},bass:[[0,2,40],[2,2,44],[4,2,47],[6,2,49],[8,2,45],[10,2,49],[12,2,52],[14,2,47]],ch:[64,68,71],sk:[2,6,10,14]},
  lovers:{name:'Lovers rock',bpm:72,sw:0.2,d:{0:[8],1:[4,12],4:[2,6,10,14],6:[1,3,5,7,9,11,13,15]},bass:[[0,3,41],[4,2,45],[8,3,38],[12,2,40],[14,2,43]],ch:[65,69,72],sk:[2,6,10,14],bub:true},
  digital:{name:'Digital 85',bpm:92,sw:0.05,d:{0:[0,3,8,11],14:[4,12],4:[0,2,4,6,8,10,12,14],12:[15]},bass:[[0,2,40],[3,1,40],[6,2,43],[8,2,45],[11,1,45],[14,2,47]],ch:[64,67,71],sk:[2,6,10,14],digi:true},
  steppersdub:{name:'Steppers dub',bpm:145,sw:0,d:{3:[0,4,8,12],2:[8],1:[4,12],6:[2,6,10,14],15:[14]},bass:[[0,3,38],[4,3,38],[8,2,45],[10,2,43],[12,4,41]],ch:[62,65,69],sk:[4,12]},
  bashment:{name:'Bashment',bpm:100,sw:0.04,d:{0:[0,8],14:[3,6,11,14],4:[2,6,10,14],10:[1,9]},bass:[[0,3,41],[3,3,41],[6,2,44],[8,3,39],[11,3,39],[14,2,43]],ch:[65,68,72],sk:[3,11]},
  nyabinghi:{name:'Nyabinghi',bpm:68,sw:0.12,d:{8:[0,6,8,14],9:[4,12],10:[2,3,10,11],1:[4,12]},bass:[[0,6,38],[8,6,43],[14,2,41]],ch:[62,65,69],sk:[4,12]}
};
function loadRiddim(id){
  if(!ensureAudio())return;var R=RIDDIMS[id],pt=patterns[curPat];if(!R)return;transportStop();
  reggaeKit();pt.len=16;pt.drums.forEach(function(a){a.fill(false);});pt.locks={};
  Object.keys(R.d).forEach(function(i){R.d[i].forEach(function(s){pt.drums[+i][s]=s%4===0?1:0.8;});});
  pt.notes[3]=R.bass.map(function(b){return {s:b[0],l:b[1],m:b[2],v:0.9};});
  var CH=R.ch||[60,63,67];pt.notes[1]=(R.sk||[2,6,10,14]).map(function(s){return CH.map(function(m,k){return {s:s,l:1,m:m,v:k?0.6:0.7};});}).reduce(function(a,b){return a.concat(b);},[]);
  pt.notes[2]=R.bub?[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].filter(function(s){return s%2===1;}).map(function(s,k){return {s:s,l:1,m:(k%2?CH[2]:CH[0])-12,v:0.45};}):(R.digi?[0,3,6,8,11,14].map(function(s){return {s:s,l:1,m:CH[0]+12,v:0.5};}):[]);
  setParam('bpm',R.bpm);setParam('swing',R.sw!=null?R.sw:(id==='onedrop'||id==='dub'?0.18:0.08));
  var keep=selTrack;[[1,'skank'],[3,R.digi?'sub':'dub']].concat(pt.notes[2].length?[[2,R.digi?'pluck':'organ']]:[]).forEach(function(x){selectTrack(x[0]);if(STOCK[x[1]])loadStock(x[1]);});selectTrack(keep);
  bindPads();renderPads();selectPad(0);renderPatSegs();paintSteps();renderPadDots();drawRoll();markDirty();
  toast(R.name+' riddim loaded on pattern '+PATN[curPat]+' — reggae kit, dub bass and skank organ at '+R.bpm+' BPM. Press Play, then hold the punch-in FX.',4200);
}
/* PO-35 style voice characters: offline DSP on the sound in Capture slot A */
function olaShift(x,ratio,sr){ /* time-domain grain pitch shifter, keeps duration */
  var W=Math.floor(sr*0.04),H=Math.floor(W/4),out=new Float32Array(x.length),norm=new Float32Array(x.length),win=new Float32Array(W),i,j;
  for(i=0;i<W;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/W);
  for(var o=0;o+W<x.length;o+=H){for(j=0;j<W;j++){var p=o+j*ratio,k=Math.floor(p),f=p-k;if(k+1>=x.length)break;out[o+j]+=(x[k]*(1-f)+x[k+1]*f)*win[j];norm[o+j]+=win[j];}}
  for(i=0;i<x.length;i++)out[i]=norm[i]>0.1?out[i]/norm[i]:0;return out;}
function biq(x,type,f,q,sr){var w=2*Math.PI*f/sr,c=Math.cos(w),s=Math.sin(w),a=s/(2*q),b0,b1,b2,a0=1+a,a1=-2*c,a2=1-a;
  if(type==='bp'){b0=a;b1=0;b2=-a;}else if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2;}else{b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;}
  var y=new Float32Array(x.length),x1=0,x2=0,y1=0,y2=0;for(var i=0;i<x.length;i++){var v=(b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2)/a0;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}return y;}
function vocode(mod,car,sr){var out=new Float32Array(mod.length),bands=18,lo=110,hi=7000;
  for(var b=0;b<bands;b++){var f=lo*Math.pow(hi/lo,(b+0.5)/bands),m=biq(mod,'bp',f,6,sr),c=biq(car,'bp',f,6,sr),env=0,att=Math.exp(-1/(sr*0.004)),rel=Math.exp(-1/(sr*0.03));
    for(var i=0;i<mod.length;i++){var a=Math.abs(m[i]);env=a>env?att*env+(1-att)*a:rel*env+(1-rel)*a;out[i]+=c[i]*env*4;}}return out;}
var SPEAK={robot:'Robot',chip:'Chipmunk',monster:'Monster',whisper:'Whisper',vocoder:'Vocoder chord',phone:'Telephone',alien:'Alien',choir:'Choir'};
function speakChar(id){
  if(!ensureAudio())return;var s=slots.A;if(!s||!s.buf){toast('Record or import a sound into A first.');return;}
  var srcB=s.spkSrc||s.buf,src0={name:s.spkName||s.name,root:s.spkRoot||s.root,det:s.det},sr=srcB.sampleRate,x=srcB.getChannelData(0).slice(0,Math.min(srcB.length,sr*8)),y,n=x.length,i,TP=2*Math.PI;
  if(id==='chip')y=olaShift(x,1.7,sr);
  else if(id==='monster')y=olaShift(x,0.62,sr);
  else if(id==='alien'){y=olaShift(x,1.35,sr);for(i=0;i<n;i++)y[i]*=Math.sin(TP*420*i/sr);}
  else if(id==='phone'){y=biq(biq(x,'hp',420,0.7,sr),'lp',3000,0.7,sr);for(i=0;i<n;i++)y[i]=Math.tanh(y[i]*4);}
  else if(id==='choir'){var a=olaShift(x,Math.pow(2,4/12),sr),b=olaShift(x,Math.pow(2,7/12),sr),c=olaShift(x,0.5,sr);y=new Float32Array(n);for(i=0;i<n;i++)y[i]=x[i]+0.7*a[i]+0.6*b[i]+0.5*c[i];}
  else{var car=new Float32Array(n);
    if(id==='whisper')for(i=0;i<n;i++)car[i]=Math.random()*2-1;
    else{var fs=id==='robot'?[110]:[130.8,155.6,196,233.1];for(i=0;i<n;i++){var t=i/sr,v=0;fs.forEach(function(f){v+=2*((f*t)%1)-1;});car[i]=v/fs.length;}}
    y=vocode(x,car,sr);}
  normalize(y);var nb=ctx.createBuffer(1,n,sr);nb.getChannelData(0).set(y);
  setSlot('A',nb,src0.name+' · '+SPEAK[id],id==='robot'||id==='vocoder'?(id==='robot'?110:130.8):src0.root,id==='robot'||id==='vocoder'?true:src0.det);slots.A.spkSrc=srcB;slots.A.spkName=src0.name;slots.A.spkRoot=src0.root;
  saveSound(selTrack);toast('Voice character: '+SPEAK[id]+'. Play it on the keys or send it to a pad.',2400);
  noteOn('spk',60,0.8);setTimeout(function(){noteOff('spk');},600);
}
function initPocket(){
  // punch-in FX grid
  $('#pfxGrid').innerHTML=PFX.map(function(x,i){return '<button data-pfx="'+x.id+'"><b>'+(i+1)+'</b>'+x.name+'</button>';}).join('');
  $$('[data-pfx]').forEach(function(b){var id=b.getAttribute('data-pfx');
    b.addEventListener('pointerdown',function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(x){}b.classList.add('on');var r=b.getBoundingClientRect(),am=0.5+clamp((e.clientY-r.top)/r.height,0,1);pfUser[id]=1;pfOn(id,am);fxRecOn(id,Math.round(am*100)/100);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){b.addEventListener(ev,function(){if(!b.classList.contains('on'))return;b.classList.remove('on');delete pfUser[id];fxRecOff(id);pfOff(id);});});
    b.addEventListener('contextmenu',function(e){e.preventDefault();});});
  $('#pfFader').addEventListener('input',function(e){pfFader=+e.target.value;var o=$('#pfFo');o.textContent=Math.abs(pfFader)<0.03?'open':(pfFader<0?'low-pass '+Math.round(-pfFader*100)+'%':'high-pass '+Math.round(pfFader*100)+'%');ensureAudio();applyFader();fxFadeMove(pfFader);});
  $('#pfFader').addEventListener('pointerdown',function(){fxFadeStart();});
  ['change','pointerup','pointercancel'].forEach(function(ev){$('#pfFader').addEventListener(ev,function(){fxFadeEnd();});});
  $('#pfFader').addEventListener('dblclick',function(e){e.target.value=0;pfFader=0;$('#pfFo').textContent='open';applyFader();fxFadeStart();fxFadeMove(0);fxFadeEnd();});
  $('#pfReset').addEventListener('click',function(){$('#pfFader').value=0;pfFader=0;$('#pfFo').textContent='open';applyFader();fxFadeStart();fxFadeMove(0);fxFadeEnd();});
  // note repeat + keys mode
  $('#nrBtn').addEventListener('click',function(){nrOn=!nrOn;this.setAttribute('aria-pressed',nrOn);});
  $$('[data-nr]').forEach(function(b){b.addEventListener('click',function(){nrRate=+b.getAttribute('data-nr');$$('[data-nr]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
  renderKeysSrc();$('#keysSrc').addEventListener('change',function(e){keysSrc=+e.target.value;if(keysSrc>0)selectTrack(keysSrc);renderPads();toast(keysSrc>0?'Pads play '+tracks[keysSrc].name+' ('+keyScale+' scale, bottom-left = root).':'Pads play the selected pad sound at different pitches.',2000);});
  $('#keysBtn').addEventListener('click',function(){keysMode=!keysMode;renderKeysSrc();this.setAttribute('aria-pressed',keysMode);$('#pads').classList.toggle('keys',keysMode);renderPads();if(keysMode&&keysSrc>0&&tracks[keysSrc])selectTrack(keysSrc);toast(keysMode?'Keys mode: the pads play '+(keysSrc>0&&tracks[keysSrc]?tracks[keysSrc].name:pads[padSel].name)+' in '+keyScale+' — bottom-left is the root. Change the instrument next to the button.':'Pads mode.',2400);});
  $('#keysScale').addEventListener('change',function(){keyScale=this.value;if(keysMode)renderPads();});
  $('#commitBtn').addEventListener('click',commitPattern);
  // step locks
  $('#lkP').addEventListener('input',updLockOut);$('#lkL').addEventListener('input',updLockOut);
  ['#lkP','#lkL'].forEach(function(s){$(s).addEventListener('change',saveLock);});
  $$('[data-lkr]').forEach(function(b){b.addEventListener('click',function(){$$('[data-lkr]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});saveLock();});});
  $('#lkClose').addEventListener('click',function(){$('#lockEd').hidden=true;lockStep=-1;});
  $('#lkTry').addEventListener('click',function(){var L={p:+$('#lkP').value,l:+$('#lkL').value};trigPad(padSel,0.9*L.l,0,L.p);});
  var st=$('#steps'),lpT=null;
  st.addEventListener('pointerdown',function(e){var b=e.target.closest('button');if(!b)return;var q=+b.getAttribute('data-st')+page*16;clearTimeout(lpT);lpT=setTimeout(function(){lpT='fired';openLock(q);},480);});
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){st.addEventListener(ev,function(){if(lpT!=='fired')clearTimeout(lpT);});});
  st.addEventListener('click',function(e){if(lpT==='fired'){e.stopPropagation();e.preventDefault();lpT=null;}},true);
  // riddims + speak
  renderHornChips();$('#ridChips').innerHTML=Object.keys(RIDDIMS).map(function(k){return '<button data-rid="'+k+'">'+RIDDIMS[k].name+' · '+RIDDIMS[k].bpm+'</button>';}).join('');
  $$('[data-rid]').forEach(function(b){b.addEventListener('click',function(){loadRiddim(b.getAttribute('data-rid'));});});
  $('#spkChips').innerHTML=Object.keys(SPEAK).map(function(k){return '<button data-spk="'+k+'">'+SPEAK[k]+'</button>';}).join('')+'<button id="vtCapBtn" class="vt-chip">Tune (auto-tune)</button>';
  $$('[data-spk]').forEach(function(b){b.addEventListener('click',function(){speakChar(b.getAttribute('data-spk'));});});
}

/* ---------- CHANNEL STRIPS, SIDECHAIN, MASTER METERING ---------- */
