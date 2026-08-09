import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/Teacher/DashboardLayout";
import ParagraphInputModal from "../../Components/Teacher/ParagraphInputModal";
import { router, usePage } from "@inertiajs/react";
import ModuleCard from "@/Components/Teacher/ModuleCard";

export default function Paragraph({ modules }) {
    const { auth } = usePage().props;
    const isDeadlineClosed = auth?.deadline && new Date(auth.deadline) <= new Date();
    const levels = modules?.map((m) => m.level).filter((l) => l > 0).sort((a, b) => a - b) ?? [];
    const nextLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;
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
        router.put(
            "/teacher/paragraphModules",
            {
                level: level,
                title: newTitle,
                content: newEntries[0] || "",
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
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        STORY QUEST's Modules
                    </h1>
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                        Manage story quest's content and point values for each
                        level.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {levels.map((level) => (
                        <ModuleCard
                            key={level}
                            level={level}
                            title={entriesByLevel[level]?.title || `Module ${level}`}
                            meta={`${calculateModulePoints(level)} Points Total`}
                            accent="sky"
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
                            accent="sky"
                            disabled={isDeadlineClosed}
                            onClick={() => openModal(nextLevel)}
                        />
                    )}
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