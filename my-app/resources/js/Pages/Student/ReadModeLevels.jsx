import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { useState, useEffect } from "react";

export default function ReadModeLevels({ modules }) {
    console.log("Modules data received:", modules); // Debug log
    const transformModulesToMissions = (modulesData) => {
        if (!modulesData || !Array.isArray(modulesData)) return [];

        // Define only positions, as styling will be dynamic based on status
        const basePositions = [
            { top: "150px", left: "100px" },
            { top: "350px", left: "350px" },
            { top: "150px", left: "600px" },
            { top: "350px", left: "850px" },
            { top: "150px", left: "1100px" },
            { top: "350px", left: "1350px" },
        ];

        return modulesData.map((moduleData, index) => {
            const level = moduleData.level || index + 1;

            const position = basePositions[index] || {
                top: index % 2 === 0 ? "150px" : "350px",
                left: `${100 + index * 250}px`,
            }; // Trust the controller mapping
            const status = moduleData.status || "locked";
            const totalPoints = moduleData.total_points || 0;

            const title = moduleData.title || `Module ${level}`;
            let subTitle = "";
            let icon = "lock";
            let textColor = "on-surface-variant"; // Default text/icon color for locked

            if (status === "completed") {
                subTitle = "Mastered!";
                icon = "check_circle";
                textColor = "slate-950"; // Color for completed icon/text
            } else if (status === "current") {
                subTitle = "Ready to Launch 🚀";
                icon = "rocket_launch";
                textColor = "white"; // Color for current icon/text
            } else {
                // locked
                subTitle = `Locked: Level ${level}`;
                icon = "lock";
                textColor = "on-surface-variant";
            }

            return {
                id: moduleData.id, // Fixed: Use database ID for navigation
                level: level, // Display level number
                status: status,
                points: totalPoints, // Ito ang total items
                // score: moduleData.words_smashed || 0, // Ito ang nakuha ng student
                title: title,
                subTitle: subTitle,
                icon: icon,
                textColor: textColor,
                top: position.top,
                left: position.left,
            };
        });
    };

    const [missions, setMissions] = useState(() =>
        transformModulesToMissions(modules),
    );

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const newMissions = transformModulesToMissions(modules);
        setMissions(newMissions);

        const currentMissionIndex = newMissions.findIndex(
            (m) => m.status === "current",
        );
        setActiveIndex(currentMissionIndex !== -1 ? currentMissionIndex : 0); // Default to first mission if no 'current'
    }, [modules]);

    const getPathD = () => {
        // ... (getPathD function remains largely the same)
        let path = "";
        missions.forEach((mission, index) => {
            const centerX = parseInt(mission.left) + 64;
            const centerY = parseInt(mission.top) + 64;

            if (index === 0) {
                path += `M ${centerX} ${centerY}`;
            } else {
                const prevMission = missions[index - 1];
                const prevCenterX = parseInt(prevMission.left) + 64;
                const prevCenterY = parseInt(prevMission.top) + 64;

                const midX = (prevCenterX + centerX) / 2;
                let controlYOffset = 100; // How much the curve "bends"
                if (index % 2 === 0) {
                    // Alternate the direction of the curve
                    controlYOffset *= -1;
                }

                const controlX = midX;
                const controlY = (prevCenterY + centerY) / 2 + controlYOffset;

                path += ` Q ${controlX} ${controlY} ${centerX} ${centerY}`;
            }
        });
        return path;
    };

    const pathD = getPathD();

    const handlePrev = () => {
        setActiveIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setActiveIndex((prev) => Math.min(missions.length - 1, prev + 1));
    };

    return (
        <DashboardLayout minimal={true}>
            <div className="bg-surface-container rounded-3xl p-6 md:p-10 border-4 border-surface-variant neo-3d-shadow h-full overflow-hidden">
                {/* <!-- Main Container --> */}
                {/* <!-- Mission Map Viewport --> */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-950/20 pt-28 pb-10">
                    {" "}
                    {/* Container for the map and its internal header */}
                    {/* Glass-Morphism Header (now with smaller text) */}
                    <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-white/10 backdrop-blur-md rounded-t-2xl flex flex-col md:flex-row items-center gap-4">
                        <Link
                            href="/student/dashboard"
                            className="bg-surface-container-high border-4 border-surface-variant p-2 rounded-full text-on-surface flex items-center justify-center hover:bg-surface-variant active-3d transition-all aspect-square shadow-lg"
                        >
                            <span className="material-symbols-outlined text-5xl">
                                arrow_back
                            </span>
                        </Link>

                        <div className="text-center text-4xl flex-1 text-center md:text-left">
                            <h2 className="text-on-surface text-4xl font-black uppercase italic">
                                Level {missions[activeIndex]?.level}:{" "}
                                {missions[activeIndex]?.title} ⚔️
                            </h2>
                            <p className="text-on-surface-variant text-sm font-bold">
                                {missions[activeIndex]?.subTitle}
                            </p>
                        </div>

                        <div className="bg-lime-400 text-slate-950 px-4 py-1 rounded-lg font-black text-base border-b-2 border-lime-700">
                            {missions[activeIndex]?.points || 0} PTS
                        </div>
                    </div>
                    {/* Navigation Controls */}
                    <div className="absolute inset-y-0 left-0 flex items-center z-20 pl-4 pointer-events-none">
                        <button
                            onClick={handlePrev}
                            disabled={activeIndex === 0}
                            className={`p-4 rounded-full bg-surface-container border-4 border-surface-variant text-on-surface neo-3d-shadow active-3d transition-all pointer-events-auto ${activeIndex === 0 ? "opacity-0 scale-50" : "opacity-100"}`}
                        >
                            <span className="material-symbols-outlined text-4xl">
                                arrow_back_ios_new
                            </span>
                        </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center z-20 pr-4 pointer-events-none">
                        <button
                            onClick={handleNext}
                            disabled={activeIndex === missions.length - 1}
                            className={`p-4 rounded-full bg-surface-container border-4 border-surface-variant text-on-surface neo-3d-shadow active-3d transition-all pointer-events-auto ${activeIndex === missions.length - 1 ? "opacity-0 scale-50" : "opacity-100"}`}
                        >
                            <span className="material-symbols-outlined text-4xl">
                                arrow_forward_ios
                            </span>
                        </button>
                    </div>
                    {/* Sliding Track */}
                    <div
                        className="relative h-[550px] transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)"
                        style={{
                            transform:
                                missions.length > 0
                                    ? `translateX(calc(50% - (${parseInt(missions[activeIndex]?.left || "0")}px + 64px)))`
                                    : "none",
                        }}
                    >
                        <div
                            className="relative h-full"
                            style={{
                                width:
                                    missions.length > 6
                                        ? `${missions.length * 270}px`
                                        : "1600px",
                            }}
                        >
                            {/* SVG Path */}
                            <svg
                                className="absolute inset-0 h-full"
                                style={{ width: "100%" }}
                            >
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#A78BFA"
                                    strokeWidth="8"
                                    strokeDasharray="20 10"
                                    className="opacity-40"
                                />
                            </svg>

                            {/* Mission Nodes */}
                            {missions.map((mission, idx) => {
                                const isFocused = idx === activeIndex;
                                return (
                                    <Link
                                        key={mission.id}
                                        href={
                                            mission.status !== "locked"
                                                ? `/student/gameplayReadMode/${mission.id}`
                                                : "#"
                                        }
                                        onClick={(e) => {
                                            if (!isFocused) {
                                                e.preventDefault();
                                                setActiveIndex(idx);
                                            }
                                        }}
                                        className={`group absolute w-32 h-32 flex flex-col items-center justify-center rounded-full transition-all duration-500 text-center p-2
                                                ${mission.status === "completed" ? `bg-lime-400 border-4 border-lime-700 shadow-[4px_4px_0px_0px_#1a2e05]` : ""}
                                                ${mission.status === "current" ? `bg-secondary-container border-4 border-slate-950 shadow-[4px_4px_0px_0px_#55003d]` : ""}
                                                ${mission.status === "locked" ? `bg-slate-950 border-4 border-dashed border-surface-variant cursor-not-allowed` : ""}
                                                ${isFocused ? "scale-125 z-10 opacity-100" : "scale-90 opacity-40 blur-[1px] hover:opacity-70 hover:blur-0"}
                                                active:translate-y-1 active:shadow-none`}
                                        style={{
                                            top: mission.top,
                                            left: mission.left,
                                        }}
                                    >
                                        {mission.status === "current" && (
                                            <div className="absolute -top-4 -right-2 z-10 bg-lime-400 text-slate-950 font-black px-3 py-1 rounded-lg border-2 border-slate-950 rotate-12 shadow-[3px_3px_0px_0px_#1a2e05] text-xs">
                                                CURRENT!
                                            </div>
                                        )}
                                        <span
                                            className={`material-symbols-outlined text-4xl ${mission.textColor}`}
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            {mission.icon}
                                        </span>
                                        <span
                                            className={`text-[10px] font-black uppercase mt-1 ${mission.textColor}`}
                                        >
                                            MISSION{" "}
                                            {mission.level < 10
                                                ? `0${mission.level}`
                                                : mission.level}
                                        </span>

                                        {/* Score Indicator sa loob ng bilog */}
                                        {mission.status !== "locked" && (
                                            <span
                                                className={`text-[10px] font-bold ${mission.textColor} mt-0.5 bg-black/10 px-2 rounded-full`}
                                            >
                                                {mission.score} /{" "}
                                                {mission.points}
                                            </span>
                                        )}
                                        {isFocused && (
                                            <div className="absolute -bottom-12 w-48 text-center animate-bounce-slow">
                                                <p className="text-on-surface font-black uppercase text-sm">
                                                    {mission.title}
                                                </p>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
