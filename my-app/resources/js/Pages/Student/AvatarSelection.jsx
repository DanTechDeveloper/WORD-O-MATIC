import { usePage, router } from "@inertiajs/react";
import { useState } from "react";

const AVATARS = [
    { id: "juan", url: "/images/avatars/juan/head.png", alt: "Champion Juan robot avatar" },
    { id: "kyle", url: "/images/avatars/kyle/head.png", alt: "Stellar Kyle robot avatar" },
    { id: "ana", url: "/images/avatars/ana/head.png", alt: "Genius Ana robot avatar" },
    { id: "leo", url: "/images/avatars/leo/head.png", alt: "Stellar Scout Leo robot avatar" },
    { id: "zoe", url: "/images/avatars/zoe/head.png", alt: "Nova Navigator Zoe robot avatar" },
    { id: "sam", url: "/images/avatars/sam/head.png", alt: "Comet Cadet Sam robot avatar" },
];

export default function AvatarSelection() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    const handleAvatarClick = (avatar) => {
        if (isUpdating) return;
        setSelectedAvatar(avatar);
    };

    const handleConfirm = () => {
        if (!selectedAvatar || isUpdating) return;
        setIsUpdating(true);
        router.post(
            route("student.updateAvatar"),
            { avatar_url: selectedAvatar.url },
            {
                onFinish: () => setIsUpdating(false),
                onError: (errors) => {
                    console.error("Failed to update avatar:", errors);
                },
            },
        );
    };

    const handleBack = () => {
        setSelectedAvatar(null);
    };

    if (selectedAvatar) {
        return (
            <div className="fixed inset-0 z-[90] bg-zinc-950 flex flex-col items-center justify-center p-6">
                {isUpdating && (
                    <div className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-lime-400 animate-spin">
                            <span className="material-symbols-outlined text-6xl">
                                sync
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-8 max-w-lg w-full">
                    <div className="relative flex flex-col items-center">
                        <div className="mb-4">
                            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl border-2 border-lime-400">
                                <p className="text-zinc-900 font-black text-2xl uppercase tracking-tight text-center">
                                    Great Choice!
                                </p>
                                <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white/95" />
                            </div>
                        </div>

                        <img
                            src={selectedAvatar.url}
                            alt={selectedAvatar.alt}
                            className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full border-4 border-lime-400 shadow-[0_0_40px_rgba(163,230,53,0.3)]"
                        />
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black py-5 px-8 rounded-2xl border-b-[6px] border-green-800 text-2xl active:translate-y-1 active:border-b-4 transition-all uppercase tracking-widest"
                    >
                        CONFIRM & CONTINUE
                    </button>

                    <button
                        onClick={handleBack}
                        className="text-zinc-400 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
                    >
                        Choose Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[90] bg-zinc-950 flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                <h2 className="text-white text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-12">
                    SELECT YOUR <span className="text-purple-500">HERO</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
                    {AVATARS.map((avatar) => (
                        <button
                            key={avatar.id}
                            onClick={() => handleAvatarClick(avatar)}
                            className="aspect-square rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-lime-400 hover:bg-zinc-800 transition-all hover:scale-110 active:scale-95 overflow-hidden p-2"
                        >
                            <img
                                src={avatar.url}
                                alt={avatar.alt}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        </button>
                    ))}
                </div>
                <p className="mt-12 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                    Tap to choose your avatar
                </p>
            </div>
        </div>
    );
}
