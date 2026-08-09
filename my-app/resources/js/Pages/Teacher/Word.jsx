import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import WordInputModal from "@/Components/Teacher/WordInputModal";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import ModuleCard from "@/Components/Teacher/ModuleCard";

export default function Word({ modules }) {
    const { auth } = usePage().props;
    const isDeadlineClosed = auth?.deadline && new Date(auth.deadline) <= new Date();
    const levels = modules?.map((m) => m.level).filter((l) => l > 0).sort((a, b) => a - b) ?? [];
    const nextLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;
    const transformModules = (modulesData) => {
        const data = {};
        levels.forEach((level) => {
            const moduleData = modulesData?.find((m) => m.level === level);
            data[level] = {
                words: moduleData
                    ? moduleData.words
                          .sort((a, b) => a.position - b.position)
                          .map((w) => ({ word: w.word }))
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
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    WORD BLAST Modules
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Manage word blast lists for each academic level.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {levels.map((level) => (
                    <ModuleCard
                        key={level}
                        level={level}
                        title={wordsByLevel[level]?.title || `Module ${level}`}
                        meta={`${wordsByLevel[level]?.words?.length || 0} / 10 Words • ${wordsByLevel[level]?.totalPoints || 0} PTS`}
                        accent="lime"
                        disabled={isDeadlineClosed}
                        onClick={() => openModal(level)}
                    />
                ))}
                {levels.length < 10 && (
                    <ModuleCard
                        key="add-module"
                        level={nextLevel}
                        title="Add Module"
                        isAdd
                        accent="lime"
                        disabled={isDeadlineClosed}
                        onClick={() => openModal(nextLevel)}
                    />
                )}
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