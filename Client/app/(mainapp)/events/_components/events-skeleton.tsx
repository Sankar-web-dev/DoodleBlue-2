import { Skeleton } from "@/components/ui/skeleton";

/** Themed skeleton that mirrors the events page layout (header + table). */
export function EventsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 py-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] gap-4 border-b bg-muted/50 px-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <span />
        </div>
        {/* Body rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] items-center gap-4 border-b border-border/40 px-4 py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
