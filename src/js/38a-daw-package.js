/* ---------- SEND TO ABLETON / ANY DAW: stems from bar 1 + Type 1 MIDI (tempo map, meters, keys, markers, lyrics) + README + project, one zip ----------
   Heavy DSP (reverb convolution, master EQ on the wet, match-to-target, WAV encode, CRC) runs in a Worker; each finished file becomes a Blob
   right away so the browser can page it out; the zip is just a list of Blob parts (stored, no compression). */
var DAWX={busy:false,cancel:false,bits:32,gain:1,fx:'print',arm:0,w:null,wq:{},wid:0,last:null,info:null};
var DAWFN=['fftInit','fft','fftConvolve','biq','jsMaster','softClipCurve','loudness','kFilter','kCoefs','mxMatch','truePeak','dbg','clamp'];
function dawWorkerMain(){
  var CT=new Uint32Array(256);for(var q=0;q<256;q++){var c0=q;for(var k0=0;k0<8;k0++)c0=c0&1?0xEDB88320^(c0>>>1):c0>>>1;CT[q]=c0>>>0;}
  function crc(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function wav(chs,sr,bits){var nc=chs.length,n=chs[0].length,fl=bits===32,bps=fl?4:3,data=n*nc*bps,hl=fl?58:44,buf=new ArrayBuffer(hl+data),dv=new DataView(buf),u=new Uint8Array(buf),o=0,i,c;
    function str(s){for(var j=0;j<s.length;j++)u[o++]=s.charCodeAt(j);}function u32(v){dv.setUint32(o,v,true);o+=4;}function u16(v){dv.setUint16(o,v,true);o+=2;}
    str('RIFF');u32(hl-8+data);str('WAVE');str('fmt ');u32(fl?18:16);u16(fl?3:1);u16(nc);u32(sr);u32(sr*nc*bps);u16(nc*bps);u16(bits);if(fl){u16(0);str('fact');u32(4);u32(n);}str('data');u32(data);
    if(fl){var il=new Float32Array(n*nc);for(i=0;i<n;i++)for(c=0;c<nc;c++)il[i*nc+c]=chs[c][i];u.set(new Uint8Array(il.buffer),hl);}
    else{for(i=0;i<n;i++)for(c=0;c<nc;c++){var s=chs[c][i];s=s>1?1:s<-1?-1:s;var v=Math.round(s*8388607);u[o++]=v&255;u[o++]=(v>>8)&255;u[o++]=(v>>16)&255;}}
    return u;}
  function proc(d){var m=d.m,sr=d.sr,n=m[0].length,i;
    if(d.snd){for(var c=0;c<2;c++){var w=fftConvolve(d.snd[c],d.h[c]);if(d.preS>0){var ws=new Float32Array(w.length);ws.set(w.subarray(0,w.length-d.preS),d.preS);w=ws;}
      w=biq(biq(w,'hp',d.rvLo,0.7,sr),'lp',d.rvHi,0.7,sr);
      (d.eq||[]).forEach(function(k){var x1=0,x2=0,y1=0,y2=0;for(var j=0;j<w.length;j++){var v=k[0]*w[j]+k[1]*x1+k[2]*x2-k[3]*y1-k[4]*y2;x2=x1;x1=w[j];y2=y1;y1=v;w[j]=v;}});
      var K=d.k,mc=m[c];for(i=0;i<n;i++)mc[i]+=w[i]*K;}}
    if(d.match){P.ceil.v=d.match.ceil;TGT=d.match.tgt;mxMatch(m,sr);}
    var len=d.len;
    if(len==null){var th=Math.pow(10,-80/20),last=Math.floor(d.end*sr);for(i=n-1;i>last;i--){if(Math.abs(m[0][i])>th||Math.abs(m[1][i])>th){last=i;break;}}len=Math.min(n,last+Math.floor(sr*0.2));}
    var off=d.off||0,L=Math.min(len,n-off),f=Math.floor(sr*0.05),pk=0,out=[m[0].slice(off,off+L),m[1].slice(off,off+L)];
    if(L<len){out=out.map(function(x){var y=new Float32Array(len);y.set(x);return y;});}
    out.forEach(function(x){for(var j=0;j<f&&j<L;j++)x[L-1-j]*=j/f;for(var q2=0;q2<x.length;q2++){var a=x[q2]<0?-x[q2]:x[q2];if(a>pk)pk=a;}});
    if(d.hold){HOLD={out:out,sr:sr,bits:d.bits};return {wav:new Uint8Array(0),crc:0,len:len,peak:pk,last:d.match?MIX.last:null};}
    return enc(out,sr,d.bits,d.gain,len,pk);}
  var HOLD=null;
  function enc(out,sr,bits,g,len,pk){if(g!=null&&g!==1)out.forEach(function(x){for(var j=0;j<x.length;j++)x[j]*=g;});var u=wav(out,sr,bits);return {wav:u,crc:crc(u),len:len,peak:pk*(g==null?1:g)};}
  self.onmessage=function(e){var d=e.data,r;try{if(d.crcOnly){var b=d.crcOnly;self.postMessage({id:d.id,crc:crc(b),wav:b},[b.buffer]);return;}if(d.enc){var H=HOLD;HOLD=null;r=enc(H.out,H.sr,H.bits,d.gain,H.out[0].length,d.peak);}else r=proc(d);}catch(err){self.postMessage({id:d.id,err:String(err&&err.stack||err)});return;}
    self.postMessage({id:d.id,wav:r.wav,crc:r.crc,len:r.len,peak:r.peak,last:r.last||null},[r.wav.buffer]);};
}
function dawW(){if(DAWX.w)return DAWX.w;
  var F={fftInit:fftInit,fft:fft,fftConvolve:fftConvolve,biq:biq,jsMaster:jsMaster,softClipCurve:softClipCurve,loudness:loudness,kFilter:kFilter,kCoefs:kCoefs,mxMatch:mxMatch,truePeak:truePeak,dbg:dbg,clamp:clamp};
  var src=DAWFN.map(function(n){return 'var '+n+'='+F[n].toString()+';';}).join('\n')+'\nvar P={ceil:{v:-1}},TGT=-14,MIX={};function mxTgtVal(){return TGT;}function mxLastTxt(){}\n('+dawWorkerMain.toString()+')();';
  var w=new Worker(URL.createObjectURL(new Blob([src],{type:'application/javascript'})));
  w.onmessage=function(e){var q=DAWX.wq[e.data.id];delete DAWX.wq[e.data.id];if(!q)return;if(e.data.err)q.rej(new Error(e.data.err));else q.res(e.data);};
  w.onerror=function(e){Object.keys(DAWX.wq).forEach(function(k){DAWX.wq[k].rej(new Error('worker: '+(e.message||'')));delete DAWX.wq[k];});};
  DAWX.w=w;return w;}
function dawCall(d,tr){return new Promise(function(res,rej){var id=++DAWX.wid;d.id=id;DAWX.wq[id]={res:res,rej:rej};dawW().postMessage(d,tr||[]);});}
function dawEqK(sr){var out=[];MQB.forEach(function(b,i){if(MQG[i])out.push(rbj(b.t,MQF[i],MQQ[i],MQG[i],sr));});return out;}
/* render one bus (mix / one track / FX returns) and let the worker finish + encode it */
function dawBus(o,x){return renderOffline(o).then(function(r){
  var d={m:r.m,snd:r.snd,h:r.h,preS:r.preS,rvLo:r.rvLo,rvHi:r.rvHi,k:r.k,eq:r.eq?dawEqK(r.sr):[],sr:r.sr,end:r.end,len:x.len,off:x.off,bits:DAWX.bits,match:x.match||null,hold:!!x.hold,gain:x.hold?1:DAWX.gain};
  var tr=[r.m[0].buffer,r.m[1].buffer];if(r.snd)tr.push(r.snd[0].buffer,r.snd[1].buffer);r=null;return dawCall(d,tr);});}
function dawCrc(u){return dawCall({crcOnly:u},[u.buffer]);}
/* zip writer over Blob parts (STORE, UTF-8 names) */
function DZip(){this.parts=[];this.cd=[];this.off=0;this.n=0;}
DZip.prototype.add=function(name,data,crc){var nm=u8(name),sz=data.size!=null?data.size:data.length;if(crc==null)crc=crc32(data);
  var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,0x21,true);lh.setUint16(12,0x5B54,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
  var cd=new DataView(new ArrayBuffer(46));cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint16(8,0x0800,true);cd.setUint16(12,0x21,true);cd.setUint16(14,0x5B54,true);cd.setUint32(16,crc,true);cd.setUint32(20,sz,true);cd.setUint32(24,sz,true);cd.setUint16(28,nm.length,true);cd.setUint32(42,this.off,true);
  this.parts.push(lh.buffer,nm,data instanceof Blob?data:new Blob([data]));this.cd.push(cd.buffer,nm);this.off+=30+nm.length+sz;this.n++;};
DZip.prototype.blob=function(){var cs=this.cd.reduce(function(a,b){return a+(b.byteLength||b.length);},0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,this.n,true);e.setUint16(10,this.n,true);e.setUint32(12,cs,true);e.setUint32(16,this.off,true);
  return new Blob(this.parts.concat(this.cd,[e.buffer]),{type:'application/zip'});};
/* song facts shared by MIDI and README */
var DAWNOTE=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],DAWSF=[0,-5,2,-3,4,-1,6,1,-4,3,-2,5];
function dawMinor(md){return /min|aeol|dor|phr|loc/i.test(md||'');}
function dawKeySig(pc,md){var off=/aeol|^min|minor/i.test(md||'')?3:/dor/i.test(md||'')?10:/phr/i.test(md||'')?8:/lyd/i.test(md||'')?7:/mix/i.test(md||'')?5:/loc/i.test(md||'')?1:0;return {sf:DAWSF[(pc+off)%12],mi:dawMinor(md)?1:0};}
function dawKeyName(pc,md){md=md||'major';return DAWNOTE[((pc%12)+12)%12]+' '+(/^(ionian|major)$/i.test(md)?'major':/^(aeolian|minor)$/i.test(md)?'minor':md);}
function dawSteps(ss){return ss==='arrange'?Math.ceil(arrEnd()):songOrder().reduce(function(a,pi){return a+patterns[pi].len;},0);}
function dawFacts(){var ss=stemSrc(),steps=dawSteps(ss),secs=[],tm=ss==='arrange'&&daw.tmap&&daw.tmap.length;
  if(SEC.list.length&&SEC.reg&&SEC.reg.length){var bar=1;secLayout().forEach(function(Ly){var s=Ly.sec;secs.push({name:s.name,s:Ly.s,l:Ly.l,bar:bar,bars:s.bars,meter:secMeter(s),key:secKey(s),mode:secMode(s),bpm:Math.round(secBpm(s)*100)/100,lyric:s.lyric||''});bar+=s.bars;});}
  var sec0=secs[0],key=sec0?sec0.key:(GAR.key||0),mode=sec0?sec0.mode:(GAR.band&&GAR.band.mode)||'major';
  var tempo=[],last=null,dur=0;for(var g=0;g<steps;g++){var b=tm?tmBpm(g):P.bpm.v,us=Math.round(60000000/b);if(us!==last){tempo.push({s:g,us:us,bpm:b});last=us;}dur+=tm?tmSd(g):stepDur();}
  if(!tempo.length)tempo.push({s:0,us:Math.round(60000000/P.bpm.v),bpm:P.bpm.v});
  var bars=secs.length?secs.reduce(function(a,x){return a+x.bars;},0):Math.ceil(steps/16);
  return {ss:ss,steps:steps,secs:secs,key:key,mode:mode,tempo:tempo,bpm0:tempo[0].bpm,dur:dur,bars:bars};}
/* ---- MIDI (SMF type 1, 480 PPQ, one 16th step = 120 ticks) ---- */
/* names: UTF-8 (Ableton, Logic, Reaper, Bitwig read it) plus an ASCII-folded copy for older DAWs that show Latin-1 */
function dawFold(s){s=String(s||'');try{s=s.normalize('NFD');}catch(e){}return s.replace(/[\u0300-\u036f]/g,'').replace(/[ßẞ]/g,'ss').replace(/[^\x20-\x7e]/g,'').replace(/\s+/g,' ').trim();}
function dawNm(s){s=String(s||'');var f=dawFold(s);return f===s?s:s+(f?' ('+f+')':'');}
function dawUtf(s){return Array.prototype.slice.call(u8(String(s||'')));}
function dawMeta(t,type,bytes){return {t:t,o:0,b:[0xFF,type].concat(vlq(bytes.length),bytes)};}
function dawTrk(name,ev){var nb=dawUtf(dawNm(name)),out=[0,0xFF,0x03].concat(vlq(nb.length),nb),last=0;ev.sort(function(a,b){return a.t-b.t||a.o-b.o;});
  ev.forEach(function(e){out=out.concat(vlq(e.t-last),e.b);last=e.t;});out=out.concat([0,0xFF,0x2F,0]);var L=out.length;return [0x4D,0x54,0x72,0x6B,(L>>>24)&255,(L>>>16)&255,(L>>>8)&255,L&255].concat(out);}
function dawSmf(trks){var all=[0x4D,0x54,0x68,0x64,0,0,0,6,0,1,0,trks.length,1,0xE0];trks.forEach(function(t){all=all.concat(t);});return new Uint8Array(all);}
function dawMidi(F){var T=120,cond=[];
  F.tempo.forEach(function(x){cond.push({t:x.s*T,o:0,b:[0xFF,0x51,3,(x.us>>16)&255,(x.us>>8)&255,x.us&255]});});
  var ts=function(t,m){var p=String(m||'4/4').split('/'),nn=+p[0]||4,dd=Math.round(Math.log(+p[1]||4)/Math.LN2);cond.push({t:t,o:0,b:[0xFF,0x58,4,nn,dd,24,8]});},ks=function(t,pc,md){var k=dawKeySig(pc,md);cond.push({t:t,o:0,b:[0xFF,0x59,2,k.sf&255,k.mi]});};
  if(F.secs.length){var pm=null,pk=null;F.secs.forEach(function(x){var t=x.s*T;if(x.meter!==pm){ts(t,x.meter);pm=x.meter;}var kk=x.key+'|'+x.mode;if(kk!==pk){ks(t,x.key,x.mode);pk=kk;}cond.push(dawMeta(t,0x06,dawUtf(dawNm(x.name))));if(x.lyric)cond.push(dawMeta(t,0x05,dawUtf(x.lyric)));});}
  else{ts(0,'4/4');ks(0,F.key,F.mode);}
  var S=collectSong(),z=0,pc=daw.clips.filter(function(c){return c.type==='pat'&&!c.mute&&patterns[c.p]&&tracks[c.ti]&&tracks[c.ti].kind!=='audio';});
  if(F.ss==='arrange'&&pc.length)z=Math.floor(Math.min.apply(null,pc.map(function(c){return c.s;}))/16)*16;
  var parts=[],ch=0,counts={};
  KEYSI().forEach(function(ti){var ns=S.keys[ti];if(!ns||!ns.length)return;if(ch===9)ch++;var c=Math.min(ch++,15),ev=[{t:0,o:0,b:[0xC0|c,GMPROG[ti]||0]}];
    ns.forEach(function(n){var v=Math.max(1,Math.min(127,Math.round(n.v*127))),s=(n.s+z)*T;ev.push({t:s,o:2,b:[0x90|c,n.m&127,v]});ev.push({t:s+Math.max(1,n.l)*T-1,o:1,b:[0x80|c,n.m&127,0]});});
    counts[ti]=ns.length;parts.push({ti:ti,name:tracks[ti].name,ev:ev});});
  if(S.drums.length){var ev=[];S.drums.forEach(function(d){var nn=GMDRUM[d.pad]||36,s=(d.s+z)*T,vv=Math.max(1,Math.min(127,Math.round((d.v==null?0.8:d.v)*127)));ev.push({t:s,o:2,b:[0x99,nn,vv]});ev.push({t:s+T-1,o:1,b:[0x89,nn,0]});});counts[0]=S.drums.length;parts.unshift({ti:0,name:tracks[0].name,ev:ev,drum:1});}
  var title=project.name||'Ecou',condT=function(){return dawTrk(title,cond.map(function(e){return {t:e.t,o:e.o,b:e.b};}));};
  return {full:dawSmf([condT()].concat(parts.map(function(p){return dawTrk(p.name,p.ev.slice());}))),
    per:parts.map(function(p){return {name:'MIDI/'+String(p.ti+1).padStart(2,'0')+' '+dawFile(p.name)+'.mid',data:dawSmf([condT(),dawTrk(p.name,p.ev.slice())])};}),counts:counts};}
function dawFile(s){return String(s||'Track').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g,'-').replace(/\s+/g,' ').trim()||'Track';}
function dawTime(s){var m=Math.floor(s/60);return m+':'+dec(s-m*60,3).padStart(6,'0');}
function dawReadme(F,I){var bd=DAWX.bits===32?'32-bit float':'24-bit PCM',t0=dec(F.bpm0,2).replace(/\.?0+$/,''),chg=F.tempo.length>1,
  L=['Ecou – DAW package (Ableton Live, Logic, FL Studio, Reaper, Bitwig, Cubase…)','','Project:      '+(project.name||'Untitled'),
    'Tempo:        '+t0+' BPM'+(chg?' at bar 1 (the song changes tempo, see sections; the full tempo map is in Ecou.mid)':''),
    'Key:          '+dawKeyName(F.key,F.mode),'Time sig.:    '+(function(){var ms=[];F.secs.forEach(function(x){if(ms.indexOf(x.meter)<0)ms.push(x.meter);});return ms.length>1?'changes per section ('+ms.join(', ')+'), see Sections below; Ecou.mid carries every change':(ms[0]||'4/4');})(),
    'Sample rate:  '+I.sr+' Hz','Bit depth:    '+bd,'Level:        '+(I.gain<1?'all stems and the master are turned down by '+dec(-20*Math.log10(I.gain),1)+' dB (the same for every file) so nothing clips in 24-bit; raise the master in your DAW by that much to get the original level':'as in Ecou (no trim)'),
    'Song length:  '+dawTime(I.len/I.sr)+' ('+I.len+' samples, '+F.bars+' bars + tail). Every WAV has exactly this length and starts at bar 1.',''];
  if(F.secs.length){L.push('Sections:');F.secs.forEach(function(x){L.push('  Bar '+String(x.bar).padEnd(4)+' '+x.name+' – '+x.bars+' bar'+(x.bars>1?'s':'')+', '+dec(x.bpm,2).replace(/\.?0+$/,'')+' BPM, '+dawKeyName(x.key,x.mode)+', '+x.meter+(x.lyric?' – “'+x.lyric+'”':''));});L.push('');}
  L.push('How to import into Ableton Live:','  1. Set the project tempo to '+t0+' BPM.'+(chg?' (Optional, for the grid only: drag Ecou.mid into the Arrangement and let Live import its tempo and time signatures.)':''),
    '  2. Drag all files from the Stems folder into the Arrangement at bar 1 (1.1.1).','  3. Turn Warp off on the stems (select all audio clips › Clip view › Warp off), so Live plays them exactly as rendered.',
    '  4. Drag Ecou.mid (all parts) or the files in MIDI/ (one per track) onto MIDI tracks at bar 1. Drums are on channel 10 with General MIDI notes.',
    'Other DAWs: same idea – tempo '+t0+' BPM, every stem at bar 1, no time-stretching.','',
    'Files:','  Stems/NN <track>.wav   one stereo stem per track'+(DAWX.fx==='dry'?', dry (no reverb/delay sends)':', with its own reverb and delay printed in'),
    DAWX.fx==='dry'?'  Stems/'+I.retName+'   the shared reverb + delay returns of all tracks':null,
    '  '+I.masterName+'   '+(I.matched?'the master, matched to your loudness target (limited) – a reference, do not add it to the stems':'the mix before the master limiter = all stems summed – a reference, do not add it to the stems'),
    '  Ecou.mid               Type 1 MIDI: tempo map, time and key signatures, section markers, lyrics, one track per part, real step velocities',
    '                         Text is UTF-8; track and marker names also carry an ASCII copy in brackets (Strofă → Strofa) for DAWs that show Latin-1',
    '  MIDI/                  the same parts as separate .mid files','  ecou-project.json      the Ecou project (open this zip in Ecou › Restore from file to get it back)','  ecou-audio/            audio the project needs (recordings, imported clips)','',
    'Stems summed at unity gain rebuild the mix before the limiter'+(DAWX.bits===32?'. Float files cannot clip.':'. 24-bit files clip above 0 dBFS: if a peak below says 0.0, choose 32-bit float.'),'','Stem peaks:');
  I.peaks.forEach(function(p){L.push('  '+p);});if(I.skipped.length)L.push('','Skipped (silent): '+I.skipped.join(', '));
  L.push('','No Ableton Live Set (.als) is included: Live reads the stems and MIDI directly, and a hand-made .als can break between Live versions.');
  return L.filter(function(x){return x!=null;}).join('\r\n')+'\r\n';}
function dawBufBytes(){try{var s=serialize();return s.bufs.reduce(function(a,b){return a+b.chs.length*b.chs[0].length*4;},0);}catch(e){return 0;}}
function dawStat(t,f){var s=$('#dawStat');if(s)s.textContent=t;if(f!=null){$('#dawProg').hidden=false;$('#dawBar').style.width=Math.round(f*100)+'%';}}
function dawEstimate(){var F=dawFacts(),sr=ctx.sampleRate,bps=DAWX.bits===32?4:3,n=tracks.filter(function(t){return !t.mute;}).length+1+(DAWX.fx==='dry'?1:0);return {F:F,bytes:Math.round(n*(F.dur+1.5)*sr*2*bps+dawBufBytes())};}
function dawGo(){
  if(DAWX.busy)return;if(!ensureAudio())return;var ss=stemSrc();if(ss==='song'&&!song.length){toast('Add sections or patterns to the song first.');return;}
  if(seq.bounce||stemsRunning){toast('An export is already running.');return;}
  var E=dawEstimate(),mb=Math.round(E.bytes/1048576);
  if(E.bytes>500*1048576&&!(DAWX.arm>Date.now())){DAWX.arm=Date.now()+10000;dawStat('Large package: about '+mb+' MB. On a phone that can fill storage or memory. Tap again within 10 s to continue, or choose 24-bit / fewer tracks.');$('#dawGo').textContent='Continue (~'+mb+' MB)';return;}
  DAWX.arm=0;transportStop();DAWX.busy=true;DAWX.cancel=false;stemsRunning=true;$('#dawGo').hidden=true;$('#dawCancel').hidden=false;
  var F=E.F,sr=ctx.sampleRate,lat=Math.round(TRACKLAT*sr),dry=DAWX.fx==='dry',matched=!!MIX.match,Z=new DZip(),len=0,peaks=[],skipped=[],t0=performance.now(),retName='',masterName=matched?'Master (matched).wav':'Master (pre-limiter).wav';
  var idx=tracks.map(function(t,i){return i;}).filter(function(i){return !tracks[i].mute;}),total=idx.length+(dry?1:0)+2,stage=0;
  tracks.forEach(function(t){if(t.mute)skipped.push(t.name+' (muted)');});
  var chk=function(){if(DAWX.cancel)throw new Error('cancel');},prog=function(lbl){return function(f){dawStat(lbl+' '+Math.round(f*100)+'%',(stage+f*0.9)/total);};},clip=0,pk=function(n,p){var db=p>0?20*Math.log10(p):-200;if(DAWX.bits!==32&&p>=0.99999)clip++;peaks.push(n+': '+(db<-200?'silent':dec(db,1)+' dBFS'));return db;};
  dawStat(calPending()?'Measuring compressors…':'Rendering the mix…',0);
  waitCal().then(function(){chk();return dawBus({mode:'mix',src:ss,spatial:false,split:true,onProgress:prog('Mix')},{off:lat,hold:true,match:matched?{tgt:mxTgtVal(),ceil:Math.min(P.ceil?P.ceil.v:-1,-1)}:null});})
  .then(function(r){chk();len=r.len;var p0=r.peak;if(r.last){MIX.last=r.last;DAWX.match=r.last;try{mxLastTxt();}catch(e){}}
    /* 24-bit cannot go above 0 dBFS: one common trim for master and every stem (same dB), so nothing clips and the stems still sum to the master */
    DAWX.gain=1;if(DAWX.bits!==32&&p0>0.891){var db=Math.ceil((20*Math.log10(p0)+1)*10)/10;DAWX.gain=Math.pow(10,-db/20);}
    return dawCall({enc:true,gain:DAWX.gain,peak:p0});})
  .then(function(r){chk();pk(masterName,r.peak);Z.add(masterName,new Blob([r.wav]),r.crc);stage++;
    var chain=Promise.resolve();
    idx.forEach(function(i){chain=chain.then(function(){chk();var t=tracks[i],nm='Stem '+(stage)+'/'+(total-2)+' · '+t.name;dawStat(nm+'…',stage/total);
      return dawBus({mode:'mstem',track:i,src:ss,spatial:false,split:true,dry:dry,onProgress:prog(nm)},{len:len,off:lat}).then(function(x){chk();stage++;
        if(x.peak<3.2e-5){skipped.push(t.name);return;}var fn=String(i+1).padStart(2,'0')+' '+dawFile(t.name)+'.wav';pk(fn,x.peak);Z.add('Stems/'+fn,new Blob([x.wav]),x.crc);});});});
    if(dry)chain=chain.then(function(){chk();dawStat('FX returns…',stage/total);retName=String(tracks.length+1).padStart(2,'0')+' FX Returns.wav';
      return dawBus({mode:'mstem',ret:true,track:-1,src:ss,spatial:false,split:true,onProgress:prog('FX returns')},{len:len,off:lat}).then(function(x){stage++;pk(retName,x.peak);Z.add('Stems/'+retName,new Blob([x.wav]),x.crc);});});
    return chain;})
  .then(function(){chk();dawStat('MIDI, README and project…',stage/total);
    var M=dawMidi(F);Z.add('Ecou.mid',M.full);M.per.forEach(function(p){Z.add(p.name,p.data);});
    var s=serialize(),meta=s.bufs.map(function(b){return {id:b.id,sr:b.sr,nch:b.chs.length,len:b.chs[0].length};});s.data.bufs=meta;
    var pj=JSON.stringify(s.data);
    DAWX.info={sr:sr,len:len,bits:DAWX.bits,gain:DAWX.gain,fx:DAWX.fx,matched:matched,facts:F,counts:M.counts,masterName:masterName,retName:retName};
    var c2=Promise.resolve();s.bufs.forEach(function(b){c2=c2.then(function(){chk();var L=b.chs[0].length,all=new Float32Array(L*b.chs.length);b.chs.forEach(function(c,i){all.set(c,i*L);});
      return dawCrc(new Uint8Array(all.buffer)).then(function(r){Z.add('ecou-audio/b'+b.id+'.f32',new Blob([r.wav]),r.crc);});});});
    return c2.then(function(){Z.add('ecou-project.json',u8(pj));Z.add('README.txt',u8(dawReadme(F,{sr:sr,len:len,peaks:peaks,skipped:skipped,retName:retName,masterName:masterName,matched:matched,gain:DAWX.gain})));});})
  .then(function(){var blob=Z.blob();DAWX.last=blob;stage=total;dawStat('Done: '+Math.round(blob.size/1048576)+' MB in '+dec((performance.now()-t0)/1000,1)+' s.'+(clip?' '+clip+' file'+(clip>1?'s':'')+' went above 0 dBFS and clipped in 24-bit: choose 32-bit float for an exact pre-limiter master.':''),1);
    saveBlob(blob,safeName(project.name)+'-daw.zip','DAW package saved ('+Math.round(blob.size/1048576)+' MB).');})
  .catch(function(e){if(e&&e.message==='cancel'){dawStat('Cancelled. Nothing was saved.',0);toast('DAW export cancelled.');}else{console.error(e);errLog.push('daw: '+(e&&e.message));dawStat('Export failed: '+((e&&e.message)||'error').split('\n')[0]);toast('DAW export failed in this browser.');}})
  .then(function(){DAWX.busy=false;stemsRunning=false;$('#dawGo').hidden=false;$('#dawGo').textContent='Make DAW package';$('#dawCancel').hidden=true;});
}
function dawInit(){var sh=$('#shareSheet'),bits=$('#shBits');if(!sh||!bits)return;var after=bits.closest('.gx-sec'),d=document.createElement('div');d.className='gx-sec';d.id='dawSec';
  d.innerHTML='<div class="sh-t"><b>Send to Ableton / any DAW</b><small>One .zip: a stem per track from bar 1, MIDI with tempo map, markers and lyrics, README and the project</small></div>'+
    '<div class="seg" id="dawBits" role="group" aria-label="Stem bit depth"><button data-db="32" aria-pressed="true">32-bit float</button><button data-db="24" aria-pressed="false">24-bit</button></div>'+
    '<div class="seg" id="dawFx" role="group" aria-label="Effects on stems"><button data-dx="print" aria-pressed="true">Print FX on stems</button><button data-dx="dry" aria-pressed="false">Dry + FX returns</button></div>'+
    '<div class="sh-prog" id="dawProg" hidden><i id="dawBar"></i></div><p class="note" id="dawStat" aria-live="polite"></p>'+
    '<div class="btns"><button class="gx-btn sh-pri" id="dawGo">Make DAW package</button><button class="gx-btn" id="dawCancel" hidden>Cancel</button></div>';
  after.parentNode.insertBefore(d,after.nextSibling);
  $$('#dawBits button').forEach(function(b){b.addEventListener('click',function(){if(DAWX.busy)return;DAWX.bits=+b.getAttribute('data-db');$$('#dawBits button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});});});
  $$('#dawFx button').forEach(function(b){b.addEventListener('click',function(){if(DAWX.busy)return;DAWX.fx=b.getAttribute('data-dx');$$('#dawFx button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});});});
  $('#dawGo').addEventListener('click',dawGo);$('#dawCancel').addEventListener('click',function(){DAWX.cancel=true;dawStat('Cancelling after this step…');});}
try{dawInit();}catch(e){errLog.push('daw: '+e.message);}
