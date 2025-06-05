'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }

    // Automatically verify the email using Payload's built-in endpoint
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/users/verify/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been successfully verified!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Email verification failed. Please try again.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while verifying your email. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-16 sm:pt-24">
      <div className="flex-grow flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 text-[#2aaac6] animate-spin" />
              )}
              {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
              {status === 'error' && <AlertCircle className="h-12 w-12 text-red-600" />}
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {status === 'success' && 'Your email has been confirmed successfully.'}
              {status === 'error' && 'There was an issue verifying your email.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              className={`p-4 rounded-md text-sm ${
                status === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : status === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message || 'Processing your verification...'}
            </div>

            {status !== 'loading' && (
              <div className="space-y-3">
                <Link href="/" className="block">
                  <Button className="w-full bg-[#2aaac6] hover:bg-[#238da1] text-white">
                    Go to Homepage
                  </Button>
                </Link>

                {status === 'success' && (
                  <Link href="/account" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Go to My Account
                    </Button>
                  </Link>
                )}

                {status === 'error' && (
                  <Link href="/register" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Back to Registration
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
