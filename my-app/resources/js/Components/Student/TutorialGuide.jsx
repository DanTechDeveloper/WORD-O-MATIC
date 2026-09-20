import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";

// ponytail: single owner of the tutorial step-machine — Word Blast and Story
// Quest render this instead of bespoke dots + bubbles. Steps advance on REAL
// actions (mic tap, correct read), never on blind taps, except `tap-continue`
// tour steps. Exactly one bubble visible at a time: pages hide this guide
// bubble while coach / sentence feedback is up (TutorialGuide never hides
// those itself — precedence is computed by the page, which owns game state).

export function isActionStep(step) {
    return !!step && step.action !== "tap-continue";
}

// ponytail: pure + tested — returns the next index; steps.length means the
// tour is complete and the page should set guideDone (no auto-increment on
// tap for action steps: wrong event returns the same index).
export function nextStepIndex(steps, index, event) {
    const step = steps?.[index];
    if (!step) return index;
    if (step.action === "tap-continue") {
        return event === "tap" ? Math.min(index + 1, steps.length) : index;
    }
    return step.action === event ? Math.min(index + 1, steps.length) : index;
}

const DOT_ACTIVE = { accent: "bg-accent scale-125", quest: "bg-quest scale-125" };
const DOT_DONE = { accent: "bg-accent/50", quest: "bg-quest/50" };

export default function TutorialGuide({ steps = [], stepIndex = 0, color = "accent", bodyUrl = null, hidden = false, hideBubble = false, onTap }) {
    const step = steps[stepIndex];
    if (hidden || !bodyUrl || !step) return null;
    const actionable = isActionStep(step);
    const isLast = stepIndex >= steps.length - 1;
    return (
        <>
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
                {steps.map((_, i) => (
                    <div
                        key={steps[i]?.id ?? i}
                        className={`w-3 h-3 rounded-full transition-all duration-500 ${i === stepIndex ? DOT_ACTIVE[color] || DOT_ACTIVE.accent : i < stepIndex ? DOT_DONE[color] || DOT_DONE.accent : "bg-on-surface/20"}`}
                    />
                ))}
            </div>
            {!hideBubble && (
                <AvatarSpeechBubble
                    emoji={step.emoji}
                    title={step.title}
                    message={step.message}
                    bodyUrl={bodyUrl}
                    color={color}
                    onClick={actionable ? undefined : onTap}
                    position="bottom-right"
                    footerText={actionable ? "Now you try it! 👇" : isLast ? "Tap to finish!" : "Tap here to continue →"}
                    variant="mini"
                />
            )}
        </>
    );
}
