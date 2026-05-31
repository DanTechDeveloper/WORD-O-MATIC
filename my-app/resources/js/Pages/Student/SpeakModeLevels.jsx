import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { useState } from "react";

export default function SpeakModeLevels() {
    // Track which mission is currently in focus
    const [activeIndex, setActiveIndex] = useState(2); // Start with Mission 3 focused

    const missions = [
        { id: 1, status: 'completed', title: 'First Words', subTitle: 'Mastered!', icon: 'check_circle', color: 'amber-400', border: 'amber-400', shadow: '#451a03', top: '150px', left: '100px' },
        { id: 2, status: 'completed', title: 'Sound Surge', subTitle: 'Mastered!', icon: 'check_circle', color: 'amber-400', border: 'amber-400', shadow: '#451a03', top: '350px', left: '350px' },
        { id: 3, status: 'current', title: 'Echo Chamber', subTitle: 'Ready to Launch 🚀', icon: 'rocket_launch', color: 'white', border: 'slate-950', shadow: '#55003d', top: '150px', left: '600px' },
        { id: 4, status: 'locked', title: 'Vocal Voltage', subTitle: 'Locked: Level 5', icon: 'lock', color: 'on-surface-variant', border: 'dashed border-surface-variant', shadow: 'none', top: '350px', left: '850px' },
        { id: 5, status: 'locked', title: 'Mic Mastery', subTitle: 'Locked: Level 7', icon: 'lock', color: 'on-surface-variant', border: 'dashed border-surface-variant', shadow: 'none', top: '150px', left: '1100px' },
        { id: 6, status: 'locked', title: 'Speak Supreme', subTitle: 'Locked: Boss Battle', icon: 'lock', color: 'on-surface-variant', border: 'dashed border-surface-variant', shadow: 'none', top: '350px', left: '1350px' },
    ];

    const getPathD = () => {
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
                let controlYOffset = 100;
                if (index % 2 === 0) {
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
                {/* <!-- Main Container --> */}
                <div className="bg-surface-container rounded-3xl p-8 md:p-12 border-4 border-surface-variant neo-3d-shadow relative overflow-hidden">
                    {/* <!-- Mission Map Viewport --> */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950/20 pt-28 pb-10">
                        {/* Glass-Morphism Header */}
                        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-white/10 backdrop-blur-md rounded-t-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center text-4xl flex-1 text-center md:text-left">
                                <h2 className="text-on-surface text-4xl font-black uppercase italic">
                                    Level 4: Voice Vanguard 🎙️
                                </h2>
                                <p className="text-on-surface-variant text-sm font-bold">
                                    You're 65% of the way to becoming a Speak Supreme!
                                </p>
                            </div>

                            <div className="bg-amber-400 text-slate-950 px-4 py-1 rounded-lg font-black text-base border-b-2 border-amber-700">
                                1,250 XP
                            </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="absolute inset-y-0 left-0 flex items-center z-20 pl-4 pointer-events-none">
                            <button
                                onClick={handlePrev}
                                disabled={activeIndex === 0}
                                className={`p-4 rounded-full bg-surface-container border-4 border-surface-variant text-on-surface neo-3d-shadow active-3d transition-all pointer-events-auto ${activeIndex === 0 ? 'opacity-0 scale-50' : 'opacity-100'}`}
                            >
                                <span className="material-symbols-outlined text-4xl">arrow_back_ios_new</span>
                            </button>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center z-20 pr-4 pointer-events-none">
                            <button
                                onClick={handleNext}
                                disabled={activeIndex === missions.length - 1}
                                className={`p-4 rounded-full bg-surface-container border-4 border-surface-variant text-on-surface neo-3d-shadow active-3d transition-all pointer-events-auto ${activeIndex === missions.length - 1 ? 'opacity-0 scale-50' : 'opacity-100'}`}
                            >
                                <span className="material-symbols-outlined text-4xl">arrow_forward_ios</span>
                            </button>
                        </div>

                        {/* Sliding Track */}
                        <div
                            className="relative h-[550px] transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)"
                            style={{
                                transform: `translateX(calc(50% - (${parseInt(missions[activeIndex].left)}px + 64px)))`
                            }}
                        >
                            <div className="relative w-[1600px] h-full">
                                {/* SVG Path */}
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 500">
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke="#FCD34D"
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
                                            href={mission.status !== 'locked' ? `/student/gameplaySpeakMode` : '#'}
                                            onClick={(e) => {
                                                if (!isFocused) {
                                                    e.preventDefault();
                                                    setActiveIndex(idx);
                                                }
                                            }}
                                            className={`group absolute w-32 h-32 flex flex-col items-center justify-center rounded-full transition-all duration-500 text-center p-2
                                                ${mission.status === 'completed' ? `bg-amber-400 border-4 border-amber-700 shadow-[4px_4px_0px_0px_#451a03]` : ''}
                                                ${mission.status === 'current' ? `bg-secondary-container border-4 border-slate-950 shadow-[4px_4px_0px_0px_#55003d]` : ''}
                                                ${mission.status === 'locked' ? `bg-slate-950 border-4 border-dashed border-surface-variant cursor-not-allowed` : ''}
                                                ${isFocused ? 'scale-125 z-10 opacity-100' : 'scale-90 opacity-40 blur-[1px] hover:opacity-70 hover:blur-0'}
                                                active:translate-y-1 active:shadow-none`}
                                            style={{ top: mission.top, left: mission.left }}
                                        >
                                            {mission.status === 'current' && (
                                                <div className="absolute -top-4 -right-2 z-10 bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg border-2 border-slate-950 rotate-12 shadow-[3px_3px_0px_0px_#451a03] text-xs">
                                                    CURRENT!
                                                </div>
                                            )}
                                            <span className={`material-symbols-outlined text-4xl ${mission.status === 'completed' ? 'text-slate-950' : mission.status === 'current' ? 'text-white' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {mission.icon}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase mt-1 ${mission.status === 'completed' ? 'text-slate-950' : mission.status === 'current' ? 'text-white' : 'text-on-surface-variant'}`}>
                                                MISSION {mission.id < 10 ? `0${mission.id}` : mission.id}
                                            </span>
                                            {isFocused && (
                                                <div className="absolute -bottom-12 w-48 text-center animate-bounce-slow">
                                                    <p className="text-on-surface font-black uppercase text-sm">{mission.title}</p>
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* <!-- Footer Action Button --> */}
                    <div className="mt-16 flex justify-center">
                        <button className="bg-amber-400 text-slate-950 text-2xl font-black px-12 py-5 rounded-2xl border-b-[8px] border-amber-700 active:translate-y-1 active:border-b-4 transition-all uppercase flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                mic
                            </span>
                            Continue Adventure
                        </button>
                    </div>
                </div>

                {/* <!-- Back Button Section --> */}
                <div className="mt-12 flex justify-center">
                    <Link href="/student/dashboard" className="bg-surface-container-high border-4 border-surface-variant px-8 py-4 rounded-xl text-on-surface font-bold flex items-center gap-2 hover:bg-surface-variant active-3d transition-all uppercase">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Home
                    </Link>
                </div>
        </DashboardLayout>
    );
}