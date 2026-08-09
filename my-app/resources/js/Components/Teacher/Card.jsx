const RADIUS = {
    lg: "rounded-[2.5rem]",
    md: "rounded-3xl",
    "2rem": "rounded-[2rem]",
    bar: "rounded-2xl lg:rounded-[2.5rem]",
};

const PADS = {
    "8": "p-8",
    "10": "p-10",
    "6": "p-6",
    "68": "p-6 md:p-8",
    "46": "p-4 lg:p-6",
};

export default function Card({
    children,
    radius = "lg",
    pad = "8",
    tone = "900",
    shadow = true,
    className = "",
}) {
    return (
        <div
            className={[
                tone === "900" ? "bg-slate-900" : "bg-slate-950",
                "border-4 border-slate-800",
                RADIUS[radius],
                PAD[pad],
                shadow ? "shadow-[8px_8px_0_0_#020617]" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}