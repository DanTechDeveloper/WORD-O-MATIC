export default function PageHeader({ icon, title, subtitle, iconClass = "text-tertiary", as: Tag = "h2", className = "mb-8 text-center" }) {
    return (
        <div className={className}>
            <Tag className="text-4xl lg:text-6xl font-black text-on-surface uppercase tracking-tight mb-2 flex items-center justify-center gap-3">
                {icon && (
                    <span className={`material-symbols-outlined text-5xl lg:text-7xl ${iconClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                    </span>
                )}
                {title}
            </Tag>
            {subtitle && (
                <p className="text-on-surface-variant text-base font-bold max-w-lg mx-auto">
                    {subtitle}
                </p>
            )}
        </div>
    );
}