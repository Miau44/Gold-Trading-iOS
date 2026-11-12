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

  // Segunda calculadora: una cuadrícula de 5 grupos de 10 filas.
  // El render crea la estructura una única vez; al modificar los campos
  // solo cambia el texto de 50 celdas (sin reconstruir el DOM).
  const refForm = document.querySelector('#reference-form');
  const refError = document.querySelector('#reference-error');
  const refTables = document.querySelector('#reference-tables');
  const refInputs = {
    exchangeRate: document.querySelector('#reference-exchange'),
    discount: document.querySelector('#reference-discount'),
    ounceUSD: document.querySelector('#reference-ounce'),
    ley: document.querySelector('#reference-ley')
  };
  const priceCells = [];
  const leyRows = [];

  function addText(parent, tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  function buildReferenceTable() {
    const fragment = document.createDocumentFragment();
    for (let group = 0; group < 5; group++) {
      const block = document.createElement('div');
      block.className = 'reference-block';
      const head = document.createElement('div');
      head.className = 'reference-block-head';
      addText(head, 'span', '', 'LEY');
      addText(head, 'span', '', 'PRECIO');
      block.appendChild(head);
      for (let i = 0; i < 10; i++) {
        const ley = 99 - (group * 10 + i);
        const row = document.createElement('div');
        row.className = 'reference-price-row';
        row.setAttribute('aria-label', `Ley ${ley}`);
        addText(row, 'span', 'reference-ley', String(ley));
        priceCells.push(addText(row, 'output', 'reference-price', '—'));
        leyRows.push(row);
        block.appendChild(row);
      }
      fragment.appendChild(block);
    }
    refTables.appendChild(fragment);
  }

  function calculateReference() {
    const data = {};
    for (const [key, element] of Object.entries(refInputs)) data[key] = GoldMath.parseNumber(element.value);
    const selectedLey = data.ley;
    const isLeyValid = selectedLey !== null && selectedLey >= 50 && selectedLey <= 99.99;
    const prices = isLeyValid ? GoldMath.referencePrices(data) : null;
    for (let i = 0; i < 50; i++) {
      const ley = 99 - i;
      priceCells[i].textContent = prices ? GoldMath.formatBolivia(prices[i].priceBOB) : '—';
      leyRows[i].classList.toggle('selected', isLeyValid && Math.floor(selectedLey) === ley);
      leyRows[i].classList.toggle('invalid', !prices);
    }
    if (!prices) {
      refError.textContent = 'Verifica cotización, onza (mayores que cero), porcentaje (0–100%) y ley (50–99.99).';
      refError.hidden = false;
    } else {
      refError.textContent = '';
      refError.hidden = true;
    }
  }

  buildReferenceTable();
  refForm.addEventListener('input', calculateReference);
  refForm.addEventListener('submit', event => { event.preventDefault(); calculateReference(); document.activeElement?.blur?.(); });
  calculateReference();

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
