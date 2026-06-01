import { useState, useEffect } from 'react';
import DashboardLayout from '../../Layouts/Teacher/DashboardLayout';

const ParagraphInputModal = ({ isOpen, onClose, level, entries, title, onSave }) => {
    const [currentEntry, setCurrentEntry] = useState(entries?.[0] || '');
    const [currentTitle, setCurrentTitle] = useState(title || `Module ${level}`);

    useEffect(() => {
        setCurrentTitle(title || `Module ${level}`);
        setCurrentEntry(entries?.[0] || '');
    }, [level, entries, title]);

    const calculateTotalPoints = () => {
        return currentEntry?.trim() ? currentEntry.trim().split(/\s+/).filter(Boolean).length : 0;
    };

    const handleSave = () => {
        onSave(level, currentEntry.trim() ? [currentEntry] : [], currentTitle);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border-4 border-slate-800 shadow-[12px_12px_0_0_#020617] w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Level {level} Configuration</h2>
                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">Input sentences or paragraphs for this module</p>
                    </div>
                    <div className="bg-sky-400 text-slate-950 px-4 py-2 rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0_0_#075985] flex flex-col items-center scale-75 origin-right">
                        <span className="text-[10px] font-black uppercase leading-none">Module Value</span>
                        <span className="text-xl font-black italic leading-none">{calculateTotalPoints()} PTS</span>
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

                <div className="mt-10 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#020617] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-4 bg-sky-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#075985] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save Content
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Paragraph() {
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    const [entriesByLevel, setEntriesByLevel] = useState(() => {
        const initialData = {};
        levels.forEach(level => {
            initialData[level] = { entries: [], title: `Module ${level}` };
        });
        return initialData;
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(null);

    const openModal = (level) => {
        setSelectedLevel(level);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedLevel(null);
        setIsModalOpen(false);
    };

    const handleSaveEntries = (level, newEntries, newTitle) => {
        setEntriesByLevel(prev => ({
            ...prev,
            [level]: { entries: newEntries, title: newTitle }
        }));
    };

    const calculateModulePoints = (level) => {
        const data = entriesByLevel[level];
        if (!data || !data.entries) return 0;
        return data.entries.reduce((sum, entry) => 
            sum + (entry.trim() ? entry.trim().split(/\s+/).filter(Boolean).length : 0), 0
        );
    };

    return (
        <>
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Sentence Modules
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Manage paragraph content and point values for each level.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {levels.map((level) => (
                    <div
                        key={level}
                        className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-[10px_10px_0_0_#020617] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group"
                        onClick={() => openModal(level)}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-sky-400 flex items-center justify-center mb-4 rotate-3 group-hover:rotate-0 transition-transform shadow-[4px_4px_0_0_#075985]">
                            <span className="text-2xl font-black text-sky-400">
                            {level}
                            </span>
                        </div>
                        <p className="text-lg font-black text-white uppercase italic tracking-tighter mb-1 truncate w-full px-2">
                            {entriesByLevel[level]?.title || `Module ${level}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate w-full px-2">
                            {calculateModulePoints(level)} Points Total
                        </p>
                        <button
                            className="mt-6 w-full bg-amber-500 text-white px-4 py-3 rounded-xl border-4 border-slate-950 shadow-[4px_4px_0_0_#78350f] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                openModal(level);
                            }}
                        >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Manage
                        </button>
                    </div>
                ))}
            </div>

            <ParagraphInputModal
                isOpen={isModalOpen}
                onClose={closeModal}
                level={selectedLevel}
                entries={entriesByLevel[selectedLevel]?.entries}
                title={entriesByLevel[selectedLevel]?.title}
                onSave={handleSaveEntries}
            />
        </DashboardLayout>
        </>
    );
}


            