import {createRound,ROUND_SECONDS} from '../../gameplay/engine.js';

export function createChallengeRound(challenge,session,{level=1,tier=0,senderName='Your friend'}={}) {
 if(!session||session.session!==challenge.id||session.cards!==challenge.pairs.length*2||!Number.isFinite(session.seconds)||session.seconds<=0)throw new Error('Could not start this challenge. Please try again.');
 const round=createRound({pairs:challenge.pairs,mode:'challenge',level,tier});
 // The server reveals the challenged deck one card at a time.
 round.t_=Array.from({length:session.cards},()=>({w:'',k:-1,d:false}));
 round.t=Math.min(ROUND_SECONDS,session.seconds);
 round.challengeId=challenge.id;round.challengeFrom=senderName;round.challengeTarget=challenge.target_score;
 return round;
}
