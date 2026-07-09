import { useForm } from "@inertiajs/react";
import { useEffect } from "react";

// A simple Modal component for demonstration
export default function WordInputModal({
    isOpen,
    onClose,
    level,
    words,
    title,
}) {
    const { data, setData, put, processing, errors } = useForm({
        level: level || "",
        title: title || "",
        words:
            words?.map((w) => ({
                word: w.word || "",
            })) || Array.from({ length: 10 }, () => ({ word: "" })),
    });

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
        }
    }, [level, words, title, isOpen]);

    const handleChange = (index, value) => {
        const newWords = [...data.words];
        newWords[index] = { word: value.toUpperCase() };
        setData("words", newWords);
    };

    const handleSave = () => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase"
                                    placeholder="Enter word..."
                                    value={data.words[index]?.word || ""}
                                    onChange={(e) =>
                                        handleChange(index, e.target.value)
                                    }
                                />
                            </div>
                            {errors[`words.${index}.word`] && (
                                <p className="text-rose-500 text-[9px] font-black uppercase ml-12">
                                    {errors[`words.${index}.word`]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-800 text-slate-400 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#020617] md:shadow-[6px_6px_0_0_#020617] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={processing}
                        className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-lime-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#3f6212] md:shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 ${processing ? "opacity-50" : ""}`}
                    >
                        <span className="material-symbols-outlined text-sm">
                            save
                        </span>
                        {processing ? "Saving..." : "Save Words"}
                    </button>
                </div>
            </div>
        </div>
    );
}
