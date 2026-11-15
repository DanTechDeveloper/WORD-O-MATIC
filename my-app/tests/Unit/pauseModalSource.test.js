import fs from "fs";
const read = (p) => fs.readFileSync(p, "utf8");

const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");
const speakMode = read("resources/js/Pages/Student/GameplaySpeakMode.jsx");

describe("pause modal wiring (source-lock)", () => {
    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s has pause state", (_name, src) => {
        expect(src).toContain("const [isPaused, setIsPaused] = useState(false);");
        expect(src).toContain('setGameState("PAUSED")');
        expect(src).toContain('setGameState("COUNTDOWN")');
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s threads pause props to header", (_name, src) => {
        expect(src).toContain("isPaused,");
        expect(src).toContain("showExitConfirm,");
        expect(src).toContain("onPause: handlePause,");
        expect(src).toContain("onResume: handleResume,");
        expect(src).toContain("onExitRequest: handleExitRequest,");
        expect(src).toContain("onExitCancel: handleExitCancel,");
        expect(src).toContain("onExitConfirm: handleExitConfirm,");
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s keeps socket alive while paused", (_name, src) => {
        expect(src).toContain("gameState === \"COUNTDOWN\" || gameState === \"ACTIVE\" || isPaused");
    });

    // The `preload` option reads `isPaused`, so the state must be declared
    // above the ASR hook call or every render throws a temporal-dead-zone
    // ReferenceError (the page white-screens, no test could mount it).
    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s declares isPaused before the ASR hook reads it", (_name, src) => {
        const declared = src.indexOf("const [isPaused, setIsPaused] = useState(false);");
        const used = src.indexOf("|| isPaused,");
        expect(declared).toBeGreaterThan(-1);
        expect(used).toBeGreaterThan(-1);
        expect(declared).toBeLessThan(used);
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s clears the resume record on exit", (_name, src) => {
        const start = src.indexOf("const handleExitConfirm");
        // Stop at the next top-level const — SpeakMode defines
        // completeGuideEvent BEFORE the pause handlers, so it cannot be the
        // end anchor for both files.
        const handlers = src.slice(start, src.indexOf("\n    const ", start + 10));
        expect(handlers.length).toBeGreaterThan(0);
        expect(handlers).toContain("clearResume()");
        // The pending key can be a failed final POST awaiting replay — never
        // clear it from the exit path.
        expect(handlers).not.toContain("clearPendingSession");
    });
});
