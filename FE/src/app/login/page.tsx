'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { LoginPage } from '@/components/auth/LoginPage'
import { roleHome } from '@/lib/roles'

export default function Login() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      // Route to the role's home (Manager/Staff → console, Driver → driver area, Admin → console).
      const role = useAuthStore.getState().user?.role ?? 'Staff'
      router.push(roleHome[role])
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return <LoginPage onLogin={handleLogin} />
}
