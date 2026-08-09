'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { roleHome } from '@/lib/roles'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleHome[user.role])
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Đang chuyển hướng...</h1>
      </div>
    </main>
  )
}
