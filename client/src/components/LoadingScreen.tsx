export function LoadingScreen({ label = 'Preparing your workspace' }: { label?: string }) {
    return (
        <div
            className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-6"
            role="status"
            aria-live="polite"
        >
            <div className="flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-indigo-200/60" />
                    <span className="absolute inset-1 animate-spin rounded-2xl border-2 border-indigo-100 border-t-indigo-600" />
                    <img
                        src="/pairwise-logo.png"
                        alt=""
                        className="relative h-12 w-12 rounded-xl object-cover"
                    />
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs text-slate-500">A moment while we bring everything together.</p>
            </div>
        </div>
    );
}
