import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/app/state/bootstrap.js',import.meta.url),'utf8');
const data=source.slice(source.indexOf('const VOCAB_TIERS='),source.indexOf('const ORIGINAL_EXAMPLES='));
const {tiers,added,examples}=new Function(data+';return {tiers:VOCAB_TIERS,added:MEDIUM_WORD_DATA,examples:WORD_EXAMPLES}')();
test('80 new intermediate pairs are unique and available with usage examples',()=>{
 assert.equal(added.length,80);
 const all=tiers.flat().map(([word])=>word.toLowerCase());
 assert.equal(new Set(all).size,all.length);
 assert.equal(tiers[2].length,110);
 for(const [word,meaning,example] of added){
  assert.ok(word.trim()&&meaning.trim()&&example.trim());
  assert.ok(tiers[2].some(pair=>pair[0]===word&&pair[1]===meaning));
  assert.equal(examples.get(word),example);
  assert.ok(example.toLowerCase().includes(word),word+' example uses the word');
 }
});
