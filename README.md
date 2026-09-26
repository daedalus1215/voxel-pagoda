# voxel-pagoda

A procedurally generated voxel pagoda in a single HTML file + vendored
three.js. ~20k voxels emitted into one `InstancedMesh` → one draw call.

Inspired by a model-generated single-file three.js pagoda; this version is
hand-written, seeded, and fully parametric.

## Run

`single.html` is fully self-contained — open it directly (double-click /
`file://`), no server needed. Regenerate it after editing `index.html`:

```sh
node build-single.mjs
```

Otherwise any static server works for the source form (`index.html` uses an
ES module import, which needs `http://`, not `file://`):

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
- Motion: 7 drifting voxel cloud clusters (a second `InstancedMesh` with
  per-frame matrix updates), 240 falling petal quads in a single `Points`
  object (canvas-generated sprite, seeded fall/sway), and a 28-second
  cinematic intro orbit that hands off to the orbit control on the first
  pointerdown/wheel. Clouds and petals re-tint in night mode.
- Night bloom: hand-rolled, no addons. The scene renders into an MSAA
  `WebGLRenderTarget`; the lantern flames (a tiny separate scene of HDR
  unlit boxes) render into a 1/4-res HalfFloat target; two separable
  9-tap Gaussian passes; additive composite to the canvas. Flames are
  black in day mode, so the bloom is free then.

## Testing

`node test-tiers.mjs` — extracts `makeTiers()` from `index.html` and checks
structural invariants over 2000 seeds (strictly shrinking widths, slabs fit
on ridge plateaus, eave slope, height bounds). No dependencies.

## Files

- `single.html` — self-contained build (three.js inlined), runs from `file://`
- `build-single.mjs` — regenerates `single.html` from `index.html`
- `index.html` — the whole scene + generator
- `lib/three.module.js` — three.js r170.0, unmodified
