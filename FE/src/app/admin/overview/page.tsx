'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { SystemOverview } from '@/components/admin/system-overview'

export default function AdminOverviewPage() {
  return (
    <ProtectedLayout>
      <SystemOverview />
    </ProtectedLayout>
  )
}
