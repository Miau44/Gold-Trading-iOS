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
let goldApiPrice=3552.90;
function luminance(hex){const c=hex.replace('#','').match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [foreground,background] of [['#000000','#ffffff'],['#000000','#ffcc00'],['#ffffff','#252d38'],['#e2e8f0','#252d38']]) assert.ok(contrast(foreground,background)>=7,`${foreground} on ${background} must meet 7:1 contrast`);
async function mockGoldApi(context){
 await context.route('https://api.gold-api.com/price/XAU',route=>{
  goldApiRequests++;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({symbol:'XAU',price:goldApiPrice,updatedAt:new Date().toISOString()})});
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
 assert.equal(await page.evaluate(async()=>{const cache=await caches.open('goldtrading-offline-v9');return (await cache.keys()).length;}),10);
 assert.ok(!(await page.evaluate(()=>caches.keys())).includes('goldtrading-offline-v8'),'La PWA debe purgar el CSS y los activos de la caché anterior');
 await login(page);
 assert.equal(await page.locator('.quote-panel').count(),0,'No debe haber panel de cotizacion');
 assert.equal(await page.locator('#active-gold-quote').count(),0);
 assert.equal(await page.locator('#visual-quote-main').count(),0);
 assert.equal(await page.locator('#ounce-status').count(),0);
 assert.ok(!(await page.locator('#calculator-view').innerText()).includes('Fuente: Gold-API'));
 assert.equal(await page.locator('.calculate-btn').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 204, 0)');
 assert.equal(await page.locator('.calculate-btn').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
 assert.equal(await page.locator('.reference-price').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 204, 0)');
 assert.equal(await page.locator('.calculator-card').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#calculator-heading').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
 assert.equal(await page.locator('#ounce').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
 assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(248, 250, 252)');
 await page.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3552.9);
 for(const [id,value] of [['discount','12.5'],['exchange','8.91'],['ley','72.5'],['reference-discount','12.5'],['reference-exchange','8.91'],['reference-ley','72.5']]) await page.locator(`#${id}`).fill(value);
 const readResults=async()=>page.evaluate(()=>({
  active:GoldMath.parseNumber(document.querySelector('#ounce').value).toFixed(2),
  simulated:!document.querySelector('#quote-state').hidden,
  mainOunce:document.querySelector('#ounce').value,
  referenceOunce:document.querySelector('#reference-ounce').value,
  main:document.querySelector('#unit-bob').textContent,
  reference:document.querySelector('.reference-price').textContent,
  expectedMain:GoldMath.formatBolivia(GoldMath.calculate({ounceUSD:GoldMath.parseNumber(document.querySelector('#ounce').value),discount:GoldMath.parseNumber(document.querySelector('#discount').value),exchangeRate:GoldMath.parseNumber(document.querySelector('#exchange').value),ley:GoldMath.parseNumber(document.querySelector('#ley').value)}).unitBOB),
  expectedReference:GoldMath.formatBolivia(GoldMath.referencePrices({ounceUSD:GoldMath.parseNumber(document.querySelector('#reference-ounce').value),exchangeRate:GoldMath.parseNumber(document.querySelector('#reference-exchange').value),discount:GoldMath.parseNumber(document.querySelector('#reference-discount').value)})[0].priceBOB)
 }));
 await page.evaluate(()=>{const samples=[.37,.75,.99,.25,.10,.75,.99,.25];Math.random=()=>samples.shift()??.5;});
 let quoteCheck=await readResults();
 assert.equal(quoteCheck.active,'3552.90');
 assert.equal(quoteCheck.mainOunce,'3552,9');
 assert.equal(quoteCheck.referenceOunce,'3552,9');
 assert.equal(quoteCheck.main,quoteCheck.expectedMain);
 assert.equal(quoteCheck.reference,quoteCheck.expectedReference);
 for(const expected of [
  {active:'3553.28',simulated:true},
  {active:'3552.90',simulated:false},
  {active:'3551.90',simulated:true},
  {active:'3552.90',simulated:false}
 ]){
  await page.waitForFunction(({active,simulated})=>GoldMath.parseNumber(document.querySelector('#ounce').value).toFixed(2)===active&&(!document.querySelector('#quote-state').hidden)===simulated,expected,{timeout:5000});
  quoteCheck=await readResults();
  assert.equal(quoteCheck.active,expected.active);
  assert.equal(quoteCheck.simulated,expected.simulated);
  assert.equal(Number(quoteCheck.mainOunce.replace(',','.')),Number(quoteCheck.active));
  assert.equal(Number(quoteCheck.referenceOunce.replace(',','.')),Number(quoteCheck.active));
  assert.equal(quoteCheck.main,quoteCheck.expectedMain,'La calculadora principal usa el precio activo');
  assert.equal(quoteCheck.reference,quoteCheck.expectedReference,'La tabla usa el precio activo');
 }
 assert.equal(goldApiRequests,1,'Los ciclos locales no deben consultar Gold-API');
 goldApiPrice=3600.50;
 await page.evaluate(()=>{const samples=[.37,.75];Math.random=()=>samples.shift()??.5;window.dispatchEvent(new Event('online'));});
 await page.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3600.5);
 quoteCheck=await readResults();
 assert.equal(quoteCheck.simulated,false);
 assert.equal(Number(quoteCheck.mainOunce.replace(',','.')),3600.50);
 assert.equal(Number(quoteCheck.referenceOunce.replace(',','.')),3600.50);
 assert.equal(quoteCheck.main,quoteCheck.expectedMain);
 assert.equal(quoteCheck.reference,quoteCheck.expectedReference);
 await page.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3600.88,null,{timeout:5000});
 quoteCheck=await readResults();
 assert.equal(quoteCheck.simulated,true);
 assert.equal(quoteCheck.main,quoteCheck.expectedMain);
 assert.equal(quoteCheck.reference,quoteCheck.expectedReference);
 assert.equal(goldApiRequests,2,'La actualización nueva de Gold-API no debe acelerar las peticiones');
 await page.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3600.5,null,{timeout:5000});
 assert.equal((await readResults()).simulated,false);
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
 assert.equal(await page.locator('.calculator-card').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(37, 45, 56)');
 assert.equal(await page.locator('#settings-title').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
 assert.equal(await page.locator('.settings-description').first().evaluate(el=>getComputedStyle(el).color),'rgb(226, 232, 240)');
 assert.equal(await page.evaluate(()=>localStorage.getItem('goldtrading.theme.v1')),'dark');
 await page.screenshot({path:path.join(screenshots,'dark-settings.png'),fullPage:true});
 await page.locator('#theme-choice').selectOption('light');
 assert.equal(await page.locator('#settings-title').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
 await page.screenshot({path:path.join(screenshots,'light-settings.png'),fullPage:true});
 await page.locator('#theme-choice').selectOption('dark');
 await page.locator('#setting-ounce').fill('2500');
 await page.locator('#preferences-form button[type=submit]').click();
 await page.locator('#preferences-success').waitFor({state:'visible'});
 await page.locator('#current-password').fill('admin123');
 await page.locator('#new-password').fill('GoldAudit2026!');
 await page.locator('#confirm-password').fill('GoldAudit2026!');
 await page.locator('#password-btn').click();
 await page.locator('#password-success').waitFor({state:'visible'});
 await page.locator('#nav-calculator').click();
 assert.equal(await page.locator('#calculator-heading').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#ounce').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#reset-btn').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(37, 45, 56)');
 await page.screenshot({path:path.join(screenshots,'dark-calculator.png'),fullPage:true});
 const expected=await page.evaluate(()=>GoldMath.formatBolivia(GoldMath.calculate({ounceUSD:3600.50,discount:GoldMath.parseNumber(document.querySelector('#discount').value),exchangeRate:GoldMath.parseNumber(document.querySelector('#exchange').value),ley:GoldMath.parseNumber(document.querySelector('#ley').value)}).unitBOB));
 await context.setOffline(true);
 await page.reload();
 await login(page,'GoldAudit2026!');
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 assert.equal(await page.locator('#quote-state').isVisible(),false);
 assert.equal(await page.locator('#ounce').inputValue(),'3600,5');
 assert.ok((await page.locator('#quote-connectivity').textContent()).startsWith('Sin actualizar'));
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
 assert.equal(await page.locator('#ounce').inputValue(),'3600,5');
 assert.equal(await page.locator('#ounce').getAttribute('readonly') !== null,true);
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 await page.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 const imageReady=await page.evaluate(async()=>{
  const image=new Image();image.src='./images/results-gold.png';await image.decode();return image.naturalWidth>0;
 });
 assert.ok(imageReady);
 assert.equal(await page.locator('#reference-ounce').inputValue(),'3600,5');
 assert.equal(await page.locator('#reference-ounce').getAttribute('readonly') !== null,true);
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 assert.ok((await page.locator('.reference-price').first().textContent())!=='Ã¢â‚¬â€');
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
 await freshPage.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3600.5);
 assert.equal(await freshPage.locator('#ounce').inputValue(),'3600,5');
 assert.equal(await freshPage.locator('html').getAttribute('data-theme'),'dark','El tema Sistema debe seguir la preferencia del sistema operativo');
 const desktop=await fresh.newContext({viewport:{width:1280,height:900},colorScheme:'light'});
 await mockGoldApi(desktop);
 observe(desktop);
 const desktopPage=await desktop.newPage();
 desktopPage.on('pageerror',error=>errors.push(error.message));
 await desktopPage.goto(base);
 await desktopPage.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 await login(desktopPage);
 await desktopPage.waitForFunction(()=>GoldMath.parseNumber(document.querySelector('#ounce').value)===3600.5);
 assert.equal(await desktopPage.locator('.quote-panel').count(),0,'No debe haber panel de cotizacion');
 assert.equal(await desktopPage.locator('html').getAttribute('data-theme'),'light');
 assert.ok(await desktopPage.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Sin desbordamiento horizontal en escritorio');
 assert.equal(await desktopPage.locator('#ounce').inputValue(),'3600,5');
 await desktopPage.screenshot({path:path.join(screenshots,'desktop-light.png'),fullPage:true});
 await desktop.close();
 await fresh.close();
 assert.deepEqual(errors,[]);
 assert.deepEqual(external,[]);
 console.log(JSON.stringify({result:'PASS',engine,offlineReload:true,browserRestartOffline:true,preferencesAndPasswordRetained:true,independentNewInstall:true,singleQuoteVisible:true,bothCalculatorsUseAlternatingActivePrice:true,realSimulationReturnSequence:['3552.90','3553.28','3552.90','3551.90','3552.90'],newGoldApiBaseApplied:true,newBaseResimulation:true,manualAndSystemThemes:true,contrastChecked:true,mobileAndDesktopLayouts:true,offlineSimulationSuspended:true,goldApiRequests,localCacheFiles:10,layoutWidths:[320,375,393,440,480,768,956,1280],unexpectedExternalRequests:external,pageErrors:errors,tableUpdateBenchmark:benchmark,screenshots,profile},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
