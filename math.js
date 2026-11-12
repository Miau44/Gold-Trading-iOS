/* Gold Trading - logica local sin red ni dependencias externas.
   Conversion reproducida desde el proyecto original de Windows y su revision Swift.
   Sin historiales, datos almacenados, compras ni bases de datos. */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  if (typeof window !== 'undefined') window.GoldMath = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const GRAMOS_POR_ONZA_TROY = 31.1035;
  const MIN_LEY = 50;
  const MAX_LEY = 99.99;

  function parseNumber(value) {
    const compact = String(value ?? '').replace(/[\s\u00A0]/g, '');
    if (!compact) return null;
    let normalized = compact;
    const lastComma = compact.lastIndexOf(',');
    const lastDot = compact.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      const decimal = lastComma > lastDot ? ',' : '.';
      const grouping = decimal === ',' ? '.' : ',';
      const parts = compact.split(decimal);
      if (parts.length !== 2 || !/^\d+$/.test(parts[1])) return null;
      const wholeGroups = parts[0].split(grouping);
      if (wholeGroups.length < 2 || !/^[+-]?\d{1,3}$/.test(wholeGroups[0]) || !wholeGroups.slice(1).every(p => /^\d{3}$/.test(p))) return null;
      normalized = parts[0].split(grouping).join('') + '.' + parts[1];
    } else {
      normalized = compact.replace(',', '.');
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function calculate({ ounceUSD, exchangeRate, ley, discount, weightGrams }) {
    const nums = [ounceUSD, exchangeRate, ley, discount, weightGrams];
    if (!nums.every(n => typeof n === 'number' && Number.isFinite(n))) return null;
    if (ounceUSD < 0 || exchangeRate < 0 || ley < MIN_LEY || ley > MAX_LEY || discount < 0 || discount > 100 || weightGrams < 0) return null;
    const payablePercentage = 100 - discount;
    const unitUSD = (ounceUSD / GRAMOS_POR_ONZA_TROY) * (ley / 100) * (payablePercentage / 100);
    const unitBOB = unitUSD * exchangeRate;
    const totalUSD = unitUSD * weightGrams;
    const totalBOB = unitBOB * weightGrams;
    if (![unitUSD, unitBOB, totalUSD, totalBOB].every(Number.isFinite)) return null;
    return { unitUSD, unitBOB, totalUSD, totalBOB };
  }

  // Segunda calculadora. Produce los 50 valores de ley (99, 98 ... 50),
  // cada uno con su precio por gramo. Sin base de datos ni consultas externas.
  function referencePrices({ ounceUSD, exchangeRate, discount }) {
    if (![ounceUSD, exchangeRate, discount].every(n => typeof n === 'number' && Number.isFinite(n))) return null;
    if (ounceUSD <= 0 || exchangeRate <= 0 || discount < 0 || discount > 100) return null;
    const factor = (ounceUSD / GRAMOS_POR_ONZA_TROY) * (1 - discount / 100) * exchangeRate;
    if (!Number.isFinite(factor)) return null;
    const prices = [];
    for (let ley = 99; ley >= 50; ley--) {
      const priceBOB = factor * (ley / 100);
      if (!Number.isFinite(priceBOB)) return null;
      prices.push({ ley, priceBOB });
    }
    return prices;
  }

  function formatBolivia(value) {
    return format(value).replace('.', ',');
  }

  function roundToTwoEven(value) {
    if (!Number.isFinite(value)) return NaN;
    const scaled = value * 100;
    const floor = Math.floor(scaled);
    const fraction = scaled - floor;
    let rounded;
    if (fraction > 0.5) rounded = floor + 1;
    else if (fraction < 0.5) rounded = floor;
    else rounded = floor % 2 === 0 ? floor : floor + 1;
    return rounded / 100;
  }

  function format(value) {
    return Number.isFinite(value) ? roundToTwoEven(value).toFixed(2) : '—';
  }

  return { parseNumber, calculate, referencePrices, roundToTwoEven, format, formatBolivia, GRAMOS_POR_ONZA_TROY, MIN_LEY, MAX_LEY };
});
