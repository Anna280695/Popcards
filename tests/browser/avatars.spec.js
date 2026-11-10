import {test,expect} from '@playwright/test';

test('new activity avatars can be selected and saved from online Edit profile',async({page})=>{
 await page.route('**/src/online/index.js*',async route=>{
  const response=await route.fetch();let code=await response.text();
  code=code.replace('const db=configured?window.supabase.createClient(url,key):null;',`const db={from:()=>({update:()=>({eq:()=>({select:()=>({single:async()=>({data:{id:'me',display_name:'Alex',username:'alex'}})})})})})};`);
  code=code.slice(0,code.indexOf('if(db){db.auth.onAuthStateChange'))+`me={id:'me'};profile={display_name:'Alex',username:'alex'};S.authenticated=true;S.profile.name='Alex';S.profile.handle='@alex';S.scr='profile';render();})();`;
  await route.fulfill({response,body:code});
 });
 await page.goto('/');await page.locator('[data-a="editprofile"]').click();
 await expect(page.locator('.profile-avatar-option')).toHaveCount(22);
 const choice=page.getByRole('radio',{name:'Peekaboo',exact:true});await choice.click();
 await expect(choice).toHaveAttribute('aria-checked','true');
 await expect(page.locator('#online-profile [name="display_name"]')).toHaveValue('Alex');
 await page.locator('#online-profile button[type="submit"]').click();
 await expect(page.locator('#online-modal')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>S.profile.avatar)).toBe(17);
 await expect(page.locator('.profile-hero-v6 .my-v4-mascot use')).toHaveAttribute('href','#c17');
});
