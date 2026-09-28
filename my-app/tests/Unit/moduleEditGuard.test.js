// ponytail: no jsdom needed — file-content checks mirror mounted behavior
// (same convention as confirmDeleteModal.test.js). These lock the hard-lock
// contract: a module with student data (mastery OR progress) is not editable,
// and none of the earlier confirm/force machinery may creep back in.

import fs from "fs";

const word = fs.readFileSync(
    "resources/js/Components/Teacher/WordInputModal.jsx",
    "utf8",
);
const para = fs.readFileSync(
    "resources/js/Components/Teacher/ParagraphInputModal.jsx",
    "utf8",
);
const paraPage = fs.readFileSync(
    "resources/js/Pages/Teacher/Paragraph.jsx",
    "utf8",
);
const wordPage = fs.readFileSync(
    "resources/js/Pages/Teacher/Word.jsx",
    "utf8",
);
const teacherCtrl = fs.readFileSync(
    "app/Http/Controllers/TeacherController.php",
    "utf8",
);

describe("module edit lock", () => {
    // The confirm+force path was replaced by "not editable at all". Bringing
    // either back would mean the teacher can dismiss the warning that used to
    // let a module with student data be rewritten.
    test("neither modal has the confirm/force machinery", () => {
        for (const src of [word, para]) {
            expect(src).not.toContain("ConfirmModal");
            expect(src).not.toContain("confirmOpen");
            expect(src).not.toContain("force");
            expect(src).not.toContain("isChanged");
            expect(src).not.toContain("changedCount");
        }
    });

    // "Hidden", not "disabled" — a disabled Save still invites a click and
    // still leaves the teacher wondering whether it would work.
    test("Save is not rendered when the module is locked", () => {
        for (const src of [word, para]) {
            expect(src).toContain("{!hasProgress &&");
        }
    });

    test("inputs are readOnly when locked", () => {
        for (const src of [word, para]) {
            expect(src).toContain("readOnly={hasProgress}");
        }
    });

    // Copy of WordInputModal's own problemCount banner, now also used for the
    // lock. Must exist in BOTH modals or Story Quest silently locks with no
    // explanation.
    test("both render the lock banner with its reason", () => {
        for (const src of [word, para]) {
            expect(src).toContain("bg-rose-950/50 border-2 border-rose-500");
            expect(src).toContain("Locked — students have played this module");
        }
    });

    // hasProgress must mean "has data", not "has mastery". A round that matched
    // nothing leaves a progress row and zero mastery rows; a half-read round the
    // student abandoned leaves mastery rows and no progress row.
    test("has_progress is the union of mastery and progress", () => {
        expect(teacherCtrl).toContain(
            "StudentWordProgress::whereIn('word_module_id'",
        );
        expect(teacherCtrl).toContain(
            "StudentParagraphProgress::whereIn('paragraph_module_id'",
        );
        expect(teacherCtrl).toContain("StudentWordMastery::whereIn('word_id'");
        expect(teacherCtrl).toContain(
            "StudentParagraphMastery::whereIn('paragraph_word_id'",
        );
    });

    // The flag already flows end-to-end on both pages — the lock change added no
    // prop plumbing, so these are here to catch an accidental rename.
    test("the flag is still plumbed page -> modal on both modes", () => {
        expect(wordPage).toContain(
            "hasProgress={wordsByLevel[selectedLevel]?.hasProgress}",
        );
        expect(paraPage).toContain(
            "hasProgress={entriesByLevel[selectedLevel]?.hasProgress}",
        );
    });

    // The gate is the enforcement now that the UI hides Save: a raw PUT must
    // still be refused. force stays as a deliberate out-of-band escape.
    test("the server gate is intact and its message no longer promises a confirm", () => {
        expect(teacherCtrl).toContain("! $request->boolean('force')");
        expect(teacherCtrl).toContain("student_word_mastery");
        expect(teacherCtrl).toContain("student_paragraph_mastery");
        expect(teacherCtrl).not.toContain("confirm to proceed");
    });

    // ParagraphInputModal has no useForm, so `saving` is its only double-click
    // guard on the unlocked path. Losing it fires two PUTs.
    test("the unlocked path still has a double-click guard", () => {
        expect(para).toContain("if (saving) return;");
        expect(word).toContain("disabled={processing || !canSave}");
    });
});
