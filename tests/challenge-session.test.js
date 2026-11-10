import test from 'node:test';
import assert from 'node:assert/strict';
import {createChallengeRound} from '../src/online/services/challenge-session.js';
const challenge={id:'friend-match',pairs:[['journey','hành trình'],['weather','thời tiết']],target_score:180};
test('friend match uses the selected challenge session, hides its deck, and disables clues',()=>{
 const r=createChallengeRound(challenge,{session:'friend-match',cards:4,seconds:30},{senderName:'Taylor'});
 assert.equal(r.challengeId,'friend-match');assert.equal(r.challengeFrom,'Taylor');assert.equal(r.challengeTarget,180);
 assert.equal(r.mode,'challenge');assert.equal(r.total,2);assert.equal(r.clue,0);assert.equal(r.t,30);
 assert.equal(r.t_.length,4);assert.ok(r.t_.every(card=>card.w===''&&card.k===-1));
});
test('rejects a different session or mismatched deck instead of opening another match',()=>{
 assert.throws(()=>createChallengeRound(challenge,{session:'other-match',cards:4,seconds:30}));
 assert.throws(()=>createChallengeRound(challenge,{session:'friend-match',cards:12,seconds:30}));
 assert.throws(()=>createChallengeRound(challenge,{session:'friend-match',cards:4,seconds:0}));
});
