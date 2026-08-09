'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { RbacManagement } from '@/components/admin/rbac'

export default function AdminRbacPage() {
  return (
    <ProtectedLayout>
      <RbacManagement />
    </ProtectedLayout>
  )
}
