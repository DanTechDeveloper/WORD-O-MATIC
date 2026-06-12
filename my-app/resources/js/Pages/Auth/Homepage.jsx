import { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";

export default function Homepage() {
    const [role, setRole] = useState("student");

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        pin: "",
        username: "",
        password: "",
        role: "student",
        mode: "login",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/", {
            onFinish: () => reset("pin", "password"),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4 relative overflow-hidden">
            {/* Фоновые декоративные элементы для поддержания эстетики управления */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>

            <Head title="Access Portal - Word-O-Matic" />

            <main className="relative w-full max-w-lg z-10">
                <section className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-10 shadow-[20px_20px_0_0_#1e1b4b]">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                            Login <span className="text-lime-400">System</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-2">
                            Identify your clearance level
                        </p>
                    </header>

                    {/* Переключатель в стиле вкладок (Tabs/Toggle) */}
                    <div className="flex bg-zinc-950 p-2 rounded-2xl border-4 border-zinc-800 mb-10">
                        <button
                            type="button"
                            onClick={() => {
                                setRole("student");
                                setData({
                                    ...data,
                                    role: "student",
                                    mode: "login",
                                });
                            }}
                            className={`flex-1 py-4 px-4 rounded-xl font-black uppercase italic transition-all ${
                                role === "student"
                                    ? "bg-lime-400 text-zinc-950 shadow-[4px_4px_0_0_#3f6212]"
                                    : "text-zinc-500 hover:text-white"
                            }`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRole("teacher");
                                setData({
                                    ...data,
                                    role: "teacher",
                                    mode: "login",
                                });
                            }}
                            className={`flex-1 py-4 px-4 rounded-xl font-black uppercase italic transition-all ${
                                role === "teacher"
                                    ? "bg-purple-600 text-white shadow-[4px_4px_0_0_#4c1d95]"
                                    : "text-zinc-500 hover:text-white"
                            }`}
                        >
                            Teacher
                        </button>
                    </div>

                    {/* Secondary Toggle for Teacher Mode */}
                    {role === "teacher" && (
                        <div className="flex bg-zinc-950 p-1.5 rounded-xl border-2 border-zinc-800 mb-8 animate-in fade-in zoom-in-95 duration-200">
                            <button
                                type="button"
                                onClick={() => setData("mode", "login")}
                                className={`flex-1 py-2 px-4 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${
                                    data.mode === "login"
                                        ? "bg-purple-600 text-white shadow-[2px_2px_0_0_#4c1d95]"
                                        : "text-zinc-500 hover:text-white"
                                }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setData("mode", "register")}
                                className={`flex-1 py-2 px-4 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${
                                    data.mode === "register"
                                        ? "bg-purple-600 text-white shadow-[2px_2px_0_0_#4c1d95]"
                                        : "text-zinc-500 hover:text-white"
                                }`}
                            >
                                Register
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {role === "student" ? (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                        Name:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="Identification Name..."
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs font-black uppercase ml-2">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                        PIN:
                                    </label>
                                    <input
                                        type="password"
                                        value={data.pin}
                                        onChange={(e) =>
                                            setData("pin", e.target.value)
                                        }
                                        className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="XXXX"
                                    />
                                    {errors.pin && (
                                        <p className="text-red-500 text-xs font-black uppercase ml-2">
                                            {errors.pin}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-6 mt-4 rounded-2xl border-b-[8px] font-black uppercase italic text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 ${
                                role === "student"
                                    ? "bg-lime-400 text-zinc-950 border-green-800 hover:bg-lime-300 shadow-[0_10px_20px_-10px_rgba(163,230,53,0.5)]"
                                    : "bg-purple-600 text-white border-purple-950 hover:bg-purple-500 shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)]"
                            }`}
                        >
                            <span>
                                {role === "student"
                                    ? "LOGIN"
                                    : data.mode === "login"
                                      ? "LOGIN"
                                      : "REGISTER"}
                            </span>
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
