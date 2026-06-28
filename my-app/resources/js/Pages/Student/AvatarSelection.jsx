import { router } from "@inertiajs/react";
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
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleAvatarClick = (avatar) => {
        if (isUpdating || hasSubmitted) return;
        setError(null);
        setHasSubmitted(true);
        setIsUpdating(true);
        router.post(
            route("student.updateAvatar"),
            { avatar_url: avatar.url },
            {
                onError: (errors) => {
                    setIsUpdating(false);
                    setError(errors?.avatar_url?.[0] || 'Something went wrong');
                },
                onSuccess: () => {
                    setIsUpdating(false);
                },
            },
        );
    };
    return (
        <div className="fixed inset-0 z-[90] bg-zinc-950 flex flex-col items-center justify-center p-6">
            {isUpdating && (
                <div className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-lime-400 animate-spin">
                        <span className="material-symbols-outlined text-6xl">sync</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-bold">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 text-white/70 hover:text-white">&times;</button>
                </div>
            )}
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
