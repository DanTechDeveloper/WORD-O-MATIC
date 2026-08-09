export default function TextField({ className = "", ...props }) {
    let base =
        "w-full bg-slate-950 border-3 sm:border-4 border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-700";
    return <input {...props} className={`${base} ${className}`} />;
}