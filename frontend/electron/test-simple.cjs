console.log('--- TEST ---');
console.log('process.versions:', JSON.stringify(process.versions, null, 2));
console.log('process.env.ELECTRON_RUN_AS_NODE:', process.env.ELECTRON_RUN_AS_NODE);
console.log('typeof process.electronBinding:', typeof process.electronBinding);
try {
  const electron = require('electron');
  console.log('electron module type:', typeof electron);
  console.log('electron keys:', electron ? Object.keys(electron).slice(0, 5) : 'null/undefined');
} catch (e) {
  console.log('require electron ERROR:', e.message);
}
process.exit(0);