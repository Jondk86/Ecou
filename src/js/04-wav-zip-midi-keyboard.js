function encodeWavF(chs,sr){
  var nc=chs.length,n=chs[0].length,data=n*nc*4,buf=new ArrayBuffer(44+data),dv=new DataView(buf),o=0;
  function str(s){for(var i=0;i<s.length;i++)dv.setUint8(o++,s.charCodeAt(i));}
  function u32(v){dv.setUint32(o,v,true);o+=4;}function u16(v){dv.setUint16(o,v,true);o+=2;}
  str('RIFF');u32(36+data);str('WAVE');str('fmt ');u32(16);u16(3);u16(nc);u32(sr);u32(sr*nc*4);u16(nc*4);u16(32);str('data');u32(data);
  for(var i=0;i<n;i++)for(var c=0;c<nc;c++){dv.setFloat32(o,chs[c][i],true);o+=4;}
  return vmTagWav(new Uint8Array(buf));
}
function encodeWav(chs,sr){
  var nc=chs.length,n=chs[0].length,bps=3,data=n*nc*bps,buf=new ArrayBuffer(44+data),dv=new DataView(buf),o=0;
  function str(s){for(var i=0;i<s.length;i++)dv.setUint8(o++,s.charCodeAt(i));}
  function u32(v){dv.setUint32(o,v,true);o+=4;}function u16(v){dv.setUint16(o,v,true);o+=2;}
  str('RIFF');u32(36+data);str('WAVE');str('fmt ');u32(16);u16(1);u16(nc);u32(sr);u32(sr*nc*bps);u16(nc*bps);u16(24);str('data');u32(data);
  for(var i=0;i<n;i++){for(var c=0;c<nc;c++){var s=Math.max(-1,Math.min(1,chs[c][i])),v=Math.round(s*8388607);dv.setUint8(o++,v&255);dv.setUint8(o++,(v>>8)&255);dv.setUint8(o++,(v>>16)&255);}}
  return vmTagWav(new Uint8Array(buf));
}
function encodeWav16(chs,sr){
  var nc=chs.length,n=chs[0].length,data=n*nc*2,buf=new ArrayBuffer(44+data),dv=new DataView(buf),o=0;
  function str(s){for(var i=0;i<s.length;i++)dv.setUint8(o++,s.charCodeAt(i));}
  function u32(v){dv.setUint32(o,v,true);o+=4;}function u16(v){dv.setUint16(o,v,true);o+=2;}
  str('RIFF');u32(36+data);str('WAVE');str('fmt ');u32(16);u16(1);u16(nc);u32(sr);u32(sr*nc*2);u16(nc*2);u16(16);str('data');u32(data);
  for(var i=0;i<n;i++){for(var c=0;c<nc;c++){var s=Math.max(-1,Math.min(1,chs[c][i]+(Math.random()-Math.random())/32768)),v=Math.round(s*32767);dv.setInt16(o,v,true);o+=2;}}
  return vmTagWav(new Uint8Array(buf));
}
var WAVBITS=24;
var CRC=null;
function crc32(b){if(!CRC){CRC=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0;}}var crc=0xFFFFFFFF;for(var i=0;i<b.length;i++)crc=CRC[(crc^b[i])&255]^(crc>>>8);return (crc^0xFFFFFFFF)>>>0;}
function zipStore(name,data){
  var nm=new TextEncoder().encode(name),crc=crc32(data),sz=data.length;
  var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
  var cd=new DataView(new ArrayBuffer(46));cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint32(16,crc,true);cd.setUint32(20,sz,true);cd.setUint32(24,sz,true);cd.setUint16(28,nm.length,true);cd.setUint32(42,0,true);
  var cdOff=30+nm.length+sz,cdSize=46+nm.length;
  var end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,1,true);end.setUint16(10,1,true);end.setUint32(12,cdSize,true);end.setUint32(16,cdOff,true);
  return new Blob([lh.buffer,nm,data,cd.buffer,nm,end.buffer],{type:'application/zip'});
}
function stamp(){var d=new Date(),p=function(x){return String(x).padStart(2,'0');};return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
function saveWav(bytes,base){
  var wav=base+'.wav';
  if(window.claude&&typeof window.claude.use==='function'){
    window.claude.use('downloads').then(function(dl){
      if(!dl){toast('Saving isn’t available in this view.');return;}
      return dl.save({filename:base+'.zip',data:zipStore(wav,bytes)}).then(function(){toast('Saved '+wav+' (inside a .zip).');}).catch(function(e){toast(e&&e.code==='declined'?'Save cancelled.':'Couldn’t save ('+((e&&e.code)||'error')+').');});
    });
    return;
  }
  var url=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'})),a=document.createElement('a');a.href=url;a.download=wav;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);
}

/* ---------- MIDI ---------- */
var bend=0;
function onMidi(e){
  var d=e.data;if(stMidi(d))return;var st=d[0]&0xf0,a=d[1],b=d[2];
  if((d[0]&15)===9){if(st===0x90&&b>0)trigPad(((a-36)%16+16)%16,0.2+0.8*b/127);return;}
  if(st===0x90&&b>0)noteOn('m'+a,a,0.15+0.85*b/127);
  else if(st===0x80||(st===0x90&&b===0))noteOff('m'+a);
  else if(st===0xB0&&a===1)src.modw=b/127;
  else if(st===0xB0&&(a===123||a===120))allOff();
  else if(st===0xE0)bend=(((b<<7)|a)-8192)/8192;
}
function midiConnect(){
  ensureAudio();
  if(!navigator.requestMIDIAccess){toast('Web MIDI isn’t supported in this browser. Use Chrome.');return;}
  navigator.requestMIDIAccess().then(function(acc){
    var hook=function(){var n=0,names=[];acc.inputs.forEach(function(inp){inp.onmidimessage=onMidi;n++;names.push(inp.name);});
      $('#midiState').textContent=n?names.join(', '):'no devices';return n;};
    var n=hook();acc.onstatechange=hook;
    toast(n?'MIDI connected: '+n+' input'+(n>1?'s':'')+'.':'No MIDI devices found. Connect a controller and try again.');
  }).catch(function(){$('#midiState').textContent='blocked';toast('MIDI access is blocked in this view.');});
}
function synthIR(sec){
  var sr=ctx.sampleRate,n=Math.floor(sec*sr),b=ctx.createBuffer(2,n,sr);
  for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++){var t=i/sr;d[i]=(Math.random()*2-1)*Math.exp(-6.9*t/sec)*Math.min(1,t*300);}}
  return b;
}
function normalize(d){var pk=0;for(var i=0;i<d.length;i++){var a=Math.abs(d[i]);if(!(a<1e9)){d[i]=0;continue;}if(a>pk)pk=a;}if(pk>0){var g=0.9/pk;for(var j=0;j<d.length;j++)d[j]*=g;}return d;}
function synthBuf(dur,fn){var sr=ctx.sampleRate,n=Math.floor(dur*sr),b=ctx.createBuffer(1,n,sr),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=fn(i/sr);normalize(d);return b;}
function makeDemos(){
  var parts=[[1,1,1.6],[2.32,0.5,1.0],[4.25,0.32,0.6],[6.63,0.18,0.35]],TP=2*Math.PI;
  var glass=synthBuf(2.6,function(t){var s=0;for(var i=0;i<parts.length;i++){var p=parts[i];s+=p[1]*Math.sin(TP*880*p[0]*t)*Math.exp(-t/p[2]);}return s*Math.min(1,t*900);});
  var pad=synthBuf(3,function(t){var s=0;for(var h=1;h<=10;h++){s+=Math.sin(TP*261.63*h*t+0.6*Math.sin(TP*0.35*t*h))/h;}return s*Math.min(1,t/0.35)*Math.min(1,(3-t)/0.35);});
  setSlot('A',glass,'Glass Tap',880,true);
  setSlot('B',pad,'Choir Pad',261.63,true);
}

/* ---------- claviatură ---------- */
var octave=4;
var WHITE=[0,2,4,5,7,9,11,12,14,16];
var BLACK=[[0,1],[1,3],[3,6],[4,8],[5,10],[7,13],[8,15]];
function buildKeyboard(){
  var kb=$('#kb');kb.innerHTML='';var base=12*(octave+1);
  WHITE.forEach(function(st){var d=document.createElement('div');d.className='wk';d.setAttribute('data-midi',base+st);d.textContent=st%12===0?nname(base+st):'';kb.appendChild(d);});
  BLACK.forEach(function(p){var d=document.createElement('div');d.className='bk';d.setAttribute('data-midi',base+p[1]);d.setAttribute('data-wi',p[0]);kb.appendChild(d);});
  layoutBlacks();$('#oct').textContent=nname(base)+' – '+nname(base+16);try{harmPaintKeys();}catch(e){}
}
function layoutBlacks(){
  var kb=$('#kb'),W=kb.clientWidth,gap=3,n=10,kw=(W-gap*(n-1))/n,bw=kw*0.62;
  $$('#kb .bk').forEach(function(d){var wi=+d.getAttribute('data-wi');d.style.width=bw+'px';d.style.left=((wi+1)*(kw+gap)-gap/2-bw/2)+'px';});
}
if(window.ResizeObserver){new ResizeObserver(function(){layoutBlacks();}).observe(document.getElementById('kb'));}
function markKey(midi,on){harmLive();$$('#kb [data-midi="'+midi+'"]').forEach(function(d){d.classList.toggle('on',on);});}
var ptr=new Map(),fing=new Map();
function updFinger(){var last=0;fing.forEach(function(v){last=v;});src.finger=fing.size?last:0;}
function keyAt(x,y){var el=document.elementFromPoint(x,y);return el&&el.closest?el.closest('#kb .wk, #kb .bk'):null;}
function handlePtr(e){
  var key=keyAt(e.clientX,e.clientY);if(!key)return;
  var midi=+key.getAttribute('data-midi'),r=key.getBoundingClientRect(),rel=clamp((e.clientY-r.top)/r.height,0,1);
  fing.set(e.pointerId,rel);updFinger();
  if(ptr.get(e.pointerId)!==midi){noteOff('p'+e.pointerId);ptr.set(e.pointerId,midi);noteOn('p'+e.pointerId,midi,0.3+0.7*rel);}
}
function endPtr(e){if(ptr.has(e.pointerId)){noteOff('p'+e.pointerId);ptr.delete(e.pointerId);fing.delete(e.pointerId);updFinger();}}
