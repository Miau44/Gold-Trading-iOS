/* Gold Trading - PWA sin servidor, sin historial, sin base de datos.
   Solo guarda localmente preferencias y un verificador de contrasena.
   El inicio de sesion es un bloqueo local, no autenticacion remota. */
'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const PREFS_KEY = 'goldtrading.preferences.v3';
  const ACCOUNT_KEY = 'goldtrading.account.v3';
  const DEFAULT_PREFS = Object.freeze({ ounceUSD: 2000, exchangeRate: 6.96, discount: 0 });
  const INITIAL_USER = 'admin';
  const INITIAL_PASSWORD = 'admin123'; // Credenciales del programa Windows; cambiar en Preferencias.
  const PBKDF2_ITERATIONS = 210000;
  let isAuthenticated = false;
  let settings = readPreferences();

  function showMessage(errorId, message, successId) {
    const error = $(errorId);
    error.textContent = message || '';
    error.hidden = !message;
    if (successId) $(successId).hidden = true;
  }
  function showSuccess(id, message, errorId) {
    const success = $(id);
    success.textContent = message;
    success.hidden = false;
    $(errorId).hidden = true;
  }
  function readJSON(key) {
    const raw = localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  }
  function storeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    if (localStorage.getItem(key) === null) throw new Error('No se pudo guardar la información en este dispositivo.');
  }
  function validPreferences(value) {
    return value && Number.isFinite(value.ounceUSD) && value.ounceUSD > 0 &&
      Number.isFinite(value.exchangeRate) && value.exchangeRate > 0 &&
      Number.isFinite(value.discount) && value.discount >= 0 && value.discount <= 100;
  }
  function readPreferences() {
    try { const saved = readJSON(PREFS_KEY); return validPreferences(saved) ? saved : {...DEFAULT_PREFS}; }
    catch (_) { return {...DEFAULT_PREFS}; }
  }
  function toFieldNumber(n) { return String(n).replace('.', ','); }
  function applyPreferencesToInputs() {
    $('ounce').value = toFieldNumber(settings.ounceUSD);
    $('discount').value = toFieldNumber(settings.discount);
    $('exchange').value = toFieldNumber(settings.exchangeRate);
    $('ley').value = '99';
    // La tabla tiene entradas independientes, pero parte de los mismos valores predeterminados.
    $('reference-ounce').value = toFieldNumber(settings.ounceUSD);
    $('reference-discount').value = toFieldNumber(settings.discount);
    $('reference-exchange').value = toFieldNumber(settings.exchangeRate);
    $('reference-ley').value = '99';
    calculateMain();
    calculateReference();
  }
  function fillPreferencesForm() {
    $('setting-ounce').value = toFieldNumber(settings.ounceUSD);
    $('setting-exchange').value = toFieldNumber(settings.exchangeRate);
    $('setting-percentage').value = toFieldNumber(settings.discount);
  }
  function setView(view) {
    const isCalc = view === 'calculator';
    $('calculator-view').hidden = !isCalc;
    $('settings-view').hidden = isCalc;
    $('nav-calculator').classList.toggle('active', isCalc);
    $('nav-settings').classList.toggle('active', !isCalc);
    if (isCalc) {
      $('nav-calculator').setAttribute('aria-current', 'page');
      $('nav-settings').removeAttribute('aria-current');
    } else {
      $('nav-settings').setAttribute('aria-current', 'page');
      $('nav-calculator').removeAttribute('aria-current');
      fillPreferencesForm();
    }
    window.scrollTo(0, 0);
  }
  function showApp() {
    isAuthenticated = true;
    settings = readPreferences();
    applyPreferencesToInputs();
    $('auth-view').hidden = true;
    $('app-view').hidden = false;
    $('password').value = '';
    setView('calculator');
  }
  function logout() {
    isAuthenticated = false;
    $('app-view').hidden = true;
    $('auth-view').hidden = false;
    $('password').value = '';
    $('current-password').value = '';
    $('new-password').value = '';
    $('confirm-password').value = '';
    showMessage('login-error', '');
    window.scrollTo(0, 0);
  }

  // El verificador PBKDF2 se guarda localmente: nunca se guarda la contrasena en texto plano.
  async function derivePassword(password, salt, iterations) {
    if (!globalThis.crypto?.subtle) throw new Error('La seguridad de acceso requiere HTTPS o localhost.');
    const bytes = new TextEncoder().encode(password);
    const material = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations}, material, 256);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }
  function bytesToHex(bytes) { return Array.from(bytes, x => x.toString(16).padStart(2, '0')).join(''); }
  function hexToBytes(hex) { return new Uint8Array((hex.match(/.{2}/g) || []).map(byte => parseInt(byte, 16))); }
  async function createAccount(user, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS);
    storeJSON(ACCOUNT_KEY, { v:1, username:user, salt: bytesToHex(salt), hash, iterations:PBKDF2_ITERATIONS });
  }
  async function verifyCredentials(user, password) {
    const account = readJSON(ACCOUNT_KEY);
    if (account === null) {
      if (user !== INITIAL_USER || password !== INITIAL_PASSWORD) return false;
      await createAccount(user, password);
      return true;
    }
    if (account.v !== 1 || typeof account.username !== 'string' || account.username !== user ||
      !/^[a-f0-9]{32}$/.test(account.salt || '') || !/^[a-f0-9]{64}$/.test(account.hash || '') ||
      !Number.isInteger(account.iterations) || account.iterations < 100000 || account.iterations > 1000000) {
      return false;
    }
    const actual = await derivePassword(password, hexToBytes(account.salt), account.iterations);
    return actual === account.hash;
  }
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const user = $('username').value.trim();
    const password = $('password').value;
    const button = $('login-btn');
    button.disabled = true;
    showMessage('login-error', '');
    try {
      if (!await verifyCredentials(user, password)) {
        showMessage('login-error', 'Usuario o contraseña incorrectos.');
      } else showApp();
    } catch (err) {
      showMessage('login-error', 'No se puede acceder al almacenamiento seguro local. Comprueba el navegador y los permisos.');
      console.warn('[Gold Trading] Error de autenticación local:', err);
    } finally { button.disabled = false; }
  });
  $('logout-btn').addEventListener('click', logout);
  $('nav-calculator').addEventListener('click', () => { if (isAuthenticated) setView('calculator'); });
  $('nav-settings').addEventListener('click', () => { if (isAuthenticated) setView('settings'); });

  $('preferences-form').addEventListener('submit', event => {
    event.preventDefault();
    $('preferences-success').hidden = true;
    const next = {
      ounceUSD: GoldMath.parseNumber($('setting-ounce').value),
      exchangeRate: GoldMath.parseNumber($('setting-exchange').value),
      discount: GoldMath.parseNumber($('setting-percentage').value)
    };
    if (!validPreferences(next)) {
      showMessage('preferences-error', 'Comprueba la onza y la cotización (mayores a cero) y el porcentaje (0 a 100).');
      return;
    }
    try {
      storeJSON(PREFS_KEY, next);
      settings = next;
      applyPreferencesToInputs();
      showSuccess('preferences-success', 'Preferencias guardadas. Se aplicarán al abrir y limpiar la calculadora.', 'preferences-error');
    } catch (_) { showMessage('preferences-error', 'No se pudieron guardar las preferencias en este dispositivo.'); }
  });
  $('password-form').addEventListener('submit', async event => {
    event.preventDefault();
    $('password-success').hidden = true;
    const oldPassword = $('current-password').value;
    const nextPassword = $('new-password').value;
    const confirmation = $('confirm-password').value;
    if (nextPassword.length < 8) {
      showMessage('password-error', 'La nueva contraseña debe tener al menos 8 caracteres.'); return;
    }
    if (nextPassword !== confirmation) {
      showMessage('password-error', 'La nueva contraseña y su confirmación no coinciden.'); return;
    }
    const button = $('password-btn');
    button.disabled = true;
    try {
      const account = readJSON(ACCOUNT_KEY);
      if (!account || !await verifyCredentials(account.username, oldPassword)) {
        showMessage('password-error', 'La contraseña actual es incorrecta.');
      } else {
        await createAccount(account.username, nextPassword);
        $('current-password').value = '';
        $('new-password').value = '';
        $('confirm-password').value = '';
        showSuccess('password-success', 'Contraseña cambiada correctamente.', 'password-error');
      }
    } catch (err) {
      console.warn('[Gold Trading] Error guardando contraseña:', err);
      showMessage('password-error', 'No se pudo guardar la contraseña en este dispositivo.');
    } finally { button.disabled = false; }
  });

  // Calculadora principal: SOLO precio por gramo, sin peso ni totales de compras.
  function readMain() {
    return {
      ounceUSD: GoldMath.parseNumber($('ounce').value),
      discount: GoldMath.parseNumber($('discount').value),
      exchangeRate: GoldMath.parseNumber($('exchange').value),
      ley: GoldMath.parseNumber($('ley').value)
    };
  }
  function calculateMain(reportErrors = false) {
    const result = GoldMath.calculate(readMain());
    $('unit-bob').value = result ? GoldMath.formatBolivia(result.unitBOB) : '—';
    $('unit-usd').value = result ? GoldMath.formatBolivia(result.unitUSD) : '—';
    showMessage('form-error', (!result && reportErrors) ? 'Verifica onza y dólar (mayores que cero), porcentaje (0–100 %) y ley (50–99.99).' : '');
    return result;
  }
  $('calculator-form').addEventListener('submit', event => {
    event.preventDefault(); calculateMain(true); document.activeElement?.blur?.();
  });
  $('calculator-form').addEventListener('input', () => calculateMain(false));
  $('reset-btn').addEventListener('click', () => { applyPreferencesToInputs(); document.activeElement?.blur?.(); });

  // Tabla Windows: cinco bloques por diez leyes, construidos UNA vez.
  const priceCells = [];
  const leyRows = [];
  const refInputs = {
    exchangeRate: $('reference-exchange'), discount: $('reference-discount'),
    ounceUSD: $('reference-ounce'), ley: $('reference-ley')
  };
  function addText(parent, tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }
  function buildReferenceTable() {
    const fragment = document.createDocumentFragment();
    for (let blockIndex = 0; blockIndex < 5; blockIndex++) {
      const block = document.createElement('div');
      block.className = 'reference-block';
      const head = document.createElement('div');
      head.className = 'reference-block-head';
      addText(head, 'span', '', 'LEY');
      addText(head, 'span', '', 'PRECIO');
      block.appendChild(head);
      for (let i = 0; i < 10; i++) {
        const ley = 99 - (blockIndex * 10 + i);
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
    $('reference-tables').appendChild(fragment);
  }
  function calculateReference() {
    const data = {};
    for (const [key, field] of Object.entries(refInputs)) data[key] = GoldMath.parseNumber(field.value);
    const leyValid = data.ley !== null && data.ley >= 50 && data.ley <= 99.99;
    const prices = leyValid ? GoldMath.referencePrices(data) : null;
    for (let i = 0; i < 50; i++) {
      priceCells[i].textContent = prices ? GoldMath.formatBolivia(prices[i].priceBOB) : '—';
      leyRows[i].classList.toggle('selected', leyValid && Math.floor(data.ley) === 99 - i);
      leyRows[i].classList.toggle('invalid', !prices);
    }
    showMessage('reference-error', prices ? '' : 'Verifica onza y cotización (mayores que cero), porcentaje (0–100 %) y ley (50–99.99).');
  }
  buildReferenceTable();
  $('reference-form').addEventListener('input', calculateReference);
  $('reference-form').addEventListener('submit', event => { event.preventDefault(); calculateReference(); document.activeElement?.blur?.(); });
  applyPreferencesToInputs();

  async function checkStoragePersistence() {
    const target = $('persistence-status');
    if (!navigator.storage?.persisted || !navigator.storage?.persist) {
      target.textContent = 'No disponible en este navegador'; return;
    }
    try {
      let isPersistent = await navigator.storage.persisted();
      if (!isPersistent) await navigator.storage.persist();
      isPersistent = await navigator.storage.persisted();
      target.textContent = isPersistent ? 'Concedido' : 'No concedido por iOS/navegador';
      console.info('[Gold Trading] Persistencia local:', isPersistent);
    } catch (err) {
      target.textContent = 'No se pudo verificar';
      console.warn('[Gold Trading] Error de persistencia:', err);
    }
  }
  async function prepareOffline() {
    const target = $('offline-status');
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      target.textContent = 'Requiere HTTPS o localhost';
      await checkStoragePersistence();
      return;
    }
    try {
      await navigator.serviceWorker.register('./sw.js', {scope:'./'});
      await navigator.serviceWorker.ready;
      const cache = await caches.open('goldtrading-offline-v5');
      const required = ['./index.html','./styles.css','./math.js','./app.js','./images/results-gold.png'];
      const found = await Promise.all(required.map(path => cache.match(new URL(path, document.baseURI))));
      target.textContent = found.every(Boolean) ? 'Archivos preparados' : 'Descarga inicial pendiente';
    } catch (err) {
      target.textContent = 'No se pudo preparar';
      console.warn('[Gold Trading] Offline:', err);
    }
    await checkStoragePersistence();
  }
  window.addEventListener('load', prepareOffline);
})();
