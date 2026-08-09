'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { ActiveSessions } from '@/components/active-sessions'

export default function SessionsPage() {
  return (
    <ProtectedLayout>
      <ActiveSessions />
    </ProtectedLayout>
  )
}
