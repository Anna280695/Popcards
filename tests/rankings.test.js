import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchVerifiedRankings} from '../src/online/services/rankings.js';

function database(result){
 const calls=[];
 const query={select(fields){calls.push(['select',fields]);return this},order(field,options){calls.push(['order',field,options]);return this},async limit(n){calls.push(['limit',n]);return result}};
 return {calls,from(table){calls.push(['from',table]);return query}};
}
test('rankings read account totals and include zero-score players',async()=>{
 const db=database({data:[{id:'a',display_name:'Alice',username:'alice',total_score:240},{id:'b',display_name:'Bob',username:'bob',total_score:0}],error:null});
 const players=await fetchVerifiedRankings(db,'b');
 assert.equal(players.length,2);
 assert.equal(players[0].total,240);
 assert.equal(players[1].total,0);
 assert.equal(players[1].you,true);
 assert.deepEqual(db.calls[0],['from','profiles']);
 assert.deepEqual(db.calls[2],['order','total_score',{ascending:false}]);
});
test('missing total-score column remains a visible setup error',async()=>{
 const error={code:'42703',message:'total_score does not exist'};
 await assert.rejects(fetchVerifiedRankings(database({data:null,error}),'a'),e=>e===error);
});
