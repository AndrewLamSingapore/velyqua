const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const source = path.join(root, 'public');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Web export is missing dist/index.html.');

for (const name of ['manifest.webmanifest', 'sw.js', 'velyqua-icon.png', 'velyqua-share.png']) {
  fs.copyFileSync(path.join(source, name), path.join(dist, name));
}

const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8').replace(/<title>.*?<\/title>/i, '<title>VELYQUA — Intelligence for Living Water</title>');
const head = [
  '<meta name="description" content="Record freshwater aquarium water tests, observations and care history. Explore VELYQUA’s working prototype and an interactive educational walkthrough.">',
  '<link rel="canonical" href="https://velyqua.vercel.app/">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="VELYQUA · Intelligence for Living Water">',
  '<meta property="og:description" content="Understand your water. Remember every change. Water tests, observations and care history in a freshwater aquarium prototype.">',
  '<meta property="og:url" content="https://velyqua.vercel.app/">',
  '<meta property="og:image" content="https://velyqua.vercel.app/velyqua-share.png">',
  '<meta property="og:site_name" content="VELYQUA">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta property="og:image:alt" content="VELYQUA: Intelligence for Living Water">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="VELYQUA — Intelligence for Living Water">',
  '<meta name="twitter:description" content="Understand your water. Remember every change. Explore a freshwater aquarium prototype for observations and care history.">',
  '<meta name="twitter:image" content="https://velyqua.vercel.app/velyqua-share.png">',
  '<meta name="twitter:image:alt" content="VELYQUA: Intelligence for Living Water">',
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
console.log('VELYQUA PWA assets packaged:', ['index.html', 'manifest.webmanifest', 'sw.js', 'velyqua-icon.png', 'velyqua-share.png'].join(', '));
