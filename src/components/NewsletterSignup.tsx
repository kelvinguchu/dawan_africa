'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface NewsletterSignupProps {
  className?: string
  title?: string
  description?: string
  showNameFields?: boolean
  source?: string
  onSuccess?: (data: any) => void
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  className = '',
  title = 'Subscribe to our Newsletter',
  description = 'Get the latest updates and insights delivered directly to your inbox.',
  showNameFields = true,
  source = 'website',
  onSuccess,
}) => {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

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
          lastName: lastName.trim(),
          source,
        }),
      })

      // Fix: Check response status and content-type before calling response.json()
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
        data = { message: 'Successfully subscribed to newsletter!' }
      } else if (contentType && contentType.includes('application/json')) {
        // Parse JSON response
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError)
          // Fallback for invalid JSON in successful response
          data = { message: 'Successfully subscribed to newsletter!' }
        }
      } else {
        // Non-JSON successful response - treat as success
        console.warn('Successful response is not JSON format')
        data = { message: 'Successfully subscribed to newsletter!' }
      }

      // Check if user was already subscribed
      const isAlreadySubscribed = data.message?.includes('already subscribed')

      setMessage({
        type: isAlreadySubscribed ? 'info' : 'success',
        text: data.message || 'Successfully subscribed to newsletter!',
      })

      // Only reset form if it's a new subscription, not if already subscribed
      if (!isAlreadySubscribed) {
        setEmail('')
        setFirstName('')
        setLastName('')
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data)
      }
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

  return (
    <div className={`newsletter-signup ${className}`}>
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showNameFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe to Newsletter'
            )}
          </Button>
        </form>

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
            ) : (
              <AlertCircle
                className={`h-4 w-4 ${message.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}
              />
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

        <p className="text-xs text-muted-foreground text-center">
          By subscribing, you agree to receive marketing emails from us. You can unsubscribe at any
          time.
        </p>
      </div>
    </div>
  )
}

export default NewsletterSignup
