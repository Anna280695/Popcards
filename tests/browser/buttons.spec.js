import {test,expect} from '@playwright/test';

test('screens and popups use shared button styles with at most one primary action',async({page})=>{
 await page.goto('/?preview');await page.waitForFunction(()=>Boolean(window.popcardsApplyButtons)&&window.popcardsRankingsLoaded);
 const report=await page.evaluate(()=>{
  window.PopcardsRoundController.stop();
  S.R=window.PopcardsGameEngine.createRound({pairs:PAIRS});S.selectedWords=[0,1];S.flashIndex=0;
  const reports=[];
  const inspect=label=>{
   const scope=document.querySelector('.sh')||document.querySelector('.ct');
   const buttons=[...scope.querySelectorAll('[data-button-variant]')];
   reports.push({label,primary:buttons.filter(b=>b.dataset.buttonVariant==='primary').length,wrong:buttons.filter(b=>{const style=getComputedStyle(b);return style.backgroundColor!==({primary:'rgb(31, 31, 33)',yellow:'rgb(255, 250, 102)',white:'rgb(255, 255, 255)'})[b.dataset.buttonVariant]}).map(b=>({text:b.textContent.trim(),variant:b.dataset.buttonVariant,color:getComputedStyle(b).backgroundColor}))});
  };
  for(const screen of Object.keys(V)){S.scr=screen;S.modal=null;render();inspect(screen)}
  S.scr='profile';S.authenticated=true;
  for(const modal of Object.keys(M)){if(modal==='prep')continue;S.modal=modal;render();inspect('popup:'+modal)}
  return reports;
 });
 for(const row of report){expect(row.primary,row.label).toBeLessThanOrEqual(1);expect(row.wrong,row.label).toEqual([])}
});

test('extra primary actions become outlined yellow and results Profile stays yellow',async({page})=>{
 await page.goto('/?preview');await page.waitForFunction(()=>Boolean(window.popcardsApplyButtons)&&window.popcardsRankingsLoaded);
 await page.evaluate(()=>{S.scr='results';S.modal=null;render()});
 await expect(page.locator('.recap-link[data-v="profile"]')).toHaveAttribute('data-button-variant','yellow');
 await page.evaluate(()=>{const modal=document.createElement('div');modal.className='online-sheet';modal.innerHTML='<button class="act">Main action</button><button class="act">Second action</button><button class="online-outline">Cancel</button>';document.querySelector('#ph').append(modal);window.popcardsApplyButtons()});
 await expect(page.locator('.online-sheet [data-button-variant="primary"]')).toHaveCount(1);
 await expect(page.locator('.online-sheet button').nth(1)).toHaveAttribute('data-button-variant','yellow');
 await expect(page.locator('.online-sheet button').nth(2)).toHaveAttribute('data-button-variant','white');
});
