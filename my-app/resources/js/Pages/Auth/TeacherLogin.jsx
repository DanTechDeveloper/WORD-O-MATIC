import { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function TeacherLogin() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/teacher/login", {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-on-background p-4 relative">
            <Head title="Teacher Login - Word-O-Matic" />

            <main className="relative w-full max-w-lg z-10">
                <section className="bg-surface-container-high border-4 border-outline rounded-2xl p-8 md:p-10 tactile-card">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
                            Teacher <span className="text-accent">Login</span>
                        </h1>
                        <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest mt-2">
                            Staff access portal
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="username"
                                className="text-sm font-black uppercase tracking-widest text-on-surface-variant ml-2"
                            >
                                Username:
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoFocus
                                autoComplete="username"
                                aria-invalid={
                                    errors.username ? "true" : undefined
                                }
                                aria-describedby={
                                    errors.username
                                        ? "username-error"
                                        : undefined
                                }
                                className="w-full p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl tactile-input text-on-surface font-bold focus:border-accent outline-none transition-colors placeholder:text-on-surface-variant/70"
                                placeholder="Admin/Staff ID..."
                                value={data.username}
                                onChange={(e) =>
                                    setData("username", e.target.value)
                                }
                            />
                            {errors.username && (
                                <p
                                    id="username-error"
                                    aria-live="polite"
                                    className="text-error text-xs font-black uppercase ml-2"
                                >
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-black uppercase tracking-widest text-on-surface-variant"
                                >
                                    Password:
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className={`text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-accent transition-colors rounded px-2 py-1 ${focusRing}`}
                                aria-pressed={showPassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                aria-invalid={
                                    errors.password ? "true" : undefined
                                }
                                aria-describedby={
                                    errors.password
                                        ? "password-error"
                                        : undefined
                                }
                                className="w-full p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl tactile-input text-on-surface font-bold focus:border-accent outline-none transition-colors placeholder:text-on-surface-variant/70"
                                placeholder="••••••••"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                            {errors.password && (
                                <p
                                    id="password-error"
                                    aria-live="polite"
                                    className="text-error text-xs font-black uppercase ml-2"
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-6 mt-4 rounded-2xl border-b-[6px] md:border-b-[8px] border-accent-deep font-black uppercase italic text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 bg-accent text-surface-container-lowest hover:bg-accent-hover disabled:opacity-70 ${focusRing}`}
                        >
                            <span>{processing ? "Logging in…" : "LOGIN"}</span>
                            <span className="material-symbols-outlined text-3xl">
                                login
                            </span>
                        </button>
                    </form>

                    <footer className="mt-8 text-center space-y-3">
                        <p className="text-on-surface-variant text-sm font-bold">
                            Trouble logging in? Contact your administrator.
                        </p>
                        <Link
                            href="/"
                            className={`text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-accent transition-colors rounded ${focusRing}`}
                        >
                            ← Back to home
                        </Link>
                    </footer>
                </section>
            </main>
        </div>
    );
}
