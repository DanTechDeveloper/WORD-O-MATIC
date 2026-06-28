import { usePage, router } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";

export default function Greetings() {
    const { auth, flash } = usePage().props;
    const name = auth?.user?.name || "STUDENT";
    console.log(usePage());

    const studentAvatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = studentAvatarUrl?.replace("/head.png", "/body.png");
    const newBadge = flash?.new_badge;
    const [showBadgeModal, setShowBadgeModal] = useState(!!newBadge);

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
           
            <div
                className="absolute top-10 left-10 text-6xl floating-emoji"
                style={{ animationDelay: "0s" }}
            >
                🤖
            </div>
            <div
                className="absolute top-20 right-20 text-5xl floating-emoji"
                style={{ animationDelay: "1s" }}
            >
                🌟
            </div>
            <div
                className="absolute bottom-20 left-20 text-7xl floating-emoji"
                style={{ animationDelay: "2s" }}
            >
                🚀
            </div>
            <div
                className="absolute bottom-10 right-10 text-6xl floating-emoji"
                style={{ animationDelay: "0.5s" }}
            >
                🎉
            </div>
            <div className="absolute top-1/4 right-1/4 text-3xl animate-pulse opacity-40 text-lime-400">
                ✨
            </div>
            <div className="absolute bottom-1/3 left-1/4 text-3xl animate-pulse opacity-40 text-purple-500">
                ✨
            </div>
            <BadgeUnlockModal
                badge={newBadge}
                show={showBadgeModal}
                onContinue={() => setShowBadgeModal(false)}
                buttonText="CLAIM REWARD!"
            />

            {!showBadgeModal && (
                <AvatarSpeechBubble
                    emoji="🤝"
                    title="GREAT CHOICE!"
                    message={`I'm your Word Buddy! Together we'll unlock the mystery of the Word-O-Matic, ${name}!`}
                    bodyUrl={bodyUrl}
                    onClick={() => router.visit("/student/tutorial")}
                    footerText="Tap here to start your adventure ✨"
                    position="center"
                />
            )}
        </main>
    );
}
