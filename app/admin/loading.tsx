export default function AdminLoading() {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border-2 border-neutral-200 p-6">
                        <div className="w-20 h-3 bg-neutral-200 rounded mb-3" />
                        <div className="w-16 h-8 bg-neutral-200 rounded" />
                    </div>
                ))}
            </div>

            <div className="bg-white border-2 border-neutral-200 p-6">
                <div className="w-40 h-5 bg-neutral-200 rounded mb-6" />
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-neutral-100 pb-3">
                            <div className="w-48 h-4 bg-neutral-200 rounded" />
                            <div className="w-24 h-3 bg-neutral-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
