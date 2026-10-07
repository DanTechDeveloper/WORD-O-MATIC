import { useState } from "react";

const SHAPES = [
    { size: 28, color: "#d1bcff", left: "8%", delay: 0, dur: 9, rotate: 45 },
    { size: 44, color: "#7000ff", left: "22%", delay: 1, dur: 11, rotate: 0 },
    { size: 20, color: "#ff3bc0", left: "55%", delay: 0.5, dur: 8, rotate: 45 },
    { size: 36, color: "#d1bcff", left: "70%", delay: 2, dur: 10, rotate: 22 },
    { size: 24, color: "#ffb77f", left: "88%", delay: 1, dur: 12, rotate: 45 },
    { size: 32, color: "#7000ff", left: "40%", delay: 3, dur: 9.5, rotate: 0 },
    { size: 18, color: "#ff3bc0", left: "62%", delay: 2, dur: 10.5, rotate: 45 },
    { size: 40, color: "#d1bcff", left: "12%", delay: 2.5, dur: 8.5, rotate: 30 },
];

// ponytail: falling object restored from git abe590f ArcadeGridBg (`shape-drift`
// floating shapes), minus the dot grids (DESIGN.md §6 #23 ban) and glow ring.
export default function ArcadeBackground() {
    // ponytail: Date.now() must be read once per mount — reading it in render
    // restarts the CSS animation on every parent re-render (gameplay pages
    // re-render every second on the round clock).
    const [phaseSeed] = useState(() => Date.now() / 1000);
    return (
        <>
            {/* ponytail: overflow-hidden — the drifting shapes translate ±110vh
                and would otherwise extend the page's scrollable area. */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
                <style>
                    {`
                        .arcade-scanlines {
                            background: repeating-linear-gradient(
                                0deg,
                                transparent,
                                transparent 3px,
                                rgba(0,0,0,0.04) 3px,
                                rgba(0,0,0,0.04) 4px
                            );
                        }
                        @keyframes arcade-shape-drift {
                            0%   { transform: translateY(0) rotate(var(--sr)); opacity: 0; }
                            10%  { opacity: var(--op); }
                            90%  { opacity: var(--op); }
                            100% { transform: translateY(-110vh) rotate(calc(var(--sr) + 180deg)); opacity: 0; }
                        }
                        @keyframes arcade-shape-drift-down {
                            0%   { transform: translateY(0) rotate(var(--sr)); opacity: 0; }
                            10%  { opacity: var(--op); }
                            90%  { opacity: var(--op); }
                            100% { transform: translateY(110vh) rotate(calc(var(--sr) + 180deg)); opacity: 0; }
                        }
                        @keyframes arcade-eq {
                            0%, 100% { transform: scaleY(0.3); }
                            50%      { transform: scaleY(1); }
                        }
                        @media (prefers-reduced-motion: reduce) {
                            .arcade-scanlines { opacity: 0.6 !important; }
                            .arcade-shape, .arcade-eqbar { animation: none !important; opacity: 0.3 !important; }
                        }
                    `}
                </style>
                <div className="arcade-scanlines absolute inset-0 opacity-40" />
                {/* ponytail: VU-meter bars on both edges — scaleY pulse, edge-only
                    so the center stays clear for content. */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={`l${i}`}
                        className="arcade-eqbar absolute bottom-0 w-2 rounded-t-full"
                        style={{
                            left: `${6 + i * 14}px`,
                            height: `${50 + (i % 4) * 30}px`,
                            backgroundColor: i % 3 === 0 ? "#a3e635" : i % 3 === 1 ? "#7000ff" : "#38bdf8",
                            opacity: 0.4,
                            transformOrigin: "bottom",
                            animation: `arcade-eq ${1.6 + (i % 4) * 0.5}s ease-in-out -${phaseSeed % 2}s infinite`,
                        }}
                    />
                ))}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={`r${i}`}
                        className="arcade-eqbar absolute bottom-0 w-2 rounded-t-full"
                        style={{
                            right: `${6 + i * 14}px`,
                            height: `${50 + ((i + 2) % 4) * 30}px`,
                            backgroundColor: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#d1bcff" : "#ff3bc0",
                            opacity: 0.4,
                            transformOrigin: "bottom",
                            animation: `arcade-eq ${1.8 + (i % 4) * 0.5}s ease-in-out -${phaseSeed % 2}s infinite`,
                        }}
                    />
                ))}
                {SHAPES.map((s, i) => (
                    <div
                        key={i}
                        className="arcade-shape absolute"
                        style={{
                            width: s.size,
                            height: s.size,
                            left: s.left,
                            top: i % 2 === 0 ? "-60px" : undefined,
                            bottom: i % 2 === 0 ? undefined : "-60px",
                            backgroundColor: s.color,
                            opacity: 0.22,
                            boxShadow: "4px 4px 0 0 #4c1d95",
                            transform: `rotate(${s.rotate}deg)`,
                            "--sr": `${s.rotate}deg`,
                            "--op": 0.22 + (i % 3) * 0.04,
                            // ponytail: negative delay = shapes appear mid-flight on
                            // mount instead of queuing behind a 0..3s stagger.
                            animation: `${i % 2 === 0 ? "arcade-shape-drift-down" : "arcade-shape-drift"} ${s.dur}s linear -${(s.delay + phaseSeed % s.dur) % s.dur}s infinite`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
