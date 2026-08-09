import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function WordInputModal({
    isOpen,
    onClose,
    level,
    words,
    title,
    hasProgress = false,
    takenWords = {},
}) {
    const { data, setData, put, processing, errors } = useForm({
        level: level || "",
        title: title || "",
        words:
            words?.map((w) => ({
                word: w.word || "",
            })) || Array.from({ length: 10 }, () => ({ word: "" })),
    });

    const [showPaste, setShowPaste] = useState(false);
    const [pasteText, setPasteText] = useState("");

    useEffect(() => {
        if (isOpen) {
            const normalizedWords = Array.from({ length: 10 }, (_, i) => {
                const existing = words?.[i];
                return {
                    word: existing?.word || "",
                };
            });

            setData({
                level: level,
                title: title || `Module ${level}`,
                words: normalizedWords,
            });
            setPasteText("");
            setShowPaste(false);
        }
    }, [level, words, title, isOpen]);

    const handleChange = (index, value) => {
        const newWords = [...data.words];
        newWords[index] = { word: value.toUpperCase() };
        setData("words", newWords);
    };

    const normalized = data.words.map((w) => w.word.trim().toLowerCase());

    const countMap = {};
    normalized.forEach((w) => {
        if (w) countMap[w] = (countMap[w] || 0) + 1;
    });

    const rowError = (index) => {
        const word = normalized[index];
        if (!word) return null;
        if (countMap[word] > 1) {
            return `${data.words[index].word} is already used in this module`;
        }
        if (takenWords[word] !== undefined) {
            return `${data.words[index].word} is already used in Level ${takenWords[word]}`;
        }
        return null;
    };

    const problemCount = data.words.reduce(
        (total, _, index) => total + (rowError(index) ? 1 : 0),
        0,
    );
    const isComplete = normalized.every((w) => w !== "");
    const canSave = isComplete && problemCount === 0;

    const handleSave = () => {
        if (
            hasProgress &&
            !window.confirm(
                "Editing this module will reset students' progress on its words. Continue?",
            )
        ) {
            return;
        }
        put("/teacher/wordModules", {
            onSuccess: () => onClose(),
        });
    };

    const calculateTotalPoints = () => {
        return data.words.filter((w) => w.word.trim()).length;
    };

    const handleTitleChange = (e) => {
        setData("title", e.target.value);
    };

    const handleFill = () => {
        const parts = pasteText
            .split(/[\s,]+/)
            .map((p) => p.trim().toUpperCase())
            .filter(Boolean);
        const newWords = Array.from({ length: 10 }, (_, i) => ({
            word: parts[i] || "",
        }));
        setData("words", newWords);
        setPasteText("");
        setShowPaste(false);
    };

    if (!isOpen) return null;

    const inputClass = (index) =>
        `w-full bg-slate-950 border-2 rounded-xl pl-12 pr-10 py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase ${
            rowError(index) ? "border-rose-500" : "border-slate-800"
        }`;

    return (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border-4 border-slate-800 shadow-[8px_8px_0_0_#020617] md:shadow-[12px_12px_0_0_#020617] w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
                            Level {level} Configuration
                        </h2>
                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">
                            Input 10 vocabulary entries for this module
                        </p>
                    </div>
                    <div className="bg-lime-400 text-slate-950 px-4 py-2 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#3f6212] flex flex-col items-center scale-75 origin-right">
                        <span className="text-[10px] font-black uppercase leading-none">
                            Module Value
                        </span>
                        <span className="text-xl font-black italic leading-none">
                            {calculateTotalPoints()} PTS
                        </span>
                    </div>
                </div>
                {problemCount > 0 && (
                    <div className="mb-6 bg-rose-950/50 border-2 border-rose-500 rounded-xl px-4 py-3">
                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            {problemCount} word{problemCount > 1 ? "s" : ""} need attention
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {data.words.map((w, index) =>
                                rowError(index) ? (
                                    <span
                                        key={index}
                                        className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg"
                                    >
                                        {w.word}
                                    </span>
                                ) : null,
                            )}
                        </div>
                    </div>
                )}
                <div className="mb-6">
                    <input
                        type="text"
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase text-lg"
                        placeholder="Edit Module Title..."
                        value={data.title}
                        onChange={handleTitleChange}
                    />
                    {errors.title && (
                        <p className="text-rose-500 text-[10px] font-black mt-1 uppercase">
                            {errors.title}
                        </p>
                    )}
                </div>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="space-y-1">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">
                                    W-{index + 1}
                                </span>
                                <input
                                    type="text"
                                    className={inputClass(index)}
                                    placeholder="Enter word..."
                                    value={data.words[index]?.word || ""}
                                    onChange={(e) =>
                                        handleChange(index, e.target.value)
                                    }
                                />
                                {rowError(index) && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 font-black text-sm">
                                        ✗
                                    </span>
                                )}
                            </div>
                            {rowError(index) && (
                                <p className="text-rose-500 text-[9px] font-black uppercase ml-12">
                                    {rowError(index)}
                                </p>
                            )}
                            {errors[`words.${index}.word`] && (
                                <p className="text-rose-500 text-[9px] font-black uppercase ml-12">
                                    {errors[`words.${index}.word`]}
                                </p>
                            )}
                        </div>
                    ))}
                    {showPaste ? (
                        <div className="space-y-2">
                            <textarea
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase"
                                rows="4"
                                placeholder="Paste up to 10 words, separated by spaces or commas..."
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowPaste(false)}
                                    className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl border-2 border-slate-950 font-black uppercase italic text-[10px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFill}
                                    className="px-4 py-2 bg-lime-400 text-slate-950 rounded-xl border-2 border-slate-950 font-black uppercase italic text-[10px]"
                                >
                                    Fill Words
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowPaste(true)}
                            className="w-full px-4 py-3 bg-slate-800 text-slate-400 rounded-xl border-2 border-slate-950 font-black uppercase italic text-xs tracking-tighter hover:bg-slate-700 transition-all"
                        >
                            Paste 10 words
                        </button>
                    )}
                </div>
                <div className="mt-6 md:mt-10 flex flex-col items-end gap-3">
                    {!canSave && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {problemCount > 0
                                ? "Resolve duplicate words to save."
                                : "Fill all 10 words to save."}
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-800 text-slate-400 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#020617] md:shadow-[6px_6px_0_0_#020617] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={processing || !canSave}
                            className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-lime-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#3f6212] md:shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 ${processing || !canSave ? "opacity-50" : ""}`}
                        >
                            <span className="material-symbols-outlined text-sm">
                                save
                            </span>
                            {processing ? "Saving..." : "Save Words"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
