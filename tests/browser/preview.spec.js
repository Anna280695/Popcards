import {test,expect} from '@playwright/test';

test('preview has sample rankings and does not overwrite saved account progress',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?preview');
 await expect(page.locator('.lbv-player')).toHaveCount(8);
 await expect(page.locator('.lbv-player.is-you')).toContainText('Jamie Park');
 await page.locator('[data-a="lbscope"][data-v="friends"]').click();
 await expect(page.locator('.lbv-player')).toHaveCount(5);
 const before=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
 await page.evaluate(()=>{S.playerScore+=100;persist();S.scr='results';render()});
 await expect(page.locator('.round-recap')).toBeVisible();
 await page.getByRole('button',{name:'Choose a friend'}).click();
 await expect(page.getByRole('dialog',{name:'Challenge friends'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
 expect(errors).toEqual([]);
});

test('leaving a match shows results instead of the leaderboard',async({page})=>{
 await page.goto('/?preview');
 await expect(page.locator('.lbv-player')).toHaveCount(8);
 await page.evaluate(()=>startRound('solo'));
 await expect(page.locator('[data-a="tile"]')).toHaveCount(12);
 await page.locator('[data-a="modal"][data-v="menu"]').click();
 await page.locator('[data-a="end"]').click();
 await expect(page.locator('.round-recap')).toBeVisible();
 await expect(page.locator('.lbv')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>S.res.kind)).toBe('ended');
});


test('automatic rank overlay animates movement and closes without a click',async({page})=>{
 await page.goto('/?preview');
 await expect(page.locator('.lbv-player')).toHaveCount(8);
 await page.evaluate(()=>{S.scr='results';render();const players=window.popcardsVerifiedRankings;window.popcardsShowRankUpdate(6,4,players)});
 await expect(page.locator('.rank-update-overlay.rank-up')).toBeVisible();
 await expect(page.locator('.rank-update-overlay')).toContainText('Up 2 places!');
 await expect(page.locator('.rank-update-overlay button')).toHaveCount(0);
 await expect(page.locator('.rank-update-overlay')).toHaveCount(0,{timeout:6000});
 await expect(page.locator('.round-recap')).toBeVisible();
 await page.evaluate(()=>window.popcardsShowRankUpdate(2,4,window.popcardsVerifiedRankings));
 await expect(page.locator('.rank-update-overlay.rank-down')).toContainText('Down 2 places');
});

test('level up animates inside matching without a blocking dialog',async({page})=>{
 await page.goto('/?preview');
 await expect(page.locator('.lbv-player')).toHaveCount(8);
 await page.evaluate(()=>{S.playerScore=LEVEL_STEP-1;startRound('solo')});
 await expect(page.locator('[data-a="tile"]')).toHaveCount(12);
 const indices=await page.evaluate(()=>S.R.t_.map((t,i)=>t.k===0?i:-1).filter(i=>i>=0));
 for(const i of indices)await page.locator(`[data-a="tile"][data-v="${i}"]`).click();
 await expect(page.locator('.match-level-up')).toContainText('Level 2!');
 await expect(page.locator('.level-cheer')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>S.scr)).toBe('round');
 await expect(page.locator('.match-level-up')).not.toBeVisible({timeout:4000});
});
