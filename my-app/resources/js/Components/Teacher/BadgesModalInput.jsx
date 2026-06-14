import { useState } from "react";

export default function BadgesModalInput({ show, onClose }) {
    if (!show) return null;

    const [badgeData, setBadgeData] = useState({
        title: "",
        description: "",
        requirement: "",
    });
    const colorPresets = [
        { name: "Green", bg: "bg-[#a3e635]", border: "border-[#064e3b]" },
        {
            name: "Purple",
            bg: "bg-primary-container",
            border: "border-slate-950",
        },
        {
            name: "Pink",
            bg: "bg-secondary-container",
            border: "border-slate-950",
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900 border-4 border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Create New{" "}
                            <span className="text-lime-400">Badge</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-3xl">
                                close
                            </span>
                        </button>
                    </div>

                    {/* UI Blueprint Form */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-6">
                            {/* Icon Selection Placeholder */}
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                    Icon
                                </label>
                                <button className="w-full aspect-square bg-slate-950 border-4 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-4xl text-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all">
                                    <span className="material-symbols-outlined text-4xl">
                                        add_reaction
                                    </span>
                                </button>
                            </div>

                            {/* Basic Info */}
                            <div className="col-span-3 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                        Badge Title
                                    </label>
                                    <input
                                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-400 focus:outline-none transition-colors"
                                        placeholder="e.g. Master Linguist"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                        Short Description
                                    </label>
                                    <input
                                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:border-lime-400 focus:outline-none transition-colors"
                                        placeholder="Goal description..."
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                Unlock Requirements
                            </label>
                            <textarea
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-medium focus:border-lime-400 focus:outline-none transition-colors resize-none"
                                placeholder="Describe the specific criteria students must meet..."
                                rows="3"
                            ></textarea>
                        </div>

                        {/* Theme Selection */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                Cosmic Theme
                            </label>
                            <div className="flex gap-4">
                                {colorPresets.map((theme, i) => (
                                    <button
                                        key={i}
                                        className={`w-12 h-12 rounded-full border-4 ${theme.bg} ${theme.border} ring-offset-4 ring-offset-slate-900 hover:ring-2 ring-white transition-all`}
                                        title={theme.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex gap-4">
                            <button
                                className="flex-1 bg-slate-800 text-white font-black py-4 rounded-xl border-2 border-slate-700 hover:bg-slate-700 transition-all uppercase tracking-wider"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button className="flex-[2] bg-lime-400 text-slate-950 font-black py-4 rounded-xl border-4 border-slate-950 shadow-[4px_4px_0px_0px_#3f6212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase tracking-wider">
                                Create Badge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
