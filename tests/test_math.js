'use strict';
const assert = require('node:assert/strict');
const m = require('../math.js');
let checks = 0;
function eq(a,b,label) { assert.equal(a,b,label); checks++; }
function near(a,b,label) { assert.ok(Math.abs(a-b)<1e-9, label+` ${a} vs ${b}`); checks++; }
const data = {ounceUSD:2000,exchangeRate:8.96,discount:0,ley:99};
const r=m.calculate(data);
eq(m.formatBolivia(r.unitUSD),'63,66','PC USD por gramo');
eq(m.formatBolivia(r.unitBOB),'570,38','PC BOB por gramo');
const table=m.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:0});
eq(table.length,50,'50 leyes');
const expected={99:'506,72',90:'460,66',80:'409,47',70:'358,29',60:'307,10',50:'255,92'};
for(const [ley,price] of Object.entries(expected)) eq(m.formatBolivia(table[99-Number(ley)].priceBOB),price,`ley ${ley}`);
eq(m.calculate({ounceUSD:2000,exchangeRate:6.96,discount:0,ley:99}).unitBOB>0,true,'calculo regular');
for (const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49]) {
 eq(table[i].ley,99-i,`orden fila ${i}`);
 const calculated=m.calculate({ounceUSD:2000,exchangeRate:7.96,discount:0,ley:99-i});
 near(calculated.unitBOB,table[i].priceBOB,`coincidencia ${99-i}`);
}
for(const s of ['2.000,50','2,000.50','2000,50','2000.50']) near(m.parseNumber(s),2000.5,'formato '+s);
for(const bad of ['','abc','1.2.3','Infinity','1,200,50']) eq(m.parseNumber(bad),null,'número inválido');
eq(m.calculate({ounceUSD:2000,exchangeRate:7.96,discount:0,ley:49}),null,'ley fuera rango');
eq(m.calculate({ounceUSD:2000,exchangeRate:7.96,discount:101,ley:99}),null,'descuento inválido');
eq(m.referencePrices({ounceUSD:0,exchangeRate:6.96,discount:0}),null,'onza inválida');
eq(m.formatBolivia(m.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:10})[0].priceBOB),'506,72','tabla Windows sin descuento');
eq(m.formatBolivia(m.calculate({ounceUSD:2000,exchangeRate:7.96,discount:10,ley:99}).unitBOB),'456,05','descuento aplicado');
console.log(`OK: ${checks} validaciones matemáticas y de formato`);
