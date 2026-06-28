import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-8 w-[130px] rounded-lg" />
        <Skeleton className="h-8 w-[130px] rounded-lg" />
        <Skeleton className="h-8 w-[130px] rounded-lg" />
        <Skeleton className="h-8 w-[100px] rounded-lg" />
        <Skeleton className="h-8 w-[100px] rounded-lg" />
        <Skeleton className="h-8 w-[140px] rounded-lg ml-auto" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
