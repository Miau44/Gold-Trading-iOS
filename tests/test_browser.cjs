const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
// Playwright solo se utiliza para pruebas; no forma parte de la PWA publicada.
const engine = process.env.PWA_BROWSER || 'chromium';
const browser = require(process.env.PWA_PLAYWRIGHT_MODULE || 'playwright')[engine];
assert.ok(browser, `Motor desconocido: ${engine}`);
const base=(process.env.PWA_TEST_URL || 'http://127.0.0.1:8080/').replace(/\/?$/, '/');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'gold-pwa-profile-'));
const screenshots=path.join(os.tmpdir(),'gold-pwa-audit-'+engine);
fs.mkdirSync(screenshots,{recursive:true});
const options={headless:true,viewport:{width:440,height:956},isMobile:true,deviceScaleFactor:3,hasTouch:true};
async function login(page,password='admin123') {
 await page.locator('#username').fill('admin');
 await page.locator('#password').fill(password);
 await page.locator('#login-btn').click();
 await page.locator('#app-view').waitFor({state:'visible'});
}
const errors=[],external=[];
let goldApiRequests=0;
async function mockGoldApi(context){
 await context.route('https://api.gold-api.com/price/XAU',route=>{
  goldApiRequests++;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({symbol:'XAU',price:2400.23,updatedAt:new Date().toISOString()})});
 });
}
function observe(context){
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 context.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('https://api.gold-api.com/'))external.push(request.url());});
}
(async()=>{
 let context=await browser.launchPersistentContext(profile,options);
 await mockGoldApi(context);
 observe(context);
 let page=context.pages()[0];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 assert.equal(await page.evaluate(async()=>{await navigator.serviceWorker.ready;return !!navigator.serviceWorker.controller;}),true);
 assert.equal(await page.evaluate(async()=>{const cache=await caches.open('goldtrading-offline-v8');return (await cache.keys()).length;}),10);
 await login(page);
 assert.equal(await page.locator('.calculate-btn').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 204, 0)');
 assert.equal(await page.locator('.calculate-btn').evaluate(el=>getComputedStyle(el).color),'rgb(17, 17, 17)');
 assert.equal(await page.locator('.reference-price').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 204, 0)');
 await page.waitForFunction(()=>document.querySelector('#real-quote-main').textContent==='$2400.23');
 assert.equal(await page.locator('#real-quote-reference').textContent(),'$2400.23');
 assert.equal(await page.locator('#ounce').inputValue(),'2400,23');
 assert.equal(await page.locator('#reference-ounce').inputValue(),'2400,23');
 const visual=Number((await page.locator('#visual-quote-main').textContent()).replace('$',''));
 assert.ok(Math.abs(visual-2400.23)<=1.000001);
 assert.equal(await page.locator('#visual-quote-reference').textContent(),await page.locator('#visual-quote-main').textContent());
 let previousVisual=visual;
 for(let i=0;i<3;i++){
  await page.waitForTimeout(2100);
  const nextVisual=Number((await page.locator('#visual-quote-main').textContent()).replace('$',''));
  assert.ok(Math.abs(nextVisual-2400.23)<=1.000001);
  assert.notEqual(nextVisual,previousVisual);
  previousVisual=nextVisual;
 }
 assert.equal(goldApiRequests,1,'La simulación no debe generar solicitudes a Gold-API');
 const actualResult=await page.evaluate(()=>GoldMath.formatBolivia(GoldMath.calculate({ounceUSD:2400.23,discount:GoldMath.parseNumber(document.querySelector('#discount').value),exchangeRate:GoldMath.parseNumber(document.querySelector('#exchange').value),ley:GoldMath.parseNumber(document.querySelector('#ley').value)}).unitBOB));
 assert.equal(await page.locator('#unit-bob').textContent(),actualResult);
 const expectedTable=await page.evaluate(()=>GoldMath.formatBolivia(GoldMath.referencePrices({ounceUSD:2400.23,exchangeRate:GoldMath.parseNumber(document.querySelector('#reference-exchange').value),discount:GoldMath.parseNumber(document.querySelector('#reference-discount').value)})[0].priceBOB));
 assert.equal(await page.locator('.reference-price').first().textContent(),expectedTable);
 assert.equal(await page.locator('.reference-price').count(),50);
 for(const width of [320,375,393,440,480,768,956]){
  await page.setViewportSize({width,height:width===956?440:956});
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,body:document.body.scrollWidth}));
  assert.ok(dimensions.scroll<=dimensions.width && dimensions.body<=dimensions.width,JSON.stringify({width,...dimensions}));
  await page.screenshot({path:path.join(screenshots,`layout-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:440,height:956});
 await page.locator('#nav-settings').click();
 await page.locator('#theme-choice').selectOption('dark');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 assert.equal(await page.locator('.calculator-card').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(34, 40, 48)');
 assert.equal(await page.evaluate(()=>localStorage.getItem('goldtrading.theme.v1')),'dark');
 await page.locator('#setting-ounce').fill('2500');
 await page.locator('#preferences-form button[type=submit]').click();
 await page.locator('#preferences-success').waitFor({state:'visible'});
 await page.locator('#current-password').fill('admin123');
 await page.locator('#new-password').fill('GoldAudit2026!');
 await page.locator('#confirm-password').fill('GoldAudit2026!');
 await page.locator('#password-btn').click();
 await page.locator('#password-success').waitFor({state:'visible'});
 await page.locator('#nav-calculator').click();
 const expected=await page.locator('#unit-bob').textContent();
 await context.setOffline(true);
 await page.reload();
 await login(page,'GoldAudit2026!');
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 assert.equal(await page.locator('#visual-quote-main').textContent(),'Suspendida');
 assert.equal(await page.locator('#real-quote-main').textContent(),'$2400.23');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await context.close();
 context=await browser.launchPersistentContext(profile,options);
 await mockGoldApi(context);
 observe(context);
 await context.setOffline(true);
 page=context.pages()[0];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await login(page,'GoldAudit2026!');
 assert.equal(await page.locator('#ounce').inputValue(),'2400,23');
 assert.equal(await page.locator('#ounce').getAttribute('readonly') !== null,true);
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 await page.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 const imageReady=await page.evaluate(async()=>{
  const image=new Image();image.src='./images/results-gold.png';await image.decode();return image.naturalWidth>0;
 });
 assert.ok(imageReady);
 assert.equal(await page.locator('#reference-ounce').inputValue(),'2400,23');
 assert.equal(await page.locator('#reference-ounce').getAttribute('readonly') !== null,true);
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 assert.ok((await page.locator('.reference-price').first().textContent())!=='â€”');
 const benchmark=await page.evaluate(()=>{
  const field=document.querySelector('#reference-ounce');
  const samples=[];
  for(let i=0;i<100;i++) {field.value=String(2000+i);const start=performance.now();field.dispatchEvent(new Event('input',{bubbles:true}));samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);return {medianMs:samples[50],p95Ms:samples[95]};
 });
 await page.screenshot({path:path.join(screenshots,'offline-restarted.png'),fullPage:true});
 await context.close();
 // Un dispositivo/perfil nuevo debe poder instalarse y entrar independientemente.
 const fresh=await browser.launch({headless:true});
 const independent=await fresh.newContext({...options,colorScheme:'dark'});
 await mockGoldApi(independent);
 const freshPage=await independent.newPage();
 await freshPage.goto(base);await login(freshPage);
 await freshPage.waitForFunction(()=>document.querySelector('#real-quote-main').textContent==='$2400.23');
 assert.equal(await freshPage.locator('#ounce').inputValue(),'2400,23');
 assert.equal(await freshPage.locator('html').getAttribute('data-theme'),'dark','El tema Sistema debe seguir la preferencia del sistema operativo');
 await fresh.close();
 assert.deepEqual(errors,[]);
 assert.deepEqual(external,[]);
 console.log(JSON.stringify({result:'PASS',engine,offlineReload:true,browserRestartOffline:true,preferencesAndPasswordRetained:true,independentNewInstall:true,sharedRealAndVisualQuotes:true,simulationBoundedToOneDollar:true,financialResultUsesAuthenticQuote:true,darkThemePersistence:true,offlineSimulationSuspended:true,goldApiRequests,localCacheFiles:10,layoutWidths:[320,375,393,440,480,768,956],unexpectedExternalRequests:external,pageErrors:errors,tableUpdateBenchmark:benchmark,screenshots,profile},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
