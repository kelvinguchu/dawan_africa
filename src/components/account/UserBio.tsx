'use client'

import React, { useState, useRef } from 'react'
import { User as PayloadUser, Media } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { UploadCloud, Mail, Calendar } from 'lucide-react'

interface UserBioProps {
  user: PayloadUser
  onUpdate: (updatedUser: PayloadUser) => void
}

// Helper to get initials from name or email
const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.split(' ')
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'U' // Default fallback
}

export const UserBio: React.FC<UserBioProps> = ({ user, onUpdate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handlePictureUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file first.')
      return
    }
    setIsUploadingPicture(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      // Step 1: Upload image to media collection
      const mediaResponse = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include', // Important for Payload authentication
        body: formData,
        // No 'Content-Type' header for FormData, browser sets it with boundary
      })

      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json()
        throw new Error(errorData.errors?.[0]?.message ?? 'Failed to upload image')
      }
      const newMedia = (await mediaResponse.json()).doc as Media

      // Step 2: Update user with new profile picture ID
      const userUpdateResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for Payload authentication
        body: JSON.stringify({ profilePicture: newMedia.id }),
      })

      if (!userUpdateResponse.ok) {
        const errorData = await userUpdateResponse.json()
        // Attempt to delete the orphaned media if user update fails
        await fetch(`/api/media/${newMedia.id}`, {
          method: 'DELETE',
          credentials: 'include', // Important for Payload authentication
        })
        throw new Error(errorData.errors?.[0]?.message ?? 'Failed to update profile picture')
      }

      const updatedUser = await userUpdateResponse.json()
      toast.success('Profile picture updated successfully!')
      onUpdate(updatedUser.doc as PayloadUser)
      setSelectedFile(null) // Clear selection
      setPreviewUrl(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsUploadingPicture(false)
    }
  }

  let currentProfilePicUrl: string | undefined = previewUrl ?? undefined
  if (
    !previewUrl &&
    user.profilePicture &&
    typeof user.profilePicture === 'object' &&
    user.profilePicture.url
  ) {
    currentProfilePicUrl = user.profilePicture.url
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#2aaac6]/10 to-slate-100 h-24 sm:h-32"></div>
      <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="-mt-10 sm:-mt-12 mb-2 sm:mb-3 relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-md">
              <AvatarImage
                src={currentProfilePicUrl}
                alt={user.name ?? 'User profile picture'}
                className="object-cover"
              />
              <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png, image/jpeg, image/gif, image/webp"
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {user.name || user.email?.split('@')[0]}
            </h1>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-2">
              <div className="flex items-center text-xs sm:text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-slate-500">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Member since {joinDate}</span>
              </div>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture}
              className="text-xs sm:text-sm shadow-sm w-full sm:w-auto"
            >
              <UploadCloud className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Change Photo
            </Button>
            {selectedFile && (
              <Button
                type="button"
                size="sm"
                onClick={handlePictureUpload}
                disabled={isUploadingPicture || !previewUrl}
                className="bg-[#2aaac6] hover:bg-[#238da1] text-xs sm:text-sm shadow-sm w-full sm:w-auto"
              >
                {isUploadingPicture ? 'Uploading...' : 'Upload'}
              </Button>
            )}
          </div>
        </div>

        {previewUrl && (
          <p className="text-xs text-slate-500 mt-2">
            Click &apos;Upload&apos; to save your new profile picture.
          </p>
        )}
      </div>
    </div>
  )
}
