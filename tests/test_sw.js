'use strict';
// Prueba aislada de la logica de cache, no reemplaza prueba en Safari/iPhone.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const js=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
const listeners={};
const stores=new Map();
const base='https://example.test/gold/';
const norm=v=>new URL(typeof v==='string'?v:v.url,base).href;
function createCache(){const map=new Map();return {map,async addAll(files){for(const f of files)map.set(norm(f),'local:'+new URL(norm(f)).pathname.replace('/gold/','./'));},async match(req){return map.get(norm(req))||null;}};}
const caches={
 async open(name){if(!stores.has(name))stores.set(name,createCache());return stores.get(name);},
 async keys(){return [...stores.keys()];},
 async delete(name){return stores.delete(name);},
 async match(req){for(const cache of stores.values()){const value=await cache.match(req);if(value)return value;}return null;}
};
const self={location:{origin:'https://example.test'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:()=>{},clients:{claim:async()=>{}}};
vm.runInNewContext(js,{self,caches,URL,Promise,Request:class {constructor(url,options){this.url=new URL(url,base).href;assert.equal(options.cache,'reload');}},fetch:async()=>{throw new Error('No hay red')}});
(async()=>{
 let pending;
 listeners.install({waitUntil:p=>pending=p});await pending;
 assert.equal((await caches.keys())[0],'goldtrading-offline-v6');
 const cache=await caches.open('goldtrading-offline-v6');
 const unrelated=await caches.open('other-app');
 unrelated.map.set(norm('index.html'),'incorrect-cache');
 // La lectura debe usar únicamente la caché de esta versión.
 const current=stores.get('goldtrading-offline-v6');
 stores.delete('goldtrading-offline-v6');
 stores.set('goldtrading-offline-v6',current);
 for(const file of ['index.html','styles.css','math.js','app.js','images/results-gold.png','manifest.webmanifest','icons/icon-192.png']) assert.ok(await cache.match(file),file);
 let response;
 listeners.fetch({request:{method:'GET',url:base+'index.html',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await response,'local:./index.html');
 listeners.fetch({request:{method:'GET',url:base+'sin-ruta',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await response,'local:./index.html');
 await caches.open('goldtrading-offline-v5');
 listeners.activate({waitUntil:p=>pending=p});await pending;
 assert.ok(!(await caches.keys()).includes('goldtrading-offline-v5'));
 assert.ok((await caches.keys()).includes('other-app'));
 assert.equal((await caches.keys()).length,2);
 console.log('SW OK: precache local, navegacion cache-first y fallback offline');
})().catch(e=>{console.error(e);process.exit(1)});
