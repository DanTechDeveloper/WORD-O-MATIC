import fs from "fs";
const read = (p) => fs.readFileSync(p, "utf8");

const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");
const speakMode = read("resources/js/Pages/Student/GameplaySpeakMode.jsx");
const coreSrc = read("resources/js/hooks/Student/useGameplayCore.js");

describe("POST accuracy — page-level mastery wiring (source-lock)", () => {
    test("ReadMode posts mastered/training to updateWordMastery", () => {
        expect(readMode).toContain('axios.post("/student/updateWordMastery"');
        expect(readMode).toContain('status: "mastered"');
        expect(readMode).toContain('status: "training"');
        expect(readMode).toContain("word_id: wordObj.id");
    });

    test("SpeakMode posts mastered/training to updateParagraphMastery", () => {
        expect(speakMode).toContain('axios.post("/student/updateParagraphMastery"');
        expect(speakMode).toContain('status: "mastered"');
        expect(speakMode).toContain('status: "training"');
        expect(speakMode).toContain("paragraph_word_id: wordObj.id");
    });

    test("mastery posts are guarded by wordObj && !isTutorialModule", () => {
        expect(readMode).toContain("if (wordObj && !isTutorialModule)");
        expect(speakMode).toContain("if (wordObj && !isTutorialModule)");
    });

    test("pause/exit handlers do not auto-persist or post mastery", () => {
        // Extract handler bodies roughly by checking the handlePause..handleExitConfirm region
        // contains no axios/router post calls.
        const readHandlers = readMode.slice(
            readMode.indexOf("const handlePause"),
            readMode.indexOf("const completeGuideEvent"),
        );
        const speakHandlers = speakMode.slice(
            speakMode.indexOf("const handlePause"),
            // SpeakMode declares completeGuideEvent BEFORE the pause handlers, so
            // that string is not a valid end anchor here (start > end => empty slice
            // => the "no POST in pause handlers" lock was silently vacuous for SpeakMode).
            // The next top-level declaration after handleExitConfirm is the hook's own
            // `const { reconnecting }`, which bounds the pause/exit block correctly.
            speakMode.indexOf("const { reconnecting }"),
        );
        expect(readHandlers).not.toContain("axios.post");
        expect(readHandlers).not.toContain("router.post");
        expect(speakHandlers).not.toContain("axios.post");
        expect(speakHandlers).not.toContain("router.post");
    });
});

describe("POST accuracy — idempotency & refs (source-lock)", () => {
    test("persistProgress uses hasSaved guard before router.post", () => {
        expect(coreSrc).toContain("if (!hasSaved.current) {");
        expect(coreSrc).toContain("hasSaved.current = true;");
        expect(coreSrc).toContain("router.post(saveEndpoint, payload, {");
    });

    test("onError resets hasSaved for retry", () => {
        expect(coreSrc).toContain("hasSaved.current = false;");
    });

    test("durable commit writes pending session before router.post", () => {
        expect(coreSrc).toContain("writePendingSession(moduleId, {");
    });

    test("payload uses refs not raw state", () => {
        expect(coreSrc).toContain("words_smashed: wordsSmashedRef.current,");
        expect(coreSrc).toContain("words_processed: currentWordIndexRef.current,");
        expect(coreSrc).toContain("streak: maxStreakRef.current,");
    });

    test("client_token is generated and included", () => {
        expect(coreSrc).toContain("const clientToken = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;");
        expect(coreSrc).toContain("client_token: clientToken,");
    });

    test("tutorial posts without client_token (deferPersist branch)", () => {
        expect(coreSrc).toContain("const { client_token: _ct, ...payloadNoToken } = payload;");
        expect(coreSrc).toContain("router.post(saveEndpoint, payloadNoToken, {");
    });
});
