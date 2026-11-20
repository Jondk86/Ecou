function bandUI(){if(GAR.inst!=='band'||GAR.view!=='play'||!$('#bdNow'))return;var B=GAR.band,run=bandRunning();
  $('#bdPlay').innerHTML=run?'■ Stop':GSVG.play+'Play';$('#bdPlay').classList.toggle('on',run);
  $$('#bdParts [data-bp]').forEach(function(b){var p=b.getAttribute('data-bp');b.setAttribute('aria-pressed',String(run?BR.part===p:B.edit===p));b.classList.toggle('queued',!!(run&&(BR.q===p||(BR.T&&BR.T.items.part&&BR.T.items.part.p===p))));b.classList.toggle('editing',B.edit===p);});
  ['bdFill','bdBrk','bdEnd'].forEach(function(id){$('#'+id).disabled=!run;});}
function bandNowTick(){if(GAR.inst!=='band'||!$('#bdNow'))return;var el=$('#bdNow'),B=GAR.band;bandTrCue();
  if(!bandRunning()){var p=bandPart(B.edit),k='idle'+B.edit+JSON.stringify(p)+B.mode+B.solo+GAR.key;if(el._s!==k){el._s=k;el.innerHTML='<div class="bd-ch"><b>'+bandChName(p[0])+'</b><span>then '+bandChName(p[1]||p[0])+'</span></div><div class="bd-meta"><span>Part '+B.edit+' · '+p.length+' bars · '+B.meter.replace('b','')+'</span><span>Solo: '+bandScaleName(p[0])+'</span></div>';}
    $$('#bdGrid .now').forEach(function(x){x.classList.remove('now');});return;}
  var now=ctx.currentTime,m=null;BR.marks.forEach(function(x){if(x.t<=now+0.02)m=x;});
  if(!m){if(el._s!=='cnt'){el._s='cnt';el.innerHTML='<div class="bd-ch"><b>…</b><span>count-in</span></div>';}return;}
  var sd=stepDur(),st=Math.floor((now-m.t)/sd),half=m.c2&&st>=m.sp,cc=half?m.c2:m.c,key=m.t+':'+(half?1:0);
  var gs=$('#bdGrid');if(gs&&st>=0&&st<m.N&&gs._st!==m.t+':'+st){gs._st=m.t+':'+st;$$('#bdGrid .now').forEach(function(x){x.classList.remove('now');});$$('#bdGrid [data-gs="'+st+'"]').forEach(function(x){x.classList.add('now');});}
  if(el._s===key)return;el._s=key;try{if(typeof harmFromChord==='function')harmFromChord(cc);}catch(e){}
  var nx=half||!m.c2?m.n:m.c2;
  el.innerHTML='<div class="bd-ch"><b>'+(m.end?'End':garChName(cc))+'</b><span>'+(m.end?'last hit':'next '+(nx?garChName(nx[2]?[nx[0],nx[1]]:nx):'—'))+(m.fill?' · fill':'')+(m.brk?' · break':'')+'</span></div><div class="bd-meta"><span>Part '+m.part+' · bar '+(m.pb+1)+'/'+m.len+(BR.q?' → '+BR.q:'')+'</span><span>Solo: '+bandScaleName(cc)+'</span></div>';
  $$('#bdBars [data-bb]').forEach(function(b){b.classList.toggle('now',m.part===B.edit&&+b.getAttribute('data-bb')===m.pb);});}
function bandSec(id,title,body,sum){var B=GAR.band;return '<details class="bd-sec" data-sec="'+id+'"'+(B.open[id]?' open':'')+'><summary><b>'+title+'</b><small>'+(sum||'')+'</small></summary><div class="bd-body">'+body+'</div></details>';}
function bandSeg(id,attr,opts,cur){return '<div class="gx-seg2 bd-seg" id="'+id+'">'+opts.map(function(o){return '<button data-'+attr+'="'+o[0]+'" aria-pressed="'+(String(cur)===String(o[0]))+'">'+o[1]+'</button>';}).join('')+'</div>';}
function bandSelect(id,map,keys,cur,label){return '<select class="gx-pill bd-sel" id="'+id+'" aria-label="'+label+'">'+keys.map(function(k){return '<option value="'+k+'"'+(k===cur?' selected':'')+'>'+map[k]+'</option>';}).join('')+'</select>';}
function bandRng(k,label,min,max,v){return '<div class="gx-row"><span>'+label+'</span><input type="range" class="gx-rng" data-bs="'+k+'" min="'+(min||0)+'" max="'+(max||1)+'" step="0.01" value="'+v+'" aria-label="'+label+'"></div>';}
function bandSndSel(id,kind,ti){var t=tracks[ti],cur=t&&t.sound&&t.sound.slots&&t.sound.slots.A&&t.sound.slots.A.stock,ids=GSND[kind].filter(function(x){return STOCK[x];});
  return '<select class="gx-pill bd-sel" id="'+id+'" aria-label="'+kind+' sound">'+(cur&&ids.indexOf(cur)>=0?'':'<option value="">'+escapeH(cur&&STOCK[cur]?STOCK[cur].name:'Current sound')+'</option>')+ids.map(function(x){return '<option value="'+x+'"'+(x===cur?' selected':'')+'>'+STOCK[x].name+'</option>';}).join('')+'</select>';}
function bandGridHTML(){var B=GAR.band,g=bandGroove(),N=g.N,GS={};bandGroups().forEach(function(x){GS[x.s]=1;});
  function cells(row,fmt,cls){var h='';for(var s=0;s<N;s++)h+='<button class="bd-c'+(GS[s]?' gs':'')+' '+cls(row[s])+'" data-gs="'+s+'">'+fmt(row[s])+'</button>';return h;}
  var h='<div class="bd-grid" id="bdGrid" style="--n:'+N+'">';
  BGL.forEach(function(L){if(garPad(L[0])<0)return;var row=g.d[L[0]]||new Array(N).fill(0);h+='<div class="bd-gr" data-gd="'+L[0]+'"><span>'+L[1]+'</span>'+cells(row,function(){return '';},function(v){return v===2?'v2':v===1?'v1':v===3?'v3':'';})+'</div>';});
  h+='<div class="bd-gr bass" data-gb="1"><span>Bass</span>'+cells(g.b,function(v){return v||'';},function(v){return v?'v1':'';})+'</div>';
  h+='<div class="bd-gr keys" data-gk="1"><span>Keys</span>'+cells(g.k,function(){return '';},function(v){return v===2?'v2':v===1?'v1':'';})+'</div></div>';return h;}
function garBand(){var B=GAR.band,el=$('#garInst');el.classList.remove('fret');bandFix();bandTrCheck();var R=bandTr(),pT=bandRunning()&&BR.T?BR.T.items:{},pk=pT.key,pm=pT.meter;var prog=bandPart(B.edit);if(B.sel>=prog.length)B.sel=prog.length-1;var run=bandRunning(),pal=bandPalette(),cur=prog[B.sel]||prog[0],sc=$('main')?$('main').scrollTop:0;
  var xy=garXY('bdXY',function(){return [{x:B.pen[B.edit],y:B.dyn,l:B.edit,sel:true}];},function(pt){B.pen[B.edit]=pt.x;B.dyn=pt.y;if(bandRunning()&&BR.part!==B.edit)B.pen[BR.part]=pt.x;markDirty();},['Simple','Complex','Loud']);
  var h='<div class="bd-now" id="bdNow" aria-live="polite"></div><div class="bd-tr" id="bdTr" role="status"><b id="bdTrT"></b><button class="gx-chip" data-trx="cut" hidden>Cut</button><button class="gx-chip" data-trx="cancel" hidden>Cancel</button></div>'+
    '<div class="gx-acts"><button class="gx-btn pri" id="bdPlay">'+GSVG.play+'Play</button>'+bandSeg('bdParts','bp',[['A','A'],['B','B'],['C','C']],run?BR.part:B.edit)+'</div>'+
    '<div class="bd-live"><button class="gx-btn" id="bdFill">Fill</button><button class="gx-btn" id="bdBrk">Break</button><button class="gx-btn" id="bdEnd">Ending</button></div>'+
    '<div class="gx-chips bd-mutes"><button class="gx-chip" data-mute="mD" aria-pressed="'+!B.mD+'">Drums</button><button class="gx-chip" data-mute="mB" aria-pressed="'+!B.mB+'">Bass</button><button class="gx-chip" data-mute="mK" aria-pressed="'+!B.mK+'">Keys</button><button class="gx-chip" id="bdPush" aria-pressed="'+B.push+'">Push</button></div>'+
    '<div class="gx-row"><span>Drum time</span>'+bandSeg('bdTime','bt',[['half','Half'],['normal','Normal'],['double','Double']],B.time)+'</div>'+
    xy.html+'<p class="gx-hint" style="margin:0">Drag the dot while the band plays: right is busier, up is louder. Each part keeps its own setting.</p>'+
    '<div class="gx-row" style="margin-top:4px"><span>Start from a genre</span><span class="mu">sets the styles below</span></div>'+
    (SEC.list.length?'<button class="btn" id="bdSecPlay" style="min-height:44px">▶ Play my song sections in order</button>':'')+'<div class="gx-styles" id="bdGen" role="group" aria-label="Genre">'+Object.keys(BGEN).map(function(k){return '<button class="gx-sty" data-bg="'+k+'" aria-pressed="'+(B.genre===k)+'"><b>'+BGEN[k].n+'</b><small>'+BGEN[k].sub+'</small></button>';}).join('')+'</div>';
  var tb='<div class="gx-row"><span>Smooth transitions</span><button class="gx-sw" id="bdTrOn" aria-pressed="'+R.on+'" aria-label="Smooth transitions"></button></div>'+
    '<div class="gx-row"><span>Intensity</span>'+bandSeg('bdTrInt','ti',[['subtle','Subtle'],['normal','Normal'],['dramatic','Dramatic']],R.int)+'</div>'+
    '<div class="gx-row"><span>Length</span>'+bandSeg('bdTrLen','tl',[['beat','1 beat'],['half','½ bar'],['bar','1 bar'],['two','2 bars']],R.len)+'</div>'+
    '<div class="gx-row"><span>Changes land on</span>'+bandSeg('bdTrAt','ta',[['bar','Next bar'],['phrase','Phrase end']],R.at)+'</div>'+
    '<div class="gx-row"><span>Who leads in</span></div><div class="gx-chips">'+[['d','Drums'],['b','Bass'],['k','Keys']].map(function(x){return '<button class="gx-chip" data-trp="'+x[0]+'" aria-pressed="'+!!R[x[0]]+'">'+x[1]+'</button>';}).join('')+'</div>'+
    '<p class="gx-hint" style="margin:0">While the band plays, a new key, tempo, meter, chord or part waits for the bar line and the band leads you into it; the chord display counts down. Cut changes on the next bar with no lead-in (or hold a part button). Cancel keeps things as they were. Off: changes apply at once, like before.</p>';
  h+=bandSec('tr','Smooth transitions',tb,R.on?'On · '+R.int+' · '+BTRL[R.len]:'Off');
  /* harmony */
  var hb='<div class="gx-row"><span>Key</span><div style="display:flex;gap:6px"><select class="gx-pill bd-sel" id="bdKey" aria-label="Key root">'+GNOTE.map(function(n,i){return '<option value="'+i+'"'+((pk?pk.k:GAR.key)===i?' selected':'')+'>'+n+'</option>';}).join('')+'</select>'+
      bandSeg('bdMM','bmm',[['maj','Major'],['min','Minor']],(pk?pk.mi:(BMODE[B.mode]||{}).mi)?'min':'maj')+'</div></div>'+
    '<div class="gx-row"><span>Mode</span>'+bandSelect('bdMode',Object.keys(BMODE).reduce(function(a,k){a[k]=BMODE[k].n;return a;},{}),Object.keys(BMODE),pk?pk.mode:B.mode,'Mode')+'</div>'+
    '<div class="gx-row"><span>Chord colour</span>'+bandSeg('bdColor','bcol',[['tri','Triads'],['7th','7ths']],B.color)+'</div>'+
    '<div class="gx-row"><span>Part '+B.edit+'</span><span class="mu">tap a bar, then a chord</span></div>'+
    '<div class="bd-bars" id="bdBars">'+prog.map(function(c,i){return '<button data-bb="'+i+'" aria-pressed="'+(B.sel===i)+'"><small>'+(i+1)+'</small>'+bandChName(c)+'</button>';}).join('')+
      '<button class="bd-pm" id="bdAdd" aria-label="Add a bar"'+(prog.length>=16?' disabled':'')+'>+</button><button class="bd-pm" id="bdDel" aria-label="Remove the selected bar"'+(prog.length<=1?' disabled':'')+'>−</button></div>'+
    '<div class="gx-row"><span>Bar '+(B.sel+1)+'</span>'+bandSeg('bdHalf','bh',[['1','One chord'],['2','Two chords']],cur[2]?'2':'1')+'</div>'+
    (cur[2]?'<div class="gx-row"><span>Editing</span>'+bandSeg('bdWhich','bw',[['0','1st half'],['1','2nd half']],B.half?'1':'0')+'</div>':'')+
    '<div class="bd-pal" id="bdPal">'+pal.map(function(c,i){return '<button data-bc="'+i+'"><b>'+garChName(c)+'</b><small>'+bandRoman(i,c)+'</small></button>';}).join('')+'</div>'+
    '<div class="gx-row"><span>Any chord</span><div style="display:flex;gap:6px"><select class="gx-pill bd-sel" id="bdRoot" aria-label="Root">'+GNOTE.map(function(n,i){var cc=cur[2]&&B.half?cur[2]:cur;return '<option value="'+i+'"'+(cc[0]===i?' selected':'')+'>'+n+'</option>';}).join('')+'</select><select class="gx-pill bd-sel" id="bdQ" aria-label="Chord type">'+Object.keys(GCHQ).map(function(q){var cc=cur[2]&&B.half?cur[2]:cur;return '<option value="'+q+'"'+(cc[1]===q?' selected':'')+'>'+(GCHQ[q].n||'maj')+'</option>';}).join('')+'</select></div></div>'+
    '<div class="gx-row"><span>Progressions</span><span class="mu">in '+GNOTE[GAR.key]+'</span></div><div class="gx-chips" id="bdPre">'+BPROG.map(function(p,i){return '<button class="gx-chip" data-bpr="'+i+'">'+p[0]+'</button>';}).join('')+'</div>'+
    '<div class="gx-row"><span>Copy part</span><div class="gx-seg2">'+['A','B','C'].filter(function(p){return p!==B.edit;}).map(function(p){return '<button data-bcopy="'+p+'">from '+p+'</button>';}).join('')+'</div></div>'+
    '<div class="gx-row"><span>Solo hint</span>'+bandSeg('bdSolo','bso',[['mode','Mode'],['chord','Per chord']],B.solo)+'</div>'+
    '<div class="gx-row"><span>Learn by ear</span>'+bandSeg('bdLb','lb',[[4,'4 bars'],[8,'8 bars']],B.learnBars)+'</div><button class="gx-btn" id="bdLearn">Learn chords from my playing</button>'+
    (B.keyHint?'<button class="gx-btn" id="bdKeyFix">Set key to '+GNOTE[B.keyHint[0]]+(B.keyHint[1]?' minor':' major')+'</button>':'')+'<p class="gx-hint" style="margin:0">After the count-in, play one chord per bar on guitar or keys.</p>';
  h+=bandSec('harm','Chords and harmony',hb,GNOTE[GAR.key]+' '+(BMODE[B.mode]||BMODE.ionian).n);
  /* rhythm */
  var rb='<div class="gx-row"><span>Meter</span></div><div class="gx-chips" id="bdMeter">'+Object.keys(BMET).map(function(m){return '<button class="gx-chip" data-bm="'+m+'" aria-pressed="'+((pm?pm.m:B.meter)===m)+'">'+(BMETN[m]||m)+'</button>';}).join('')+'</div>'+
    '<div class="gx-row"><span>Feel</span>'+bandSeg('bdFeel','bf',[['straight','Straight'],['s8','Swing 8ths'],['s16','Swing 16ths']],B.feel)+'</div>'+
    bandRng('swing','Swing amount',0,1,B.swing)+bandRng('human','Human feel',0,1,B.human)+bandRng('fills','Fill size',0,1,B.fills)+
    '<div class="gx-row"><span>Fill every</span>'+bandSeg('bdFe','fe',[[0,'Off'],[2,'2'],[4,'4'],[8,'8 bars']],B.fillEvery)+'</div>'+
    '<div class="gx-row"><span>Count-in</span><button class="gx-sw" id="bdCnt" aria-pressed="'+B.count+'" aria-label="Count-in"></button></div>'+
    '<p class="gx-hint" style="margin:0">Tempo: tap the BPM at the top. Swing 8ths gives a shuffle; in 6/8 and 12/8 the feel is already in threes.</p>';
  h+=bandSec('rhy','Rhythm and feel',rb,(BMETN[B.meter]||B.meter)+' · '+(B.feel==='straight'?'straight':B.feel==='s8'?'swing 8ths':'swing 16ths'));
  /* players */
  var pb='<div class="gx-row"><span>Drums</span>'+bandSelect('bdDS',BDF,bandDrumFeels(),B.dS,'Drum style')+'</div>'+
    '<div class="gx-row"><span>Bass</span>'+bandSelect('bdBS',BBS,bandBassStyles(),B.bS,'Bass style')+'</div>'+
    '<div class="gx-row"><span>Keys</span>'+bandSelect('bdKS',BKS,bandKeysStyles(),B.kS,'Keys style')+'</div>'+
    '<div class="gx-row"><span>Voicing</span>'+bandSeg('bdVo','bvo',[['close','Close'],['open','Open'],['nine','+9'],['power','Power']],B.voicing)+'</div>'+
    '<div class="gx-row"><span>Keys register</span>'+bandSeg('bdKR','bkr',[[-1,'Low'],[0,'Mid'],[1,'High']],B.kReg)+'</div>'+
    '<div class="gx-row"><span>Keys notes</span>'+bandSeg('bdKL','bkl',[['short','Short'],['long','Long']],B.kLen)+'</div>'+
    '<div class="gx-row"><span>Bass register</span>'+bandSeg('bdBR','bbr',[[0,'Low'],[1,'High']],B.bReg)+'</div>'+
    '<div class="gx-row"><span>Bass leads into the next chord</span><button class="gx-sw" id="bdAppr" aria-pressed="'+B.approach+'" aria-label="Approach notes"></button></div>'+
    '<button class="gx-btn" id="bdVar">New variation</button>';
  h+=bandSec('ply','Players',pb,BDF[B.dS]+' · '+BBS[B.bS]+' · '+BKS[B.kS]);
  /* groove editor */
  var gOn=B.gOn.d||B.gOn.b||B.gOn.k,gb='<p class="gx-hint" style="margin:0">Write the parts yourself, step by step. Start from what the band plays now, then tap cells. Drums: off → hit → accent → ghost. Bass: tap to cycle the note (R root, 3, 5, 7, 8 octave, 6, ↗ leads into the next chord). Keys: hit → accent. The notes follow your chords.</p>'+
    '<div class="gx-acts"><button class="gx-btn" id="bdCap">Start from the band</button><button class="gx-btn" id="bdClr">Clear</button></div>'+
    '<div class="gx-chips"><button class="gx-chip" data-gon="d" aria-pressed="'+B.gOn.d+'">Use for drums</button><button class="gx-chip" data-gon="b" aria-pressed="'+B.gOn.b+'">Use for bass</button><button class="gx-chip" data-gon="k" aria-pressed="'+B.gOn.k+'">Use for keys</button></div>'+
    '<div class="bd-gwrap">'+bandGridHTML()+'</div>';
  h+=bandSec('grv','Step editor',gb,gOn?'in use':'off');
  /* sounds and mix */
  var bt=bandTrack('bass'),kt=bandTrack('keys'),sb='<div class="gx-row"><span>Bass sound</span>'+bandSndSel('bdBSnd','bass',bt)+'</div><div class="gx-row"><span>Keys sound</span>'+bandSndSel('bdKSnd','keys',kt)+'</div>'+
    '<p class="gx-hint" style="margin:0">Drum kit: use the sound menu at the top.</p>'+bandRng('lvD','Drums level',0,1,B.lvD)+bandRng('lvB','Bass level',0,1,B.lvB)+bandRng('lvK','Keys level',0,1,B.lvK);
  h+=bandSec('mix','Sounds and mix',sb,'');
  h+='<button class="gx-btn pri" id="bdJam">Record yourself over the band</button><div class="gx-acts"><button class="gx-btn" data-bsong="1">Add part '+B.edit+' to song</button><button class="gx-btn" data-bsong="2">Add it twice</button></div>';
  el.innerHTML=h;xy.bind();if($('main'))$('main').scrollTop=sc;
  bandBind(el);bandUI();$('#bdNow')._s=null;bandNowTick();}
function bandBind(el){var B=GAR.band,re=function(){markDirty();garBand();},prog=bandPart(B.edit);
  var on=function(sel,ev,fn){$$(sel).forEach(function(x){x.addEventListener(ev,function(e){fn.call(x,e);});});};
  $('#bdPlay').addEventListener('click',bandToggle);
  on('#bdParts [data-bp]','click',function(){if(this._lp||(BR&&BR.lpT&&performance.now()-BR.lpT<900)){this._lp=false;return;}bandSetPart(this.getAttribute('data-bp'));});
  $$('#bdParts [data-bp]').forEach(function(b){var tm=null;b.addEventListener('pointerdown',function(){b._lp=false;clearTimeout(tm);tm=setTimeout(function(){if(!bandTrOn())return;var p=b.getAttribute('data-bp');if(BR.part===p)return;b._lp=true;BR.lpT=performance.now();if(!(BR.T&&BR.T.items.part&&BR.T.items.part.p===p))bandSetPart(p);bandTrCut();},450);});
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){clearTimeout(tm);});});b.addEventListener('contextmenu',function(e){e.preventDefault();});});
  on('#bdTr [data-trx]','click',function(e){e.stopPropagation();if(this.getAttribute('data-trx')==='cut')bandTrCut();else bandTrCancel();});
  $('#bdTr').addEventListener('click',function(){if(bandRunning()&&BR.T)return;B.open.tr=true;garBand();var d=$('[data-sec="tr"]');if(d)d.scrollIntoView({block:'start',behavior:'smooth'});});
  $('#bdTrOn').addEventListener('click',function(){var R=bandTr();R.on=!R.on;if(bandRunning()){if(!R.on&&BR.T)bandTrCancel();if(R.on)bandTrSnap();}re();});
  on('#bdTrInt [data-ti]','click',function(){bandTr().int=this.getAttribute('data-ti');re();});on('#bdTrLen [data-tl]','click',function(){bandTr().len=this.getAttribute('data-tl');re();});
  on('#bdTrAt [data-ta]','click',function(){bandTr().at=this.getAttribute('data-ta');re();});on('[data-trp]','click',function(){var k=this.getAttribute('data-trp'),R=bandTr();R[k]=!R[k];re();});
  $('#bdFill').addEventListener('click',function(){if(BR)BR.fillReq=true;toast('Fill on the next bar.',900);});
  $('#bdBrk').addEventListener('click',function(){if(BR)BR.brk=true;toast('Break on the next bar: one hit, then space for you.',1300);});
  $('#bdEnd').addEventListener('click',function(){if(BR){if(BR.T)bandTrFire(ctx.currentTime);BR.end=true;toast('Ending on the next bar.',1000);}});
  on('[data-mute]','click',function(){var k=this.getAttribute('data-mute');B[k]=!B[k];this.setAttribute('aria-pressed',!B[k]);markDirty();});
  $('#bdPush').addEventListener('click',function(){B.push=!B.push;this.setAttribute('aria-pressed',B.push);markDirty();toast(B.push?'Bass and keys now hit each new chord an eighth early.':'Push off.',1400);});
  on('#bdTime [data-bt]','click',function(){B.time=this.getAttribute('data-bt');$$('#bdTime [data-bt]').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-bt')===B.time);});markDirty();});
  on('#bdGen [data-bg]','click',function(){var k=this.getAttribute('data-bg'),G0=BGEN[k];B.genre=k;B.meter=G0.m;B.dS=G0.d;B.bS=G0.b;B.kS=G0.k;B.feel=G0.f;B.swing=G0.sw;B.gOn={d:false,b:false,k:false};
    if(/onedrop|bossa/.test(G0.d)&&garPad('rim')<0)toast('This genre sounds best with the Reggae kit (it has a rim click): pick it in the sound menu at the top.',2800);re();});
  on('details.bd-sec','toggle',function(){B.open[this.getAttribute('data-sec')]=this.open;});
  /* harmony */
  $('#bdKey').addEventListener('change',function(){if(bandKeyReq(+this.value,null,null))return;var ok=GAR.key,om=GAR.minor;GAR.key=+this.value;GAR.chords=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(GAR.minor?'m':'');bandKeyChanged(ok,om);if(typeof harmPaintKeys==='function')harmPaintKeys();toast('Key '+GNOTE[GAR.key]+(GAR.minor?' minor':' major')+': your chords moved with it.',1400);});
  on('#bdMM [data-bmm]','click',function(){var mi=this.getAttribute('data-bmm')==='min';if(bandKeyReq(null,mi,null))return;if(mi===!!BMODE[B.mode].mi)return;var om=GAR.minor;GAR.minor=mi;GAR.chords=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(mi?'m':'');B.mode=mi?'aeolian':'ionian';bandKeyChanged(GAR.key,om);toast(GNOTE[GAR.key]+(mi?' minor':' major'),1000);});
  $('#bdMode').addEventListener('change',function(){if(bandKeyReq(null,null,this.value,true))return;B.mode=this.value;var mi=!!BMODE[B.mode].mi;if(mi!==GAR.minor){GAR.minor=mi;GAR.chords=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(mi?'m':'');}re();});
  on('#bdColor [data-bcol]','click',function(){B.color=this.getAttribute('data-bcol');re();});
  on('#bdBars [data-bb]','click',function(){B.sel=+this.getAttribute('data-bb');B.half=false;garBand();bandAudition(bandPart(B.edit)[B.sel]);});
  $('#bdAdd').addEventListener('click',function(){var p=bandPart(B.edit);p.splice(B.sel+1,0,JSON.parse(JSON.stringify(p[B.sel])));B.sel++;re();});
  $('#bdDel').addEventListener('click',function(){var p=bandPart(B.edit);if(p.length<=1)return;p.splice(B.sel,1);B.sel=Math.max(0,B.sel-1);re();});
  on('#bdHalf [data-bh]','click',function(){var p=bandPart(B.edit),c=p[B.sel];if(this.getAttribute('data-bh')==='2'){if(!c[2])c[2]=[c[0],c[1]];B.half=true;}else{p[B.sel]=[c[0],c[1]];B.half=false;}re();});
  on('#bdWhich [data-bw]','click',function(){B.half=this.getAttribute('data-bw')==='1';garBand();});
  var setChord=function(c){var p=bandPart(B.edit),cur=p[B.sel];if(cur[2]&&B.half){cur[2]=[c[0],c[1]];}else if(cur[2]){p[B.sel]=[c[0],c[1],cur[2]];B.half=true;}else{p[B.sel]=[c[0],c[1]];if(B.sel<p.length-1)B.sel++;}bandAudition([c[0],c[1]]);re();};
  on('#bdPal [data-bc]','click',function(){setChord(bandPalette()[+this.getAttribute('data-bc')]);});
  var any=function(){setChord([+$('#bdRoot').value,$('#bdQ').value]);};$('#bdRoot').addEventListener('change',any);$('#bdQ').addEventListener('change',any);
  on('#bdPre [data-bpr]','click',function(){var pr=BPROG[+this.getAttribute('data-bpr')];B.parts[B.edit]=pr[1].map(function(c){return [(GAR.key+c[0])%12,c[1]];});B.sel=0;re();toast('Part '+B.edit+': '+pr[0],1400);});
  on('[data-bcopy]','click',function(){var src=this.getAttribute('data-bcopy');B.parts[B.edit]=JSON.parse(JSON.stringify(bandPart(src)));B.pen[B.edit]=B.pen[src];B.sel=0;re();toast('Copied part '+src+' into '+B.edit+'.',1200);});
  on('#bdSolo [data-bso]','click',function(){B.solo=this.getAttribute('data-bso');re();});
  on('#bdLb [data-lb]','click',function(){B.learnBars=+this.getAttribute('data-lb');$$('#bdLb [data-lb]').forEach(function(x){x.setAttribute('aria-pressed',+x.getAttribute('data-lb')===B.learnBars);});});
  $('#bdLearn').addEventListener('click',bandLearn);
  if($('#bdKeyFix'))$('#bdKeyFix').addEventListener('click',function(){GAR.key=B.keyHint[0];GAR.minor=B.keyHint[1];B.mode=B.keyHint[1]?'aeolian':'ionian';GAR.chords=null;B.keyHint=null;var ks=$('#garKey');if(ks)ks.value=GAR.key+(GAR.minor?'m':'');re();toast('Key set.',1200);});
  /* rhythm */
  on('#bdMeter [data-bm]','click',function(){if(bandTrOn()){var m=this.getAttribute('data-bm');if(m===B.meter)bandTrCancel('meter');else bandTrQueue('meter',{m:m});garBand();return;}B.meter=this.getAttribute('data-bm');bandFix();re();toast('Meter '+(BMETN[B.meter]||B.meter)+(bandRunning()?' from the next bar.':'.'),1300);});
  on('#bdFeel [data-bf]','click',function(){B.feel=this.getAttribute('data-bf');if(B.feel!=='straight'&&B.swing<0.05)B.swing=B.feel==='s8'?0.8:0.3;re();});
  on('[data-bs]','input',function(){B[this.getAttribute('data-bs')]=+this.value;markDirty();});
  on('#bdFe [data-fe]','click',function(){B.fillEvery=+this.getAttribute('data-fe');$$('#bdFe [data-fe]').forEach(function(x){x.setAttribute('aria-pressed',+x.getAttribute('data-fe')===B.fillEvery);});markDirty();});
  $('#bdCnt').addEventListener('click',function(){B.count=!B.count;this.setAttribute('aria-pressed',B.count);markDirty();});
  /* players */
  $('#bdDS').addEventListener('change',function(){B.dS=this.value;B.gOn.d=false;re();});
  $('#bdBS').addEventListener('change',function(){B.bS=this.value;B.gOn.b=false;re();});
  $('#bdKS').addEventListener('change',function(){B.kS=this.value;B.gOn.k=false;re();});
  on('#bdVo [data-bvo]','click',function(){B.voicing=this.getAttribute('data-bvo');re();bandAudition(bandPart(B.edit)[B.sel]);});
  on('#bdKR [data-bkr]','click',function(){B.kReg=+this.getAttribute('data-bkr');re();bandAudition(bandPart(B.edit)[B.sel]);});
  on('#bdKL [data-bkl]','click',function(){B.kLen=this.getAttribute('data-bkl');re();});
  on('#bdBR [data-bbr]','click',function(){B.bReg=+this.getAttribute('data-bbr');re();});
  $('#bdAppr').addEventListener('click',function(){B.approach=!B.approach;this.setAttribute('aria-pressed',B.approach);markDirty();});
  $('#bdVar').addEventListener('click',function(){B.seed=1+Math.floor(Math.random()*9999);markDirty();toast('New variation from the next bar.',1100);});
  /* step editor */
  $('#bdCap').addEventListener('click',function(){bandCapture();re();toast('The step editor now holds what the band was playing. Tap cells to change it.',2200);});
  $('#bdClr').addEventListener('click',function(){var k=B.meter;delete B.groove[k];bandGroove();re();});
  on('[data-gon]','click',function(){var k=this.getAttribute('data-gon');B.gOn[k]=!B.gOn[k];re();});
  var g=bandGroove();
  on('#bdGrid [data-gd] [data-gs]','click',function(){var nm=this.parentNode.getAttribute('data-gd'),s=+this.getAttribute('data-gs');if(!g.d[nm])g.d[nm]=new Array(g.N).fill(0);var v=g.d[nm][s];g.d[nm][s]=v===0?1:v===1?2:v===2?3:0;B.gOn.d=true;markDirty();
    this.className='bd-c'+(this.classList.contains('gs')?' gs':'')+' '+['','v1','v2','v3'][g.d[nm][s]];if(g.d[nm][s]&&!bandRunning()&&ensureAudio())trigPad(garPad(nm),g.d[nm][s]===2?1:g.d[nm][s]===3?0.38:0.78,ctx.currentTime);var c=$('[data-gon="d"]');if(c)c.setAttribute('aria-pressed','true');});
  on('#bdGrid [data-gb] [data-gs]','click',function(){var s=+this.getAttribute('data-gs'),i=BDEG.indexOf(g.b[s]);g.b[s]=BDEG[(i+1)%BDEG.length];B.gOn.b=true;markDirty();this.textContent=g.b[s];this.classList.toggle('v1',!!g.b[s]);var c=$('[data-gon="b"]');if(c)c.setAttribute('aria-pressed','true');
    if(g.b[s]&&g.b[s]!=='↗'&&!bandRunning()&&ensureAudio()){var ch=bandPart(B.edit)[B.sel],R=garBassRoot(ch,28+B.bReg*12),iv=bandTonesOf(ch),mm={R:0,'3':iv[1]||4,'5':iv[2]||7,'7':iv.length>3&&iv[3]<12?iv[3]:10,'8':12,'6':9}[g.b[s]];playNote(bandTrack('bass'),R+mm,0.8,ctx.currentTime+0.01,0.3);}});
  on('#bdGrid [data-gk] [data-gs]','click',function(){var s=+this.getAttribute('data-gs');g.k[s]=(g.k[s]+1)%3;B.gOn.k=true;markDirty();this.className='bd-c'+(this.classList.contains('gs')?' gs':'')+' '+['','v1','v2'][g.k[s]];var c=$('[data-gon="k"]');if(c)c.setAttribute('aria-pressed','true');});
  /* sounds */
  var snd=function(id,kind){$(id).addEventListener('change',function(){var v=this.value;if(!v)return;var ti=bandTrack(kind);if(ti!==selTrack)selectTrack(ti);loadStock(v);});};snd('#bdBSnd','bass');snd('#bdKSnd','keys');
  on('[data-bsong]','click',function(){bandToSong(+this.getAttribute('data-bsong'));});$('#bdJam').addEventListener('click',bandJam);}
function bandJam(){if(bandRunning())bandStop();var st=bandToSong(2);if(st===false||st==null)return;setPlayhead(st);garView('sounds');setTimeout(function(){toast('The band is in your song. Pick what you play, then press Record: it starts where the band starts.',3200);},120);}
function bandAudition(c){if(!c||!ensureAudio()||bandRunning())return;var cc=c[2]&&GAR.band.half?c[2]:[c[0],c[1]],kt=bandTrack('keys'),bt=bandTrack('bass'),t=ctx.currentTime+0.02;bandVoice(cc).forEach(function(m){playNote(kt,m,0.6,t,0.6);});if(bt>0&&bt!==kt)playNote(bt,garBassRoot(cc,28+GAR.band.bReg*12),0.7,t,0.6);}
function bandKeyChanged(ok,om){var B=GAR.band,d=GAR.key-ok,mi=!!(BMODE[B.mode]||{}).mi;
  ['A','B','C'].forEach(function(p){var P0=B.parts[p];if(!P0)return;var nk=GAR.key;GAR.key=ok;var savedMode=B.mode;B.mode=om?'aeolian':'ionian';var def=JSON.stringify(bandDef(p));GAR.key=nk;B.mode=savedMode;
    if(om!==GAR.minor&&JSON.stringify(P0)===def){B.parts[p]=null;return;}
    B.parts[p]=P0.map(function(c){var o=[(c[0]+d+12)%12,c[1]];if(c[2])o.push([(c[2][0]+d+12)%12,c[2][1]]);return o;});});
  if(mi!==GAR.minor)B.mode=GAR.minor?'aeolian':'ionian';markDirty();if(GAR.inst==='band'&&GAR.view==='play')garBand();}
function bandMigrate(d){var B=GAR.band;if(!d)return;Object.keys(d).forEach(function(k){if(k in B)B[k]=d[k];});B.parts=Object.assign({A:null,B:null,C:null},d.parts||{});B.pen=Object.assign({A:0.5,B:0.7,C:0.35},d.pen||{});
  if(d.energy!=null&&!d.pen){B.pen.A=d.energy;B.pen.B=Math.min(1,d.energy+0.15);}if(d.genre&&!d.dS&&BGEN[d.genre]){var G0=BGEN[d.genre];B.meter=G0.m;B.dS=G0.d;B.bS=G0.b;B.kS=G0.k;B.feel=G0.f;B.swing=G0.sw;}
  B.groove=d.groove||{};B.gOn=Object.assign({d:false,b:false,k:false},d.gOn||{});B.open=Object.assign({harm:true},d.open||{});if(!BMET[B.meter])B.meter='4/4';if(!BMODE[B.mode])B.mode='ionian';B.keyHint=null;B.tr=d.tr&&typeof d.tr==='object'?d.tr:null;bandTr();}
try{initVocal();}catch(e){errLog.push('vocal: '+e.message);}try{vmInit();}catch(e){errLog.push('vmorph: '+e.message);}setInterval(bandNowTick,60);
/* ---------- SHARE SHEET + RIPPLE REEL (design-v2 step 12): one place for every export (flow 06 + header share icon) and a 9:16 video of the song ---------- */
