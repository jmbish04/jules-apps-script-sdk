import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';

copyFileSync('./appsscript.json', './dist/appsscript.json');

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  platform: 'neutral',
  target: 'es2019'
});

// Remove export statements
let code = readFileSync('dist/bundle.js', 'utf8');
code = code.replace(/^export\s*{[\s\S]*?};?\s*$/m, '');

writeFileSync('dist/bundle.js', code);
console.log('✓ Built bundle.js');
