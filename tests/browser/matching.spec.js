import { test, expect } from '@playwright/test';

async function enterRound(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.PopcardsRoundController && window.PopcardsGameEngine));
  await page.evaluate(() => { startRound('solo'); });
  await expect(page.locator('[data-a="tile"]')).toHaveCount(12);
}

test('the 30-second game completes and opens results', async ({page}) => {
  await enterRound(page);
  await expect(page.locator('#tm')).toContainText('0:30');
  for (let key=0;key<6;key++) {
    const indices=await page.evaluate(k=>S.R.t_.map((t,i)=>t.k===k?i:-1).filter(i=>i>=0),key);
    await page.locator(`[data-a="tile"][data-v="${indices[0]}"]`).click();
    await page.locator(`[data-a="tile"][data-v="${indices[1]}"]`).click();
    await expect.poll(()=>page.evaluate(k=>S.R.t_.filter(t=>t.k===k&&t.d).length,key)).toBe(2);
  }
  await expect(page.locator('.win-cat-overlay')).toBeVisible();
  await expect(page.locator('.win-continue')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>S.scr)).toBe('results');
  await expect.poll(()=>page.evaluate(()=>S.res.kind)).toBe('complete');
});

test('timer continues while round menu is open, then ends at 30 seconds', async ({page}) => {
  await page.clock.install();
  await enterRound(page);
  await page.evaluate(()=>{S.modal='menu';render();});
  await page.clock.fastForward(30000);
  await expect.poll(()=>page.evaluate(()=>S.scr)).toBe('results');
  await expect.poll(()=>page.evaluate(()=>S.res.kind)).toBe('timeout');
  await expect(page.locator('.win-cat-overlay')).toHaveCount(0);
});

test('incorrect pairs recover, and finishing early does not award a win', async ({page}) => {
  await enterRound(page);
  const indices=await page.evaluate(()=>[0,S.R.t_.findIndex(t=>t.k!==S.R.t_[0].k)]);
  await page.locator(`[data-a="tile"][data-v="${indices[0]}"]`).click();
  await page.locator(`[data-a="tile"][data-v="${indices[1]}"]`).click();
  await expect.poll(()=>page.evaluate(()=>S.R.mis)).toBe(1);
  await expect.poll(()=>page.evaluate(()=>S.R.busy)).toBe(false);
  await page.evaluate(()=>finish('ended'));
  await expect.poll(()=>page.evaluate(()=>S.res.kind)).toBe('ended');
});
