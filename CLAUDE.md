# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

L-AMB is a single-page browser synthesizer/sequencer — the web companion to a hardware instrument
in development. The whole app is one client component (`app/page.tsx`) that wires together a
Web Audio signal graph (via Tone.js) and a set of custom UI controls. There is no backend, router,
or API; the only persistence is `localStorage` plus shareable preset URLs.

## Commands

```bash
npm run dev      # next dev with turbopack (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (next lint)
```

There is no test suite. Formatting is enforced by Prettier (`.prettierrc`): no semicolons,
single quotes, 2-space tabs, 120 col, `jsxBracketSameLine`. Match this style — most files
intentionally have no trailing semicolons.

Path alias `@/*` maps to the repo root (e.g. `@/util/math`, `@/components/Voice`).

## The core concept: a binary tree of crossfaders

The instrument is **four oscillator voices mixed through three crossfaders arranged as a binary
tree**, where each crossfader's position is driven by an LFO (0..1). This is the central mental
model and it is built by hand as a Tone.js node graph inside one big `useEffect` in
`app/page.tsx` (the "init audio path and fx" effect). Understanding that effect is the key to
the whole app.

The mixing math is done with audio-rate nodes, not JS: each LFO output (0..1) gates a `Tone.Gain`
via `Tone.Pow(2)` (and `Tone.Subtract(1)` for the inverted/left side), so a crossfader is two
gain stages summed. The tree:

- LFO3 crossfades voice1 ↔ voice2  → `voice12Gain`
- LFO2 crossfades `voice12` ↔ voice3 → `voice123Gain`
- LFO1 crossfades `voice123` ↔ voice4

Summed audio → distortion → lowpass filter → feedback delay → reverb → global volume gain →
destination. FX nodes are held in refs (`delay`, `filter`, `distortion`, `reverb`) and mutated
in place; the `Effects` component receives those refs and writes to them directly.

The `BinaryTree` component is the on-screen SVG visualization of this same structure, fed the
live LFO values. `pitchNLevel` memos in `page.tsx` recompute each voice's audible level from the
LFO products purely for visual glow.

## LFOs are AudioWorklets, surfaced through a hook

LFOs are not Tone signals — they are a custom `AudioWorkletProcessor`:

- `public/worklets/lfo-processor.js` — the worklet (`custom-lfo`). Generates a 0..1 ramp;
  `shape` 0 = square/PWM, 1 = triangle family; `dutyCycle` sets symmetry; `latch` forces 0
  (used for SOLO muting). It posts `tick` messages (throttled to ~60fps) carrying `value` + `phase`.
- `util/workletLoader.ts` — loads the worklet module exactly once (memoized promise).
- `tone/createLFO.ts` — instantiates the worklet node and returns setter closures
  (`setFrequency`/`setDuty`/`setShape`/`setPhase`/`setLatch`). Frequency is clamped 0.05..10 Hz.
- `hooks/useLFO.ts` — React wrapper: creates the LFO once `initialized` is true, mirrors the
  worklet's `value`/`phase` into React state, and exposes the setters as refs.

There are six LFO instances: LFO1/2/3 drive the crossfader tree, LFO4 ("aux") and the sequencer's
internal LFO are modulation sources. The audio graph reads LFOs via their `node` (audio
connection); the UI reads the throttled `value` (React state). Phase setters let LFO2/3 and the
sequencer sync to LFO1's phase.

## Modulation: the mod matrix

`modMatrix` in `page.tsx` is a `[destination][source]` number grid (`NUM_MOD_DESTINATIONS=13` ×
`NUM_MOD_SOURCES=5`). Sources are `[lfo1, lfo2, lfo3, sequencerValue, auxLfo]`. `modVal(destIndex)`
sums `(source - 0.5) * weight` across sources and returns a roughly −0.5..+0.5 offset (0 when
`modOff`). Destinations are passed by index to the relevant control — e.g. `modVal(6..9)` →
voice pitches, `modVal(0..5)` → LFO freq/duty, `modVal(10..12)` → FX. When changing what a
destination index means, update both the `defaultModMatrix()` seeds and every `modVal(n)` call site.

`LinearKnob` is the modulation-aware control everywhere: it takes a `modVal` (−0.5..+0.5) and a
`setModdedValue` callback so the displayed/applied value reflects modulation on top of the
user-set base value.

## State & presets

There is no state library. State lives in `useState`/`useRef` in `page.tsx` and is persisted via
`util/presets.ts`:

- `initState(name, default, parentObj?)` — read initial value with precedence:
  **URL `?preset=` param → localStorage → default**. Call it as the lazy initializer of `useState`.
- `updateLocalStorage(name, value, parentObj?, immediate?)` — write back (debounced 100ms unless
  `immediate`). Call it alongside every `setState` for a persisted control.
- Everything is stored under a single localStorage key `"preset"` (a JSON object; `parentObj`
  namespaces sub-objects like `lfo1`, `voice2`, `sequencer`, `fx`). Global params that live at top
  level (e.g. `volume`) use `initStateParam`/`updateLocalParam` instead.
- `copyPresetUrl()` base64-encodes the current preset into a shareable `?preset=` URL (the link
  icon in the header).

Naming consistency matters: a control's `initState` key, its `updateLocalStorage` key, and any
`defaultModMatrix`/default constant must agree, or presets silently break.

## Audio lifecycle gotchas

- Audio is gated on `initialized`, which only flips true after `Tone.start()` inside the first
  user gesture (`playStop`). Nothing audio-related runs server-side or before first play.
- Play/stop suspends/resumes the **native** AudioContext directly via `getNativeContext()`
  (`util/getNativeContext.ts` unwraps Tone's wrapper), not Tone's transport. Spacebar toggles play.
- The page renders `null` until `mounted` (a client-only flag) to avoid hydration mismatches;
  note values use `suppressHydrationWarning` because they depend on localStorage.

## Layout/scaling convention

The design is authored at a fixed `1728×958` (`screenWidth`/`screenHeight` in `app/globals.ts`)
and the whole page is CSS-`transform: scale()`d to the viewport width (`screenSizeRatio`). Colors
(`primaryColor`, `secondaryColor`, `gray`) and these dimensions are exported from `app/globals.ts`
and also injected as CSS custom properties. Components use CSS Modules (`index.module.css` next to
each `index.tsx`).
