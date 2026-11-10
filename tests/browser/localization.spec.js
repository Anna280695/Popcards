import {test,expect} from '@playwright/test';
test('all supported locales persist and all screens render',async ({page})=>{
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('/');await page.waitForFunction(()=>!!window.PopcardsRoundController);
 const languages=await page.evaluate(()=>PopcardsI18n.choices().map(x=>x.code));
 const screens=await page.evaluate(()=>Object.keys(V));
 for(const language of languages){
  await page.evaluate(lang=>PopcardsI18n.set(lang),language);
  expect(await page.evaluate(()=>document.documentElement.lang)).toBe(language);
  for(const screen of screens){
   await page.evaluate(screen=>{
    window.PopcardsRoundController.stop();S.modal=null;
    if(screen==='round')startRound('solo');
    else if(screen==='results'&&!S.res){startRound('solo');finish('ended')}
    else S.scr=screen;
    render();
   },screen);
   await expect(page.locator('#ph .ct'),`${language}: ${screen}`).not.toBeEmpty();
  }
 }
 expect(failures).toEqual([]);
});
test('language preference survives reload and fallback diagnostics are available',async ({page})=>{
 await page.goto('/');await page.waitForFunction(()=>!!window.PopcardsRoundController);
 await page.evaluate(()=>PopcardsI18n.set('vi'));
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>PopcardsI18n.get())).toBe('vi');
 const diagnostics=await page.evaluate(()=>PopcardsI18n.coverage());
 expect(diagnostics).toBeTruthy();
});
