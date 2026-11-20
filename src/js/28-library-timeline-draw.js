var VOX_WORKLET='('+function(){
  class V extends AudioWorkletProcessor{
    constructor(){super();var sr=sampleRate;this.sr=sr;this.N=16384;this.K=this.N-1;this.x=new Float32Array(this.N);this.acc=new Float32Array(this.N);this.ws=new Float32Array(this.N);
      this.w=0;this.D=Math.round(sr*0.0125);this.Pmax=Math.floor(this.D*0.85);this.Pmin=Math.floor(sr/1100);this.U=Math.round(sr*0.005);
      this.W2=Math.round(sr*0.012);this.y=new Float32Array(2048);this.d=new Float32Array(1024);this.P=0;this.vo=false;this.lm=-1;this.M=[];this.MP=[];this.ts=-1;this.dF=0;this.r=1;this.T=null;this.cnt=0;
      this.amt=1;this.spd=0.015;this.pcs=[0,2,4,5,7,9,11];var me=this;this.port.onmessage=function(e){var d=e.data;if(d.amt!=null)me.amt=d.amt;if(d.spd!=null)me.spd=d.spd;if(d.pcs)me.pcs=d.pcs;if(d.vm!==undefined)me.setVm(d.vm);};this.fm=1;this.rg=1;this.jit=0;this.br=0;this.dbl=0;this.dly=0;this.bq=[];this.env=0;this.nzp=0;this.rs=12345;this.dl=new Float32Array(4096);this.dw=0;this.ph=0;this.on2=false;}
    setVm(c){this.on2=!!c;if(!c){this.fm=1;this.rg=1;this.jit=0;this.br=0;this.dbl=0;this.bq=[];return;}var sr=this.sr;this.fm=Math.pow(2,-(c.body||0)/12);this.rg=Math.pow(2,(c.reg||0)/12);this.jit=(c.gr||0)/100;this.br=(c.br||0)/100;this.dbl=(c.dbl||0)/100*0.55;this.dly=(c.dly||18)/1000*sr;
      var L=[[3000,0.7,c.bri||0],[500,1.2,-6*(c.nas||0)],[1000,1.4,5*(c.nas||0)]],bq=[];L.forEach(function(p){if(!p[2])return;var A=Math.pow(10,p[2]/40),w=2*Math.PI*p[0]/sr,cs=Math.cos(w),al=Math.sin(w)/(2*p[1]),a0=1+al/A;bq.push(new Float64Array([(1+al*A)/a0,-2*cs/a0,(1-al*A)/a0,-2*cs/a0,(1-al/A)/a0,0,0,0,0]));});this.bq=bq;}
    rnd(){this.rs=(this.rs*1664525+1013904223)>>>0;return this.rs/4294967296;}
    post(o){var n=o.length,i,q,b,dl=this.dl;for(i=0;i<n;i++){var v=o[i];for(q=0;q<this.bq.length;q++){b=this.bq[q];var y=b[0]*v+b[1]*b[5]+b[2]*b[6]-b[3]*b[7]-b[4]*b[8];b[6]=b[5];b[5]=v;b[8]=b[7];b[7]=y;v=y;}
      if(this.br){var a=Math.abs(v);this.env+=(a-this.env)*(a>this.env?0.02:0.0015);var z=this.rnd()*2-1,h=z-this.nzp;this.nzp=z;v+=this.br*0.5*this.env*h;}
      if(this.dbl){dl[this.dw&4095]=v;this.ph+=2*Math.PI*0.35/this.sr;var dd=this.dly*(1+0.12*Math.sin(this.ph)),p=this.dw-dd,p0=Math.floor(p),f=p-p0;v+=this.dbl*(dl[p0&4095]*(1-f)+dl[(p0+1)&4095]*f);this.dw++;}
      o[i]=v;}}
    detect(){var x=this.x,K=this.K,sr=this.sr,W=this.W2,maxL=Math.ceil(this.Pmax/2),minL=Math.max(2,Math.floor(this.Pmin/2)),n=W+maxL+2,a=this.w-2*n,y=this.y,d=this.d,i,t,e=0;
      if(a<0)return 0;for(i=0;i<n;i++){var p=x[(a+2*i)&K],q=x[(a+2*i+1)&K];y[i]=0.5*(p+q);e+=y[i]*y[i];}
      if(Math.sqrt(e/n)<0.003)return 0;var cum=0,tau=-1;d[0]=1;
      for(t=1;t<=maxL+1;t++){var s=0;for(i=0;i<W;i++){var u=y[i]-y[i+t];s+=u*u;}cum+=s;d[t]=cum>0?s*t/cum:1;}
      for(t=minL;t<=maxL;t++){if(d[t]<0.15){while(t+1<=maxL&&d[t+1]<d[t])t++;tau=t;break;}}if(tau<0)return 0;
      var den=d[tau-1]-2*d[tau]+d[tau+1],ft=tau+(den>0?0.5*(d[tau-1]-d[tau+1])/den:0),L0=Math.round(ft*2),Wf=W*2,c=this.w-Wf-L0-4,best=0,bv=1e30,dv=[];
      for(var L=L0-2;L<=L0+2;L++){var s3=0;for(i=0;i<Wf;i++){var u2=x[(c+i)&K]-x[(c+i+L)&K];s3+=u2*u2;}dv.push(s3);if(s3<bv){bv=s3;best=dv.length-1;}}
      var P=L0-2+best;if(best>0&&best<4){var dn=dv[best-1]-2*dv[best]+dv[best+1];if(dn>0)P+=0.5*(dv[best-1]-dv[best+1])/dn;}return P>=this.Pmin&&P<=this.Pmax?P:0;}
    retune(P,hop){if(!P){this.vo=false;this.dF*=0.6;this.T=null;}else{this.vo=true;this.P=P;var m=69+12*Math.log2(this.sr/P/440),pc=this.pcs,best=null,bd=99;
        for(var t=Math.floor(m)-6;t<=Math.ceil(m)+6;t++){if(pc.indexOf(((t%12)+12)%12)<0)continue;var dd=Math.abs(t-m);if(dd<bd){bd=dd;best=t;}}
        if(this.T!=null&&best!==this.T&&Math.abs(m-this.T)<bd+0.2)best=this.T;var first=this.T==null;this.T=best;var dl=best-m;
        if(first||this.spd<=0)this.dF=dl;else this.dF+=(dl-this.dF)*(1-Math.exp(-hop/this.sr/this.spd));}
      this.r=Math.pow(2,this.amt*this.dF/12);}
    process(ins,outs){var o=outs[0][0],n=o.length,x=this.x,K=this.K,inp=ins[0]&&ins[0][0],i;
      for(i=0;i<n;i++)x[(this.w+i)&K]=inp?inp[i]:0;this.w+=n;this.cnt+=n;if(this.cnt>=256){this.retune(this.detect(),this.cnt);this.cnt=0;}
      var P=this.vo?this.P:this.U;if(this.lm<0)this.lm=this.w-n;
      while(this.lm+P*1.2<=this.w){var nm=this.lm+P;if(this.vo){var a=Math.round(nm-0.15*P),b=Math.round(nm+0.15*P),bi=Math.round(nm),bv=-1e9;for(i=a;i<=b;i++){var v=x[i&K];if(v>bv){bv=v;bi=i;}}nm=bi;}
        nm=Math.round(nm);this.M.push(nm);this.MP.push(P);this.lm=nm;}
      var o0=this.w-n-this.D,acc=this.acc,ws=this.ws;if(this.ts<0)this.ts=o0;
      while(this.M.length>2&&this.M[1]<o0-2*this.Pmax){this.M.shift();this.MP.shift();}
      var guard=0;while(guard++<64){var ts=this.ts,j=-1,bd=1e9;for(i=0;i<this.M.length;i++){if(this.M[i]+this.MP[i]*Math.max(1,this.fm)>this.w)break;var dd=Math.abs(this.M[i]-ts);if(dd<bd){bd=dd;j=i;}}
        var Pm=j<0?this.U:this.MP[j],L=Math.max(8,Math.round(Pm));if(ts-L>=o0+n)break;var ma=j<0?Math.round(ts):this.M[j],t0=Math.floor(ts),fr=ts-t0,rr=j<0?1:this.r*(this.vo?this.rg:1),gg=this.jit&&j>=0?1+(this.rnd()-0.5)*this.jit*0.6:1;
        for(i=-L;i<=L;i++){var u=i-fr;if(u<=-L||u>=L)continue;var oi=t0+i;if(oi<o0)continue;var w=0.5+0.5*Math.cos(Math.PI*u/L),si=ma+u*this.fm,s0=Math.floor(si),f=si-s0;acc[oi&K]+=w*gg*(x[s0&K]*(1-f)+x[(s0+1)&K]*f);ws[oi&K]+=w;}
        this.ts+=Pm/rr*(this.jit&&j>=0?1+(this.rnd()-0.5)*this.jit*0.12:1);}
      for(i=0;i<n;i++){var k=(o0+i)&K;o[i]=ws[k]>1e-6?acc[k]/ws[k]:x[k];acc[k]=0;ws[k]=0;}if(this.on2)this.post(o);
      for(var c=1;c<outs[0].length;c++)outs[0][c].set(o);return true;}}
  registerProcessor('ecou-vox',V);}.toString()+')();';

/* loop library */
var LIB=null,libBpm=0,libPrev=null;
function rnd(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296*2-1;};}
function genLib(){
  var bpm=P.bpm.v,sd=60/bpm/4,sr=ctx.sampleRate;
  function mk(steps,fn){var n=Math.round(steps*sd*sr),b=ctx.createBuffer(2,n,sr),L=b.getChannelData(0),R=b.getChannelData(1);fn(L,R,n);var pk=0;for(var i=0;i<n;i++)pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i]));if(pk>0){var g=0.7/pk;for(var j=0;j<n;j++){L[j]*=g;R[j]*=g;}}var f=Math.min(n,Math.round(sr*0.004));for(var k=0;k<f;k++){var w=k/f;L[n-1-k]*=w;R[n-1-k]*=w;}return b;}
  function add(L,R,t0,dur,fn,pan){var i0=Math.round(t0*sr),n=Math.round(dur*sr),gl=Math.cos((pan==null?0:pan+1)*Math.PI/4),gr=Math.sin((pan==null?0:pan+1)*Math.PI/4);for(var i=0;i<n&&i0+i<L.length;i++){var v=fn(i/sr,i);L[i0+i]+=v*gl*1.41;R[i0+i]+=v*gr*1.41;}}
  var nz=rnd(7);
  function kick(L,R,t,a){var ph=0;add(L,R,t,0.45,function(x){ph+=2*Math.PI*(48+130*Math.exp(-x*32))/sr;return Math.tanh(1.6*Math.sin(ph))*Math.exp(-x*7)*(a||1);});}
  function snare(L,R,t,a){var p=0;add(L,R,t,0.3,function(x){p=nz()-0.6*p;return (p*0.55*Math.exp(-x*17)+Math.sin(2*Math.PI*185*x)*0.45*Math.exp(-x*28))*(a||1);});}
  function hat(L,R,t,a,open,pan){var p=0;add(L,R,t,open?0.4:0.07,function(x){var w=nz(),h=w-p;p=w;return h*0.35*Math.exp(-x*(open?9:55))*(a||1);},pan);}
  function clap(L,R,t,a){add(L,R,t,0.3,function(x){var e=0;[0,0.011,0.022].forEach(function(d){if(x>=d)e+=Math.exp(-(x-d)*(d===0.022?14:90));});return nz()*0.4*e*(a||1);});}
  function shk(L,R,t,a,pan){var p=0;add(L,R,t,0.09,function(x){var w=nz(),h=w-p;p=w;return h*0.25*Math.min(1,x/0.012)*Math.exp(-x*45)*(a||1);},pan);}
  function conga(L,R,t,f,a,pan){var ph=0;add(L,R,t,0.35,function(x){ph+=2*Math.PI*f*(1+0.4*Math.exp(-x*40))/sr;return Math.sin(ph)*Math.exp(-x*11)*(a||1);},pan);}
  function tone(L,R,t,dur,f,a,o){o=o||{};var ph=0,ph2=0;add(L,R,t,dur+(o.rel||0.15),function(x){var env=Math.min(1,x/(o.att||0.005))*(x>dur?Math.exp(-(x-dur)*(1/(o.rel||0.15))*3):1)*(o.dec?Math.exp(-x*o.dec):1);ph+=2*Math.PI*f/sr;ph2+=2*Math.PI*f*(o.ratio||1)/sr;var m=o.fm?o.fm*Math.exp(-x*3):0;var v=Math.sin(ph+m*Math.sin(ph2));if(o.sat)v=Math.tanh(v*o.sat)/Math.tanh(o.sat);return v*env*a;},o.pan);}
  function mf(m){return 440*Math.pow(2,(m-69)/12);}
  return [
    {name:'Boom Bap Kit',steps:32,cat:'Drums',fn:function(L,R){for(var b=0;b<2;b++){var o=b*16*sd;[0,7,10].forEach(function(s){kick(L,R,o+s*sd,s?0.8:1);});[4,12].forEach(function(s){snare(L,R,o+s*sd+0.012,1);});for(var s=0;s<16;s+=2)hat(L,R,o+s*sd+(s%4?sd*0.18:0),s%4?0.55:0.8,false,0.25);}}},
    {name:'Trap Hats',steps:16,cat:'Drums',fn:function(L,R){for(var s=0;s<16;s++){if(s===12){for(var r=0;r<3;r++)hat(L,R,(s+r/3)*sd,0.6,false,-0.2);continue;}if(s===13)continue;if(s>=14){for(var r2=0;r2<4;r2++)hat(L,R,(s+r2/4)*sd,0.45+r2*0.1,false,0.2);continue;}hat(L,R,s*sd,s%4===0?0.9:0.6,false,0);}}},
    {name:'House Groove',steps:16,cat:'Drums',fn:function(L,R){[0,4,8,12].forEach(function(s){kick(L,R,s*sd,1);});[4,12].forEach(function(s){clap(L,R,s*sd,0.9);});[2,6,10,14].forEach(function(s){hat(L,R,s*sd,0.55,true,0.15);});for(var s=1;s<16;s+=2)hat(L,R,s*sd,0.3,false,-0.3);}},
    {name:'Shaker',steps:16,cat:'Percussion',fn:function(L,R){for(var s=0;s<16;s++)shk(L,R,s*sd+(s%2?sd*0.12:0),s%2?0.6:1,0.3);}},
    {name:'Conga Groove',steps:16,cat:'Percussion',fn:function(L,R){[[0,196,1,-0.4],[3,196,0.7,-0.4],[6,262,0.9,0.4],[8,196,0.8,-0.4],[10,262,0.7,0.4],[11,262,0.6,0.4],[14,330,0.8,0.1]].forEach(function(h){conga(L,R,h[0]*sd,h[1],h[2],h[3]);});}},
    {name:'Sub Bass · C minor',steps:32,cat:'Bass',fn:function(L,R){[[0,3,36],[4,2,36],[7,1,39],[8,4,43],[14,2,41],[16,3,32],[20,2,32],[24,4,34],[30,2,39]].forEach(function(n){tone(L,R,n[0]*sd,n[1]*sd*0.92,mf(n[2]),0.9,{sat:2.2,rel:0.06});});}},
    {name:'Lo-fi Keys · Cm9 – Abmaj7',steps:32,cat:'Keys',fn:function(L,R){[[0,[48,51,55,58,62]],[16,[44,48,51,55,60]]].forEach(function(ch){ch[1].forEach(function(m,k){tone(L,R,ch[0]*sd+k*0.012,14*sd,mf(m),0.22,{fm:1.1,ratio:1,dec:0.9,rel:0.4,pan:(k-2)*0.2});});});var n=L.length;for(var i=0;i<n;i++){var tr=0.18*Math.sin(2*Math.PI*4.5*i/sr);L[i]*=1+tr;R[i]*=1-tr;}}},
    {name:'Air Pad · C minor',steps:32,cat:'Pads',fn:function(L,R){[48,55,58,63].forEach(function(m,k){[-7,7].forEach(function(dt,j){var f=mf(m)*Math.pow(2,dt/1200);add(L,R,0,32*sd,function(x){var s=0;for(var h=1;h<=10;h++)s+=Math.sin(2*Math.PI*f*h*x+h)/h*Math.pow(0.72,h);var env=Math.min(1,x/(6*sd))*Math.min(1,(32*sd-x)/(4*sd));return s*env*0.12;},j?0.7:-0.7);});});}},
    {name:'Pluck Arp · C minor',steps:16,cat:'Synth',fn:function(L,R){var seqn=[60,63,67,70,72,70,67,63,60,63,67,70,75,70,67,63];seqn.forEach(function(m,s){var f=mf(m),N0=Math.round(sr/f),buf=new Float32Array(N0),ns=rnd(m*31+s);for(var i=0;i<N0;i++)buf[i]=ns();var idx=0;add(L,R,s*sd,0.6,function(x,i){var a=buf[idx],b2=buf[(idx+1)%N0];var v=(a+b2)*0.5*0.996;buf[idx]=v;idx=(idx+1)%N0;return a*0.5*Math.exp(-x*3);},s%2?0.45:-0.45);});}},
    {name:'Riser FX',steps:32,cat:'FX',fn:function(L,R){var lp=0,lp2=0,dur=32*sd;add(L,R,0,dur,function(x){var k=x/dur,fc=200*Math.pow(40,k),a=1-Math.exp(-2*Math.PI*fc/sr);lp+=a*(nz()-lp);lp2+=a*(lp-lp2);return (lp2*0.8+Math.sin(2*Math.PI*(180+900*k*k)*x)*0.15)*Math.pow(k,1.5);});}}
  ].map(function(d){d.buf=mk(d.steps,d.fn);d.bpm=Math.round(bpm);return d;});
}
function openLib(){if(!ensureAudio())return;var el=$('#dawLib');if(!el.hidden){el.hidden=true;return;}
  if(!LIB||libBpm!==Math.round(P.bpm.v)){$('#dawLibList').innerHTML='<p class="note">Generating loops at '+Math.round(P.bpm.v)+' BPM…</p>';el.hidden=false;setTimeout(function(){LIB=genLib();libBpm=Math.round(P.bpm.v);renderLib();},30);}else{el.hidden=false;renderLib();}}
function renderLib(){
  $('#dawLibList').innerHTML=LIB.map(function(d,i){return '<div class="librow"><div><strong>'+d.name+'</strong><span class="mu">'+d.cat+' · '+(d.steps/16)+' bar'+(d.steps>16?'s':'')+' · '+d.bpm+' BPM</span></div><button class="mv" data-lpv="'+i+'" aria-label="Preview '+d.name+'">▶</button><button class="btn" data-ladd="'+i+'" style="min-height:40px">+ Add</button></div>';}).join('');
  $$('[data-lpv]').forEach(function(b){b.addEventListener('click',function(){var d=LIB[+b.getAttribute('data-lpv')];if(libPrev){try{libPrev.stop();}catch(e){}}libPrev=ctx.createBufferSource();libPrev.buffer=d.buf;var g=G(0.8);libPrev.connect(g);g.connect(N.post);libPrev.start();});});
  $$('[data-ladd]').forEach(function(b){b.addEventListener('click',function(){var d=LIB[+b.getAttribute('data-ladd')];
    placeName=d.name.split(' · ')[0].slice(0,16);var pl=placeAudio(Math.floor(daw.play/16)*16,d.steps),ti=pl.ti,s=pl.s;placeName=null;renderMixer();renderSpUI();if(ti<0)return;var c=newClip({type:'aud',ti:ti,s:s,off:0,dur:d.buf.duration,buf:abufAdd(d.buf),name:d.name,loop:true});daw.sel=c.id;daw.lane=ti;markDirty();renderInsp();renderDawHeads();dawNeed=true;toast('“'+d.name+'” added to '+tracks[ti].name+' at bar '+(s/16+1)+'. Drag its right edge to repeat it.',2600);});});
}
/* import audio file to a lane */
function importAudioToLane(file){if(!file||!ensureAudio())return;
  file.arrayBuffer().then(decodeAB).then(function(b){
    var max=ctx.sampleRate*360;if(b.length>max){var nb=ctx.createBuffer(b.numberOfChannels,max,b.sampleRate);for(var c=0;c<b.numberOfChannels;c++)nb.getChannelData(c).set(b.getChannelData(c).subarray(0,max));b=nb;toast('Trimmed to 6 minutes.');}
    if(b.numberOfChannels>2){var s2=ctx.createBuffer(2,b.length,b.sampleRate);s2.getChannelData(0).set(b.getChannelData(0));s2.getChannelData(1).set(b.getChannelData(1));b=s2;}
    var first=!daw.clips.some(function(c){return c.type==='aud';}),bpmD=b.duration>=4?detectBpm(b):0,tmsg='';
    if(first&&bpmD&&Math.abs(bpmD-P.bpm.v)>=1){if(SEC.list.length||(daw.tmap&&daw.tmap.length)){SEC.bpmSug={bpm:bpmD,name:(file.name||'Audio').replace(/\.[^.]+$/,'').slice(0,40)};tmsg=' It sounds like '+bpmD+' BPM; your song tempo is unchanged (Song › Sections offers to use it).';}else{setParam('bpm',bpmD);tmsg=' Tempo set to '+bpmD+' BPM to match it.';}}
    var s=dawSnap(daw.play),pl=placeAudio(s,b.duration/stepDur()),ti=pl.ti;s=pl.s;if(ti<0)return;seq.src='arrange';updTransportUI();
    var c=newClip({type:'aud',ti:ti,s:s,off:0,dur:b.duration,buf:abufAdd(b),imp:1,st:{f:'auto',b0:bpmD>0&&!/voc|voice|vox|sing|mic|lead|choir|rap|speech|talk/i.test(file.name||'')?bpmD:(daw.tmap&&daw.tmap.length?tmBpm(s):P.bpm.v),bd:bpmD||0,k0:tsKeyAt(s)},name:(file.name||'Audio').replace(/\.[^.]+$/,'').slice(0,40)});daw.sel=c.id;markDirty();renderInsp();dawNeed=true;
    toast('Imported '+dec(b.duration,1)+' s at bar '+(Math.floor(s/16)+1)+'.'+tmsg+(bpmD?'':' Set the project tempo to the beat’s BPM so pads and loops line up.'),4500);
  }).catch(function(){toast('That file couldn’t be decoded in this browser.');});
}
function songToTimeline(){
  var order=songOrder(),s=0,made=0;
  daw.clips=daw.clips.filter(function(c){return c.type!=='pat';});
  order.forEach(function(pi){var pt=patterns[pi];for(var ti=0;ti<tracks.length;ti++){if(tracks[ti].kind==='audio')continue;var has=ti===0?pt.drums.some(function(a){return a.slice(0,pt.len).some(Boolean);}):(pt.notes[ti]||[]).length>0;if(has){newClip({type:'pat',ti:ti,s:s,l:pt.len,p:pi,o:0});made++;}}s+=pt.len;});
  // merge consecutive identical pattern clips
  var merged=[];daw.clips.forEach(function(c){var m=null;if(c.type==='pat')for(var i=0;i<merged.length;i++){var x=merged[i];if(x.type==='pat'&&x.ti===c.ti&&x.p===c.p&&x.s+x.l===c.s&&(x.l%patterns[x.p].len)===0){m=x;break;}}if(m)m.l+=c.l;else merged.push(c);});daw.clips=merged;
  return made;
}
/* snapping */
function dawSnap(g,unit){var u=unit==null?daw.snap:unit;if(!u)return Math.max(0,Math.round(g*100)/100);return Math.max(0,Math.round(g/u)*u);}
function snapUnitFor(c){return c&&c.type==='pat'?Math.max(1,daw.snap||1):daw.snap;}
/* drawing */
var dcv,dg,dW=300,dH=200;
function peaksOf(b){var p=peakCache.get(b);if(p)return p;var n=Math.ceil(b.length/256),mx=new Float32Array(n),c0=b.getChannelData(0),c1=b.numberOfChannels>1?b.getChannelData(1):c0;for(var i=0;i<n;i++){var m=0;for(var j=i*256,e=Math.min(b.length,j+256);j<e;j++){var a=c0[j]<0?-c0[j]:c0[j];if(a>m)m=a;a=c1[j]<0?-c1[j]:c1[j];if(a>m)m=a;}mx[i]=m;}peakCache.set(b,mx);return mx;}
function sx2(g){return (g-daw.sx)*daw.ppx;}
function totalSteps(){return Math.max(arrEnd()+64,32*16,daw.loop.b+32,daw.play+64);}
function laneY(i){return DRH+i*DLH;}
var FXY=36,FXH=26;
function fxLaneOn(){return !!((daw.fx&&daw.fx.length)||(daw.fxf&&daw.fxf.length));}
function syncDRH(){var want=36+(fxLaneOn()?FXH:0);if(want!==DRH){DRH=want;var h=document.querySelector('#dawHeads .lhr');if(h)h.style.height=DRH+'px';resizeDaw();return true;}return false;}
function hexA(h,a){var n=parseInt(h.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
function resizeDaw(){if(!dcv)return;var r=dcv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;dW=Math.max(100,r.width);dH=DRH+tracks.length*DLH;dcv.style.height=dH+'px';dcv.width=Math.round(dW*dpr);dcv.height=Math.round(dH*dpr);dg.setTransform(dpr,0,0,dpr,0,0);dawNeed=true;}
function drawDaw(pos){
  if(!dg)return;syncDRH();var g=dg,W=dW,H=DRH+tracks.length*DLH,ppx=daw.ppx,sd=stepDur();
  if(Math.abs(H-dH)>0.5)resizeDaw();
  g.clearRect(0,0,W,H);g.fillStyle='#101018';g.fillRect(0,0,W,H);
  var g0=Math.max(0,Math.floor(daw.sx)),g1=Math.ceil(daw.sx+W/ppx)+1,barPx=16*ppx,every=barPx>=36?1:barPx>=18?2:barPx>=9?4:8;
  // lanes
  tracks.forEach(function(t,i){var y=laneY(i);g.fillStyle=i===daw.lane?'#181822':(i%2?'#121219':'#101016');g.fillRect(0,y,W,DLH);g.fillStyle='#2A2A36';g.fillRect(0,y+DLH-1,W,1);});
  // grid
  for(var s=g0-(g0%4);s<=g1;s+=4){var x=sx2(s);if(s%16===0){g.fillStyle=(s/16)%every===0?'#2E2E3C':'#22222D';g.fillRect(x,DRH,1,H-DRH);}else if(ppx*4>=10){g.fillStyle='#1C1C26';g.fillRect(x,DRH,1,H-DRH);}}
  // loop region
  if(daw.loop.on||daw.loop.b>daw.loop.a){var lx=sx2(daw.loop.a),lw=(daw.loop.b-daw.loop.a)*ppx;g.fillStyle=daw.loop.on?'rgba(212,255,58,.07)':'rgba(255,255,255,.025)';g.fillRect(lx,DRH,lw,H-DRH);}
  // clips
  daw.clips.forEach(function(c){var x0=sx2(c.s),w=clipLen(c)*ppx,y=laneY(c.ti)+4,h=DLH-9;if(x0>W||x0+w<0||!tracks[c.ti])return;
    var col=DAWCOL[c.ti%DAWCOL.length],sel=c.id===daw.sel;
    g.globalAlpha=c.mute?0.35:1;g.fillStyle=hexA(col,0.22);rr(g,x0,y,Math.max(2,w),h,6);g.fill();
    g.save();g.beginPath();g.rect(Math.max(0,x0),y,Math.min(W,x0+w)-Math.max(0,x0),h);g.clip();
    g.fillStyle=hexA(col,0.9);g.font='700 11px Inter, system-ui, sans-serif';g.fillText(clipName(c)+(c.type==='aud'&&c.takes&&c.takes.length>1?'  ·  take '+(c.takes.indexOf(c.buf)+1)+'/'+c.takes.length:'')+(c.loop?'  ↻':''),Math.max(x0,0)+6,y+13);
    if(c.type==='pat')drawPatClip(g,c,x0,y+17,w,h-20,col);else drawAudClip(g,c,x0,y+17,w,h-20,col);
    g.restore();
    g.lineWidth=sel?2:1;g.strokeStyle=sel?'#F4F4F7':hexA(col,0.75);rr(g,x0+0.5,y+0.5,Math.max(2,w)-1,h-1,6);g.stroke();
    if(sel&&daw.auto==='off'){g.fillStyle='#F4F4F7';g.fillRect(x0+2,y+h/2-9,3,18);g.fillRect(x0+w-5,y+h/2-9,3,18);}
    g.globalAlpha=1;
  });
  if(arr.rec)drawRecLive(g);
  // automation overlay
  if(daw.auto!=='off'){var k=daw.auto,A=AUTOP[k];tracks.forEach(function(t,i){var y=laneY(i),top=y+8,hh=DLH-16,col=DAWCOL[i%DAWCOL.length];function yv(v){return top+(1-(v-A.min)/(A.max-A.min))*hh;}
    g.fillStyle='rgba(11,11,16,.45)';g.fillRect(0,y,W,DLH-1);
    if(!hasAuto(t,k)){g.setLineDash([4,4]);g.strokeStyle=hexA(col,0.6);g.beginPath();var vy=yv(k==='cut'?1:autoBase(t,k));g.moveTo(0,vy);g.lineTo(W,vy);g.stroke();g.setLineDash([]);return;}
    var a=t.auto[k];g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(0,yv(a[0].v));a.forEach(function(p){g.lineTo(sx2(p.s),yv(p.v));});g.lineTo(W,yv(a[a.length-1].v));g.stroke();g.lineWidth=1;
    a.forEach(function(p,j){var px=sx2(p.s);if(px<-8||px>W+8)return;g.fillStyle=(dp&&dp.apt===p)?'#F4F4F7':col;g.beginPath();g.arc(px,yv(p.v),(dp&&dp.apt===p)?7:5,0,Math.PI*2);g.fill();});
    if(dp&&dp.apt&&dp.ti===i){g.fillStyle='#F4F4F7';g.font='700 11px Inter, system-ui, sans-serif';var lx=clamp(sx2(dp.apt.s)+10,4,W-70);g.fillText(fmtAuto(k,dp.apt.v),lx,Math.max(y+12,yv(dp.apt.v)-8));}
  });}
  // ruler
  g.fillStyle='#17171F';g.fillRect(0,0,W,DRH);g.fillStyle='#2A2A36';g.fillRect(0,DRH-1,W,1);g.fillStyle='#1E1E28';g.fillRect(0,0,W,11);
  if(daw.loop.b>daw.loop.a){g.fillStyle=daw.loop.on?'rgba(212,255,58,.55)':'rgba(163,163,178,.3)';g.fillRect(sx2(daw.loop.a),FXY-8,(daw.loop.b-daw.loop.a)*ppx,6);}
  g.font='600 10px Inter, system-ui, sans-serif';
  for(var b=Math.floor(g0/16);b*16<=g1;b++){var bx=sx2(b*16);if(b%every===0){g.fillStyle='#A3A3B2';g.fillRect(bx,12,1,FXY-13);g.fillText(String(b+1),bx+3,22);}}
  if(fxLaneOn()){var ly=FXY,lh=FXH-2;g.fillStyle='#13131B';g.fillRect(0,ly,W,lh+1);
    if(daw.fx&&daw.fx.length){g.font='700 10px Inter, system-ui, sans-serif';daw.fx.forEach(function(e,i){var x0=sx2(e.s),x1=sx2(e.e);if(x1<0||x0>W)return;var sel=i===daw.fxSel;g.fillStyle=sel?'#FFB08F':'rgba(255,138,91,.85)';rr(g,x0,ly+3,Math.max(4,x1-x0),lh-6,4);g.fill();if(sel){g.strokeStyle='#F4F4F7';g.lineWidth=2;rr(g,x0,ly+3,Math.max(4,x1-x0),lh-6,4);g.stroke();g.lineWidth=1;}
      if(x1-x0>22){g.save();g.beginPath();g.rect(x0,ly,x1-x0,lh);g.clip();g.fillStyle='#14090A';g.fillText(fxName(e.id),Math.max(x0,0)+4,ly+lh/2+4);g.restore();}});}
    if(daw.fxf&&daw.fxf.length){g.strokeStyle='#5CE1E6';g.lineWidth=2;g.beginPath();var fy=function(v){return ly+lh/2-v*(lh/2-3);};g.moveTo(0,fy(0));var pv=0;daw.fxf.forEach(function(e){var x=sx2(e.s);g.lineTo(x,fy(pv));g.lineTo(x,fy(e.v));pv=e.v;});g.lineTo(W,fy(pv));g.stroke();g.lineWidth=1;}}
  daw.markers.forEach(function(m,i){var mx=sx2(m.s);if(mx<-80||mx>W)return;g.fillStyle=i===daw.msel?'#F4F4F7':'#FF8A5B';g.beginPath();g.moveTo(mx,0);g.lineTo(mx+7,0);g.lineTo(mx,7);g.fill();g.fillRect(mx,0,1,H);g.font='700 10px Inter, system-ui, sans-serif';var nx=daw.markers[i+1]?sx2(daw.markers[i+1].s):1e9,room=nx-mx-12,txt=m.name;while(txt.length>1&&g.measureText(txt).width>room)txt=txt.slice(0,-1);if(room>8)g.fillText(txt+(txt!==m.name?'…':''),mx+9,9);});
  secRuler(g,sx2,W);
  // playhead
  var ph=pos!=null?pos:daw.play;if(ph>=0){var px=sx2(ph);g.fillStyle='#5CE1E6';g.fillRect(px-1,0,2,H);g.beginPath();g.moveTo(px-6,DRH-12);g.lineTo(px+6,DRH-12);g.lineTo(px,DRH-4);g.fill();}
}
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function drawPatClip(g,c,x0,y,w,h,col){
  var pt=patterns[c.p];if(!pt)return;if(c.gen)secClipMark(g,c,x0,y,w,h);var ppx=daw.ppx,o=c.o||0;g.fillStyle=hexA(col,0.85);
  for(var k=0;k*pt.len-o<c.l;k++){var bx=x0+(k*pt.len-o)*ppx;if(k>0){g.fillStyle=hexA(col,0.35);g.fillRect(bx,y-2,1,h+2);g.fillStyle=hexA(col,0.85);}}
  if(c.ti===0){for(var s=0;s<c.l;s++){var ps=(s+o)%pt.len,x=x0+s*ppx;if(x<-4||x>dW+4)continue;for(var i=0;i<16;i++){var dv=pt.drums[i][ps];if(dv)g.fillRect(x,y+(i/16)*h,Math.max(1.5,ppx*0.7),Math.max(1.5,h/18));}}}
  else{var ns=pt.notes[c.ti]||[];if(!ns.length)return;var lo=127,hi=0;ns.forEach(function(n){lo=Math.min(lo,n.m);hi=Math.max(hi,n.m);});var span=Math.max(12,hi-lo+1);
    for(var k2=0;k2*pt.len-o<c.l;k2++){ns.forEach(function(n){var st=k2*pt.len+n.s-o;if(st<0||st>=c.l)return;var x=x0+st*ppx,len=Math.min(n.l,c.l-st)*ppx;if(x>dW||x+len<0)return;g.fillRect(x,y+h-((n.m-lo+1)/span)*h,Math.max(1.5,len-1),Math.max(2,h/span));});}}
}
function drawAudClip(g,c,x0,y,w,h,col){
  var b=abuf[c.buf];if(!b)return;var pk=peaksOf(b),sr=b.sampleRate,sd=tsActive(c)?tsSrcSd(c):stepDur(),ppx=daw.ppx,mid=y+h/2,amp=dbg(c.gain||0);
  var xa=Math.max(0,Math.floor(x0)),xb=Math.min(dW,Math.ceil(x0+w));g.fillStyle=hexA(col,0.8);
  for(var x=xa;x<xb;x++){var t0=(x-x0)/ppx*sd,t1=(x+1-x0)/ppx*sd;var a=c.off+t0,bb=c.off+t1;if(c.loop){a=((a%b.duration)+b.duration)%b.duration;bb=a+(t1-t0);}if(a>=b.duration)break;
    var i0=Math.floor(a*sr/256),i1=Math.max(i0+1,Math.ceil(bb*sr/256)),m=0;for(var i=i0;i<i1&&i<pk.length;i++)if(pk[i]>m)m=pk[i];
    var env=1;if(t0<c.fi)env=t0/Math.max(1e-6,c.fi);if(c.dur-t0<c.fo)env=Math.min(env,(c.dur-t0)/Math.max(1e-6,c.fo));
    var hh=Math.min(1,m*amp*env)*h/2;g.fillRect(x,mid-hh,1,Math.max(1,hh*2));}
  if(c.loop&&b.duration<c.dur){g.fillStyle=hexA(col,0.5);for(var r=b.duration-c.off;r<c.dur;r+=b.duration){var rx=x0+r/sd*ppx;if(r>0&&rx>0&&rx<dW)g.fillRect(rx,y-2,1,h+2);}}
  // fades
  g.strokeStyle='#F4F4F7';g.lineWidth=1;g.beginPath();var fx=x0+c.fi/sd*ppx,ox=x0+w-c.fo/sd*ppx;g.moveTo(x0,y+h);g.lineTo(fx,y-12);g.moveTo(ox,y-12);g.lineTo(x0+w,y+h);g.stroke();
  if(c.id===daw.sel){g.fillStyle='#F4F4F7';g.fillRect(fx-4,y-16,8,8);g.fillRect(ox-4,y-16,8,8);}
}
/* headers */
function renderDawHeads(){
  var w=$('#dawHeads');if(!w)return;
  w.innerHTML='<div class="lhr" style="gap:4px"><button class="mv" id="dawAddTrk" aria-label="Add audio track" style="width:auto;padding:0 6px;height:28px;font-size:11px">+ Audio</button><button class="mv" id="dawAddInst" aria-label="Add instrument track" style="width:auto;padding:0 6px;height:28px;font-size:11px">+ Inst</button></div>'+tracks.map(function(t,i){var col=DAWCOL[i%DAWCOL.length];return '<div class="lh'+(i===daw.lane?' sel':'')+'" style="--c:'+col+'"><button class="ln" data-lane="'+i+'">'+t.name+'</button><div class="lb">'+
    '<button data-lm="'+i+'" aria-pressed="'+t.mute+'" aria-label="Mute '+t.name+'">M</button><button data-ls="'+i+'" aria-pressed="'+t.solo+'" aria-label="Solo '+t.name+'">S</button>'+
    '<button class="mx-adv alA" data-lal="'+i+'" aria-pressed="'+alHas(i)+'" aria-label="Automation lanes for '+t.name+'">A</button>'+(t.kind==='audio'?'<button class="arm" data-la="'+i+'" aria-pressed="'+!!t.arm+'" aria-label="Arm '+t.name+' for recording">●</button>':'<span class="kind">'+(t.kind==='drums'?'pads':'inst')+'</span>')+'</div></div>';}).join('');
  $('#dawAddInst').addEventListener('click',function(){ensureAudio();addInstTrack();renderInsp();});
  $('#dawAddTrk').addEventListener('click',function(){ensureAudio();var i=addAudioTrack();if(i>=0){renderInsp();toast('Audio track added. Arm ● it and press Record, or add a loop.',2400);}});
  $$('[data-lane]').forEach(function(b){b.addEventListener('click',function(){daw.lane=+b.getAttribute('data-lane');daw.sel=null;renderDawHeads();renderInsp();dawNeed=true;});});
  $$('[data-lm]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-lm')];t.mute=!t.mute;ensureAudio();applyMix();renderMixer();renderDawHeads();markDirty();});});
  $$('[data-ls]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-ls')];t.solo=!t.solo;ensureAudio();applyMix();renderMixer();renderDawHeads();markDirty();});});
  $$('[data-la]').forEach(function(b){b.addEventListener('click',function(){var t=tracks[+b.getAttribute('data-la')];t.arm=!t.arm;renderDawHeads();});});
  resizeDaw();
}
/* inspector */
function renderInsp(){
  var el=$('#dawInsp');if(!el)return;var c=selClip(),sd=stepDur();
  function pos(g){return 'bar '+(Math.floor(g/16)+1)+'.'+(Math.floor((g%16)/4)+1);}
  var fs=!c&&daw.fxSel!=null&&daw.fx?daw.fx[daw.fxSel]:null;
  if(fs){el.innerHTML='<div class="row"><span class="kicker">Punch-in FX</span><span class="mu">'+pos(fs.s)+' → '+pos(fs.e)+'</span></div>'+
      '<label class="ctl"><span class="row"><span>Effect</span></span><select id="fsId" aria-label="Effect">'+PFX.map(function(x){return '<option value="'+x.id+'"'+(x.id===fs.id?' selected':'')+'>'+x.name+'</option>';}).join('')+'</select></label>'+
      (fs.id==='tape'||fs.id==='tapestart'?'<label class="ctl"><span class="row"><span>'+(fs.id==='tape'?'Stop':'Start')+' length</span><output id="fsAo">'+Math.round((fs.a||1)*100)+'%</output></span><input type="range" id="fsA" min="0.5" max="1.5" step="0.01" value="'+(fs.a||1)+'" aria-label="Tape stop length"></label>':'')+
      '<div class="row" style="gap:6px"><span class="mu">Length</span><button class="mv" id="fsS" aria-label="Shorter by a beat">−</button><strong id="fsL">'+dec((fs.e-fs.s)/4,2)+' beats</strong><button class="mv" id="fsLg" aria-label="Longer by a beat">+</button></div><div class="btn3"><button class="btn" id="fsDup">Duplicate →</button><button class="btn" id="fsDel">Delete</button><button class="btn" id="fsDone">Done</button></div><p class="note">Drag the block to move it, drag its edges to change the length.</p>';
    $('#fsId').addEventListener('change',function(e){fs.id=e.target.value;fxOffAll();markDirty();dawNeed=true;renderInsp();});
    if($('#fsA'))$('#fsA').addEventListener('input',function(e){fs.a=+e.target.value;$('#fsAo').textContent=Math.round(fs.a*100)+'%';markDirty();});
    $('#fsS').addEventListener('click',function(){fs.e=Math.max(fs.s+1,fs.e-4);markDirty();renderInsp();dawNeed=true;});$('#fsLg').addEventListener('click',function(){fs.e+=4;markDirty();renderInsp();dawNeed=true;});
    $('#fsDup').addEventListener('click',function(){var L=fs.e-fs.s,n={id:fs.id,a:fs.a,s:fs.e,e:fs.e+L};daw.fx.push(n);daw.fx.sort(function(a,b){return a.s-b.s;});daw.fxSel=daw.fx.indexOf(n);markDirty();renderInsp();dawNeed=true;});
    $('#fsDel').addEventListener('click',function(){daw.fx.splice(daw.fxSel,1);daw.fxSel=null;fxOffAll();markDirty();renderInsp();dawNeed=true;});
    $('#fsDone').addEventListener('click',function(){daw.fxSel=null;renderInsp();dawNeed=true;});return;}
  if(c){
    var h='<div class="row"><span class="kicker">Clip</span><span class="mu">'+pos(c.s)+' · '+(c.type==='pat'?(c.l/16)+' bar'+(c.l===16?'':'s'):dec(c.dur,2)+' s')+'</span></div><strong>'+clipName(c)+' <span class="mu">on '+tracks[c.ti].name+'</span></strong>'+
      '<div class="btn3"><button class="btn" id="ciSplit">Split at playhead</button><button class="btn" id="ciDup">Duplicate</button><button class="btn" id="ciDel">Delete</button></div>'+
      '<div class="btn3"><button class="btn" id="ciR2">Repeat ×2</button><button class="btn" id="ciR4">Repeat ×4</button><button class="btn" id="ciREnd">Repeat to end</button></div>'+
      (c.tx?'<button class="btn" id="ciFrz">Freeze auto clip (make it mine)</button>':c.gen?'<p class="note" style="margin:0">Made by Song › Sections'+(c.user?' · yours now (edited or frozen), rebuilding leaves it alone':' · auto, rewritten when sections change')+'</p>':'')+'<div class="btn3"><button class="btn" id="ciCopy">Copy</button><button class="btn" id="ciPaste">Paste</button><button class="btn" id="ciMute" aria-pressed="'+!!c.mute+'">'+(c.mute?'Unmute':'Mute')+'</button></div>';
    if(c.type==='pat'){h+='<div class="row"><span class="mu">Pattern</span><div class="chips" id="ciPat">'+PATN.split('').map(function(n,i){return '<button data-cp="'+i+'" aria-pressed="'+(i===c.p)+'"'+(patHas(patterns[i])?' class="has"':'')+'>'+n+'</button>';}).join('')+'</div></div><button class="btn" id="ciEdit">Edit pattern '+PATN[c.p]+(c.ti===0?' in Pads':' in Song')+'</button>';}
    else{var b=abuf[c.buf],maxF=Math.max(0.01,Math.min(4,c.dur/2));
      h+='<div class="grid2"><label class="ctl"><span class="row"><span>Clip gain</span><output id="ciGo">'+dec(c.gain||0,1)+' dB</output></span><input type="range" id="ciGain" min="-24" max="12" step="0.1" value="'+(c.gain||0)+'"></label>'+
        '<label class="chk" style="justify-content:space-between"><span>Loop ↻ (repeat when extended)</span><input type="checkbox" id="ciLoop"'+(c.loop?' checked':'')+'></label>'+
        '<label class="ctl"><span class="row"><span>Fade in</span><output id="ciFio">'+dec(c.fi,2)+' s</output></span><input type="range" id="ciFi" min="0" max="'+maxF+'" step="0.005" value="'+Math.min(c.fi,maxF)+'"></label>'+
        '<label class="ctl"><span class="row"><span>Fade out</span><output id="ciFoo">'+dec(c.fo,2)+' s</output></span><input type="range" id="ciFo" min="0" max="'+maxF+'" step="0.005" value="'+Math.min(c.fo,maxF)+'"></label></div>';
      if(c.takes&&c.takes.length>1)h+='<div class="row"><span class="mu">Takes</span><div class="row" style="gap:6px"><button class="mv" id="ciTp" aria-label="Previous take">◀</button><strong>'+(c.takes.indexOf(c.buf)+1)+' / '+c.takes.length+'</strong><button class="mv" id="ciTn" aria-label="Next take">▶</button><button class="btn" id="ciTk" style="min-height:36px;font-size:13px">Keep only this</button></div></div>';
      h+='<div class="btn3"><button class="btn" id="ciNorm">Normalize</button><button class="btn" id="ciRev">Reverse</button><button class="btn" id="ciLoopSel">Loop this</button></div>'+vtInspRow(c)+tsInspRow(c)+(b?'<p class="note">Source '+dec(b.duration,2)+' s · '+(b.numberOfChannels>1?'stereo':'mono')+' · '+Math.round(b.sampleRate/100)/10+' kHz</p>':'');}
    el.innerHTML=h;bindInsp(c);return;
  }
  var t=tracks[daw.lane]||tracks[0],ti=tracks.indexOf(t),k=daw.auto;
  var h2='<div class="row"><span class="kicker">Track</span><span class="mu">'+(t.kind==='audio'?'audio':t.kind==='drums'?'drum pads':'instrument')+'</span></div>'+
    '<input id="tiName" type="text" value="'+t.name.replace(/"/g,'&quot;')+'" aria-label="Track name" class="tin">';
  if(t.kind==='audio')h2+='<div class="row"><span class="mu">Input</span><div class="seg" id="tiIn" role="group" aria-label="Recording input">'+[['L','In 1 (L)'],['R','In 2 (R)'],['LR','Stereo']].map(function(o){return '<button data-tin="'+o[0]+'" aria-pressed="'+((t.inCh||'L')===o[0])+'">'+o[1]+'</button>';}).join('')+'</div></div>';
  else h2+='<button class="btn" id="tiAddPat">+ Pattern '+PATN[curPat]+' at playhead</button>';
  if(k!=='off')h2+='<button class="btn" id="tiClrAuto">Clear '+AUTOP[k].label.toLowerCase()+' automation</button>';
  else h2+='<p class="note">Pick a parameter under Automation to draw it on every track: tap to add a point, drag to move it, double-tap to delete.</p>';
  if((daw.fx&&daw.fx.length)||(daw.fxf&&daw.fxf.length)){h2+='<div class="fxl"><div class="row"><span class="kicker">Recorded punch-in FX</span><span class="mu">tap a row to jump</span></div>'+(daw.fx||[]).map(function(x,i){return '<div class="row fxr"><button class="lnk" data-fxgo="'+i+'">'+fxName(x.id)+' · bar '+fxBar(x.s)+' → '+fxBar(x.e)+'</button><button class="mv" data-fxdel="'+i+'" aria-label="Delete this punch-in">✕</button></div>';}).join('')+
    ((daw.fxf&&daw.fxf.length)?'<div class="row fxr"><button class="lnk" data-fxgo="f">Filter fader moves ('+daw.fxf.length+' points, bar '+fxBar(daw.fxf[0].s)+' → '+fxBar(daw.fxf[daw.fxf.length-1].s)+')</button><button class="mv" data-fxdel="f" aria-label="Delete filter fader moves">✕</button></div>':'')+
    '<button class="btn" id="tiClrFx">Clear all recorded punch-ins</button></div>';}
  var hasR=daw.loop.b>daw.loop.a+1;h2+='<div class="fxl"><div class="row"><span class="kicker">Range</span><div class="row" style="gap:6px"><span class="mu">bars</span><input type="number" id="rgA" min="1" class="nin" value="'+(Math.floor(daw.loop.a/16)+1)+'" aria-label="Range start bar"><span class="mu">to</span><input type="number" id="rgB" min="1" class="nin" value="'+Math.max(1,Math.ceil(daw.loop.b/16))+'" aria-label="Range end bar (inclusive)"></div></div>';
  if(hasR)h2+='<div class="row"><span class="kicker">Section gain</span><span class="mu">bar '+fxBar(daw.loop.a)+' → '+fxBar(daw.loop.b)+'</span></div><label class="ctl"><span class="row"><span>Change</span><output id="sgO">'+(secDb>0?'+':'')+dec(secDb,1)+' dB</output></span><input type="range" id="sgDb" min="-12" max="6" step="0.5" value="'+secDb+'" aria-label="Section gain"></label><div class="btn3"><button class="btn" id="sgOne">This track</button><button class="btn" id="sgAll">All tracks</button></div><p class="note">Writes volume automation with short ramps (undo with ↶). Type bars above or drag the ruler.</p>';h2+='</div>';
  if(t.kind!=='audio')h2+='<button class="btn" id="tiBounce">Bounce to audio</button>';
  if(t.kind==='audio'||ti>=4)h2+='<button class="btn" id="tiDel">Delete track</button>';
  h2+='<p class="note">Tap a clip to edit it. Double-tap an empty instrument lane to add the current pattern. Drag the ruler to set the loop.</p>';
  el.innerHTML=h2;
  $('#tiName').addEventListener('change',function(e){var v=e.target.value.trim().slice(0,24);if(v){t.name=v;renderDawHeads();renderMixer();renderSpUI();markDirty();}});
  $$('[data-tin]').forEach(function(b){b.addEventListener('click',function(){t.inCh=b.getAttribute('data-tin');renderInsp();markDirty();});});
  if($('#tiAddPat'))$('#tiAddPat').addEventListener('click',function(){var pt=patterns[curPat],s=dawSnap(daw.play,Math.max(1,daw.snap||1)),c=newClip({type:'pat',ti:ti,s:s,l:pt.len,p:curPat,o:0});daw.sel=c.id;markDirty();renderInsp();dawNeed=true;});
  if($('#tiClrAuto'))$('#tiClrAuto').addEventListener('click',function(){if(t.auto)delete t.auto[k];applyMix();autoPreview();markDirty();renderInsp();dawNeed=true;});
  if($('#tiClrFx'))armTap($('#tiClrFx'),'Tap again to clear',function(){daw.fx=[];daw.fxf=[];fxOffAll();markDirty();renderInsp();dawNeed=true;});
  $$('[data-fxdel]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-fxdel');if(k==='f')daw.fxf=[];else daw.fx.splice(+k,1);fxOffAll();markDirty();renderInsp();dawNeed=true;});});
  $$('[data-fxgo]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-fxgo'),st=k==='f'?daw.fxf[0].s:daw.fx[+k].s;daw.play=Math.max(0,Math.floor(st));var vw=dW/daw.ppx;if(daw.play<daw.sx||daw.play>daw.sx+vw*0.9)daw.sx=Math.max(0,daw.play-vw*0.1);dawNeed=true;});});
  if($('#tiBounce'))$('#tiBounce').addEventListener('click',function(){bounceLane(ti);});
  var rgSet=function(){var a=Math.max(1,parseInt($('#rgA').value)||1),b=Math.max(a,parseInt($('#rgB').value)||a);daw.loop={on:daw.loop.on,a:(a-1)*16,b:b*16};updDawTr();renderInsp();dawNeed=true;markDirty();};
  $('#rgA').addEventListener('change',rgSet);$('#rgB').addEventListener('change',rgSet);
  if($('#sgDb')){$('#sgDb').addEventListener('input',function(e){secDb=+e.target.value;$('#sgO').textContent=(secDb>0?'+':'')+dec(secDb,1)+' dB';});
    $('#sgOne').addEventListener('click',function(){sectionGain([ti],daw.loop.a,daw.loop.b,secDb);});$('#sgAll').addEventListener('click',function(){sectionGain(tracks.map(function(x,i){return i;}),daw.loop.a,daw.loop.b,secDb);});}
  if($('#tiDel'))armTap($('#tiDel'),'Tap again to delete “'+t.name+'”',function(){removeTrack(ti);});
}
var secDb=-3;
function sectionGain(list,a,b,db){if(!db){toast('Pick a change first.');return;}var g=dbg(db),n=0;
  list.forEach(function(ti){var t=tracks[ti];if(!t||t.mute)return;var has=hasAuto(t,'vol'),cur=function(x){return has?autoVal(t,'vol',x):t.vol;};
    var A=Math.max(0,a-0.5),B=b-0.5,keep=has?t.auto.vol.filter(function(p){return p.s<A-0.01||p.s>b+0.01;}):[],ins=has?t.auto.vol.filter(function(p){return p.s>a+0.01&&p.s<B-0.01;}).map(function(p){return {s:p.s,v:Math.min(1.2,p.v*g)};}):[];
    var pts=[{s:A,v:cur(A)},{s:a,v:Math.min(1.2,cur(a)*g)},{s:B,v:Math.min(1.2,cur(B)*g)},{s:b,v:cur(b)}];if(A===a)pts.shift();
    t.auto=t.auto||{};t.auto.vol=keep.concat(ins,pts).sort(function(x,y){return x.s-y.s;});n++;});
  applyMix();autoPreview();markDirty();renderInsp();dawNeed=true;toast('Section '+(db>0?'+':'')+dec(db,1)+' dB on '+n+' track'+(n===1?'':'s')+'. Volume now follows the automation line.',2400);}
function bindInsp(c){
  var sd=stepDur();
  function done(){markDirty();renderInsp();dawNeed=true;}
  $('#ciSplit').addEventListener('click',function(){splitClip(c,daw.play);});
  $('#ciDup').addEventListener('click',function(){var d=JSON.parse(JSON.stringify(c));d.s=clipEnd(c);if(d.type==='pat')d.s=Math.round(d.s);d.id=++daw.nid;daw.clips.push(d);daw.sel=d.id;done();});
  $('#ciDel').addEventListener('click',function(){deleteSel();});
  function rep(n){var len=clipLen(c),made=0,last=c;for(var k=1;k<=n;k++){var d=JSON.parse(JSON.stringify(c));d.id=++daw.nid;d.s=c.s+len*k;if(d.type==='pat')d.s=Math.round(d.s);delete d.jam;daw.clips.push(d);last=d;made++;}daw.sel=last.id;done();toast('Repeated ×'+made+' — now ends at bar '+(Math.floor(clipEnd(last)/16)+1)+'.',1600);}
  $('#ciR2').addEventListener('click',function(){rep(1);});$('#ciR4').addEventListener('click',function(){rep(3);});
  $('#ciREnd').addEventListener('click',function(){var end=0;daw.clips.forEach(function(x){if(x!==c)end=Math.max(end,clipEnd(x));});var len=clipLen(c),n=Math.floor((end-clipEnd(c)+0.001)/len);if(n<1){toast('Nothing after this clip to fill up to — use Repeat ×4.');return;}rep(n);});
  $('#ciCopy').addEventListener('click',function(){dawClipboard=JSON.parse(JSON.stringify(c));toast('Clip copied.',900);});
  $('#ciPaste').addEventListener('click',pasteClip);
  $('#ciMute').addEventListener('click',function(){c.mute=!c.mute;done();});if($('#ciFrz'))$('#ciFrz').addEventListener('click',function(){secFreeze(c);done();toast('Frozen: this clip is yours now. Rebuilding the song leaves it alone.',2400);});
  if(c.type==='pat'){
    $$('[data-cp]').forEach(function(b){b.addEventListener('click',function(){c.p=+b.getAttribute('data-cp');c.o=0;done();});});
    $('#ciEdit').addEventListener('click',function(){setPattern(c.p);if(c.ti===0)showTab('t-pad');else{songSel=c.ti;selectTrack(c.ti);renderTrackSegs();showTab('t-song');}});
  }else{
    $('#ciGain').addEventListener('input',function(e){c.gain=+e.target.value;$('#ciGo').textContent=dec(c.gain,1)+' dB';dawNeed=true;markDirty();});
    tsBindInsp(c,done);
    $('#ciLoop').addEventListener('change',function(e){c.loop=e.target.checked;var b=abuf[c.buf];if(!c.loop&&b)c.dur=Math.min(c.dur,b.duration-c.off);done();});
    $('#ciFi').addEventListener('input',function(e){c.fi=+e.target.value;$('#ciFio').textContent=dec(c.fi,2)+' s';dawNeed=true;markDirty();});
    $('#ciFo').addEventListener('input',function(e){c.fo=+e.target.value;$('#ciFoo').textContent=dec(c.fo,2)+' s';dawNeed=true;markDirty();});
    if($('#ciTp')){var sw=function(d){var i=c.takes.indexOf(c.buf);c.buf=c.takes[(i+d+c.takes.length)%c.takes.length];done();};$('#ciTp').addEventListener('click',function(){sw(-1);});$('#ciTn').addEventListener('click',function(){sw(1);});
      $('#ciTk').addEventListener('click',function(){c.takes=[c.buf];done();toast('Other takes removed (Undo brings them back).',1600);});}
    $('#ciNorm').addEventListener('click',function(){var b=abuf[c.buf];if(!b)return;var pk=0;for(var ch=0;ch<b.numberOfChannels;ch++){var d=b.getChannelData(ch);for(var i=0;i<d.length;i++){var a=Math.abs(d[i]);if(a>pk)pk=a;}}if(pk>0){c.gain=Math.round((20*Math.log10(0.891/pk))*10)/10;done();toast('Clip gain set to '+dec(c.gain,1)+' dB (peak −1 dBFS).',1600);}});
    $('#ciRev').addEventListener('click',function(){var b=abuf[c.buf];if(!b)return;var nb=ctx.createBuffer(b.numberOfChannels,b.length,b.sampleRate);for(var ch=0;ch<b.numberOfChannels;ch++){var s=b.getChannelData(ch),d=nb.getChannelData(ch),n=s.length;for(var i=0;i<n;i++)d[i]=s[n-1-i];}var id=abufAdd(nb),k=c.takes.indexOf(c.buf);c.buf=id;if(k>=0)c.takes[k]=id;if(!c.loop)c.off=Math.max(0,b.duration-c.off-c.dur);done();});
    vtBindInsp(c);
    $('#ciLoopSel').addEventListener('click',function(){daw.loop={on:true,a:Math.floor(c.s),b:Math.max(Math.floor(c.s)+1,Math.round(clipEnd(c)))};updDawTr();done();});
  }
}
function splitClip(c,at){
  var sd=tsActive(c)?tsSrcSd(c):stepDur();if(c.type==='pat')at=Math.round(at);
  if(at<=c.s+0.01||at>=clipEnd(c)-0.01){toast('Move the playhead inside the clip to split it.');return;}
  var R=JSON.parse(JSON.stringify(c));R.id=++daw.nid;var d=at-c.s;
  if(c.type==='pat'){R.s=at;R.l=c.l-d;R.o=(c.o||0)+d;c.l=d;}else{R.s=at;R.off=c.off+d*sd;R.dur=c.dur-d*sd;c.dur=d*sd;c.fo=0.005;R.fi=0.005;}
  daw.clips.push(R);daw.sel=R.id;markDirty();renderInsp();dawNeed=true;
}
function deleteSel(){var c=selClip();if(!c)return;daw.clips=daw.clips.filter(function(x){return x!==c;});daw.sel=null;markDirty();renderInsp();dawNeed=true;}
function pasteClip(){
  if(!dawClipboard){toast('Copy a clip first.');return;}var d=JSON.parse(JSON.stringify(dawClipboard)),lt=tracks[daw.lane];
  if(lt&&((d.type==='aud')===(lt.kind==='audio')))d.ti=daw.lane;if(!tracks[d.ti]){toast('That track no longer exists.');return;}
  d.s=d.type==='pat'?Math.round(daw.play):daw.play;d.id=++daw.nid;daw.clips.push(d);daw.sel=d.id;markDirty();renderInsp();dawNeed=true;
}
/* transport bar */
function updDawTr(){
  var pl=$('#dawPlay');if(!pl)return;var on=seq.on&&seq.mode==='arrange';
  pl.textContent=on?'■ Stop':'▶ Play';var drc=!!arr.rec||!!(seq.on&&seq.rec);$('#dawRec').classList.toggle('live',drc);$('#dawRec').textContent=drc?'■ Stop rec':'● Record';
  $('#dawLoop').setAttribute('aria-pressed',daw.loop.on);$('#dawMetro').setAttribute('aria-pressed',!!seq.metro);$('#dawCount').setAttribute('aria-pressed',daw.count);
  $$('[data-snap]').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-snap')===daw.snap);});
  $('#dawAuto').value=daw.auto;var bb=$('#dawBpm');if(bb)bb.textContent=Math.round(P.bpm.v);
}
var lastPosTxt='';
function posText(g){var sd=stepDur();if(g<arr.startG&&seq.on&&seq.mode==='arrange')return 'Count-in';g=Math.max(0,g);var sec=g*sd,m=Math.floor(sec/60);return (Math.floor(g/16)+1)+'.'+(Math.floor((g%16)/4)+1)+'.'+(Math.floor(g%4)+1)+' · '+m+':'+('0'+dec(sec-m*60,1)).slice(-4);}
function dawFit(){var e=Math.max(16,arrEnd(),daw.loop.on?daw.loop.b:0)+8;daw.ppx=clamp(dW/e,0.25,48);daw.sx=0;dawNeed=true;}
function drawMini(pos){var cv=$('#dawMini');if(!cv)return;var dpr=window.devicePixelRatio||1,W=cv.clientWidth||300,H=30;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#0D0D13';g.fillRect(0,0,W,H);var tot=Math.max(arrEnd()+16,32),k=W/tot,lh=Math.max(1.5,(H-6)/Math.max(1,tracks.length));
  daw.clips.forEach(function(c){g.fillStyle=hexA(DAWCOL[c.ti%DAWCOL.length],0.85);g.fillRect(c.s*k,3+c.ti*lh,Math.max(1,clipLen(c)*k),Math.max(1,lh-0.5));});
  daw.markers.forEach(function(m){g.fillStyle='#FF8A5B';g.fillRect(m.s*k,0,1,H);});
  g.strokeStyle='#F4F4F7';g.lineWidth=1.5;g.strokeRect(daw.sx*k+0.5,1,Math.max(4,dW/daw.ppx*k)-1,H-2);var ph=pos!=null?pos:daw.play;g.fillStyle='#5CE1E6';g.fillRect(ph*k,0,2,H);}
function dawFrame(){
  requestAnimationFrame(dawFrame);
  var vis=$('#t-daw').classList.contains('active');if(!vis||!dg)return;
  var playing=seq.on&&seq.mode==='arrange',pos=playing?arrPosNow():daw.play;
  if(playing){var vw=dW/daw.ppx;if(pos>daw.sx+vw*0.92||pos<daw.sx){daw.sx=Math.max(0,pos-vw*0.1);}drawDaw(pos);drawMini(pos);}
  else if(dawNeed){drawDaw();drawMini();}
  dawNeed=false;var tx=posText(pos)+(arr.rec?' · ● REC':'');if(tx!==lastPosTxt){lastPosTxt=tx;$('#dawPos').textContent=tx;}
}
/* pointer interaction */
var dp=null,dptrs=new Map(),lastTap={t:0,x:0,y:0};
function dawHit(x,y){
  if(y<DRH){if(y<11){for(var i=daw.markers.length-1;i>=0;i--){var mx=sx2(daw.markers[i].s);if(x>=mx-8&&x<=mx+16)return {kind:'marker',i:i};}}
    if(y>=FXY&&fxLaneOn()){var fx=daw.fx||[];for(var k=fx.length-1;k>=0;k--){var a0=sx2(fx[k].s),a1=sx2(fx[k].e);if(x<a0-8||x>a1+8)continue;var w0=a1-a0,ez=Math.min(14,w0/4);if(k===daw.fxSel&&w0>=28){if(x>a1-ez)return {kind:'fxseg',i:k,op:'trimR'};if(x<a0+ez)return {kind:'fxseg',i:k,op:'trimL'};}var pad=Math.max(0,(24-w0)/2);if(x>=a0-pad&&x<=a1+pad)return {kind:'fxseg',i:k,op:'move'};}return {kind:'fxlane'};}
    return {kind:'ruler'};}
  var lane=Math.floor((y-DRH)/DLH);if(lane<0||lane>=tracks.length)return {kind:'none'};
  var step=x/daw.ppx+daw.sx;
  if(daw.auto!=='off')return {kind:'auto',lane:lane,step:step};
  for(var i2=daw.clips.length-1;i2>=0;i2--){var c=daw.clips[i2];if(c.ti!==lane)continue;var x0=sx2(c.s),x1=sx2(clipEnd(c));if(x<x0-6||x>x1+6)continue;
    var yt=laneY(lane)+4,sel=c.id===daw.sel,w=x1-x0,ez=Math.min(16,w/4),sd=stepDur();
    if(sel&&c.type==='aud'&&y<yt+20){var fx=x0+c.fi/sd*daw.ppx,ox=x1-c.fo/sd*daw.ppx;if(Math.abs(x-fx)<14)return {kind:'clip',c:c,op:'fi'};if(Math.abs(x-ox)<14)return {kind:'clip',c:c,op:'fo'};}
    if(sel){if(w>=44){if(x>x1-ez)return {kind:'clip',c:c,op:'trimR'};if(x<x0+ez)return {kind:'clip',c:c,op:'trimL'};}else{if(x>x1-3)return {kind:'clip',c:c,op:'trimR'};if(x<x0+3)return {kind:'clip',c:c,op:'trimL'};}}else if(x<x0||x>x1)continue;
    if(x>=x0&&x<=x1)return {kind:'clip',c:c,op:'move'};}
  return {kind:'empty',lane:lane,step:step};
}
function cvXY(e){var r=zRect(dcv,e);return {x:e.clientX-r.left,y:e.clientY-r.top};}
function initDawPointer(){
  dcv.addEventListener('pointerdown',function(e){ensureAudio();e.preventDefault();try{dcv.setPointerCapture(e.pointerId);}catch(x){}
    var p=cvXY(e);dptrs.set(e.pointerId,p);
    if(dptrs.size===2){var a=Array.from(dptrs.values());dp={kind:'pinch',d0:Math.abs(a[0].x-a[1].x)||1,ppx0:daw.ppx,cs:((a[0].x+a[1].x)/2)/daw.ppx+daw.sx};return;}
    if(dptrs.size>2)return;
    var h=dawHit(p.x,p.y);dp={kind:h.kind,h:h,x0:p.x,y0:p.y,sx0:daw.sx,st0:main.scrollTop,t0:performance.now(),moved:false};
    if(h.kind==='fxseg'){if(daw.fxSel!==h.i){daw.fxSel=h.i;daw.sel=null;renderInsp();}dp.orig=JSON.parse(JSON.stringify(daw.fx[h.i]));dp.seg=daw.fx[h.i];}
    if(h.kind==='clip'){var c=h.c;daw.fxSel=null;if(daw.sel!==c.id){daw.sel=c.id;daw.lane=c.ti;renderInsp();renderDawHeads();}dp.orig=JSON.parse(JSON.stringify(c));dp.c=c;}
    if(h.kind==='auto'){var t=tracks[h.lane],k=daw.auto,A=AUTOP[k],top=laneY(h.lane)+8,hh=DLH-16;if(!t.auto)t.auto={};var arr2=t.auto[k]||[],best=null,bd=18;
      arr2.forEach(function(pt){var dx=sx2(pt.s)-p.x,dy=(top+(1-(pt.v-A.min)/(A.max-A.min))*hh)-p.y,d=Math.sqrt(dx*dx+dy*dy);if(Math.abs(dx)<12&&Math.abs(dy)<20&&d<bd){bd=d;best=pt;}});
      var now=performance.now();
      if(best&&now-lastTap.t<350&&lastTap.pt===best){t.auto[k]=arr2.filter(function(q){return q!==best;});if(!t.auto[k].length)delete t.auto[k];applyMix();autoPreview();markDirty();dp=null;lastTap={t:0};dawNeed=true;renderInsp();return;}
      if(!best){dp.kind='autoNew';dp.ti=h.lane;dawNeed=true;return;}
      lastTap={t:now,pt:best};dp.apt=best;dp.ti=h.lane;dawNeed=true;}
    dawNeed=true;
  });
  dcv.addEventListener('pointermove',function(e){if(!dptrs.has(e.pointerId))return;var p=cvXY(e);dptrs.set(e.pointerId,p);if(!dp)return;
    if(dp.kind==='pinch'){var a=Array.from(dptrs.values());if(a.length<2)return;var d=Math.abs(a[0].x-a[1].x)||1,mid=(a[0].x+a[1].x)/2;daw.ppx=clamp(dp.ppx0*d/dp.d0,0.25,48);daw.sx=Math.max(0,dp.cs-mid/daw.ppx);dawNeed=true;return;}
    var dx=p.x-dp.x0,dy=p.y-dp.y0;if(!dp.moved&&Math.abs(dx)+Math.abs(dy)>6)dp.moved=true;if(!dp.moved)return;
    var sd=dp.c&&tsActive(dp.c)?tsSrcSd(dp.c):stepDur(),dSteps=dx/daw.ppx;
    if(dp.kind==='empty'||dp.kind==='none'||dp.kind==='autoNew'){daw.sx=clamp(dp.sx0-dSteps,0,Math.max(0,totalSteps()-dW/daw.ppx));main.scrollTop=dp.st0-dy;dawNeed=true;return;}
    if(dp.kind==='fxseg'){var sg=dp.seg,o2=dp.orig,u2=daw.snap||0,len2=o2.e-o2.s;if(dp.h.op==='move'){var ns4=dawSnap(o2.s+dSteps,u2);sg.s=Math.max(0,ns4);sg.e=sg.s+len2;}else if(dp.h.op==='trimR'){sg.e=Math.max(sg.s+0.25,dawSnap(o2.e+dSteps,u2));}else{sg.s=clamp(dawSnap(o2.s+dSteps,u2),0,sg.e-0.25);}dawNeed=true;return;}
    if(dp.kind==='fxlane'){daw.sx=clamp(dp.sx0-dSteps,0,Math.max(0,totalSteps()-dW/daw.ppx));dawNeed=true;return;}
    if(dp.kind==='ruler'){var a1=dawSnap(dp.x0/daw.ppx+daw.sx,Math.max(1,daw.snap||4)),b1=dawSnap(p.x/daw.ppx+daw.sx,Math.max(1,daw.snap||4));if(a1!==b1){daw.loop={on:true,a:Math.min(a1,b1),b:Math.max(a1,b1)};updDawTr();}dawNeed=true;return;}
    if(dp.kind==='auto'&&dp.apt){var t=tracks[dp.ti],k=daw.auto,A=AUTOP[k],top=laneY(dp.ti)+8,hh=DLH-16,a2=t.auto[k],i=a2.indexOf(dp.apt);
      var ns=dawSnap(p.x/daw.ppx+daw.sx,daw.snap?1:0);if(i>0)ns=Math.max(ns,a2[i-1].s);if(i<a2.length-1)ns=Math.min(ns,a2[i+1].s);dp.apt.s=Math.max(0,ns);dp.apt.v=clamp(A.min+(1-(p.y-top)/hh)*(A.max-A.min),A.min,A.max);if(Math.abs(dp.apt.v-autoBase(t,k))<(A.max-A.min)*0.015&&k!=='cut')dp.apt.v=autoBase(t,k);dawNeed=true;return;}
    if(dp.kind==='clip'){var c=dp.c,o=dp.orig,u=snapUnitFor(c),b=c.type==='aud'?abuf[c.buf]:null;
      if(dp.h.op==='move'){var ns2=dawSnap(o.s+dSteps,u);c.s=Math.max(0,ns2);var ln=Math.floor((p.y-DRH)/DLH);if(ln>=0&&ln<tracks.length&&((tracks[ln].kind==='audio')===(c.type==='aud'))){c.ti=ln;}}
      else if(dp.h.op==='trimR'){var e2=dawSnap(o.s+(c.type==='pat'?o.l:o.dur/sd)+dSteps,u);if(c.type==='pat')c.l=Math.max(1,e2-o.s);else{var nd=Math.max(0.02,(e2-o.s)*sd);if(!c.loop&&b)nd=Math.min(nd,b.duration-o.off);c.dur=nd;c.fo=Math.min(c.fo,c.dur/2);}}
      else if(dp.h.op==='trimL'){var oe=o.s+(c.type==='pat'?o.l:o.dur/sd),ns3=Math.min(dawSnap(o.s+dSteps,u),oe-(c.type==='pat'?1:0.05/sd));ns3=Math.max(0,ns3);var dd=ns3-o.s;
        if(c.type==='pat'){c.s=ns3;c.l=o.l-dd;c.o=(o.o||0)+dd;}else{var noff=o.off+dd*sd;if(!c.loop&&noff<0){noff=0;ns3=o.s-o.off/sd;dd=ns3-o.s;}c.s=ns3;c.off=noff;c.dur=o.dur-dd*sd;c.fi=Math.min(c.fi,c.dur/2);}}
      else if(dp.h.op==='fi'){c.fi=clamp((p.x-sx2(c.s))/daw.ppx*sd,0,c.dur-c.fo);}
      else if(dp.h.op==='fo'){c.fo=clamp((sx2(clipEnd(c))-p.x)/daw.ppx*sd,0,c.dur-c.fi);}
      dawNeed=true;}
  });
  function up(e){if(!dptrs.has(e.pointerId))return;dptrs.delete(e.pointerId);if(!dp)return;
    if(dp.kind==='pinch'){if(dptrs.size===0)dp=null;return;}
    var p=cvXY(e),tap=!dp.moved&&performance.now()-dp.t0<500,h=dp.h;
    if(dp.kind==='ruler'&&!tap&&daw.sel==null)renderInsp();
    if(dp.kind==='fxseg'){if(dp.moved){daw.fx.sort(function(a,b){return a.s-b.s;});daw.fxSel=daw.fx.indexOf(dp.seg);markDirty();fxOffAll();}renderInsp();}
    if(dp.kind==='fxlane'&&tap){daw.fxSel=null;renderInsp();}
    if(dp.kind==='ruler'&&tap&&performance.now()-(lastTap.rt||0)<350){dawFit();lastTap.rt=0;}
    else if(dp.kind==='ruler'&&tap){lastTap.rt=performance.now();setPlayhead(dawSnap(p.x/daw.ppx+daw.sx,daw.snap||0));}
    else if(dp.kind==='marker'&&tap){daw.msel=h.i;setPlayhead(daw.markers[h.i].s);renderMarkers();}
    else if((dp.kind==='empty'||dp.kind==='none')&&tap){
      var now=performance.now(),dbl=now-lastTap.t<350&&Math.abs(lastTap.x-p.x)<24&&Math.abs(lastTap.y-p.y)<24;lastTap={t:now,x:p.x,y:p.y};
      if(h.lane!=null){daw.lane=h.lane;}daw.sel=null;
      if(dbl&&h.lane!=null){var t=tracks[h.lane];if(t.kind!=='audio'){var pt=patterns[curPat],s=dawSnap(h.step-pt.len/2,16);s=Math.max(0,Math.floor(h.step/16)*16);var c=newClip({type:'pat',ti:h.lane,s:s,l:pt.len,p:curPat,o:0});daw.sel=c.id;markDirty();}else toast('Record, import audio, or add a loop from the library.',2200);}
      else if(h.lane!=null)setPlayhead(dawSnap(h.step,daw.snap?Math.min(daw.snap,4):0));
      renderInsp();renderDawHeads();}
    else if(dp.kind==='clip'){
      if(dp.moved){if(JSON.stringify(dp.c)!==JSON.stringify(dp.orig))markDirty();renderInsp();}
      else{var now2=performance.now();if(now2-lastTap.t<350&&lastTap.c===dp.c&&dp.c.type==='pat'){var cc=dp.c;setPattern(cc.p);if(cc.ti===0)showTab('t-pad');else{songSel=cc.ti;selectTrack(cc.ti);renderTrackSegs();showTab('t-song');}}lastTap={t:now2,c:dp.c,x:p.x,y:p.y};}
    }
    else if(dp.kind==='autoNew'&&tap){var ta=tracks[dp.ti],ka=daw.auto,Aa=AUTOP[ka],topa=laneY(dp.ti)+8,hha=DLH-16;if(!ta.auto)ta.auto={};var aa=ta.auto[ka]||[];aa.push({s:dawSnap(p.x/daw.ppx+daw.sx,daw.snap||1),v:clamp(Aa.min+(1-(p.y-topa)/hha)*(Aa.max-Aa.min),Aa.min,Aa.max)});aa.sort(function(a,b){return a.s-b.s;});ta.auto[ka]=aa;applyMix();markDirty();if(!seq.on)autoPreview();}
    else if(dp.kind==='auto'&&dp.apt){markDirty();if(!seq.on)autoPreview();}
    dp=null;dawNeed=true;
  }
  ['pointerup','pointercancel'].forEach(function(ev){dcv.addEventListener(ev,up);});
  dcv.addEventListener('wheel',function(e){
    if(e.ctrlKey||e.metaKey){e.preventDefault();var r=zRect(dcv,e),mx=e.clientX-r.left,cs=mx/daw.ppx+daw.sx;daw.ppx=clamp(daw.ppx*Math.pow(1.0015,-e.deltaY),0.25,48);daw.sx=Math.max(0,cs-mx/daw.ppx);dawNeed=true;return;}
    var dx=e.shiftKey?e.deltaY:e.deltaX;if(Math.abs(dx)>Math.abs(e.shiftKey?0:e.deltaY)){e.preventDefault();daw.sx=clamp(daw.sx+dx/daw.ppx,0,Math.max(0,totalSteps()-dW/daw.ppx));dawNeed=true;}
  },{passive:false});
}
var main=document.querySelector('main');
function setPlayhead(g){daw.play=Math.max(0,g);if(seq.on&&seq.mode==='arrange'&&!arr.rec){transportStop();transportStart('arrange');}else autoPreview();dawNeed=true;}
/* markers */
var MKN=['Intro','Verse','Chorus','Verse 2','Chorus 2','Bridge','Drop','Outro'];
function renderMarkers(){
  var w=$('#dawMk');if(!w)return;daw.markers.sort(function(a,b){return a.s-b.s;});
  w.innerHTML=daw.markers.length?daw.markers.map(function(m,i){return '<button data-mk="'+i+'" aria-pressed="'+(i===daw.msel)+'">'+m.name+' · '+(Math.floor(m.s/16)+1)+'</button>';}).join(''):'<span class="mu">No markers yet.</span>';
  $$('[data-mk]').forEach(function(b){b.addEventListener('click',function(){daw.msel=+b.getAttribute('data-mk');setPlayhead(daw.markers[daw.msel].s);renderMarkers();});});
  var m=daw.markers[daw.msel],ed=$('#dawMkEd');ed.hidden=!m;if(m){$('#dawMkName').value=m.name;}
}
/* export */
function dawExport(binaural){if(!daw.clips.length){toast('The timeline is empty.');return;}exportSongOffline(binaural,'arrange',binaural?$('#dawBin'):$('#dawWav'));}
function stemSrc(){return daw.clips.length?'arrange':'song';}
/* keyboard */
function dawKeys(e){
  if(!$('#t-daw').classList.contains('active'))return;var ae=document.activeElement;if(ae&&(ae.tagName==='INPUT'&&ae.type!=='range'&&ae.type!=='checkbox'||ae.tagName==='SELECT'||ae.tagName==='TEXTAREA'))return;
  var k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(!mod&&(k==='delete'||k==='backspace')&&selClip()){e.preventDefault();e.stopImmediatePropagation();deleteSel();return;}
  if(!mod&&k===' '){e.preventDefault();e.stopImmediatePropagation();transportToggle('arrange');return;}
  if(mod&&k==='c'&&selClip()){e.preventDefault();dawClipboard=JSON.parse(JSON.stringify(selClip()));toast('Clip copied.',900);return;}
  if(mod&&k==='v'){e.preventDefault();pasteClip();return;}
  if(mod&&k==='d'&&selClip()){e.preventDefault();$('#ciDup').click();return;}
  if(mod&&k==='e'&&selClip()){e.preventDefault();splitClip(selClip(),daw.play);return;}
}
function initDaw(){
  dcv=$('#dawCv');dg=dcv.getContext('2d');initDawPointer();
  $('#dawPlay').addEventListener('click',function(){if(arr.rec){transportStop();return;}seq.src='arrange';transportToggle('arrange');});
  $('#dawRec').addEventListener('click',function(){dawRecord();});
  $('#dawHome').addEventListener('click',function(){setPlayhead(daw.loop.on?daw.loop.a:0);daw.sx=Math.max(0,daw.play-4);dawNeed=true;});
  $('#dawLoop').addEventListener('click',function(){daw.loop.on=!daw.loop.on;if(daw.loop.b<=daw.loop.a){daw.loop.a=Math.floor(daw.play/16)*16;daw.loop.b=daw.loop.a+64;}updDawTr();dawNeed=true;markDirty();});
  $('#dawMetro').addEventListener('click',function(){seq.metro=!seq.metro;$('#trMetro').checked=seq.metro;updDawTr();});
  $('#dawCount').addEventListener('click',function(){daw.count=!daw.count;updDawTr();});
  function bpmTo(v){setParam('bpm',Math.round(v));markDirty();updDawTr();}
  $('#dawBpmDn').addEventListener('click',function(){bpmTo(P.bpm.v-1);});$('#dawBpmUp').addEventListener('click',function(){bpmTo(P.bpm.v+1);});
  var taps=[];$('#dawTap').addEventListener('click',function(){var n=performance.now();taps=taps.filter(function(t){return n-t<2500;});taps.push(n);if(taps.length>=3){var d=(taps[taps.length-1]-taps[0])/(taps.length-1);bpmTo(clamp(60000/d,60,200));toast('Tempo '+Math.round(P.bpm.v)+' BPM',900);}else toast('Keep tapping…',700);});
  $$('[data-snap]').forEach(function(b){b.addEventListener('click',function(){daw.snap=+b.getAttribute('data-snap');updDawTr();});});
  $('#dawFit').addEventListener('click',dawFit);
  var mm=$('#dawMini'),mmd=false,mmGo=function(e){var r=mm.getBoundingClientRect(),tot=Math.max(arrEnd()+16,32),st=(e.clientX-r.left)/r.width*tot;daw.sx=Math.max(0,st-dW/daw.ppx/2);dawNeed=true;};
  mm.addEventListener('pointerdown',function(e){e.preventDefault();mmd=true;try{mm.setPointerCapture(e.pointerId);}catch(x){}mmGo(e);});mm.addEventListener('pointermove',function(e){if(mmd)mmGo(e);});['pointerup','pointercancel'].forEach(function(ev){mm.addEventListener(ev,function(){mmd=false;});});
  $('#dawZi').addEventListener('click',function(){var c=daw.sx+dW/daw.ppx/2;daw.ppx=clamp(daw.ppx*1.5,0.25,48);daw.sx=Math.max(0,c-dW/daw.ppx/2);dawNeed=true;});
  $('#dawZo').addEventListener('click',function(){var c=daw.sx+dW/daw.ppx/2;daw.ppx=clamp(daw.ppx/1.5,0.25,48);daw.sx=Math.max(0,c-dW/daw.ppx/2);dawNeed=true;});
  $('#dawAuto').addEventListener('change',function(e){daw.auto=e.target.value;daw.sel=null;renderInsp();dawNeed=true;});
  $('#dawLibBtn').addEventListener('click',openLib);
  $('#dawFromSong').addEventListener('click',function(){var n=songToTimeline();markDirty();renderInsp();dawNeed=true;toast(n?'Song arrangement placed on the timeline ('+Math.round(songOrder().reduce(function(a,pi){return a+patterns[pi].len;},0)/16)+' bars).':'The Song arrangement is empty.',2400);});
  $('#f-DAW').addEventListener('change',function(e){importAudioToLane(e.target.files[0]);e.target.value='';});
  $('#dawMkAdd').addEventListener('click',function(){var s=Math.round(daw.play/4)*4,nm=MKN[daw.markers.length%MKN.length];daw.markers.push({s:s,name:nm});daw.markers.sort(function(a,b){return a.s-b.s;});daw.msel=daw.markers.findIndex(function(m){return m.s===s&&m.name===nm;});renderMarkers();markDirty();dawNeed=true;});
  $('#dawMkName').addEventListener('change',function(e){var m=daw.markers[daw.msel];if(m&&e.target.value.trim()){m.name=e.target.value.trim().slice(0,20);renderMarkers();markDirty();dawNeed=true;}});
  armTap($('#dawMkDel'),'Tap again to delete',function(){if(daw.msel<0)return;daw.markers.splice(daw.msel,1);daw.msel=-1;renderMarkers();markDirty();dawNeed=true;});
  $('#dawWav').addEventListener('click',function(){dawExport(false);});$('#dawBin').addEventListener('click',function(){dawExport(true);});
  $('#dawMon').addEventListener('change',function(e){if(e.target.checked&&!VT.hp){e.target.checked=false;hpAsk('“Hear yourself” sends your microphone to your ears while you record.',function(){daw.mon=true;$('#dawMon').checked=true;},function(){daw.mon=false;toast('Monitoring stays off. Plug in headphones to monitor.',2600);});return;}daw.mon=e.target.checked;});
  $('#dawOff').addEventListener('input',function(e){daw.offMs=+e.target.value;$('#dawOffO').textContent=(daw.offMs>0?'+':'')+daw.offMs+' ms';});
  document.addEventListener('keydown',dawKeys,true);
  window.addEventListener('resize',resizeDaw);
  renderDawHeads();renderInsp();renderMarkers();updDawTr();requestAnimationFrame(dawFrame);
}
