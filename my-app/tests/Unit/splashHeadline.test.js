// ponytail: the regression is a CSS property, so a file-content check is the
// only thing that can catch it (same idiom as liveStats.test.js /
// offlineGuard.test.js). No browser renders layout in this suite.

import fs from "fs";

const src = fs.readFileSync("resources/js/Pages/Student/SplashScreen.jsx", "utf8");
const h1 = (src.match(/<h1[^>]*>/) || [""])[0];

// "WORD-O-MATIC" has no spaces. The only break opportunities are the two
// hyphens, so it wrapped to WORD- / O-MATIC, and `text-balance` balanced that
// into two lines. Worse at 320px, where the old 11vw needed ~280px of the
// 272px available.
describe("SplashScreen headline", () => {
    test("never wraps", () => {
        expect(h1).toContain("whitespace-nowrap");
    });

    test("does not ask the browser to balance a single line", () => {
        // text-balance is a multi-line tool. On a one-line h1 it is at best a
        // no-op and at worst what invited the hyphen break in the first place.
        expect(h1).not.toContain("text-balance");
    });

    test("is sized to fit a 320px phone inside px-6", () => {
        // 7.78em measured advance for WORD-O-MATIC in a heavy italic grotesque,
        // minus 0.04em tracking per char. 9vw at 320px = 28.8px -> 224px, and
        // px-6 leaves 272px. The old 11vw was 280px and wrapped.
        const vw = Number((h1.match(/text-\[clamp\([^,]+,([\d.]+)vw/) || [])[1]);
        expect(Number.isNaN(vw)).toBe(false);
        expect(vw).toBeLessThanOrEqual(9);
        expect(7.78 * (vw / 100) * 320).toBeLessThan(320 - 48);
    });
});
