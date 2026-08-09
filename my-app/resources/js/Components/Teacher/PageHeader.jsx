export default function PageHeader({
    title,
    subtitle,
    titleClassName = "",
    className = "mb-10",
    children,
}) {
    return (
        <div className={className}>
            <h1
                className={`text-4xl font-black text-white uppercase italic tracking-tighter mb-2 ${titleClassName}`}
            >
                {title}
            </h1>
            {subtitle && (
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    {subtitle}
                </p>
            )}
            {children}
        </div>
    );
}