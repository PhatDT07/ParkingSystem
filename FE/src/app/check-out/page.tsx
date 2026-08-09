'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { CheckOut } from '@/components/check-out/CheckOut'

export default function CheckOutPage() {
  return (
    <ProtectedLayout>
      <CheckOut />
    </ProtectedLayout>
  )
}
