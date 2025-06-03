import React from 'react'
import Image from 'next/image'
import { BlogPost } from '@/payload-types'
import { format } from 'date-fns'
import { CalendarDays, Clock, UserCircle } from 'lucide-react'

// Import utility functions
import { getAuthorName, getAuthorRole, getPostImageFromLayout } from '@/utils/postUtils'
import { SharePopoverClient } from './SharePopoverClient'

interface ArticleHeaderProps {
  post: BlogPost
  currentUrl: string
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({ post, currentUrl }) => {
  const authorName = getAuthorName(post.author)
  const authorRole = getAuthorRole(post.author)
  const publishedDate = format(new Date(post.createdAt), 'MMMM d, yyyy')
  // Basic reading time estimate, can be enhanced
  const wordCount =
    post.layout?.reduce((acc, block) => {
      if (block.blockType === 'richtext' && block.content?.root?.children) {
        return (
          acc +
          block.content.root.children
            .map(
              (child: any) =>
                child.children
                  ?.map((span: any) => span.text)
                  .join('')
                  .split(' ').length || 0,
            )
            .reduce((sum: number, count: number) => sum + count, 0)
        )
      }
      // Add word count for other text-based blocks if necessary
      return acc
    }, 0) || post.name.split(' ').length // Fallback to title word count if no layout
  const readingTime = Math.ceil(wordCount / 200)

  const coverImageUrl = getPostImageFromLayout(post.layout)

  return (
    <header>
      {/* Hero layout - always show */}
      <div className="relative">
        {coverImageUrl ? (
          <>
            {/* With image */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-transparent z-10" />
            <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] relative">
              <Image
                src={coverImageUrl}
                alt={post.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          </>
        ) : (
          <>
            {/* Without image - gradient background */}
            <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800 z-0"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%20fill-opacity%3D%220.05%22%3E%3Ccircle%20fill%3D%22%23fff%22%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] bg-[length:24px_24px] opacity-20 z-5"></div>
            </div>
          </>
        )}

        {/* Title and meta info overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 md:p-8 lg:p-16 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-6 leading-tight text-shadow">
              {post.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 sm:gap-y-3 text-white/90 text-xs sm:text-sm md:text-base">
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1.5 sm:mr-2 md:mr-3 text-white" />
                <div className="flex flex-col">
                <span className="font-medium">By {authorName}</span>
                  <span className="text-xs sm:text-sm text-white/80">{authorRole}</span>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1.5 sm:mr-2 md:mr-3 text-white" />
                <span>{publishedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1.5 sm:mr-2 md:mr-3 text-white" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating share button - shown on all screen sizes */}
      <div className="fixed right-4 sm:right-8 top-24 sm:top-32 z-50">
        <SharePopoverClient
          title={post.name}
          url={currentUrl}
          buttonVariant="outline"
          buttonSize="icon"
          className="w-10 h-10 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300"
        />
      </div>
    </header>
  )
}
