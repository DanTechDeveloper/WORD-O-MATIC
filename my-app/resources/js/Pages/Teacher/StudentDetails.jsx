import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";
import { attentionMeta, attemptsShown } from "@/utils/masteryLabels.js";

// ponytail: Word Blast dedup removed — 10 unique words/level, no merge needed.
// Story Quest uses SentenceChip directly from sentence_stats.
function aggregateZoneRows(wordStats) {
    const rows = [...(wordStats || [])].map((s) => ({
        word: s.word,
        mastery: s.mastery,
        failed_attempts: Number(s.failed_attempts || 0),
    }));
    return {
        mastered: rows.filter((r) => r.mastery === "mastered"),
        training: rows.filter((r) => r.mastery === "training"),
        rows,
    };
}

// Inline Attempts/Attention meta under each word inside the Mastery/Training
// zones; bare chip fallback when word_stats are unavailable.
function WordChip({ word, stat, threshold, className }) {
    const attention = stat ? attentionMeta(stat, threshold) : null;

    return (
        <span
            className={`px-4 py-2 bg-surface-container border-2 border-outline/20 font-black rounded-xl text-sm transition-colors cursor-default ${className}`}
        >
            {word}
            {attention ? (
                <span className="block mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                    Attempts: {attemptsShown(stat)},{" "}
                    <span className={attention.cls}>{attention.label}</span>
                </span>
            ) : (
                <span className="block mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                    Attempts: {attemptsShown(stat)}
                </span>
            )}
        </span>
    );
}

function SentenceChip({ sentence, stat, threshold, className }) {
    // ponytail: nasagupa na → 1st attempt default (mastered 0 failures = 1 shown), training stays raw
    const raw = Number(stat?.failed_attempts ?? 0);
    const attempts = stat ? attemptsShown({ mastery: stat.mastery, failed_attempts: raw }) : raw;
    const attention = stat ? attentionMeta({ mastery: stat.mastery, failed_attempts: raw }, threshold) : null;

    return (
        <span
            className={`px-4 py-3 bg-surface-container border-2 border-outline/20 font-black rounded-xl text-sm leading-relaxed transition-colors cursor-default block ${className}`}
        >
            <span className="block">{sentence}</span>
            <span className="block mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                Attempts: {attempts}
                {attention ? (
                    <>
                        , <span className={attention.cls}>{attention.label}</span>
                    </>
                ) : null}
            </span>
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
                color: "text-accent",
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
            {
                label: "Final Average",
                value: data.student?.finalAverage != null
                    ? `${data.student.finalAverage}%`
                    : "N/A",
                icon: "star",
                color: "text-amber-400",
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

    // Sentence % for Story Quest — mastered_sentences / total_sentences.
    const calcSentenceProgress = (curriculum) => {
        let mastered = 0;
        let total = 0;
        curriculum.forEach((level) => {
            const t = level.total_sentences ?? (level.sentence_stats?.length ?? 0);
            const m = level.mastered_sentences ?? (level.sentence_stats?.filter((s) => s.mastery === 'mastered').length ?? 0);
            total += t;
            mastered += m;
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

    const calcTotalSentences = (curriculum) => {
        return curriculum.reduce((sum, level) => sum + (level.total_sentences ?? (level.sentence_stats?.length ?? 0)), 0);
    };

    const calcMasteredSentences = (curriculum) => {
        return curriculum.reduce((sum, level) => sum + (level.mastered_sentences ?? (level.sentence_stats?.filter((s) => s.mastery === 'mastered').length ?? 0)), 0);
    };

    const readTotal = calcTotalWords(student.readCurriculum);
    const speakTotal = calcTotalSentences(student.speakCurriculum);
    const readMastered = calcMasteredCount(student.readCurriculum);
    const speakMastered = calcMasteredSentences(student.speakCurriculum);

    const modes = [
        {
            name: "Word Blast",
            level: `LV ${data.student?.read_level ?? 1}`,
            sub: readTotal > 0 ? `${readMastered} of ${readTotal} Words Mastered` : "No words yet",
            progress: calcOverallProgress(student.readCurriculum),
            color: "bg-accent",
        },
        {
            name: "Story Quest",
            level: `LV ${data.student?.speak_level ?? 1}`,
            sub: speakTotal > 0 ? `${speakMastered} of ${speakTotal} Sentences Mastered` : "No sentences yet",
            progress: calcSentenceProgress(student.speakCurriculum),
            color: "bg-cyan-400",
        },
    ];

    const statusMeta = {
        onTrack: {
            label: "On Track",
            color: "text-accent",
            bg: "bg-accent/10",
            border: "border-accent",
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
            color: "text-on-surface-variant",
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
    const sqProgress = calcSentenceProgress(student.speakCurriculum);

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
                color: "text-on-surface-variant/50",
            };
    const stats = [...student.stats, badgeCard];

    return (
        <DashboardLayout>
            <Head title={`${data.name} — Word-O-Matic`}>
                <meta name="description" content={`Student details for ${data.name} on Word-O-Matic.`} />
            </Head>
            <div className="mb-10">
                <Link
                    href="/teacher/students"
                    className="text-on-surface-variant hover:text-accent font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-sm">
                        arrow_back
                    </span>
                    Back to Fleet Command
                </Link>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
                    <div className="bg-surface-container rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 flex items-center gap-4 sm:gap-6 w-full lg:w-auto max-w-full overflow-hidden">
                        <div className="w-24 h-24 rounded-2xl bg-surface-container-lowest border-4 border-accent overflow-hidden rotate-3 shadow-[4px_4px_0_0_#3f6212] shrink-0">
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter truncate" title={student.name}>
                                {student.name}
                            </h1>
                            <p className="mt-2 text-on-surface-variant font-black uppercase text-sm tracking-widest">
                                Student ID: {student.id}
                            </p>
                            <p className="text-on-surface-variant font-black uppercase text-sm tracking-widest">
                                Section: {student.section}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:gap-6 flex-1 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {stats.slice(0, 3).map((stat, i) => (
                                <div
                                    key={i}
                                    className="bg-surface-container rounded-3xl border-4 border-outline/20 p-6 "
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-on-surface-variant font-black uppercase text-xs tracking-widest">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto lg:mx-0 w-full">
                            {stats.slice(3).map((stat, i) => (
                                <div
                                    key={i + 3}
                                    className="bg-surface-container rounded-3xl border-4 border-outline/20 p-6 "
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-on-surface-variant font-black uppercase text-xs tracking-widest">
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
            </div>

            {/* Overall Status */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-on-surface-variant uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-surface-container-high"></span> Overall
                    Status
                </h2>
                <div className="bg-surface-container rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 mb-8">
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
                            <p className="mt-1 text-on-surface-variant font-bold text-lg">
                                {recommendations[statusKey] || status.label}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface-container-lowest rounded-3xl border-4 border-outline/20 p-4 sm:p-6">
                            <div className="text-on-surface-variant font-black uppercase text-base tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">
                                    speed
                                </span>
                                Performance Summary
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant font-bold text-lg">
                                        Word Blast Accuracy
                                    </span>
                                    <span className="text-accent font-black uppercase italic tracking-tighter text-2xl">
                                        {wbAcc}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant font-bold text-lg">
                                        Story Quest Accuracy
                                    </span>
                                    <span className="text-cyan-400 font-black uppercase italic tracking-tighter text-2xl">
                                        {sqAcc}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-outline/20">
                                    <span className="text-amber-400 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">star</span>
                                        Final Average
                                    </span>
                                    <span className="text-amber-400 font-black uppercase italic tracking-tighter text-3xl bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-1">
                                        {data.student?.finalAverage != null ? `${data.student.finalAverage}%` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest rounded-3xl border-4 border-outline/20 p-4 sm:p-6">
                            <div className="text-on-surface-variant font-black uppercase text-base tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">
                                    flag
                                </span>
                                Curriculum Progress
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant font-bold text-lg">
                                        Word Blast
                                    </span>
                                    <span className="text-accent font-black uppercase italic tracking-tighter text-2xl">
                                        {wbProgress}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant font-bold text-lg">
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
                            className="bg-surface-container rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="text-accent font-black uppercase text-xs tracking-widest mb-1">
                                            {mode.name}
                                        </div>
                                        <div className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                            {mode.level}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-on-surface-variant font-black uppercase text-xs tracking-widest mb-1">
                                            Progress
                                        </div>
                                        <div className="text-white font-black uppercase italic tracking-tighter">
                                            {mode.sub}
                                        </div>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-4 bg-surface-container-lowest rounded-full border-2 border-outline/20 p-0.5">
                                    <div
                                        className={`h-full ${mode.color} rounded-full shadow-[0_0_10px_rgba(163,230,53,0.3)] transition-all duration-1000`}
                                        style={{ width: `${mode.progress}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 text-right text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">
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
                    <span className="w-8 h-1 bg-accent"></span> Word Blast
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-accent p-3 bg-accent/10 rounded-2xl border-2 border-accent/20">
                                verified
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Mastery Zone
                            </h3>
                        </div>
                        <div className="bg-surface-container-lowest rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-accent">
                            {student.readCurriculum.map((level, i) => {
                                const zone = aggregateZoneRows(level.word_stats);

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {zone.mastered.length > 0 && (
                                            <>
                                                <div className="text-accent font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#4ade80]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {zone.mastered.map((row) => (
                                                        <WordChip key={row.word} word={row.word} stat={row} threshold={attentionThreshold} className="text-white hover:border-accent" />
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
                        <div className="bg-surface-container-lowest rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.readCurriculum.map((level, i) => {
                                const zone = aggregateZoneRows(level.word_stats);

                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        {zone.training.length > 0 && (
                                            <>
                                                <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                                    {level.level}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {zone.training.map((row) => (
                                                        <WordChip key={row.word} word={row.word} stat={row} threshold={attentionThreshold} className="text-on-surface-variant hover:border-orange-400" />
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
                        <div className="bg-surface-container-lowest rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400">
                            {student.speakCurriculum.map((level, i) => {
                                const mastered = (level.sentence_stats || []).filter((s) => s.mastery === 'mastered');
                                if (mastered.length === 0) return <div key={i} className="mb-8 last:mb-0" />;
                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        <div className="text-cyan-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                                            {level.level}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {mastered.map((row) => (
                                                <SentenceChip key={row.sentence} sentence={row.sentence} stat={row} threshold={attentionThreshold} className="text-white hover:border-cyan-400" />
                                            ))}
                                        </div>
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
                        <div className="bg-surface-container-lowest rounded-xl border-4 border-outline/20 p-4 sm:p-6 md:p-8 min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.speakCurriculum.map((level, i) => {
                                const training = (level.sentence_stats || []).filter((s) => s.mastery === 'training' && Number(s.failed_attempts || 0) > 0);
                                if (training.length === 0) return <div key={i} className="mb-8 last:mb-0" />;
                                return (
                                    <div key={i} className="mb-8 last:mb-0">
                                        <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                            {level.level}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {training.map((row) => (
                                                <SentenceChip key={row.sentence} sentence={row.sentence} stat={row} threshold={attentionThreshold} className="text-on-surface-variant hover:border-orange-400" />
                                            ))}
                                        </div>
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
