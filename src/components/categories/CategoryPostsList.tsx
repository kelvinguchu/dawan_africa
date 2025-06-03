'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BlogPost } from '@/payload-types'
import { NewsCard } from '@/components/news/NewsCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, ListFilter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategorySearch } from './CategorySearch'

const POSTS_PER_PAGE = 20

interface CategoryPostsListProps {
  categorySlug: string
  categoryName: string
}

const fetchCategoryPosts = async (context: { queryKey: readonly unknown[] }) => {
  const [_key, categorySlug, page, term, sort] = context.queryKey as [
    string,
    string,
    number,
    string,
    string,
  ]

  // Construct the URL with query parameters
  const queryParams = new URLSearchParams({
    limit: String(POSTS_PER_PAGE),
    page: String(page),
    sort: sort,
    depth: '1',
  })

  // Filter by category slug
  queryParams.append('where[categories.slug][equals]', categorySlug)

  // Only show published posts
  queryParams.append('where[status][equals]', 'published')

  if (term && term.trim()) {
    // Use exact Payload CMS query format for searching
    queryParams.append('where[name][like]', term.trim())
  }

  // Make the API request
  const apiUrl = `/api/blogPosts?${queryParams.toString()}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch posts')
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

export const CategoryPostsList: React.FC<CategoryPostsListProps> = ({
  categorySlug,
  categoryName,
}) => {
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('-createdAt')
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize search term from URL on first load and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchTerm(urlSearch)

    // Reset to first page when search changes
    if (urlSearch !== searchTerm) {
      setCurrentPage(1)
    }
  }, [searchParams])

  // Now using the local searchTerm in the query with explicit dependency
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categoryPosts', categorySlug, currentPage, searchTerm, sortBy],
    queryFn: fetchCategoryPosts,
    staleTime: 1000 * 60, // 1 minute
  })

  // Force refetch when search term changes
  useEffect(() => {
    refetch()
  }, [searchTerm, refetch])

  // Get all posts from the API
  const allPosts: BlogPost[] = data?.docs || []
  const totalPages: number = data?.totalPages || 1

  // Apply client-side filtering as a fallback if API filtering isn't working
  const posts = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) {
      return allPosts
    }

    // If we're showing all posts and have a search term, try client-side filtering
    const term = searchTerm.trim().toLowerCase()
    const filtered = allPosts.filter((post) => post.name?.toLowerCase().includes(term))
    return filtered
  }, [allPosts, searchTerm])

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1)
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-500">Error loading news: {error?.message || 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
      {/* Header and Filters */}
      <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-gray-900 mb-1 sm:mb-2">
            {categoryName}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            Explore articles in {categoryName.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
          <CategorySearch
            inputClassName="h-9 sm:h-10 w-full bg-white shadow-sm text-sm"
            className="w-full sm:flex-grow"
            categorySlug={categorySlug}
            onSearchChange={handleSearchChange}
          />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9 sm:h-10 w-full sm:w-40 md:w-48 bg-white shadow-sm text-xs sm:text-sm">
              <ListFilter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-createdAt">Newest First</SelectItem>
              <SelectItem value="createdAt">Oldest First</SelectItem>
              <SelectItem value="name">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="-name">Alphabetical (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {Array.from({ length: POSTS_PER_PAGE > 12 ? 12 : POSTS_PER_PAGE }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-lg sm:rounded-xl" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {posts.map((post) => (
            <NewsCard key={post.id} post={post} showCategories={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 md:py-10">
          <p className="text-lg sm:text-xl text-gray-500">No articles found in this category.</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search or filter criteria.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && posts.length > 0 && (
        <div className="mt-8 sm:mt-10 md:mt-12 flex justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-[#2aaac6]/10 hover:text-[#2aaac6]"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <span className="text-xs sm:text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-[#2aaac6]/10 hover:text-[#2aaac6]"
          >
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
