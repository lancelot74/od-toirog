import { test,expect } from '@playwright/test';

test.use({viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true});
test.beforeEach(async({page})=>{
  await page.route('http://127.0.0.1:4173/od-toirog/**',route=>route.continue({url:route.request().url().replace('/od-toirog/','/')}));
});

test('mobile hero uses one portrait source and keeps header, text and CTA above the artwork',async({page})=>{
  const images:string[]=[];
  page.on('request',request=>{if(request.resourceType()==='image'||request.url().includes('animation'))images.push(request.url());});
  await page.goto('/od-toirog/',{waitUntil:'domcontentloaded'});
  const image=page.locator('.landscape-picture img');
  await image.evaluate(el=>(el as HTMLImageElement).decode());
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.landscape-art iframe')).toHaveCount(0);
  await expect(page.locator('.motion-toggle')).toHaveCount(0);
  await expect(page.locator('.hero-intro-desktop')).toBeHidden();
  await expect(page.locator('.hero-intro-mobile')).toBeVisible();
  for(const width of [320,375,430,600,768,900]){
    await page.setViewportSize({width,height:932});
    await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).currentSrc)).toMatch(/\/assets\/illustration\/mobile\/hero-\d+\.webp$/);
    await image.evaluate(el=>(el as HTMLImageElement).decode());
    const layout=await page.evaluate(()=>{
      const img=document.querySelector<HTMLImageElement>('.landscape-picture img')!;
      const frame=img.getBoundingClientRect();
      const content=[...document.querySelectorAll<HTMLElement>('.hero-copy h1,.hero-copy .lead,.hero-actions>.button,.home-page>.site-header .brand,.home-page>.site-header>.button')];
      return {ratio:frame.width/frame.height,sourceRatio:img.naturalWidth/img.naturalHeight,width:frame.width,viewport:innerWidth,
        content:content.map(el=>{const rect=el.getBoundingClientRect();return {label:el.textContent?.trim().slice(0,30),fits:el.scrollWidth<=el.clientWidth+1&&rect.top>=frame.top&&rect.bottom<=frame.top+frame.height*.35+1};}),
        buttonHeight:document.querySelector('.hero-actions>.button')!.getBoundingClientRect().height,
        shade:getComputedStyle(document.querySelector('.landscape-art')!,'::after').display,
        overflow:document.documentElement.scrollWidth>innerWidth,
        followupAfter:document.querySelector('.mobile-hero-followup')!.getBoundingClientRect().top>=frame.bottom-1};
    });
    expect(layout.ratio).toBeCloseTo(9/16,2);
    expect(layout.ratio).toBeCloseTo(layout.sourceRatio,2);
    expect(layout.width).toBeCloseTo(layout.viewport,0);
    expect(layout.content.filter(c=>!c.fits)).toEqual([]);
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(layout.shade).toBe('none');
    expect(layout.followupAfter).toBe(true);
    expect(layout.overflow).toBe(false);
  }
  expect(images.some(url=>url.endsWith('/assets/illustration/hero.webp'))).toBe(false);
  expect(images.some(url=>url.includes('animation'))).toBe(false);
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'test-results/mobile-hero-composition.png'});
});

test('mobile gallery uses all twelve uncropped portrait paintings with names in their sky zones',async({page})=>{
  const requested:string[]=[];
  page.on('request',r=>{if(r.resourceType()==='image')requested.push(r.url());});
  await page.goto('/od-toirog/zodiac/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const tiles=page.locator('.zodiac-tile');
  await expect(tiles).toHaveCount(12);
  for(const tile of await tiles.all()){
    await tile.scrollIntoViewIfNeeded();
    await tile.locator('img').evaluate(el=>(el as HTMLImageElement).decode());
    const bounds=await tile.evaluate(el=>{
      const img=el.querySelector<HTMLImageElement>('img')!,box=img.getBoundingClientRect(),title=el.querySelector('h3')!.getBoundingClientRect();
      return {src:img.currentSrc,ratio:box.width/box.height,sourceRatio:img.naturalWidth/img.naturalHeight,clear:title.top>=box.top&&title.bottom<=box.top+box.height*.32};
    });
    expect(bounds.src).toMatch(/\/assets\/zodiac\/mobile\//);
    expect(bounds.ratio).toBeCloseTo(2/3,2);
    expect(bounds.ratio).toBeCloseTo(bounds.sourceRatio,2);
    expect(bounds.clear).toBe(true);
  }
  expect(requested.some(url=>/\/assets\/zodiac\/[^/]+-thumb\.webp$/.test(url))).toBe(false);
  await page.goto('/od-toirog/zodiac/aries/',{waitUntil:'domcontentloaded'});
  await page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).decode());
  await expect(page.locator('.workspace-nav a:visible')).toHaveCount(3);
  await expect(page.locator('.mobile-nav a:visible')).toHaveCount(4);
  expect(await page.locator('.workspace-nav').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(70);
  await page.screenshot({path:'test-results/mobile-aries-composition.png'});
  await page.goto('/od-toirog/zodiac/gemini/',{waitUntil:'domcontentloaded'});
  await page.locator('.zodiac-hero img').evaluate(el=>(el as HTMLImageElement).decode());
  await page.screenshot({path:'test-results/mobile-gemini-composition.png'});
});
