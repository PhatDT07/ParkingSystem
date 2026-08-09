'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { Incidents } from '@/components/incidents'

export default function IncidentsPage() {
  return (
    <ProtectedLayout>
      <Incidents />
    </ProtectedLayout>
  )
}
