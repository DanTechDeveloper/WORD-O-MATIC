export default function TableTh({
    children,
    className = "",
    align = "",
    pad = "px-6 py-4",
}) {
    const alignClass =
        align === "right"
            ? "text-right"
            : align === "center"
              ? "text-center"
              : "";
    return (
        <th
            className={`${pad} text-slate-500 font-black uppercase text-xs tracking-widest ${alignClass} ${className}`}
        >
            {children}
        </th>
    );
}