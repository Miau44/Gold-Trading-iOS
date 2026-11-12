/* Gold Trading: solo calculos por gramo y tabla de leyes; sin ventas ni historial. */
(function (root, factory) {
  const result = factory();
  if (typeof module === 'object' && module.exports) module.exports = result;
  if (typeof window !== 'undefined') window.GoldMath = result;
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
    } else normalized = compact.replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }
  function calculate({ ounceUSD, exchangeRate, ley, discount }) {
    if (![ounceUSD, exchangeRate, ley, discount].every(n => typeof n === 'number' && Number.isFinite(n))) return null;
    if (ounceUSD <= 0 || exchangeRate <= 0 || ley < MIN_LEY || ley > MAX_LEY || discount < 0 || discount > 100) return null;
    const unitUSD = (ounceUSD / GRAMOS_POR_ONZA_TROY) * (ley / 100) * (1 - discount / 100);
    const unitBOB = unitUSD * exchangeRate;
    return [unitUSD, unitBOB].every(Number.isFinite) ? { unitUSD, unitBOB } : null;
  }
  function referencePrices({ ounceUSD, exchangeRate, discount }) {
    if (![ounceUSD, exchangeRate, discount].every(n => typeof n === 'number' && Number.isFinite(n))) return null;
    if (ounceUSD <= 0 || exchangeRate <= 0 || discount < 0 || discount > 100) return null;
    // La tabla de referencia del Windows original usa el precio real sin descuento.
    // Conservamos el campo porcentaje tal como aparece en su interfaz,
    // pero no modifica los precios de esta tabla.
    const factor = (ounceUSD / GRAMOS_POR_ONZA_TROY) * exchangeRate;
    if (!Number.isFinite(factor)) return null;
    return Array.from({length: 50}, (_, i) => ({
      ley: 99 - i,
      priceBOB: factor * ((99 - i) / 100)
    }));
  }
  function roundToTwoEven(value) {
    if (!Number.isFinite(value)) return NaN;
    const scaled = value * 100;
    const floor = Math.floor(scaled);
    const fraction = scaled - floor;
    const rounded = fraction > 0.5 ? floor + 1 : fraction < 0.5 ? floor : (floor % 2 === 0 ? floor : floor + 1);
    return rounded / 100;
  }
  function format(value) { return Number.isFinite(value) ? roundToTwoEven(value).toFixed(2) : '—'; }
  function formatBolivia(value) { return format(value).replace('.', ','); }
  return { parseNumber, calculate, referencePrices, roundToTwoEven, format, formatBolivia, GRAMOS_POR_ONZA_TROY, MIN_LEY, MAX_LEY };
});
