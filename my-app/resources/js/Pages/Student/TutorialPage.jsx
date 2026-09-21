import { Head, Link, usePage } from "@inertiajs/react";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";

export default function TutorialPage({
    wordTutorialDone = false,
    speakTutorialDone = false,
    tutorialComplete = false,
    tutorialSkipped = false,
}) {
    const { auth } = usePage().props;
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const bothDone = wordTutorialDone && speakTutorialDone;
    const wbLocked = false;
    const sqLocked = !wordTutorialDone;

    const tutorialCards = [
        {
            key: "word",
            title: "Word Blast",
            sub: "Phase 1",
            desc: "Say the words aloud to blast them!",
            icon: "menu_book",
            color: "accent",
            href: "/student/gameplayReadMode/0",
            done: wordTutorialDone,
            locked: wbLocked,
        },
        {
            key: "speak",
            title: "Story Quest",
            sub: "Phase 2",
            desc: "Read full sentences and watch them light up!",
            icon: "mic",
            color: "quest",
            href: "/student/gameplaySpeakMode/0",
            done: speakTutorialDone,
            locked: sqLocked,
        },
    ];

    const introMessage = tutorialComplete
        ? "Tutorial complete! Replay anytime."
        : bothDone
          ? "Both phases done — check your badge!"
          : !wordTutorialDone
            ? "Start with Word Blast. then Story Quest unlocks!"
            : "Word Blast done! Now try Story Quest to finish the tutorial!";

    return (
        <>
            <Head title="Tutorial — Word-O-Matic">
                <meta
                    name="description"
                    content="Complete the two-phase tutorial on Word-O-Matic."
                />
            </Head>
            <DashboardLayout>
                <div className="flex flex-col py-6 sm:py-8 space-y-6">
                    <header className="text-center lg:text-left">
                        <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-[-0.04em] text-on-surface">
                            Tutorial
                        </h1>
                        <p className="mt-2 text-on-surface-variant text-sm sm:text-base">
                            Two phases, in order. Finish both to earn the
                            Tutorial Complete badge.
                        </p>
                    </header>

                    {tutorialSkipped && !tutorialComplete && (
                        <div className="bg-amber-500/15 border-2 border-amber-400/40 rounded-2xl px-5 py-4 flex items-start gap-3">
                            <span
                                className="material-symbols-outlined text-amber-400 text-2xl shrink-0 mt-0.5"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                warning
                            </span>
                            <div>
                                <p className="text-amber-300 font-black uppercase text-sm">
                                    Tutorial skipped
                                </p>
                                <p className="text-on-surface-variant text-sm mt-1">
                                    You skipped the tutorial, so the{" "}
                                    <span className="font-bold text-on-surface">
                                        Tutorial Complete
                                    </span>{" "}
                                    badge is not claimable yet. Complete both
                                    phases below to earn it.
                                </p>
                            </div>
                        </div>
                    )}

                    {bodyUrl && (
                        <AvatarSpeechBubble
                            emoji={
                                bothDone
                                    ? "celebration"
                                    : wordTutorialDone
                                      ? "auto_stories"
                                      : "bolt"
                            }
                            title={
                                bothDone
                                    ? "All done!"
                                    : wordTutorialDone
                                      ? "Next up!"
                                      : "Welcome!"
                            }
                            message={introMessage}
                            bodyUrl={bodyUrl}
                            color={
                                wordTutorialDone && !speakTutorialDone
                                    ? "quest"
                                    : "accent"
                            }
                            position="bottom-right"
                            footerText={null}
                        />
                    )}

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {tutorialCards.map((c) => {
                            const isLocked = c.locked;
                            const isDone = c.done;
                            return (
                                <div
                                    key={c.key}
                                    className={`relative flex flex-col rounded-2xl bg-surface border-2 p-5 sm:p-6 ${
                                        isLocked
                                            ? "border-outline/20 opacity-50"
                                            : isDone
                                              ? `border-${c.color}/50`
                                              : `border-${c.color}/40 tactile-card`
                                    } ${c.color === "accent" ? "border-accent/40" : "border-quest/40"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-background/40 border-2 ${c.color === "accent" ? "border-accent/40" : "border-quest/40"} flex items-center justify-center`}
                                        >
                                            <span
                                                className={`material-symbols-outlined text-3xl sm:text-4xl ${c.color === "accent" ? "text-accent" : "text-quest"}`}
                                                style={{
                                                    fontVariationSettings:
                                                        "'FILL' 1",
                                                }}
                                            >
                                                {c.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-black uppercase text-on-surface truncate">
                                                    {c.title}
                                                </h2>
                                                {isDone && (
                                                    <span className="inline-flex items-center gap-1 bg-accent text-background text-xs font-black uppercase px-2 py-0.5 rounded-full">
                                                        <span
                                                            className="material-symbols-outlined text-sm"
                                                            style={{
                                                                fontVariationSettings:
                                                                    "'FILL' 1",
                                                            }}
                                                        >
                                                            check
                                                        </span>
                                                        Done
                                                    </span>
                                                )}
                                                {isLocked && (
                                                    <span className="inline-flex items-center gap-1 bg-outline/20 text-on-surface-variant text-xs font-black uppercase px-2 py-0.5 rounded-full">
                                                        <span className="material-symbols-outlined text-sm">
                                                            lock
                                                        </span>
                                                        Locked
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-0.5">
                                                {c.sub}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-on-surface-variant text-sm">
                                        {c.desc}
                                    </p>
                                    <div className="mt-5">
                                        {isLocked ? (
                                            <span className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-sm uppercase tracking-wider bg-surface-container-high text-on-surface-variant border-2 border-outline/20 cursor-not-allowed">
                                                <span className="material-symbols-outlined text-lg">
                                                    lock
                                                </span>
                                                Complete Word Blast first
                                            </span>
                                        ) : isDone ? (
                                            <Link
                                                href={c.href}
                                                data-sfx="major"
                                                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-sm uppercase tracking-wider border-2 ${c.color === "accent" ? "bg-accent text-background border-accent-deep/30" : "bg-quest text-background border-quest-deep/30"} hover:brightness-110 transition-all`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    replay
                                                </span>
                                                Replay
                                            </Link>
                                        ) : (
                                            <Link
                                                href={c.href}
                                                data-sfx="major"
                                                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-sm uppercase tracking-wider shadow-[0_6px_0_0_#4c1d95] active:shadow-[0_2px_0_0_#4c1d95] active:translate-y-1 transition-all ${c.color === "accent" ? "bg-accent text-background" : "bg-quest text-background"}`}
                                            >
                                                <span
                                                    className="material-symbols-outlined text-lg"
                                                    style={{
                                                        fontVariationSettings:
                                                            "'FILL' 1",
                                                    }}
                                                >
                                                    play_arrow
                                                </span>
                                                Start
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </div>
            </DashboardLayout>
        </>
    );
}
