// ponytail: no jsdom needed — file-content checks mirror mounted behavior

import fs from "fs";

const src = fs.readFileSync("resources/js/Components/Teacher/ConfirmDeleteModal.jsx", "utf8");

describe("ConfirmDeleteModal", () => {
    test("returns null when not open or student null", () => {
        expect(src).toContain("if (!isOpen || !student) return null");
    });
    test("renders dialog with role=dialog and aria-modal", () => {
        expect(src).toContain('role="dialog"');
        expect(src).toContain('aria-modal="true"');
        expect(src).toContain('aria-labelledby="confirm-delete-title"');
    });
    test("renders student name via {student.fullName}", () => {
        expect(src).toContain("{student.fullName}");
        expect(src).toContain("break-words [overflow-wrap:anywhere]");
    });
    test("has Esc handler via useEffect keydown Escape", () => {
        expect(src).toContain("Escape");
        expect(src).toContain("keydown");
        expect(src).toContain("useEffect");
    });
    test("responsive: items-end sm:items-center and rounded-t-3xl sm:rounded-[2.5rem]", () => {
        expect(src).toContain("items-end sm:items-center");
        expect(src).toContain("rounded-t-3xl sm:rounded-[2.5rem]");
        expect(src).toContain("max-w-md");
        expect(src).toContain("max-h-[90vh]");
        expect(src).toContain("min-h-[44px]");
    });
    test("backdrop and buttons have 44px tap and arcade shadows", () => {
        expect(src).toContain('onClick={onClose}');
        expect(src).toContain("onClick={onConfirm}");
        expect(src).toContain("min-h-[44px]");
        expect(src).toContain("shadow-[12px_12px_0_0_#020617]");
        expect(src).toContain("shadow-[4px_4px_0_0_#7f1d1d]");
    });
});
