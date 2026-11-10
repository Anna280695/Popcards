import test from 'node:test';
import assert from 'node:assert/strict';
import {loadOptionalFeature, setupMessage} from '../src/online/services/setup.js';

test('missing optional migration does not reject account initialization', async()=>{
 const error={code:'PGRST202',message:'Function not found'};
 let reported;
 const results=await Promise.all([
  Promise.resolve('friends loaded'),
  loadOptionalFeature(async()=>{throw error},e=>{reported=e})
 ]);
 assert.deepEqual(results,['friends loaded',null]);
 assert.equal(reported,error);
 assert.match(setupMessage(reported,'rankings.sql'),/run rankings.sql/);
});
test('optional feature success preserves its data',async()=>{
 const data=[{total:42}];
 assert.equal(await loadOptionalFeature(async()=>data,()=>assert.fail('unexpected error')),data);
});
test('network and permission errors remain visible without migration advice',()=>{
 assert.equal(setupMessage({code:'42501',message:'Permission denied'},'rankings.sql'),'Permission denied');
 assert.equal(setupMessage({message:'Failed to fetch'},'rankings.sql'),'Failed to fetch');
});
