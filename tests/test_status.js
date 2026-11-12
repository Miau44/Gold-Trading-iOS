'use strict';
// Simulates the actual status-check functions without changing their UI messages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const start = app.indexOf('async function checkStoragePersistence() {');
const end = app.indexOf("window.addEventListener('load', prepareOffline);", start);
assert.ok(start>0 && end>start);
const code = app.slice(start,end);

async function scenario({secure=true,sw=true,persisted=false,grant=false,complete=true,registrationError=false,missingFile=null,cacheExists=true,persistenceError=false,readyPending=false}={}) {
  const elements={
    'offline-status':{textContent:'Preparando archivos…'},
    'persistence-status':{textContent:'Comprobando…'}
  };
  let grants=0;
  const nav={};
  if(sw) nav.serviceWorker={
    async register(){if(registrationError)throw new Error('falló registro');},
    ready:readyPending?new Promise(()=>{}):Promise.resolve({})
  };
  if(persisted!==null) {
    let granted=persisted;
    nav.storage={
      async persisted(){if(persistenceError)throw new Error('storage unavailable');return granted;},
      async persist(){grants++;granted=grant;return granted;}
    };
  }
  const sandbox={
    elements,navigator:nav,window:{isSecureContext:secure},
    caches:{async keys(){return cacheExists?['goldtrading-offline-v6']:[];},async open(name){assert.equal(name,'goldtrading-offline-v6');return {async match(url){return complete && !url.pathname.endsWith(missingFile || '__missing__')?{ok:true}:null;}}}},
    setTimeout:(fn,ms)=>setTimeout(fn,readyPending?0:ms),clearTimeout,
    document:{baseURI:'https://example.com/gold/'},URL,console:{info(){},warn(){}}
  };
  vm.runInNewContext(`const $=id=>elements[id];\n${code}\nglobalThis.check=checkStoragePersistence;globalThis.prepare=prepareOffline;`,sandbox);
  await sandbox.prepare();
  return {offline:elements['offline-status'].textContent,persistence:elements['persistence-status'].textContent,grants};
}
(async()=>{
  assert.deepEqual(await scenario({persisted:false,grant:false}),{offline:'Archivos preparados',persistence:'No concedido por iOS/navegador',grants:1});
  assert.deepEqual(await scenario({persisted:true}),{offline:'Archivos preparados',persistence:'Concedido',grants:0});
  assert.deepEqual(await scenario({persisted:false,grant:true}),{offline:'Archivos preparados',persistence:'Concedido',grants:1});
  assert.equal((await scenario({complete:false})).offline,'Descarga inicial pendiente');
  assert.equal((await scenario({registrationError:true,cacheExists:false})).offline,'No se pudo preparar');
  assert.equal((await scenario({sw:false})).offline,'Requiere HTTPS o localhost');
  assert.equal((await scenario({secure:false})).offline,'Requiere HTTPS o localhost');
  assert.equal((await scenario({persisted:null})).persistence,'No disponible en este navegador');
  assert.equal((await scenario({registrationError:true})).offline,'Archivos preparados');
  assert.equal((await scenario({cacheExists:false})).offline,'Descarga inicial pendiente');
  for(const missingFile of ['icon-192.png','icon-512.png','apple-touch-icon.png','manifest.webmanifest','results-gold.png']) {
    assert.equal((await scenario({missingFile})).offline,'Descarga inicial pendiente');
  }
  assert.equal((await scenario({persistenceError:true})).persistence,'No se pudo verificar');
  assert.equal((await scenario({readyPending:true,cacheExists:false})).offline,'No se pudo preparar');
  console.log('ESTADOS OK: 17 escenarios de caché y persistencia, incluidos fallos visibles');
})().catch(e=>{console.error(e);process.exit(1)});
