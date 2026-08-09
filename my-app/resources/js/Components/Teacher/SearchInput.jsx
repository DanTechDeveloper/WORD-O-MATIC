export default function SearchInput({
    value,
    onChange,
    placeholder,
    pad = "py-3",
    inputIconPad = "pl-10 pr-4",
    inputClassName = "",
    iconClassName = "text-slate-500 text-lg",
    iconPos = "left-3",
    wrapperClassName = "",
    id = undefined,
    inputRef = undefined,
    defaultValue = undefined,
}) {
    return (
        <div className={`relative ${wrapperClassName}`}>
            <span
                className={`material-symbols-outlined absolute ${iconPos} top-1/2 -translate-y-1/2 ${iconClassName}`}
            >
                search
            </span>
            <input
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                defaultValue={defaultValue}
                ref={inputRef}
                onChange={onChange}
                className={`w-full bg-slate-950 border-2 border-slate-800 rounded-xl ${inputIconPad} ${pad} text-white font-bold focus:outline-none focus:border-lime-500 transition-all text-sm ${inputClassName}`}
            />
        </div>
    );
}