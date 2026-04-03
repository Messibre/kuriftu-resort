"use client"

import { cn } from "@/lib/utils"

interface GreenSkeletonProps {
  className?: string
}

export function GreenSkeleton({ className }: GreenSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/10",
        className
      )}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <GreenSkeleton className="h-8 w-48" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <GreenSkeleton className="h-4 w-24" />
              <GreenSkeleton className="size-4 rounded" />
            </div>
            <GreenSkeleton className="mt-4 h-8 w-20" />
            <GreenSkeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-border bg-card p-6">
        <GreenSkeleton className="mb-4 h-6 w-32" />
        <GreenSkeleton className="h-[300px] w-full" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card p-6">
        <GreenSkeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <GreenSkeleton className="size-10 rounded-full" />
              <GreenSkeleton className="h-4 w-32" />
              <GreenSkeleton className="h-4 w-24" />
              <GreenSkeleton className="ml-auto h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <GreenSkeleton className="h-4 w-24" />
        <GreenSkeleton className="size-4 rounded" />
      </div>
      <GreenSkeleton className="mt-4 h-8 w-20" />
      <GreenSkeleton className="mt-2 h-3 w-32" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
          <GreenSkeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <GreenSkeleton className="h-4 w-32" />
            <GreenSkeleton className="h-3 w-24" />
          </div>
          <GreenSkeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
