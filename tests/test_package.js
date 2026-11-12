'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),app=read('app.js'),sw=read('sw.js');
for(const file of ['index.html','styles.css','math.js','app.js','sw.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png']) assert.ok(fs.existsSync(path.join(root,file)),file);
for(const id of ['login-form','password-form','preferences-form','calculator-form','reference-form','reference-tables','logout-btn','unit-bob','unit-usd','offline-status','persistence-status']) assert.ok(html.includes(`id="${id}"`),id);
for(const banned of ['id="weight"','id="total-bob"','id="total-usd"','GUARDAR COMPRA','HISTORIAL','REGISTRO DE VENTAS']) assert.ok(!html.includes(banned),`no incluir ${banned}`);
assert.ok(sw.includes('goldtrading-offline-v6'));
assert.ok(app.includes('navigator.storage.persist()'));
assert.ok(app.includes('navigator.storage.persisted()'));
assert.ok(app.includes('PBKDF2'));
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
// Todo recurso referenciado debe existir localmente y estar disponible offline.
const precache = new Set([...sw.match(/const OFFLINE_FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(match=>match[1]));
const resources = [
  ...[...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(match=>match[1]),
  ...[...read('styles.css').matchAll(/url\(['"]?(\.\/[^)'"\s]+)['"]?\)/g)].map(match=>match[1]),
  ...manifest.icons.map(icon=>icon.src)
];
for(const resource of resources) {
  assert.ok(fs.existsSync(path.join(root,resource)),`recurso local: ${resource}`);
  assert.ok(precache.has(resource),`recurso offline: ${resource}`);
}
console.log('OK: empaquetado, PWA standalone, login, preferencias, sin peso/ventas/historial');
