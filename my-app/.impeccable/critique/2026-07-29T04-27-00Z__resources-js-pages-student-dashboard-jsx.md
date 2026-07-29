---
target: Student Dashboard + LevelsPage tutorial onboarding flow
total_score: 24
p0_count: 2
p1_count: 2
timestamp: 2026-07-29T04-27-00Z
slug: resources-js-pages-student-dashboard-jsx
---
# Critique: Student Tutorial Onboarding Flow

**Targets:** `resources/js/Pages/Student/Dashboard.jsx`, `resources/js/Pages/Student/LevelsPage.jsx`

**Method:** Dual-agent (A: sub-agent ses_057c24b23ffeczTg6iawqFtFMh · B: CLI detect.mjs)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Overlay dims clearly, but `pointer-events-none` on nav doesn't explain *why* disabled |
| 2 | Match System / Real World | 3 | Arcade language consistent, but "Phonics Foundation" is teacher jargon, not child-language |
| 3 | User Control and Freedom | 1 | No tutorial skip. Bubble dismiss only hides message; constraints remain until `tutorialComplete` flips |
| 4 | Consistency and Standards | 3 | Dynamic `ring-${c}` will fail Tailwind JIT in production. `LEVEL_ICONS` duplicated in 2 files |
| 5 | Error Prevention | 3 | `isDimmed` guard works, but `!tutorialComplete && wordTutorialDone && speakTutorialDone` leaves both cards dimmed, nothing clickable |
| 6 | Recognition Rather Than Recall | 3 | Icons+colors distinguish modes. Guide step 1 can vanish leaving orphaned "Next Up!" |
| 7 | Flexibility and Efficiency | 1 | No skip, no alt path, one speed for all students |
| 8 | Aesthetic and Minimalist Design | 3 | Well-executed system, but Dashboard cards pack 5 competing elements on a K-5 choice screen |
| 9 | Error Recovery | 2 | Bubble dismissed = guidance gone but constraints stay. No re-read. `guideDone` is session-only on LevelsPage |
| 10 | Help and Documentation | 2 | Bubble is only help. No persistent help icon. 19-word message exceeds K-2 reading level |
| **Total** | | **24/40** | **Acceptable** |

---

## Anti-Patterns Verdict

**LLM assessment:** This is clean work. No glassmorphism, no gradient text, no side-stripe borders, no hero-metric template, no numbered section markers. The design system is applied with discipline. The one near-miss is the gradient overlay covers on LevelCards, but those serve a real purpose (distinguishing levels). The progress bar gradient (`bg-gradient-to-r from-accent to-accent-hover` on LevelCard:116) is unnecessary — a solid lime fill would be more consistent with the single-action-color rule. **Passes the AI slop test.**

**Deterministic scan:** 1 finding — LevelsPage.jsx:54 uses `border-b-2` on a rounded element, which the detector flags as a "Border accent on rounded element" clash (severity: warning). The star count badge has a 2px bottom border that doesn't align with the full border-radius.

**No browser visualization** (dev server not running; CLI scan only).

---

## Overall Impression

The tutorial onboarding is thoughtful and on-brand. The avatar-as-guide is the right move for this age group, and the progressive constraint (dimming rather than hiding) shows restraint. The core UX problem is structural: the tutorial disappears when dismissed but the constraints stay, leaving students in a "now what?" state. The secondary issue is the 4-mechanism approach (overlay + ring + bubble + dim) for what is fundamentally a "tap card 1, not card 2" instruction.

---

## What's Working

1. **Avatar as guide, not tooltip.** The speech bubble attached to the student's avatar creates emotional connection — a character giving advice, not an instruction overlay. Exactly right for K-5.

2. **Progressive constraint, not full lockout.** Dims the wrong choice rather than blocking the whole screen. Student sees the other mode exists, building anticipation.

3. **Color-coded mode identity.** Read = Arcade Lime, Speak = Quest Cyan. Consistent across Dashboard cards, LevelPage headers, progress bars. Child learns "green = reading, blue = speaking" as spatial pattern, not label.

---

## Priority Issues

### P0 — Dynamic Tailwind class will silently break in production
**What:** Dashboard.jsx:90 uses `\`ring-4 ring-${c}...\`` to build the ring class dynamically. Tailwind JIT purges unused classes at build time; `ring-accent` and `ring-quest` must appear as complete strings in source to survive.
**Why it matters:** The ring highlight — the tutorial's primary visual cue — silently disappears in production build. Students can't tell which card to tap.
**Fix:** Use a static lookup map instead of template literal:
```js
const ringMap = {
  read: "ring-4 ring-accent ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-all duration-500 animate-pulse motion-reduce:animate-none",
  speak: "ring-4 ring-quest ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-all duration-500 animate-pulse motion-reduce:animate-none",
};
```
**Suggested command:** `/impeccable harden`

### P0 — No tutorial escape hatch
**What:** Both pages offer no way to skip the tutorial. `guideDone` only dismisses the bubble; the overlay + dimming + highlight persist until `tutorialComplete` flips server-side. Returning student who already knows the flow is forced through every step.
**Why it matters:** A child who accidentally dismisses the bubble can't get guidance back. A returning 3rd grader who knows the game gets the same forced flow as a first-time kindergartner.
**Fix:** Add a "Skip" link on the bubble or small X in overlay corner. Consider a `tutorialSkipped` flag. Per `onboard.md`: let experienced users skip onboarding; don't block access.
**Suggested command:** `/impeccable onboard`

### P1 — Guide step 1 can vanish, leaving orphaned "Next Up!"
**What:** Dashboard.jsx:70 — `filter` removes the "Start Here!" step when `wordTutorialDone` is true. If `tutorialComplete` is false but `wordTutorialDone` is true, the only remaining step is `{ title: "Next Up!" }` with no preceding anchor.
**Why it matters:** Student sees "Next Up!" as the sole instruction with no context. "Next up from what?" — the sequence reference is broken.
**Fix:** Don't filter the step array. Control by `guideStep` index instead. Or only show "Next Up!" when `guideStep > 0` and original step 0 existed.
**Suggested command:** `/impeccable harden`

### P1 — Dimmed nav on LevelsPage lacks overlay explanation
**What:** LevelsPage passes `disableNav={isTutorial}`, which applies `pointer-events-none opacity-60` to the bottom nav. Unlike Dashboard, there's no `bg-background/80` overlay covering the disabled UI.
**Why it matters:** Child sees 3 dimmed buttons with no blocking overlay. "Why can't I tap Home?" The dim state looks broken, not intentional.
**Fix:** Add the full-screen overlay (matching Dashboard pattern) or conditionally hide BottomNav entirely during tutorial.
**Suggested command:** `/impeccable adapt`

### P2 — Bubble text too long for emerging readers
**What:** LevelsPage.jsx:19 — "Level 1 - Phonics Foundation! These 10 words will teach you the basics. Tap to begin your adventure!" = 19 words, Flesch-Kincaid ~grade 4. K-2 students (ages 5-7) are the primary audience.
**Why it matters:** A kindergarten student who can't decode the text either asks the teacher (losing self-guided flow) or guesses wrong.
**Fix:** "Tap Level 1 to start!" (5 words). The avatar + pulsing highlight already communicates "do this thing." The text should name the action, not explain the curriculum.
**Suggested command:** `/impeccable clarify`

### P2 — No tutorial completion celebration
**What:** When `tutorialComplete` flips true, the overlay just lifts. No transition, no feedback, no acknowledgment.
**Why it matters:** The tutorial is the student's first structured achievement. A flat "constraint disappeared" ending feels like a bug, not a win. Missing emotional peak.
**Fix:** Avatar speech bubble: "You're ready! Play your way." Brief confetti or screen flash. A "Tutorial Complete" badge is already wired via `checkTutorialCompletion()` — ensure it triggers here.
**Suggested command:** `/impeccable delight`

---

## Persona Red Flags

**Jordan (Confused First-Timer, K-1 level):**
- Dashboard bubble says "play Level 1" but Jordan doesn't know where Level 1 is or the mode→level navigation pattern. The ring highlights the *card*, not the path.
- LevelsPage bubble: 19 words. Jordan can't read this independently.
- Dimissed bubble leaves constraints but no guidance. Jordan is stranded.

**Casey (Distracted Mobile User, on tablet):**
- AvatarSpeechBubble `min-w-[300px] max-w-[440px]` — on a 360px phone, this fills 85% screen width with no margin.
- LevelCard `px-2.5 py-1` on badge = ~20px tap target. Below 44×44pt minimum.
- Tutorial requires 2 page navigations before game. Casey interrupted mid-flow loses context.

**Alex (Impatient Power User — returning 3rd grader):**
- No tutorial skip. Forced through all steps.
- `animate-pulse` + `ring-4` + `scale-[1.03]` = triple attention grab with no dismiss without completing. Overstimulating for quick return visit.

---

## Minor Observations

1. **Dashboard.jsx:54** — `bodyUrl = avatarUrl?.replace(...)` — no `bodyUrl` variable declaration? Actually: `const bodyUrl = avatarUrl?.replace("/head.png", "/body.png")` — if `avatarUrl` is null, `.replace` throws. The `bodyUrl` check in `showGuide` (`&& bodyUrl`) saves the conditional render, but the line itself would crash before that.

2. **LevelCard.jsx:129-130** — Tutorial highlight ring uses `animate-pulse` but lacks `motion-reduce:animate-none`. Dashboard.jsx:90 has it. Reduced-motion inconsistency.

3. **LevelsPage.jsx:32** — `guideDone` is `useState(false)`, not initialized from props. Dashboard.jsx:53 reads `tutorialComplete` as initial. Inconsistent pattern.

4. **LevelsPage.jsx imports `usePage` but only destructures `auth`** — `flash` destructuring from usePage unused. Minor.

5. **`shadow-[0_6px_0_0_#4c1d95]` inlined** — Dashboard.jsx:169 uses inline arbitrary shadow instead of the `.tactile-button` class from `app.css`. The design system has a named class for this.

6. **LevelCard.jsx:116** — Progress bar uses `bg-gradient-to-r from-accent to-accent-hover`. Per DESIGN.md single-action-color rule, a solid Arcade Lime fill is more consistent.

7. **Detector finding:** LevelsPage.jsx:54 — `border-b-2` on a `rounded-lg` element creates a clash between rectilinear border and rounded corners. The star count badge's bottom border should be removed or use full border.

---

## Questions to Consider

1. **What if the tutorial were just playing Level 1 without the overlay?** The overlay + ring + bubble + dim is 4 mechanisms doing the job of 1. What if Level 1 were simply labeled "Start Here" and the bubble appeared as a friendly hint instead of a modal constraint?

2. **Does a K-5 student need a 2-page tutorial for 2 buttons?** At what age can a child infer that tapping "Word Blast" starts the word game? If the answer is age 6+, the tutorial is only needed for Kindergarten — and it should be faster, not more elaborate.

3. **What if the avatar stayed as a persistent guide?** The speech bubble is the warmest part of this flow, yet it disappears after the tutorial. What if it remained as a tap-to-hint button for the student's first week?
