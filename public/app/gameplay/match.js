// Popcards legacy shared-scope script. Loaded in manifest order.
function tiles(){return S.R.t_.map((t,i)=>{const up=t.d||S.R.pk===i||S.R.second===i||S.R.h?.includes(i);return `<button type="button" aria-label="${t.d?'Matched card':up?t.w:'Face-down card '+(i+1)}" aria-pressed="${up}" class="tile ${t.d?'done':''} ${S.R.pk===i?'pick':''} ${up?'revealed':''}" data-a="tile" data-v="${i}" ${t.d?'disabled':''}><span class="tile-inner"><span class="tile-face tile-back"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#c1"/></svg></span><span class="tile-face tile-front">${t.w}</span></span></button>`}).join('')}
function startRound(mode){
 window.PopcardsRoundController.stop();
 S.pendingMode=mode;S.scr='prematch';S.modal=null;
 render();
 window.PopcardsRoundController.prepare(mode,window.matchMedia('(prefers-reduced-motion: reduce)').matches?500:1800);
}
function beginRound(mode){window.PopcardsRoundController.stop();const source=mode==='challenge'&&window.__onlinePairs?window.__onlinePairs:mode==='words-match'?S.selectedWords.map(i=>S.playedWords[i]).filter(Boolean).slice(0,6):mode==='solo'&&S.unfinishedMatch?.length?S.unfinishedMatch.map(p=>[...p]):randomPairs();if(mode==='solo')S.unfinishedMatch=source.map(p=>[...p]);source.forEach(p=>{if(!S.playedWords.some(q=>q[0]===p[0]))S.playedWords.push([...p])});const flat=source.flatMap((p,k)=>[{w:p[0],k},{w:p[1],k}]);
 const ord=flat.map((_,i)=>i).sort(()=>Math.random()-.5);
 const tier=getTier();const rareKeys=source.map((p,k)=>VOCAB_TIERS.slice(4).some(words=>words.some(w=>w[0]===p[0]))?k:-1).filter(k=>k>=0);
 S.R=window.PopcardsGameEngine.createRound({pairs:source,mode,tier,level:getLevel(),rareKeys,difficultKeys:source.map((p,k)=>{const t=WORD_INFO.get(p[0])?.tier;return t>=2&&t<4?k:-1}).filter(k=>k>=0),clue:clueBalance(),order:ord});
 S.scr='round';S.modal=null;
 window.PopcardsRoundController.begin(S.R);}

const fmt=t=>Math.floor(t/60)+':'+String(t%60).padStart(2,'0');

function celebrateWin(){
 sfx('win');
 const phone=document.querySelector('#ph');if(!phone)return finish('complete');
 if(phone.querySelector('.win-cat-overlay'))return;
 window.PopcardsRoundController.stop();
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const bits=Array.from({length:46},(_,i)=>`<i class="win-confetti" style="--x:${(i*43+13)%100}%;--w:${5+i%4*2}px;--h:${9+i%5*3}px;--c:${['#fffa66','#ffb5c7','#a2dced','#b9e6b9','#ffffff'][i%5]};--r:${i*31}deg;--d:${1.7+i%5*.27}s;--delay:${i%11*.075}s;--drift:${(i%2?1:-1)*(30+i%5*12)}px"></i>`).join('');
 const stars=Array.from({length:9},(_,i)=>`<span class="win-orbit-star" style="--angle:${i*40}deg;--delay:${i*.065}s">${i%2?'✦':'★'}</span>`).join('');
 // Reuse the existing Popcards mascot symbol, without substituting a different illustration.
 const cat=`<svg class="win-cat-art ch" viewBox="0 0 100 100" role="img" aria-label="Popcards cat mascot celebrating"><use href="#c20"/></svg>`;
 const overlay=document.createElement('div');overlay.className='win-cat-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Match complete celebration');
 overlay.innerHTML=`<div class="win-celebrate-glow"></div>${bits}<div class="win-celebrate-center"><div class="win-celebrate-kicker">✦ MATCH COMPLETE ✦</div><div class="win-cat-scene"><div class="win-cat-halo"></div><div class="win-star-ring">${stars}</div><span class="win-puff win-puff-left">✦</span><span class="win-puff win-puff-right">✧</span>${cat}<div class="win-cat-shadow"></div></div><div class="win-cat-title">YOU DID IT!</div><div class="win-cat-sub">Every pair matched! <span aria-hidden="true">★</span></div><div class="win-completion-pill"><span>✓ ${S.R.pairs} / ${S.R.total} PAIRS</span><span>+ WIN!</span></div></div>`;
 phone.appendChild(overlay);
 let done=false;
 const complete=()=>{if(done)return;done=true;clearTimeout(auto);overlay.remove();finish('complete')};
 const auto=setTimeout(complete,reduced?1300:3400);
}

function finish(kind){if(kind==='timeout')sfx('timeout');window.PopcardsRoundController.stop();const R=S.R;R.missedKeys.forEach(k=>{const word=R.t_.find(t=>t.k===k&&WORD_INFO.has(t.w))?.w;if(word)recordMiss(word)});S.res=window.PopcardsGameEngine.finishRound(R,kind);if(R.mode==='solo'&&kind==='complete')S.unfinishedMatch=null;
 if(kind==='complete'&&R.mode!=='review'&&R.mode!=='words-match'){
   const {earned,base,timeB,pen,perfect}=S.res;
   const st=S.stats;st.rounds++;st.pairs+=R.pairs;st.mis+=R.mis;if(perfect)st.perfect++;
   const newBest=earned>st.best;if(newBest)st.best=earned;
   S.playerScore+=earned-(R.earnedPairs||0);S.playerWins++;addWeekly(earned);addNotif({t:'system',txt:newBest&&st.rounds>1?'New personal best!':'Round complete',sub:'+'+earned+' pts added to your score',a:'go',v:'leaderboard'});
   Object.assign(S.res,{earned,base,timeB,pen,perfect,levelUp:getLevel()>R.level,newLevel:getLevel(),newBest,prevBest:st.best===earned&&newBest?st.best:st.best});
 }
 if(S.activeCh){const c=S.inCh.find(x=>x.id===S.activeCh);S.activeCh=null;if(c){const sc=S.res.earned||0;c.score=sc;c.status=sc>=c.target?'won':'lost';S.res.chFrom=c.from;S.res.chWon=c.status==='won';addNotif({t:'challenge',txt:c.status==='won'?'You beat '+first(c.from)+'’s challenge!':'You missed '+first(c.from)+'’s challenge',sub:sc+' vs '+c.target+' pts',a:'go',v:'profile'})}}
  S.challengeUnlocked=R.mode==='solo'; S.lastMatchWords=[...new Set(R.t_.filter(t=>t.k!==undefined).map(t=>t.k))].map(k=>{const cards=R.t_.filter(t=>t.k===k);return cards.map(c=>c.w)}); if(R.mode=='challenge'&&S.ch&&!S.res.chFrom){S.ch.done=true}S.scr='results';S.modal=null;render();if(kind==='complete'&&!window.popcardsOnlineWinHandled)window.popcardsAfterWin?.()}
