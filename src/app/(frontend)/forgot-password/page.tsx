'use client'

import React, { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Fix: Add timeout mechanism and improved error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
        signal: controller.signal, // Add abort signal for timeout
      })

      clearTimeout(timeoutId) // Clear timeout if request completes

      // Fix: Check content-type before parsing JSON
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          console.error('Failed to parse response JSON:', parseError)
          throw new Error('Invalid response from server. Please try again.')
        }
      } else {
        // Non-JSON response, likely an error
        const textResponse = await response.text()
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Password reset instructions have been sent to your email address.',
        })
        setEmail('')
      } else {
        // Enhanced error message extraction
        let errorMessage = 'Failed to send reset email. Please try again.'

        if (data) {
          if (data.message) {
            errorMessage = data.message
          } else if (data.error) {
            errorMessage = data.error
          } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            errorMessage = data.errors[0].message || data.errors[0]
          }
        }

        // Provide specific error messages based on status codes
        if (response.status === 400) {
          errorMessage = data?.message || 'Please provide a valid email address.'
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.'
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.'
        }

        setMessage({
          type: 'error',
          text: errorMessage,
        })
      }
    } catch (error: any) {
      clearTimeout(timeoutId) // Clear timeout if error occurs

      console.error('Forgot password error:', error)

      let errorMessage = 'An unexpected error occurred. Please try again later.'

      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network and try again.'
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      clearTimeout(timeoutId) // Ensure timeout is always cleared
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 shadow-lg overflow-hidden">
          <CardHeader className="bg-white space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900 text-center">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-slate-500 text-center">
              Enter your email address and we&apos;ll send you reset instructions
            </CardDescription>
          </CardHeader>

          <CardContent className="bg-white pt-2 pb-8 px-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email-address" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {message && (
                <Alert
                  className={`${
                    message.type === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription
                    className={`${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#2aaac6] hover:bg-[#238da1] shadow-sm transition-colors text-sm"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Instructions...
                    </>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-[#2aaac6] hover:text-[#238da1]">
                  Sign in here
                </Link>
              </p>

              <Link
                href="/"
                className="inline-flex items-center text-sm text-slate-500 hover:text-[#2aaac6] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            For security reasons, reset links expire after 1 hour. If you don&apos;t receive an
            email, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  )
}
