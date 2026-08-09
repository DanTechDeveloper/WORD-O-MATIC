export default function TabBar({
    tabs,
    active,
    onSelect,
    className = "flex items-center bg-slate-950 border-2 border-slate-800 rounded-xl p-1 overflow-x-auto",
    itemClassName = "px-3 sm:px-4 py-2 font-black text-xs sm:text-sm whitespace-nowrap rounded-lg transition-all",
    activeClass = "bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]",
    inactiveClass = "text-slate-400 hover:text-lime-300",
    withIcons = false,
}) {
    return (
        <div className={className}>
            {tabs.map((tab) => {
                const isActive = active === tab.value;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onSelect(tab.value)}
                        className={`${itemClassName} ${withIcons ? "flex items-center gap-2 uppercase" : ""} ${
                            isActive ? activeClassName : inactiveClass
                        }`}
                    >
                        {tab.icon && (
                            <span className="material-symbols-outlined text-sm">
                                {tab.icon}
                            </span>
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}