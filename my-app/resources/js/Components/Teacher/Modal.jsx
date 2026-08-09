export default function Modal({
    isOpen,
    onClose,
    children,
    title,
    icon,
    iconClass = "text-purple-400",
    variant = "slide",
    maxWidth = "max-w-lg",
}) {
    if (!isOpen) return null;

    if (variant === "float") {
        return (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
                <div
                    className={`bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border-4 border-slate-800 shadow-[8px_8px_0_0_#020617] md:shadow-[12px_12px_0_0_#020617] w-full ${maxWidth} max-h-[90vh] flex flex-col`}
                >
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-background/80"
                onClick={onClose}
            ></div>

            <div
                className={`relative w-full ${maxWidth} bg-slate-900 border-4 border-slate-800 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto`}
            >
                <header className="bg-slate-800/50 p-4 sm:p-6 border-b-4 border-slate-800 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        {icon && (
                            <span
                                className={`material-symbols-outlined ${iconClass}`}
                            >
                                {icon}
                            </span>
                        )}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {children}
            </div>
        </div>
    );
}