'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { CheckIn } from '@/components/check-in/CheckIn'

export default function CheckInPage() {
  return (
    <ProtectedLayout>
      <CheckIn />
    </ProtectedLayout>
  )
}
