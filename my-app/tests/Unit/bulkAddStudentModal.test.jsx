// @vitest-environment happy-dom
// Locks the bulk-paste parser: grammar, auto-PIN, and the two client guards the
// server cannot own (malformed line, intra-batch duplicate ID).
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@inertiajs/react", () => ({
    useForm: () => ({
        setData: vi.fn(),
        post: (_url, opts) => opts?.onSuccess?.(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    }),
}));

const BulkAddStudentModal = (
    await import("@/Components/Teacher/BulkAddStudentModal.jsx")
).default;

afterEach(() => cleanup());

function openModal(existingIds = new Set()) {
    render(
        <BulkAddStudentModal
            isOpen={true}
            onClose={() => {}}
            existingStudentIds={existingIds}
        />,
    );
}

function paste(text) {
    fireEvent.change(screen.getByPlaceholderText(/LEO JUPITER/), {
        target: { value: text },
    });
    fireEvent.click(screen.getByText("Parse Students"));
}

describe("bulk add student modal parser", () => {
    test("parses Name, ID, Section lines and auto-generates a PIN per row", () => {
        openModal();
        paste(
            "LEO JUPITER, 2023-000001, 6-STEM-B\nMARIA SANTOS, 2023-000002, 6-STEM-B",
        );

        expect(screen.getByDisplayValue("LEO JUPITER")).toBeTruthy();
        expect(screen.getByDisplayValue("MARIA SANTOS")).toBeTruthy();
        expect(screen.getByDisplayValue("2023-000001")).toBeTruthy();
        expect(screen.getByDisplayValue("2023-000002")).toBeTruthy();
        expect(screen.getAllByDisplayValue("6-STEM-B").length).toBe(2);
        expect(screen.getAllByDisplayValue(/^\d{4}$/).length).toBe(2);
        expect(screen.getByText("All 2 rows ready")).toBeTruthy();
    });

    test("a malformed line is flagged and blocks deployment", () => {
        openModal();
        paste("BAD LINE");

        expect(screen.getByText("Expected: Name, ID, Section")).toBeTruthy();
        expect(screen.getByText(/need attention/)).toBeTruthy();
        expect(screen.getByText(/Deploy 0 Student/).disabled).toBe(true);
    });

    test("duplicate IDs inside the batch are flagged", () => {
        openModal();
        paste(
            "A, 2023-0001, S\nB, 2023-0001, S",
        );

        expect(screen.getAllByText("Appears twice in this list.").length).toBe(2);
        expect(screen.getByText(/Deploy 0 Student/).disabled).toBe(true);
    });

    test("an ID already in the roster is flagged", () => {
        openModal(new Set(["2023-0001"]));
        paste("A, 2023-0001, S");

        expect(screen.getByText("This ID is already registered.")).toBeTruthy();
        expect(screen.getByText(/Deploy 0 Student/).disabled).toBe(true);
    });

    test("a successful deploy calls onCreated so the students list refreshes", () => {
        const onCreated = vi.fn();
        render(
            <BulkAddStudentModal
                isOpen={true}
                onClose={() => {}}
                onCreated={onCreated}
            />,
        );
        paste("A, 2023-0001, S");
        fireEvent.click(screen.getByText(/Deploy 1 Student/));

        expect(onCreated).toHaveBeenCalledTimes(1);
    });
});
