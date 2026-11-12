const assert = require('node:assert/strict');
const G = require('../math.js');
let count=0;
function test(cond,label){assert.ok(cond,label); count++;}
function near(a,b,label){test(Math.abs(a-b)<1e-9,label);}
const res=G.calculate({ounceUSD:2000,exchangeRate:6.96,ley:99,discount:0,weightGrams:10});
near(res.unitUSD,(2000/31.1035)*.99,'USD por gramo');
near(res.unitBOB,(2000/31.1035)*.99*6.96,'BOB por gramo');
near(res.totalUSD,res.unitUSD*10,'USD total');
near(res.totalBOB,res.unitBOB*10,'BOB total');
test(G.calculate({ounceUSD:2200,exchangeRate:6.96,ley:50,discount:100,weightGrams:0})!==null,'límites permitidos');
for(const badLey of [49.99,100,-1,NaN,Infinity]) test(G.calculate({ounceUSD:2000,exchangeRate:6.96,ley:badLey,discount:0,weightGrams:10})===null,`ley inválida ${badLey}`);
for(const bad of [-1,NaN,Infinity,Number.MAX_VALUE]) {
 for(const field of ['ounceUSD','exchangeRate','discount','weightGrams']) {
  const args={ounceUSD:2000,exchangeRate:6.96,ley:99,discount:0,weightGrams:10}; args[field]=bad;
  test(G.calculate(args)===null,`${field} inválido`);
 }
}
for(const [raw,want] of [['2000.50',2000.5],['2000,50',2000.5],['2.000,50',2000.5],['2,000.50',2000.5],['  6,96  ',6.96]]) near(G.parseNumber(raw),want,'parse '+raw);
for(const raw of ['', 'abc','nan','inf','1,2,3','2.000.50','6,9.6','1.2,3']) test(G.parseNumber(raw)===null,'parse inválido '+raw);
near(G.roundToTwoEven(1.125),1.12,'banker even down');
near(G.roundToTwoEven(1.375),1.38,'banker even up');
test(G.format(123.4)==='123.40','formato dos decimales');
test(G.calculate({ounceUSD:2000,exchangeRate:6.96,ley:99,discount:10,weightGrams:20}).unitUSD<res.unitUSD,'descuento');
console.log(`PRUEBAS SUPERADAS: ${count}`);

const reference = G.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:0});
test(reference.length===50,'tabla de 50 leyes');
for (let i=0;i<50;i++) {
  test(reference[i].ley===99-i,'secuencia completa '+i);
  near(reference[i].priceBOB,(2000/31.1035)*((99-i)/100)*7.96,'precio ley '+(99-i));
}
for(const [ley,expected] of [[99,'506,72'],[90,'460,66'],[80,'409,47'],[70,'358,29'],[60,'307,10'],[50,'255,92']]) {
  test(G.formatBolivia(reference[99-ley].priceBOB)===expected,`igual captura ley ${ley}`);
}
const referenceDiscount=G.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:10});
near(referenceDiscount[0].priceBOB,reference[0].priceBOB*.9,'porcentaje independiente en tabla');
for(const bad of [-1,101,NaN,Infinity])test(G.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:bad})===null,'porcentaje inválido tabla');
test(G.referencePrices({ounceUSD:0,exchangeRate:7.96,discount:0})===null,'onza cero tabla');
test(G.referencePrices({ounceUSD:2000,exchangeRate:0,discount:0})===null,'dólar cero tabla');
test(G.referencePrices({ounceUSD:2000,exchangeRate:7.96,discount:100})!==null,'porcentaje 100 aceptado');
console.log('TABLA COMPLETA VALIDADA (99–50)');
