import { test,expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async({page})=>{
  await page.route('http://127.0.0.1:4173/od-toirog/**',route=>route.continue({url:route.request().url().replace('/od-toirog/','/')}));
});

test('library has six sections and a complete 78-card organized collection',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/od-toirog/library/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-chapters>article')).toHaveCount(6);
  await expect(page.locator('.library-volume strong')).toHaveText('518');
  await page.locator('.library-chapters a[href$="/tarot/"]').click();
  await page.locator('.library-collection-nav a[href$="/collections/tarot/"]').click();
  await expect(page.locator('.library-entry-link')).toHaveCount(78);
  await expect(page.locator('#major .library-entry-link')).toHaveCount(22);
  for(const suit of ['wands','cups','swords','pentacles'])await expect(page.locator(`#${suit} .library-entry-link`)).toHaveCount(14);
  await page.locator('a[href$="/entries/tarot-the-fool/"]').click();
  await expect(page.getByRole('heading',{level:1,name:'The Fool',exact:true})).toBeVisible();
  await expect(page.locator('[data-detail-field="historical_note"]')).toContainText('Waite presents a traveler');
  await expect(page.locator('[data-detail-field="original_interpretation"]')).toContainText('What could I try without abandoning my responsibilities?');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Бичлэгийг JSON татах'}).click();
  const file=await download;
  expect(file.suggestedFilename()).toBe('tarot-the-fool.json');
  const record=JSON.parse(await readFile((await file.path())!,'utf8'));
  expect(record.details.number).toBe(0);
  expect(record.source_refs[0].source_id).toBe('waite-fool');
  expect(record.details.original_interpretation.daily).toContain('small experiment');
  expect(errors).toEqual([]);
});

test('search covers full text, pagination, Mongolian drafts and empty results',async({page})=>{
  await page.goto('/od-toirog/library/search/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-result-count')).toContainText('518 үр дүн');
  await page.getByLabel('Цуглуулга',{exact:true}).selectOption('tarot');
  await expect(page.locator('.library-result-count')).toContainText('78 үр дүн');
  await expect(page.locator('[data-search-results] .library-entry-link')).toHaveCount(24);
  await page.getByRole('button',{name:'Дараах хуудас'}).click();
  await expect(page.locator('.library-result-count')).toContainText('Хуудас 2 / 4');
  await expect(page.locator('[data-search-results] h3').first()).toContainText('Three of Wands');
  await page.getByLabel('Цуглуулга',{exact:true}).selectOption('translation');
  await expect(page.locator('.library-result-count')).toContainText('37 үр дүн');
  await page.getByLabel('Үг, ойлголт, хөзөр эсвэл зохиогч').fill('Сар');
  await expect(page.locator('.library-result-count')).toContainText('1 үр дүн');
  await expect(page.locator('[data-search-results] a[href$="/translation-moon/"]')).toBeVisible();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByLabel('Үг, ойлголт, хөзөр эсвэл зохиогч')).toHaveValue('Сар');
  await expect(page.locator('.library-result-count')).toContainText('1 үр дүн');
  await page.getByLabel('Үг, ойлголт, хөзөр эсвэл зохиогч').fill('no-such-record-zz999');
  await expect(page.getByRole('heading',{name:'Тохирох бичлэг олдсонгүй.'})).toBeVisible();
  await page.getByRole('button',{name:'Шүүлтүүр цэвэрлэх'}).click();
  await expect(page.locator('.library-result-count')).toContainText('518 үр дүн');
  await page.getByLabel('Үг, ойлголт, хөзөр эсвэл зохиогч').fill('twenty focused minutes');
  await expect(page.locator('[data-search-results]')).toContainText('Daily: a spark with a manageable load');
});

test('worked readings link to exact spread and card records',async({page})=>{
  await page.goto('/od-toirog/library/entries/example-relationship-closeness-with-space/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-detail-field="provenance"]')).toContainText('Fictional demonstration');
  await expect(page.locator('[data-detail-field="card_ids"] .library-crosslink')).toHaveCount(3);
  await page.locator('[data-detail-field="spread_title"] a').click();
  await expect(page.getByRole('heading',{level:1,name:'Closeness and space',exact:true})).toBeVisible();
  await expect(page.locator('.library-positions>li')).toHaveCount(3);
  await expect(page.locator('.library-positions')).toContainText('What boundary can be discussed?');
});

test('source grouping and citation scope remain visible and searchable',async({page})=>{
  await page.goto('/od-toirog/library/sources/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-source-group')).toHaveCount(33);
  await page.locator('#waite-pictorial-key summary').click();
  await expect(page.locator('#waite-pictorial-key .library-source-link')).toHaveCount(82);
  await page.goto('/od-toirog/library/sources/unesco-burkhan/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-source-page')).toContainText('Nomination-era heritage description');
  await expect(page.locator('a[href="https://whc.unesco.org/en/list/1440/"]').first()).toBeVisible();
  await expect(page.locator('.library-entry-link')).toHaveCount(6);
  await page.goto('/od-toirog/library/search/?mode=sources',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-result-count')).toContainText('117 үр дүн');
  await page.getByLabel('Эхийн төрөл',{exact:true}).selectOption('scholarly_reference');
  await expect(page.locator('.library-result-count')).toContainText('7 үр дүн');
  await expect(page.locator('[data-search-results] a[href$="/sources/sep-mysticism/"]')).toBeVisible();
});

test('draft labels, full source report, and responsive reading layouts',async({page})=>{
  await page.goto('/od-toirog/library/entries/translation-moon/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.library-draft-note')).toBeVisible();
  await expect(page.locator('[data-detail-field="mongolian_candidate"]')).toContainText('Сар');
  await expect(page.locator('[data-detail-field="review_status"]')).toContainText('Native Mongolian editor required');
  for(const route of ['/library/','/library/entries/tarot-the-fool/','/library/search/','/library/about/']){
    await page.goto(`/od-toirog${route}`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    for(const width of [320,375,768,1440]){
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    }
  }
  await expect(page.locator('.library-markdown')).toContainText('What the research establishes');
  await expect(page.locator('.library-markdown')).toContainText('Recommended build order');
  await page.goto('/od-toirog/library/',{waitUntil:'domcontentloaded'});
  await page.screenshot({path:'test-results/library-desktop.png',fullPage:true});
  await page.goto('/od-toirog/library/entries/tarot-the-fool/',{waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'test-results/library-entry-mobile.png',fullPage:true});
});

test('failed search index download is recoverable',async({page})=>{
  await page.route('**/assets/library/search-index.json',route=>route.abort());
  await page.goto('/od-toirog/library/search/',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Дахин оролдох'})).toBeVisible();
  await page.unroute('**/assets/library/search-index.json');
  await page.getByRole('button',{name:'Дахин оролдох'}).click();
  await expect(page.locator('.library-result-count')).toContainText('518 үр дүн');
});
