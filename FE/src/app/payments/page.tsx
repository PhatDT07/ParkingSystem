'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { Payments } from '@/components/payments'

export default function PaymentsPage() {
  return (
    <ProtectedLayout>
      <Payments />
    </ProtectedLayout>
  )
}
