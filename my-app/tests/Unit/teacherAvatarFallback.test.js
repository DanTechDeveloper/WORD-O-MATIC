// Source-lock: teacher views must all fall back to the same LOCAL default
// avatar. StudentDetails used to ship a hardcoded googleusercontent URL and the
// two ranking pages used a `person` icon — three different answers to the same
// blank-gender student.
import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");

const files = [
    "resources/js/Pages/Teacher/Students.jsx",
    "resources/js/Pages/Teacher/StudentDetails.jsx",
    "resources/js/Pages/Teacher/Leaderboards.jsx",
    "resources/js/Pages/Teacher/Badges.jsx",
];

describe("teacher avatar fallback", () => {
    test.each(files)("%s uses the local default avatar", (path) => {
        const src = read(path);
        expect(src).toContain('"/images/boy.svg"');
        expect(src).not.toContain("googleusercontent");
    });
});
