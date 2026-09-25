#!/usr/bin/env node
/* Build single.html: inlines lib/three.module.js so the entire app is one
   file that runs from file:// (no server, no module imports).
   Usage: node build-single.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const three = readFileSync(root + 'lib/three.module.js', 'utf8');
const html = readFileSync(root + 'index.html', 'utf8');

/* strip the trailing export statement, capture the names */
const exportIdx = three.indexOf('export {');
if (exportIdx < 0) throw new Error('trailing export statement not found');
const names = three.slice(exportIdx)
  .replace(/^export\s*\{|\}\s*;?\s*$/g, '')
  .split(',').map(s => s.trim()).filter(Boolean);
if (names.some(n => n.includes(' '))) throw new Error('export alias (as) not supported');
const body = three.slice(0, exportIdx);
const wrapper = `window.THREE=(()=>{${body}\nreturn {${names.join(',')}};\n})();`;

/* pull out the app module, drop its import */
const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) throw new Error('app module script not found');
const app = m[1].replace("import * as THREE from './lib/three.module.js';", 'const THREE=window.THREE;');
if (app.includes("from './lib")) throw new Error('three import was not replaced');

const head = html.slice(0, html.indexOf('<script type="module">'));
const single = `${head}<script>\n${wrapper}\n</script>\n<script type="module">\n${app}</script>\n</body>\n</html>\n`;
writeFileSync(root + 'single.html', single);
console.log(`single.html: ${(single.length / 1048576).toFixed(2)} MB, ${names.length} exports inlined`);
