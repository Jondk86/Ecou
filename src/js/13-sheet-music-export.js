var SKEYS=[['C',0,'major'],['G',1,'major'],['D',2,'major'],['A',3,'major'],['E',4,'major'],['B',5,'major'],['F#',6,'major'],['F',-1,'major'],['Bb',-2,'major'],['Eb',-3,'major'],['Ab',-4,'major'],['Db',-5,'major'],
  ['Am',0,'minor'],['Em',1,'minor'],['Bm',2,'minor'],['F#m',3,'minor'],['C#m',4,'minor'],['G#m',5,'minor'],['Dm',-1,'minor'],['Gm',-2,'minor'],['Cm',-3,'minor'],['Fm',-4,'minor'],['Bbm',-5,'minor'],['Ebm',-6,'minor']];
var KMAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],KMIN=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
var TONIC={C:0,'C#':1,Db:1,D:2,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,Bb:10,B:11};
var DRUMMAP=[['F',4,0,'Kick'],['C',5,0,'Snare'],['C',5,0,'Clap'],['C',5,1,'Rim'],['G',5,1,'Closed hat'],['G',5,1,'Open hat'],['F',5,1,'Shaker'],['A',5,1,'Cowbell'],['A',4,0,'Tom lo'],['D',5,0,'Tom mid'],['E',5,0,'Tom hi'],['A',5,1,'Crash'],['E',4,0,'808'],['B',5,1,'FX'],['B',5,1,'FX'],['B',5,1,'FX']];
var GMDRUM=[36,38,39,37,42,46,70,56,41,45,48,49,35,27,81,55],GMPROG=[0,11,52,38];
function collectSong(){
  /* when the song lives on the timeline (band parts, Studio clips), notate what plays there: every unmuted pattern clip on every track, as arrStep() plays it */
  var pc=daw.clips.filter(function(c){return c.type==='pat'&&!c.mute&&patterns[c.p]&&tracks[c.ti]&&tracks[c.ti].kind!=='audio';});
  if(stemSrc()==='arrange'&&pc.length){var T0={},D0=[],ks=KEYSI(),z=Math.floor(Math.min.apply(null,pc.map(function(c){return c.s;}))/16)*16,end=0;ks.forEach(function(k){T0[k]=[];});
    pc.forEach(function(c){var pt=patterns[c.p],L=pt.len,o=c.o||0,ce=c.s+c.l;end=Math.max(end,ce);
      for(var r=Math.floor(o/L)*L-o;c.s+r<ce;r+=L){var b=c.s+r;
        if(c.ti===0){pt.drums.forEach(function(a,pad){for(var s=0;s<L;s++){var g=b+s;if(a[s]&&g>=c.s&&g<ce)D0.push({s:g-z,pad:pad,v:typeof a[s]==='number'?a[s]:1});}});}
        else if(T0[c.ti])(pt.notes[c.ti]||[]).forEach(function(n){var s=Math.round(n.s);if(s>=L)return;var g=b+s;if(g<c.s||g>=ce)return;T0[c.ti].push({s:g-z,l:Math.min(Math.max(1,Math.round(n.l)),ce-g),m:n.m,v:n.v});});}});
    ks.forEach(function(k){T0[k].sort(function(a,b){return a.s-b.s;});});D0.sort(function(a,b){return a.s-b.s;});
    SECZ=z;return {total:Math.max(16,Math.ceil((end-z)/16)*16),keys:T0,drums:D0};}
  SECZ=null;var order=song.length?song:[curPat],off=0,T={},D=[];KEYSI().forEach(function(k){T[k]=[];});
  order.forEach(function(pi){var pt=patterns[pi];
    KEYSI().forEach(function(ti){(pt.notes[ti]||[]).forEach(function(n){var s=Math.round(n.s);if(s>=pt.len)return;var l=Math.min(Math.max(1,Math.round(n.l)),pt.len-s);T[ti].push({s:off+s,l:l,m:n.m,v:n.v});});});
    pt.drums.forEach(function(a,pad){for(var s=0;s<pt.len;s++)if(a[s])D.push({s:off+s,pad:pad,v:typeof a[s]==='number'?a[s]:1});});
    off+=pt.len;});
  return {total:off,keys:T,drums:D};
}
function detectKey(S){
  var h=new Array(12).fill(0),n=0;KEYSI().forEach(function(ti){S.keys[ti].forEach(function(x){h[x.m%12]+=x.l;n++;});});
  if(!n)return SKEYS[0];
  function corr(p,r){var a=0,b=0,mh=0,mp=0,i;for(i=0;i<12;i++){mh+=h[(i+r)%12];mp+=p[i];}mh/=12;mp/=12;var num=0,dh=0,dp=0;for(i=0;i<12;i++){var x=h[(i+r)%12]-mh,y=p[i]-mp;num+=x*y;dh+=x*x;dp+=y*y;}return num/Math.sqrt(dh*dp+1e-12);}
  var best=SKEYS[0],bv=-2;SKEYS.forEach(function(k){var name=k[0].replace('m',''),r=TONIC[k[2]==='minor'?name:k[0]],v=corr(k[2]==='minor'?KMIN:KMAJ,r);if(v>bv){bv=v;best=k;}});
  return best;
}
var SHARPN=[['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]],FLATN=[['C',0],['D',-1],['D',0],['E',-1],['E',0],['F',0],['G',-1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
var SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function spell(m,fifths){var t=(fifths<0?FLATN:SHARPN)[m%12],oct=Math.floor((m-t[1])/12)-1;return {step:t[0],alter:t[1],oct:oct};}
function sigAlter(step,f){var sh='FCGDAEB',fl='BEADGCF';if(f>0&&sh.slice(0,f).indexOf(step)>=0)return 1;if(f<0&&fl.slice(0,-f).indexOf(step)>=0)return -1;return 0;}
/* split a track into segments {s,d,notes|null,tieOut} on a 16th grid, bar = 16 */
function segments(list,total,isDrum){
  var by={};list.forEach(function(x){(by[x.s]=by[x.s]||[]).push(x);});
  var on=Object.keys(by).map(Number).sort(function(a,b){return a-b;}),seg=[],cur=0;
  on.forEach(function(s,k){
    if(s>cur)seg.push({s:cur,d:s-cur,notes:null});
    var nx=k+1<on.length?on[k+1]:total,grp=by[s],len=isDrum?Math.min(4,nx-s):Math.min(nx-s,Math.max.apply(null,grp.map(function(x){return x.l;})));
    seg.push({s:s,d:len,notes:grp});cur=s+len;
  });
  if(cur<total)seg.push({s:cur,d:total-cur,notes:null});
  var out=[];seg.forEach(function(g){var s=g.s,d=g.d;while(d>0){var be=(Math.floor(s/16)+1)*16,dd=Math.min(d,be-s);out.push({s:s,d:dd,notes:g.notes,tie:g.notes&&d>dd});s+=dd;d-=dd;}});
  return out;
}
var VALS=[16,12,8,6,4,3,2,1];
function pieces(d){var r=[];while(d>0){for(var i=0;i<VALS.length;i++){if(VALS[i]<=d){r.push(VALS[i]);d-=VALS[i];break;}}}return r;}
function buildScoreData(){
  if(SCOREX)return SCOREX();
  var S=collectSong(),key=$('#scoreKey').value==='auto'?detectKey(S):SKEYS[+$('#scoreKey').value],parts=[];
  KEYSI().forEach(function(ti){if(!S.keys[ti]||!S.keys[ti].length)return;var avg=S.keys[ti].reduce(function(a,x){return a+x.m;},0)/S.keys[ti].length;parts.push({ti:ti,name:tracks[ti].name,clef:avg<55?'bass':'treble',seg:segments(S.keys[ti],S.total,false)});});
  if($('#scoreDrums').checked&&S.drums.length)parts.push({ti:0,name:tracks[0].name,clef:'perc',drum:true,seg:segments(S.drums.map(function(x){return {s:x.s,l:1,pad:x.pad};}),S.total,true)});
  return {S:S,key:key,parts:parts,bars:Math.max(1,S.total/16)};
}
/* ABC (on-screen + PDF rendering) */
function abcPitch(p){var l=p.step;if(p.oct>=5){l=l.toLowerCase();for(var i=6;i<=p.oct;i++)l+="'";}else{for(var j=4;j>p.oct;j--)l+=',';}return l;}
function toABC(sd,bpl){bpl=bpl||4;
  var f=sd.key[1],k=sd.key[0],L=['X:1','T:'+((sd.title||project.name)||'Untitled').replace(/\n/g,' '),'C:Ecou','M:4/4','L:1/16','Q:1/4='+Math.round((sd.bpm||P.bpm.v)),'K:'+k],ids=[];
  var stv=[],secFV=-1;sd.parts.some(function(q,j){if(!q.drum){secFV=j;return true;}return false;});sd.parts.forEach(function(p,i){if(p.drum){ids.push('(D1 D2)');}else ids.push('V'+i);});
  L.push('%%score '+ids.join(' '));
  sd.parts.forEach(function(p,i){
    if(p.drum){
      L.push('V:D1 clef=perc stem=up name="'+p.name+'" sname="Dr."');L.push('K:C clef=perc');L.push(drumVoice(p,sd,true,bpl));
      L.push('V:D2 clef=perc stem=down');L.push('K:C clef=perc');L.push(drumVoice(p,sd,false,bpl));return;}
    L.push('V:V'+i+' clef='+p.clef+' name="'+p.name+'" sname="'+p.name.slice(0,4)+'."');
    var bar=-1,state={},out='';
    p.seg.forEach(function(g){
      var b=Math.floor(g.s/16);if(b!==bar){if(bar>=0)out+=' |'+((b%bpl===0)?'\n':' ');bar=b;state={};if(i===secFV)out+=secAbcMark(b);}
      var ps=pieces(g.d);
      ps.forEach(function(d,j){
        if(!g.notes){out+='z'+d+' ';return;}
        var tie=j<ps.length-1||g.tie,ns=g.notes.slice().sort(function(a,b){return a.m-b.m;}),str='';
        ns.forEach(function(n){var sp=spell(n.m,f),kk=sp.step+sp.oct,cur=state[kk]!=null?state[kk]:sigAlter(sp.step,f),acc='';if(sp.alter!==cur){acc=sp.alter===1?'^':sp.alter===-1?'_':'=';state[kk]=sp.alter;}str+=acc+abcPitch(sp);});
        out+=(ns.length>1?'['+str+']':str)+d+(tie?'-':'')+' ';
      });
    });
    L.push(out+' |]');
  });
  return L.join('\n');
}
function drumVoice(p,sd,up,bpl){bpl=bpl||4;
  var out='',bar=-1;
  p.seg.forEach(function(g){
    var b=Math.floor(g.s/16);if(b!==bar){if(bar>=0)out+=' |'+((b%bpl===0)?'\n':' ');bar=b;}
    var hits=g.notes?g.notes.filter(function(x){return !!DRUMMAP[x.pad][2]===up;}):[];
    pieces(g.d).forEach(function(d,j){
      if(!hits.length||j>0){out+=(up?'z':'x')+d+' ';return;}
      var seen={},str='';hits.forEach(function(x){var dm=DRUMMAP[x.pad],nm=abcPitch({step:dm[0],oct:dm[1]});if(seen[nm])return;seen[nm]=1;str+=(dm[2]?'!style=x!':'')+nm;});
      out+=(Object.keys(seen).length>1?'['+str+']':str)+d+' ';
    });
  });
  return out.replace(/x(\d+)/g,'z$1')+' |]';
}
/* MusicXML */
var XTYPE={16:['whole',0],12:['half',1],8:['half',0],6:['quarter',1],4:['quarter',0],3:['eighth',1],2:['eighth',0],1:['16th',0]};
function xesc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function toMusicXML(sd){
  var f=sd.key[1],mode=sd.key[2],x='<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0">\n';
  x+='<work><work-title>'+xesc((sd.title||project.name)||'Untitled')+'</work-title></work>\n<identification><encoding><software>Ecou</software></encoding></identification>\n<part-list>\n';
  sd.parts.forEach(function(p,i){x+='<score-part id="P'+(i+1)+'"><part-name>'+xesc(p.name)+'</part-name>'+(p.drum?'':'<midi-instrument id="P'+(i+1)+'-I1"><midi-channel>'+(i+1)+'</midi-channel><midi-program>'+(GMPROG[p.ti]+1)+'</midi-program></midi-instrument>')+'</score-part>\n';});
  x+='</part-list>\n';
  sd.parts.forEach(function(p,i){
    x+='<part id="P'+(i+1)+'">\n';var bar=-1;
    function open(b){x+='<measure number="'+(b+1)+'">';if(b===0){x+='<attributes><divisions>4</divisions><key><fifths>'+(p.drum?0:f)+'</fifths>'+(p.drum?'':'<mode>'+mode+'</mode>')+'</key><time><beats>4</beats><beat-type>4</beat-type></time><clef>'+(p.drum?'<sign>percussion</sign><line>2</line>':p.clef==='bass'?'<sign>F</sign><line>4</line>':'<sign>G</sign><line>2</line>')+'</clef></attributes>';
      if(i===0)x+='<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>'+Math.round((sd.bpm||P.bpm.v))+'</per-minute></metronome></direction-type><sound tempo="'+Math.round((sd.bpm||P.bpm.v))+'"/></direction>';}}
    var tieIn={};
    p.seg.forEach(function(g){
      var b=Math.floor(g.s/16);if(b!==bar){if(bar>=0)x+='</measure>\n';open(b);bar=b;}
      var ps=pieces(g.d);
      ps.forEach(function(d,j){
        var t=XTYPE[d],typ='<type>'+t[0]+'</type>'+(t[1]?'<dot/>':'');
        if(!g.notes){x+='<note><rest/><duration>'+d+'</duration>'+typ+'</note>';return;}
        var stop=j>0||(g.cont),start=j<ps.length-1||g.tie;
        var ns=p.drum?g.notes:g.notes.slice().sort(function(a,b){return a.m-b.m;}),seen={};
        ns.forEach(function(n,k){
          var pitch,head='';
          if(p.drum){var dm=DRUMMAP[n.pad],key2=dm[0]+dm[1];if(seen[key2])return;seen[key2]=1;pitch='<unpitched><display-step>'+dm[0]+'</display-step><display-octave>'+dm[1]+'</display-octave></unpitched>';head=dm[2]?'<notehead>x</notehead>':'';if(j>0)return;}
          else{var sp=spell(n.m,f);pitch='<pitch><step>'+sp.step+'</step>'+(sp.alter?'<alter>'+sp.alter+'</alter>':'')+'<octave>'+sp.oct+'</octave></pitch>';}
          var ties=(stop?'<tie type="stop"/>':'')+(start&&!p.drum?'<tie type="start"/>':''),tn=(stop?'<tied type="stop"/>':'')+(start&&!p.drum?'<tied type="start"/>':'');
          x+='<note>'+(Object.keys(seen).length>1||(!p.drum&&k>0)?'<chord/>':'')+pitch+'<duration>'+d+'</duration>'+(p.drum?'':ties)+typ+head+(!p.drum&&tn?'<notations>'+tn+'</notations>':'')+'</note>';
        });
        if(p.drum&&j>0)x+='<note><rest/><duration>'+d+'</duration>'+typ+'</note>';
      });
    });
    x+='</measure>\n</part>\n';
  });
  return x+'</score-partwise>\n';
}
function markTieContinuations(sd){sd.parts.forEach(function(p){for(var i=1;i<p.seg.length;i++){if(p.seg[i-1].tie&&p.seg[i].notes===p.seg[i-1].notes)p.seg[i].cont=true;}});}
/* MIDI (SMF type 1) */
function vlq(n){var b=[n&127];while(n>>=7)b.unshift((n&127)|128);return b;}
function midiTrack(events,name){var ev=[0,0xFF,0x03].concat(vlq(name.length));for(var i=0;i<name.length;i++)ev.push(name.charCodeAt(i)&127);
  events.sort(function(a,b){return a.t-b.t||a.o-b.o;});var last=0;events.forEach(function(e){ev=ev.concat(vlq(e.t-last),e.b);last=e.t;});ev=ev.concat([0,0xFF,0x2F,0]);
  return [0x4D,0x54,0x72,0x6B,(ev.length>>>24)&255,(ev.length>>>16)&255,(ev.length>>>8)&255,ev.length&255].concat(ev);}
function toMIDI(sd){
  var S=sd.S,TPQ=480,T16=120,trks=[],us=Math.round(60000000/(sd.bpm||P.bpm.v));
  trks.push(midiTrack([{t:0,o:0,b:[0xFF,0x51,3,(us>>16)&255,(us>>8)&255,us&255]},{t:0,o:0,b:[0xFF,0x58,4,4,2,24,8]},{t:0,o:0,b:[0xFF,0x59,2,sd.key[1]&255,sd.key[2]==='minor'?1:0]}],(sd.title||project.name)||'Ecou'));
  (sd.tis||KEYSI()).forEach(function(ti,c){if(!S.keys[ti]||!S.keys[ti].length)return;c=Math.min(c,8);var ev=[{t:0,o:0,b:[0xC0|c,(sd.prog&&sd.prog[ti]!=null?sd.prog[ti]:GMPROG[ti])||0]}];
    S.keys[ti].forEach(function(n){var v=Math.max(1,Math.min(127,Math.round(n.v*127)));ev.push({t:n.s*T16,o:2,b:[0x90|c,n.m,v]});ev.push({t:(n.s+n.l)*T16-1,o:1,b:[0x80|c,n.m,0]});});
    trks.push(midiTrack(ev,(sd.names&&sd.names[ti])||tracks[ti].name));});
  if(S.drums.length){var ev=[];S.drums.forEach(function(d){var nn=GMDRUM[d.pad];ev.push({t:d.s*T16,o:2,b:[0x99,nn,100]});ev.push({t:d.s*T16+T16-1,o:1,b:[0x89,nn,0]});});trks.push(midiTrack(ev,tracks[0].name));}
  var hd=[0x4D,0x54,0x68,0x64,0,0,0,6,0,1,0,trks.length,(TPQ>>8)&255,TPQ&255],all=hd;trks.forEach(function(t){all=all.concat(t);});
  return new Uint8Array(all);
}
/* rendering */
function renderScore(el,abc,opts){if(typeof ABCJS==='undefined'){el.innerHTML='<p style="color:#000;padding:16px">Notation engine failed to load.</p>';return null;}return ABCJS.renderAbc(el,abc,opts);}
function openScore(){
  var sd=buildScoreData();if(!sd.parts.length){toast('Nothing to notate yet — add notes or drum steps first.');return;}
  markTieContinuations(sd);
  $('#scoreKeyInfo').textContent='Key: '+sd.key[0]+(sd.key[2]==='minor'?'':' major')+($('#scoreKey').value==='auto'?' (detected)':'');
  $('#scoreOv').hidden=false;pushOverlay('score');setTimeout(function(){$('#scoreClose').focus();},50);var w=$('#scoreInner');
  var cw=$('#scorePaper').clientWidth||360,bpl=cw<600?2:4;
  SCVIS=renderScore(w,toABC(sd,bpl),{responsive:'resize',add_classes:true,paddingleft:6,paddingright:70,staffwidth:Math.max(380,Math.min(900,cw))});try{scFollowReady(sd);}catch(e){}
}
function svgToCanvas(svg,width){
  return new Promise(function(res,rej){
    var c=svg.cloneNode(true),vb=svg.viewBox&&svg.viewBox.baseVal,w=vb&&vb.width?vb.width:svg.getBoundingClientRect().width,h=vb&&vb.height?vb.height:svg.getBoundingClientRect().height;
    c.setAttribute('xmlns','http://www.w3.org/2000/svg');c.setAttribute('width',w);c.setAttribute('height',h);
    var data=new XMLSerializer().serializeToString(c),img=new Image(),url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml'}));
    img.onload=function(){var sc=width/w,cv=document.createElement('canvas');cv.width=Math.round(width);cv.height=Math.round(h*sc);var g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);res(cv);};
    img.onerror=function(){URL.revokeObjectURL(url);rej(new Error('svg'));};img.src=url;
  });
}
function jpegBytes(cv){return new Promise(function(res){cv.toBlob(function(b){b.arrayBuffer().then(function(ab){res(new Uint8Array(ab));});},'image/jpeg',0.92);});}
function buildPDF(pages){
  var objs=[],W=595.28,H=841.89;function add(s){objs.push(s);return objs.length;}
  var catalog=add(null),pagesId=add(null),kids=[];
  pages.forEach(function(p,i){
    var imgId=add({img:p.jpg,w:p.w,h:p.h}),cnt='q '+W+' 0 0 '+H+' 0 0 cm /Im'+i+' Do Q',cId=add({stream:cnt});
    kids.push(add('<< /Type /Page /Parent '+pagesId+' 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /XObject << /Im'+i+' '+imgId+' 0 R >> >> /Contents '+cId+' 0 R >>'));
  });
  objs[catalog-1]='<< /Type /Catalog /Pages '+pagesId+' 0 R >>';objs[pagesId-1]='<< /Type /Pages /Kids ['+kids.map(function(k){return k+' 0 R';}).join(' ')+'] /Count '+kids.length+' >>';
  var parts=[],len=0,offs=[];function push(x){var b=typeof x==='string'?u8(x):x;parts.push(b);len+=b.length;}
  push('%PDF-1.4\n%âã\n');
  objs.forEach(function(o,i){offs.push(len);push((i+1)+' 0 obj\n');
    if(typeof o==='string')push(o+'\n');
    else if(o.img){push('<< /Type /XObject /Subtype /Image /Width '+o.w+' /Height '+o.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+o.img.length+' >>\nstream\n');push(o.img);push('\nendstream\n');}
    else{push('<< /Length '+o.stream.length+' >>\nstream\n'+o.stream+'\nendstream\n');}
    push('endobj\n');});
  var xref=len,x='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';offs.forEach(function(o){x+=String(o).padStart(10,'0')+' 00000 n \n';});
  push(x+'trailer\n<< /Size '+(objs.length+1)+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}
function exportPDF(){
  var sd=buildScoreData();if(!sd.parts.length){toast('Nothing to notate yet — add notes or drum steps first.');return;}
  markTieContinuations(sd);var btn=$('#scorePdf');btn.disabled=true;btn.textContent='Rendering PDF…';
  var host=$('#scorePrint');host.innerHTML='';
  renderScore(host,toABC(sd,4),{oneSvgPerLine:true,staffwidth:700,paddingleft:10,paddingright:10,paddingtop:10,paddingbottom:10});
  var svgs=$$('#scorePrint svg'),PW=1240,PH=1754,M=80;
  var chain=Promise.resolve([]);
  svgs.forEach(function(svg){chain=chain.then(function(arr){return svgToCanvas(svg,PW-2*M).then(function(c){arr.push(c);return arr;});});});
  chain.then(function(cvs){
    var pages=[],pg=null,y=0;
    function newPage(){pg=document.createElement('canvas');pg.width=PW;pg.height=PH;var g=pg.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,PW,PH);g.fillStyle='#666';g.font='20px sans-serif';g.fillText(((sd.title||project.name)||'Untitled')+' · Ecou · page '+(pages.length+1),M,PH-40);pages.push(pg);y=M;}
    newPage();
    cvs.forEach(function(c){if(y+c.height>PH-M&&y>M)newPage();pg.getContext('2d').drawImage(c,M,y);y+=c.height+12;});
    return Promise.all(pages.map(jpegBytes)).then(function(jpgs){return buildPDF(jpgs.map(function(j){return {jpg:j,w:PW,h:PH};}));});
  }).then(function(pdf){host.innerHTML='';saveBlob(pdf,safeName((sd.title||project.name))+'-score.pdf','Score PDF exported.');})
  .catch(function(){toast('Couldn’t render the PDF in this browser.');})
  .then(function(){btn.disabled=false;btn.textContent='Export PDF';});
}
function exportNotation(){
  var sd=buildScoreData();if(!sd.parts.length){toast('Nothing to notate yet — add notes or drum steps first.');return;}
  markTieContinuations(sd);var base=safeName((sd.title||project.name));
  var files=[{name:base+'.musicxml',data:u8(toMusicXML(sd))},{name:base+'.mid',data:toMIDI(sd)},{name:base+'.abc',data:u8(toABC(sd))},
    {name:'README.txt',data:u8('Ecou notation export\n\n'+base+'.musicxml — open in MuseScore (free), Sibelius, Finale or Dorico to edit and print the score.\n'+base+'.mid — Standard MIDI file for any DAW (Logic, Ableton, FL Studio…). Drums are on channel 10 (General MIDI).\n'+base+'.abc — ABC notation text.\n\nKey: '+sd.key[0]+(sd.key[2]==='minor'?'':' major')+' · Tempo: '+Math.round((sd.bpm||P.bpm.v))+' BPM · Time: 4/4\nNotes are quantized to 1/16. Overlapping held notes inside one track are shortened to the next chord in the notation (the MIDI file keeps the original lengths).\n')}];
  saveBlob(zipFiles(files),base+'-notation.zip','MusicXML + MIDI exported.');
}
function saveBlob(blob,name,okMsg){
  if(window.claude&&typeof window.claude.use==='function'){window.claude.use('downloads').then(function(dl){if(!dl){toast('File export isn’t available in this view.');return;}return dl.save({filename:name,data:blob}).then(function(){toast(okMsg);}).catch(function(e){toast(e&&e.code==='declined'?'Export cancelled.':'Couldn’t export ('+((e&&e.code)||'error')+').');});});return;}
  var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);toast(okMsg);
}
function initScore(){
  $('#scoreKey').innerHTML='<option value="auto">Auto-detect</option>'+SKEYS.map(function(k,i){return '<option value="'+i+'">'+k[0]+(k[2]==='minor'?'':' major')+'</option>';}).join('');
  $('#scoreView').addEventListener('click',function(){SCOREX=null;openScore();});
  $('#scoreClose').addEventListener('click',function(){closeOverlay('score');});
  $('#scorePdf').addEventListener('click',function(){SCOREX=null;exportPDF();});$('#scorePdf2').addEventListener('click',exportPDF);
  $('#scoreXml').addEventListener('click',function(){SCOREX=null;exportNotation();});
}

/* ---------- FOUNDATION: offline render, levels, recorder ---------- */
