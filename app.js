'use strict';
(function () {
  const form = document.querySelector('#calculator-form');
  const reset = document.querySelector('#reset-btn');
  const error = document.querySelector('#form-error');
  const fields = { ounceUSD: 'ounce', discount: 'discount', exchangeRate: 'exchange', ley: 'ley', weightGrams: 'weight' };
  const outputs = { unitBOB: 'unit-bob', unitUSD: 'unit-usd', totalBOB: 'total-bob', totalUSD: 'total-usd' };
  const defaults = { ounce: '2000', discount: '0', exchange: '6.96', ley: '99', weight: '0' };

  function showError(message) {
    if (message) { error.textContent = message; error.hidden = false; }
    else { error.textContent = ''; error.hidden = true; }
  }

  function getInputs() {
    const result = {};
    for (const [key, fieldId] of Object.entries(fields)) result[key] = GoldMath.parseNumber(document.getElementById(fieldId).value);
    return result;
  }

  function render(result) {
    for (const [key, id] of Object.entries(outputs)) document.getElementById(id).value = result ? GoldMath.format(result[key]) : '—';
  }

  function calculate(withErrors = false) {
    const values = getInputs();
    const result = GoldMath.calculate(values);
    render(result);
    if (result) showError('');
    else if (withErrors) showError('Verifica onza, cotización, descuento (0–100%), ley (50–99.99) y peso no negativo.');
    else showError('');
    return result;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    calculate(true);
    document.activeElement?.blur?.();
  });
  form.addEventListener('input', () => calculate(false));
  reset.addEventListener('click', () => {
    for (const [id, value] of Object.entries(defaults)) document.getElementById(id).value = value;
    calculate(false);
    document.activeElement?.blur?.();
  });
  calculate(false);

  async function requestPersistence() {
    try {
      if (!navigator.storage || !navigator.storage.persisted) return;
      let persistent = await navigator.storage.persisted();
      if (!persistent && navigator.storage.persist) persistent = await navigator.storage.persist();
      // Comprobacion independiente del resultado de la solicitud:
      persistent = await navigator.storage.persisted();
      console.info('[Gold Trading] Almacenamiento persistente:', persistent ? 'concedido' : 'no concedido');
    } catch (err) { console.warn('[Gold Trading] No se pudo verificar almacenamiento persistente:', err); }
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('./sw.js', { scope: './' });
        await navigator.serviceWorker.ready;
        await requestPersistence();
      } catch (err) { console.warn('[Gold Trading] No se pudo preparar la caché offline:', err); }
    });
  }
})();
