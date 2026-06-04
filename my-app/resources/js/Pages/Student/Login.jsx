import { useForm } from "@inertiajs/react";

export default function Login() {
    const { data, setData, post, errors, processing } = useForm({
        name: "",
        pin: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4 overflow-x-hidden relative">
            {/* <!-- Background decorative glow --> */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>
            {/* <!-- BEGIN: MainContainer --> */}
            <main
                className="relative w-full max-w-2xl z-10"
                data-purpose="login-container"
            >
                {/* <!-- BEGIN: LoginCard --> */}
                <section
                    className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-12 relative overflow-hidden"
                    data-purpose="login-card"
                >
                    {/* <!-- Card Header --> */}
                    <header className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight mb-4 leading-tight">
                            Welcome to the <br />
                            <span className="text-lime-400">Word-O-Matic!</span>
                        </h1>
                    </header>
                    {/* <!-- BEGIN: LoginForm --> */}
                    <form onSubmit={submit} className="space-y-8">
                        {/* <!-- Select Student Group --> */}
                        {/* <!-- Full Name or ID Input Group --> */}
                        <div className="flex flex-col gap-3">
                            <label
                                className="block text-xl font-black text-white uppercase tracking-wider ml-2"
                                htmlFor="full-name-id"
                            >
                                Enter Your Name:
                            </label>
                            <input
                                type="text"
                                id="full-name-id"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full p-5 text-2xl font-black rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-lime-400 focus:border-lime-400 focus:ring-0 transition-all outline-none tactile-input placeholder:text-zinc-800"
                                placeholder="FULL NAME"
                                maxLength={50} // Reasonable max length for a name/ID
                                required
                            />
                            {errors.name && (
                                <p className="text-error text-sm font-black uppercase ml-2">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* <!-- PIN Input Group --> */}
                        <div className="flex flex-col gap-3">
                            <label
                                className="block text-xl font-black text-white uppercase tracking-wider ml-2"
                                htmlFor="pin"
                            >
                                Enter Your PIN:
                            </label>
                            <input
                                type="password" // Use type="password" for security
                                id="pin"
                                value={data.pin}
                                onChange={(e) => setData("pin", e.target.value)}
                                className="w-full p-5 text-2xl font-black rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-lime-400 focus:border-lime-400 focus:ring-0 transition-all outline-none tactile-input placeholder:text-zinc-800"
                                placeholder="PIN"
                                maxLength={4} // Assuming a 4-digit PIN
                                required
                            />
                            {errors.pin && (
                                <p className="text-error text-sm font-black uppercase ml-2">
                                    {errors.pin}
                                </p>
                            )}
                        </div>

                        {/* <!-- BEGIN: ActionArea --> */}
                        <div className="flex flex-col items-center pt-6">
                            {/* <!-- The bouncy adventure button --> */}
                            <button
                                className={`group relative w-full md:w-auto bg-lime-400 hover:bg-lime-300 text-zinc-950 text-2xl md:text-3xl font-black py-5 px-16 rounded-2xl border-b-[6px] border-green-800 tactile-button transition-all flex items-center justify-center gap-4 uppercase tracking-tighter active:scale-95 ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                                type="submit"
                                disabled={processing}
                            >
                                <span>LOGIN</span> {/* Changed button text */}
                                <span className="text-3xl group-hover:scale-125 transition-transform">
                                    🚀
                                </span>
                            </button>
                        </div>
                        {/* <!-- END: ActionArea --> */}
                    </form>
                    {/* <!-- END: LoginForm --> */}
                    {/* <!-- Background Visual Accents (Inside Card) --> */}
                </section>
                {/* <!-- END: LoginCard --> */}
                {/* <!-- Footer Visuals --> */}
            </main>
        </div>
    );
}
