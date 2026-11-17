import React, { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";

const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

const fieldClass = (error) =>
    `w-full bg-surface-container-lowest border-2 rounded-lg p-2.5 text-sm text-on-surface font-bold focus:outline-none focus:border-accent transition-colors placeholder:text-on-surface-variant/40 ${
        error ? "border-error" : "border-outline/20"
    }`;

const errorClass =
    "text-error text-[10px] font-black mt-1 uppercase tracking-wider ml-1";

export default function BulkAddStudentModal({
    isOpen,
    onClose,
    existingStudentIds = new Set(),
}) {
    const { setData, post, processing, errors, reset } = useForm({ students: [] });
    const [stage, setStage] = useState("paste");
    const [rawText, setRawText] = useState("");
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setStage("paste");
            setRawText("");
            setRows([]);
            reset();
        }
    }, [isOpen]);

    function parseRows() {
        const next = [];
        rawText.split("\n").forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const parts = trimmed.split(",").map((part) => part.trim());
            next.push({
                key: idx,
                fullName: parts[0] ?? "",
                studentID: parts[1] ?? "",
                section: parts.slice(2).join(", "),
                pin: generatePin(),
                gender: "",
                parent_email: "",
                parseError:
                    parts.length !== 3 ? "Expected: Name, ID, Section" : null,
            });
        });
        setRows(next);
        setStage("preview");
    }

    function updateRow(key, field, value) {
        setRows((prev) =>
            prev.map((row) =>
                row.key === key ? { ...row, [field]: value, parseError: null } : row,
            ),
        );
    }

    const idOf = (row) => row.studentID.trim().toLowerCase();

    function rowError(rows, row, i, field) {
        switch (field) {
            case "fullName":
                return row.fullName.trim() ? null : "Full name is required.";
            case "studentID":
                if (!row.studentID.trim()) return "Student ID is required.";
                if (rows.some((other, j) => j !== i && idOf(other) === idOf(row)))
                    return "Appears twice in this list.";
                return existingStudentIds.has(idOf(row))
                    ? "This ID is already registered."
                    : null;
            case "section":
                return row.section.trim() ? null : "Section is required.";
            case "pin":
                return /^\d{4}$/.test(row.pin) ? null : "PIN must be 4 digits.";
            case "parent_email":
                return !row.parent_email.trim() ||
                    /^\S+@\S+\.\S+$/.test(row.parent_email.trim())
                    ? null
                    : "Enter a valid email.";
            default:
                return null;
        }
    }

    const shownError = (rows, row, i, field) =>
        rowError(rows, row, i, field) || errors[`students.${i}.${field}`];

    const rowInvalid = (rows, row, i) =>
        row.parseError ||
        ["fullName", "studentID", "section", "pin", "parent_email"].some((f) =>
            rowError(rows, row, i, f),
        );

    const validCount = rows.filter((row, i) => !rowInvalid(rows, row, i)).length;
    const formValid =
        rows.length > 0 && rows.length <= 50 && validCount === rows.length;

    if (!isOpen) return null;

    function handleSubmit(e) {
        e.preventDefault();
        setData(
            "students",
            rows.map(({ fullName, studentID, section, pin, gender, parent_email }) => ({
                fullName,
                studentID,
                section,
                pin,
                gender: gender || "",
                parent_email: parent_email || "",
            })),
        );
        post("/teacher/addStudents", {
            onSuccess: () => {
                onClose();
                setRows([]);
                setRawText("");
                setStage("paste");
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-background/80"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl bg-surface-container border-4 border-outline/20 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto">
                <header className="bg-surface-container-high p-4 sm:p-6 border-b-4 border-outline/20 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">
                            playlist_add
                        </span>
                        Bulk Deploy Students
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {stage === "paste" ? (
                    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
                        <p className="text-xs sm:text-sm text-on-surface-variant font-bold">
                            One student per line, comma-separated:{" "}
                            <span className="text-accent">Name, ID, Section</span>.
                            PINs are auto-generated. Gender &amp; email are
                            optional per row.
                        </p>

                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={"LEO JUPITER, 2023-000001, 6-STEM-B\nMARIA SANTOS, 2023-000002, 6-STEM-B"}
                            className="w-full h-48 bg-surface-container-lowest border-2 border-outline/20 rounded-2xl p-4 text-sm font-mono text-on-surface focus:border-accent focus:outline-none transition-colors placeholder:text-on-surface-variant/40 resize-none"
                        />

                        <p className="text-[10px] text-on-surface-variant/70 font-black uppercase tracking-tight">
                            Up to 50 students per batch.
                        </p>

                        <button
                            type="button"
                            onClick={parseRows}
                            disabled={rawText.trim() === ""}
                            className="w-full sm:w-auto bg-accent text-background font-black uppercase italic py-3 sm:px-8 text-sm rounded-xl border-2 border-accent-deep shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">
                                play_arrow
                            </span>
                            Parse Students
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                            <p
                                className={`text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                                    validCount === rows.length
                                        ? "text-accent"
                                        : "text-error"
                                }`}
                            >
                                {validCount === rows.length
                                    ? `All ${rows.length} row${rows.length !== 1 ? "s" : ""} ready`
                                    : `${rows.length - validCount} row${rows.length - validCount !== 1 ? "s" : ""} need attention`}
                            </p>
                            <button
                                type="button"
                                onClick={() => setStage("paste")}
                                className="text-[10px] font-black text-on-surface-variant hover:text-white uppercase tracking-wider underline underline-offset-4"
                            >
                                Edit raw text
                            </button>
                        </div>

                        {rows.length === 0 && (
                            <p className="text-sm text-on-surface-variant font-bold text-center py-8">
                                No students parsed.
                            </p>
                        )}

                        {rows.length > 50 && (
                            <div className="bg-error-container/50 border-2 border-error rounded-2xl px-4 py-2.5">
                                <p className="text-[11px] sm:text-xs font-black text-error uppercase tracking-wider">
                                    Max 50 students per batch — split the list and
                                    deploy twice.
                                </p>
                            </div>
                        )}

                        {rows.length > 0 && (
                            <div className="space-y-3">
                                {rows.map((row, i) => (
                                    <div
                                        key={row.key}
                                        className="bg-surface-container-lowest border-2 border-outline/20 rounded-2xl p-3 sm:p-4 space-y-3"
                                    >
                                        {row.parseError && (
                                            <p className={errorClass}>
                                                {row.parseError}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-start gap-2">
                                            <span className="pt-2.5 text-xs font-black text-on-surface-variant">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-[140px]">
                                                <input
                                                    type="text"
                                                    value={row.fullName}
                                                    onChange={(e) =>
                                                        updateRow(row.key, "fullName", e.target.value)
                                                    }
                                                    className={fieldClass(shownError(rows, row, i, "fullName"))}
                                                    placeholder="Full name"
                                                />
                                                {shownError(rows, row, i, "fullName") && (
                                                    <p className={errorClass}>
                                                        {shownError(rows, row, i, "fullName")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-[140px]">
                                                <input
                                                    type="text"
                                                    value={row.studentID}
                                                    onChange={(e) =>
                                                        updateRow(row.key, "studentID", e.target.value)
                                                    }
                                                    className={fieldClass(shownError(rows, row, i, "studentID"))}
                                                    placeholder="Student ID"
                                                />
                                                {shownError(rows, row, i, "studentID") && (
                                                    <p className={errorClass}>
                                                        {shownError(rows, row, i, "studentID")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-[120px]">
                                                <input
                                                    type="text"
                                                    value={row.section}
                                                    onChange={(e) =>
                                                        updateRow(row.key, "section", e.target.value)
                                                    }
                                                    className={fieldClass(shownError(rows, row, i, "section"))}
                                                    placeholder="Section"
                                                />
                                                {shownError(rows, row, i, "section") && (
                                                    <p className={errorClass}>
                                                        {shownError(rows, row, i, "section")}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setRows((prev) =>
                                                        prev.filter((r) => r.key !== row.key),
                                                    )
                                                }
                                                title="Remove row"
                                                className="mt-1 p-2 rounded-lg border-2 border-outline/20 text-on-surface-variant hover:text-error hover:border-error transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    close
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-end gap-3 pl-6">
                                            <div>
                                                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1 mb-1">
                                                    PIN
                                                </label>
                                                <div className="flex gap-1">
                                                    <input
                                                        readOnly
                                                        type="text"
                                                        value={row.pin}
                                                        className="w-20 bg-surface-container-lowest border-2 border-outline/20 rounded-lg p-2.5 text-accent font-black text-sm tracking-[0.25em] text-center outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateRow(row.key, "pin", generatePin())
                                                        }
                                                        title="Regenerate PIN"
                                                        className="p-2 rounded-lg border-2 border-outline/20 text-on-surface-variant hover:text-accent hover:border-accent transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            refresh
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1 mb-1">
                                                    Gender
                                                </label>
                                                <div className="flex gap-1">
                                                    {[
                                                        ["male", "male", "Male"],
                                                        ["female", "female", "Female"],
                                                    ].map(([value, icon, label]) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() =>
                                                                updateRow(
                                                                    row.key,
                                                                    "gender",
                                                                    row.gender === value ? "" : value,
                                                                )
                                                            }
                                                            className={`flex items-center gap-1 px-2 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${
                                                                row.gender === value
                                                                    ? "bg-primary-container border-primary text-on-primary-container"
                                                                    : "bg-surface-container-lowest border-outline/20 text-on-surface-variant"
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">
                                                                {icon}
                                                            </span>
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-[160px]">
                                                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1 mb-1">
                                                    Email (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={row.parent_email}
                                                    onChange={(e) =>
                                                        updateRow(row.key, "parent_email", e.target.value)
                                                    }
                                                    className={fieldClass(shownError(rows, row, i, "parent_email"))}
                                                    placeholder="parent@email.com"
                                                />
                                                {shownError(rows, row, i, "parent_email") && (
                                                    <p className={errorClass}>
                                                        {shownError(rows, row, i, "parent_email")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-surface-container-high text-white font-black uppercase py-3 text-sm rounded-xl border-2 border-outline/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !formValid}
                                className={`flex-1 bg-accent text-background font-black uppercase italic py-3 text-sm rounded-xl border-2 border-accent-deep shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all ${
                                    processing || !formValid
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {processing
                                    ? "Deploying..."
                                    : `Deploy ${validCount} Student${validCount !== 1 ? "s" : ""}`}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
