try{initLearn();}catch(e){errLog.push('learn: '+e.message);}
(function(){var h=(location.hash||'').slice(1);for(var k in TABH)if(TABH[k]===h){showTab(k,true);}})();
$('#midiOn').addEventListener('click',midiConnect);
$$('[data-exp]').forEach(function(b){b.addEventListener('click',function(){ensureAudio();var k=b.getAttribute('data-exp'),s=slots[k];if(!s.buf)return;saveWav(encodeWav([s.buf.getChannelData(0)],s.buf.sampleRate),'ecou-'+s.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-'+nname(ftom(s.root)));});});
