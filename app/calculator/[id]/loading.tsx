export default function CalculatorLoading() {
    return (
        <div className="min-h-screen bg-neutral-50 animate-pulse">
            {/* Header skeleton */}
            <header className="bg-white border-b border-neutral-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-neutral-200" />
                            <div className="space-y-1">
                                <div className="w-32 h-5 bg-neutral-200 rounded" />
                                <div className="w-48 h-3 bg-neutral-100 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs skeleton */}
                <div className="flex gap-2 mb-6">
                    <div className="w-16 h-3 bg-neutral-200 rounded" />
                    <div className="w-4 h-3 bg-neutral-100 rounded" />
                    <div className="w-32 h-3 bg-neutral-200 rounded" />
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar skeleton */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white border-2 border-neutral-200 p-5">
                            <div className="w-24 h-4 bg-neutral-200 rounded mb-4" />
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="w-full h-3 bg-neutral-100 rounded" />
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main content skeleton */}
                    <div className="flex-1">
                        {/* Title */}
                        <div className="w-3/4 h-8 bg-neutral-200 rounded mb-3" />
                        <div className="w-full h-4 bg-neutral-100 rounded mb-8" />

                        {/* Calculator box */}
                        <div className="bg-white p-6 sm:p-8 border-2 border-neutral-200 shadow-sm mb-8">
                            <div className="space-y-4">
                                <div className="w-40 h-4 bg-neutral-200 rounded" />
                                <div className="w-full h-12 bg-neutral-100 rounded" />
                                <div className="w-40 h-4 bg-neutral-200 rounded" />
                                <div className="w-full h-12 bg-neutral-100 rounded" />
                                <div className="w-32 h-10 bg-neutral-200 rounded" />
                            </div>
                        </div>

                        {/* Content skeleton */}
                        <div className="space-y-3 mt-8">
                            <div className="w-48 h-6 bg-neutral-200 rounded" />
                            <div className="w-full h-3 bg-neutral-100 rounded" />
                            <div className="w-full h-3 bg-neutral-100 rounded" />
                            <div className="w-3/4 h-3 bg-neutral-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
