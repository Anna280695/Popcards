import {escapeHtml as safe} from './escape.js';

export function renderChallengeResult({challenge,opponent,you,opponentAvatar='',yourAvatar=''}) {
 const completed=challenge.status==='completed';
 const mine=Number(challenge.response_score)||0,target=Number(challenge.target_score)||0;
 const won=completed&&mine>target,tied=completed&&mine===target;
 const title=!completed?'Challenge expired':won?'You won!':tied?'It’s a tie!':`${opponent.display_name} won`;
 const difference=Math.abs(mine-target).toLocaleString('en-US');
 const description=!completed?'This challenge ended before you played.':tied?'You both finished with the same score.':`${difference} ${Math.abs(mine-target)===1?'point':'points'} ${won?'ahead — nicely matched!':'between you. Keep matching!'}`;
 const player=(name,avatar,score,label,winner)=>`<div class="challenge-result-player ${winner?'is-winner':''}"><div class="challenge-result-avatar">${avatar}</div><b>${safe(name)}</b><small>${label}</small><strong>${score===null?'—':score.toLocaleString('en-US')}</strong><span>${score===null?'Not played':'points'}</span>${winner?'<em>Winner</em>':''}</div>`;
 return `<section class="challenge-result"><span class="challenge-kicker">CHALLENGE RESULT</span><h2>${safe(title)}</h2><p class="challenge-result-message">${safe(description)}</p><div class="challenge-result-comparison">${player(you.display_name,yourAvatar,completed?mine:null,'You',won)}<span class="challenge-result-vs" aria-hidden="true">VS</span>${player(opponent.display_name,opponentAvatar,target,'Score to beat',completed&&!won&&!tied)}</div><div class="challenge-result-rules">${challenge.pairs.length} pairs · 30 seconds · One attempt</div></section>`;
}
