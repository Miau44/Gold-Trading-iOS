'use strict';
// Publicar únicamente los recursos de la PWA, sin dependencias de compilación.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
const files = [
  'index.html', 'styles.css', 'math.js', 'app.js', 'sw.js',
  'manifest.webmanifest', 'images/results-gold.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
for (const file of files) {
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, file), target);
}
console.log(`PWA preparada en public/: ${files.length} archivos locales.`);
