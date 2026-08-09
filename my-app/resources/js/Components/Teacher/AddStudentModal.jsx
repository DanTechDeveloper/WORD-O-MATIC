import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Teacher/Modal";
import FieldRow from "@/Components/Teacher/FieldRow";
import TextField from "@/Components/Teacher/TextField";

export default function AddStudentModal({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        fullName: "",
        pin: "",
        studentID: "",
        section: "",
        gender: "",
        parent_email: "",
    });

    const generatePin = () => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        setData("pin", newPin);
    };

    useEffect(() => {
        if (isOpen) {
            setData({
                fullName: "",
                studentID: "",
                section: "",
                pin: Math.floor(1000 + Math.random() * 9000).toString(),
                gender: "",
                parent_email: "",
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Student"
            icon="person_add"
        >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
                <FieldRow label="STUDENT ID" error={errors.studentID}>
                    <TextField
                        required
                        type="text"
                        value={data.studentID}
                        onChange={(e) => setData("studentID", e.target.value)}
                        placeholder="e.g. 2023-000001"
                    />
                </FieldRow>

                <FieldRow label="SECTION" error={errors.section}>
                    <TextField
                        required
                        type="text"
                        value={data.section}
                        onChange={(e) => setData("section", e.target.value)}
                        placeholder="e.g. 6-STEM-B"
                    />
                </FieldRow>

                <FieldRow label="Full Name" error={errors.fullName}>
                    <TextField
                        required
                        type="text"
                        value={data.fullName}
                        onChange={(e) => setData("fullName", e.target.value)}
                        placeholder="e.g. LEO JUPITER"
                    />
                </FieldRow>

                <FieldRow
                    label="Access PIN (Auto-Generated)"
                    error={errors.pin}
                    helper="The student will use this PIN to log into their mission console."
                >
                    <div className="flex gap-2">
                        <TextField
                            readOnly
                            type="text"
                            value={data.pin}
                            className="flex-1 text-lime-400 font-black text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] text-center"
                        />
                        <button
                            type="button"
                            onClick={generatePin}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 transition-all flex items-center justify-center shadow-[4px_4px_0_0_#020617] active:translate-y-0.5 active:shadow-none"
                            title="Regenerate PIN"
                        >
                            <span className="material-symbols-outlined">
                                refresh
                            </span>
                        </button>
                    </div>
                </FieldRow>

                <FieldRow label="PARENT EMAIL" error={errors.parent_email}>
                    <TextField
                        type="email"
                        value={data.parent_email}
                        onChange={(e) => setData("parent_email", e.target.value)}
                        placeholder="e.g. parent@email.com"
                    />
                </FieldRow>

                <FieldRow label="GENDER" error={errors.gender}>
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
                </FieldRow>

                <div className="pt-4 flex gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`flex-1 bg-lime-400 text-slate-950 font-black uppercase italic py-3 sm:py-4 text-sm sm:text-base rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {processing ? "Initializing..." : "Initialize Deployment"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}