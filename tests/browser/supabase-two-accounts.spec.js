import {test,expect} from '@playwright/test';
const configPresent=Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY && process.env.POPCARDS_QA_USER_A && process.env.POPCARDS_QA_PASS_A && process.env.POPCARDS_QA_USER_B && process.env.POPCARDS_QA_PASS_B);
test('two real Supabase test accounts can authenticate independently',async({browser})=>{
 test.skip(!configPresent,'Requires Supabase project and two dedicated QA accounts in environment variables');
 const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
 try{
  for(let i=0;i<2;i++){
   const page=await contexts[i].newPage();await page.goto('/');
   await page.waitForFunction(()=>typeof window.PopcardsRoundController!=='undefined');
   await page.evaluate(()=>{S.scr='friends';S.modal=null;render()});
   await page.locator('[data-online="login"]').click();
   await page.locator('#online-login [name="email"]').fill(process.env[`POPCARDS_QA_USER_${i?'B':'A'}`]);
   await page.locator('#online-login [name="password"]').fill(process.env[`POPCARDS_QA_PASS_${i?'B':'A'}`]);
   await page.locator('#online-login [value="login"]').click();
   await expect(page.locator('.online-panel')).toContainText('Signed in as', {timeout:15000});
  }
 }finally{await Promise.all(contexts.map(c=>c.close()))}
});
