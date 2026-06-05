import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import WordInputModal from "@/Components/Teacher/WordInputModal";
import { useState, useEffect } from "react";
export default function Word({ modules }) {
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    const transformModules = (modulesData) => {
        const data = {};
        levels.forEach((level) => {
            const moduleData = modulesData?.find((m) => m.level === level);
            data[level] = {
                words: moduleData
                    ? moduleData.words
                          .sort((a, b) => a.position - b.position)
                          .map((w) => ({ word: w.word, points: w.points }))
                    : [],
                title: moduleData ? moduleData.title : `Module ${level}`,
                totalPoints: moduleData ? moduleData.total_points : 0,
            };
        });
        return data;
    };

    const [wordsByLevel, setWordsByLevel] = useState(() =>
        transformModules(modules),
    );

    useEffect(() => {
        setWordsByLevel(transformModules(modules));
    }, [modules]);

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
                            {wordsByLevel[level]?.title || `Module ${level}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate w-full px-2">
                            {wordsByLevel[level]?.words?.length || 0} / 10 Words
                            • {wordsByLevel[level]?.totalPoints || 0} PTS
                        </p>
                        <button
                            className="mt-6 w-full bg-purple-500 text-white px-4 py-3 rounded-xl border-4 border-slate-950 shadow-[4px_4px_0_0_#4c1d95] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card click from firing
                                openModal(level);
                            }}
                        >
                            <span className="material-symbols-outlined text-sm">
                                edit_note
                            </span>
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
            />
        </DashboardLayout>
    );
}
