import { resumeKey, readResumeSession, writeResumeSession, clearResumeSession, pendingKey, readPendingSession, writePendingSession, clearPendingSession } from "@/utils/resumeStorage.js";

// ponytail: minimal sessionStorage mock — vitest runs node env, no jsdom needed
function installSessionStorageMock() {
    const store = new Map();
    const mock = {
        getItem(k) { return store.has(k) ? store.get(k) : null; },
        setItem(k, v) { store.set(String(k), String(v)); },
        removeItem(k) { store.delete(k); },
        clear() { store.clear(); },
    };
    globalThis.sessionStorage = mock;
    globalThis.window = { sessionStorage: mock };
    return mock;
}
const mockStorage = installSessionStorageMock();

describe("resumeStorage — mid-round resume", () => {
    beforeEach(() => mockStorage.clear());

    test("resumeKey prefixes correctly", () => {
        expect(resumeKey(42)).toBe("wordomaticResume:42");
        expect(resumeKey("abc")).toBe("wordomaticResume:abc");
    });

    test("write + read round-trips resume session", () => {
        writeResumeSession(7, { currentWordIndex: 3, wordsSmashed: 2, currentStreak: 1, maxStreak: 1, timeLeft: 45 });
        const s = readResumeSession(7);
        expect(s.currentWordIndex).toBe(3);
        expect(s.wordsSmashed).toBe(2);
        expect(s.timeLeft).toBe(45);
        expect(s.moduleId).toBe(7);
    });

    test("read returns null for missing or wrong moduleId", () => {
        writeResumeSession(7, { currentWordIndex: 1, wordsSmashed: 1, currentStreak: 0, maxStreak: 0, timeLeft: 60 });
        expect(readResumeSession(8)).toBeNull();
        expect(readResumeSession(null)).toBeNull();
    });

    test("clear removes only that moduleId", () => {
        writeResumeSession(1, { currentWordIndex: 1, wordsSmashed: 1, currentStreak: 0, maxStreak: 0, timeLeft: 60 });
        writeResumeSession(2, { currentWordIndex: 2, wordsSmashed: 2, currentStreak: 0, maxStreak: 0, timeLeft: 50 });
        clearResumeSession(1);
        expect(readResumeSession(1)).toBeNull();
        expect(readResumeSession(2)).not.toBeNull();
    });

    test("string vs number moduleId both match (WordModule id comes as string from Inertia)", () => {
        writeResumeSession("10", { currentWordIndex: 5, wordsSmashed: 5, currentStreak: 0, maxStreak: 0, timeLeft: 30 });
        expect(readResumeSession(10)).not.toBeNull();
        expect(readResumeSession("10")).not.toBeNull();
    });

    test("timeLeft is clamped 0-60 on read", () => {
        writeResumeSession(20, { currentWordIndex: 0, wordsSmashed: 0, currentStreak: 0, maxStreak: 0, timeLeft: 999 });
        expect(readResumeSession(20).timeLeft).toBe(60);
        writeResumeSession(21, { currentWordIndex: 0, wordsSmashed: 0, currentStreak: 0, maxStreak: 0, timeLeft: -5 });
        expect(readResumeSession(21).timeLeft).toBe(0);
    });

    test("timeLeft is corrected by elapsed since savedAt (prevents 60s reset exploit + tab-sleep drift)", () => {
        const now = Date.now();
        writeResumeSession(30, { currentWordIndex: 2, wordsSmashed: 2, currentStreak: 0, maxStreak: 0, timeLeft: 50, savedAt: now - 10000 });
        const s = readResumeSession(30);
        // 10s elapsed → 40
        expect(s.timeLeft).toBe(40);
        // tampered 60 with old savedAt still subtracts
        writeResumeSession(31, { currentWordIndex: 0, wordsSmashed: 0, currentStreak: 0, maxStreak: 0, timeLeft: 60, savedAt: now - 30000 });
        expect(readResumeSession(31).timeLeft).toBe(30);
        // expired → 0 not negative
        writeResumeSession(32, { currentWordIndex: 0, wordsSmashed: 0, currentStreak: 0, maxStreak: 0, timeLeft: 5, savedAt: now - 10000 });
        expect(readResumeSession(32).timeLeft).toBe(0);
    });
});

describe("resumeStorage — pending commit (F5 while finishRound slow)", () => {
    beforeEach(() => mockStorage.clear());

    test("pendingKey prefixes correctly", () => {
        expect(pendingKey(99)).toBe("wordomaticPending:99");
    });

    test("write + read round-trips pending payload including sentence_scores", () => {
        writePendingSession(5, {
            saveEndpoint: "/student/saveParagraphProgress",
            words_smashed: 5,
            words_processed: 5,
            streak: 0,
            sentence_scores: [3, 2],
            client_token: "abc-123",
            createdAt: 1234567890,
        });
        const p = readPendingSession(5);
        expect(p.saveEndpoint).toBe("/student/saveParagraphProgress");
        expect(p.words_smashed).toBe(5);
        expect(p.sentence_scores).toEqual([3, 2]);
        expect(p.client_token).toBe("abc-123");
        expect(p.createdAt).toBe(1234567890);
        expect(p.moduleId).toBe(5);
    });

    test("pending and resume use separate keys", () => {
        writeResumeSession(9, { currentWordIndex: 1, wordsSmashed: 1, currentStreak: 0, maxStreak: 0, timeLeft: 60 });
        writePendingSession(9, { saveEndpoint: "/student/saveWordProgress", words_smashed: 1, words_processed: 1, streak: 1, createdAt: 1 });
        expect(readResumeSession(9)).not.toBeNull();
        expect(readPendingSession(9)).not.toBeNull();
        clearPendingSession(9);
        expect(readPendingSession(9)).toBeNull();
        expect(readResumeSession(9)).not.toBeNull();
    });

    test("read returns null for wrong moduleId", () => {
        writePendingSession(7, { saveEndpoint: "/student/saveWordProgress", words_smashed: 1, words_processed: 1, streak: 0, createdAt: 1 });
        expect(readPendingSession(8)).toBeNull();
    });

    test("clearPending removes only that moduleId", () => {
        writePendingSession(1, { saveEndpoint: "/student/saveWordProgress", words_smashed: 1, words_processed: 1, streak: 0, createdAt: 1 });
        writePendingSession(2, { saveEndpoint: "/student/saveWordProgress", words_smashed: 2, words_processed: 2, streak: 0, createdAt: 2 });
        clearPendingSession(1);
        expect(readPendingSession(1)).toBeNull();
        expect(readPendingSession(2)).not.toBeNull();
    });

    test("word blast pending payload round-trips", () => {
        writePendingSession(3, { saveEndpoint: "/student/saveWordProgress", words_smashed: 7, words_processed: 10, streak: 3, createdAt: 999 });
        const p = readPendingSession(3);
        expect(p.words_smashed).toBe(7);
        expect(p.words_processed).toBe(10);
        expect(p.streak).toBe(3);
    });

    test("pending survives simulated refresh (sessionStorage persists within same tab)", () => {
        writePendingSession(11, { saveEndpoint: "/student/saveWordProgress", words_smashed: 4, words_processed: 5, streak: 2, createdAt: 1 });
        // simulate reload: re-read without clearing
        const before = readPendingSession(11);
        expect(before).not.toBeNull();
        // second read same key
        const after = readPendingSession(11);
        expect(after).toEqual(before);
    });

    test("tampered saveEndpoint is stripped on read (whitelist)", () => {
        writePendingSession(12, { saveEndpoint: "/evil/deleteAll", words_smashed: 1, words_processed: 1, streak: 0, createdAt: 1 });
        const p = readPendingSession(12);
        expect(p.saveEndpoint).toBeUndefined();
        writePendingSession(13, { saveEndpoint: "/student/saveWordProgress", words_smashed: 1, words_processed: 1, streak: 0, createdAt: 1 });
        expect(readPendingSession(13).saveEndpoint).toBe("/student/saveWordProgress");
    });
});
