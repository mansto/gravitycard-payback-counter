const fs = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch {}

const API_TOKEN = process.env.API_TOKEN;
const API_URL   = process.env.API_URL;

if (!API_TOKEN || !API_URL) {
  console.error('ERROR: API_TOKEN and API_URL must be set.');
  console.error('Create a .env file based on .env.example or set them as environment variables.');
  process.exit(1);
}

fs.mkdirSync('dist', { recursive: true });

// Inject token + URL into index.html
let html = fs.readFileSync('src/index.html', 'utf8');
html = html.replace('__API_TOKEN__', API_TOKEN).replace('__API_URL__', API_URL);
fs.writeFileSync('dist/index.html', html);

// Copy remaining static assets
['sw.js', 'manifest.json', 'icon-192.jpg', 'icon-512.jpg'].forEach(file => {
  const src = path.join('src', file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join('dist', file));
});

console.log('Build complete → dist/');
