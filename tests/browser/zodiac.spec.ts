import { test, expect } from '@playwright/test';
import { zodiacGuides } from '../../lib/zodiac';

test.beforeEach(async({page})=>{
  await page.route('http://127.0.0.1:4173/od-toirog/**',route=>route.continue({url:route.request().url().replace('/od-toirog/','/')}));
});

for(const sign of zodiacGuides){
  test(`${sign.slug}: full unshaded artwork, planet symbols, guide and metadata`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(`/od-toirog/zodiac/${sign.slug}/`,{waitUntil:'domcontentloaded'});
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading',{level:1,name:sign.name,exact:true})).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(sign.name));
    const image=page.locator('.zodiac-hero img');
    await expect(image).toHaveAttribute('src',`/od-toirog/assets/zodiac/${sign.slug}.webp`);
    await image.evaluate(el=>(el as HTMLImageElement).decode());
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content',new RegExp(`${sign.slug}\\.webp$`));
    await expect(page.locator('use[href*="zodiac.svg"]')).toHaveCount(0);
    for(const width of [320,375,430,768,900,901,1440]){
      await page.setViewportSize({width,height:900});
      await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).currentSrc)).toMatch(width<=900?new RegExp(`/assets/zodiac/mobile/${sign.slug}-\\d+\\.webp$`):new RegExp(`/assets/zodiac/${sign.slug}\\.webp$`));
      await image.evaluate(el=>(el as HTMLImageElement).decode());
      const dimensions=await image.evaluate(el=>{
        const img=el as HTMLImageElement,box=img.getBoundingClientRect();
        return {display:box.width/box.height,original:img.naturalWidth/img.naturalHeight,filter:getComputedStyle(img).filter,opacity:getComputedStyle(img).opacity};
      });
      expect(dimensions.display).toBeCloseTo(dimensions.original,2);
      expect(dimensions.display).toBeCloseTo(width<=900?2/3:8/5,2);
      expect(dimensions.filter).toBe('none');
      expect(dimensions.opacity).toBe('1');
      const layout=await page.locator('.zodiac-hero').evaluate((el,mobile)=>{
        const image=el.querySelector('img')!.getBoundingClientRect();
        const frame=el.getBoundingClientRect();
        const paragraphs=Array.from(el.querySelectorAll<HTMLElement>('.zodiac-hero-copy > *'));
        return {shade:getComputedStyle(el,'::after').content,fullFrame:Math.abs(frame.height-image.height)<=2&&image.left>=-1&&image.right<=innerWidth+1,textFits:paragraphs.every(p=>{
          const box=p.getBoundingClientRect();
          return p.scrollWidth<=p.clientWidth+1&&box.top>=image.top&&box.bottom<=image.top+image.height*(mobile ? 0.32 : 1)+1&&box.right<=image.left+image.width*(mobile ? 0.93 : 0.48);
        })};
      },width<=900);
      expect(['none','normal']).toContain(layout.shade);
      expect(layout.textFits).toBe(true);
      expect(layout.fullFrame).toBe(true);
    }
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
  await expect.poll(()=>page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).currentSrc)).toMatch(/\/assets\/zodiac\/aquarius\.webp$/);
  await page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).decode());
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:'test-results/zodiac-desktop.png',fullPage:true});
  await page.setViewportSize({width:375,height:812});
  await expect.poll(()=>page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).currentSrc)).toMatch(/\/assets\/zodiac\/mobile\/aquarius-\d+\.webp$/);
  await page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).decode());
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:'test-results/zodiac-mobile.png',fullPage:true});
  await page.locator('.zodiac-neighbours a').last().click();
  await expect(page.getByRole('heading',{level:1,name:'Загас'})).toBeVisible();
});
