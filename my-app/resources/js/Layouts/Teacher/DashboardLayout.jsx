import { useState, useRef, useEffect } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import Sidebar from "../../Components/Teacher/Sidebar";
import DeadlineBanner from "@/Components/DeadlineBanner";
import Toast from "@/Components/Shared/Toast";
import Footer from "@/Components/Shared/Footer";
import { getDeadlineInfo } from "@/hooks/Student/useDeadlineStatus";

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const debounceRef = useRef(null);
    const { teacher } = usePage().props;
    const { auth } = usePage().props;
    const { filters = {}, searchResults = [] } = usePage().props.teacher ?? {};
    const showDeadlineBanner = getDeadlineInfo(auth?.deadline).phase === "closed";
    const deadlineMessage = `The report deadline has passed. Gameplay is locked and all leaderboards, badges, and reports are now final. Module editing is locked as well.`;
    const alerts = teacher
        ? [
              ...(!teacher.has_deadline
                  ? [
                        {
                            msg: "No report deadline set",
                            href: "/teacher/reports",
                            icon: "event",
                        },
                    ]
                  : []),
              ...(!teacher.has_email
                  ? [
                        {
                            msg: "Sender email not set — reports reply to system address",
                            href: "/teacher/settings",
                            icon: "mail",
                        },
                    ]
                  : []),
              ...(!teacher.has_word_modules
                  ? [
                        {
                            msg: "No Word Blast modules yet",
                            href: "/teacher/word",
                            icon: "book",
                        },
                    ]
                  : []),
              ...(!teacher.has_paragraph_modules
                  ? [
                        {
                            msg: "No Story Quest modules yet",
                            href: "/teacher/paragraphModules",
                            icon: "menu_book",
                        },
                    ]
                  : []),
          ]
        : [];
    const hasAlerts = alerts.length > 0;

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setShowNotifs(false);
            if (searchRef.current && !searchRef.current.contains(e.target))
                setSearchOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick, { passive: true });
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, []);
    const [searchBar, setSearchBar] = useState(filters?.searchBar ?? "");
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const query = searchBar.trim();
    const showDropdown = searchOpen && query.length > 0;

    // Keep the input in sync when navigation resets ?searchBar= (e.g. after picking a result).
    useEffect(() => {
        const next = filters?.searchBar ?? "";
        setSearchBar((prev) =>
            prev.trim() === String(next).trim() ? prev : String(next),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters?.searchBar]);

    // Debounced global search — same 300ms convention as Students/Leaderboards.
    // Skips single chars (hint only) and repeats of the shared value.
    useEffect(() => {
        const trimmed = searchBar.trim();
        const shared = String(filters?.searchBar ?? "").trim();
        if (trimmed === shared) return;
        if (trimmed.length === 1) return;
        setIsSearching(true);
        debounceRef.current = setTimeout(() => {
            router.get(
                window.location.pathname,
                { searchBar: trimmed },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);
        return () => clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchBar]);

    useEffect(() => {
        setIsSearching(false);
        setActiveIndex(-1);
    }, [searchResults]);

    const closeSearch = () => setSearchOpen(false);

    function highlightMatch(name = "", q = "") {
        if (!q) return name;
        const idx = name.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return name;
        return (
            <>
                {name.slice(0, idx)}
                <mark className="bg-accent/60 text-on-surface rounded-sm px-0.5">
                    {name.slice(idx, idx + q.length)}
                </mark>
                {name.slice(idx + q.length)}
            </>
        );
    }

    function handleSearchKeyDown(e) {
        if (e.key === "Escape") {
            if (showDropdown) setSearchOpen(false);
            else if (searchBar) setSearchBar("");
            return;
        }
        if (!showDropdown || searchResults.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % searchResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(
                (i) => (i - 1 + searchResults.length) % searchResults.length,
            );
        } else if (e.key === "Enter" && searchResults[activeIndex]) {
            e.preventDefault();
            const picked = searchResults[activeIndex];
            setSearchOpen(false);
            router.visit(`/teacher/studentDetails/${picked.id}`);
        }
    }
    return (
        <>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <header className="fixed top-0 right-0 left-0 md:left-64 h-16 sm:h-20 flex items-center justify-between px-3 sm:px-4 md:px-8 z-40 bg-background border-b-2 border-outline/20">
                <div className="flex flex-1 min-w-0 sm:min-w-[180px] md:w-1/3 items-center gap-2 sm:gap-3 lg:gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 text-on-surface-variant/60 hover:text-primary active:scale-95 transition-colors"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>

                    <div ref={searchRef} className="relative w-full">
                        <span
                            aria-hidden="true"
                            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                        >
                            search
                        </span>
                        {isSearching && (
                            <span
                                aria-hidden="true"
                                className={`material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-on-surface-variant/60 animate-spin text-[18px] ${
                                    searchBar.length > 0
                                        ? "right-9"
                                        : "right-3"
                                }`}
                            >
                                progress_activity
                            </span>
                        )}
                        <input
                            ref={searchInputRef}
                            role="combobox"
                            aria-expanded={showDropdown}
                            aria-controls="teacher-search-results"
                            aria-label="Search students"
                            aria-autocomplete="list"
                            className="w-full bg-surface-container-lowest border-2 border-outline/40 rounded-lg py-2 sm:py-2.5 pl-8 sm:pl-10 pr-9 focus:ring-2 focus:ring-secondary-container focus:border-secondary-container text-xs sm:text-sm font-body-md text-on-surface transition-all"
                            placeholder="Search name or ID…"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) => {
                                setSearchBar(e.target.value);
                                setSearchOpen(true);
                                setActiveIndex(-1);
                            }}
                            onFocus={() => setSearchOpen(true)}
                            onKeyDown={handleSearchKeyDown}
                            value={searchBar}
                        />
                        {searchBar.length > 0 && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => {
                                    setSearchBar("");
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 hover:text-primary active:scale-95 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    close
                                </span>
                            </button>
                        )}
                        {showDropdown && (
                            <div
                                id="teacher-search-results"
                                role="listbox"
                                aria-label="Matching students"
                                className="absolute top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] max-w-[360px] sm:w-[380px] max-h-[min(60vh,420px)] sm:max-h-[65vh] overflow-y-auto bg-surface-container-high border-2 border-outline/30 rounded-xl shadow-[4px_4px_0_0_#1e1b4b] z-50"
                            >
                                    <div className="p-3 sm:p-4 border-b-2 border-outline/40 flex items-center justify-between gap-2">
                                        <p className="font-black text-sm text-on-surface uppercase tracking-widest">
                                            Students
                                        </p>
                                        {searchResults?.length > 0 && (
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                                {searchResults.length} found
                                            </p>
                                        )}
                                    </div>
                                    {query.length === 1 ? (
                                        <div className="p-4 sm:p-6 text-center text-on-surface-variant text-sm font-bold">
                                            Keep typing to search…
                                        </div>
                                    ) : searchResults?.length > 0 ? (
                                        <div className="divide-y divide-outline/30">
                                            {searchResults.map((s, i) => (
                                                <Link
                                                    href={`/teacher/studentDetails/${s.id}`}
                                                    key={s.id}
                                                    role="option"
                                                    aria-selected={i === activeIndex}
                                                    onClick={closeSearch}
                                                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 min-h-[48px] transition-colors hover:bg-surface-container-low/60 ${
                                                        i === activeIndex
                                                            ? "bg-surface-container-low/60"
                                                            : ""
                                                    }`}
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest border-2 border-accent">
                                                        {s.avatar ? (
                                                            <img
                                                                src={s.avatar}
                                                                alt={s.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span
                                                                aria-hidden="true"
                                                                className="material-symbols-outlined text-on-surface-variant text-[20px]"
                                                            >
                                                                person
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-[13px] sm:text-sm font-bold text-on-surface whitespace-normal break-words [overflow-wrap:anywhere] leading-tight">
                                                            {highlightMatch(
                                                                s.name,
                                                                query,
                                                            )}
                                                        </span>
                                                        <span className="block text-[11px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant truncate">
                                                            {s.student_id}
                                                            {s.section
                                                                ? ` • ${s.section}`
                                                                : ""}
                                                        </span>
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="material-symbols-outlined text-outline shrink-0"
                                                    >
                                                        chevron_right
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : isSearching ? (
                                        <div className="p-4 sm:p-6 text-center text-on-surface-variant text-sm font-bold">
                                            Searching…
                                        </div>
                                    ) : (
                                        <div className="p-4 sm:p-6 text-center text-on-surface-variant text-sm font-bold">
                                            No students for &ldquo;{query}&rdquo;
                                        </div>
                                    )}
                                    {searchResults?.length > 0 && (
                                        <div className="p-3 border-t-2 border-outline/40 text-center">
                                            <Link
                                                href={`/teacher/students?search=${encodeURIComponent(query)}`}
                                                className="text-xs font-bold text-primary hover:text-primary-fixed uppercase tracking-widest min-h-[40px] flex items-center justify-center"
                                                onClick={closeSearch}
                                            >
                                                View all in Students
                                            </Link>
                                        </div>
                                    )}
                                </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-on-surface-variant/60">
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => setShowNotifs(!showNotifs)}
                                className="relative hover:text-primary active:scale-95 transition-colors"
                            >
                                <span className="material-symbols-outlined">
                                    notifications
                                </span>
                                {hasAlerts && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-background" />
                                )}
                            </button>
                            {showNotifs && (
                                <>
                                    <div
                                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
                                        onClick={() => setShowNotifs(false)}
                                        aria-hidden="true"
                                    />
                                    <div className="absolute top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] max-w-[360px] sm:w-[380px] max-h-[min(60vh,420px)] sm:max-h-[65vh] overflow-y-auto bg-surface-container-high border-2 border-outline/30 rounded-xl shadow-[4px_4px_0_0_#1e1b4b] z-50">
                                        <div className="p-3 sm:p-4 border-b-2 border-outline/40">
                                            <p className="font-black text-sm text-on-surface uppercase tracking-widest">
                                                Alerts
                                            </p>
                                        </div>
                                        {alerts.length === 0 ? (
                                            <div className="p-4 sm:p-6 text-center text-on-surface-variant text-sm font-bold">
                                                All good!
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-outline/30">
                                                {alerts.map((a, i) => (
                                                    <Link
                                                        key={i}
                                                        href={a.href}
                                                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 min-h-[48px] hover:bg-surface-container-low/60 transition-colors"
                                                        onClick={() =>
                                                            setShowNotifs(false)
                                                        }
                                                    >
                                                        <span className="material-symbols-outlined text-secondary-container text-[20px] sm:text-[24px] shrink-0">
                                                            {a.icon}
                                                        </span>
                                                        <p className="text-[13px] sm:text-sm font-bold text-on-surface-variant whitespace-normal break-words [overflow-wrap:anywhere] leading-tight min-w-0 flex-1">
                                                            {a.msg}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        <div className="p-3 border-t-2 border-outline/40 text-center">
                                            <Link
                                                href="/teacher/reports"
                                                className="text-xs font-bold text-primary hover:text-primary-fixed uppercase tracking-widest min-h-[40px] flex items-center justify-center"
                                                onClick={() =>
                                                    setShowNotifs(false)
                                                }
                                            >
                                                View All
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pl-3 md:pl-6 border-l-2 border-outline/25">
                        <span className="hidden md:inline font-headline-md text-[10px] sm:text-xs lg:text-sm font-bold tracking-tight text-on-surface whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block max-w-[100px] sm:max-w-[140px] lg:max-w-none">
                            WORD-O-MATIC Dashboard
                        </span>
                    </div>
                </div>
            </header>
            <main className="md:ml-64 pt-28 pb-20 px-4 md:px-8 min-h-screen bg-background overflow-x-hidden min-w-0">
                {showDeadlineBanner && <DeadlineBanner message={deadlineMessage} />}
                {children}
            </main>
            <Toast />
            <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-background">
                <Footer />
            </div>
        </>
    );
}
