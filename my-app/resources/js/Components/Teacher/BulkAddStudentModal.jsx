import React, { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";

const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

export default function BulkAddStudentModal({
    isOpen,
    onClose,
    existingStudentIds = new Set(),
}) {
    const { post, processing, errors, reset, setData } = useForm({ students: [] });
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

    const parseRows = () => {
        const next = [];
        rawText.split("\n").forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const parts = trimmed.split(",").map((p) => p.trim());
            const malformed = parts.length !== 3;

            next.push({
                key: idx,
                fullName: parts[0] ?? "",
                studentID: parts[1] ?? "",
                section: parts.length > 2 ? parts.slice(2).join(", ") : "",
                pin: generatePin(),
                gender: "",
                parent_email: "",
                parseError: malformed ? "Expected: Name, ID, Section" : null,
            });
        });

        setRows(next);
        setStage("preview");
    };

    const updateRow = (key, field, value) => {
        setRows((prev) =>
            prev.map((r) =>
                r.key === key ? { ...r, [field]: value, parseError: null } : r,
            ),
        );
    };

    const removeRow = (key) => setRows((prev) => prev.filter((r) => r.key !== key));

    const refreshPin = (key) => updateRow(key, "pin", generatePin());

    const nameOk = (r) => r.fullName.trim().length > 0;
    const idOk = (r) => r.studentID.trim().length > 0;
    const sectionOk = (r) => r.section.trim().length > 0;
    const pinOk = (r) => /^\d{4}$/.test(r.pin);

    const dupInBatch = (rows, i) => {
        const id = rows[i].studentID.trim().toLowerCase();
        if (!id) return false;
        return rows.some((r, j) => j !== i && r.studentID.trim().toLowerCase() === id);
    };

    const rowFieldError = (rows, r, i, field) => {
        switch (field) {
            case "fullName":
                return nameOk(r) ? null : "Full name is required.";
            case "studentID":
                if (!idOk(r)) return "Student ID is required.";
                if (dupInBatch(rows, i)) return "Appears twice in this list.";
                return existingStudentIds.has(r.studentID.trim().toLowerCase())
                    ? "This ID is already registered."
                    : null;
            case "section":
                return sectionOk(r) ? null : "Section is required.";
            case "pin":
                return pinOk(r) ? null : "PIN must be 4 digits.";
            case "parent_email":
                if (r.parent_email.trim() === "") return null;
                return /^\S+@\S+\.\S+$/.test(r.parent_email.trim())
                    ? null
                    : "Enter a valid email.";
            default:
                return null;
        }
    };

    const shownError = (rows, r, i, field) =>
        rowFieldError(rows, r, i, field) || errors[`students.${i}.${field}`];

    const rowInvalid = (rows, r, i) =>
        r.parseError ||
        ["fullName", "studentID", "section", "pin", "parent_email"].some((f) =>
            rowFieldError(rows, r, i, f),
        );

    const validCount = rows.filter((r, i) => !rowInvalid(rows, r, i)).length;
    const formValid =
        rows.length > 0 && rows.length <= 50 && validCount === rows.length;

    if (!isOpen) return null;

    const handleSubmit = (e) => {
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
                setStage("paste");
                setRawText("");
            },
        });
    };

    const inputClass = (rows, r, i, field) =>
        `w-full bg-slate-950 border-3 sm:border-4 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-sm text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700 ${
            shownError(rows, r, i, field) ? "border-rose-500" : "border-slate-800"
        }`;

    const tier1Grid =
        "grid grid-cols-[1.5rem_1fr_1fr_2.25rem_2.25rem] gap-1.5 sm:gap-2 items-start sm:grid-cols-[1.5rem_1fr_1fr_1fr_2.25rem_2.25rem]";
    const tier2Grid =
        "grid grid-cols-1 sm:grid-cols-[5.5rem_10rem_1fr] gap-1.5 sm:gap-2 items-start";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-background/80"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-slate-800 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto">
                <header className="bg-slate-800/50 p-4 sm:p-6 border-b-4 border-slate-800 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">
                            playlist_add
                        </span>
                        Bulk Deploy Students
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {stage === "paste" ? (
                    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
                        <p className="text-xs sm:text-sm text-slate-400 font-bold">
                            One student per line, comma-separated:
                            <span className="text-lime-400"> Name, ID, Section</span>.
                            PINs are auto-generated. Gender & email are optional
                            per row.
                        </p>

                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={"LEO JUPITER, 2023-000001, 6-STEM-B\nMARIA SANTOS, 2023-000002, 6-STEM-B"}
                            className="w-full h-48 bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-2xl p-4 text-sm font-mono text-white focus:border-purple-500 outline-none transition-all placeholder:text-slate-700 resize-none"
                        />

                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                            Up to 50 students per batch.
                        </p>

                        <button
                            type="button"
                            onClick={parseRows}
                            disabled={rawText.trim() === ""}
                            className="w-full sm:w-auto bg-lime-400 text-slate-950 font-black uppercase italic py-3 sm:px-8 text-sm rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">play_arrow</span>
                            Parse Students
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                        {validCount < rows.length && (
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-950/50 border-2 border-rose-800 rounded-2xl px-4 py-2.5">
                                <p className="text-[11px] sm:text-xs font-black text-rose-400 uppercase tracking-wider">
                                    {rows.length - validCount} row{rows.length - validCount > 1 ? "s" : ""} need attention
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStage("paste")}
                                    className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider underline underline-offset-4"
                                >
                                    Edit raw text
                                </button>
                            </div>
                        )}
                        {validCount === rows.length && (
                            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                <p className="text-[11px] sm:text-xs font-black text-lime-400 uppercase tracking-wider">
                                    All {rows.length} row{rows.length > 1 ? "s" : ""} ready
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStage("paste")}
                                    className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-wider underline underline-offset-4"
                                >
                                    Edit raw text
                                </button>
                            </div>
                        )}

                        {rows.length === 0 && (
                            <p className="text-sm text-slate-400 font-bold text-center py-8">
                                No students parsed.
                            </p>
                        )}

                        {rows.length > 50 && (
                            <div className="bg-rose-950/50 border-2 border-rose-800 rounded-2xl px-4 py-2.5">
                                <p className="text-[11px] sm:text-xs font-black text-rose-400 uppercase tracking-wider">
                                    Max 50 students per batch — split the list and
                                    deploy twice.
                                </p>
                            </div>
                        )}

                        {rows.length > 0 && (
                            <div className="overflow-x-auto pb-2">
                                <div className={`${tier1Grid} text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 pb-1`}>
                                    <span>#</span>
                                    <span>Full Name</span>
                                    <span>Student ID</span>
                                    <span className="order-6 col-span-5 sm:order-none sm:col-span-1">
                                        Section
                                    </span>
                                    <span className="hidden sm:block"></span>
                                    <span className="hidden sm:block"></span>
                                </div>

                                <div className="space-y-3">
                                    {rows.map((r, i) => (
                                        <div
                                            key={r.key}
                                            className="bg-slate-950/30 border-2 border-slate-800 rounded-2xl p-2.5 sm:p-3 space-y-2"
                                        >
                                            {r.parseError && (
                                                <p className="text-rose-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                                                    {r.parseError}
                                                </p>
                                            )}

                                            <div className={tier1Grid}>
                                                <span className="pt-2.5 text-xs font-black text-slate-600">
                                                    {i + 1}
                                                </span>

                                                <div>
                                                    <input
                                                        type="text"
                                                        value={r.fullName}
                                                        onChange={(e) => updateRow(r.key, "fullName", e.target.value)}
                                                        className={inputClass(rows, r, i, "fullName")}
                                                        placeholder="Name"
                                                    />
                                                    {shownError(rows, r, i, "fullName") && (
                                                        <p className="text-rose-500 text-[9px] font-black mt-1 uppercase ml-1">
                                                            {shownError(rows, r, i, "fullName")}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        type="text"
                                                        value={r.studentID}
                                                        onChange={(e) => updateRow(r.key, "studentID", e.target.value)}
                                                        className={inputClass(rows, r, i, "studentID")}
                                                        placeholder="e.g. 2023-000001"
                                                    />
                                                    {shownError(rows, r, i, "studentID") && (
                                                        <p className="text-rose-500 text-[9px] font-black mt-1 uppercase ml-1">
                                                            {shownError(rows, r, i, "studentID")}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="order-6 col-span-5 sm:order-none sm:col-span-1">
                                                    <input
                                                        type="text"
                                                        value={r.section}
                                                        onChange={(e) => updateRow(r.key, "section", e.target.value)}
                                                        className={inputClass(rows, r, i, "section")}
                                                        placeholder="e.g. 6-STEM-B"
                                                    />
                                                    {shownError(rows, r, i, "section") && (
                                                        <p className="text-rose-500 text-[9px] font-black mt-1 uppercase ml-1">
                                                            {shownError(rows, r, i, "section")}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => refreshPin(r.key)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border-2 border-slate-950 transition-all flex items-center justify-center"
                                                    title="Regenerate PIN"
                                                >
                                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(r.key)}
                                                    className="bg-slate-800 hover:bg-rose-900/60 text-white p-2 rounded-lg border-2 border-slate-950 transition-all flex items-center justify-center"
                                                    title="Remove row"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>

                                            <div className={tier2Grid}>
                                                <div>
                                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">
                                                        PIN
                                                    </label>
                                                    <input
                                                        readOnly
                                                        type="text"
                                                        value={r.pin}
                                                        className="w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-lime-400 font-black text-sm tracking-[0.25em] text-center outline-none"
                                                    />
                                                    {shownError(rows, r, i, "pin") && (
                                                        <p className="text-rose-500 text-[9px] font-black mt-1 uppercase ml-1">
                                                            {shownError(rows, r, i, "pin")}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">
                                                        Gender
                                                    </label>
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateRow(r.key, "gender", r.gender === "male" ? "" : "male")}
                                                            className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${r.gender === "male" ? "bg-sky-900/50 border-sky-500 text-sky-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"}`}
                                                            title="Male"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">male</span>
                                                            Male
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateRow(r.key, "gender", r.gender === "female" ? "" : "female")}
                                                            className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${r.gender === "female" ? "bg-pink-900/50 border-pink-500 text-pink-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"}`}
                                                            title="Female"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">female</span>
                                                            Female
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={r.parent_email}
                                                        onChange={(e) => updateRow(r.key, "parent_email", e.target.value)}
                                                        className={inputClass(rows, r, i, "parent_email")}
                                                        placeholder="parent@email.com"
                                                    />
                                                    {shownError(rows, r, i, "parent_email") && (
                                                        <p className="text-rose-500 text-[9px] font-black mt-1 uppercase ml-1">
                                                            {shownError(rows, r, i, "parent_email")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase py-3 text-sm rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 transition-all shadow-[4px_4px_0_0_#020617] active:translate-y-0.5 active:shadow-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !formValid}
                                className={`flex-1 bg-lime-400 text-slate-950 font-black uppercase italic py-3 text-sm rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all ${processing || !formValid ? "opacity-50 cursor-not-allowed" : ""}`}
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
