import {test,expect} from '@playwright/test';

test('Play challenge opens the selected friend match and starts a single timer',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 // Stub only the account transport; exercise the real UI and challenge startup.
 await page.route('**/src/online/index.js*',async route=>{
  const response=await route.fetch();let code=await response.text();
  code=code.replace('const db=configured?window.supabase.createClient(url,key):null;',`const db={rpc:async(name,args)=>{window.challengeCalls=(window.challengeCalls||[]).concat({name,args});return {data:{session:'friend-match',cards:4,seconds:30}}}};`);
  const startup=code.indexOf('if(db){db.auth.onAuthStateChange');
  code=code.slice(0,startup)+`me={id:'me'};profile={display_name:'Alex',username:'alex'};people=[{id:'friend',display_name:'Taylor',username:'taylor'}];challenges=[{id:'friend-match',sender_id:'friend',receiver_id:'me',status:'pending',pairs:[['journey','hành trình'],['weather','thời tiết']],target_score:180,expires_at:new Date(Date.now()+86400000).toISOString()}];S.authenticated=true;S.scr='profile';render();})();`;
  await route.fulfill({response,body:code});
 });
 await page.clock.install();await page.goto('/');
 await page.locator('[data-online="review-play"]').click();
 await expect(page.locator('#online-modal')).toBeVisible();
 await page.locator('[data-online="play"]').click();
 await expect(page.locator('#online-modal')).toHaveCount(0);
 await expect(page.locator('.round-friend-challenge')).toContainText('Challenged by Taylor');
 await expect(page.locator('[data-a="tile"]')).toHaveCount(4);
 await expect(page.locator('#tm')).toHaveText('0:30');
 await expect.poll(()=>page.evaluate(()=>S.R.challengeId)).toBe('friend-match');
 await page.clock.fastForward(1000);
 await expect(page.locator('#tm')).toHaveText('0:29');
 expect(await page.evaluate(()=>window.challengeCalls)).toEqual([{name:'start_competitive_match',args:{p_challenge:'friend-match'}}]);
 expect(errors).toEqual([]);
});

test('a failed challenge start stays visible inside the popup and can be retried',async({page})=>{
 await page.route('**/src/online/index.js*',async route=>{
  const response=await route.fetch();let code=await response.text();
  code=code.replace('const db=configured?window.supabase.createClient(url,key):null;',`const db={rpc:async()=>({error:{code:'PGRST202',message:'Function not found'}})};`);
  code=code.slice(0,code.indexOf('if(db){db.auth.onAuthStateChange'))+`me={id:'me'};profile={display_name:'Alex'};people=[{id:'friend',display_name:'Taylor'}];challenges=[{id:'friend-match',sender_id:'friend',receiver_id:'me',status:'pending',pairs:[['cat','mèo'],['dog','chó']],target_score:100,expires_at:new Date(Date.now()+86400000).toISOString()}];S.authenticated=true;S.scr='profile';render();})();`;
  await route.fulfill({response,body:code});
 });
 await page.goto('/');await page.locator('[data-online="review-play"]').click();
 await page.locator('[data-online="play"]').click();
 await expect(page.locator('#challenge-start-error')).toContainText('run competitive.sql in Supabase');
 await expect(page.locator('#online-modal')).toBeVisible();
 await expect(page.locator('[data-online="play"]')).toBeEnabled();
});
