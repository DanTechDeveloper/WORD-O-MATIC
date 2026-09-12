// ponytail: calm pulse skeleton, no shimmer glass — same for student and teacher, teacher uses denser rows
export function SkeletonCard() {
    return (
        <div
            aria-hidden="true"
            className="animate-pulse bg-surface-container-high border-2 border-outline/30 rounded-2xl p-6"
        >
            <div className="h-5 w-1/3 bg-surface-container-lowest rounded-lg" />
            <div className="mt-4 h-3 w-full bg-surface-container-lowest rounded" />
            <div className="mt-2 h-3 w-5/6 bg-surface-container-lowest rounded" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div
            aria-hidden="true"
            className="animate-pulse flex items-center gap-4 p-4 border-b-2 border-outline/10"
        >
            <div className="w-10 h-10 rounded-lg bg-surface-container-high shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 bg-surface-container-high rounded" />
                <div className="h-2 w-1/6 bg-surface-container-high rounded" />
            </div>
            <div className="h-6 w-20 bg-surface-container-high rounded-full" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div role="status" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
}
