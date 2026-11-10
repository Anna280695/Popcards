import {test,expect} from '@playwright/test';

const emailA=process.env.POPCARDS_QA_USER_A;
const passwordA=process.env.POPCARDS_QA_PASS_A;
const emailB=process.env.POPCARDS_QA_USER_B;
const passwordB=process.env.POPCARDS_QA_PASS_B;
const ready=Boolean(emailA&&passwordA&&emailB&&passwordB);

test.describe.serial('Supabase social flows',()=>{
 test.skip(!ready,'Requires two dedicated Supabase QA accounts: POPCARDS_QA_USER_A/PASS_A and POPCARDS_QA_USER_B/PASS_B');

 async function login(page,email,password){
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.PopcardsRoundController));
  await page.evaluate(()=>{S.scr='friends';S.modal=null;render()});
  if(await page.locator('[data-online="login"]').count())await page.locator('[data-online="login"]').click();
  await page.locator('#online-login [name="email"]').fill(email);
  await page.locator('#online-login [name="password"]').fill(password);
  await page.locator('#online-login [value="login"]').click();
  await expect.poll(()=>page.evaluate(()=>({authenticated:Boolean(S.authenticated),signedIn:Boolean(document.querySelector('.online-panel')?.textContent?.includes('Signed in as')),message:document.querySelector('#toast')?.textContent?.trim()||''})),{timeout:15000,message:'Supabase login did not complete; inspect the reported message for credentials, email confirmation, profiles table, or RLS configuration.'}).toMatchObject({authenticated:true,signedIn:true});
  await expect(page.locator('.online-panel').first()).toContainText('Signed in as');
 }

 async function openFriends(page){
  await page.evaluate(()=>{S.scr='friends';S.modal=null;render()});
  await expect(page.locator('.friend-add-card')).toBeVisible();
 }

 async function accountUsername(browser,email,password){
  const context=await browser.newContext();
  const page=await context.newPage();
  try{
   await login(page,email,password);
   await page.evaluate(()=>{S.scr='profile';S.modal=null;render()});
   return (await page.locator('.my-player-handle').textContent()).trim().replace(/^@/,'');
  }finally{await context.close()}
 }

 test('logs in with a dedicated QA account',async({page})=>{
  await login(page,emailA,passwordA);
  await expect(page.locator('.online-panel').first()).toContainText('Signed in as');
 });

 test('edits and restores the profile',async({page})=>{
  await login(page,emailA,passwordA);
  await page.evaluate(()=>{S.scr='profile';S.modal=null;render()});
  const originalName=await page.locator('.my-v4-hero h3').textContent();
  const originalUsername=await page.locator('.my-player-handle').textContent();
  await page.getByRole('button',{name:'Edit profile'}).click();
  const editedName=`${originalName} QA`;
  const temporaryUsername=`${originalUsername.replace(/^@/,'').slice(0,14)}${Date.now().toString().slice(-5)}`.slice(0,20);
  await page.locator('#online-profile [name="display_name"]').fill(editedName.slice(0,40));
  await page.locator('#online-profile [name="username"]').fill(temporaryUsername);
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.locator('.my-v4-hero h3')).toContainText(editedName.slice(0,40));
  await page.getByRole('button',{name:'Edit profile'}).click();
  await page.locator('#online-profile [name="display_name"]').fill(originalName.trim());
  await page.locator('#online-profile [name="username"]').fill(originalUsername.replace(/^@/,''));
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.locator('.my-v4-hero h3')).toContainText(originalName.trim());
 });

 test('adds account B as a friend from account A',async({page,browser})=>{
  await login(page,emailA,passwordA);await openFriends(page);
  const usernameB=await accountUsername(browser,emailB,passwordB);
  const relationship=page.locator('.friends-page').getByText(`@${usernameB}`,{exact:true});
  if(await relationship.count())return;
  await page.locator('#online-find').fill(usernameB);
  await page.locator('[data-online="request"]').first().click();
  await expect(page.locator('.friends-page')).toContainText(/Pending requests|Waiting for @/i,{timeout:15000});
 });

 test('accepts the friend request from account B',async({page,browser})=>{
  await login(page,emailB,passwordB);await openFriends(page);
  const usernameA=await accountUsername(browser,emailA,passwordA);
  const request=page.locator('.online-item').filter({hasText:`@${usernameA}`}).filter({has:page.locator('button[data-online="accept"]')}).first();
  if(await request.count()){
   await request.locator('[data-online="accept"]').click();
   await expect(page.locator('.friends-page')).not.toContainText('Friend requests · 1',{timeout:15000});
  }
  await expect(page.locator('.friends-page')).toContainText(/My friends · [1-9]/);
 });

 test('sends a challenge to an accepted friend',async({page})=>{
  await login(page,emailA,passwordA);await openFriends(page);
  await page.evaluate(()=>{S.lastMatchWords=[['alpha','alpha'],['beta','beta']];S.stats.best=100;});
  const challenge=page.locator('[data-online="challenge"]').first();
  await expect(challenge).toBeVisible();
  await challenge.click();
  await expect(page.locator('#toast')).toContainText('Real challenge sent!',{timeout:15000});
 });
});
