# Visual polish spec

Backlog of visual upgrades, in recommended implementation order. One commit
per item; each item ships only when its acceptance criteria are met.

## Global constraints

- **No new external dependencies or addons.** The single-file build
  (`build-single.mjs`) must keep working unchanged.
- **No new `rng()` calls in the generation phase.** Existing seeds must keep
  their exact scene structure (tier plan, counts, positions). New per-scene
  decisions use the `hash()` integer noise, which is stream-free.
- **No `Math.random()` in per-frame loops.** Headless renders must stay
  deterministic per seed.
- **Per-item verification:** `node --check` on the module, `node
  test-tiers.mjs` (2000 seeds), `node build-single.mjs`, headless day +
  night renders (Chromium, SwiftShader, virtual time), then commit.

## 1. Sakura tree — status: done (ed7fbd1, 1128bed)

**Why.** The falling petals are cherry-blossom pink, but every tree is green;
the scene's own story is contradicted.

**Design.**
- Palette: add `sakura:0xe8a7b8` and `sakuraDark:0xd4829a` to `P` (they pick
  up the seeded `offsetHSL` drift automatically).
- Tree loop: a tree is sakura when `hash(tx,tz,30) > 0.5`. Salt 30 is
  chosen so the sakura spot is `[22,-9]` — visible from both canonical
  camera angles (the other candidate spots sit behind the pagoda
  silhouette) and always built (array index 1, included in every
  2–4 tree slice). 4-tree seed variants get a second sakura at `[14,18]`.
- Foliage ternary becomes
  `hash(...) > .3 ? (sak ? P.sakuraDark : P.leafDark) : (sak ? P.sakura : P.leaf)`.

**Accept.** Day render: first tree clearly pink, others green. Night render
consistent. All 2000 seed tests pass (structure unchanged — colors only).

## 2. Night stars + voxel moon — status: done (54fee09, 31876f8)

**Why.** The night sky is a flat dark blue with nothing in it.

**Design.**
- Stars: one `THREE.Points`, ~350 vertices on a hemisphere (radius ~180,
  `y > 10`), positions from `hash(i,7,11)` (no `rng`), pixel-size points
  (`sizeAttenuation:false`), white. Static — no per-frame update. Opacity 0
  by day, ~0.8 at night.
- Moon: small voxel clump (box cluster, ~120 boxes, radius ~3) at a fixed
  sky position, unlit. Hidden by day, visible at night.
- Bloom: moon joins `bloomScene` as one more HDR source — night color
  `(1.6, 1.7, 1.9)`, black by day (same pattern as `flameMat`).

**Accept.** Night render: star field + moon with soft halo. Day render:
neither present. Determinism preserved.

## 3. Window glow at night — status: done (5953ecf + 2 tune commits)

**Why.** At night the building reads as dead stone. Lit windows + lanterns +
moon make the pagoda feel inhabited.

**Design.**
- Collect window voxels in `building()`: when the `P.win` branch fires, push
  `{vi: vox.length, x, y, z}` into `WINDOWS` (capture the index *before*
  `put()`, since `put` pushes to `vox`).
- Night mode: `mesh.setColorAt(vi, 0xffc873)` for every entry
  (`instanceColor.needsUpdate`); day restores `vox[vi].c` — the exact
  jittered hex `put` stored, so day is pixel-identical.
- Bloom: second `InstancedMesh` of 0.5³ boxes in `bloomScene`, one per
  window, own material — night HDR `(0.85, 0.6, 0.3)`, black by day.
  (Spec'd at 0.9³ / (2.2, 1.6, 0.9); first render showed the halos merging
  into a blob that swallowed the pagoda silhouette — damped twice.)
- No new `PointLight`s (cost).

**Accept.** Night render: warm windows with soft glow on all floors. Day
render: windows dark again, pixel-identical to the post-item-1 day render.

## 4. Day sky gradient — status: pending (needs sign-off: changes the day look)

**Why.** The flat `#bcd4e8` background reads as "diorama on a colored card."

**Design.**
- Back-side sphere, radius ~400 (inside camera far 500), vertical gradient
  shader, `fog:false` (fog far is 240 and would wash it out).
- Day: horizon `0xcfe3f2` → zenith `0x6fa8d8`. Night: `0x0d1322` → `0x1c2a4d`.
- `scene.background` kept as the base color behind the sphere.
- `setNight` swaps the two uniform color pairs.

**Accept.** Day render: zenith visibly darker than horizon. Night consistent.
No fog band at the horizon.

## 5. Fireflies — status: pending

**Why.** Garnish: warm life around the trees at night.

**Design.**
- ~14 points, warm `0xffd27a`. To get the glow for free they are a small
  `InstancedMesh` of boxes in `bloomScene` (14 instances, per-frame matrix
  updates — trivial), not `Points`.
- Base positions: rings (r 3–6) around each built tree spot, `y 0–4`, from
  `hash()`. Slow sine drift per instance (deterministic phases).
- Night HDR color `(1.8, 1.3, 0.5)`, black by day.

**Accept.** Night render: a handful of warm glowing specks near the trees.
Day render: clean.

## 6. Vignette — status: pending

**Why.** Subtle photographic framing; cheap polish.

**Design.** In the existing `compMat` fragment shader:
`rgb *= 1.0 - uVignette * smoothstep(0.45, 0.85, distance(vUv, vec2(0.5)));`
with `uVignette = 0.18`, applied day and night.

**Accept.** Render corners slightly darker than center; center pixels
unchanged (compare center crop before/after).
