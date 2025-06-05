'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BlogPost as PayloadBlogPost, User as PayloadUser } from '@/payload-types'
import { BlockRenderer } from './BlockRenderer'
import { ArticleHeader } from './ArticleHeader'
import { Bookmark, ThumbsUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RelatedArticles } from './RelatedArticles'
import { updateUserAndPostEngagement } from '@/utils/engagementApi'
import { getRelatedPostsForView } from '@/utils/relatedPostsApi'
import { SharePopover } from './SharePopover'
import { AudioTrigger } from '@/components/audio/AudioTrigger'
import type { AudioTrack } from '@/contexts/AudioPlayerContext'

// Use the original types from payload-types
type BlogPost = PayloadBlogPost
type User = PayloadUser

interface ArticleViewProps {
  post: BlogPost
  relatedPosts?: BlogPost[]
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  post,
  relatedPosts: initialRelatedPosts,
}) => {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const [isFavorited, setIsFavorited] = useState(false)
  const [currentFavoriteCount, setCurrentFavoriteCount] = useState(0) // Initialize with 0, then set by useEffect
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false)

  const [isLiked, setIsLiked] = useState(false)
  const [currentLikeCount, setCurrentLikeCount] = useState(0) // Initialize with 0, then set by useEffect
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)

  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>(initialRelatedPosts || [])
  const [isLoadingRelated, setIsLoadingRelated] = useState(!initialRelatedPosts)

  const [currentUrl, setCurrentUrl] = useState<string>('')

  const fetchCurrentUser = useCallback(async () => {
    setIsLoadingUser(true)
    try {
      const resp = await fetch('/api/users/me', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include', // Important for Payload authentication
      })
      if (resp.ok) {
        const data = await resp.json()
        setCurrentUser(data.user as User)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      setCurrentUser(null)
    } finally {
      setIsLoadingUser(false)
    }
  }, [])

  const fetchRelatedPosts = useCallback(async () => {
    if (initialRelatedPosts && initialRelatedPosts.length > 0) {
      return
    }
    setIsLoadingRelated(true)
    try {
      const fetchedPosts = await getRelatedPostsForView({
        currentPostId: post.id,
        currentPostCategories: post.categories,
      })
      setRelatedPosts(fetchedPosts)
    } catch (error) {
      console.error('Error setting related posts in component:', error)
      setRelatedPosts([])
    } finally {
      setIsLoadingRelated(false)
    }
  }, [post.id, post.categories, initialRelatedPosts])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  useEffect(() => {
    if (!initialRelatedPosts || initialRelatedPosts.length === 0) {
      fetchRelatedPosts()
    }
  }, [fetchRelatedPosts, initialRelatedPosts])

  useEffect(() => {
    setCurrentLikeCount(post.likes || 0)
    setCurrentFavoriteCount(post.favoritesCount || 0)
  }, [post.id, post.likes, post.favoritesCount])

  useEffect(() => {
    if (currentUser && post) {
      const favoritedPostIds =
        currentUser.favoritedPosts?.map((p) => (typeof p === 'string' ? p : p.id)) || []
      setIsFavorited(favoritedPostIds.includes(post.id))

      const likedPostIds =
        currentUser.likedPosts?.map((p) => (typeof p === 'string' ? p : p.id)) || []
      setIsLiked(likedPostIds.includes(post.id))
    } else {
      setIsFavorited(false)
      setIsLiked(false)
    }
  }, [currentUser, post.id])

  // Set the URL after component mounts on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  if (!post) return <div>Article not found.</div>

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      router.push('/login?redirect_to=' + encodeURIComponent(window.location.pathname))
      return
    }
    if (isUpdatingFavorite) return

    setIsUpdatingFavorite(true)
    const currentlyFavorited = isFavorited
    const newFavoritedState = !currentlyFavorited
    setCurrentFavoriteCount((prevCount) => (newFavoritedState ? prevCount + 1 : prevCount - 1))
    setIsFavorited(newFavoritedState)

    const originalFavoritedPosts =
      currentUser.favoritedPosts?.map((p) => (typeof p === 'string' ? p : p.id)) || []
    let updatedFavoritedPosts: string[]

    if (currentlyFavorited) {
      updatedFavoritedPosts = originalFavoritedPosts.filter((id) => id !== post.id)
    } else {
      updatedFavoritedPosts = [...originalFavoritedPosts, post.id]
    }

    const { userUpdateOk, postUpdateOk } = await updateUserAndPostEngagement({
      userId: currentUser.id,
      postId: post.id,
      userEngagementField: 'favoritedPosts',
      updatedUserEngagementArray: updatedFavoritedPosts,
      postCountField: 'favoritesCount',
      newPostCount: newFavoritedState ? currentFavoriteCount + 1 : currentFavoriteCount - 1,
    })

    if (userUpdateOk) {
      setCurrentUser((prevUser) =>
        prevUser ? { ...prevUser, favoritedPosts: updatedFavoritedPosts as any } : null,
      )
    }

    if (!userUpdateOk || !postUpdateOk) {
      console.error('Favorite toggle failed, rolling back UI.')
      setIsFavorited(currentlyFavorited)
      setCurrentFavoriteCount((prevCount) => (newFavoritedState ? prevCount - 1 : prevCount + 1))
      if (userUpdateOk && !postUpdateOk) {
        setCurrentUser((prevUser) =>
          prevUser ? { ...prevUser, favoritedPosts: originalFavoritedPosts as any } : null,
        )
      }
    }
    setIsUpdatingFavorite(false)
  }

  const handleToggleLike = async () => {
    if (!currentUser) {
      router.push('/login?redirect_to=' + encodeURIComponent(window.location.pathname))
      return
    }
    if (isUpdatingLike) return

    setIsUpdatingLike(true)
    const currentlyLiked = isLiked
    const newLikedState = !currentlyLiked
    setCurrentLikeCount((prevCount) => (newLikedState ? prevCount + 1 : prevCount - 1))
    setIsLiked(newLikedState)

    const originalLikedPosts =
      currentUser.likedPosts?.map((p) => (typeof p === 'string' ? p : p.id)) || []
    let updatedLikedPosts: string[]

    if (currentlyLiked) {
      updatedLikedPosts = originalLikedPosts.filter((id) => id !== post.id)
    } else {
      updatedLikedPosts = [...originalLikedPosts, post.id]
    }

    const { userUpdateOk, postUpdateOk } = await updateUserAndPostEngagement({
      userId: currentUser.id,
      postId: post.id,
      userEngagementField: 'likedPosts',
      updatedUserEngagementArray: updatedLikedPosts,
      postCountField: 'likes',
      newPostCount: newLikedState ? currentLikeCount + 1 : currentLikeCount - 1,
    })

    if (userUpdateOk) {
      setCurrentUser((prevUser) =>
        prevUser ? { ...prevUser, likedPosts: updatedLikedPosts as any } : null,
      )
    }

    if (!userUpdateOk || !postUpdateOk) {
      console.error('Like toggle failed, rolling back UI.')
      setIsLiked(currentlyLiked)
      setCurrentLikeCount((prevCount) => (newLikedState ? prevCount - 1 : prevCount + 1))
      if (userUpdateOk && !postUpdateOk) {
        setCurrentUser((prevUser) =>
          prevUser ? { ...prevUser, likedPosts: originalLikedPosts as any } : null,
        )
      }
    }
    setIsUpdatingLike(false)
  }

  const firstBlockIsCover = !!(
    post.layout &&
    post.layout.length > 0 &&
    post.layout[0].blockType?.toLowerCase() === 'cover'
  )

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <ArticleHeader post={post} currentUrl={currentUrl} />

      <article className="relative">
        {/* Article Content Container */}
        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto bg-white rounded-t-2xl -mt-2 sm:-mt-10 pt-6 sm:pt-10 pb-8 sm:pb-16 px-4 sm:px-8 md:px-12 shadow-sm relative z-10 article-content">
            {/* Audio Player Section */}
            {post.audioUrl && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Listen to this article:
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{post.name}</h4>
                    <p className="text-sm text-gray-600">Audio version of this article</p>
                  </div>
                  <AudioTrigger
                    track={
                      {
                        id: post.id,
                        title: post.name,
                        src: post.audioUrl,
                        articleSlug: post.slug,
                      } as AudioTrack
                    }
                    variant="button"
                    size="lg"
                    className="mx-auto"
                  >
                    🎧 Listen to Article
                  </AudioTrigger>
                  <p className="text-xs text-gray-500 mt-3">
                    Audio will continue playing as you browse other pages
                  </p>
                </div>
              </div>
            )}

            {/* Main Content - Render Blocks */}
            {post.layout && post.layout.length > 0 ? (
              post.layout.map((block, i) => {
                // Skip rendering the first block if it's a cover or image type,
                // as ArticleHeader will handle its display.
                if (i === 0) {
                  const blockType = block.blockType?.toLowerCase()
                  if (blockType === 'cover' || blockType === 'image') {
                    return null
                  }
                }

                const hideCoverBlockTextOverlay = i === 0 && firstBlockIsCover
                return (
                  <BlockRenderer
                    key={`${block.blockType}-${i}-${post.id}`}
                    block={block}
                    hideTextOverlay={hideCoverBlockTextOverlay}
                  />
                )
              })
            ) : (
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-gray-800">
                <p>This article doesn&apos;t have any content blocks yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Article Engagement & Navigation */}
        <div className="bg-gray-50 py-6 sm:py-8 md:py-12 mt-6 sm:mt-8 border-t border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {/* Engagement Section */}
              <div className="flex flex-wrap items-center justify-between gap-y-4 mb-6 sm:mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm hover:shadow transition-all border border-gray-200 disabled:opacity-50"
                    onClick={handleToggleLike}
                    disabled={isUpdatingLike || isLoadingUser}
                  >
                    {isUpdatingLike ? (
                      <Loader2 className="h-4 w-4 text-[#2aaac6] animate-spin" />
                    ) : (
                      <ThumbsUp
                        className={`h-4 w-4 ${isLiked ? 'text-blue-500 fill-blue-500' : 'text-[#2aaac6]'}`}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {isLiked ? 'Liked' : 'Like'} ({currentLikeCount})
                    </span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm hover:shadow transition-all border border-gray-200 disabled:opacity-50"
                    onClick={handleToggleFavorite}
                    disabled={isUpdatingFavorite || isLoadingUser}
                  >
                    {isUpdatingFavorite ? (
                      <Loader2 className="h-4 w-4 text-[#2aaac6] animate-spin" />
                    ) : (
                      <Bookmark
                        className={`h-4 w-4 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-[#2aaac6]'}`}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {isFavorited ? 'Saved' : 'Save'} ({currentFavoriteCount})
                    </span>
                  </button>

                  <div className="flex items-center">
                    <SharePopover
                      title={post.name}
                      url={currentUrl}
                      buttonVariant="outline"
                      buttonSize="default"
                      showLabel={true}
                      className="bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation options */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-8">
                <Link
                  href="/news"
                  className="px-6 py-3 bg-[#2aaac6] hover:bg-[#238ca3] transition-colors text-white font-medium rounded-lg text-center sm:text-left"
                >
                  More Articles
                </Link>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-white hover:bg-gray-50 transition-colors text-[#2aaac6] font-medium border border-gray-200 rounded-lg text-center sm:text-left"
                >
                  Back to Top
                </button>
              </div>

              {/* Related Articles Section */}
              {isLoadingRelated ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-[#2aaac6] animate-spin" />
                </div>
              ) : relatedPosts && relatedPosts.length > 0 ? (
                <RelatedArticles posts={relatedPosts} currentPostId={post.id} />
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
