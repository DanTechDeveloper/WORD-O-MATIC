import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";

// Mastered words count their final successful attempt; training words
// show unsuccessful attempts so far (counter is frozen once mastered).
function attemptsShown(stat) {
    return stat.mastery === "mastered"
        ? stat.failed_attempts + 1
        : stat.failed_attempts;
}

// Only surface the flag when it fires (>= threshold) — "Normal" is noise on a
// chip. Resolution-cap rule: struggle flags expire once the word is mastered.
function attentionMeta(stat, threshold) {
    if (stat.failed_attempts < threshold) return null;
    return stat.mastery === "mastered"
        ? { label: "Recovered", cls: "text-emerald-400" }
        : { label: "Needs Attention", cls: "text-red-500" };
}

// Inline Attempts/Attention meta under each word inside the Mastery/Training
// zones; bare chip fallback when word_stats are unavailable.
function WordChip({ word, stat, threshold, className }) {
    const attention = stat ? attentionMeta(stat, threshold) : null;

    return (
        <span
            className={`px-4 py-2 bg-slate-900 border-2 border-slate-800 font-black rounded-xl text-sm transition-colors cursor-default ${className}`}
        >
            {word}
            {attention ? (
                <span className="block mt-1 text-xs uppercase tracking-widest text-slate-500">
                    Attempts: {attemptsShown(stat)},{" "}
                    <span className={attention.cls}>{attention.label}</span>
                </span>
            ) : (
                <span className="block mt-1 text-xs uppercase tracking-widest text-slate-500">
                    Attempts: {attemptsShown(stat)}
                </span>
            )}
        </span>
    );
}

export default function StudentDetail({ data }) {
    const attentionThreshold =
        usePage().props.teacher?.attention_threshold ?? 3;

    const student = {
        id: data.student_id,
        section: data.student?.section,
        name: data.name,
        avatar:
            data.student?.avatar ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZOj0Csd-wTVehC2hKqya5LsWjibMtl2k7u0rwLw07NOodqBRyJcyz6B0y62wGMLC79R0wuZ-SV8Kr8YSHaqJwAVOBZDyviTPvbCDrAHaipLpSQOokfSwI9XsnNao1SCIhxKx3Mi5ETvcIpX9Ntt2OHt60MHNrAUovC6X0ncME1-6gTNBMsN5aKev3-NmGumU2wxIwgHHHUa723xho1Hohi3sOwLMcl2mY38bLFL8aQtMTcrcVRJ6MKFkfdO7JnGX-IZqR9qpKr6F",
        stats: [
            {
                label: "Word Smashed",
                value: data.student?.points?.toLocaleString() || "0",
                icon: "reorder",
                color: "text-lime-400",
            },
            {
                label: "Word Blast Acc",
                value: data.student?.wordBlastAcc
                    ? `${data.student.wordBlastAcc}%`
                    : "N/A",
                icon: "auto_stories",
                color: "text-purple-400",
            },
            {
                label: "Story Quest Acc",
                value: data.student?.storyQuestAcc
                    ? `${data.student.storyQuestAcc}%`
                    : "N/A",
                icon: "record_voice_over",
                color: "text-cyan-400",
            },
        ],
        readCurriculum: data.readCurriculum || [],
        speakCurriculum: data.speakCurriculum || [],
    };

    const calcOverallProgress = (curriculum) => {
        let mastered = 0;
        let total = 0;
        curriculum.forEach((level) => {
            mastered += level.mastered.length;
            total += level.words_count || 0;
        });
        if (!total) return 0;
        return Math.round((mastered / total) * 100);
    };

    const calcMasteredCount = (curriculum) => {
        return curriculum.reduce((sum, level) => sum + level.mastered.length, 0);
    };

    const calcTotalWords = (curriculum) => {
        return curriculum.reduce((sum, level) => sum + (level.words_count || 0), 0);
    };

    const readTotal = calcTotalWords(student.readCurriculum);
    const speakTotal = calcTotalWords(student.speakCurriculum);
    const readMastered = calcMasteredCount(student.readCurriculum);
    const speakMastered = calcMasteredCount(student.speakCurriculum);

    const modes = [
        {
            name: "Word Blast",
            level: `LV ${data.student?.read_level ?? 1}`,
            sub: readTotal > 0 ? `${readMastered} of ${readTotal} Words Mastered` : "No words yet",
            progress: calcOverallProgress(student.readCurriculum),
            color: "bg-lime-400",
        },
        {
            name: "Story Quest",
            level: `LV ${data.student?.speak_level ?? 1}`,
            sub: speakTotal > 0 ? `${speakMastered} of ${speakTotal} Items Mastered` : "No items yet",
            progress: calcOverallProgress(student.speakCurriculum),
            color: "bg-cyan-400",
        },
    ];

    const statusMeta = {
        onTrack: {
            label: "On Track",
            color: "text-lime-400",
            bg: "bg-lime-400/10",
            border: "border-lime-400",
            icon: "check_circle",
        },
        support: {
            label: "Needs Support",
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400",
            icon: "warning",
        },
        atRisk: {
            label: "At Risk",
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500",
            icon: "error",
        },
        notStarted: {
            label: "Not Started",
            color: "text-slate-400",
            bg: "bg-slate-400/10",
            border: "border-slate-400",
            icon: "block",
        },
        in_progress: {
            label: "In Progress",
            color: "text-sky-400",
            bg: "bg-sky-400/10",
            border: "border-sky-400",
            icon: "trending_up",
        },
    };

    const recommendations = {
        onTrack:
            "Strong performance! Keep it up and finish the remaining modules.",
        support:
            "Accuracy is borderline. Regular practice on both skills will get this student back on track.",
        atRisk:
            "Performance is at risk. Schedule a focused intervention session soon.",
        notStarted:
            "No progress yet. Encourage the student to start Word Blast and Story Quest.",
        in_progress:
            "Making progress. Completing both skills will finish the curriculum.",
    };

    const statusKey = data.student?.status || "notStarted";
    const status = statusMeta[statusKey] || statusMeta.notStarted;
    const wbAcc = data.student?.wordBlastAcc
        ? `${data.student.wordBlastAcc}%`
        : "N/A";
    const sqAcc = data.student?.storyQuestAcc
        ? `${data.student.storyQuestAcc}%`
        : "N/A";
    const wbProgress = calcOverallProgress(student.readCurriculum);
    const sqProgress = calcOverallProgress(student.speakCurriculum);

    const latestBadge = data.latestBadge;
    const badgeCard =
        latestBadge && latestBadge.name
            ? {
                  label: "Latest Badge",
                  value: latestBadge.name,
                  icon: latestBadge.icon || "emoji_events",
                  color: "text-amber-300",
              }
            : {
                label: "Latest Badge",
                value: "None",
                icon: "emoji_events",
                color: "text-slate-600",
            };
    const stats = [...student.stats, badgeCard];

    return (
        <DashboardLayout>
            <div className="mb-10">
                <Link
                    href="/teacher/students"
                    className="text-slate-500 hover:text-lime-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-sm">
                        arrow_back
                    </span>
                    Back to Fleet Command
                </Link>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-8 flex items-center gap-6 shadow-[8px_8px_0_0_#020617] w-full lg:w-auto">
                        <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-lime-400 overflow-hidden rotate-3 shadow-[4px_4px_0_0_#3f6212]">
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                {student.name}
                            </h1>
                            <p className="mt-2 text-slate-500 font-black uppercase text-sm tracking-widest">
                                Student ID: {student.id}
                            </p>
                            <p className="text-slate-500 font-black uppercase text-sm tracking-widest">
                                Section: {student.section}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 w-full">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="bg-slate-900 rounded-3xl border-4 border-slate-800 p-6 shadow-[8px_8px_0_0_#020617]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                        {stat.label}
                                    </span>
                                    <span
                                        className={`material-symbols-outlined ${stat.color}`}
                                    >
                                        {stat.icon}
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overall Status */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-slate-500 uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-slate-800"></span> Overall
                    Status
                </h2>
                <div className="bg-slate-900 rounded-[2rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] mb-8">
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <span
                            className={`material-symbols-outlined text-3xl p-3 ${status.bg} ${status.color} rounded-2xl border-2 ${status.border}`}
                        >
                            {status.icon}
                        </span>
                        <div>
                            <div
                                className={`text-4xl font-black uppercase italic tracking-tighter ${status.color}`}
                            >
                                {status.label}
                            </div>
                            <p className="mt-1 text-slate-400 font-bold text-lg">
                                {recommendations[statusKey] || status.label}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-950 rounded-3xl border-4 border-slate-800 p-6">
                            <div className="text-slate-500 font-black uppercase text-base tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">
                                    speed
                                </span>
                                Performance Summary
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-lg">
                                        Word Blast Accuracy
                                    </span>
                                    <span className="text-lime-400 font-black uppercase italic tracking-tighter text-2xl">
                                        {wbAcc}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-lg">
                                        Story Quest Accuracy
                                    </span>
                                    <span className="text-cyan-400 font-black uppercase italic tracking-tighter text-2xl">
                                        {sqAcc}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-950 rounded-3xl border-4 border-slate-800 p-6">
                            <div className="text-slate-500 font-black uppercase text-base tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">
                                    flag
                                </span>
                                Curriculum Progress
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-lg">
                                        Word Blast
                                    </span>
                                    <span className="text-lime-400 font-black uppercase italic tracking-tighter text-2xl">
                                        {wbProgress}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-lg">
                                        Story Quest
                                    </span>
                                    <span className="text-cyan-400 font-black uppercase italic tracking-tighter text-2xl">
                                        {sqProgress}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {modes.map((mode, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 rounded-[2rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="text-lime-400 font-black uppercase text-xs tracking-widest mb-1">
                                            {mode.name}
                                        </div>
                                        <div className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                            {mode.level}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">
                                            Progress
                                        </div>
                                        <div className="text-white font-black uppercase italic tracking-tighter">
                                            {mode.sub}
                                        </div>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-4 bg-slate-950 rounded-full border-2 border-slate-800 p-0.5">
                                    <div
                                        className={`h-full ${mode.color} rounded-full shadow-[0_0_10px_rgba(163,230,53,0.3)] transition-all duration-1000`}
                                        style={{ width: `${mode.progress}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {mode.progress}% Complete
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Word Blast: Mastery & Training Zones */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-lime-400"></span> Word Blast
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-lime-400 p-3 bg-lime-400/10 rounded-2xl border-2 border-lime-400/20">
                                verified
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Mastery Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-lime-400">
                            {student.readCurriculum.map((level, i) => {
                                const stats = Object.fromEntries(
                                    (level.word_stats ?? []).map((s) => [s.word, s]),
                                );

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {level.mastered.length > 0 && (
                                            <>
                                                <div className="text-lime-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_#4ade80]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {level.mastered.map((word, j) => (
                                                        <WordChip key={j} word={word} stat={stats[word]} threshold={attentionThreshold} className="text-white hover:border-lime-400" />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-400 p-3 bg-orange-400/10 rounded-2xl border-2 border-orange-400/20">
                                exercise
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Training Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.readCurriculum.map((level, i) => {
                                const stats = Object.fromEntries(
                                    (level.word_stats ?? []).map((s) => [s.word, s]),
                                );

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {level.training.length > 0 && (
                                            <>
                                                <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {level.training.map((word, j) => (
                                                        <WordChip key={j} word={word} stat={stats[word]} threshold={attentionThreshold} className="text-slate-400 hover:border-orange-400" />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>

            {/* Story Quest: Mastery & Training Zones */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-cyan-400"></span> Story Quest
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-cyan-400 p-3 bg-cyan-400/10 rounded-2xl border-2 border-cyan-400/20">
                                verified
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Mastery Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400">
                            {student.speakCurriculum.map((level, i) => {
                                const stats = Object.fromEntries(
                                    (level.word_stats ?? []).map((s) => [s.word, s]),
                                );

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {level.mastered.length > 0 && (
                                            <>
                                                <div className="text-cyan-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {level.mastered.map((word, j) => (
                                                        <WordChip key={j} word={word} stat={stats[word]} threshold={attentionThreshold} className="text-white hover:border-cyan-400" />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-400 p-3 bg-orange-400/10 rounded-2xl border-2 border-orange-400/20">
                                exercise
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Training Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.speakCurriculum.map((level, i) => {
                                const stats = Object.fromEntries(
                                    (level.word_stats ?? []).map((s) => [s.word, s]),
                                );

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {level.training.length > 0 && (
                                            <>
                                                <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {level.training.map((word, j) => (
                                                        <WordChip key={j} word={word} stat={stats[word]} threshold={attentionThreshold} className="text-slate-400 hover:border-orange-400" />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
