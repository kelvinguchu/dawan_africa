import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { BlogPost } from '@/payload-types'
import { NewsCard } from './NewsCard'
import { NewsListClient, PaginationClient } from './NewsListClient'

interface NewsListProps {
  searchParams?: {
    search?: string
    page?: string
    sort?: string
  }
}

const POSTS_PER_PAGE = 32

const fetchBlogPosts = async ({
  page = 1,
  searchTerm = '',
  sortBy = '-createdAt',
}: {
  page?: number
  searchTerm?: string
  sortBy?: string
}) => {
  try {
    const payload = await getPayload({ config: configPromise })

    // Build the where clause
    const where: any = {
      status: { equals: 'published' }, // Only show published posts
    }
    if (searchTerm && searchTerm.trim()) {
      where.name = {
        like: searchTerm.trim(),
      }
    }

    const result = await payload.find({
      collection: 'blogPosts',
      where,
      limit: POSTS_PER_PAGE,
      page,
      sort: sortBy,
      depth: 1,
    })

    return {
      docs: result.docs,
      totalPages: result.totalPages,
      page: result.page,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return {
      docs: [],
      totalPages: 1,
      page: 1,
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
}

export const NewsList: React.FC<NewsListProps> = async ({ searchParams = {} }) => {
  const page = parseInt(searchParams.page || '1', 10)
  const searchTerm = searchParams.search || ''
  const sortBy = searchParams.sort || '-createdAt'

  const data = await fetchBlogPosts({
    page,
    searchTerm,
    sortBy,
  })

  const posts: BlogPost[] = data.docs || []

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
      {/* Header and Filters - Client Component for Interactivity */}
      <NewsListClient
        initialSearchTerm={searchTerm}
        initialSortBy={sortBy}
        currentPage={page}
        totalPages={data.totalPages}
      />

      {/* Posts Grid - Server Rendered */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10">
          {posts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 md:py-10 mt-6 sm:mt-8 md:mt-10">
          <p className="text-lg sm:text-xl text-gray-500">No articles found.</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search or filter criteria.
            </p>
          )}
        </div>
      )}

      {/* Pagination - Client Component at the Bottom */}
      <PaginationClient currentPage={page} totalPages={data.totalPages} />
    </div>
  )
}
