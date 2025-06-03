import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import siteConfig from '@/app/shared-metadata'

async function getAllPosts() {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'blogPosts',
    limit: 100,
  })
  return posts.docs
}

async function getAllCategories() {
  const payload = await getPayload({ config })
  const categories = await payload.find({
    collection: 'blogCategories',
    limit: 10,
  })
  return categories.docs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  // Get all posts and categories
  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()])

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/markets`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
  ]

  // Dynamic routes for blog posts
  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic routes for categories
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...postRoutes, ...categoryRoutes]
}
