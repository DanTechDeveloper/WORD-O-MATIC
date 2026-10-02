---
name: speech-verdict
description: Use when a task touches speech recognition, accuracy, verdicts, confidence thresholds, the noise gate, or Deepgram — isWordMatch, Wrong/Recovered, useDeepgramRecognition, speechProcessors, speechUtils, audioGate, rnnoise, Word Blast, Story Quest, karaoke borders. Read before changing any matching or gating rule.
---

# Speech verdict pipeline

Load this before editing anything that decides whether a child's spoken word
counted. **Every rule here fails silently** — a wrong verdict renders as a
plausible animation, never an error. Deep background is in
`docs/CAVEATS.md` (83 KB — grep it, do not read it whole).

## The chain

```
useDeepgramRecognition.js  →  speechProcessors.js  →  speechUtils.js (isWordMatch)
        ↓                            ↓                        ↓
   audioGate.js  →  rnnoise.js    route/align        THE matcher. Do not reimplement.
```

- `MODEL = "nova-3"`, `LANGUAGE = "en-US"` — hardcoded at
  `hooks/Student/useDeepgramRecognition.js:14-15`. No config file, no env override.
- `isWordMatch` in `lib/speechUtils.js` is the **SSOT**. There is no
  `useSpeechRecognition.js` file; it does not exist.

## Match rules

**Exact-only, by design.** `normalizeText` (lowercase, strip non-word, trim)
then `===`. No Levenshtein, no edit tolerance, no second chance. Non-exact is
Wrong.

If a word keeps failing, the fix is **the word in `CurriculumSeeder`** — pick a
word the acoustic model can actually return — *not* loosening the matcher.
Loosening it silently converts Wrong verdicts into false Corrects.

`MAX_STITCH = 3` caps exact token joins in both directions: spoken-split
("b a t" → "bat") and spoken-joined ("cupcake" → "cup cake"). Filler/stutter
skip is unbounded on purpose (turn-taking).

## Confidence gating

Read this precisely — it is the most misread logic in the app:

| Path | Rule |
|---|---|
| Exact match | Accepted at **any** confidence. Confidence is not a gate here. |
| Wrong path | Gated at `confidence >= 0.6` (`speechProcessors.js:343`, `:394`). |
| Sentence mode | **Ignores** confidence for acceptance. |

There is **no interim 0.7 gate**. A missing confidence defaults to `1`
(Deepgram always sends it; this keeps existing callers on the authoritative path).

## Audio gate

`lib/audioGate.js` exports `NOISE_GATE`:

```
floorInit 0.02 · floorMin 0.008 · openRatio 6 · closeFraction 0.5
riseK 0.005 · fallK 0.05 · hangover 12
```

Asymmetric, and the floor is **frozen while open** so the speaker's own voice
can never raise the bar mid-word. It tracks the *room* floor because ~40
children share devices — the dominant ASR problem is **background chatter, not
hiss**. AGC is off deliberately. No denoiser separates speakers; this gate is
the only separator.

`openRatio: 6` is a documented ceiling, not a guess — 8 would starve the child
once the floor sits at 0.02. Tune `NOISE_GATE` on real hardware, not from
theory.

## Assets are load-bearing

`public/pcm-processor.js` and `public/rnnoise/{rnnoise.wasm,rnnoise.worklet.js}`
are git-tracked and required.

If the worklet 404s, `addModule` throws and the code **silently** falls back to
`createScriptProcessor(4096)` — 85ms frames instead of 2.67ms — which
invalidates every frame-rate-dependent constant above. A "slow" gate is almost
always this fallback, not a tuning problem.

## Before you claim a speech change works

```bash
npx vitest run tests/Unit/speechUtils.test.js
npx vitest run tests/Unit/useDeepgramRecognition.test.js
npx vitest run tests/Unit/sentenceAlign.test.js
npx vitest run tests/Unit/audioGate.test.js
```

There is **no e2e/browser automation** in this repo (no Playwright, Cypress,
Puppeteer, or Dusk). Microphone behaviour cannot be verified automatically —
say so rather than implying coverage.