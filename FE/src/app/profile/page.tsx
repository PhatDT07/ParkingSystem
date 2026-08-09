'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { DriverProfileForm } from '@/components/driver-profile'

/**
 * Trang hồ sơ tài xế — độc lập, không dùng ProtectedLayout vì Driver không có
 * quyền vào các route nội bộ (xem src/lib/roles.ts). Chỉ yêu cầu đã đăng nhập;
 * dữ liệu đến từ GET/PUT /driver/profile (JWT xác định người dùng).
 */
export default function ProfilePage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Đang tải…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <DriverProfileForm />
    </div>
  )
}
