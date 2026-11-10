import test from 'node:test';
import assert from 'node:assert/strict';
import {renderChallengeResult} from '../src/online/ui/challenge-result.js';
const render=(score,status='completed')=>renderChallengeResult({challenge:{status,response_score:score,target_score:100,pairs:[['cat','mèo'],['dog','chó']]},opponent:{display_name:'Taylor <test>'},you:{display_name:'Alex'}});
test('challenge results compare both players and identify wins, losses and ties',()=>{
 const win=render(120);assert.ok(win.includes('You won!'));assert.ok(win.includes('20 points ahead'));assert.ok(win.includes('Taylor &lt;test&gt;'));assert.ok(win.includes('Alex'));
 assert.ok(render(80).includes('Taylor &lt;test&gt; won'));
 const tie=render(100);assert.ok(tie.includes('It’s a tie!'));assert.ok(!tie.includes('<em>Winner</em>'));
});
test('expired challenges show not played instead of a fabricated score or winner',()=>{
 const html=render(null,'pending');assert.ok(html.includes('Challenge expired'));assert.ok(html.includes('Not played'));assert.ok(!html.includes('<em>Winner</em>'));
});
