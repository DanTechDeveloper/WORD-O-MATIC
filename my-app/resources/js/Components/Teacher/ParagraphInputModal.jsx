import { useEffect, useState } from "react";
import Modal from "@/Components/Teacher/Modal";

export default function ParagraphInputModal({
    isOpen,
    onClose,
    level,
    entries,
    title,
    totalScore,
    onSave,
}) {
    const [currentEntry, setCurrentEntry] = useState(entries?.[0] || "");
    const [currentTitle, setCurrentTitle] = useState(
        title || `Module ${level}`,
    );

    useEffect(() => {
        if (isOpen) {
            setCurrentTitle(title || `Module ${level}`);
            setCurrentEntry(entries?.[0] || "");
        }
    }, [level, entries, title, isOpen]);

    const calculateTotalPoints = () => {
        return currentEntry?.trim()
            ? currentEntry.trim().split(/\s+/).filter(Boolean).length
            : 0;
    };

    const handleSave = () => {
        onSave(
            level,
            currentEntry.trim() ? [currentEntry] : [],
            currentTitle,
            calculateTotalPoints(),
        );
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} variant="float" maxWidth="max-w-xl">
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

            <div className="mb-6">
                <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-sky-500 transition-all uppercase text-lg"
                    placeholder="Edit Module Title..."
                />
            </div>

            <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                <div className="flex items-start gap-4">
                    <textarea
                        value={currentEntry}
                        onChange={(e) => {
                            setCurrentEntry(e.target.value);
                        }}
                        rows={8}
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all resize-none text-xl leading-relaxed"
                        placeholder="Enter paragraph content here..."
                    />
                </div>
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
                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-sky-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#075985] md:shadow-[6px_6px_0_0_#075985] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">
                        save
                    </span>
                    Save Content
                </button>
            </div>
        </Modal>
    );
}