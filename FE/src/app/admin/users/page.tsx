'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { UsersManagement } from '@/components/admin/users'

export default function AdminUsersPage() {
  return (
    <ProtectedLayout>
      <UsersManagement />
    </ProtectedLayout>
  )
}
