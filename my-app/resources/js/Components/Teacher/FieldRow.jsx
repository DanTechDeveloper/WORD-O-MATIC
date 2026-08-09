export default function FieldRow({ label, error, children, helper }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
                {label}
            </label>
            {children}
            {helper && (
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight ml-2">
                    {helper}
                </p>
            )}
            {error && (
                <p className="text-rose-500 text-[10px] font-black mt-1 uppercase ml-2">
                    {error}
                </p>
            )}
        </div>
    );
}