import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

export default function Students() {
    return (
        <>
            <DashboardLayout>
                    {/* <!-- Header Section --> */}
                    <div class="mb-gutter flex justify-between items-end">
                        <div>
                            <h1 class="font-headline-xl text-primary mb-2">
                                Student Fleet
                            </h1>
                            <p class="text-on-surface-variant font-body-lg">
                                Monitoring 24 word-warriors in Sector 7-G
                            </p>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex items-center bg-surface-container rounded-xl border-2 border-purple-900 p-1">
                                <button class="px-4 py-2 bg-purple-600 rounded-lg text-white font-label-bold">
                                    All
                                </button>
                                <button class="px-4 py-2 text-slate-400 font-label-bold hover:text-purple-300">
                                    At Risk
                                </button>
                                <button class="px-4 py-2 text-slate-400 font-label-bold hover:text-purple-300">
                                    Needs Support
                                </button>
                                <button class="px-4 py-2 text-slate-400 font-label-bold hover:text-purple-300">
                                    On Track
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* <!-- Controls Bar --> */}
                    <div class="bg-surface-container rounded-2xl border-4 border-purple-900 p-6 mb-gutter flex flex-wrap gap-4 items-center shadow-[6px_6px_0px_0px_#4c00ad]">
                        <div class="flex-1 min-w-[300px] relative">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                                search
                            </span>
                            <input
                                class="w-full bg-slate-950 border-2 border-purple-900 rounded-xl pl-12 pr-4 py-3 font-body-md focus:outline-none focus:border-secondary-container transition-all"
                                placeholder="Locate student by name or ID..."
                                type="text"
                            />
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <select class="appearance-none bg-slate-950 border-2 border-purple-900 rounded-xl pl-4 pr-10 py-3 font-label-bold text-on-surface focus:outline-none focus:border-secondary-container cursor-pointer">
                                    <option>Sort by: Risk Level</option>
                                    <option>Name (A-Z)</option>
                                    <option>Recent Activity</option>
                                </select>
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                                    expand_more
                                </span>
                            </div>
                            <button class="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl border-2 border-on-secondary-fixed shadow-[4px_4px_0px_0px_#610046] font-label-bold flex items-center gap-2 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#610046] transition-all">
                                <span
                                    class="material-symbols-outlined"
                                    data-icon="filter_list"
                                >
                                    filter_list
                                </span>
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                    {/* <!-- Full Student Table --> */}
                    <div class="bg-surface-container rounded-2xl border-4 border-purple-900 overflow-hidden shadow-[8px_8px_0px_0px_#4c00ad]">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-900 border-b-4 border-purple-900">
                                    <th class="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-purple-400">
                                        Name &amp; Fleet ID
                                    </th>
                                    <th class="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-purple-400">
                                        Word Risk
                                    </th>
                                    <th class="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-purple-400">
                                        Paragraph Risk
                                    </th>
                                    <th class="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-purple-400">
                                        Status
                                    </th>
                                    <th class="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-purple-400">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y-2 divide-purple-900/50">
                                {/* <!-- Row 1 --> */}
                                <tr class="hover:bg-slate-900/50 transition-colors group">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-lg bg-purple-900 border-2 border-purple-500 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#4c00ad]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A portrait of a young student wearing high-tech futuristic glasses that reflect a nebula. The art style is vibrant digital painting with bold outlines and a cosmic color palette of electric blues and deep purples."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgZOj0Csd-wTVehC2hKqya5LsWjibMtl2k7u0rwLw07NOodqBRyJcyz6B0y62wGMLC79R0wuZ-SV8Kr8YSHaqJwAVOBZDyviTPvbCDrAHaipLpSQOokfSwI9XsnNao1SCIhxKx3Mi5ETvcIpX9Ntt2OHt60MHNrAUovC6X0ncME1-6gTNBMsN5aKev3-NmGumU2wxIwgHHHUa723xho1Hohi3sOwLMcl2mY38bLFL8aQtMTcrcVRJ6MKFkfdO7JnGX-IZqR9qpKr6F"
                                                />
                                            </div>
                                            <div>
                                                <div class="font-headline-md text-base text-on-surface">
                                                    Leo Jupiter
                                                </div>
                                                <div class="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-4421
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></div>
                                            <span class="font-label-bold text-error">
                                                High Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_#ffb77f]"></div>
                                            <span class="font-label-bold text-tertiary">
                                                Moderate
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="bg-error-container text-on-error-container px-3 py-1 rounded-full border-2 border-error text-xs font-black uppercase">
                                            At Risk
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-slate-400 font-body-md">
                                        <button class="bg-primary-container text-white px-6 py-2 rounded-lg border-2 border-primary-fixed shadow-[4px_4px_0px_0px_#23005b] font-label-bold uppercase tracking-widest text-xs hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#23005b] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* <!-- Row 2 --> */}
                                <tr class="hover:bg-slate-900/50 transition-colors group">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-lg bg-purple-900 border-2 border-purple-500 overflow-hidden -rotate-2 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#4c00ad]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A futuristic digital illustration of a student with glowing neon green highlights in their hair, set against a backdrop of stylized planets and circuit patterns. High contrast neo-brutalist style with sharp shadows and vibrant colors."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRquYrSMeA4qIA7cT_YVxCjd6YWDekToYTXpuadsvXrDtdtV6D45l_KcejMQdDu6NkoJOU_rdbG0dk5C15UK1agjH7x6bn3DMpprjapG6HmlMXTN5o6PjSIQykeewXUiW4vWD9WzgxDldTRvC9qI8p4fYe6ymt--T5R3urPow8e6-EK02Vcdu9SGyPR-AKGZD6jylQbHAZjaqTUg4WAHvOwSwd3xSIiBBguYVid6rdasVLLYZP7sr-P7bKHxzghy4w0isL7fBLgGME"
                                                />
                                            </div>
                                            <div>
                                                <div class="font-headline-md text-base text-on-surface">
                                                    Nova Starlight
                                                </div>
                                                <div class="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-9902
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span class="font-label-bold text-green-400">
                                                Low Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span class="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="bg-green-900/50 text-green-400 px-3 py-1 rounded-full border-2 border-green-500 text-xs font-black uppercase">
                                            Excellent
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-slate-400 font-body-md">
                                        <button class="bg-primary-container text-white px-6 py-2 rounded-lg border-2 border-primary-fixed shadow-[4px_4px_0px_0px_#23005b] font-label-bold uppercase tracking-widest text-xs hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#23005b] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* <!-- Row 3 --> */}
                                <tr class="hover:bg-slate-900/50 transition-colors group">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-lg bg-purple-900 border-2 border-purple-500 overflow-hidden rotate-1 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#4c00ad]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A character portrait of a student wearing a sleek chrome headset, surrounded by floating 3D alphabet letters and pixelated star particles. The mood is energetic and academic-adventurous, with a color palette of magenta, cyan, and deep space black."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjkR2PHDeC08DMJrOCq1CEjaIGB6NFCoHSQrr_PPMgvGB4m9W4y0weLvwIJje8S58Gqw0EPP0OCUhlcA2-Jlfy1DjHLvIQhJ2eFV2pEKGXpmj0dyXJD5f-IAVVRZ5Ms2_jTtnQa_KMkNVKdJP9MKOtbwV-DNZFU1DnDMFK5Bd27Nkk_s5X3G5lVryg08applrzGUXv6DnG139lpOqbSXg3CWP6idhXcMGwq_hfzSIhyr9qSMUxdtUFkLyoahqBug-zwrX7NulN9Jm-"
                                                />
                                            </div>
                                            <div>
                                                <div class="font-headline-md text-base text-on-surface">
                                                    Orion Mars
                                                </div>
                                                <div class="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-1284
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_#ffb77f]"></div>
                                            <span class="font-label-bold text-tertiary">
                                                Moderate
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span class="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full border-2 border-tertiary text-xs font-black uppercase">
                                            Needs Support
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-slate-400 font-body-md">
                                        <button class="bg-primary-container text-white px-6 py-2 rounded-lg border-2 border-primary-fixed shadow-[4px_4px_0px_0px_#23005b] font-label-bold uppercase tracking-widest text-xs hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#23005b] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* <!-- Row 4 --> */}
                                <tr class="hover:bg-slate-900/50 transition-colors group">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-lg bg-purple-900 border-2 border-purple-500 overflow-hidden -rotate-3 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#4c00ad]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A stylized portrait of a student pilot with an aviator jacket and glowing orange patches, with a backdrop of a colorful stylized nebula. Neo-brutalist aesthetic with chunky lines and heavy physical presence. Vibrant orange and deep purple tones."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwv8zHpE2x5WozQDYOB-vZQ4AbFVs2csxC8m3g2rtsjmXFZMQSRmqfICL8Rnn9vaDq0TShTJ8nmTSe5UQ1-pfusu1fmShBH9NC_qE7oeZNXqw__RreMfZFDEWHmv18kMZaeW2z5lc5fiSntNr8SpOpZf_H9kFoh9smM4Liy1ZsOZ6D-jAwaObjP89tjZOtYUpvjsOdZexQZY_gbuYLz4VGUa_MvflVTttUUshHQ14DHQQYFlYO4_nC6gN5Y16gq8_vK9zbAu6PPiid"
                                                />
                                            </div>
                                            <div>
                                                <div class="font-headline-md text-base text-on-surface">
                                                    Zoe Kuiper
                                                </div>
                                                <div class="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-5510
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span class="font-label-bold text-green-400">
                                                Low Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span class="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full border-2 border-on-secondary-fixed text-xs font-black uppercase">
                                            On Track
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-slate-400 font-body-md">
                                        <button class="bg-primary-container text-white px-6 py-2 rounded-lg border-2 border-primary-fixed shadow-[4px_4px_0px_0px_#23005b] font-label-bold uppercase tracking-widest text-xs hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#23005b] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* <!-- Table Pagination/Footer --> */}
                        <div class="p-6 bg-slate-950 flex justify-between items-center border-t-4 border-purple-900">
                            <div class="text-slate-500 font-label-bold text-xs uppercase tracking-widest">
                                Showing 1-4 of 24 Word Warriors
                            </div>
                            <div class="flex gap-2">
                                <button class="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-purple-900 text-purple-400 hover:bg-purple-900/30 transition-all">
                                    <span class="material-symbols-outlined">
                                        chevron_left
                                    </span>
                                </button>
                                <button class="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-purple-500 bg-purple-600 text-white font-black shadow-[2px_2px_0px_0px_#4c00ad]">
                                    1
                                </button>
                                <button class="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-purple-900 text-slate-400 hover:bg-purple-900/30 transition-all font-black">
                                    2
                                </button>
                                <button class="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-purple-900 text-slate-400 hover:bg-purple-900/30 transition-all font-black">
                                    3
                                </button>
                                <button class="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-purple-900 text-purple-400 hover:bg-purple-900/30 transition-all">
                                    <span class="material-symbols-outlined">
                                        chevron_right
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
            </DashboardLayout>
        </>
    );
}
