'use client'

import { sendGAEvent } from '@next/third-parties/google'

// Define types for better type safety
type GAEventParameters = {
  [key: string]: string | number | boolean | undefined
}

type AudioAction = 'play' | 'pause' | 'stop' | 'seek' | 'ended' | 'loaded'
type AuthAction = 'login' | 'logout' | 'register' | 'login_attempt'
type SharePlatform = 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'copy_link'

// Track page views
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  try {
    sendGAEvent('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

// Track user interactions
export const trackEvent = (eventName: string, parameters?: GAEventParameters): void => {
  try {
    sendGAEvent('event', eventName, parameters || {})
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

// Track article/news views
export const trackArticleView = (
  articleId: string,
  articleTitle: string,
  category?: string,
): void => {
  try {
    sendGAEvent('event', 'view_item', {
      item_id: articleId,
      item_name: articleTitle,
      item_category: category,
      content_type: 'article',
    })
  } catch (error) {
    console.error('Error tracking article view:', error)
  }
}

// Track audio player interactions
export const trackAudioEvent = (
  action: AudioAction,
  audioTitle: string,
  audioId?: string,
  duration?: number,
): void => {
  try {
    sendGAEvent('event', 'audio_interaction', {
      action,
      audio_title: audioTitle,
      audio_id: audioId,
      duration,
      content_type: 'audio',
    })
  } catch (error) {
    console.error('Error tracking audio event:', error)
  }
}

// Track user authentication events
export const trackAuthEvent = (action: AuthAction): void => {
  try {
    sendGAEvent('event', action, {
      method: 'email', // Default method, can be overridden
    })
  } catch (error) {
    console.error('Error tracking auth event:', error)
  }
}

// Track search events
export const trackSearch = (searchQuery: string, resultCount?: number): void => {
  try {
    sendGAEvent('event', 'search', {
      search_term: searchQuery,
      ...(resultCount !== undefined && { search_results: resultCount }),
    })
  } catch (error) {
    console.error('Error tracking search:', error)
  }
}

// Track navigation events
export const trackNavigation = (destination: string, source?: string): void => {
  try {
    sendGAEvent('event', 'select_content', {
      content_type: 'navigation',
      item_id: destination,
      ...(source && { source }),
    })
  } catch (error) {
    console.error('Error tracking navigation:', error)
  }
}

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean): void => {
  try {
    const eventName = success ? 'form_submit' : 'form_error'
    sendGAEvent('event', eventName, {
      form_name: formName,
      success,
    })
  } catch (error) {
    console.error('Error tracking form submission:', error)
  }
}

// Track downloads
export const trackDownload = (fileName: string, fileType: string): void => {
  try {
    sendGAEvent('event', 'file_download', {
      file_name: fileName,
      file_extension: fileType,
      link_url: fileName, // Assuming fileName includes the full path
    })
  } catch (error) {
    console.error('Error tracking download:', error)
  }
}

// Track social media shares
export const trackShare = (
  platform: SharePlatform,
  contentId: string,
  contentType: string,
): void => {
  try {
    sendGAEvent('event', 'share', {
      method: platform,
      content_type: contentType,
      item_id: contentId,
    })
  } catch (error) {
    console.error('Error tracking share:', error)
  }
}

// Track video interactions (if you have video content)
export const trackVideoEvent = (
  action: 'play' | 'pause' | 'complete' | 'progress',
  videoTitle: string,
  videoId?: string,
  progress?: number,
): void => {
  try {
    sendGAEvent('event', 'video_interaction', {
      action,
      video_title: videoTitle,
      video_id: videoId,
      ...(progress !== undefined && { video_progress: progress }),
    })
  } catch (error) {
    console.error('Error tracking video event:', error)
  }
}

// Track user engagement
export const trackEngagement = (
  engagementType: 'scroll' | 'time_on_page' | 'click' | 'hover',
  value?: number,
  target?: string,
): void => {
  try {
    sendGAEvent('event', 'user_engagement', {
      engagement_type: engagementType,
      ...(value !== undefined && { value }),
      ...(target && { target }),
    })
  } catch (error) {
    console.error('Error tracking engagement:', error)
  }
}

// Example component showing how to use these functions
export function AnalyticsEventExample() {
  const handleButtonClick = () => {
    trackEvent('button_clicked', {
      button_name: 'example_button',
      page_section: 'header',
    })
  }

  const handleArticleClick = () => {
    trackArticleView('article-123', 'Sample Article Title', 'News')
  }

  const handleAudioPlay = () => {
    trackAudioEvent('play', 'Sample Audio Track', 'audio-456', 180)
  }

  return (
    <div>
      <button onClick={handleButtonClick}>Track Event</button>
      <button onClick={handleArticleClick}>Track Article View</button>
      <button onClick={handleAudioPlay}>Track Audio Play</button>
    </div>
  )
}
