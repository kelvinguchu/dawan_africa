'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Mail, KeyRound } from 'lucide-react'
// import { useAuth } from '@/hooks/useAuth' // Or direct API call logic

export const RegisterForm: React.FC = () => {
  const router = useRouter()
  // const { register, isLoading, error } = useAuth() // Or local state for loading/error
  const [isLoading, setIsLoading] = useState(false) // Local loading state for now
  const [error, setError] = useState<string | null>(null) // Local error state for now

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(true) // Default to checked

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Register user account
      const response = await fetch('/api/users', {
        // POST to /api/users for registration
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const userData = await response.json()

        // Step 2: Subscribe to newsletter if checked (handle silently if already subscribed)
        if (subscribeToNewsletter) {
          try {
            // Fix: Improved first name extraction with proper edge case handling
            const extractFirstName = (fullName: string): string => {
              const trimmedName = fullName.trim()

              // Handle empty or whitespace-only names
              if (!trimmedName) {
                return 'Subscriber' // Default fallback for empty names
              }

              // Split by spaces and filter out empty strings (handles multiple spaces)
              const nameParts = trimmedName.split(/\s+/).filter((part) => part.length > 0)

              // Return first part if available, otherwise the full trimmed name
              return nameParts.length > 0 ? nameParts[0] : trimmedName
            }

            await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email.trim(),
                firstName: extractFirstName(name),
                source: 'registration',
              }),
            })
            // Don't check response - handle silently whether successful, failed, or already subscribed
          } catch (newsletterError) {
            // Newsletter subscription error - log but don't fail registration
            console.log('Newsletter subscription error during registration:', newsletterError)
          }
        }

        // Show success message and redirect to login with email verification notice
        router.push('/login?registered=true&verify_email=true')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 sm:px-0">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold text-slate-900 text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-500 text-center">
            Enter your details to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white pt-2 pb-8 px-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="pl-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email-address-register"
                className="text-sm font-medium text-slate-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email-address-register"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password-register" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <Input
                  id="password-register"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                Confirm Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10 bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 py-3">
              <Checkbox
                id="newsletter-subscribe"
                checked={subscribeToNewsletter}
                onCheckedChange={(checked) => setSubscribeToNewsletter(checked as boolean)}
                className="border-slate-300 data-[state=checked]:bg-[#2aaac6] data-[state=checked]:border-[#2aaac6]"
              />
              <Label
                htmlFor="newsletter-subscribe"
                className="text-sm text-slate-600 font-normal cursor-pointer leading-5"
              >
                Subscribe to our newsletter for the latest African news
              </Label>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#2aaac6] hover:bg-[#238da1] shadow-sm transition-colors text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#2aaac6] hover:text-[#238da1]">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
