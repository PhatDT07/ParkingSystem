'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { SystemConfigManagement } from '@/components/admin/system-config'

export default function AdminSystemConfigPage() {
  return (
    <ProtectedLayout>
      <SystemConfigManagement />
    </ProtectedLayout>
  )
}
