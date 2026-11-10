import {test,expect} from '@playwright/test';

test('selecting challenge players keeps the popup open and preserves selection',async({page})=>{
 await page.goto('/');
 await page.waitForFunction(()=>typeof window.popcardsProfileChallenges==='function');
 // Supply recipient cards without depending on live account credentials.
 await page.evaluate(()=>{
  document.querySelector('#online-modal')?.remove();
  const modal=document.createElement('div');modal.id='online-modal';modal.className='online-backdrop';
  modal.innerHTML=`<div class="online-sheet"><button data-online="pick-challenge" data-id="friend-a" aria-pressed="false">Alex</button><button data-online="pick-challenge" data-id="friend-b" aria-pressed="false">Bao</button><button data-online="send-selected-challenges">Send challenge</button><p id="challenge-error" role="alert"></p><button data-online="close">Close</button></div>`;
  document.querySelector('#ph').append(modal);
 });
 const alex=page.locator('[data-online="pick-challenge"][data-id="friend-a"]');
 const bao=page.locator('[data-online="pick-challenge"][data-id="friend-b"]');
 const send=page.locator('[data-online="send-selected-challenges"]');
 await expect(send).toBeEnabled();
 await send.click();
 await expect(page.locator('#challenge-error')).toHaveText('Select at least one player to send a challenge');
 // Programmatic clicks also cover touch browsers that do not focus buttons.
 await alex.evaluate(button=>button.click());
 await expect(page.locator('#online-modal')).toBeVisible();
 await expect(alex).toHaveAttribute('aria-pressed','true');
 await expect(send).toBeEnabled();
 await bao.click();
 await expect(send).toContainText('2 selected');
 await alex.click();
 await expect(alex).toHaveAttribute('aria-pressed','false');
 await expect(bao).toHaveAttribute('aria-pressed','true');
 await expect(send).toContainText('1 selected');
 await expect(send).toBeEnabled();
 await bao.click();
 await expect(bao).toHaveAttribute('aria-pressed','false');
 await expect(send).toBeEnabled();
 await alex.click();
 await expect(send).toBeEnabled();
 await expect(send).toContainText('1 selected');
 await page.locator('#online-modal [data-online="close"]').click();
 await expect(page.locator('#online-modal')).toHaveCount(0);
});

test('picker shows Sent badges without the yellow match summary',async({page})=>{
 await page.route('**/src/online/index.js*',async route=>{
  const response=await route.fetch();let code=await response.text();
  code=code.slice(0,code.indexOf('if(db){db.auth.onAuthStateChange'))+`me={id:'me'};people=[{id:'sent',display_name:'Alex',username:'alex'},{id:'fresh',display_name:'Bao',username:'bao'}];requests=people.map(p=>({sender_id:'me',receiver_id:p.id,status:'accepted'}));S.lastMatchWords=[['cat','mèo'],['dog','chó']];challenges=[{sender_id:'me',receiver_id:'sent',pairs:S.lastMatchWords}];S.res={kind:'complete',earned:100,pairs:2,el:20,mis:0,mode:'solo'};S.scr='results';render();})();`;
  await route.fulfill({response,body:code});
 });
 await page.goto('/');await page.locator('[data-a="challengepicker"]').click();
 await expect(page.locator('.challenge-select .challenge-summary')).toHaveCount(0);
 const sent=page.locator('.challenge-select-person[data-id="sent"]');
 await expect(sent.locator('.challenge-sent-badge')).toHaveText('✓ Sent');
 await expect(sent).toBeDisabled();
 const fresh=page.locator('.challenge-select-person[data-id="fresh"]');
 await expect(fresh).toBeEnabled();await fresh.click();
 await expect(fresh).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-online="send-selected-challenges"]')).toBeEnabled();
});
