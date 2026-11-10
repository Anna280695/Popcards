import {test,expect} from '@playwright/test';

// Screen rendering sweep validates each registered view, including states only
// reachable after a match. Interactions are exercised separately below.
test('every registered application screen renders without an exception',async ({page})=>{
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('/');await page.waitForFunction(()=>!!window.PopcardsRoundController);
 const screens=await page.evaluate(()=>Object.keys(V));
 for(const screen of screens){
  await page.evaluate(screen=>{
   window.PopcardsRoundController.stop();S.modal=null;
   if(screen==='round')startRound('solo');
   else if(screen==='results'&&!S.res){startRound('solo');finish('ended')}
   else S.scr=screen;
   render();
  },screen);
  await expect(page.locator('#ph .ct'),`Screen ${screen}`).not.toBeEmpty();
  await expect(page.locator('#ph button').first(),`Screen ${screen}`).toBeVisible();
 }
 expect(failures).toEqual([]);
});

test('primary menu, profile, friends and word library navigation',async ({page})=>{
 await page.goto('/');await page.waitForFunction(()=>!!window.PopcardsRoundController);
 for(const screen of ['playhome','profile','friends','review']){
  await page.evaluate(screen=>{S.scr='playhome';S.modal=null;render();const action=document.querySelector(`[data-a="go"][data-v="${screen}"]`);if(action)action.click();else {S.scr=screen;render();}},screen);
  await expect.poll(()=>page.evaluate(()=>S.scr)).toBe(screen);
 }
});

test('round menu and game rules can be opened and dismissed',async ({page})=>{
 await page.goto('/');await page.waitForFunction(()=>!!window.PopcardsRoundController);
 await page.evaluate(()=>startRound('solo'));
 await expect(page.locator('[data-a="tile"]')).toHaveCount(12);
 await page.evaluate(()=>{S.modal='menu';render()});
 await expect(page.getByRole('dialog',{name:'Round menu'})).toBeVisible();
 await page.locator('[data-a="openrules"]').click();
 await expect.poll(()=>page.evaluate(()=>S.modal)).toBe('rules');
 await page.locator('[data-a="closerules"]').click();
 await expect.poll(()=>page.evaluate(()=>S.modal)).toBe('menu');
 await page.locator('[data-a="close"]').last().click();
 await expect.poll(()=>page.evaluate(()=>S.modal)).toBe(null);
});
