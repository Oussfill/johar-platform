// Create a SOURCE code zip (no node_modules / dist / .env secrets / logs).
// Uses forward-slash entry names so it unzips cleanly anywhere.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'johar-source.zip');

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'netlify-dist',
  '.netlify',
  '.git',
  'logs',
  'public/dist',
]);

const EXCLUDE_FILES = new Set([
  '.env',
  '.env.production',
  'server.log',
]);

const EXCLUDE_NAMES = new Set([
  'GOLD-Platform-Presentation.pptx',
  'Johar-Presentation.pptx',
  'johar-source.zip',
]);

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (EXCLUDE_DIRS.has(rel) || EXCLUDE_DIRS.has(entry.name)) continue;
      results.push(...walk(full));
    } else {
      if (EXCLUDE_FILES.has(entry.name) || EXCLUDE_NAMES.has(entry.name)) continue;
      if (/\.log$/i.test(entry.name)) continue;
      results.push({ full, rel: path.relative(root, full).split(path.sep).join('/') });
    }
  }
  return results;
}

const files = walk(root);
console.log(`Collecting ${files.length} source files...`);

const list = files.map((f) => ({ full: f.full, rel: f.rel }));
const psLines = [
  'Add-Type -AssemblyName System.IO.Compression.FileSystem',
  `if (Test-Path '${out}') { Remove-Item '${out}' -Force }`,
  `$zip = [System.IO.Compression.ZipFile]::Open('${out}', 'Create')`,
  'try {',
  ...list.map((f) =>
    `[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, '${f.full.replace(/'/g, "''")}', '${f.rel.replace(/'/g, "''")}', 'Optimal') > $null`
  ),
  '} finally { $zip.Dispose() }',
];
fs.writeFileSync(path.join(__dirname, 'make-source-zip.ps1'), psLines.join('\n'), 'utf8');
execSync('powershell -ExecutionPolicy Bypass -File "' + path.join(__dirname, 'make-source-zip.ps1') + '"', { stdio: 'inherit' });
fs.unlinkSync(path.join(__dirname, 'make-source-zip.ps1'));

const size = fs.statSync(out).size / 1024 / 1024;
console.log(`Zip created: ${size.toFixed(2)} MB at ${out}`);

const verify = execSync(
  `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[System.IO.Compression.ZipFile]::OpenRead('${out}'); $z.Entries | Select-Object -First 6 -ExpandProperty FullName; $z.Dispose()"`
).toString();
console.log('First entries:\n' + verify);
console.log(verify.includes('\\') ? 'WARNING: backslashes found!' : 'OK: forward slashes only');