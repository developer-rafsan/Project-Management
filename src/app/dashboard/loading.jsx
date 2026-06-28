import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
