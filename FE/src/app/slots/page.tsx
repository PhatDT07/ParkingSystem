'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { SlotMap } from '@/components/slot-map'

export default function SlotsPage() {
  return (
    <ProtectedLayout>
      <SlotMap />
    </ProtectedLayout>
  )
}
