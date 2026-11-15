import fs from "fs";
const read = (p) => fs.readFileSync(p, "utf8");
const coreSrc = read("resources/js/hooks/Student/useGameplayCore.js");

describe("pause-race wiring (source-lock)", () => {
    test("pending advance refs exist", () => {
        expect(coreSrc).toContain("const pendingAdvanceRef = useRef(0);");
        expect(coreSrc).toContain("const pendingMispronounceRef = useRef(false);");
    });

    test("pause preserves pending advance", () => {
        expect(coreSrc).toContain("if (wordRecognizedTimerRef.current) {");
        expect(coreSrc).toContain("pendingMispronounceRef.current = true;");
    });

    test("resume completes pending advance on ACTIVE", () => {
        expect(coreSrc).toContain("if (pendingAdvanceRef.current > 0) {");
        expect(coreSrc).toContain("if (pendingMispronounceRef.current) {");
    });

    test("terminal paths reset pending refs", () => {
        expect(coreSrc).toContain("pendingAdvanceRef.current = 0;");
        expect(coreSrc).toContain("pendingMispronounceRef.current = false;");
    });
});
