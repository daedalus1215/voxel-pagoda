import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('./index.html', import.meta.url)), 'utf8');
const mul32 = html.slice(html.indexOf('function mulberry32'), html.indexOf('const rng='));
const tiersSrc = html.slice(html.indexOf('function makeTiers'), html.indexOf('const TIERS=rng'));
if (!mul32.includes('mulberry32') || !tiersSrc.includes('makeTiers')) throw new Error('extraction failed');

/* per-seed factory: bind rng to a fresh PRNG, run the real makeTiers */
const makeForSeed = new Function('s', `${mul32} let rng=mulberry32(s); ${tiersSrc} return makeTiers();`);

let failures = 0, minTop = Infinity, maxTop = -Infinity;
const tierCounts = {};
for (let seed = 1; seed <= 2000; seed++) {
  const tiers = makeForSeed(seed);
  const n = tiers.length;
  tierCounts[n] = (tierCounts[n] || 0) + 1;
  for (let i = 0; i < n; i++) {
    const t = tiers[i];
    const bad = [];
    if (t.b < 2) bad.push(`b=${t.b} too small`);
    if (!(t.h >= 3 && t.h <= 5)) bad.push(`h=${t.h} out of range`);
    if (!(t.eave >= t.b + 3 && t.eave <= t.b + 4)) bad.push(`eave=${t.eave} vs b=${t.b}`);
    if (!(t.ridge < t.eave - 1)) bad.push(`ridge=${t.ridge} not sloped under eave=${t.eave}`);
    if (!(t.H >= 4 && t.H <= 6)) bad.push(`H=${t.H}`);
    if (i > 0) {
      if (t.b >= tiers[i - 1].b) bad.push(`b=${t.b} not smaller than prev ${tiers[i - 1].b}`);
      if (t.b + 1 > tiers[i - 1].ridge) bad.push(`slab ${t.b + 1} overhangs prev ridge ${tiers[i - 1].ridge}`);
      if (t.eave > tiers[i - 1].ridge + 6) bad.push(`eave ${t.eave} way beyond prev ridge ${tiers[i - 1].ridge}`);
    }
    if (t.door !== (i === 0)) bad.push('door on wrong tier');
    if (bad.length) { failures++; if (failures < 6) console.log(`seed ${seed}: ${bad.join('; ')}`); }
  }
  let slabY = 2;
  for (const t of tiers) slabY = slabY + 1 + t.h + t.H;
  const top = slabY + 12;
  minTop = Math.min(minTop, top); maxTop = Math.max(maxTop, top);
  if (top > 75) { failures++; console.log(`seed ${seed}: top ${top} too tall`); }
  if (tiers[0].b + 1 > 44) { failures++; console.log(`seed ${seed}: baseHalf too big`); }
}
console.log(`tier counts: ${JSON.stringify(tierCounts)}`);
console.log(`height range: ${minTop}..${maxTop} (finial tip y)`);
console.log(failures === 0 ? 'ALL 2000 SEEDS PASS' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
