'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { QuotaManagement } from '@/components/quota-management'

export default function QuotaPage() {
  return (
    <ProtectedLayout>
      <QuotaManagement />
    </ProtectedLayout>
  )
}
