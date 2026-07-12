import { router, usePage } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";

const AVATARS = [
    { id: "juan", name: "Juan", url: "/images/avatars/juan/head.png", alt: "Champion Juan robot avatar" },
    { id: "kyle", name: "Kyle", url: "/images/avatars/kyle/head.png", alt: "Stellar Kyle robot avatar" },
    { id: "ana", name: "Ana", url: "/images/avatars/ana/head.png", alt: "Genius Ana robot avatar" },
    { id: "leo", name: "Leo", url: "/images/avatars/leo/head.png", alt: "Stellar Scout Leo robot avatar" },
    { id: "zoe", name: "Zoe", url: "/images/avatars/zoe/head.png", alt: "Nova Navigator Zoe robot avatar" },
    { id: "sam", name: "Sam", url: "/images/avatars/sam/head.png", alt: "Comet Cadet Sam robot avatar" },
];

export default function AvatarSelection() {
    const { flash } = usePage().props;
    const [isUpdating, setIsUpdating] = useState(false);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);
    const [showBadge, setShowBadge] = useState(!!flash?.new_badge);
    const badgeData = flash?.new_badge;

    const handleConfirm = () => {
        if (!selected || isUpdating) return;
        setError(null);
        setIsUpdating(true);
        router.post(
            route("student.updateAvatar"),
            { avatar_url: selected.url },
            {
                onError: (errors) => {
                    setIsUpdating(false);
                    setError(errors?.avatar_url?.[0] || "Something went wrong. Pick again!");
                },
                onSuccess: () => {
                    setIsUpdating(false);
                },
            },
        );
    };

    return (
        <>
            <BadgeUnlockModal
                badge={badgeData}
                show={showBadge}
                onContinue={() => {
                    setShowBadge(false);
                    router.visit("/student/tutorial");
                }}
                buttonText="START ADVENTURE!"
            />
            <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center p-6">
                {isUpdating && (
                    <div className="absolute inset-0 z-50 bg-background/90 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-accent animate-spin motion-reduce:animate-none">
                                sync
                            </span>
                            <p className="text-on-surface-variant font-bold uppercase tracking-widest">
                                Nice pick{selected ? `, ${selected.name}` : ""}!
                            </p>
                        </div>
                    </div>
                )}
                {error && (
                    <div
                        role="alert"
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-error text-on-error px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-xl">error</span>
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            aria-label="Dismiss"
                            className="ml-2 text-on-error/70 hover:text-on-error transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                )}
                <div className="max-w-2xl w-full text-center">
                    <h2 className="text-on-surface text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-12">
                        SELECT YOUR <span className="text-accent">HERO</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
                        {AVATARS.map((avatar) => {
                            const isSelected = selected?.id === avatar.id;
                            return (
                                <button
                                    key={avatar.id}
                                    onClick={() => {
                                        setError(null);
                                        setSelected(avatar);
                                    }}
                                    aria-pressed={isSelected}
                                    className={`aspect-square rounded-xl bg-surface-container-high border-4 overflow-hidden p-2 transition-all tactile-card
                                        ${
                                            isSelected
                                                ? "border-accent translate-y-1"
                                                : "border-outline hover:border-accent hover:bg-surface-bright"
                                        }
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                                    style={isSelected ? { boxShadow: "4px 4px 0 0 #4c1d95" } : undefined}
                                >
                                    <img
                                        src={avatar.url}
                                        alt={avatar.alt}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </button>
                            );
                        })}
                    </div>
                    {selected ? (
                        <button
                            onClick={handleConfirm}
                            disabled={isUpdating}
                            className="mt-12 bg-accent text-surface-container-lowest font-black px-10 py-4 rounded-xl border-4 border-surface-container-lowest text-xl uppercase tracking-widest tactile-button disabled:opacity-60 transition-all"
                        >
                            THIS ONE!
                        </button>
                    ) : (
                        <p className="mt-12 text-on-surface-variant font-bold uppercase tracking-widest">
                            Tap to choose your hero
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
