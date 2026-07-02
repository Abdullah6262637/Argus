// Electron launcher: sistem genelinde ELECTRON_RUN_AS_NODE=1 ayarli olabilir,
// bu yuzden electron.exe'yi spawn etmeden once bu degiskeni kaldiriyoruz.

const { spawn } = require('node:child_process');
const path = require('node:path');

const electronExe = path.join(
  __dirname,
  '..',
  'node_modules',
  'electron',
  'dist',
  'electron.exe',
);

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
// Vite dev URL'i korunur
if (!env.VITE_DEV_URL) env.VITE_DEV_URL = 'http://localhost:5173';

const args = [path.join(__dirname, '..')];
// CLI'dan gelen ekstra parametreleri de ilet
args.push(...process.argv.slice(2));

const child = spawn(electronExe, args, {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});