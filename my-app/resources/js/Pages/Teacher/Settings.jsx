import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Head, usePage, useForm } from "@inertiajs/react";
import { useState } from "react";

export default function Settings() {
    const { auth, teacher, errors: pageErrors } = usePage().props;
    const user = auth?.user;
    const hasEmail = !!teacher?.has_email;
    const fromHint = teacher?.email || "Not set";

    // Card 1: Sender Identity
    const senderForm = useForm({
        name: teacher?.name || user?.name || "",
        email: teacher?.email || user?.email || "",
    });

    const trimmedEmail = senderForm.data.email.trim();
    const trimmedName = senderForm.data.name.trim();
    const emailOk = /^\S+@\S+\.\S+$/.test(trimmedEmail);
    const nameOk = trimmedName.length > 0;
    const curEmail = (teacher?.email || "").trim().toLowerCase();
    const curName = (teacher?.name || "").trim();
    const isDirty = trimmedEmail.toLowerCase() !== curEmail || trimmedName !== curName;
    const senderValid = emailOk && nameOk && isDirty;

    const submitSender = (e) => {
        e.preventDefault();
        if (!senderValid) return;
        senderForm.put(route("teacher.settings.sender"), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Card 2: Password
    const pwdForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const pwdOk = pwdForm.data.password.length >= 8 && pwdForm.data.password === pwdForm.data.password_confirmation && pwdForm.data.current_password.length > 0;
    const submitPassword = (e) => {
        e.preventDefault();
        if (!pwdOk) return;
        pwdForm.put(route("teacher.settings.password"), {
            preserveScroll: true,
            onSuccess: () => pwdForm.reset("current_password", "password", "password_confirmation"),
        });
    };

    const inputClass = (hasErr) =>
        `w-full bg-surface-container-lowest border-2 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-accent transition-colors text-sm ${hasErr ? "border-error" : "border-outline/20"}`;

    return (
        <DashboardLayout>
            <Head title="Settings — Word-O-Matic" />
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Settings
                </h1>
                <p className="text-on-surface-variant font-black uppercase text-[11px] sm:text-xs tracking-widest">
                    Manage sender identity and account security
                </p>
            </div>

            {!hasEmail && (
                <div className="mb-6 bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500" aria-hidden="true">mail</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-amber-400 font-black uppercase text-xs tracking-widest">Sender email not set</p>
                        <p className="text-on-surface-variant text-sm font-semibold mt-1">Set your email below so parent replies come to you. Reports use <span className="text-white font-bold">{fromHint}</span> as reply-to. Sending is blocked at deadline until this is set.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Sender */}
                <div className="bg-surface-container border-2 border-outline/20 rounded-2xl p-4 sm:p-6">
                    <h2 className="text-white font-black uppercase italic text-sm flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-accent text-lg" aria-hidden="true">mail</span>
                        Sender Identity
                    </h2>
                    <p className="text-on-surface-variant text-xs font-semibold mb-4">Parents reply to this address. <span className="text-white/80">From</span> stays <span className="text-accent font-bold">Word-O-Matic</span> for deliverability (Gmail).</p>

                    <form onSubmit={submitSender} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Display Name</label>
                            <input value={senderForm.data.name} onChange={(e) => senderForm.setData("name", e.target.value)} placeholder="e.g. Admin Teacher" className={inputClass(senderForm.errors.name || pageErrors?.name)} />
                            {(senderForm.errors.name || pageErrors?.name) && <p className="text-error text-[10px] font-black uppercase mt-1 ml-1">{senderForm.errors.name || pageErrors?.name}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Sender Email (Reply-To)</label>
                            <input type="email" value={senderForm.data.email} onChange={(e) => senderForm.setData("email", e.target.value)} placeholder="teacher@wordomatic.edu" className={inputClass(senderForm.errors.email || pageErrors?.email)} />
                            {(senderForm.errors.email || pageErrors?.email) && <p className="text-error text-[10px] font-black uppercase mt-1 ml-1">{senderForm.errors.email || pageErrors?.email}</p>}
                            <p className="text-on-surface-variant/60 text-[10px] font-bold mt-1 ml-1">Current: {fromHint}</p>
                        </div>
                        {!isDirty && emailOk && nameOk && <p className="text-on-surface-variant/60 text-[10px] font-bold text-center">Same as current — no changes to save.</p>}
                        <button type="submit" disabled={senderForm.processing || !senderValid} className={`w-full py-3 rounded-xl font-black uppercase italic text-sm border-b-4 transition-colors ${senderValid && !senderForm.processing ? "bg-accent text-background border-accent-deep hover:bg-accent-hover" : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"}`}>
                            {senderForm.processing ? "Saving..." : !isDirty ? "No changes" : "Save Identity"}
                        </button>
                    </form>
                </div>

                {/* Card 2: Security */}
                <div className="bg-surface-container border-2 border-outline/20 rounded-2xl p-4 sm:p-6">
                    <h2 className="text-white font-black uppercase italic text-sm flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-quest text-lg" aria-hidden="true">lock</span>
                        Account Security
                    </h2>
                    <p className="text-on-surface-variant text-xs font-semibold mb-4">Username is fixed. Rotate password with current password.</p>
                    <div className="mb-4 bg-surface-container-lowest border-2 border-outline/20 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                        <span className="text-on-surface-variant text-xs font-black uppercase tracking-widest">Username</span>
                        <span className="text-white font-bold text-sm">{user?.username || "—"}</span>
                    </div>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Current Password</label>
                            <input type="password" value={pwdForm.data.current_password} onChange={(e) => pwdForm.setData("current_password", e.target.value)} className={inputClass(pwdForm.errors.current_password || pageErrors?.current_password)} />
                            {(pwdForm.errors.current_password || pageErrors?.current_password) && <p className="text-error text-[10px] font-black uppercase mt-1 ml-1">{pwdForm.errors.current_password || pageErrors?.current_password}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">New Password (min 8)</label>
                            <input type="password" value={pwdForm.data.password} onChange={(e) => pwdForm.setData("password", e.target.value)} className={inputClass(pwdForm.errors.password || pageErrors?.password)} />
                            {(pwdForm.errors.password || pageErrors?.password) && <p className="text-error text-[10px] font-black uppercase mt-1 ml-1">{pwdForm.errors.password || pageErrors?.password}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Confirm New Password</label>
                            <input type="password" value={pwdForm.data.password_confirmation} onChange={(e) => pwdForm.setData("password_confirmation", e.target.value)} className={inputClass(pwdForm.errors.password_confirmation)} />
                        </div>
                        <button type="submit" disabled={pwdForm.processing || !pwdOk} className={`w-full py-3 rounded-xl font-black uppercase italic text-sm border-2 transition-colors ${pwdOk && !pwdForm.processing ? "bg-quest text-background border-quest-deep hover:bg-quest-hover" : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed border-outline/20"}`}>
                            {pwdForm.processing ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
