import { test, expect, type Page } from '@playwright/test';

// Static export is served at /od-toirog in production. The test server maps
// that prefix back to its root without changing any generated URLs.
async function pagesPath(page:Page){
  await page.route('http://127.0.0.1:4173/od-toirog/**',route=>route.continue({url:route.request().url().replace('/od-toirog/','/')}));
}
const profile={id:'00000000-0000-0000-0000-000000000001',user_id:'00000000-0000-0000-0000-000000000010',name:'Тест',birth_date:'2000-01-01',birth_time:'12:00:00',birth_time_known:true,birth_city:'Ulaanbaatar',birth_country:'Mongolia',latitude:47.92,longitude:106.92,timezone:'Asia/Ulaanbaatar',utc_birth_datetime:'2000-01-01T04:00:00Z',is_primary:true,time_fold:0};
const chart={planets:[{id:0,name:'Нар',longitude:280.03,degree:10.03,sign:9,house:10,retrograde:false,uncertain:false},{id:1,name:'Сар',longitude:219,degree:9,sign:7,house:8,retrograde:false,uncertain:false}],houses:Array.from({length:12},(_,i)=>i*30),ascendant:0,midheaven:270,aspects:[],utc:'2000-01-01T04:00:00Z',ephemeris:'Swiss',house_system:'Placidus',notice:'',readings:[{key:'planet_0_sign_9',headline:'Нар — Матар',summary:'Тооцоолсон байрлал.',strengths:[],challenges:[],relationships:[],source:'calculation',status:'facts'}]};
async function signedIn(page:Page,hasProfile=true){
  await pagesPath(page);
  await page.addInitScript(({user_id})=>{
    const exp=Math.floor(Date.now()/1000)+3600;
    const token=[btoa(JSON.stringify({alg:'HS256',typ:'JWT'})),btoa(JSON.stringify({sub:user_id,exp,role:'authenticated',aud:'authenticated'})),'test-signature'].join('.');
    localStorage.setItem('sb-od-test-auth-token',JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id:user_id,aud:'authenticated',role:'authenticated',email:'test@example.invalid',app_metadata:{},user_metadata:{},created_at:'2000-01-01T00:00:00Z'}}));
  },{user_id:profile.user_id});
  await page.route('https://od-test.supabase.co/**',route=>{
    const url=route.request().url();
    if(url.includes('/auth/v1/user'))return route.fulfill({json:{id:profile.user_id,email:'test@example.invalid',app_metadata:{}}});
    if(url.includes('/rest/v1/birth_profiles'))return route.fulfill({json:hasProfile?[profile]:[]});
    return route.fulfill({json:{}});
  });
  await page.route('https://api.od-test.invalid/**',route=>{
    const url=route.request().url();
    if(url.includes('/charts/'))return route.fulfill({json:chart});
    if(url.includes('/today/'))return route.fulfill({json:{date:'2026-09-10',chart,transits:[],readings:[],areas:{'Хайр':[],'Ажил':[],'Сэтгэл':[],'Харилцаа':[]},model_version:'facts',prompt_version:'none',knowledge_version:'none'}});
    if(url.includes('/locations?'))return route.fulfill({json:[{name:'Ulaanbaatar',country:'Mongolia',latitude:47.92,longitude:106.92,timezone:'Asia/Ulaanbaatar'}]});
    if(url.endsWith('/profiles'))return route.fulfill({json:profile});
    return route.fulfill({json:{}});
  });
}

test('public pages, artwork, and narrow layouts work without console errors',async({page})=>{
  await pagesPath(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/od-toirog/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Таны төрсөн мөчийн');
  await expect(page.locator('.landscape-art iframe')).toHaveCount(0);
  for(const width of [320,375,430,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  // Scroll lazy-loaded gallery paintings into view before checking their pixels.
  for(const image of await page.locator('img').all()){
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(el=>el instanceof HTMLImageElement?el.decode():Promise.resolve());
  }
  const images=await page.locator('img').evaluateAll(images=>images.every(img=>img instanceof HTMLImageElement&&img.complete&&img.naturalWidth>0));
  expect(images).toBeTruthy();
  await page.screenshot({path:'test-results/landing-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Нэвтрэх',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toContainText('Буцаж ирсэнд');
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'test-results/auth-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Нууц үгээ мартсан уу?'}).click();
  await expect(page.getByRole('button',{name:'Холбоос илгээх'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Google authorization uses the deployment-prefixed callback',async({page})=>{
  await pagesPath(page);
  await page.route('https://od-test.supabase.co/auth/v1/authorize**',route=>route.fulfill({body:'Google redirect target'}));
  await page.goto('/od-toirog/auth/');
  await page.getByRole('button',{name:'Google-ээр үргэлжлүүлэх'}).click();
  await page.waitForURL('https://od-test.supabase.co/auth/v1/authorize**');
  expect(new URL(page.url()).searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/od-toirog/auth/');
  expect(new URL(page.url()).searchParams.get('code_challenge')).toBeTruthy();
});

test('supplied wheel animation starts and can be paused',async({page})=>{
  await pagesPath(page);
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/od-toirog/');
  const frame=page.frameLocator('.landscape-art iframe');
  await expect(frame.locator('.artwork.ready')).toBeVisible();
  await expect(frame.locator('#error')).toBeHidden();
  await page.getByRole('button',{name:'Хөдөлгөөнийг зогсоох'}).click();
  await expect(page.locator('.landscape-art iframe')).toHaveCount(0);
});

test('private chart renders backend data and produces a real PNG',async({page})=>{
  await signedIn(page);
  await page.goto('/od-toirog/chart/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Тест');
  await expect(page.locator('.real-chart use[href*="zodiac.svg"]')).toHaveCount(0);
  await expect(page.locator('.real-chart .zodiac-chart-label')).toHaveCount(12);
  await expect(page.locator('.real-chart .zodiac-chart-label').first()).toHaveText('Хонь');
  await expect(page.locator('.real-chart .zodiac-chart-label').last()).toHaveText('Загас');
  await expect(page.locator('.real-chart use[href*="planet.svg"]')).toHaveCount(2);
  await expect(page.locator('.zodiac-portrait img')).toHaveAttribute('src',/capricorn-thumb\.webp$/);
  await page.getByRole('button',{name:/Сар Хилэнц/}).click();
  await expect(page.getByRole('heading',{name:'Сар',exact:true})).toBeVisible();
  await expect(page.locator('.zodiac-portrait img')).toHaveAttribute('src',/scorpio-thumb\.webp$/);
  await page.locator('.real-chart').screenshot({path:'test-results/chart-zodiac-names.png'});
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'PNG татах'}).click();
  expect((await download).suggestedFilename()).toBe('od-toirog.png');
});

test('five steps preserve unknown time and selected city into the request',async({page})=>{
  await signedIn(page,false);
  let saved:Record<string,unknown>={};
  await page.route('https://api.od-test.invalid/profiles',route=>{saved=route.request().postDataJSON();return route.fulfill({json:profile});});
  await page.goto('/od-toirog/onboarding/');
  await page.getByRole('textbox',{name:'Нэр',exact:true}).fill('Тест');
  await page.getByRole('button',{name:'Үргэлжлүүлэх'}).click();
  await page.getByLabel('Төрсөн огноо',{exact:true}).fill('2000-01-01');
  await page.getByRole('button',{name:'Үргэлжлүүлэх'}).click();
  await page.getByRole('checkbox').check();
  await expect(page.getByText(/12:00 цагийг лавлах/)).toBeVisible();
  await page.getByRole('button',{name:'Үргэлжлүүлэх'}).click();
  await page.getByLabel('Хот / аймаг / улс').fill('Улаанбаатар');
  await page.getByRole('button',{name:'Хайх',exact:true}).click();
  await page.getByRole('button',{name:/Ulaanbaatar, Mongolia/}).click();
  await page.getByRole('button',{name:'Үргэлжлүүлэх'}).click();
  await expect(page.getByText('Мэдээллээ шалгах',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Хадгалаад зургаа нээх'}).click();
  await page.waitForURL('**/chart/**');
  expect(saved.birth_time_known).toBe(false);
  expect(saved.birth_time).toBeNull();
  expect(saved.place).toMatchObject({timezone:'Asia/Ulaanbaatar'});
});

test('network failure offers a retry and anonymous access does not fetch charts',async({page})=>{
  await pagesPath(page);
  await page.goto('/od-toirog/chart/');
  await expect(page.getByRole('link',{name:'Нэвтрэх',exact:true})).toBeVisible();
  await signedIn(page);
  await page.route('https://api.od-test.invalid/charts/**',route=>route.abort());
  await page.reload();
  await expect(page.getByRole('button',{name:'Дахин оролдох'})).toBeVisible();
});

test('a returning account opens today and account deletion is confirmed',async({page})=>{
  await signedIn(page);
  await page.goto('/od-toirog/auth/');
  await page.waitForURL('**/today/');
  await expect(page.getByRole('heading',{level:1})).toContainText('өнөөдрийн тэнгэр');
  await page.goto('/od-toirog/profile/');
  await page.getByText('Бүртгэлээ бүрмөсөн устгах',{exact:true}).click();
  await expect(page.getByRole('button',{name:'Бүрмөсөн устгах'})).toBeDisabled();
  await page.getByLabel('Баталгаажуулахын тулд УСТГАХ гэж бичнэ үү').fill('УСТГАХ');
  const deletion=page.waitForRequest(r=>r.url()==='https://api.od-test.invalid/account'&&r.method()==='DELETE');
  await page.getByRole('button',{name:'Бүрмөсөн устгах'}).click();
  await deletion;
  await page.waitForURL('**/od-toirog/');
});

test('two saved profiles reach a deterministic compatibility result',async({page})=>{
  await signedIn(page);
  const other={...profile,id:'00000000-0000-0000-0000-000000000002',name:'Хоёр дахь'};
  await page.route('https://od-test.supabase.co/rest/v1/birth_profiles**',route=>route.fulfill({json:[profile,other]}));
  await page.route('https://api.od-test.invalid/compatibility',route=>route.fulfill({json:{first_name:profile.name,second_name:other.name,first_chart:chart,second_chart:chart,aspects:[],readings:[],meaning:'Харилцааны амжилтын хувь биш.',categories:{'Сэтгэл':{prominence:0,aspects:[]}}}}));
  await page.goto('/od-toirog/compatibility/');
  await page.getByRole('button',{name:'Харьцуулах',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Тест + Хоёр дахь'})).toBeVisible();
  await expect(page.getByText('Холбоосын идэвх: 0/100')).toBeVisible();
});
