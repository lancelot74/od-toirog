import { test, expect } from '@playwright/test';
import { zodiacGuides } from '../../lib/zodiac';

test.beforeEach(async({page})=>{
  await page.route('http://127.0.0.1:4173/od-toirog/**',route=>route.continue({url:route.request().url().replace('/od-toirog/','/')}));
});

for(const sign of zodiacGuides){
  test(`${sign.slug}: supplied artwork, symbols, Mongolian guide and metadata`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(`/od-toirog/zodiac/${sign.slug}/`,{waitUntil:'domcontentloaded'});
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading',{level:1,name:sign.name,exact:true})).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(sign.name));
    const image=page.locator('.zodiac-hero img');
    await expect(image).toHaveAttribute('src',`/od-toirog/assets/zodiac/${sign.slug}.webp`);
    await image.evaluate(el=>(el as HTMLImageElement).decode());
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content',new RegExp(`${sign.slug}\\.webp$`));
    const symbol=page.locator('.zodiac-hero use');
    await expect(symbol).toHaveAttribute('href',`/od-toirog/assets/sprites/zodiac.svg#ot-${sign.slug}`);
    // A matching href alone is insufficient: external <use> must render geometry.
    await expect.poll(()=>symbol.evaluate(el=>(el as SVGGraphicsElement).getBBox().width)).toBeGreaterThan(0);
    const planet=page.locator('.zodiac-facts use').first();
    await expect.poll(()=>planet.evaluate(el=>(el as SVGGraphicsElement).getBBox().width)).toBeGreaterThan(0);
    await expect(page.locator('#relationships')).toContainText(sign.relationships);
    await expect(page.locator('#placements .zodiac-placement')).toHaveCount(3);
    await expect(page.locator('.zodiac-related .zodiac-tile')).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}

test('gallery links to all twelve guides and guides fit mobile',async({page})=>{
  await page.goto('/od-toirog/zodiac/');
  await expect(page.locator('.zodiac-gallery .zodiac-tile')).toHaveCount(12);
  await page.locator('.zodiac-tile[href$="/aquarius/"]').click();
  await expect(page.getByRole('heading',{level:1,name:'Хумх'})).toBeVisible();
  for(const width of [320,375,430,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await page.screenshot({path:'test-results/zodiac-desktop.png',fullPage:true});
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'test-results/zodiac-mobile.png',fullPage:true});
  await page.locator('.zodiac-neighbours a').last().click();
  await expect(page.getByRole('heading',{level:1,name:'Загас'})).toBeVisible();
});
