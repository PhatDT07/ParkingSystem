'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { AuditLogs } from '@/components/admin/audit-logs'

export default function AdminAuditLogsPage() {
  return (
    <ProtectedLayout>
      <AuditLogs />
    </ProtectedLayout>
  )
}
