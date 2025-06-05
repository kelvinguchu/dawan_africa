'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BlogCategory, BlogPost, Media } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BiLogoYoutube,
  BiLogoTwitter,
  BiLogoFacebook,
  BiLogoTiktok,
  BiChevronRight,
  BiMap,
  BiPhone,
  BiEnvelope,
  BiTime,
} from 'react-icons/bi'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  // Newsletter subscription state
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

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

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubscribing(true)
    setSubscriptionMessage(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'footer',
        }),
      })

      // Fix: Check response status before attempting to parse JSON
      if (!response.ok) {
        // Try to extract error message from response if it's JSON
        const contentType = response.headers.get('content-type')
        let errorMessage = 'Failed to subscribe. Please try again.'

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            // If JSON parsing fails, use default message
          }
        }

        setSubscriptionMessage({
          type: 'error',
          text: errorMessage,
        })
        return
      }

      // Fix: Validate content-type before parsing JSON for successful responses
      const contentType = response.headers.get('content-type')

      if (!contentType || !contentType.includes('application/json')) {
        // Handle successful response that isn't JSON
        setSubscriptionMessage({
          type: 'success',
          text: 'Successfully subscribed to our newsletter!',
        })
        setEmail('')
        return
      }

      // Safe to parse JSON now
      const data = await response.json()

      // Check if user was already subscribed
      const isAlreadySubscribed = data.message?.includes('already subscribed')

      setSubscriptionMessage({
        type: isAlreadySubscribed ? 'info' : 'success',
        text: isAlreadySubscribed ? data.message : 'Successfully subscribed to our newsletter!',
      })

      // Only reset email if it's a new subscription, not if already subscribed
      if (!isAlreadySubscribed) {
        setEmail('')
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setSubscriptionMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again later.',
      })
    } finally {
      setIsSubscribing(false)
    }
  }

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
      {/* Main Footer Content */}
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
                Uncovering the Continent — Through Its Own Lens
              </p>
            </div>

            <div className="flex flex-col space-y-2 sm:space-y-3 text-slate-300 text-sm">
              <div className="flex items-center">
                <BiMap className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-[#2aaac6]" />
                <span>Marinio Rd, Mogadishu, Somalia</span>
              </div>
              <div className="flex items-center">
                <BiPhone className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-[#2aaac6]" />
                <span>+252628881171</span>
              </div>
              <div className="flex items-center">
                <BiEnvelope className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-[#2aaac6]" />
                <span>Info@dawan.africa</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex space-x-3 sm:space-x-4">
              <a
                href="https://youtube.com/@dawanafrica?si=MeDNmWJDGkFWiF45"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <BiLogoYoutube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://x.com/dawanafrica?s=11&t=cGgYbc_v8C1zcdmiZHSiRg"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <BiLogoTwitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.facebook.com/share/1DLeMnVa2e/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <BiLogoFacebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@dawanafrica?_t=ZS-8wXUI4l8QKX&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 p-1.5 sm:p-2 rounded-full hover:bg-[#2aaac6] transition-colors"
              >
                <BiLogoTiktok className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="hidden sm:block sm:col-span-1 lg:col-span-2">
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white relative pb-2 before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-10 sm:before:w-12 before:h-0.5 before:bg-[#2aaac6]">
              Quick Links
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <BiChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <BiChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  Latest News
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-[#2aaac6] transition-colors flex items-center"
                >
                  <BiChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories - Dynamic */}
          <div className="hidden sm:block sm:col-span-1 lg:col-span-2">
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
                        <BiChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                        {category.name}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>

          {/* Recent Posts - Dynamic */}
          <div className="hidden sm:block sm:col-span-2 lg:col-span-4">
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
                        <BiTime className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-slate-800 mt-6 sm:mt-10 pt-6 sm:pt-8">
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-2">
              Stay Updated with African News
            </h4>
            <p className="text-slate-300 text-sm mb-6">
              Get the latest breaking news and analysis delivered to your inbox.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-sm mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubscribing}
                    className="h-10 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-[#2aaac6] focus:ring-[#2aaac6]/20"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
                <Button
                  type="submit"
                  disabled={isSubscribing || !email.trim()}
                  className="h-10 px-6 bg-[#2aaac6] hover:bg-[#1e90a6] text-white border-0"
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>

              {subscriptionMessage && (
                <Alert
                  className={`mt-4 ${
                    subscriptionMessage.type === 'success'
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : subscriptionMessage.type === 'error'
                        ? 'border-red-500/20 bg-red-500/10 text-red-400'
                        : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {subscriptionMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : subscriptionMessage.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                  )}
                  <AlertDescription
                    className={
                      subscriptionMessage.type === 'success'
                        ? 'text-green-400'
                        : subscriptionMessage.type === 'error'
                          ? 'text-red-400'
                          : 'text-blue-400'
                    }
                  >
                    {subscriptionMessage.text}
                  </AlertDescription>
                </Alert>
              )}
            </form>

            <p className="text-slate-400 text-xs mt-4">
              Join our community of informed readers. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-slate-800 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            &copy; {currentYear} Dawan Africa. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy-policy"
              className="text-slate-400 hover:text-[#2aaac6] text-xs sm:text-sm"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-[#2aaac6] text-xs sm:text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
