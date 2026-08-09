'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { CapacityDashboard } from '@/components/capacity-dashboard'
import { useCapacityDashboard } from '@/hooks/useCapacityDashboard'

export default function CapacityPage() {
  // Defaults to the first lot from GET /api/parking-lots.
  const props = useCapacityDashboard()
  return (
    <ProtectedLayout>
      <CapacityDashboard {...props} />
    </ProtectedLayout>
  )
}
