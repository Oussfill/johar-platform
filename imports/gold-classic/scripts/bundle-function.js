// Bundle the Netlify Function with env vars INLINED (no runtime .env needed).
// This is safe for a private deploy zip; secrets never hit a public repo.

const esbuild = require('esbuild');
const path = require('path');

const root = path.join(__dirname, '..');

// Read .env.production values and inline them as process.env.* replacements
const fs = require('fs');
const envProdPath = path.join(root, '.env.production');
const envLines = fs.readFileSync(envProdPath, 'utf8').split(/\r?\n/);
const envMap = {};
for (const line of envLines) {
  const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
  if (m) envMap[m[1]] = m[2];
}

// Build define map: replace process.env.KEY with JSON string literal
const define = {};
for (const [k, v] of Object.entries(envMap)) {
  define[`process.env.${k}`] = JSON.stringify(v);
}
// NODE_ENV must be production inside the bundle
define['process.env.NODE_ENV'] = JSON.stringify('production');

console.log('Inlining env vars:', Object.keys(envMap).join(', '));

esbuild.build({
  entryPoints: [path.join(root, 'netlify/functions/api.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(root, 'netlify-dist/functions/api.js'),
  define,
  external: ['@prisma/client', '.prisma/client', 'prisma'],
  loader: { '.node': 'file' },
  minify: false,
  sourcemap: false,
  logLevel: 'info',
}).then(() => {
  console.log('Function bundled with inlined env:', path.join(root, 'netlify-dist/functions/api.js'));
}).catch((e) => {
  console.error('Bundle failed:', e);
  process.exit(1);
});
