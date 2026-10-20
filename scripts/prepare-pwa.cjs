const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const source = path.join(root, 'public');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Web export is missing dist/index.html.');

for (const name of ['manifest.webmanifest', 'sw.js', 'velyqua-icon.png']) {
  fs.copyFileSync(path.join(source, name), path.join(dist, name));
}

const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const head = [
  '<meta name="description" content="VELYQUA helps you record aquarium observations, understand changes and make clearer care decisions. Explore a software prototype by Andrew Lam.">',
  '<link rel="canonical" href="https://velyqua.vercel.app/">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="VELYQUA · Intelligence for Living Water">',
  '<meta property="og:description" content="Aquarium observations, clear explanations and a record you can learn from. Working software prototype.">',
  '<meta property="og:url" content="https://velyqua.vercel.app/">',
  '<meta property="og:image" content="https://velyqua.vercel.app/velyqua-icon.png">',
  '<meta name="twitter:card" content="summary">',
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"VELYQUA · 维澜","url":"https://velyqua.vercel.app/","description":"A working software prototype for aquarium observations and explainable decisions."}</script>',
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<meta name="theme-color" content="#092f37">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<link rel="apple-touch-icon" href="/velyqua-icon.png">',
  '<link rel="icon" type="image/png" href="/velyqua-icon.png">'
].join('');
if (!html.includes('manifest.webmanifest')) html = html.replace('</head>', `${head}</head>`);
fs.writeFileSync(indexPath, html);
console.log('VELYQUA PWA assets packaged:', ['index.html', 'manifest.webmanifest', 'sw.js', 'velyqua-icon.png'].join(', '));
