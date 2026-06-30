import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";

export default function EditStudentModal({ isOpen, onClose, student }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        fullName: student?.fullName ?? "",
        pin: student?.pin ?? "",
        section: student?.section ?? "",
        gender: student?.gender ?? "",
        parent_email: student?.parent_email ?? "",
    });

    const regeneratePin = () => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        setData("pin", newPin);
    };

    useEffect(() => {
        if (isOpen && student) {
            setData({
                fullName: student.fullName,
                pin: student.pin,
                section: student.section,
                gender: student.gender ?? "",
                parent_email: student.parent_email ?? "",
            });
        }
        if (!isOpen) {
            reset();
        }
    }, [isOpen, student]);

    if (!isOpen || !student) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/teacher/students/${student.id}`, {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-lg bg-slate-900 border-4 border-slate-800 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto">
                <header className="bg-slate-800/50 p-4 sm:p-6 border-b-4 border-slate-800 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">
                            edit
                        </span>
                        Edit Student
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
                    {/* Student ID (Read-only) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            STUDENT ID
                        </label>
                        <input
                            type="text"
                            value={student.studentID}
                            readOnly
                            className="w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-slate-500 font-bold outline-none cursor-not-allowed opacity-60"
                        />
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            FULL NAME
                        </label>
                        <input
                            required
                            type="text"
                            value={data.fullName}
                            onChange={(e) => setData("fullName", e.target.value)}
                            className="w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                        />
                        {errors.fullName && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.fullName}
                            </p>
                        )}
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            SECTION
                        </label>
                        <input
                            required
                            type="text"
                            value={data.section}
                            onChange={(e) => setData("section", e.target.value)}
                            className="w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                        />
                        {errors.section && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.section}
                            </p>
                        )}
                    </div>

                    {/* PIN */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            Access PIN
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                type="text"
                                value={data.pin}
                                className="flex-1 bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-lime-400 font-black text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] text-center outline-none"
                            />
                            <button
                                type="button"
                                onClick={regeneratePin}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 transition-all flex items-center justify-center shadow-[4px_4px_0_0_#020617] active:translate-y-0.5 active:shadow-none"
                                title="Regenerate PIN"
                            >
                                <span className="material-symbols-outlined">
                                    refresh
                                </span>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight ml-2">
                            The student uses this PIN to log in.
                        </p>
                        {errors.pin && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.pin}
                            </p>
                        )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            GENDER
                        </label>
                        <div className="flex gap-3">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-3 sm:border-4 cursor-pointer transition-all font-black uppercase text-sm ${data.gender === 'male' ? 'bg-sky-900/50 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={data.gender === 'male'}
                                    onChange={(e) => setData("gender", e.target.value)}
                                    className="sr-only"
                                />
                                <span className="material-symbols-outlined">male</span>
                                Male
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-3 sm:border-4 cursor-pointer transition-all font-black uppercase text-sm ${data.gender === 'female' ? 'bg-pink-900/50 border-pink-500 text-pink-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={data.gender === 'female'}
                                    onChange={(e) => setData("gender", e.target.value)}
                                    className="sr-only"
                                />
                                <span className="material-symbols-outlined">female</span>
                                Female
                            </label>
                        </div>
                        {errors.gender && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.gender}
                            </p>
                        )}
                    </div>

                    {/* Parent Email */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                            PARENT EMAIL
                        </label>
                        <input
                            type="email"
                            value={data.parent_email}
                            onChange={(e) => setData("parent_email", e.target.value)}
                            className="w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                            placeholder="e.g. parent@email.com"
                        />
                        {errors.parent_email && (
                            <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                                {errors.parent_email}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 bg-lime-400 text-slate-950 font-black uppercase italic py-3 sm:py-4 text-sm sm:text-base rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}