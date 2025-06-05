'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface NewsletterPopupProps {
  delay?: number
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ delay = 5000 }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  useEffect(() => {
    // Fix: Safely check localStorage with try/catch to handle Safari private mode and disabled storage
    let hasSeenPopup = false

    try {
      hasSeenPopup = localStorage.getItem('newsletter-popup-seen') === 'true'
    } catch (error) {
      // localStorage is not available (Safari private mode, disabled storage, etc.)
      // Default to false so popup will show
      console.warn('localStorage access failed:', error)
      hasSeenPopup = false
    }

    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [delay])

  const handleClose = () => {
    setIsOpen(false)

    // Fix: Safely set localStorage with try/catch to handle Safari private mode and disabled storage
    try {
      localStorage.setItem('newsletter-popup-seen', 'true')
    } catch (error) {
      // localStorage is not available (Safari private mode, disabled storage, etc.)
      // Component continues to work, but popup may show again on next visit
      console.warn('localStorage write failed:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          source: 'popup',
        }),
      })

      // Check if response status is valid before attempting to parse JSON
      if (!response.ok) {
        // Handle non-2xx status codes properly
        let errorMessage = 'Failed to subscribe. Please try again.'

        // Try to parse error response, but handle cases where it might not be JSON
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // Non-JSON error response - use status text or default message
            errorMessage = response.statusText || errorMessage
          }
        } catch {
          // If JSON parsing fails, use default error message
          console.warn('Failed to parse error response as JSON')
        }

        setMessage({
          type: 'error',
          text: errorMessage,
        })
        return
      }

      // Handle successful responses (2xx status codes)
      let data: any = {}

      // Check if response has content and is JSON before parsing
      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')

      // Handle empty responses (204, 205) or responses without content
      if (response.status === 204 || response.status === 205 || contentLength === '0') {
        // Success response with no content
        data = { message: 'Successfully subscribed!' }
      } else if (contentType && contentType.includes('application/json')) {
        // Parse JSON response
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError)
          // Fallback for invalid JSON in successful response
          data = { message: 'Successfully subscribed!' }
        }
      } else {
        // Non-JSON successful response - treat as success
        console.warn('Successful response is not JSON format')
        data = { message: 'Successfully subscribed!' }
      }

      // Process successful subscription
      const isAlreadySubscribed = data.message?.includes('already subscribed')

      setMessage({
        type: isAlreadySubscribed ? 'info' : 'success',
        text: isAlreadySubscribed
          ? data.message
          : data.message || 'Successfully subscribed! Welcome to our community.',
      })

      // Only reset form if it's a new subscription, not if already subscribed
      if (!isAlreadySubscribed) {
        setEmail('')
        setFirstName('')
      }

      // Close popup after 2 seconds on success or info
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Dialog is being closed - call handleClose to set localStorage flag
      handleClose()
    }
    // If open is true, we don't need to do anything as opening is controlled elsewhere
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg border-0 p-0 overflow-hidden mx-4 w-[calc(100vw-2rem)]">
        {/* Header with logo and close button */}
        <div className="relative bg-slate-900 p-6 sm:p-8 text-white">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 text-white hover:bg-white/20 h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center pr-8">
            <div className="mb-6">
              <Image
                src="/dark-mode-logo.png"
                alt="Dawan Africa"
                width={140}
                height={42}
                className="mx-auto"
                priority
              />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl text-center sm:text-2xl font-bold text-white mb-3">
                Stay Informed with African News
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="popup-firstName" className="text-sm font-medium text-slate-700">
                First Name (Optional)
              </Label>
              <Input
                id="popup-firstName"
                type="text"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                className="h-11 border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup-email" className="text-sm font-medium text-slate-700">
                Email Address *
              </Label>
              <div className="relative">
                <Input
                  id="popup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 pl-11 border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/20"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {message && (
              <Alert
                className={`${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50'
                    : message.type === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                )}
                <AlertDescription
                  className={`${
                    message.type === 'success'
                      ? 'text-green-800'
                      : message.type === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                  }`}
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                type="submit"
                className="flex-1 h-11 bg-[#2aaac6] hover:bg-[#1e90a6] text-white font-medium"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe to Newsletter'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Join thousands of readers staying informed about African news. You can unsubscribe at
              any time.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewsletterPopup
