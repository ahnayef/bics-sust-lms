export default function DashboardLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-2 px-1 sm:px-2">
      {/* Top Banner Skeleton */}
      <div className="h-28 sm:h-32 rounded-2xl bg-[#eadcc8]/30 border border-[#8a7966]/15 flex items-center justify-between p-6 overflow-hidden relative">
        <div className="space-y-3 w-2/3 max-w-md">
          <div className="h-6 w-3/4 rounded-md shimmer-skeleton" />
          <div className="h-4 w-1/2 rounded-md shimmer-skeleton" />
        </div>
        <div className="hidden sm:block h-10 w-28 rounded-xl shimmer-skeleton" />
      </div>

      {/* Metric Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 sm:h-28 rounded-xl bg-[#eadcc8]/25 border border-[#8a7966]/15 p-4 flex flex-col justify-between overflow-hidden relative"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded shimmer-skeleton" />
              <div className="h-6 w-6 rounded-full shimmer-skeleton" />
            </div>
            <div className="h-6 w-12 rounded shimmer-skeleton" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl bg-[#eadcc8]/20 border border-[#8a7966]/15 p-6 space-y-4 overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#8a7966]/15">
          <div className="h-5 w-40 rounded shimmer-skeleton" />
          <div className="h-8 w-24 rounded-lg shimmer-skeleton" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-[#eadcc8]/25 border border-[#8a7966]/10 flex items-center justify-between px-4 overflow-hidden relative"
            >
              <div className="flex items-center gap-3 w-2/3">
                <div className="h-8 w-8 rounded-lg shimmer-skeleton shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3.5 w-1/3 rounded shimmer-skeleton" />
                  <div className="h-2.5 w-1/4 rounded shimmer-skeleton" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full shimmer-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
