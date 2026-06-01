import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { useState, useEffect } from "react";

// A simple Modal component for demonstration
const WordInputModal = ({ isOpen, onClose, level, words, title, onSave }) => {
    const [currentWords, setCurrentWords] = useState(words || Array(10).fill(''));
    const [currentTitle, setCurrentTitle] = useState(title || `Module ${level}`);

    useEffect(() => {
        setCurrentWords(words || Array(10).fill(''));
        setCurrentTitle(title || `Module ${level}`);
    }, [level, words, title]);

    const handleChange = (index, value) => {
        const newWords = [...currentWords];
        newWords[index] = value.toUpperCase();
        setCurrentWords(newWords);
    };
    
    const handleTitleChange = (e) => {
        setCurrentTitle(e.target.value);
    };

    const handleSave = () => {
        onSave(level, currentWords.filter(word => word.trim() !== ''), currentTitle);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border-4 border-slate-800 shadow-[12px_12px_0_0_#020617] w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="mb-6">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Level {level} Configuration</h2>
                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">Input 10 vocabulary entries for this module</p>
                </div>
                <div className="mb-6">
                    <input
                        type="text"
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase text-lg"
                        placeholder="Edit Module Title..."
                        value={currentTitle}
                        onChange={handleTitleChange}
                    />
                </div>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">W-{index + 1}</span>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all uppercase"
                                placeholder="Enter word..."
                                value={currentWords[index] || ''}
                                onChange={(e) => handleChange(index, e.target.value)}
                            />
                        </div>
                    ))}
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
                        className="px-8 py-4 bg-lime-400 text-slate-950 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save Words
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Word() {
    // State to store words for each level. Example: { 1: ['apple', 'banana'], 2: ['cat', 'dog'] }
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    const [wordsByLevel, setWordsByLevel] = useState(() => {
        const initialData = {};
        levels.forEach(level => {
            initialData[level] = { words: [], title: `Module ${level}` };
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
        setIsModalOpen(false);
        setSelectedLevel(null);
    };

    const handleSaveWords = (level, newWords, newTitle) => {
        setWordsByLevel(prev => ({
            ...prev,
            [level]: { words: newWords, title: newTitle }
        }));
    };

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Vocabulary Modules
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Manage word lists for each academic level.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {levels.map((level) => (
                    <div
                        key={level}
                        className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-[10px_10px_0_0_#020617] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group"
                        onClick={() => openModal(level)}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-lime-400 flex items-center justify-center mb-4 rotate-3 group-hover:rotate-0 transition-transform shadow-[4px_4px_0_0_#3f6212]">
                            <span className="text-2xl font-black text-lime-400">
                            {level}
                            </span>
                        </div>
                        <p className="text-lg font-black text-white uppercase italic tracking-tighter mb-1">
                            Module {level}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate w-full px-2">
                            {wordsByLevel[level]?.words?.length || 0} / 10 Words
                        </p>
                        <button
                            className="mt-6 w-full bg-purple-500 text-white px-4 py-3 rounded-xl border-4 border-slate-950 shadow-[4px_4px_0_0_#4c1d95] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card click from firing
                                openModal(level);
                            }}
                        >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Manage
                        </button>
                    </div>
                ))}
            </div>

            <WordInputModal
                isOpen={isModalOpen}
                onClose={closeModal}
                level={selectedLevel}
                words={wordsByLevel[selectedLevel]?.words}
                title={wordsByLevel[selectedLevel]?.title}
                onSave={handleSaveWords}
            />
        </DashboardLayout>
    );
}