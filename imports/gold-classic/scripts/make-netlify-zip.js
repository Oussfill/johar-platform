// Create a deploy zip with FORWARD-SLASH entry names (required by Netlify).
// PowerShell's Compress-Archive writes backslashes on Windows which Netlify can't parse.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stage = 'C:/Users/oussf/AppData/Local/Temp/opencode/johar-final';
const out = 'C:/Users/oussf/AppData/Local/Temp/opencode/johar-final.zip';

// Collect all files recursively with relative forward-slash paths
function collectFiles(dir, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, base));
    } else {
      const rel = path.relative(base, full).split(path.sep).join('/');
      results.push({ full, rel });
    }
  }
  return results;
}

const files = collectFiles(stage);
console.log(`Staging ${files.length} files...`);

// Build PowerShell script file list as JSON
const list = files.map(f => ({ full: f.full.replace(/\//g, '\\'), rel: f.rel }));

// Create zip via .NET with explicit forward-slash entry names
const psLines = [
  'Add-Type -AssemblyName System.IO.Compression.FileSystem',
  `if (Test-Path '${out}') { Remove-Item '${out}' -Force }`,
  `$zip = [System.IO.Compression.ZipFile]::Open('${out}', 'Create')`,
  `try {`,
  ...list.map(f =>
    `[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, '${f.full.replace(/'/g, "''")}', '${f.rel.replace(/'/g, "''")}', 'Optimal') > $null`
  ),
  '} finally { $zip.Dispose() }',
];
fs.writeFileSync('make-zip.ps1', psLines.join('\n'), 'utf8');
execSync('powershell -ExecutionPolicy Bypass -File make-zip.ps1', { stdio: 'inherit' });
fs.unlinkSync('make-zip.ps1');

const size = fs.statSync(out).size / 1024 / 1024;
console.log(`Zip created: ${size.toFixed(2)} MB at ${out}`);

// Verify entry names use forward slashes
const { execSync: es } = require('child_process');
const verify = es(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[System.IO.Compression.ZipFile]::OpenRead('${out}'); $z.Entries | Select-Object -First 5 -ExpandProperty FullName; $z.Dispose()"`).toString();
console.log('First entries:\n' + verify);
const hasBackslash = verify.includes('\\');
console.log(hasBackslash ? 'WARNING: backslashes found!' : 'OK: forward slashes only');
