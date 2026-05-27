import { router } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
export default function Student() {

    const handleSubmit = (e) => {
        e.preventDefault();
        router.visit("/greetings");
    }
    return (
        <div class="min-h-screen flex items-center justify-center bg-zinc-950 text-on-surface p-4 overflow-x-hidden relative">
            {/* <!-- Background decorative glow --> */}
            <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container opacity-10 blur-[120px] rounded-full"></div>
                <div class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>
            {/* <!-- BEGIN: MainContainer --> */}
            <main
                class="relative w-full max-w-2xl z-10"
                data-purpose="login-container"
            >
                {/* <!-- BEGIN: LoginCard --> */}
                <section
                    class="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-12 relative overflow-hidden"
                    data-purpose="login-card"
                >
                    {/* <!-- Card Header --> */}
                    <header class="text-center mb-10">
                        <h1 class="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight mb-4 leading-tight">
                            Welcome to the <br />
                            <span class="text-lime-400">Word-O-Matic!</span>
                        </h1>
                        <p class="text-lg md:text-xl font-bold text-zinc-400 uppercase tracking-widest">
                            The robots are confused... Can you help them talk?
                        </p>
                    </header>
                    {/* <!-- BEGIN: LoginForm --> */}
                    <form
                        class="space-y-8"
                        onSubmit={handleSubmit}
                    >
                        {/* <!-- Age Field Group --> */}
                        <div class="flex flex-col gap-3">
                            <label
                                class="text-xl font-black text-white uppercase tracking-wider ml-2 flex items-center gap-2"
                                for="student-age"
                            >
                                Select Students To Play With 👤
                            </label>
                            <div class="relative">
                                <select
                                    class="w-full p-5 text-xl font-semibold rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-white focus:border-secondary focus:ring-0 transition-all outline-none appearance-none cursor-pointer tactile-input"
                                    id="student-age"
                                    required=""
                                >
                                    <option
                                        class="bg-zinc-900"
                                        disabled=""
                                        selected=""
                                        value=""
                                    >
                                        Pick your age
                                    </option>
                                    <option class="bg-zinc-900" value="9">

                                    </option>
                                    <option class="bg-zinc-900" value="10">
                                        10 years old (Grade 5)
                                    </option>
                                    <option class="bg-zinc-900" value="11">
                                        11 years old (Grade 6)
                                    </option>
                                    <option class="bg-zinc-900" value="12">
                                        12 years old
                                    </option>
                                    <option class="bg-zinc-900" value="13">
                                        13+ years old
                                    </option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-zinc-500">
                                    <span class="material-symbols-outlined">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* <!-- BEGIN: ActionArea --> */}
                        <div class="flex flex-col items-center pt-6">
                            {/* <!-- The bouncy adventure button --> */}
                            <button
                                class="group relative w-full md:w-auto bg-lime-400 hover:bg-lime-300 text-zinc-950 text-2xl md:text-3xl font-black py-5 px-16 rounded-2xl border-b-[6px] border-green-800 tactile-button transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
                                type="submit"
                            >
                                <span>START ADVENTURE</span>
                                <span class="text-3xl group-hover:scale-125 transition-transform">
                                    🚀
                                </span>
                            </button>
                            <p class="mt-8 text-zinc-500 font-bold text-center uppercase text-sm tracking-[0.2em]">
                                Ready to solve the Mystery of the Word-O-Matic?
                            </p>
                        </div>
                        {/* <!-- END: ActionArea --> */}
                    </form>
                    {/* <!-- END: LoginForm --> */}
                    {/* <!-- Background Visual Accents (Inside Card) --> */}
                    <div class="absolute bottom-4 right-4 text-5xl opacity-10 pointer-events-none rotate-12 text-lime-400">
                        ⚙️
                    </div>
                    <div class="absolute top-4 right-8 text-5xl opacity-10 pointer-events-none -rotate-12 text-primary-container">
                        💬
                    </div>
                    <div class="absolute bottom-20 left-4 text-5xl opacity-5 pointer-events-none text-white">
                        ⚡
                    </div>
                </section>
                {/* <!-- END: LoginCard --> */}
                {/* <!-- Footer Visuals --> */}
            </main>
        </div>
    );
}
