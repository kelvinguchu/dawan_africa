'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Invalid or missing reset token. Please request a new password reset.',
      })
    }
  }, [token])

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setMessage({
        type: 'error',
        text: 'Invalid reset token. Please request a new password reset.',
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.',
      })
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage({
        type: 'error',
        text: passwordError,
      })
      return
    }

    setIsLoading(true)
    setMessage(null)

    // Fix: Add timeout mechanism and improved error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
        signal: controller.signal, // Add abort signal for timeout
      })

      clearTimeout(timeoutId) // Clear timeout if request completes

      // Parse response with proper error handling
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        throw new Error('Invalid response from server. Please try again.')
      }

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Your password has been successfully reset. Redirecting to login...',
        })

        // Redirect to login after success
        setTimeout(() => {
          router.push('/login?message=Password reset successful')
        }, 2000)
      } else {
        // Enhanced error message extraction
        let errorMessage = 'Failed to reset password. Please try again.'

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
          errorMessage = data?.message || 'Invalid request. Please check your input and try again.'
        } else if (response.status === 401) {
          errorMessage = 'Invalid or expired reset token. Please request a new password reset.'
        } else if (response.status === 404) {
          errorMessage = 'Reset token not found. Please request a new password reset.'
        } else if (response.status === 429) {
          errorMessage = 'Too many attempts. Please wait a few minutes before trying again.'
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

      console.error('Reset password error:', error)

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
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-500 text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent className="bg-white pt-2 pb-8 px-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="pl-10 pr-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || !token}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="pl-10 pr-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || !token}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Password Requirements:</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`}
                    />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])/.test(password) ? 'bg-green-500' : 'bg-slate-300'}`}
                    />
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(password) ? 'bg-green-500' : 'bg-slate-300'}`}
                    />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(password) ? 'bg-green-500' : 'bg-slate-300'}`}
                    />
                    One number
                  </li>
                </ul>
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
                  disabled={isLoading || !token || !password || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
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
            After successfully resetting your password, you&apos;ll be redirected to the login page.
          </p>
        </div>
      </div>
    </div>
  )
}
