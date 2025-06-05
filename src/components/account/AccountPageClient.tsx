'use client'

import React, { useCallback, useEffect, useState, Suspense, JSX } from 'react'
import { useRouter } from 'next/navigation'
import type { User as PayloadUser } from '@/payload-types'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { UserBio } from '@/components/account/UserBio'
import { UserProfile } from '@/components/account/UserProfile'
import { UserPosts } from '@/components/account/UserPosts'
import { UserSettings } from '@/components/account/UserSettings'

////////////////////////////////////////////////////////////////////////////////
// Types & helpers
////////////////////////////////////////////////////////////////////////////////

type FetchState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; user: PayloadUser }

const INITIAL_STATE: FetchState = { status: 'loading' }

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

export default function AccountPageClient(): JSX.Element {
  const [state, setState] = useState<FetchState>(INITIAL_STATE)
  const router = useRouter()

  //---------------------------------------------------------------------------
  // fetchUser — memoised so that it is stable across renders
  //---------------------------------------------------------------------------
  const fetchUser = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/users/me?depth=2', {
        cache: 'no-store',
        credentials: 'include', // Important for Payload authentication
      })
      const json = await res.json()

      if (res.ok && json?.user) {
        setState({ status: 'success', user: json.user as PayloadUser })
      } else {
        setState({ status: 'error' })
      }
    } catch (err) {
      console.error('Failed to fetch user', err)
      setState({ status: 'error' })
    }
  }, [])

  //---------------------------------------------------------------------------
  // Kick-off fetch on mount
  //---------------------------------------------------------------------------
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  //---------------------------------------------------------------------------
  // Redirect unauthenticated users once we know there is an error
  //---------------------------------------------------------------------------
  useEffect(() => {
    if (state.status === 'error') router.push('/login?redirect=/account')
  }, [state.status, router])

  //---------------------------------------------------------------------------
  // Local helpers
  //---------------------------------------------------------------------------
  const handleUserUpdate = (updated: PayloadUser): void => {
    setState({ status: 'success', user: updated })
  }

  const tabFallback = (
    <div className="pt-4">
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  )

  //////////////////////////////////////////////////////////////////////
  // Render phases
  //////////////////////////////////////////////////////////////////////

  if (state.status === 'loading') {
    return (
      <div className="bg-white min-h-screen py-6">
        <div className="container mx-auto max-w-6xl px-4">
          {/* simplified skeleton while data loads */}
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-64 rounded-md" />
            <Skeleton className="h-64 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  // At this point we either have user data or are redirecting.
  if (state.status !== 'success') {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <p className="text-slate-600 text-sm">Redirecting to login&nbsp;…</p>
      </div>
    )
  }

  const { user } = state

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <UserBio user={user} onUpdate={handleUserUpdate} />

        {/* Email Verification Status */}
        {!user.isEmailVerified && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">Email Verification Required</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Please verify your email address to access all features. Check your inbox for a
                  verification link.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Tabs defaultValue="profile" className="w-full">
            {/* ─ Tabs header ─ */}
            <TabsList className="bg-white border border-slate-200 rounded-md p-1 mb-4 max-w-full overflow-x-auto md:overflow-visible">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-800 text-sm whitespace-nowrap"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-800 text-sm whitespace-nowrap"
              >
                Content
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-800 text-sm whitespace-nowrap"
              >
                Account
              </TabsTrigger>
            </TabsList>

            {/* ─ Tab panes ─ */}
            <TabsContent value="profile" className="mt-0">
              <Suspense fallback={tabFallback}>
                <UserProfile user={user} onUpdate={handleUserUpdate} />
              </Suspense>
            </TabsContent>

            <TabsContent value="posts" className="mt-0">
              <Suspense fallback={tabFallback}>
                <UserPosts user={user} />
              </Suspense>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Suspense fallback={tabFallback}>
                <UserSettings user={user} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
