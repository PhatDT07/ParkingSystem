'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { CreateAccount } from '@/components/accounts'

export default function AccountsPage() {
  return (
    <ProtectedLayout>
      <CreateAccount />
    </ProtectedLayout>
  )
}
