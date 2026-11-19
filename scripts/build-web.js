// Gera sync.bundle.js (Firebase empacotado) e, com --www, copia o front-end para www/ (Capacitor).
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Quem clona o repositório ainda não tem firebase-config.js (fica fora do git): usa o modelo.
const cfg = path.join(root, 'firebase-config.js');
if (!fs.existsSync(cfg)) {
  fs.copyFileSync(path.join(root, 'firebase-config.example.js'), cfg);
  console.log('firebase-config.js criado a partir do modelo (sincronização desativada até você preenchê-lo)');
}
esbuild.buildSync({
  entryPoints: [path.join(root, 'src', 'sync.js')],
  outfile: path.join(root, 'sync.bundle.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  logLevel: 'info',
});

if (process.argv.includes('--www')) {
  const out = path.join(root, 'www');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  ['index.html', 'style.css', 'script.js', 'mobile.js', 'firebase-config.js', 'sync.bundle.js'].forEach((f) =>
    fs.copyFileSync(path.join(root, f), path.join(out, f))
  );
  fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
  console.log('www/ gerado');
}
