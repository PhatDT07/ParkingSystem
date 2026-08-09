'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useProfile, useUpdateProfile, type DriverProfile } from '@/hooks/useProfile'

interface ProfileFieldsProps {
  readonly profile: DriverProfile
}

/** Form fields — remounted (via `key`) by the parent when the profile loads, so local state starts fresh. */
function ProfileFields({ profile }: ProfileFieldsProps) {
  const { mutate, isPending } = useUpdateProfile()

  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '')
  const [email, setEmail] = useState(profile.email ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return
    mutate({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
    })
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Hồ sơ của tôi</CardTitle>
        <CardDescription>Tài khoản: {profile.username} · Vai trò: {profile.roleName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !fullName.trim()}>
            {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** Form hồ sơ tài xế — GET/PUT /driver/profile. */
export function DriverProfileForm() {
  const { data: profile, isLoading, isError } = useProfile()

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Đang tải hồ sơ…</p>
  }

  if (isError || !profile) {
    return <p className="p-6 text-sm text-red-600">Không thể tải hồ sơ. Vui lòng thử lại sau.</p>
  }

  return <ProfileFields key={profile.username} profile={profile} />
}
