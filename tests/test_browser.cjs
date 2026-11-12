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
function observe(context){
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 context.on('request',request=>{if(!request.url().startsWith(base))external.push(request.url());});
}
(async()=>{
 let context=await browser.launchPersistentContext(profile,options);
 observe(context);
 let page=context.pages()[0];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 assert.equal(await page.evaluate(async()=>{await navigator.serviceWorker.ready;return !!navigator.serviceWorker.controller;}),true);
 assert.equal(await page.evaluate(async()=>{const cache=await caches.open('goldtrading-offline-v6');return (await cache.keys()).length;}),10);
 await login(page);
 assert.equal(await page.locator('.reference-price').count(),50);
 for(const width of [320,375,393,440,480,768,956]){
  await page.setViewportSize({width,height:width===956?440:956});
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,body:document.body.scrollWidth}));
  assert.ok(dimensions.scroll<=dimensions.width && dimensions.body<=dimensions.width,JSON.stringify({width,...dimensions}));
  await page.screenshot({path:path.join(screenshots,`layout-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:440,height:956});
 await page.locator('#nav-settings').click();
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
 await context.close();
 context=await browser.launchPersistentContext(profile,options);
 observe(context);
 await context.setOffline(true);
 page=context.pages()[0];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await login(page,'GoldAudit2026!');
 assert.equal(await page.locator('#ounce').inputValue(),'2500');
 assert.equal(await page.locator('#unit-bob').textContent(),expected);
 await page.waitForFunction(()=>document.querySelector('#offline-status').textContent==='Archivos preparados');
 const imageReady=await page.evaluate(async()=>{
  const image=new Image();image.src='./images/results-gold.png';await image.decode();return image.naturalWidth>0;
 });
 assert.ok(imageReady);
 await page.locator('#ounce').fill('3000');
 assert.notEqual(await page.locator('#unit-bob').textContent(),expected);
 await page.locator('#reset-btn').click();
 assert.equal(await page.locator('#ounce').inputValue(),'2500');
 await page.locator('#reference-ounce').fill('3000');
 assert.ok((await page.locator('.reference-price').first().textContent())!=='—');
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
 const independent=await fresh.newContext(options);
 const freshPage=await independent.newPage();
 await freshPage.goto(base);await login(freshPage);
 assert.equal(await freshPage.locator('#ounce').inputValue(),'2000');
 await fresh.close();
 assert.deepEqual(errors,[]);
 assert.deepEqual(external,[]);
 console.log(JSON.stringify({result:'PASS',engine,offlineReload:true,browserRestartOffline:true,preferencesAndPasswordRetained:true,independentNewInstall:true,localCacheFiles:10,layoutWidths:[320,375,393,440,480,768,956],externalRequests:external,pageErrors:errors,tableUpdateBenchmark:benchmark,screenshots,profile},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
