import { usePage, router } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";

export default function Greetings() {
    const { auth, flash } = usePage().props;
    const name = auth?.user?.name || "STUDENT";

    const studentAvatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = studentAvatarUrl?.replace("/head.png", "/body.png");
    const newBadge = flash?.new_badge;
    const [showBadgeModal, setShowBadgeModal] = useState(!!newBadge);

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
            <style>
                {`
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes pulse-slow {
                        0%, 100% { opacity: 0.15; }
                        50% { opacity: 0.35; }
                    }
                    .animate-scan {
                        animation: scan 5s linear infinite;
                    }
                    .animate-pulse-slow {
                        animation: pulse-slow 3s ease-in-out infinite;
                    }
                `}
            </style>

            {/* Sci-Fi Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(209,188,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(209,188,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

            {/* Glowing Tech Ring */}
            <div className="absolute w-[420px] h-[420px] md:w-[620px] md:h-[620px] rounded-full border border-primary/10 animate-pulse-slow pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[80%] rounded-full border border-dashed border-primary/5"></div>
            </div>

            {/* Laser Scanning Line */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-[2px] bg-primary/40 absolute animate-scan shadow-[0_0_20px_rgba(112,0,255,0.5)]"></div>
            </div>

            {/* Corner Bracket HUD */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>

            {/* Telemetry */}
            <div className="absolute top-8 left-24 font-mono text-[9px] text-primary/30 hidden md:block pointer-events-none tracking-widest uppercase">
                ONBOARDING // PHASE_01 // GREETING
            </div>
            <div className="absolute top-8 right-24 font-mono text-[9px] text-primary/30 hidden md:block pointer-events-none tracking-widest uppercase text-right">
                UNIT: {name} // STATUS: ACTIVE
            </div>

            <BadgeUnlockModal
                badge={newBadge}
                show={showBadgeModal}
                onContinue={() => {
                    setShowBadgeModal(false);
                    localStorage.setItem('hasNewBadge', '1');
                }}
                buttonText="CLAIM REWARD!"
            />

            {!showBadgeModal && (
                <div className="relative z-10 w-full max-w-md px-6">
                    <div className="mb-6 text-center font-mono text-xs text-primary/50 tracking-[0.4em] uppercase">
                        [ system greeting ]
                    </div>
                    <div className="relative rounded-lg border border-primary/10 bg-background/80 backdrop-blur-md shadow-[0_0_50px_rgba(112,0,255,0.03)] p-2">
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

                        <AvatarSpeechBubble
                            emoji="🤝"
                            title="GREAT CHOICE!"
                            message={`I'm your Word Buddy! Together we'll unlock the mystery of the Word-O-Matic, ${name}!`}
                            bodyUrl={bodyUrl}
                            onClick={() => router.visit("/student/tutorial")}
                            footerText="Tap here to start your adventure ✨"
                            position="center"
                        />
                    </div>
                </div>
            )}

            {/* Bottom Telemetry */}
            <div className="absolute bottom-8 left-24 font-mono text-[9px] text-primary/20 hidden md:block pointer-events-none tracking-widest uppercase">
                AWAITING_INPUT // TAP_TO_PROCEED
            </div>
        </main>
    );
}
