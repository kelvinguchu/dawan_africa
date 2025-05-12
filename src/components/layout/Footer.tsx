'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogCategory, BlogPost, Media } from '@/payload-types'
import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/blogCategories?limit=5')
        const categoriesData = await categoriesResponse.json()

        // Fetch recent posts
        const postsResponse = await fetch('/api/blogPosts?limit=3&sort=-createdAt&depth=2')
        const postsData = await postsResponse.json()

        if (categoriesData.docs) {
          setCategories(categoriesData.docs)
        }

        if (postsData.docs) {
          setRecentPosts(postsData.docs)
        }
      } catch (error) {
        console.error('Error fetching footer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to extract image from the post layout blocks
  const getPostImage = (post: BlogPost): string | null => {
    if (!post.layout) return null

    // Look first for cover blocks with images
    for (const block of post.layout) {
      if (block.blockType === 'cover' && block.image) {
        // Handle both string ID and Media object
        const media = typeof block.image === 'string' ? null : (block.image as Media)
        return media?.url || null
      }
    }

    // Fall back to image blocks if no cover blocks have images
    for (const block of post.layout) {
      if (block.blockType === 'image' && block.image) {
        const media = typeof block.image === 'string' ? null : (block.image as Media)
        return media?.url || null
      }
    }

    return null
  }

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Brand and About */}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="mb-4 sm:mb-6">
              <Image
                src="/dark-mode-logo.png"
                alt="Dawan Africa"
                width={140}
                height={42}
                priority
                className="mb-3 sm:mb-4 w-auto h-[36px] sm:h-[42px]"
              />
              <p className="text-slate-300 text-sm max-w-xs">
                Your trusted source for African news, analysis, and insights from across the
                continent.
              </p>
            </div>

            <div className="flex flex-col space-y-2 sm:space-y-3 text-slate-300 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-[#2aaac6]" />
                <span>123 News Street, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-[#2aaac6]" />
                <span>+254 123 456 789</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex space-x-3 sm:space-x-4">
              <a
                href="#"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white relative pb-2 before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-10 sm:before:w-12 before:h-0.5 before:bg-[#2aaac6]">
              Quick Links
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  Latest News
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories - Dynamic */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white relative pb-2 before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-10 sm:before:w-12 before:h-0.5 before:bg-[#2aaac6]">
              Categories
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-sm">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <li
                      key={index}
                      className="animate-pulse h-4 sm:h-5 bg-slate-700 rounded w-3/4"
                    ></li>
                  ))
                : categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/category/${category.id}`}
                        className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                      >
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                        {category.name}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>

          {/* Recent Posts - Dynamic */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white relative pb-2 before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-10 sm:before:w-12 before:h-0.5 before:bg-[#2aaac6]">
              Recent Posts
            </h4>

            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex mb-3 sm:mb-4 gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-1.5 sm:space-y-2">
                      <div className="h-3 sm:h-4 bg-slate-700 rounded animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))
              : recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center mb-4 sm:mb-6 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden flex-shrink-0 mr-2 sm:mr-3">
                      {getPostImage(post) ? (
                        <img
                          src={getPostImage(post) || ''}
                          alt={post.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="bg-slate-800 w-full h-full flex items-center justify-center">
                          <span className="text-[#2aaac6] text-[10px] sm:text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/news/${post.slug}`} className="block">
                        <h5 className="text-xs sm:text-sm font-medium text-white hover:text-[#2aaac6] transition-colors line-clamp-2 group-hover:text-[#2aaac6]">
                          {post.name}
                        </h5>
                      </Link>
                      <div className="flex items-center mt-1 text-[10px] sm:text-xs text-slate-400">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="border-t border-slate-800 mt-6 sm:mt-10 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            &copy; {currentYear} Dawan Africa. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-[#2aaac6] text-xs sm:text-sm"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-[#2aaac6] text-xs sm:text-sm">
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-slate-400 hover:text-[#2aaac6] text-xs sm:text-sm"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
