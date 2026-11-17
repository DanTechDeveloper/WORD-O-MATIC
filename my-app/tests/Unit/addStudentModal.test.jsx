// @vitest-environment happy-dom
// Locks that a successful single add invalidates the teacher's cached live list.
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@inertiajs/react", () => ({
    useForm: () => ({
        data: {
            fullName: "LEO JUPITER",
            studentID: "2023-000001",
            section: "6-STEM-B",
            pin: "1234",
            gender: "",
            parent_email: "",
        },
        setData: vi.fn(),
        post: (_url, opts) => opts?.onSuccess?.(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    }),
}));

const AddStudentModal = (
    await import("@/Components/Teacher/AddStudentModal.jsx")
).default;

afterEach(() => cleanup());

describe("add student modal", () => {
    test("a successful add calls onCreated so the students list refreshes", () => {
        const onCreated = vi.fn();
        render(
            <AddStudentModal
                isOpen={true}
                onClose={() => {}}
                onCreated={onCreated}
            />,
        );

        fireEvent.click(screen.getByText("Add Student"));
        expect(onCreated).toHaveBeenCalledTimes(1);
    });
});
