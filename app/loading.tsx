export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-neutral-50 animate-pulse">
            {/* Header skeleton */}
            <header className="bg-white border-b border-neutral-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-neutral-200 rounded-none" />
                            <div className="space-y-1">
                                <div className="w-32 h-5 bg-neutral-200 rounded" />
                                <div className="w-48 h-3 bg-neutral-100 rounded" />
                            </div>
                        </div>
                        <div className="hidden md:flex gap-3">
                            <div className="w-24 h-4 bg-neutral-200 rounded" />
                            <div className="w-24 h-4 bg-neutral-200 rounded" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero skeleton */}
                <div className="mb-12 text-center">
                    <div className="w-64 h-8 bg-neutral-200 rounded mx-auto mb-4" />
                    <div className="w-96 h-4 bg-neutral-100 rounded mx-auto" />
                </div>

                {/* Categories skeleton */}
                <div className="mb-8">
                    <div className="w-40 h-6 bg-neutral-200 rounded mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white border-2 border-neutral-200 p-6">
                                <div className="w-3/4 h-5 bg-neutral-200 rounded mb-3" />
                                <div className="w-full h-3 bg-neutral-100 rounded mb-2" />
                                <div className="w-2/3 h-3 bg-neutral-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
