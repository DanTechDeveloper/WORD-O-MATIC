import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/Teacher/DashboardLayout";
import ParagraphInputModal from "../../Components/Teacher/ParagraphInputModal";
import { router } from "@inertiajs/react";

export default function Paragraph({ modules }) {
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    const transformModules = (modulesData) => {
        const data = {};
        levels.forEach((level) => {
            const moduleData = modulesData?.find((m) => m.level === level);
            data[level] = {
                entries: moduleData?.content ? [moduleData.content] : [],
                title: moduleData ? moduleData.title : `Module ${level}`,
                totalScore: moduleData ? moduleData.total_score : 0,
            };
        });
        return data;
    };

    const [entriesByLevel, setEntriesByLevel] = useState(() =>
        transformModules(modules),
    );

    useEffect(() => {
        setEntriesByLevel(transformModules(modules));
    }, [modules]);

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

    const handleSaveEntries = (level, newEntries, newTitle, newPoints) => {
        // Отправляем данные на сервер, включая обновленные очки
        router.put(
            "/teacher/paragraphModules",
            {
                level: level,
                title: newTitle,
                content: newEntries[0] || "",
                total_score: newPoints,
            },
            {
                onSuccess: () => closeModal(),
            },
        );
    };

    const calculateModulePoints = (level) => {
        return entriesByLevel[level]?.totalScore || 0;
    };

    return (
        <>
            <DashboardLayout>
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        Sentence Modules
                    </h1>
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                        Manage paragraph content and point values for each
                        level.
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
                                {entriesByLevel[level]?.title ||
                                    `Module ${level}`}
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
                                <span className="material-symbols-outlined text-sm">
                                    edit_note
                                </span>
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
                    totalScore={entriesByLevel[selectedLevel]?.totalScore}
                    onSave={handleSaveEntries}
                />
            </DashboardLayout>
        </>
    );
}
