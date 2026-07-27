// Electron launcher: sistem genelinde ELECTRON_RUN_AS_NODE=1 ayarlı olabilir,
// bu yüzden electron.exe'yi spawn etmeden önce bu değişkeni kaldırıyoruz.

const { spawn } = require('node:child_process');
const path = require('node:path');

let electronExe;
try {
  electronExe = require('electron');
} catch (e) {
  electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
if (!env.VITE_DEV_URL) env.VITE_DEV_URL = 'http://localhost:5173';

const args = [path.join(__dirname, '..')];
args.push(...process.argv.slice(2));

const child = spawn(electronExe, args, {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});