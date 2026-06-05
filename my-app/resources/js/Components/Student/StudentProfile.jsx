import { usePage } from "@inertiajs/react";

export default function StudentProfile() {
    const { auth } = usePage().props;
    return (
        <>
            <header class="bg-slate-950 text-lime-400 font-['Lexend'] font-bold tracking-tight border-b-4 border-purple-900 shadow-[4px_4px_0px_0px_rgba(112,0,255,1)] flex justify-between items-center px-6 h-20 w-full z-50 sticky top-0">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full border-2 border-lime-400 overflow-hidden shadow-[2px_2px_0px_0px_rgba(163,230,53,1)]">
                        <img
                            alt="A vibrant digital portrait of a young student avatar with a friendly expression, styled in a neo-brutalist aesthetic. The background features a cosmic galactic theme with deep purples and electric lime accents. Soft studio lighting highlights the character's features against a sharp-edged, high-contrast digital environment. The overall mood is energetic, futuristic, and encouraging for a learning app."
                            class="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYo_e8fj85gruWkP_O8JBEEakj4EYcfboECPU5VzJr-zOVhThgJsDLGDSoFtuNXrfFAiHnoILZAENO1-ebCnlV5fSu48-LSNcruUbzLzRces7674qDYk-jJk-DJRVXmMYnCcIiWlbOKh7uVLERK71e8fEhGbjP-1IM6RUichHh-FW6OIBJPh_n6KWQRg6Z29G_lg8BLQ6vD4Z0nLkJu-A_0FPfHEx1q21dKYbtqvryqnMqbMmWoCZNcwXpidWAxg27nAX-5OaMeYRl"
                        />
                    </div>
                    <div>
                        <h1 class="text-headline-md font-headline-md">
                            {auth?.user?.name || "Student"}
                        </h1>
                        <div class="flex gap-3 text-label-bold font-label-bold uppercase tracking-widest items-center">
                            <span class="flex items-center gap-1 text-secondary-container">
                                <span
                                    class="material-symbols-outlined text-sm"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    stars
                                </span>
                                <span>
                                    {auth?.user?.student?.points ?? 0} TOTAL POINTS
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:flex items-center gap-6">
                    <div class="flex gap-4">
                        <span class="material-symbols-outlined text-2xl hover:bg-purple-900/30 p-2 rounded-lg cursor-pointer transition-all">
                            stars
                        </span>
                        <span class="material-symbols-outlined text-2xl hover:bg-purple-900/30 p-2 rounded-lg cursor-pointer transition-all">
                            workspace_premium
                        </span>
                    </div>
                </div>
            </header>
        </>
    );
}
