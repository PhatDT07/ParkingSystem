'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { CheckoutApprovals } from '@/components/checkout-approvals'

export default function CheckoutApprovalsPage() {
  return (
    <ProtectedLayout>
      <CheckoutApprovals />
    </ProtectedLayout>
  )
}
