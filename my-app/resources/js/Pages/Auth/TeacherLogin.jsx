import { Head, useForm } from "@inertiajs/react";

export default function TeacherLogin() {
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>

            <Head title="Teacher Login - Word-O-Matic" />

            <main className="relative w-full max-w-lg z-10">
                <section className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-10 shadow-[20px_20px_0_0_#1e1b4b]">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                            Teacher <span className="text-purple-400">Login</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-2">
                            Staff access portal
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                Username:
                            </label>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) =>
                                    setData("username", e.target.value)
                                }
                                className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-zinc-800"
                                placeholder="Admin/Staff ID..."
                            />
                            {errors.username && (
                                <p className="text-red-500 text-xs font-black uppercase ml-2">
                                    {errors.username}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                Password:
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-zinc-800"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs font-black uppercase ml-2">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-6 mt-4 rounded-2xl border-b-[8px] font-black uppercase italic text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 bg-purple-600 text-white border-purple-950 hover:bg-purple-500 shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)]"
                        >
                            <span>LOGIN</span>
                            <span className="text-3xl">🚀</span>
                        </button>
                    </form>

                    <footer className="mt-8 text-center">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                            Word-O-Matic Terminal v1.0.4
                        </p>
                    </footer>
                </section>
            </main>
        </div>
    );
}
