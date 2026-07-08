'use client'

import { Skeleton } from '@/components/ui/skeleton'

// ─── Card Skeletons ────────────────────────────────────────────────
export function ListingCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-28 sm:h-32 rounded-2xl" />
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function RealEstateCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-36 sm:h-40 rounded-2xl" />
      <Skeleton className="h-4 w-4/5 rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
      <Skeleton className="h-3 w-2/3 rounded" />
    </div>
  )
}

export function NewsCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-4 w-4/5 rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  )
}

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <Skeleton className="w-[68px] h-[68px] rounded-full" />
      <Skeleton className="w-16 h-3 rounded" />
    </div>
  )
}

export function BannerSkeleton() {
  return (
    <div className="w-full bg-white py-3">
      <div className="px-4">
        <Skeleton className="w-full aspect-[2/1] rounded-2xl" />
      </div>
    </div>
  )
}

// ─── Table Skeletons ───────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-3 border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded" />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  )
}

// ─── Dashboard Skeletons ───────────────────────────────────────────
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="w-14 h-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="text-center !p-4">
      <Skeleton className="w-10 h-10 rounded-xl mx-auto mb-2" />
      <Skeleton className="h-7 w-16 mx-auto rounded mb-1" />
      <Skeleton className="h-3 w-20 mx-auto rounded" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

// ─── Listing Detail Skeleton ───────────────────────────────────────
export function ListingDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="px-4 space-y-4">
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  )
}
