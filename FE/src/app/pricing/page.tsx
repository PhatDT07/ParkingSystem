'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { PricingManagement } from '@/components/pricing'

export default function PricingPage() {
  return (
    <ProtectedLayout>
      <PricingManagement />
    </ProtectedLayout>
  )
}
