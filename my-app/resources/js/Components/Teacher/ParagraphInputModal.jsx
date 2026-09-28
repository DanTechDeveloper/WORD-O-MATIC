import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

export default function ParagraphInputModal({
    isOpen,
    onClose,
    level,
    entries,
    title,
    totalScore,
    onSave,
    // ponytail: has_progress = mastery OR progress (see TeacherController) —
    // i.e. this module is LOCKED. Story Quest needs this MORE than Word Blast:
    // its word rows are derived from the free text, so an edit also moves
    // totalPossible and orphans every paragraph_word_id a live round holds.
    hasProgress = false,
}) {
    const { errors } = usePage().props;
    const [currentEntry, setCurrentEntry] = useState(entries?.[0] || "");
    const [currentTitle, setCurrentTitle] = useState(
        title || `Module ${level}`,
    );
    // ponytail: no useForm here, so no `processing` to read — this is the double-
    // click guard for the UNLOCKED path. Without it a second click fires a second
    // PUT and runs saveWithContent() twice. Unrelated to the lock.
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentTitle(title || `Module ${level}`);
            setCurrentEntry(entries?.[0] || "");
            setSaving(false);
        }
    }, [level, entries, title, isOpen]);

    // ponytail: unblock the button when the server rejects. updateParagraphModule
    // validates only level/title/content, so these two keys are the whole failure
    // surface — close+reopen resets anything else.
    useEffect(() => {
        if (errors.title || errors.content) setSaving(false);
    }, [errors.title, errors.content]);

    // Вычисляем количество очков на основе количества слов (реальное время)
    const calculateTotalPoints = () => {
        return currentEntry?.trim()
            ? currentEntry.trim().split(/\s+/).filter(Boolean).length
            : 0;
    };

    // ponytail: no change-detection and no confirm. A locked module is simply
    // not editable — anything else would be a warning the teacher can dismiss,
    // and the damage (mastery/progress cascade) is not undoable.
    const performSave = () => {
        setSaving(true);
        // Передаем вычисленные очки в родительский компонент
        onSave(
            level,
            currentEntry.trim() ? [currentEntry] : [],
            currentTitle,
            calculateTotalPoints(),
        );
    };

    // ponytail: the double-click guard for the unlocked path only.
    const handleSave = () => {
        if (saving) return;
        performSave();
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-4 sm:p-6 md:p-10 rounded-[2.5rem] border-4 border-slate-800 shadow-[8px_8px_0_0_#020617] md:shadow-[12px_12px_0_0_#020617] w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
                            Level {level} Configuration
                        </h2>
                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">
                            Input sentences or paragraphs for this module
                        </p>
                    </div>
                    <div className="bg-sky-400 text-slate-950 px-4 py-2 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#075985] flex flex-col items-center scale-75 origin-right">
                        <span className="text-[10px] font-black uppercase leading-none">
                            Module Value
                        </span>
                        <span className="text-xl font-black italic leading-none">
                            {calculateTotalPoints()} PTS
                        </span>
                    </div>
                </div>

                {hasProgress && (
                    <div className="mb-6 bg-rose-950/50 border-2 border-rose-500 rounded-xl px-4 py-3">
                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            Locked — students have played this module
                        </p>
                        <p className="text-rose-200 text-xs font-bold leading-snug">
                            Saving rebuilds this module's words from the text,
                            which resets every student's mastery and progress on
                            it. Its content can no longer be changed.
                        </p>
                    </div>
                )}

                <div className="mb-6">
                    <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-sky-500 transition-all uppercase text-lg read-only:opacity-60"
                        placeholder="Edit Module Title..."
                        readOnly={hasProgress}
                    />
                    {errors.title && (
                        <p className="mt-2 text-rose-400 text-xs font-black uppercase tracking-widest">
                            {errors.title}
                        </p>
                    )}
                </div>

                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    <div className="flex items-start gap-4">
                        <textarea
                            value={currentEntry}
                            onChange={(e) => {
                                setCurrentEntry(e.target.value);
                            }}
                            rows={8}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all resize-none text-base sm:text-lg lg:text-xl leading-relaxed read-only:opacity-60"
                            placeholder="Enter paragraph content here..."
                            readOnly={hasProgress}
                        />
                    </div>
                    {errors.content && (
                        <p className="text-rose-400 text-xs font-black uppercase tracking-widest">
                            {errors.content}
                        </p>
                    )}
                </div>

                <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-800 text-slate-400 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#020617] md:shadow-[6px_6px_0_0_#020617] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        Cancel
                    </button>
                    {!hasProgress && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !currentEntry.trim() || !currentTitle.trim()}
                        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-sky-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#075985] md:shadow-[6px_6px_0_0_#075985] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#075985] md:disabled:hover:shadow-[6px_6px_0_0_#075985]"
                    >
                        <span className="material-symbols-outlined text-sm">
                            save
                        </span>
                        {saving ? "Saving..." : "Save Content"}
                    </button>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
