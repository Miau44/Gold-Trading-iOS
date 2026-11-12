const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
assert.ok(manifest.icons.length>=2);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const files=[...sw.matchAll(/'\.\/[^']*'/g)].map(m=>m[0].slice(1,-1));
for(const rel of files){if(rel==='./')continue;assert.ok(fs.existsSync(path.join(root,rel.slice(2))),`recurso precargado faltante: ${rel}`);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
for(const unwanted of ['GUARDAR COMPRA','HISTORIAL','REGISTROS','CONSULTAR PRECIO'])assert.ok(!html.toUpperCase().includes(unwanted),'elemento no deseado: '+unwanted);
for(const required of ['storage.persisted','storage.persist','serviceWorker.register'])assert.ok(js.includes(required),'API faltante: '+required);
for(const u of ['https://','http://'])assert.ok(!html.includes(u),'dependencia remota HTML');
console.log('VALIDACIÓN DEL PAQUETE SUPERADA: manifiesto, precaché y alcance');
// La tabla y sus cuatro entradas forman parte obligatoria de la calculadora original.
for(const id of ['reference-form','reference-ounce','reference-discount','reference-exchange','reference-ley','reference-tables'])
  assert.ok(html.includes(`id="${id}"`),`entrada/tabla faltante ${id}`);
assert.ok(js.includes('for (let group = 0; group < 5; group++)'),'cinco grupos de leyes');
assert.ok(js.includes('for (let i = 0; i < 10; i++)'),'diez leyes por grupo');
const math=fs.readFileSync(path.join(root,'math.js'),'utf8');
assert.ok(math.includes('function referencePrices('),'fórmula tabla de precios');
console.log('VALIDACIÓN ESTRUCTURAL DE SEGUNDA CALCULADORA SUPERADA');
