var SEC={list:[],nid:0,built:false,own:{},reg:[],warn:'',ui:{open:{},sel:null,tx:null,more:{},del:null,add:false,lp:null}},SECZ=null;
var SECTYPES=['Intro','Verse','Pre-chorus','Chorus','Bridge','Outro'];
var SECCOL={Intro:'#A3A3FF',Verse:'#8FB8FF','Pre-chorus':'#B69CFF',Chorus:'#FFB15C',Bridge:'#5CE1C6',Outro:'#FF8FB5'};
var SECFN={T:'#8FB8FF',S:'#B69CFF',D:'#FFB15C',B:'#5CE1C6'},SECFNN={T:'Tonic',S:'Subdominant',D:'Dominant',B:'Borrowed'};
var SECDEF={Intro:{c:[[0,'maj'],[5,'maj']],m:[[0,'min'],[8,'maj']],b:4,cx:0.3,ld:0.4,p:'A'},
  Verse:{c:[[0,'maj'],[9,'min'],[5,'maj'],[7,'maj']],m:[[0,'min'],[8,'maj'],[3,'maj'],[10,'maj']],b:8,cx:0.45,ld:0.55,p:'A'},
  'Pre-chorus':{c:[[2,'min'],[5,'maj'],[7,'maj'],[7,'maj']],m:[[5,'min'],[8,'maj'],[10,'maj'],[10,'maj']],b:4,cx:0.55,ld:0.65,p:'B'},
  Chorus:{c:[[5,'maj'],[7,'maj'],[9,'min'],[0,'maj']],m:[[8,'maj'],[10,'maj'],[0,'min'],[0,'min']],b:8,cx:0.7,ld:0.85,p:'B'},
  Bridge:{c:[[9,'min'],[5,'maj'],[0,'maj'],[7,'maj']],m:[[5,'min'],[3,'maj'],[8,'maj'],[10,'maj']],b:4,cx:0.5,ld:0.6,p:'C'},
  Outro:{c:[[0,'maj'],[5,'maj'],[0,'maj'],[0,'maj']],m:[[0,'min'],[8,'maj'],[0,'min'],[0,'min']],b:4,cx:0.3,ld:0.4,p:'A'}};
var SECTXM=[['auto','Auto'],['normal','Normal'],['dramatic','Dramatic'],['cut','Hard cut'],['off','Off']];
var SECRN=['I','♭II','II','♭III','III','IV','♯IV','V','♭VI','VI','♭VII','VII'];
function secBase(n){var m=String(n||'').match(/^(intro|verse|pre-chorus|chorus|bridge|outro)/i);if(!m)return null;for(var i=0;i<SECTYPES.length;i++)if(SECTYPES[i].toLowerCase()===m[1].toLowerCase())return SECTYPES[i];return null;}
function secCol(s){return SECCOL[secBase(s.name)]||'#D4FF3A';}
function secById(id){for(var i=0;i<SEC.list.length;i++)if(SEC.list[i].id===id)return SEC.list[i];return null;}
function secNew(name){var same=SEC.list.filter(function(x){return x.name===name;})[0];
  if(same){var c=JSON.parse(JSON.stringify(same));c.id=++SEC.nid;c.lyric='';return c;}
  var D=SECDEF[secBase(name)]||SECDEF.Verse,k=GAR.key||0,mi=!!(BMODE[GAR.band.mode]||{}).mi;
  return {id:++SEC.nid,name:name,bars:D.b,chords:(mi?D.m:D.c).map(function(c){return [(k+c[0])%12,c[1]];}),lyric:'',key:null,mode:null,meter:null,bpm:null,cx:D.cx,ld:D.ld,band:D.p,genre:null,pads:[],tr:{m:'auto',len:1,d:true,b:true,k:true}};}
function secKey(s){return s.key==null?(GAR.key||0):s.key;}
function secMode(s){return s.mode||GAR.band.mode;}
function secMeter(s){return s.meter||(s.genre&&BGEN[s.genre]?BGEN[s.genre].m:GAR.band.meter);}
function secBpm(s){return s.bpm||P.bpm.v;}
function secN(s){return bandN(secMeter(s));}
/* run fn with the Backing Band set to a section's key, mode, meter, genre and loudness; always restored */
function secCtx(s,fn){var B=GAR.band,sv={k:GAR.key,mo:B.mode,me:B.meter,dS:B.dS,bS:B.bS,kS:B.kS,f:B.feel,sw:B.swing,dy:B.dyn,g:B.genre};
  try{GAR.key=secKey(s);B.mode=secMode(s);B.meter=secMeter(s);if(s.genre&&BGEN[s.genre]){var G=BGEN[s.genre];B.genre=s.genre;B.dS=G.d;B.bS=G.b;B.kS=G.k;B.feel=G.f;B.swing=G.sw;}B.dyn=s.ld;bandFix();return fn();}
  finally{GAR.key=sv.k;B.mode=sv.mo;B.meter=sv.me;B.dS=sv.dS;B.bS=sv.bS;B.kS=sv.kS;B.feel=sv.f;B.swing=sv.sw;B.dyn=sv.dy;B.genre=sv.g;}}
function secScale(k,mode){var M=BMODE[mode]||BMODE.ionian,s=M.pent?(M.mi?BMODE.aeolian.s:BMODE.ionian.s):M.s;return s.map(function(x){return (k+x)%12;});}
function secFn(c,k,mode){var sc=secScale(k,mode),d=sc.indexOf(c[0]),dia=bandTonesOf(c).every(function(x){return sc.indexOf((c[0]+x)%12)>=0;});
  if(!dia||d<0)return 'B';return [0,2,5].indexOf(d)>=0?'T':[1,3].indexOf(d)>=0?'S':'D';}
function secRoman(c,k){var r=SECRN[(c[0]-k+120)%12],q=c[1],lo=/^(min|m7|m6|m9|mmaj7|dim|dim7|m7b5)$/.test(q);return (lo?r.toLowerCase():r)+(/dim|m7b5/.test(q)?'°':/aug/.test(q)?'+':q==='7'?'7':'');}
function secPalette(s){var k=secKey(s),out=secCtx(s,function(){return bandPalette();}),mi=!!(BMODE[secMode(s)]||{}).mi,bor=mi?[[5,'maj'],[7,'7'],[2,'min']]:[[10,'maj'],[8,'maj'],[5,'min'],[3,'maj']];
  bor.forEach(function(c){out.push([(k+c[0])%12,c[1]]);});out.push([(k+2)%12,'7']);out.push([(k+7)%12,'7']);
  var seen={};return out.filter(function(c){var x=c[0]+c[1];if(seen[x])return false;seen[x]=1;return true;});}
function secSyl(t){var w=String(t||'').toLowerCase().match(/[a-zà-ÿăâîșțş']+/g)||[],n=0;
  w.forEach(function(x){var y=x.replace(/'/g,'');if(y.length>2&&/e$/.test(y)&&!/[^aeiouy]le$/.test(y)&&!/[aeiouy]e$/.test(y))y=y.slice(0,-1);var g=y.match(/[aeiouyăâîàáèéìíòóùú]+/g);n+=Math.max(1,g?g.length:0);});return n;}
function secLayout(){var s=0;return SEC.list.map(function(x){var N=secN(x),L=x.bars*N,o={sec:x,s:s,l:L,N:N};s+=L;return o;});}
function secHash(pt){var j=JSON.stringify([pt.len,pt.drums.map(function(a){return a.slice(0,pt.len);}),pt.notes,pt.locks||{}]),h=0;for(var i=0;i<j.length;i++)h=(h*31+j.charCodeAt(i))|0;return h;}
function secSig(c){return [c.ti,c.s,c.l,c.p,c.o||0,!!c.mute].join(',');}
function secClear(pt){pt.len=16;pt.locks={};pt.drums.forEach(function(a){for(var i=0;i<a.length;i++)a[i]=false;});pt.notes=pt.notes.map(function(){return [];});}
function secTmpPat(len){var p=newPattern(0,len);p.notes=tracks.map(function(){return [];});p.locks={};return p;}
function secTr(s){var t=s.tr||(s.tr={});if(!t.m)t.m='auto';if(!t.len)t.len=1;['d','b','k'].forEach(function(k){if(t[k]==null)t[k]=true;});return t;}
/* effective transition mode at the boundary A→B: Auto = subtle, Normal when the key or tempo changes */
function secTxMode(A,B){var m=secTr(B).m;if(m==='auto')return (secKey(A)!==secKey(B)||secMode(A)!==secMode(B)||secBpm(A)!==secBpm(B))?'normal':'subtle';return m;}
function secTxSpan(A,B){var m=secTxMode(A,B),N=secN(A),L=A.bars*N;if(m==='off')return 0;if(m==='cut'){var G=bandGroups(secMeter(A));return Math.min(L,G[G.length-1].l);}return clamp(Math.round(secTr(B).len*N),2,L);}
function secPivot(A,B){var ka=secKey(A),old=secScale(ka,secMode(A)),r=null;secCtx(B,function(){[1,3,5,2].forEach(function(d){if(r)return;var c=bandDegChord(d,false);if(bandTonesOf(c).every(function(x){return old.indexOf((c[0]+x)%12)>=0;}))r=c;});if(!r)r=bandDegChord(3,false);});return r;}
/* band material for one section into pattern pt (bars × N steps); returns which tracks got notes */
function secBandMat(s,pt,bars,bar0,noDrums){var B=GAR.band,prog=s.chords.length?s.chords:[[secKey(s),'maj']],L=prog.length,bassT=bandTrack('bass'),keysT=bandTrack('keys'),N=secN(s);
  secCtx(s,function(){var prev=null,pushed=false,dy=0.35+0.65*B.dyn;pt.len=bars*N;
    for(var bb=0;bb<bars;bb++){var gb=bar0+bb,pb=gb%L,c=prog[pb],n=prog[(pb+1)%L],fe=B.fillEvery,fill=fe>0&&B.fills>0.05&&(L>=fe?(pb+1)%fe===0:pb===L-1);
      var pl=bandPlan({c:c,n:n,fill:fill,first:pb===0,bar:gb,E:s.cx,prev:prev,pushedIn:pushed});prev=pl.vLast||pl.vo;pushed=!!pl.pushed;var off=bb*N;
      var sh=function(x){return off+x+bandSwingOff(x,1);};
      if(!B.mD&&!noDrums)Object.keys(pl.d).forEach(function(p){Object.keys(pl.d[p]).forEach(function(x){var e=pl.d[p][x],k=off+(+x);if(k<64){pt.drums[+p][k]=Math.round(clamp(e.v*dy*B.lvD,0.05,1)*100)/100;if(e.r>1)pt.locks[p+':'+k]={p:0,l:1,r:e.r};}});});
      if(!B.mB)pl.b.forEach(function(e){pt.notes[bassT].push({s:Math.round(sh(e[0])*100)/100,l:e[1],m:e[2],v:Math.round(e[3]*dy*B.lvB*100)/100});});
      if(!B.mK)pl.k.forEach(function(e){e[2].forEach(function(m){pt.notes[keysT].push({s:Math.round(sh(e[0])*100)/100,l:e[1],m:m,v:Math.round(e[3]*dy*B.lvK*100)/100});});});}});
  return {d:!noDrums&&!B.mD,b:bassT,k:keysT};}
/* transition material A→B written into pt at offset o, span steps; returns {d,b,k} flags for what was written */
function secTxMat(A,B,pt,o,span,m,who,bar){var Bd=GAR.band,lastA=A.chords.length?A.chords[(A.bars-1)%A.chords.length]:[secKey(A),'maj'],land=B.chords.length?B.chords[0]:[secKey(B),'maj'],bassT=bandTrack('bass'),keysT=bandTrack('keys'),N=secN(A),got={d:false,b:false,k:false};
  var kc=secKey(A)!==secKey(B)||secMode(A)!==secMode(B),scB=secScale(secKey(B),secMode(B));
  function dr(p,x,v,r){if(p<0||x<0||x>=span)return;pt.drums[p][o+x]=Math.round(clamp(v,0.05,1)*100)/100;if(r>1)pt.locks[p+':'+(o+x)]={p:0,l:1,r:r};got.d=true;}
  secCtx(A,function(){var dy=0.35+0.65*Bd.dyn;
    if(m==='cut'){if(who.d){dr(garPad('kick'),0,0.9*dy);dr(garPad('snare'),0,0.9*dy);dr(garPad('crash'),0,0.7*dy);}return;}
    if(who.d){if(m==='dramatic'){var K=garPad('kick'),S=garPad('snare'),H=garPad('ohat');for(var x=0;x<span;x++){var f=x/Math.max(1,span-1);if(x%4===0)dr(K,x,0.85*dy);if(x<span/2?x%2===0:true)dr(S,x,(0.3+0.7*f)*dy,x>=span-4?2:1);}if(H>=0)dr(H,span-1,0.8*dy);
        /* riser: an existing reverse/riser/sweep pad, timed so its tail lands on the downbeat */
        for(var pi=0;pi<pads.length;pi++){var pd=pads[pi];if(pd&&pd.buf&&/rev|riser|sweep|swell|uplift/i.test(pd.name||'')){var st=Math.max(0,span-Math.round(pd.buf.duration/stepDur()));dr(pi,st,0.8);break;}}}
      else{var nb=Math.ceil(span/N);for(var b=0;b<nb;b++){var pl=bandPlan({c:lastA,n:land,fill:b===nb-1,first:false,bar:bar+b,E:clamp(A.cx+(m==='normal'?0.25:0),0,1),prev:null});var base=span-(nb-b)*N;
          Object.keys(pl.d).forEach(function(p){Object.keys(pl.d[p]).forEach(function(x){var e=pl.d[p][x];dr(+p,base+(+x),e.v*dy*Bd.lvD,e.r);});});}}}
    if(who.b&&!Bd.mB){var r0=garBassRoot(lastA,28+Bd.bReg*12),t=garBassRoot(land,28+Bd.bReg*12);if(t-r0>6)t-=12;else if(r0-t>6)t+=12;
      var beats=Math.max(1,Math.floor(span/4)),W=m==='subtle'?Math.min(2,beats):Math.min(8,beats),ws=span-W*4,up=t>=r0,seq0=[],prev=r0;
      if(ws>0){pt.notes[bassT].push({s:o,l:ws,m:r0,v:Math.round(0.8*dy*Bd.lvB*100)/100});}
      for(var k=0;k<W;k++){var tgt=k===W-1?null:r0+(t-r0)*(k+1)/W,mm;
        if(k===W-1){mm=t+(up?-1:1);while(scB.indexOf(((mm%12)+12)%12)<0)mm+=up?-1:1;}
        else{mm=Math.round(tgt);var d0=0;while(scB.indexOf(((mm%12)+12)%12)<0){d0++;mm=Math.round(tgt)+(d0%2?d0:-d0)/1;mm=Math.round(tgt)+((d0%2)?Math.ceil(d0/2):-Math.ceil(d0/2));}}
        if(k>0&&k<W-1&&mm===prev)mm+=up?1:-1;while(scB.indexOf(((mm%12)+12)%12)<0)mm+=up?1:-1;
        prev=mm;seq0.push(mm);pt.notes[bassT].push({s:o+Math.max(0,ws)+k*4,l:3.5,m:mm,v:Math.round((0.7+0.25*k/W)*dy*Bd.lvB*100)/100});}
      got.b=true;}
    if(who.k&&!Bd.mK){var dom=[(land[0]+7)%12,'7'],segs;
      if(kc)segs=span>=N?[[0,span/2,secPivot(A,B)],[span/2,span/2,dom]]:[[0,span,dom]];
      else if(m==='subtle')segs=[[0,span,lastA]];
      else segs=span>=N?[[0,span/2,lastA],[span/2,span/2,dom]]:[[0,span,dom]];
      var prevV=null;secCtx(kc?B:A,function(){segs.forEach(function(g){var v=bandVoice(g[2],prevV);prevV=v;var hits=m==='dramatic'?Math.max(1,Math.floor(g[1]/4)):1;
        for(var h=0;h<hits;h++){var st=g[0]+h*(g[1]/hits);v.forEach(function(mn){pt.notes[keysT].push({s:Math.round((o+st)*100)/100,l:Math.max(1,g[1]/hits-0.5),m:mn,v:Math.round((m==='dramatic'?0.45+0.5*(st/span):0.62)*dy*Bd.lvK*100)/100});});}});});
      got.k=true;}});
  return got;}
/* Build song: sections → timeline. quiet = rebuild after an edit */
function secBuild(quiet){if(!ensureAudio())return false;if(!SEC.list.length&&!SEC.built){toast('Add a section first.');return false;}bandFix();
  var keep=[],drop=[];
  daw.clips.forEach(function(c){if(!c.gen||c.user)return;var own=SEC.own[c.p]!=null;var touched=c.frz||c.sig!==secSig(c)||(own&&patterns[c.p]&&SEC.own[c.p]!==secHash(patterns[c.p]))||(!own&&c.own);
    if(touched)keep.push(c);else drop.push(c);});
  var kept=daw.clips.filter(function(c){return c.gen&&(c.user||keep.indexOf(c)>=0);});
  function blocked(ti,s,l,gk){return kept.some(function(c){return c.ti===ti&&((gk&&gk.charAt(0)==='t'&&c.gen===gk)||(c.s<s+l&&clipEnd(c)>s));});}
  var Lay=secLayout(),mats=[],clips=[],sig={},tcur=null,bassT=bandTrack('bass'),keysT=bandTrack('keys'),tm=[],anyT=false,warn=[];
  function mat(len){var m={pt:secTmpPat(len)};mats.push(m);return m;}
  function add(o){if(o.l<=0||blocked(o.ti,o.s,o.l,o.tx?o.gen:null))return;clips.push(o);}
  Lay.forEach(function(Ly,i){var s=Ly.sec,nx=Lay[i+1],span=nx?secTxSpan(s,nx.sec):0,tx=nx?secTr(nx.sec):null,mode=nx?secTxMode(s,nx.sec):'off',gk='s'+s.id;
    function cut(ti){if(!nx||mode==='off')return 0;if(mode==='cut')return span;var w=ti===0?tx.d:ti===bassT?tx.b:tx.k;return w?span:0;}
    var per=Math.max(1,Math.floor(64/Ly.N)),L=Math.max(1,s.chords.length);
    if(s.band!=='off'){var key=JSON.stringify([s.chords,secKey(s),secMode(s),secMeter(s),s.genre,s.cx,s.ld,s.band,!!s.pads.length,L<=per?0:s.bars]),M=sig[key];
      if(!M){var chunks=L<=per?1:Math.ceil(s.bars/per);M=[];for(var ck=0;ck<chunks;ck++){var nb=L<=per?L:Math.min(per,s.bars-ck*per),mm=mat(nb*Ly.N);mm.got=secBandMat(s,mm.pt,nb,ck*per,!!s.pads.length);M.push(mm);}sig[key]=M;}
      M.forEach(function(mm,ck){var cs=Ly.s+(M.length>1?ck*per*Ly.N:0),cl=M.length>1?Math.min(per*Ly.N,Ly.l-ck*per*Ly.N):Ly.l;
        [mm.got.d?0:-1,mm.got.b,mm.got.k].forEach(function(ti){if(ti<0||(ti>0&&!(mm.pt.notes[ti]||[]).length))return;var e=Math.min(cs+cl,Ly.s+Ly.l-cut(ti));add({mat:mm,ti:ti,s:cs,l:e-cs,o:0,gen:gk});});});}
    s.pads.forEach(function(pi){var pt=patterns[pi];if(!pt||!patHas(pt))return;[0].concat(KEYSI()).forEach(function(ti){if(ti===0?!pt.drums.some(function(a){return a.some(Boolean);}):!(pt.notes[ti]||[]).length)return;add({p:pi,ti:ti,s:Ly.s,l:Ly.l-cut(ti),o:0,gen:gk,user0:1});});});
    if(nx&&mode!=='off'&&(s.band!=='off'||s.pads.length)){var who=mode==='cut'?{d:true}:{d:tx.d,b:tx.b&&s.band!=='off',k:tx.k&&s.band!=='off'};
      if(!tcur||tcur.off+span>64){tcur=mat(64);tcur.off=0;}
      var bs=Ly.s+Ly.l-span,g=secTxMat(s,nx.sec,tcur.pt,tcur.off,span,mode,who,i*31+7);
      [g.d?0:-1,g.b?bassT:-1,g.k?keysT:-1].forEach(function(ti){if(ti>=0)add({mat:tcur,ti:ti,s:bs,l:span,o:tcur.off,gen:'t'+nx.sec.id,tx:'auto',txm:mode});});tcur.off+=span;}
    /* tempo map: section tempo, ramp over the transition span so the new tempo lands exactly on the downbeat */
    if(s.bpm)anyT=true;
    if(!tm.length||tm[tm.length-1].s<Ly.s)tm.push({s:Ly.s,b:s.bpm||null,gen:gk});
    if(nx&&secBpm(s)!==secBpm(nx.sec)){var bnd=Ly.s+Ly.l,rs=mode==='off'||mode==='cut'?bnd:Math.max(Ly.s,bnd-Math.max(span,Ly.N));tm.push({s:rs,b:s.bpm||null,gen:'t'+nx.sec.id});tm.push({s:bnd,b:nx.sec.bpm||null,ramp:rs<bnd?1:0,gen:'t'+nx.sec.id});}
    if(nx&&(secKey(s)!==secKey(nx.sec)||secBpm(s)!==secBpm(nx.sec))){var bnd2=Ly.s+Ly.l;daw.clips.forEach(function(c){if(c.type==='aud'&&!c.gen&&c.s<bnd2&&clipEnd(c)>bnd2)warn.push((tracks[c.ti]?tracks[c.ti].name:'Audio')+' at bar '+(Math.floor(bnd2/16)+1));});}});
  /* patterns: reuse the ones this feature owns, then empty ones (from H down), never one a remaining clip uses */
  var lock={};daw.clips.forEach(function(c){if(c.type==='pat'&&drop.indexOf(c)<0)lock[c.p]=1;});
  var avail=[];for(var pi=patterns.length-1;pi>=0;pi--){var own=SEC.own[pi]!=null&&!lock[pi]&&SEC.own[pi]===secHash(patterns[pi]);if(own||(!lock[pi]&&!patHas(patterns[pi])&&SEC.own[pi]==null))avail.push(pi);}
  var used=mats.filter(function(m){return clips.some(function(c){return c.mat===m;});});
  if(used.length>avail.length){toast('Building needs '+used.length+' free patterns but only '+avail.length+' are free. Clear some patterns (Play › Pads, patterns A–H, or the Patterns card under Song › Sections › Pattern editor & tools) or use fewer different sections.',4200);return false;}
  /* commit */
  keep.forEach(function(c){c.user=1;if(c.tx){delete c.tx;c.frz=1;}});
  daw.clips=daw.clips.filter(function(c){return drop.indexOf(c)<0;});if(daw.sel&&!clipById(daw.sel))daw.sel=null;
  Object.keys(SEC.own).forEach(function(k){if(lock[+k]){delete SEC.own[k];return;}if(patterns[+k]&&SEC.own[k]===secHash(patterns[+k]))secClear(patterns[+k]);delete SEC.own[k];});
  used.forEach(function(m,j){var pi=avail[j],pt=patterns[pi];pt.len=m.pt.len;pt.drums=m.pt.drums;pt.notes=m.pt.notes;pt.locks=m.pt.locks;m.p=pi;});
  clips.forEach(function(o){var c={type:'pat',ti:o.ti,s:o.s,l:o.l,p:o.mat?o.mat.p:o.p,o:o.o,gen:o.gen,own:o.mat?1:0};if(o.tx){c.tx=o.tx;c.txm=o.txm;}newClip(c);c.sig=secSig(c);});
  used.forEach(function(m){SEC.own[m.p]=secHash(patterns[m.p]);});
  daw.tmap=anyT?tm:null;
  SEC.reg=Lay.map(function(Ly,i){var nx=Lay[i+1];return {id:Ly.sec.id,s:Ly.s,l:Ly.l,name:Ly.sec.name,col:secCol(Ly.sec),tx:nx?secTxSpan(Ly.sec,nx.sec):0,txm:nx?secTxMode(Ly.sec,nx.sec):'off',key:secKey(Ly.sec),bpm:secBpm(Ly.sec),lyric:Ly.sec.lyric||''};});
  SEC.warn=warn.length?'Audio spans a key/tempo change ('+warn.join(', ')+'). It will play unchanged: no time-stretch or transposition in this version.':'';
  SEC.built=SEC.list.length>0;dawNeed=true;if(typeof renderPatSegs==='function')renderPatSegs();markDirty();
  if(!quiet)toast('Song built: '+SEC.list.length+' sections, '+clips.filter(function(c){return c.tx;}).length+' transition clips on the timeline.'+(warn.length?' Check the audio warning.':''),3200);
  if(warn.length&&quiet)toast(SEC.warn,3600);
  return true;}
function secFreeze(c){if(!c||!c.tx)return;delete c.tx;c.frz=1;c.user=1;dawNeed=true;markDirty();}
function secFreezeTx(bid){var n=0;daw.clips.forEach(function(c){if(c.tx&&c.gen==='t'+bid){secFreeze(c);n++;}});return n;}
function secClipMark(g,c,x0,y,w,h){g.save();if(c.tx){g.setLineDash([4,3]);g.strokeStyle='rgba(255,209,102,.95)';}else g.strokeStyle=c.frz?'rgba(255,209,102,.6)':'rgba(255,255,255,.22)';g.lineWidth=1.5;g.strokeRect(x0+1,y-1,Math.max(2,w-2),h);
  if(w>34){g.setLineDash([]);g.font='700 9px Inter, system-ui, sans-serif';g.fillStyle=c.tx?'#FFD166':'rgba(255,255,255,.55)';g.fillText(c.tx?'auto':c.frz?'frozen':'',x0+4,y+h-3);}g.restore();}
function secRuler(g,sx2,W){if(!SEC.reg||!SEC.reg.length)return;g.save();g.font='700 9px Inter, system-ui, sans-serif';
  SEC.reg.forEach(function(r){var x0=sx2(r.s),x1=sx2(r.s+r.l);if(x1<0||x0>W)return;g.fillStyle=hexA(r.col,0.55);g.fillRect(x0,0,Math.max(1,x1-x0-1),11);
    if(r.tx){var t0=sx2(r.s+r.l-r.tx);g.fillStyle='rgba(255,209,102,.9)';for(var x=t0;x<x1-1;x+=4)g.fillRect(x,7,2,4);}
    if(x1-x0>14){g.save();g.beginPath();g.rect(x0,0,x1-x0-2,11);g.clip();g.fillStyle='#0B0B10';g.fillText(r.name,Math.max(x0,0)+3,8.5);g.restore();}});g.restore();}
function secAbcMark(b){if(!SEC.built||SECZ==null||!SEC.reg)return '';var o='';SEC.reg.forEach(function(r){if(r.s>=SECZ&&Math.floor((r.s-SECZ)/16)===b){o+='"^'+String(r.name).replace(/"/g,"'")+'" ';if(r.lyric)o+='"_'+String(r.lyric).replace(/"/g,"'").slice(0,60)+'" ';}});return o;}
/* infer sections from an older project's timeline (or its pattern arrangement) */
function secClipNotes(c,g0,g1,out){var pt=patterns[c.p];if(!pt||c.ti===0||c.type!=='pat')return;var Lp=pt.len,o=c.o||0;for(var r=-o;c.s+r<c.s+c.l;r+=Lp){(pt.notes[c.ti]||[]).forEach(function(n){var g=c.s+r+n.s;if(n.s<Lp&&g>=c.s&&g<c.s+c.l&&g>=g0&&g<g1)out.push({s:g-g0,l:n.l,m:n.m});});}}
function secGuess(notes,bars){var out=[];for(var b=0;b<bars;b++){var w=new Array(12).fill(0),lo=1e9,lop=0;notes.forEach(function(n){if(n.s>=b*16&&n.s<b*16+16){w[n.m%12]+=n.l||1;if(n.m<lo){lo=n.m;lop=n.m%12;}}});
    if(!w.some(Boolean)){if(out.length)out.push(out[out.length-1]);continue;}var best=null,bs=-1e9;for(var r=0;r<12;r++)['maj','min'].forEach(function(q){var iv=GCHQ[q].iv,sc=0;for(var p=0;p<12;p++){var inn=iv.indexOf((p-r+12)%12)>=0;sc+=inn?w[p]:-0.6*w[p];}if(r===lop)sc+=0.5;if(sc>bs){bs=sc;best=[r,q];}});out.push(best);}
  while(out.length>1&&JSON.stringify(out.slice(0,out.length/2))===JSON.stringify(out.slice(out.length/2))&&out.length%2===0)out=out.slice(0,out.length/2);return out;}
function secInfer(){var pc=daw.clips.filter(function(c){return c.type==='pat'&&patterns[c.p];}),out=[],names={},order=['Verse','Chorus','Bridge'];
  function nm(sg,i,len,n){if(names[sg])return names[sg];var k=Object.keys(names).length,v=(i===0&&len<=2&&n>2)?'Intro':(order[k]||('Part '+(k+1)));names[sg]=v;return v;}
  if(daw.clips.length){var end=Math.max(1,Math.ceil(arrEnd()/16)),sigs=[],runs=[];for(var b=0;b<end;b++){var g=b*16;sigs.push(daw.clips.filter(function(c){return c.s<=g&&clipEnd(c)>g;}).map(function(c){return c.ti+':'+(c.type==='pat'?c.p:'a');}).sort().join('|'));}
    if(daw.markers.length){var bs=[0];daw.markers.forEach(function(m){var x=Math.round(m.s/16);if(x>0&&x<end&&bs.indexOf(x)<0)bs.push(x);});bs.sort(function(a,b){return a-b;});bs.forEach(function(x,i){var mk=daw.markers.filter(function(m){return Math.round(m.s/16)===x;})[0];runs.push({a:x,b:bs[i+1]||end,sg:sigs[x],nm:mk?mk.name:null});});}
    else{var a=0;for(var b2=1;b2<=end;b2++)if(b2===end||sigs[b2]!==sigs[a]){if(runs.length&&(b2-a<2||runs[runs.length-1].b-runs[runs.length-1].a<2))runs[runs.length-1].b=b2;else runs.push({a:a,b:b2,sg:sigs[a]});a=b2;}}
    runs.forEach(function(r,i){var s=secNew(r.nm||nm(r.sg,i,r.b-r.a,runs.length));s.bars=clamp(r.b-r.a,1,32);s.band='off';s.inf=1;s.tr.m='off';s.lyric='';var ns=[];pc.forEach(function(c){secClipNotes(c,r.a*16,Math.min(r.b,r.a+8)*16,ns);});var ch=secGuess(ns,Math.min(4,r.b-r.a));if(ch.length)s.chords=ch;out.push(s);});}
  else song.forEach(function(pi,i){var pt=patterns[pi];if(!pt||!patHas(pt))return;var s=secNew(nm('p'+pi,i,pt.len/16,song.length));s.bars=clamp(Math.round(pt.len/16),1,32);s.band='off';s.pads=[pi];s.lyric='';var ns=[];KEYSI().forEach(function(ti){(pt.notes[ti]||[]).forEach(function(n){if(n.s<pt.len)ns.push({s:n.s,l:n.l,m:n.m});});});var ch=secGuess(ns,s.bars);if(ch.length)s.chords=ch;out.push(s);});
  if(!out.length){toast('Nothing on the timeline or in the pattern arrangement to make sections from yet.');return;}
  SEC.list=out;SEC.built=false;SEC.reg=secLayout().map(function(Ly){return {id:Ly.sec.id,s:Ly.s,l:Ly.l,name:Ly.sec.name,col:secCol(Ly.sec),tx:0,key:secKey(Ly.sec),bpm:secBpm(Ly.sec),lyric:''};});
  if(out.some(function(s){return s.inf;})){SEC.built=true;}dawNeed=true;markDirty();secRender();
  toast(out.length+' sections from your song. Your clips stay as they are; the sections label them and can add band parts and transitions.',3600);}
function secSave(){return {list:JSON.parse(JSON.stringify(SEC.list)),nid:SEC.nid,built:SEC.built,own:JSON.parse(JSON.stringify(SEC.own)),reg:JSON.parse(JSON.stringify(SEC.reg||[]))};}
function secLoad(d){SEC.list=d&&Array.isArray(d.list)?d.list:[];SEC.nid=d&&d.nid||0;SEC.built=!!(d&&d.built);SEC.own=d&&d.own||{};SEC.reg=d&&d.reg||[];SEC.warn='';SEC.list.forEach(function(s){if(s.id>SEC.nid)SEC.nid=s.id;secTr(s);if(!s.pads)s.pads=[];});
  if(showTab.cur==='t-song')setTimeout(secRender,0);}
function secChanged(rebuild){if(SEC.built&&rebuild!==false)secBuild(true);markDirty();secRender();}
function secPlayFrom(s){if(!ensureAudio())return;if(!SEC.built&&!secBuild(true))return;if(seq.on)transportStop();daw.play=s||0;seq.src='arrange';transportToggle('arrange');}
/* ---- UI ---- */
function secChordBtn(s,c,i,sel){var k=secKey(s),f=secFn(c,k,secMode(s));return '<button class="sc-ch'+(sel?' sel':'')+'" data-sec="ch" data-id="'+s.id+'" data-i="'+i+'" style="--f:'+SECFN[f]+'" aria-label="'+bandChName(c)+', '+secRoman(c,k)+', '+SECFNN[f]+'"><small>'+secRoman(c,k)+'</small><b>'+bandChName(c).replace('#','♯')+'</b></button>';}
function secRender(){var el=$('#secView');if(!el)return;var U=SEC.ui,Lay=secLayout(),h='';
  h+='<div class="sc-top"><div style="min-width:0"><div class="kicker">Song · Sections</div><div class="sc-title">'+xesc(project.name||'Untitled')+'</div></div><div class="seg sc-vw" role="group" aria-label="Song view"><button aria-pressed="true">Cards</button><button aria-pressed="false" data-sec="time">Time</button></div></div>';
  if(SEC.list.length)h+='<div class="sc-strip" aria-hidden="true">'+SEC.list.map(function(s){return '<i style="flex:'+s.bars+';background:'+secCol(s)+'"></i>';}).join('')+'</div><div style="margin:8px 0"><button class="btn" data-stage="song" style="min-height:44px;width:100%">Stage mode: play it live</button></div>';
  else h+='<div class="card sc-empty"><b>Build your song from sections</b><p class="note">Add Intro, Verse, Chorus… Each card holds its chords, a lyric line and what plays. "Build song" puts it on the Studio timeline with smooth transitions.</p>'+
    '<div class="btns"><button class="btn primary" data-sec="tpl">Intro · Verse · Chorus</button>'+((daw.clips.length||song.some(function(pi){return patterns[pi]&&patHas(patterns[pi]);}))?'<button class="btn" data-sec="infer">Make sections from my song</button>':'')+'</div></div>';
  if(SEC.warn)h+='<p class="note sc-warn">⚠ '+xesc(SEC.warn)+'</p>';
  if(SEC.bpmSug)h+='<div class="sc-undo"><span>'+xesc(SEC.bpmSug.name)+' sounds like '+SEC.bpmSug.bpm+' BPM (song: '+P.bpm.v+')</span><span style="display:flex;gap:6px"><button class="btn" data-sec="usebpm">Use it</button><button class="btn" data-sec="nobpm" aria-label="Dismiss">✕</button></span></div>';
  if(U.del)h+='<div class="sc-undo"><span>Deleted '+xesc(U.del.s.name)+'</span><button class="btn" data-sec="undel">Undo</button></div>';
  Lay.forEach(function(Ly,i){var s=Ly.sec,open=U.open[s.id]!==false,k=secKey(s),col=secCol(s);
    if(i>0){var A=Lay[i-1].sec,t=secTr(s),em=secTxMode(A,s),nauto=daw.clips.filter(function(c){return c.tx&&c.gen==='t'+s.id;}).length,nfrz=daw.clips.filter(function(c){return c.frz&&c.gen==='t'+s.id;}).length;
      var lab=t.m==='auto'?'Auto ('+em+')':SECTXM.filter(function(x){return x[0]===t.m;})[0][1];
      h+='<div class="sc-tx'+(U.tx===s.id?' on':'')+'"><button class="sc-txb" data-sec="tx" data-id="'+s.id+'" aria-expanded="'+(U.tx===s.id)+'"><span>⤳ '+xesc(A.name)+' → '+xesc(s.name)+'</span><small>'+lab+(t.m!=='off'&&em!=='cut'?' · '+(t.len===0.5?'½':t.len)+' bar'+(t.len>1?'s':''):'')+(nauto?' · '+nauto+' auto':'')+(nfrz?' · '+nfrz+' frozen':'')+'</small></button>';
      if(U.tx===s.id){h+='<div class="sc-txp"><div class="seg sc-wrap" role="group" aria-label="Transition style">'+SECTXM.map(function(x){return '<button data-sec="txm" data-id="'+s.id+'" data-v="'+x[0]+'" aria-pressed="'+(t.m===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>'+
        '<div class="row"><span class="mu">Length</span><div class="seg" role="group" aria-label="Transition length">'+[0.5,1,2,4].map(function(v){return '<button data-sec="txl" data-id="'+s.id+'" data-v="'+v+'" aria-pressed="'+(t.len===v)+'">'+(v===0.5?'½':v)+'</button>';}).join('')+'</div></div>'+
        '<div class="row"><span class="mu">Players</span><div class="seg" role="group" aria-label="Who plays the transition">'+[['d','Drums'],['b','Bass'],['k','Keys']].map(function(x){return '<button data-sec="txp" data-id="'+s.id+'" data-v="'+x[0]+'" aria-pressed="'+!!t[x[0]]+'">'+x[1]+'</button>';}).join('')+'</div></div>'+
        (nauto?'<button class="btn" data-sec="txf" data-id="'+s.id+'">Freeze these '+nauto+' auto clips (make them mine)</button>':'')+
        '<p class="note">'+(secKey(A)!==k?'Key change: pivot chord then the dominant of '+bandChName(s.chords[0]||[k,'maj'])+'. ':'')+(secBpm(A)!==secBpm(s)?'Tempo ramps '+secBpm(A)+' → '+secBpm(s)+' BPM onto the downbeat. ':'')+'Auto clips are rewritten when you change sections; edited or frozen ones are left alone.</p></div>';}
      h+='</div>';}
    h+='<div class="sc-card'+(open?'':' shut')+'" data-sid="'+s.id+'" style="--c:'+col+'"><div class="sc-hd" data-sh="'+s.id+'"><span class="sc-grip" data-grip="'+s.id+'" role="button" aria-label="Drag to reorder '+xesc(s.name)+'">⋮⋮</span><b class="sc-nm">'+xesc(s.name)+'</b>'+
      '<span class="sc-pill">'+s.bars+' bar'+(s.bars>1?'s':'')+'</span><span class="sc-pill">'+GNOTE[k]+((BMODE[secMode(s)]||{}).mi?'m':'')+' · '+secMeter(s)+'</span>'+(s.bpm?'<span class="sc-pill">'+s.bpm+'</span>':'')+
      '<button class="sc-play" data-sec="play" data-id="'+s.id+'" aria-label="Play from '+xesc(s.name)+'">▶</button></div>';
    if(open){var sel=U.sel&&U.sel.id===s.id?U.sel.i:-1;
      h+='<div class="sc-chords">'+s.chords.map(function(c,j){return secChordBtn(s,c,j,j===sel);}).join('')+'<button class="sc-ch add" data-sec="chadd" data-id="'+s.id+'" aria-label="Add a chord">+</button></div>';
      if(sel>=0){h+='<div class="sc-pal" role="group" aria-label="Chords in '+GNOTE[k]+'">'+secPalette(s).map(function(c,j){return secChordBtn(s,c,j,false).replace('data-sec="ch"','data-sec="pal"').replace('data-i="'+j+'"','data-i="'+j+'" data-p="'+c[0]+'|'+c[1]+'"');}).join('')+'</div>'+
        '<div class="sc-fnk"><i style="--f:'+SECFN.T+'">Tonic</i><i style="--f:'+SECFN.S+'">Subdominant</i><i style="--f:'+SECFN.D+'">Dominant</i><i style="--f:'+SECFN.B+'">Borrowed</i><button class="btn" data-sec="chdel" data-id="'+s.id+'">Remove chord</button></div>';}
      h+='<label class="sc-ly"><span class="vh">Lyric line for '+xesc(s.name)+'</span><input data-ly="'+s.id+'" value="'+xesc(s.lyric||'')+'" placeholder="Lyric line…" autocomplete="off"><span class="sc-syl" id="secSyl'+s.id+'">'+(s.lyric?secSyl(s.lyric)+' syl':'')+'</span></label>';
      var oc=daw.clips.filter(function(c){return !c.gen&&c.s<Ly.s+Ly.l&&clipEnd(c)>Ly.s;}).slice(0,3);
      h+='<div class="sc-links"><button class="sc-chip" data-sec="band" data-id="'+s.id+'" style="--d:#FFD166">'+(s.band==='off'?'Band · off':'Band · Part '+s.band+(s.genre?' · '+BGEN[s.genre].n:''))+'</button>'+
        '<button class="sc-chip" data-sec="more" data-id="'+s.id+'" style="--d:#7BE495">'+(s.pads.length?'Pads · '+s.pads.map(function(p){return 'Pattern '+patterns[p].name;}).join(', '):'+ Pads')+'</button>'+
        oc.map(function(c){return '<span class="sc-chip" style="--d:#FF6FB5">'+xesc(tracks[c.ti]?tracks[c.ti].name:'Clip')+(c.type==='pat'?' · '+patterns[c.p].name:' · audio')+'</span>';}).join('')+'</div>';
      h+='<button class="sc-more" data-sec="more" data-id="'+s.id+'" aria-expanded="'+!!U.more[s.id]+'">Section settings '+(U.more[s.id]?'▴':'▾')+'</button>';
      if(U.more[s.id]){var pp=[];patterns.forEach(function(pt,pi){if(patHas(pt)&&SEC.own[pi]==null)pp.push(pi);});
        h+='<div class="sc-set"><label class="sc-row"><span class="mu">Name</span><input data-nm="'+s.id+'" value="'+xesc(s.name)+'" maxlength="24"></label>'+
          '<div class="sc-row"><span class="mu">Bars</span><span class="sc-step"><button class="mv" data-sec="bars" data-id="'+s.id+'" data-v="-1" aria-label="Fewer bars">−</button><b>'+s.bars+'</b><button class="mv" data-sec="bars" data-id="'+s.id+'" data-v="1" aria-label="More bars">+</button></span></div>'+
          '<div class="sc-row"><span class="mu">Key</span><span class="sc-step"><button class="mv" data-sec="key" data-id="'+s.id+'" data-v="-1" aria-label="Key down a semitone">−</button><b>'+GNOTE[k]+(s.key==null?' (song)':' ('+((k-(GAR.key||0)+18)%12-6>=0?'+':'')+((k-(GAR.key||0)+18)%12-6)+')')+'</b><button class="mv" data-sec="key" data-id="'+s.id+'" data-v="1" aria-label="Key up a semitone">+</button></span></div>'+
          '<div class="sc-row"><span class="mu">Tempo</span><span class="sc-step"><button class="mv" data-sec="bpm" data-id="'+s.id+'" data-v="-2" aria-label="Slower">−</button><b>'+secBpm(s)+(s.bpm?'':' (song)')+'</b><button class="mv" data-sec="bpm" data-id="'+s.id+'" data-v="2" aria-label="Faster">+</button></span></div>'+
          '<label class="sc-row"><span class="mu">Meter</span><select class="dsel" data-me="'+s.id+'"><option value="">Song ('+GAR.band.meter+')</option>'+Object.keys(BMET).map(function(m){return '<option'+(s.meter===m?' selected':'')+'>'+m+'</option>';}).join('')+'</select></label>'+
          '<label class="sc-row"><span class="mu">Genre</span><select class="dsel" data-gn="'+s.id+'"><option value="">Band setting</option>'+Object.keys(BGEN).map(function(g){return '<option value="'+g+'"'+(s.genre===g?' selected':'')+'>'+BGEN[g].n+'</option>';}).join('')+'</select></label>'+
          '<label class="sc-row"><span class="mu">Simple</span><input type="range" min="0" max="1" step="0.05" value="'+s.cx+'" data-cx="'+s.id+'" aria-label="Simple to complex"><span class="mu">Complex</span></label>'+
          '<label class="sc-row"><span class="mu">Quiet</span><input type="range" min="0" max="1" step="0.05" value="'+s.ld+'" data-ld="'+s.id+'" aria-label="Quiet to loud"><span class="mu">Loud</span></label>'+
          '<div class="sc-row"><span class="mu">Pads</span><div class="chips">'+(pp.length?pp.map(function(pi){return '<button class="chip" data-sec="padp" data-id="'+s.id+'" data-v="'+pi+'" aria-pressed="'+(s.pads.indexOf(pi)>=0)+'">Pattern '+patterns[pi].name+'</button>';}).join(''):'<span class="mu">Program a beat in Play › Pads, then link it here.</span>')+'</div></div>'+
          '<button class="btn" data-sec="del" data-id="'+s.id+'">Delete section</button></div>';}}
    h+='</div>';});
  h+='<div class="btns"><button class="btn" data-sec="add" aria-expanded="'+!!U.add+'">+ Section</button>'+(SEC.list.length?'<button class="btn primary" data-sec="build">'+(SEC.built?'Rebuild song':'Build song')+'</button>':'')+'</div>';
  if(U.add)h+='<div class="chips sc-addl">'+SECTYPES.map(function(t){return '<button class="chip" data-sec="addt" data-v="'+t+'">'+t+'</button>';}).join('')+'<button class="chip" data-sec="addc">Custom…</button></div>';
  if(SEC.list.length)h+='<div class="btns"><button class="btn" data-sec="playall">▶ Play song</button><button class="btn" data-sec="time">Open timeline</button></div>';
  if(SEC.list.length)h+='<p class="note">Drag ⋮⋮ to reorder · long-press a card title to duplicate · tap a chord to change it.</p>';
  h+='<div class="kicker sc-tools">Pattern editor &amp; tools</div>';
  el.innerHTML=h;}
function secDo(b){var a=b.getAttribute('data-sec'),id=+b.getAttribute('data-id'),v=b.getAttribute('data-v'),s=secById(id),U=SEC.ui;
  if(a==='time'){subGo('t-daw');return;}
  if(a==='tpl'){['Intro','Verse','Chorus'].forEach(function(n){SEC.list.push(secNew(n));});U.del=null;secChanged();return;}
  if(a==='infer'){secInfer();return;}
  if(a==='usebpm'||a==='nobpm'){if(a==='usebpm'&&SEC.bpmSug){setParam('bpm',SEC.bpmSug.bpm);toast('Song tempo set to '+SEC.bpmSug.bpm+' BPM.',1600);SEC.bpmSug=null;secChanged();return;}SEC.bpmSug=null;secRender();return;}
  if(a==='undel'){if(U.del){SEC.list.splice(Math.min(U.del.i,SEC.list.length),0,U.del.s);U.del=null;secChanged();}return;}
  if(a==='add'){U.add=!U.add;secRender();return;}
  if(a==='addt'||a==='addc'){var nm=a==='addt'?v:(window.prompt('Section name','Hook')||'').trim().slice(0,24);if(!nm)return;var n=secNew(nm);SEC.list.push(n);U.add=false;U.open[n.id]=true;secChanged();
    setTimeout(function(){var c=document.querySelector('.sc-card[data-sid="'+n.id+'"]');if(c&&c.scrollIntoView)c.scrollIntoView({block:'nearest'});},30);return;}
  if(a==='build'){if(secBuild(false))secRender();return;}
  if(a==='playall'){secPlayFrom(0);return;}
  if(!s)return;
  if(a==='play'){var L=secLayout().filter(function(x){return x.sec===s;})[0];secPlayFrom(L?L.s:0);return;}
  if(a==='ch'){var i=+b.getAttribute('data-i');U.sel=U.sel&&U.sel.id===id&&U.sel.i===i?null:{id:id,i:i};secRender();return;}
  if(a==='pal'){var pr=b.getAttribute('data-p').split('|'),c=[+pr[0],pr[1]];if(U.sel&&U.sel.id===id){s.chords[U.sel.i]=c;U.sel.i=Math.min(U.sel.i+1,s.chords.length-1);}secChanged();return;}
  if(a==='chadd'){if(s.chords.length>=16)return;var lc=s.chords[s.chords.length-1]||[secKey(s),'maj'];s.chords.push(lc.slice());U.sel={id:id,i:s.chords.length-1};secChanged();return;}
  if(a==='chdel'){if(U.sel&&s.chords.length>1){s.chords.splice(U.sel.i,1);U.sel=null;secChanged();}return;}
  if(a==='band'){var o=['A','B','C','off'];s.band=o[(o.indexOf(s.band)+1)%o.length];secChanged();return;}
  if(a==='more'){U.more[id]=!U.more[id];secRender();return;}
  if(a==='bars'){s.bars=clamp(s.bars+(+v),1,32);secChanged();return;}
  if(a==='key'){var k0=secKey(s),k1=(k0+(+v)+12)%12;s.chords=s.chords.map(function(c){var d=[(c[0]+(+v)+12)%12,c[1]];if(c[2])d.push([(c[2][0]+(+v)+12)%12,c[2][1]]);return d;});s.key=k1===(GAR.key||0)?null:k1;secChanged();return;}
  if(a==='bpm'){var nb=clamp(secBpm(s)+(+v),P.bpm.min,P.bpm.max);s.bpm=nb===P.bpm.v?null:nb;secChanged();return;}
  if(a==='padp'){var pi=+v,j=s.pads.indexOf(pi);if(j>=0)s.pads.splice(j,1);else s.pads.push(pi);secChanged();return;}
  if(a==='del'){var ix=SEC.list.indexOf(s);U.del={s:s,i:ix};SEC.list.splice(ix,1);secChanged();toast('Deleted '+s.name+' — tap Undo to bring it back.',2400);return;}
  if(a==='tx'){U.tx=U.tx===id?null:id;secRender();return;}
  var t=secTr(s);
  if(a==='txm'){t.m=v;secChanged();return;}
  if(a==='txl'){t.len=+v;secChanged();return;}
  if(a==='txp'){t[v]=!t[v];secChanged();return;}
  if(a==='txf'){var n2=secFreezeTx(id);toast(n2+' transition clip'+(n2===1?'':'s')+' frozen: they are yours now.',2000);secRender();return;}}
function secDup(id){var s=secById(id);if(!s)return;var c=JSON.parse(JSON.stringify(s));c.id=++SEC.nid;SEC.list.splice(SEC.list.indexOf(s)+1,0,c);SEC.ui.open[c.id]=true;toast('Duplicated '+s.name+'.',1400);secChanged();}
function secDrag(e,id){var card=document.querySelector('#secView .sc-card[data-sid="'+id+'"]');if(!card)return;e.preventDefault();
  var pid=e.pointerId,y0=e.clientY,cards=[].slice.call(document.querySelectorAll('#secView .sc-card')),from=cards.indexOf(card),to=from,mids=cards.map(function(c){var r=c.getBoundingClientRect();return r.top+r.height/2;});
  card.classList.add('drag');
  function mv(ev){if(ev.pointerId!==pid)return;ev.preventDefault();var dy=ev.clientY-y0,y=ev.clientY;card.style.transform='translateY('+dy+'px)';to=0;mids.forEach(function(m,i){if(i!==from&&y>m)to++;});
    cards.forEach(function(c,i){if(c===card)return;var sh=0;if(from<to&&i>from&&i<=to)sh=-1;if(from>to&&i<from&&i>=to)sh=1;c.style.transform=sh?'translateY('+(sh*Math.min(80,card.offsetHeight))+'px)':'';});}
  function up(ev){if(ev.pointerId!==pid)return;window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
    cards.forEach(function(c){c.style.transform='';});card.classList.remove('drag');
    if(to!==from){var it=SEC.list.splice(from,1)[0];SEC.list.splice(to,0,it);toast(it.name+' moved to position '+(to+1)+'.',1400);secChanged();}}
  window.addEventListener('pointermove',mv,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);}
(function(){var el=$('#secView');if(!el)return;
  el.addEventListener('click',function(e){var b=e.target.closest('[data-sec]');if(b){secDo(b);return;}var hd=e.target.closest('[data-sh]');
    if(hd&&!e.target.closest('[data-grip]')){var lp=SEC.ui.lp;if(lp&&lp.fired){SEC.ui.lp=null;return;}var id=+hd.getAttribute('data-sh');SEC.ui.open[id]=SEC.ui.open[id]===false;secRender();}});
  el.addEventListener('pointerdown',function(e){var gp=e.target.closest('[data-grip]');if(gp){secDrag(e,+gp.getAttribute('data-grip'));return;}
    var hd=e.target.closest('[data-sh]');if(hd&&!e.target.closest('button')){var id=+hd.getAttribute('data-sh');if(SEC.ui.lp)clearTimeout(SEC.ui.lp.t);SEC.ui.lp={id:id,x:e.clientX,y:e.clientY,fired:false,t:setTimeout(function(){if(SEC.ui.lp&&SEC.ui.lp.id===id){SEC.ui.lp.fired=true;secDup(id);}},550)};}});
  el.addEventListener('pointermove',function(e){var lp=SEC.ui.lp;if(lp&&!lp.fired&&Math.abs(e.clientX-lp.x)+Math.abs(e.clientY-lp.y)>10){clearTimeout(lp.t);SEC.ui.lp=null;}});
  ['pointerup','pointercancel'].forEach(function(t){el.addEventListener(t,function(){var lp=SEC.ui.lp;if(lp&&!lp.fired){clearTimeout(lp.t);SEC.ui.lp=null;}});});
  el.addEventListener('contextmenu',function(e){if(e.target.closest('[data-sh]'))e.preventDefault();});
  el.addEventListener('input',function(e){var t=e.target,id;if((id=t.getAttribute('data-ly'))){var s=secById(+id);if(!s)return;s.lyric=t.value.slice(0,120);var sy=$('#secSyl'+id);if(sy)sy.textContent=s.lyric?secSyl(s.lyric)+' syl':'';markDirty();}
    else if((id=t.getAttribute('data-cx')||t.getAttribute('data-ld'))){var s2=secById(+id);if(!s2)return;if(t.hasAttribute('data-cx'))s2.cx=+t.value;else s2.ld=+t.value;}});
  el.addEventListener('change',function(e){var t=e.target,id;
    if((id=t.getAttribute('data-ly'))){var s0=secById(+id);if(s0&&SEC.reg)SEC.reg.forEach(function(r){if(r.id===s0.id)r.lyric=s0.lyric;});markDirty();return;}
    if((id=t.getAttribute('data-nm'))){var s=secById(+id);if(s&&t.value.trim()){s.name=t.value.trim().slice(0,24);secChanged();}return;}
    if((id=t.getAttribute('data-me'))){var s1=secById(+id);if(s1){s1.meter=t.value||null;secChanged();}return;}
    if((id=t.getAttribute('data-gn'))){var s3=secById(+id);if(s3){s3.genre=t.value||null;secChanged();}return;}
    if(t.hasAttribute('data-cx')||t.hasAttribute('data-ld'))secChanged();});
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#bdSecPlay')){toast('The band plays your sections in order.',1600);secPlayFrom(0);}});})();
/* tempo map (only when a section sets its own tempo): bpm at step g, linear ramps where a point has ramp:1 */
function tmBpm(g){var a=daw.tmap,bv=function(x){return x.b||P.bpm.v;};if(!a||!a.length)return P.bpm.v;if(g<a[0].s)return bv(a[0]);
  for(var i=0;i<a.length-1;i++){if(g>=a[i].s&&g<a[i+1].s){var q=a[i+1];if(q.ramp)return bv(a[i])+(bv(q)-bv(a[i]))*(g-a[i].s)/Math.max(1e-9,q.s-a[i].s);return bv(a[i]);}}return bv(a[a.length-1]);}
function tmSd(g){return daw.tmap&&daw.tmap.length?60/tmBpm(g)/4:stepDur();}

/* ---- UI ---- */
