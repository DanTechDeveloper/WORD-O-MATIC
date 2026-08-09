export default function SelectField({
    value,
    onChange,
    children,
    selectClassName = "",
    padSelect = "py-3",
    wrapperClassName = "",
    icon = null,
    iconClassName = "text-lime-400",
}) {
    return (
        <div className={`relative ${wrapperClassName}`}>
            <select
                value={value}
                onChange={onChange}
                className={`w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 ${padSelect} text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all text-sm ${selectClassName}`}
            >
                {children}
            </select>
            {icon && (
                <span
                    className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconClassName}`}
                >
                    {icon}
                </span>
            )}
        </div>
    );
}