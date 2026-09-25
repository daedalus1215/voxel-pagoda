# voxel-pagoda

A procedurally generated voxel pagoda in a single HTML file + vendored
three.js. ~20k voxels emitted into one `InstancedMesh` → one draw call.

Inspired by a model-generated single-file three.js pagoda; this version is
hand-written, seeded, and fully parametric.

## Run

Any static server works (ES module imports need `http://`, not `file://`):

```sh
python3 -m http.server 8471
# → http://localhost:8471
```

## Controls

- **drag** — orbit
- **wheel** — zoom
- **n** — toggle day/night

## URL parameters

| param | effect |
|---|---|
| `?seed=N` | generate a different pagoda: tier count (3–5), footprint, eave span/ridge, lift, palette drift, and environment counts. No seed → the curated default build. |
| `?night=1` | start in night mode: moonlight, dark sky, warm `PointLight`s at the stone lanterns. |

e.g. `http://localhost:8471/?seed=7&night=1`

## How it works

- `roof()` — per column `(x,z)`, the covering level comes from
  `s ≤ ridge + (eave−ridge)·u^1.75 + ext·u·cf`, giving a concave eave
  sweep; corner lift `lift·cf·u^0.75` with `cf = |sin 2θ|^1.6` produces the
  upturned wing corners, whose tip voxels get the gold ornament.
- `building()` — slab, walls, red corner pillars, door, window slits,
  railing ring with a gate gap.
- Tiers stack via a simple recurrence (slab on the ridge plateau of the
  roof below); the golden sorin finial sits on the top plateau.
- Seeding: `mulberry32` PRNG drives `makeTiers()`, subtle `offsetHSL`
  palette drift, and environment (tree/rock/lantern) counts.
- Rendering: Lambert + per-instance color, ACES tone mapping, PCF soft
  shadows, one directional sun + hemisphere fill, fog. Orbit control is a
  ~30-line custom implementation (no addons).

## Testing

`node test-tiers.mjs` — extracts `makeTiers()` from `index.html` and checks
structural invariants over 2000 seeds (strictly shrinking widths, slabs fit
on ridge plateaus, eave slope, height bounds). No dependencies.

## Files

- `index.html` — the whole scene + generator
- `lib/three.module.js` — three.js r170.0, unmodified
