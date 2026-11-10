import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/gameplay/engine.js';
import { createRoundController } from '../src/gameplay/round-controller.js';
function fakeClock(){let id=0;const timers=new Map();return {setTimeout(fn,ms){const n=++id;timers.set(n,{fn,ms,interval:false});return n},clearTimeout(n){timers.delete(n)},setInterval(fn,ms){const n=++id;timers.set(n,{fn,ms,interval:true});return n},clearInterval(n){timers.delete(n)},advance(ms){for(const [n,t] of [...timers])if(ms>=t.ms&&timers.has(n)){if(!t.interval)timers.delete(n);for(let k=0;k<(t.interval?Math.floor(ms/t.ms):1);k++)if(timers.has(n)||!t.interval)t.fn()}},size(){return timers.size}}}
const pairs=[['Cat','Mèo'],['Dog','Chó']];
test('pre-match can be cancelled without launching a round',()=>{const clock=fakeClock();let started=0;const c=createRoundController({engine,clock,onStart:()=>started++});c.prepare('solo',500);c.stop();clock.advance(1000);assert.equal(started,0)});
test('selecting two matching cards resolves after flip and completes game',()=>{const clock=fakeClock(), events=[];const c=createRoundController({engine,clock,onResolved:(_r,result)=>events.push(result)});const r=engine.createRound({pairs:[pairs[0]],order:[0,1]});c.begin(r);assert.equal(c.select(0).type,'first');assert.equal(c.select(1).type,'match');clock.advance(145);assert.equal(r.pairs,1);assert.equal(events[0].completed,true);c.stop()});
test('timeout triggers exactly once at 30 seconds',()=>{const clock=fakeClock();let expired=0;const c=createRoundController({engine,clock,onExpired:()=>expired++});const r=engine.createRound({pairs});c.begin(r);clock.advance(30000);assert.equal(r.t,0);assert.equal(expired,1);assert.equal(c.getActiveTimers().countdown,null)});
test('stopping a round suppresses pending flip',()=>{const clock=fakeClock();const c=createRoundController({engine,clock});const r=engine.createRound({pairs});c.begin(r);c.select(0);c.select(1);c.stop();clock.advance(1000);assert.equal(r.pairs,0)});

test('each clue flips and completes one new pair, including the final pair',()=>{
 const clock=fakeClock(),resolved=[];
 const c=createRoundController({engine,clock,onResolved:(_r,out)=>resolved.push(out)});
 const r=engine.createRound({pairs,order:[0,1,2,3]});c.begin(r);
 assert.equal(c.useClue(),true);
 assert.equal(r.busy,true);
 assert.equal(c.useClue(),false);
 clock.advance(145);
 assert.equal(r.pairs,1);
 assert.equal(c.useClue(),true);
 clock.advance(145);
 assert.equal(r.pairs,2);
 assert.equal(resolved[1].completed,true);
 assert.equal(c.useClue(),false);
});
test('card taps are ignored while a clue request is pending',()=>{
 const c=createRoundController({engine,clock:fakeClock()});
 const r=engine.createRound({pairs});c.begin(r);r.cluePending=true;
 assert.equal(c.select(0).accepted,false);
 assert.equal(r.pk,null);
});
