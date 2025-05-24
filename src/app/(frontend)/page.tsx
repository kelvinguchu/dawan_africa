import { getPayload } from 'payload'
import React from 'react'
import config from '@/payload.config'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedPosts } from '@/components/home/FeaturedPosts'
import { CategorySection } from '@/components/home/CategorySection'
import { BlogPost, BlogCategory } from '@/payload-types'
import { subDays } from 'date-fns'
import { Metadata } from 'next'
import { sharedMetadata } from '@/app/shared-metadata'
import siteConfig from '@/app/shared-metadata'

export const metadata: Metadata = {
  ...sharedMetadata,
  openGraph: {
    ...sharedMetadata.openGraph,
    title: 'Home | Dawan Africa - Uncovering the Continent Through Its Own Lens',
    description:
      'Discover the latest news, stories, and insights from across Africa. Your trusted source for African perspectives on politics, culture, business, and more.',
    type: 'website',
  },
  twitter: {
    ...sharedMetadata.twitter,
    title: 'Home | Dawan Africa - Uncovering the Continent Through Its Own Lens',
    description:
      'Discover the latest news, stories, and insights from across Africa. Your trusted source for African perspectives on politics, culture, business, and more.',
  },
  alternates: {
    canonical: new URL('/', siteConfig.url).toString(),
  },
}

// Add revalidation every 30 seconds to ensure fresh content
export const revalidate = 30

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch recent blog posts for the hero section (increased to 20 for flash news rotation)
  const heroPostsResponse = await payload.find({
    collection: 'blogPosts',
    limit: 20,
    sort: '-createdAt',
    depth: 2,
  })

  const heroPosts = heroPostsResponse.docs
  const latestPost: BlogPost | null = heroPosts.length > 0 ? heroPosts[0] : null

  // Get IDs of posts shown in HeroSection to exclude from OTHER sections (but allow editor's picks to appear in both)
  const heroPostIds = heroPosts.map((post) => post.id)

  // Fetch trending posts (last 30 days sorted by views)
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
  const trendingPostsResponse = await payload.find({
    collection: 'blogPosts',
    limit: 6,
    sort: '-views',
    depth: 2,
    where: {
      and: [
        {
          createdAt: {
            greater_than: thirtyDaysAgo,
          },
        },
        {
          id: {
            not_in: heroPostIds,
          },
        },
      ],
    },
  })

  // Fetch editor's picks (allow them to appear even if they're in hero section)
  const editorsPicksResponse = await payload.find({
    collection: 'blogPosts',
    limit: 6,
    sort: '-createdAt',
    depth: 2,
    where: {
      isEditorsPick: {
        equals: true,
      },
    },
    // Removed the heroPostIds exclusion for editor's picks
  })

  // Fetch recent news items (for the ListPosts section)
  const recentNewsResponse = await payload.find({
    collection: 'blogPosts',
    limit: 6,
    sort: '-createdAt',
    depth: 2,
    where: {
      id: {
        not_in: heroPostIds,
      },
    },
  })

  // Fetch categories and their latest posts
  const categoriesResponse = await payload.find({
    collection: 'blogCategories',
    limit: 100,
  })

  const categories = categoriesResponse.docs

  // Fetch recent posts with category information to match latest posts to categories
  const postsWithCategoriesResponse = await payload.find({
    collection: 'blogPosts',
    limit: 100,
    sort: '-createdAt',
    depth: 2,
  })

  const postsWithCategories = postsWithCategoriesResponse.docs.filter(
    (post) => post.categories && Array.isArray(post.categories) && post.categories.length > 0,
  )

  // Create a map to track the latest post for each category
  const categoryPostMap = new Map<string, { category: BlogCategory; latestPost: BlogPost }>()

  // Process posts to find latest post for each category
  postsWithCategories.forEach((post) => {
    if (post.categories && Array.isArray(post.categories)) {
      post.categories.forEach((cat) => {
        let categoryId: string | null = null
        let categorySlug: string | null = null

        // Handle both populated (object) and non-populated (string ID) categories
        if (typeof cat === 'string') {
          categoryId = cat
          // Find the category from our fetched list by ID
          const originalCategory = categories.find((c) => c.id === categoryId)
          if (originalCategory) {
            categorySlug = originalCategory.slug
          }
        } else if (typeof cat === 'object' && cat.id) {
          categoryId = cat.id
          categorySlug = cat.slug
        }

        if (categoryId && categorySlug) {
          // Find the original category to ensure we have complete data
          const originalCategory = categories.find(
            (c) => c.id === categoryId || c.slug === categorySlug,
          )

          if (originalCategory && !categoryPostMap.has(categorySlug)) {
            categoryPostMap.set(categorySlug, {
              category: originalCategory,
              latestPost: post,
            })
          }
        }
      })
    }
  })

  // Convert map to array and limit to reasonable number for display
  const categoriesWithPosts = Array.from(categoryPostMap.values())
    .slice(0, 6) // Limit to 6 categories for better layout
    .map(({ category, latestPost }) => ({
      ...category,
      latestPost,
    }))

  return (
    <div className="min-h-screen">
      {/* Hero Section with latest post and recent posts */}
      <HeroSection latestPost={latestPost} recentPosts={heroPosts} />

      {/* Featured Posts Section - Excluding hero posts */}
      <FeaturedPosts
        trendingPosts={trendingPostsResponse.docs}
        editorsPicks={editorsPicksResponse.docs}
        recentNewsItems={recentNewsResponse.docs}
      />

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-10 text-center">
            News Categories
          </h2>
          <CategorySection categoriesWithPosts={categoriesWithPosts} />
        </div>
      </section>
    </div>
  )
}
