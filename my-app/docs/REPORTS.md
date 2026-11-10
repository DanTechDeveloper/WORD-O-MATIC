# Reports

> Version 2.2

## The Verdict SOT — one rule, three surfaces

`ReportService::verdict(mastery, failed, threshold)` is the single place that answers "is this word a problem?" for the parent email, the Excel `Verdict` column, and the teacher page. Its JS twin is `masteryLabels.js::verdict()`. **Change one and you must change the other** — if they disagree, the same word is "Recovered" in one surface and "Needs Attention" in another.

| `mastery` | `failed_attempts` | verdict |
|---|---|---|
| `unseen` | – | `notAttempted` |
| `training` | `>= NEEDS_ATTENTION_ATTEMPTS` | `needsAttention` |
| `training` | `< NEEDS_ATTENTION_ATTEMPTS` | `practicing` |
| `mastered` | `>= NEEDS_ATTENTION_ATTEMPTS` | `recovered` |
| `mastered` | `< NEEDS_ATTENTION_ATTEMPTS` | `mastered` |

**The recovered floor MUST equal the attention floor.** A word cannot recover from something that never hurt it. At floor 1 a word that slipped once and was then read correctly was celebrated as "Recovered" for a recovery that never happened; at floor 4 a word genuinely flagged `needsAttention` at exactly 3 would conquer and render as plain `mastered`, i.e. a real problem with zero acknowledgment. Equal floors leave no gap. Locked by `VerdictTest::test_the_recovered_floor_always_equals_the_attention_floor` (checked at thresholds 1-5 x failed 0-8) and its JS twin.

**There is no "tries" helper, on purpose.** The `+1` winning-try arithmetic was removed from both languages: `failed_attempts` counts recorded failure *events*, not attempts, so `failed + 1` claims attempts that never happened. Every surface says "N recorded failures".

`verdictLabel($v, forParent: true)` swaps only the wording — "Still Practicing"/"Needs More Practice" for parents vs "Practicing"/"Needs Attention" for teachers. The STATE is one value.

**Three rules that are easy to break:**

0. **An untouched sentence is `notAttempted`, NOT `mastered`.** `sentenceVerdictFrom()` / `sentenceVerdict()` MUST keep a `notAttempted` branch. Verdicts are checked most-severe-first and `mastered` is the *fallthrough*, so dropping that branch reports every untouched sentence as "conquered on the first try" — a brand-new student rendered all 20 under **Mastered (20)**. It regressed on the first implementation (2026-09-28); locked by `VerdictTest::test_untouched_sentence_is_not_attempted_not_mastered` and its `masteryLabels.test.js` twin. One played word is enough to leave `notAttempted` for `practicing`.
1. **The sentence verdict comes from its WORDS, never from the summed `failed_attempts`** (`sentenceVerdictFrom()` / `sentenceVerdict()`). A 5-word sentence at one miss each sums to 5 and clears the threshold while no single word is a problem — the old `sum >= 3` rule called that "Needs More Practice". The sum is **display-only** and is labelled "in total" on the teacher page.
2. **`failed_attempts` counts RECORDED FAILURES, not pronunciation attempts — never label it "tries".** The client POSTs per event during the round (`GameplaySpeakMode.jsx` `onMispronounce` → `status: "training"`, `onWordRecognized` → `status: "mastered"`; same shape in `GameplayReadMode.jsx`), so the counter increments once per failure event. But **the 5s silence watchdog also calls `onMispronounce`** (`speechProcessors.js:196-212`, "this watchdog reports SILENCE"), and its flag only resets on a match — so a word the child stalled on, was confused by, or wandered off from still increments without the child ever attempting it. `attemptsShown()`'s `mastered ? failed + 1 : failed` is arithmetic only; `failed + 1` is **not** "tries" and must never be displayed as such. Consequence worth knowing: a child who abandons words can cross the `>= 3` "Needs Attention" threshold without ever having attempted the word three times — the same class of false positive as the summed-total one, and pre-existing.
   - The boundary that *is* meaningful: `failed = 0` means the word was never recorded failing, i.e. a first-try correct read → clean **Mastered**. Any value above zero means it was recorded failing before being conquered → **Recovered**. Locked by `VerdictTest::test_a_recovered_word_carries_history_where_a_first_try_one_does_not`.
   - Teacher page says "N recorded failures"; the parent email says "N recorded attempts" with the disclaimer "counts are recorded history, not a recommended number of repetitions". Same number, softer parent-facing noun — deliberate.
3. **Duplicate words are merged (normalize + SUM) — but the merge UNIT depends on the surface, and the Excel's unit is the LEVEL, not the sentence.** Story Quest content is free prose, so the same text legitimately appears at several positions in one module. `ReportService::mergeSentenceWords()` / `mergeSentenceWords()` (normalize + sum, worst mastery wins) runs on every surface. But `sentenceWordStruggleRowsFrom()` merges **per level** because the sheet has no Sentence column, so a row's identity is `(level, word)`: merging per sentence emitted two *indistinguishable* rows for Level 1 (`"A frog can swim. Milo sees a crab."` — one `A` in each sentence) with nothing on the sheet able to tell them apart. The email and `StudentDetails` keep the **per-sentence** unit on purpose, because both print the sentence directly above the words — there, splitting is context, not confusion. Excel rows therefore carry no `sentence` key: one sentence cannot describe a word that spans two. Keying by raw text is PHP's last-write-wins, which **undercounts the most common words in the curriculum**; `ReportService::normalizeWord()` is the twin of `speechUtils.js normalizeText()` and must agree with it, because `isWordMatch` is what decided a word was missed. A merged word keeps the **worst** mastery — `training` beats `mastered`, since a word is only recovered when every occurrence was conquered. Story Quest content is free prose, so the same text legitimately appears at several positions per module (`"A frog can swim."` / `"Milo sees a crab."` — both start with `A`), and `ParagraphModule::saveWithContent` has no duplicate guard (Word Blast does — `AGENTS.md` "No intra-module duplicates"). Keying by raw text is PHP's last-write-wins, which **undercounts the most common words in the curriculum**. `ReportService::normalizeWord()` is the twin of `speechUtils.js normalizeText()` and must agree with it, because `isWordMatch` is what decided a word was missed.
**No sentence table exists and none is needed.** `student_paragraph_mastery` is keyed by `paragraph_word_id`; the sentence's `status`/`failed_attempts` are derived on read at `ParagraphModule::buildLevels()` and **frozen** when mastered (`StudentController` "Sticky: once mastered, both status and failed_attempts are frozen forever"). Every verdict above is a projection of data that already exists.

### Where each verdict shows up

| Surface | Grouping | Untouched words |
|---|---|---|
Word Blast | two columns (Mastery Zone / Training Zone) splitting on the `mastery` column alone — unchanged | not shown (as always) |
Story Quest | 5 verdict groups: Needs Attention · Practicing · Recovered · Not Yet Mastered · Mastered | a "Not Yet Mastered" group |
Excel | one `Verdict` column per word row | excluded |
Email | Still Practicing / Needs More Practice / Recently Conquered | "Not attempted yet" chip |

Word Blast does NOT group by verdict: its Mastery/Training split is the `mastery` column, and a chip carries the label itself (`WordChip` → `attentionMeta()`) only when the threshold fires. Story Quest groups because a sentence mixes many words and one number cannot describe it. `groupSentences()` lives in `masteryLabels.js` (moved out of the JSX so it is unit-tested) and its titles come from `VERDICT_META`, never a literal.

**A mastered word is not shown as failing.** The Mastery Zone chip reads `Attempts: N`, where `N` is the child's total tries (`attemptsShown()` = `failed + 1`), and the `Recovered` badge appears only when the word actually reached the threshold. Below it, a mastered word is just a mastered word — no badge, no failure wording. The drill list under each Story Quest sentence is the one place `failed_attempts` is printed raw, because that list is explicitly about what held the sentence back.

## Dashboard

Route: `GET /teacher/reports` → `ReportController@reports`. Charts classify students:

| Category | Meaning |
|---|---|
| Not Started | No progress rows in either skill (`started` flag false for both) — a 0% best score from a real play is NOT "not started" (CAVEATS BF26) |
| At Risk | Average accuracy < 60% |
| Needs Support | Average accuracy 60-80% |
| On Track | Average accuracy ≥ 80% |

Classification formula: `wordBlastAcc` and `storyQuestAcc` averaged. The displayed status (dashboard, emailed report, Excel export, Reports.jsx) is the single stored `students.status` column written by `ProgressService::recalculateStatus()` — none recompute it, so they cannot diverge (CAVEATS BF26).

The **numeric Final Average** is a separate, derived metric surfaced everywhere the two accuracies appear (teacher Dashboard table, Students, Reports.jsx, StudentDetails, parent email, Excel export): `round((wordBlastAcc + storyQuestAcc) / 2, 2)`, shown as `null`/"N/A" until **both** skills have a real started signal (one-sided `(80+0)/2=40` never renders). SOT is `ProgressService::finalAverage()` / the `StudentProfile::finalAverage` accessor. Teacher's `Dashboard.jsx` colors each accuracy column (incl. Final Average) with a risk dot based on `computeRisk(acc)` (60/80 thresholds mirroring `classify`).

## Deadline

| State | Behavior |
|---|---|
| Before deadline | Checkboxes disabled, Send locked, deadline save locked; student gameplay fully open |
| After deadline | All teacher actions enabled. **Student gameplay is practice** (Option A, see CAVEATS.md BF7): `saveWordProgress` / `saveParagraphProgress` advance only the level-unlock status row (`StudentController::finishRound` `isPractice` branch — no session, no scores, no badges); LevelsPage stays open with the practice banner. No deadline set → gameplay open. |

Post-deadline sessions are logged with `is_deadline_hit=true` (baked in at `finishRound`, sticky — see DATABASE.md). The results page renders the non-scoring "TIME'S UP!" view (`GameResults.jsx`: deadline banner, "You played" score card, NextBadge hidden), and `BadgeUnlockModal` auto-suppresses via `auth.deadline`. Streak/accuracy badge metrics (`BadgeService::bestSessionMetric`, `StudentController::badges()`) exclude flagged sessions permanently — even if the teacher clears the deadline afterward.

The `created_at <= deadline` filter (normalized via `Carbon::parse($cutoff)->format('Y-m-d H:i:s')` to avoid ISO string comparison issues) applies to training words, mastered words, **and** the curriculum rows shown on `StudentDetails`. The cutoff is centralized in `ReportService::cutoff()` (returns the deadline value only once it has passed, else `null`) and threaded through `ReportController::reports`, `sendReportEmails`, and `exportReports`. No cutoff passed → all rows returned.

The teacher deadline banner is a single source of truth in `DashboardLayout.jsx` (reads global `auth.deadline`), shown across the main content whenever a deadline is set. Its message is page-aware: the Reports page (`/teacher/reports`) gets deadline-specific copy ("…All report actions are now available. Deadline was set to …" past / "Reporting deadline not yet reached…" future), every other teacher page gets the gameplay-locked copy — which also states that **module editing (Word Blast and Story Quest) is locked**. After the deadline, `Word.jsx` / `Paragraph.jsx` disable the Manage buttons and the Add Module card (frontend), and `TeacherController::updateWordModule` / `updateParagraphModule` reject writes (backend). Reports no longer renders its own inline banner.

## Email

- Sent via `Mail::to()->queue()` (queued, not synchronous).
- Teacher clicks Send button → response returns immediately, mail processed by queue worker.
- `reported_at` = deadline timestamp (not current time).
- Flash data (`sent`, `failed`, `reported_at`) exposed to frontend via `HandleInertiaRequests`.

**Email content** (`student-report.blade.php`, v1.7 redesign) is a projection of the **same `curriculumForUser()` data** that powers `StudentDetails` — parity locked by `ReportTest::test_email_payload_matches_student_details_view_data`:

- **Header**: student name, sector, status pill (all five statuses render a colored pill).
- **Performance Overview**: Word Blast / Story Quest accuracy tiles + a full-width amber **Final Average** card (null-safe — hidden/absent when unstarted, `$data['finalAverage'] ?? null`).
- **Curriculum Progress**: per-mode completion % — Word Blast `wordBlastProg` via `ReportService::curriculumPercent()` (words), Story Quest `storyQuestProg` via `ReportService::sentenceCurriculumPercent()` (sentences, `mastered_sentences/total_sentences`, `calcSentenceProgress` parity) rendered as progress bars + level line.
- **Latest Achievement**: latest badge card (or empty state).
- **Training Zone × 2**: Word Blast word-based, Story Quest sentence-based, both grouped by recorded tries against `ReportService::NEEDS_ATTENTION_ATTEMPTS = 3`:
  - **Word Blast** — every still-training word; **Story Quest** — every still-training sentence (`sentence` = 3-5w short, mastery = `every word mastered ? mastered:training`, `failed_attempts=sum(word)`). Chips: `N recorded attempt(s)` (Story Quest `N=sum`, per-word `attemptsShown` (`mastered ? failed+1 : failed`)).
  - **Still Practicing** — below threshold; **Needs More Practice** — at/above threshold, amber `N recorded attempts · Not yet mastered`.
  - Disclaimer: counts are recorded history, not recommended repetitions.
  - **Story Quest per-word breakdown (2026-09-28)** — each sentence chip is followed by the words that produced it, each with its **own** count and verdict: `cat — 3 recorded attempts · Needs More Practice`, `is — 2 recorded attempts · Recovered`. A word with no history gets no row (`failed_attempts > 0`), matching the teacher page's drill list — a 0-attempt line is noise.
  - **"Recently Conquered" section (2026-09-28)** — **mastered** sentences that still carry history. This is the gate that matters: the Training Zone is filtered to `mastery === 'training'`, so the moment a child conquers the last hard word the sentence flips to mastered and every attempt they spent on it vanishes from the parent report. Gated at `NEEDS_ATTENTION_ATTEMPTS` so one flub is not a conquest, which bounds it to ~0-15 words in practice. Sourced from `recoveredSentenceWordsFrom()`.
  - Payload: `wordAttempts` via `trainingAttemptsFrom()` (Word Blast), `paragraphWordAttempts` via `trainingSentenceAttemptsFrom()` (Story Quest sentences, still the SUM), plus the new `paragraphWordVerdicts` (training sentence -> merged per-word rows) and `paragraphRecovered` (mastered sentence -> recovered words). **Word Blast recovered words remain teacher-only** — never in `wordAttempts`, still not.
  - **The blade holds no logic.** Both Training Zones bucket through `ReportService::verdict()`; the two duplicated inline `@php` blocks that each re-derived the threshold are gone.
- **Recommendation**: banner for **all five statuses** (including `notStarted` / `in_progress`). Copy is template-local wording — deliberately no longer mirrored from the `StudentDetails.jsx` `recommendations` map.

## Sent Tracking

- `students.report_sent_at` timestamp set after each successful email queue (inside `ReportController::sendReportEmails()`).
- Students with a non-null `report_sent_at` are hidden from the selection list and moved to a collapsible "Already Sent" section above the student list.
- Field must be added to `$fillable` in `StudentProfile` model (silent drop otherwise).

## Exports

Excel (`.xlsx`) export via `ReportsExport` (`app/Exports/ReportsExport.php`) is available after the report deadline passes. Three sheets, each a different granularity — see `ReportsExport::sheets()`.

- **Struggle Summary** (tab `Struggle Summary`, `StruggleSummarySheet`): One row per student — Student Name, Student ID, Section, Hardest Module (Word Blast), Hardest Word (Word Blast). Focused on the single highest-struggle Word Blast module/word for teacher triage. Hardest module/word are derived by `ReportService::hardestModuleFrom()` / `hardestWordFrom()` over `status = 'training'` rows only (a mastered row's counter is frozen at "attempts needed to master", a different metric).
- **Session History** (tab `Session History`, `SessionHistorySheet`): One row per played session — Student Name, Student ID, Section, Date/Time Played, Mode (Word Blast/Story Quest), Level, Score, Accuracy (%). Tutorial sessions excluded. Sorted newest-first. **Ignores the report cutoff and the `$students` argument** — it is every `game_sessions` row (known limitation, not covered here).
- **Hardest Words - Story Quest** (tab `Hardest Words - Story Quest`, `SquHardestWordSheet`): Per student — Student Name, Hardest Module (Story Quest), Hardest Word (Story Quest), Recorded Attempts. Story Quest words are merged per sentence (duplicate texts collapsed, attempts summed) before ranking, so the "hardest word" is the one with the highest summed failed attempts across its sentences.

Historical note: an earlier (pre-2026-10) export used different tab names (`Class Summary`, `Student Progress Summary`, `Words Needing Practice`) with charts and a per-student verdict column; those were replaced by the current three-sheet shape. The old names survive only in `CAVEATS.md` BF6/BF10/BF25 rows as historical record.

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history. A top **Overall Status panel** summarizes the student at a glance: colored status badge, per-status recommendation line, a Performance Summary (Word Blast / Story Quest accuracy), and Curriculum Progress — Word Blast `calcOverallProgress` (words), Story Quest `calcSentenceProgress` (`mastered_sentences/total_sentences`, 2 per level uniform). Mastery/Training zones: Word Blast `WordChip` per word (`aggregateZoneRows` direct, no merge), Story Quest is NOT zoned — the 2026-09-28 change replaced the level-grouped list with **5 verdict groups** (`Needs Attention` / `Still Practicing` / `Recovered` / `Not Yet Mastered` / `Mastered`, **none collapsed** — collapsing `Mastered` hid every sentence and its module behind a one-line summary), matching the email and the Excel so all three answer the same question the same way. Grouping scatters a module's sentences across groups, so **each block prints its own `level`** ("Level 3: The Rock" — number and title in one label) and the section header counts total / need attention / recovered / not attempted yet. `SentencePerformanceBlock` per sentence: the sentence text with per-word chips (**positional** — a sentence saying "a … a" shows two chips) over a **merged** drill list (one row per distinct word, attempts summed). The level header is gone: with per-word verdicts a sentence can land in a different group than its module.
