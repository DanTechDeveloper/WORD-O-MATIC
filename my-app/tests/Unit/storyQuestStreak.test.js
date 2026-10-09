// @vitest-environment happy-dom
// Locks the ONE decision the story_streak badges depend on: Story Quest's peak
// streak must reach the server WITHOUT ever touching Word Blast's streak.
//
// The risk this file exists for: useStoryQuestEngine returns `{ ...core }` and
// then overrides `currentStreak: streakCount`. If anyone "fixed" the adjacent
// `maxStreak: core.maxStreak` to `maxStreakRef.current`, a Story Quest round
// would start feeding Word Blast streak badges — and nothing else would fail.
// BadgeService scopes `streak` to module_type=word and `story_streak` to
// paragraph, so the SQL would still be right, but the payload would carry a
// paragraph value into a word row's column and the kid's Word Blast meter
// would drift upward on every story they read.
//
// Source-locks, not DOM tests: useGameplayCore needs window + sessionStorage +
// Inertia's router, and streak state only moves through async verdict handlers.
// A source lock is the honest ceiling here — same pattern as
// badgeUnlockModal.test.jsx and gameplayRecovery.test.js.
import { readFileSync } from "fs";
import { describe, expect, test } from "vitest";

const SRC = readFileSync(
    "resources/js/hooks/Student/useStoryQuestEngine.js",
    "utf8",
);
const CORE_SRC = readFileSync(
    "resources/js/hooks/Student/useGameplayCore.js",
    "utf8",
);

describe("Story Quest streak reaches the server", () => {
    test("SQ tracks a peak of its own, distinct from core's", () => {
        // A separate ref is the isolation. If this ever reads `streakRef` as the
        // peak (the running streak, reset on every wrong verdict) the badge would
        // report the last run of the round, not the best one.
        expect(SRC).toContain("const maxStreakRef = useRef(0)");
        expect(SRC).toContain(
            "maxStreakRef.current = Math.max(maxStreakRef.current, streakRef.current)",
        );
    });

    test("the final shake hold reads the peak, not the running streak", () => {
        // The bug this locks: completeSentence() held the end-of-round chip off
        // `streakRef.current`. A round that ran an 8-streak and then missed its
        // last word resets streakRef to 0, so the header showed "WARM!" for the
        // exact round that earned Story Legend. The chip must read the same
        // value the badge consumes or the two disagree about the round.
        const idx = SRC.indexOf("const completeSentence = useCallback");
        const body = SRC.slice(idx, SRC.indexOf("// ponytail: end-of-round bucketing", idx));
        expect(body).toContain("maxStreakRef.current >= 2");
        expect(body).toContain("maxStreakRef.current >= 8");
        expect(body).not.toMatch(/if \(streakRef\.current >= 2\)/);
        // No threshold in the final hold may read the running streak.
        expect(body).not.toMatch(/streakRef\.current >= [258]/);
    });

    test("resetStreak must NOT clear the peak", () => {
        // This is the subtle one. streakRef resets on a wrong verdict; if
        // maxStreakRef reset with it, a kid who ran an 8-streak and then missed
        // one word would submit 0 and never see Story Legend.
        const reset = SRC.slice(SRC.indexOf("const resetStreak"));
        const body = reset.slice(0, reset.indexOf("}, []"));
        expect(body).not.toContain("maxStreakRef.current = 0");
    });

    test("the payload override is sent via persistExtra, not by binding core", () => {
        // `...extra` spreads AFTER `streak: maxStreakRef.current` in core's
        // payload object, so the override wins. If core's spread order changed,
        // this would silently send core's value instead.
        expect(SRC).toContain("streak: maxStreakRef.current");
        const corePayload = CORE_SRC.slice(
            CORE_SRC.indexOf("const payload = {"),
            CORE_SRC.indexOf("client_token: clientToken"),
        );
        expect(corePayload.indexOf("streak: maxStreakRef.current")).toBeGreaterThan(
            -1,
        );
        expect(corePayload.indexOf("...extra")).toBeGreaterThan(
            corePayload.indexOf("streak: maxStreakRef.current"),
        );
    });

    test("persistExtra stays referentially stable", () => {
        // Churned identity resets the 60s timer effect in core. The deps are
        // empty BECAUSE maxStreakRef is a ref — a useState would break this.
        const idx = SRC.indexOf("const persistExtra = useCallback");
        const chunk = SRC.slice(idx, SRC.indexOf("[]", idx) + 2);
        expect(chunk).toContain("sentence_scores");
        expect(chunk).toContain("streak: maxStreakRef.current");
    });
});

describe("Word Blast streak stays out of Story Quest", () => {
    test("the returned maxStreak stays core's, never SQ's peak", () => {
        // THE guard. Binding this to SQ's peak would let a story round raise
        // the Word Blast meter on resume (core reads resume.maxStreak at
        // useGameplayCore.js:90).
        expect(SRC).toContain("maxStreak: core.maxStreak");
        const ret = SRC.slice(SRC.indexOf("return {"));
        expect(ret).not.toMatch(/maxStreak:\s*(maxStreakRef|streakRef)/);
    });

    test("the resume record carries SQ's peak but a zero currentStreak", () => {
        // maxStreak is what the badge consumes, so it must survive an F5.
        // currentStreak stays 0 deliberately: it is mid-round-reset state that
        // core never reads for SQ.
        expect(SRC).toContain("maxStreak: maxStreakRef.current");
        expect(SRC).toContain("currentStreak: 0");
    });

    test("SQ still shadows currentStreak with its own count", () => {
        expect(SRC).toContain("currentStreak: streakCount");
    });
});

describe("Word Blast is the only writer of the core streak", () => {
    test("core's streak increments live in handleWordRecognized alone", () => {
        // The single write site. SQ routes through its own handleWordRecognized
        // and core.addScore (score only), so this function never runs for SQ.
        const hits = CORE_SRC.match(/currentStreakRef\.current \+= 1;/g) || [];
        expect(hits).toHaveLength(1);
        const idx = CORE_SRC.indexOf("currentStreakRef.current += 1;");
        const owner = CORE_SRC.lastIndexOf(
            "const handleWordRecognized = useCallback",
            idx,
        );
        const sqHandler = CORE_SRC.indexOf("const handleSentenceVerdict");
        expect(owner).toBeGreaterThan(-1);
        // handleSentenceVerdict does not exist in core at all — it is SQ-only,
        // so no second increment path can exist.
        expect(sqHandler).toBe(-1);
    });

    test("addScore is score-only and never touches the streak", () => {
        const idx = CORE_SRC.indexOf("const addScore = useCallback");
        const body = CORE_SRC.slice(idx, CORE_SRC.indexOf("}, []", idx));
        expect(body).toContain("setWordsSmashed");
        expect(body).not.toContain("Streak");
    });

    test("SQ calls addScore and its own bumpStreak, never core's handler", () => {
        expect(SRC).toContain("core.addScore(n)");
        expect(SRC).toContain("bumpStreak(n)");
        // If SQ called core.handleWordRecognized, core's streak would move.
        expect(SRC).not.toContain("core.handleWordRecognized(");
    });
});