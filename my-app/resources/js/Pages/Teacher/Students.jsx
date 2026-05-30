import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

export default function Students() {
    return (
        <>
            <DashboardLayout>
                    {/* Header Section */}
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                                Student
                            </h1>
                            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                                Monitoring 24 word-warriors in Sector 7-G
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center bg-slate-900 rounded-2xl border-4 border-slate-800 p-2 shadow-[4px_4px_0_0_#020617]">
                                <button className="px-4 py-2 bg-lime-400 rounded-lg text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212]">
                                    All
                                </button>
                                <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                    At Risk
                                </button>
                                <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                    Needs Support
                                </button>
                                <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                    On Track
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Controls Bar */}
                    <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-6 mb-10 flex flex-wrap gap-4 items-center shadow-[8px_8px_0_0_#020617]">
                        <div className="flex-1 min-w-[300px] relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lime-400">
                                search
                            </span>
                            <input
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all"
                                placeholder="Locate student by name or ID..."
                                type="text"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <select className="appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-4 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer">
                                    <option>Sort by: Risk Level</option>
                                    <option>Name (A-Z)</option>
                                    <option>Recent Activity</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                    expand_more
                                </span>
                            </div>
                            <button className="bg-lime-400 text-slate-950 px-6 py-4 rounded-2xl border-4 border-slate-950 shadow-[8px_8px_0_0_#3f6212] font-black uppercase italic text-sm tracking-tighter hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
                                <span
                                    className="material-symbols-outlined text-slate-950"
                                    data-icon="filter_list"
                                >
                                    filter_list
                                </span>
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                    {/* Full Student Table */}
                    <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 overflow-hidden shadow-[8px_8px_0_0_#020617]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 border-b-4 border-slate-800">
                                    <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                        Name &amp; Fleet ID
                                    </th>
                                    <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                        Word Risk
                                    </th>
                                    <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                        Paragraph Risk
                                    </th>
                                    <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-800/50">
                                {/* Row 1 */}
                                <tr className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A portrait of a young student wearing high-tech futuristic glasses that reflect a nebula. The art style is vibrant digital painting with bold outlines and a cosmic color palette of electric blues and deep purples."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgZOj0Csd-wTVehC2hKqya5LsWjibMtl2k7u0rwLw07NOodqBRyJcyz6B0y62wGMLC79R0wuZ-SV8Kr8YSHaqJwAVOBZDyviTPvbCDrAHaipLpSQOokfSwI9XsnNao1SCIhxKx3Mi5ETvcIpX9Ntt2OHt60MHNrAUovC6X0ncME1-6gTNBMsN5aKev3-NmGumU2wxIwgHHHUa723xho1Hohi3sOwLMcl2mY38bLFL8aQtMTcrcVRJ6MKFkfdO7JnGX-IZqR9qpKr6F"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-headline-md text-base text-white">
                                                    Leo Jupiter
                                                </div>
                                                <div className="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-4421
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></div>
                                            <span className="font-label-bold text-error">
                                                High Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_#ffb77f]"></div>
                                            <span className="font-label-bold text-tertiary">
                                                Moderate
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full border-2 border-error text-xs font-black uppercase">
                                            At Risk
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-body-md">
                                        <button className="bg-lime-400 text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden -rotate-2 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A futuristic digital illustration of a student with glowing neon green highlights in their hair, set against a backdrop of stylized planets and circuit patterns. High contrast neo-brutalist style with sharp shadows and vibrant colors."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRquYrSMeA4qIA7cT_YVxCjd6YWDekToYTXpuadsvXrDtdtV6D45l_KcejMQdDu6NkoJOU_rdbG0dk5C15UK1agjH7x6bn3DMpprjapG6HmlMXTN5o6PjSIQykeewXUiW4vWD9WzgxDldTRvC9qI8p4fYe6ymt--T5R3urPow8e6-EK02Vcdu9SGyPR-AKGZD6jylQbHAZjaqTUg4WAHvOwSwd3xSIiBBguYVid6rdasVLLYZP7sr-P7bKHxzghy4w0isL7fBLgGME"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-headline-md text-base text-white">
                                                    Nova Starlight
                                                </div>
                                                <div className="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-9902
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span className="font-label-bold text-green-400">
                                                Low Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span className="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full border-2 border-green-500 text-xs font-black uppercase">
                                            Excellent
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-body-md">
                                        <button className="bg-lime-400 text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 3 */}
                                <tr className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden rotate-1 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A character portrait of a student wearing a sleek chrome headset, surrounded by floating 3D alphabet letters and pixelated star particles. The mood is energetic and academic-adventurous, with a color palette of magenta, cyan, and deep space black."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjkR2PHDeC08DMJrOCq1CEjaIGB6NFCoHSQrr_PPMgvGB4m9W4y0weLvwIJje8S58Gqw0EPP0OCUhlcA2-Jlfy1DjHLvIQhJ2eFV2pEKGXpmj0dyXJD5f-IAVVRZ5Ms2_jTtnQa_KMkNVKdJP9MKOtbwV-DNZFU1DnDMFK5Bd27Nkk_s5X3G5lVryg08applrzGUXv6DnG139lpOqbSXg3CWP6idhXcMGwq_hfzSIhyr9qSMUxdtUFkLyoahqBug-zwrX7NulN9Jm-"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-headline-md text-base text-white">
                                                    Orion Mars
                                                </div>
                                                <div className="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-1284
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_#ffb77f]"></div>
                                            <span className="font-label-bold text-tertiary">
                                                Moderate
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span className="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full border-2 border-tertiary text-xs font-black uppercase">
                                            Needs Support
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-body-md">
                                        <button className="bg-lime-400 text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 4 */}
                                <tr className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden -rotate-3 group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]">
                                                <img
                                                    alt="Student Avatar"
                                                    data-alt="A stylized portrait of a student pilot with an aviator jacket and glowing orange patches, with a backdrop of a colorful stylized nebula. Neo-brutalist aesthetic with chunky lines and heavy physical presence. Vibrant orange and deep purple tones."
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwv8zHpE2x5WozQDYOB-vZQ4AbFVs2csxC8m3g2rtsjmXFZMQSRmqfICL8Rnn9vaDq0TShTJ8nmTSe5UQ1-pfusu1fmShBH9NC_qE7oeZNXqw__RreMfZFDEWHmv18kMZaeW2z5lc5fiSntNr8SpOpZf_H9kFoh9smM4Liy1ZsOZ6D-jAwaObjP89tjZOtYUpvjsOdZexQZY_gbuYLz4VGUa_MvflVTttUUshHQ14DHQQYFlYO4_nC6gN5Y16gq8_vK9zbAu6PPiid"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-headline-md text-base text-white">
                                                    Zoe Kuiper
                                                </div>
                                                <div className="text-xs text-slate-500 font-label-bold">
                                                    ID: #GWOM-5510
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span className="font-label-bold text-green-400">
                                                Low Risk
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                            <span className="font-label-bold text-green-400">
                                                On Track
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full border-2 border-on-secondary-fixed text-xs font-black uppercase">
                                            On Track
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-body-md">
                                        <button className="bg-lime-400 text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* Table Pagination/Footer */}
                        <div className="p-6 bg-slate-950 flex justify-between items-center border-t-4 border-slate-800">
                            <div className="text-slate-500 font-label-bold text-xs uppercase tracking-widest">
                                Showing 1-4 of 24 Word Warriors
                            </div>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                    <span className="material-symbols-outlined">
                                        chevron_left
                                    </span>
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-lime-400 bg-lime-400 text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212]">
                                    1
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black">
                                    2
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black">
                                    3
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                    <span className="material-symbols-outlined">
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
