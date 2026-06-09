import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";

export default function AddStudentModal({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        fullName: "",
        pin: "",
        studentID: "",
        section: "",
    });

    // Function to generate a random 4-digit PIN
    const generatePin = () => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        setData("pin", newPin);
    };

    // Generate a PIN whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setData({
                fullName: "",
                studentID: "",
                section: "",
                pin: Math.floor(1000 + Math.random() * 9000).toString(),
            });
        } else {
            reset();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/teacher/addStudent", {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden animate-in fade-in zoom-in duration-200">
                <header className="bg-slate-800/50 p-6 border-b-4 border-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">
                            person_add
                        </span>
                        Add New Student
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Full Name Input */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            STUDENT ID
                        </label>
                        <input
                            required
                            type="text"
                            value={data.studentID}
                            onChange={(e) =>
                                setData("studentID", e.target.value)
                            }
                            className="w-full bg-slate-950 border-4 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                            placeholder="e.g. 2023-000001"
                        />
                        {errors.studentID && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.studentID}
                            </p>
                        )}
                    </div>{" "}
                    {/* Full Name Input */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            SECTION
                        </label>
                        <input
                            required
                            type="text"
                            value={data.section}
                            onChange={(e) => setData("section", e.target.value)}
                            className="w-full bg-slate-950 border-4 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                            placeholder="e.g. 6-STEM-B"
                        />
                        {errors.section && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.section}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            Full Name
                        </label>
                        <input
                            required
                            type="text"
                            value={data.fullName}
                            onChange={(e) =>
                                setData("fullName", e.target.value)
                            }
                            className="w-full bg-slate-950 border-4 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                            placeholder="e.g. LEO JUPITER"
                        />
                        {errors.fullName && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.fullName}
                            </p>
                        )}
                    </div>
                    {/* PIN Input with Auto-Gen */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            Access PIN (Auto-Generated)
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                type="text"
                                value={data.pin}
                                className="flex-1 bg-slate-950 border-4 border-slate-800 rounded-2xl p-4 text-lime-400 font-black text-2xl tracking-[0.5em] text-center outline-none"
                            />
                            <button
                                type="button"
                                onClick={generatePin}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-2xl border-4 border-slate-950 transition-all flex items-center justify-center shadow-[4px_4px_0_0_#020617] active:translate-y-0.5 active:shadow-none"
                                title="Regenerate PIN"
                            >
                                <span className="material-symbols-outlined">
                                    refresh
                                </span>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight ml-2">
                            The student will use this PIN to log into their
                            mission console.
                        </p>
                        {errors.pin && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.pin}
                            </p>
                        )}
                    </div>
                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 bg-lime-400 text-slate-950 font-black uppercase italic py-4 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {processing
                                ? "Initializing..."
                                : "Initialize Deployment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
