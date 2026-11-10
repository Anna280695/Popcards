export function rankMovement(before,after){
 if(!after)return {direction:'none',places:0};
 if(!before)return {direction:'new',places:0};
 const delta=before-after;
 return {direction:delta>0?'up':delta<0?'down':'same',places:Math.abs(delta)};
}
window.popcardsShowRankUpdate=function(before,after,players){
 const result=S.res;
 if(result?.kind!=='complete')return;
 function show(){
  if(S.res!==result||S.scr!=='results')return;
  document.querySelector('.rank-update-overlay')?.remove();
  const motion=rankMovement(before,after),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay=document.createElement('section');overlay.className=`rank-update-overlay rank-${motion.direction}`;
  overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
  const heading=motion.direction==='up'?`Up ${motion.places} ${motion.places===1?'place':'places'}!`:motion.direction==='down'?`Down ${motion.places} ${motion.places===1?'place':'places'}`:motion.direction==='new'?'You’re on the board!':after?'Holding your place':'Score updated!';
  const nearby=after?players.slice(Math.max(0,after-3),after+2):[];
  overlay.innerHTML=`<div class="rank-update-card"><div class="rank-update-sparks" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i style="--i:${i};--angle:${i*36}deg">✦</i>`).join('')}</div><span class="rank-update-kicker">YOUR RANKING</span><div class="rank-update-art" aria-hidden="true">${ICON('trophy',70)}</div><h2>${heading}</h2><div class="rank-update-position">${before&&before!==after?`<span>#${before}</span><i aria-hidden="true">→</i>`:''}<strong>${after?'#'+after:Math.max(0,S.playerScore||0).toLocaleString()+' pts'}</strong></div><p>${after?'Your latest score is on the board.':'Keep matching and collecting points.'}</p><div class="rank-update-list">${nearby.map(p=>{const rank=players.indexOf(p)+1;return `<div class="rank-update-player ${p.you?'is-you':''}"><span class="rank-update-medal">${rank<4?['🥇','🥈','🥉'][rank-1]:'#'+rank}</span><span class="rank-update-avatar" aria-hidden="true">${CH(p.a||1,36)}</span><b>${esc(p.you?'You':p.n)}</b><strong>${Number(p.total||0).toLocaleString()}<small> pts</small></strong></div>`}).join('')}</div></div>`;
  const content=document.querySelector('#ph .ct');if(content)content.before(overlay);else document.querySelector('#ph')?.append(overlay);
  if(!reduced&&before&&after&&before!==after){
   const previous=[...players],mine=previous.find(p=>p.you);
   if(mine){previous.splice(previous.indexOf(mine),1);previous.splice(Math.min(before-1,previous.length),0,mine);}
   overlay.querySelectorAll('.rank-update-player').forEach((row,i)=>{
    const player=nearby[i],oldIndex=previous.indexOf(player),newIndex=players.indexOf(player);
    const distance=Math.max(-3,Math.min(3,oldIndex-newIndex))*(row.getBoundingClientRect().height+10);
    if(distance)row.animate([{transform:`translateY(${distance}px) scale(${player.you?1.04:1})`},{transform:'translateY(-4px) scale(1.02)',offset:.8},{transform:'translateY(0) scale(1)'}],{duration:1100,delay:650,easing:'cubic-bezier(.22,.8,.3,1)',fill:'both'});
   });
  }
  setTimeout(()=>{overlay.classList.add('is-leaving');setTimeout(()=>overlay.remove(),reduced?0:250)},reduced?2500:4500);
 }
 show();
};
// Preview/offline rounds use only their own in-memory standings.
window.popcardsAfterWin=function(){
 const players=(window.popcardsVerifiedRankings||[]).map(p=>({...p})).sort((a,b)=>b.total-a.total);
 const before=players.findIndex(p=>p.you)+1;
 const mine=players.find(p=>p.you);
 if(mine&&new URLSearchParams(location.search).has('preview')){mine.total=S.playerScore;players.sort((a,b)=>b.total-a.total);window.popcardsVerifiedRankings=players;}
 window.popcardsShowRankUpdate(before,players.findIndex(p=>p.you)+1,players);
};
