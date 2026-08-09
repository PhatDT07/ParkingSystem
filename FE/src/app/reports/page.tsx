'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { Reports } from '@/components/reports'

export default function ReportsPage() {
  return (
    <ProtectedLayout>
      <Reports />
    </ProtectedLayout>
  )
}
