'use client'

import React, { useState, useEffect } from 'react'
import { User as PayloadUser } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

interface UserProfileProps {
  user: PayloadUser
  onUpdate: (updatedUser: PayloadUser) => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name ?? '')
  const [isSavingName, setIsSavingName] = useState(false)

  // Update name state if user prop changes
  useEffect(() => {
    setName(user.name ?? '')
  }, [user])

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingName(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.[0]?.message ?? 'Failed to update name')
      }
      const updatedUser = await response.json()
      toast.success('Name updated successfully!')
      onUpdate(updatedUser.doc as PayloadUser)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      toast.info('Resend verification email functionality is not yet implemented.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resend email.')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
            Personal Information
          </h3>
          <form onSubmit={handleNameSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your full name"
                disabled={isSavingName}
                className="bg-white border-slate-200 focus:border-[#2aaac6] focus:ring-[#2aaac6]/10 text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
              />
              <p className="text-xs text-slate-500">Your email address cannot be changed.</p>
            </div>

            <div className="pt-1 sm:pt-2">
              <Button
                type="submit"
                disabled={isSavingName || name === (user.name ?? '')}
                className="bg-[#2aaac6] hover:bg-[#238da1] shadow-sm transition-colors w-full sm:w-auto text-sm"
              >
                {isSavingName ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
            Account Status
          </h3>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="mt-0.5">
                <ShieldCheck
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${user.isEmailVerified ? 'text-green-500' : 'text-amber-500'}`}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="text-sm font-medium text-slate-700 mr-0">Email Verification</h4>
                  {user.isEmailVerified ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 hover:bg-green-100 shadow-sm text-xs"
                    >
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 shadow-sm text-xs"
                    >
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user.isEmailVerified
                    ? 'Your email has been verified.'
                    : 'Please verify your email address to unlock all features.'}
                </p>
                {!user.isEmailVerified && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-[#2aaac6] hover:text-[#238da1] mt-1"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 sm:pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Subscription Tier</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Your current account access level</p>
                </div>
                <Badge
                  variant="outline"
                  className="capitalize bg-slate-50 text-slate-600 border-slate-200 shadow-sm text-xs"
                >
                  {user.subscriptionTier || 'Free'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
