'use client'

import React from 'react'
import { User as PayloadUser } from '@/payload-types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { BellIcon, Fingerprint, Lock, LogOut } from 'lucide-react'

interface UserSettingsProps {
  user: PayloadUser
}

export const UserSettings: React.FC<UserSettingsProps> = ({ user }) => {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for Payload authentication
      })

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      // Redirect to home page or login page after logout
      window.location.href = '/'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during logout')
    }
  }

  // Placeholder for notification settings
  const handleNotificationToggle = (enabled: boolean) => {
    toast.info(
      `Notifications ${enabled ? 'enabled' : 'disabled'}. This setting is not yet functional.`,
    )
  }

  // Placeholder for password change
  const handlePasswordChange = () => {
    toast.info('Password change functionality is not yet implemented.')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start">
            <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                Notification Settings
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="email-notifications"
                    className="text-xs sm:text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    defaultChecked={true}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="marketing-emails"
                    className="text-xs sm:text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Marketing Emails
                  </Label>
                  <Switch
                    id="marketing-emails"
                    defaultChecked={false}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>

                <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                  Manage what types of notifications you receive about content, updates, and news.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                Security
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  onClick={handlePasswordChange}
                >
                  <Fingerprint className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Change Password
                </Button>

                <p className="text-xs text-slate-500">
                  Keep your account secure by using a strong password that you don&apos;t use on
                  other sites.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm md:col-span-2">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
            Account Actions
          </h3>

          <div className="space-y-3 sm:space-y-4">
            <Button
              variant="outline"
              className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs sm:text-sm h-8 sm:h-9"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Sign Out
            </Button>

            <p className="text-xs text-slate-500">
              This will log you out of your account on this device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
