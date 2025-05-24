import React, { Suspense } from 'react'
import { NewsList } from '@/components/news/NewsList'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { sharedMetadata } from '@/app/shared-metadata'
import siteConfig from '@/app/shared-metadata'

export const metadata: Metadata = {
  ...sharedMetadata,
  title: 'News | Dawan Africa - Latest African News & Updates',
  description:
    'Stay informed with the latest news from across Africa. In-depth coverage of politics, business, technology, culture, and more from an African perspective.',
  openGraph: {
    ...sharedMetadata.openGraph,
    title: 'News | Dawan Africa - Latest African News & Updates',
    description:
      'Stay informed with the latest news from across Africa. In-depth coverage of politics, business, technology, culture, and more from an African perspective.',
    url: new URL('/news', siteConfig.url).toString(),
    type: 'website',
  },
  twitter: {
    ...sharedMetadata.twitter,
    title: 'News | Dawan Africa - Latest African News & Updates',
    description:
      'Stay informed with the latest news from across Africa. In-depth coverage of politics, business, technology, culture, and more from an African perspective.',
  },
  alternates: {
    canonical: new URL('/news', siteConfig.url).toString(),
  },
}

// Add revalidation to ensure deleted posts are immediately reflected
export const revalidate = 30

interface NewsPageProps {
  searchParams?: Promise<{
    search?: string
    page?: string
    sort?: string
  }>
}

// Define a skeleton component for the fallback
const NewsPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
      {/* Skeleton for Header and Filters section in NewsList */}
      <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2 rounded" /> {/* Title */}
          <Skeleton className="h-5 w-72 rounded" /> {/* Subtitle */}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
          <Skeleton className="h-10 w-full sm:w-64 rounded" /> {/* Search input */}
          <Skeleton className="h-10 w-full sm:w-48 rounded" /> {/* Sort select */}
        </div>
      </div>
      {/* Skeleton for Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[16/10] rounded-lg sm:rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default async function NewsPage({ searchParams }: Readonly<NewsPageProps>) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  return (
    <main className="bg-gray-50 min-h-screen">
      <Suspense fallback={<NewsPageSkeleton />}>
        <NewsList searchParams={resolvedSearchParams} />
      </Suspense>
    </main>
  )
}
