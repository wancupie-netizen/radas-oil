# RADAS Oil — 3D Background Migration Roadmap V1

**Status:** DRAFT FOR REVIEW  
**Scope:** Replace the current static/cinematic dashboard background with a lightweight real-time 3D offshore scene using **Three.js + React Three Fiber (R3F)** and optimized low-poly assets.

---

## 1. Objective

Build a lightweight, game-like 3D offshore background for RADAS Oil that:

- feels like a living 3D game world,
- preserves the current dashboard UI and gameplay flow,
- keeps Supabase/backend as the authoritative gameplay/economy source,
- uses the 3D scene only as a visual presentation layer,
- loads quickly on desktop and remains usable on mobile,
- supports subtle animation and Well status feedback,
- avoids the weight and complexity of a full Unity WebGL build.

---

## 2. Locked Direction

### Visual Direction

**RADAS Oil = Stylized 3D Offshore Management World**

Target visual characteristics:

- isometric / elevated 3D camera,
- stylized-realistic offshore assets,
- clean readable silhouettes,
- low/mid-poly game-ready geometry,
- cinematic lighting without photorealistic overkill,
- subtle environmental motion,
- navy / teal / gold RADAS visual language,
- 3D scene must remain behind the existing dashboard UI.

### Technical Direction

Recommended stack:

- Next.js / React
- Three.js
- React Three Fiber
- Drei
- GLB / GLTF assets
- Draco or Meshopt compression
- Supabase remains gameplay authority

---

## 3. Non-Goals

This migration must **not**:

- redesign the existing dashboard layout,
- change navigation,
- change Well economics,
- change production logic,
- change RDO/BBL authority,
- change Supabase schema unless later required by a separate approved patch,
- move gameplay logic into Three.js,
- use browser time as authoritative production state,
- replace the current web app with Unity WebGL,
- introduce large high-poly CAD-style industrial models.

---

## 4. Core Architecture

```text
Supabase / Backend
       ↓
Authoritative Game State
       ↓
React Dashboard
       ↓
R3F 3D Background Scene
       ↓
Visual Representation Only
```

Example:

```tsx
<OilRig status={well.status} />
```

The 3D scene may react to authoritative state, but it must never calculate or decide economy/gameplay outcomes.

---

## 5. Scene V1

The first production-ready background should contain only:

1. Hero offshore platform
2. Ocean
3. Sky / clouds
4. Flare tower
5. Tugboat
6. Helicopter
7. 2–3 distant rigs
8. Minimal foreground structure for depth

No extra world-building until V1 performance is validated.

---

## 6. Motion System V1

Only lightweight movement should be enabled initially.

### Ocean
- slow wave motion,
- moving normal map / lightweight shader,
- subtle reflection shimmer.

### Sky
- slow cloud drift,
- no heavy volumetric simulation.

### Flare
- lightweight flame animation,
- subtle emissive flicker.

### Crane
- very small cable/hook sway,
- no physics simulation.

### Tugboat
- slow looping route,
- simple path animation.

### Helicopter
- occasional fly-by,
- low-frequency animation.

### Platform Lights
- subtle blink/pulse,
- emissive only where possible.

### Camera
- slow cinematic drift,
- micro parallax,
- maximum movement should remain subtle.

---

## 7. Gameplay Visual States

The scene may visually react to the current Well/platform state.

### IDLE
- normal ambient lighting,
- no warning effects.

### PRODUCING
- machinery/deck lights active,
- subtle process animation.

### BBL READY
- amber indicator glow,
- optional small pulse.

### 3-CYCLE FULL
- stronger amber state,
- production pause visual cue.

### MAINTENANCE SOON
- warning beacon,
- subtle orange/red warning state.

### MAINTENANCE REQUIRED
- red beacon,
- selected machinery lights off,
- reduced operational activity.

**Important:** all state values must come from the authoritative backend.

---

## 8. Asset Optimization Rules

### Recommended Triangle Budget

| Asset | Target |
|---|---:|
| Hero oil rig | 50k–120k triangles |
| Tugboat | 10k–25k |
| Helicopter | 8k–20k |
| Distant rig | 5k–15k |
| Small props | 500–5k |

### Total Visible Scene

Target:

**150k–300k triangles desktop**

Mobile should use a reduced scene.

### Asset Format

Use:

- `.glb`
- Draco compression or Meshopt
- baked normals where useful
- texture atlases where possible

Avoid:

- `.fbx` in production delivery
- `.obj`
- raw CAD meshes
- multiple 4K textures
- unnecessary skeletal rigs

---

## 9. Texture Rules

Recommended:

- Hero rig: 1K–2K textures
- Midground assets: 1K
- Distant assets: 512px–1K
- Reuse material sets where possible
- Prefer packed ORM textures
- Use emissive maps selectively

---

## 10. Camera Direction

Recommended V1 camera:

- elevated 3/4 view,
- slightly isometric feel,
- hero rig centered/right of center,
- clear visual depth between foreground, platform, ocean and horizon.

Example starting values:

```tsx
<PerspectiveCamera
  makeDefault
  position={[12, 10, 16]}
  fov={35}
/>
```

Camera motion should stay extremely subtle.

---

## 11. Lighting Direction

Recommended V1:

- one main directional light,
- ambient/environment light,
- emissive deck lights,
- optional low-cost shadow setup,
- warm sunset/golden-hour hero direction.

Avoid:

- many real-time point lights,
- expensive dynamic shadows everywhere,
- heavy volumetric fog,
- excessive bloom.

---

## 12. Performance Budget

### Desktop Target

- 60 FPS preferred
- 45 FPS minimum acceptable
- DPR: 1–1.5
- compressed GLB
- lazy-loaded non-critical assets
- limited post-processing

### Mobile Target

- 30 FPS acceptable
- DPR: 1
- reduced shadows
- fewer distant rigs
- fewer particles
- optional helicopter disabled
- lower texture resolution

---

## 13. Loading Strategy

Recommended flow:

```text
1. Dashboard loads immediately
2. Static RADAS offshore poster shown
3. R3F scene loads asynchronously
4. GLB assets preload
5. When ready → smooth fade from poster to 3D scene
6. If WebGL fails → keep static poster
```

The user must never see a blank background while the 3D scene loads.

---

## 14. Fallback Strategy

Use a static background fallback when:

- WebGL is unavailable,
- device performance is too low,
- reduced-motion preference is enabled,
- asset loading fails,
- 3D scene crashes,
- mobile thermal/performance state is poor.

The dashboard must remain fully usable without 3D.

---

## 15. Accessibility

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

When enabled:

- disable camera drift,
- disable helicopter animation,
- reduce ocean motion,
- disable non-essential particle effects.

---

## 16. Recommended Component Structure

```text
components/
  game-background/
    GameBackground.tsx
    OffshoreScene.tsx
    OilRig.tsx
    Ocean.tsx
    Sky.tsx
    TugBoat.tsx
    Helicopter.tsx
    Flare.tsx
    DistantRigs.tsx
    SceneLighting.tsx
    SceneFallback.tsx
```

Optional:

```text
lib/
  scene/
    scene-quality.ts
    scene-config.ts
    scene-status-map.ts
```

Assets:

```text
public/
  models/
    offshore-rig.glb
    tugboat.glb
    helicopter.glb
    distant-rig.glb

  textures/
    ocean/
    sky/
    platform/

  backgrounds/
    offshore-fallback.avif
```

---

# 17. Implementation Roadmap

## Phase BG-001 — Background Foundation

**Goal:** Add R3F infrastructure without changing the current dashboard.

Tasks:

- install Three.js / R3F / Drei,
- create `GameBackground`,
- mount `<Canvas>` behind the existing dashboard,
- preserve current UI z-index/layout,
- add static fallback,
- test responsive behavior.

Acceptance:

- current dashboard looks unchanged,
- background layer works,
- no gameplay changes,
- no console errors,
- production build passes.

---

## Phase BG-002 — Base Offshore Scene

**Goal:** Replace plain/static background with the first real-time 3D environment.

Tasks:

- add sky,
- add ocean,
- add main offshore platform,
- establish camera,
- establish basic lighting,
- add loading/fallback transition.

Acceptance:

- scene renders correctly,
- dashboard remains readable,
- no interaction conflict with UI,
- desktop FPS stays within target.

---

## Phase BG-003 — Environmental Motion

**Goal:** Make the background feel alive without becoming heavy.

Tasks:

- ocean animation,
- cloud drift,
- flare flicker,
- crane hook sway,
- subtle camera drift.

Acceptance:

- movement is visible but not distracting,
- no major GPU spike,
- reduced-motion mode works.

---

## Phase BG-004 — Secondary World Activity

**Goal:** Add light game-world movement.

Tasks:

- tugboat path animation,
- helicopter fly-by,
- distant rigs,
- small platform light animation.

Acceptance:

- animation remains subtle,
- no scene clutter,
- mobile quality mode remains usable.

---

## Phase BG-005 — Gameplay State Binding

**Goal:** Connect authoritative platform/Well state to scene visuals.

Tasks:

- map backend status to visual state,
- PRODUCING lights,
- BBL READY amber effect,
- MAINTENANCE SOON warning beacon,
- MAINTENANCE REQUIRED red/offline treatment.

Acceptance:

- visual state matches backend state,
- no gameplay/economy logic exists inside Three.js,
- refresh/reconciliation shows correct state.

---

## Phase BG-006 — Adaptive Quality

**Goal:** Protect performance across devices.

Tasks:

- desktop/mobile quality presets,
- DPR control,
- optional LOD,
- reduced distant assets,
- conditional effects,
- fallback rules.

Acceptance:

- no severe FPS degradation,
- mobile fallback works,
- low-power devices remain usable.

---

## Phase BG-007 — Optimization & Asset Compression

**Goal:** Prepare production assets.

Tasks:

- GLB compression,
- texture compression,
- remove unused geometry,
- merge compatible materials,
- reduce draw calls,
- preload only critical models,
- lazy-load secondary assets.

Acceptance:

- acceptable first-load size,
- no unnecessary 4K textures,
- no large uncompressed model files.

---

## Phase BG-008 — Production Hardening

**Goal:** Lock the background system for production.

Tasks:

- test error boundaries,
- fallback on WebGL failure,
- test refresh/navigation,
- test slow network,
- test mobile,
- test reduced motion,
- verify dashboard UI remains unchanged.

Acceptance:

- build passes,
- 3D failure never blocks gameplay,
- dashboard remains functional without the 3D layer.

---

# 18. Patch Sequence Recommendation

Recommended patch order:

```text
BG-001
BG-002
BG-003
BG-004
BG-005
BG-006
BG-007
BG-008
```

Do not combine all phases into one large patch.

Each patch should be independently testable and reversible.

---

# 19. Patch Safety SOP

For RADAS Oil implementation:

1. Build each patch from the **exact current local source/ZIP**.
2. Verify baseline with SHA256 before changes.
3. Preflight every marker before write.
4. Every marker must match exactly once.
5. Abort without writing on mismatch/duplicate.
6. Create backup only after preflight passes.
7. Do not infer markers from GitHub baseline.
8. Do not modify unrelated UI/components.
9. Test patch on a copy of the source.
10. Run:

```powershell
npm run build
```

11. Only lock the next background patch after the current patch output and build result have been reviewed.

---

# 20. Initial Performance Targets

Recommended V1 targets:

| Metric | Target |
|---|---:|
| Hero rig GLB | ≤ 5 MB preferred |
| Total initial 3D assets | ≤ 8–12 MB preferred |
| Static fallback | ≤ 500 KB preferred |
| Desktop DPR | 1–1.5 |
| Mobile DPR | 1 |
| Desktop FPS | 45–60 |
| Mobile FPS | 30+ |
| Distant rigs | max 3 |
| Active helicopter | max 1 |
| Active tugboats | max 1–2 |

These are starting targets and should be adjusted after profiling.

---

# 21. Visual Quality Priorities

Priority order:

1. Hero platform silhouette
2. Lighting
3. Ocean
4. Depth/parallax
5. Platform emissive lights
6. Flare
7. Tugboat
8. Distant rigs
9. Helicopter
10. Extra particles

If performance drops, remove items from the bottom of this list first.

---

# 22. Recommended V1 Final Experience

The final first-stage experience should feel like:

> The player is looking through a live offshore operations command center into a stylized 3D RADAS Oil world.

The scene should feel alive through:

- moving ocean,
- slow clouds,
- flare activity,
- platform lighting,
- light crane motion,
- occasional vessel movement,
- subtle camera depth.

But the dashboard remains the main interface.

---

# 23. V2 Ideas — Not Part of Initial Migration

Future possibilities only after V1 is stable:

- day/night cycle,
- rain/storm weather,
- multiple player platforms,
- upgrade-driven platform appearance,
- storage tanks visually expanding,
- repair crews,
- supply helicopters,
- interactive camera orbit,
- click-to-focus platform modules,
- cinematic inspection mode,
- Marketplace Well preview in 3D,
- platform skins,
- region-specific environments.

These should not be included in V1.

---

# 24. Definition of Done

The background migration is considered complete when:

- R3F scene loads behind the existing dashboard,
- the UI remains unchanged and readable,
- the scene uses optimized 3D assets,
- basic environmental animation works,
- gameplay states can drive visual feedback,
- mobile and reduced-motion fallbacks work,
- WebGL failure does not block gameplay,
- production build passes,
- no authoritative gameplay/economy logic exists inside the client-side 3D layer.

---

## Recommended Next Patch

**BG-001 — R3F Background Foundation**

Scope:

- dependency setup,
- `GameBackground`,
- `<Canvas>` layer,
- static fallback,
- z-index integration,
- no 3D asset yet,
- no gameplay logic change.

This should be the first implementation patch before introducing any offshore 3D model.
