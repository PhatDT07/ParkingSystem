'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { ExitPayment } from '@/components/exit-payment'
import { MOCK_EXIT_SESSION } from '@/components/exit-payment'

function ExitPaymentContent() {
  const params = useSearchParams()
  const sessionId = params.get('sessionId') ?? MOCK_EXIT_SESSION.sessionId
  const licensePlate = params.get('licensePlate') ?? MOCK_EXIT_SESSION.licensePlate
  const entryTime = params.get('entryTime') ?? MOCK_EXIT_SESSION.entryTime
  const totalFee = Number(params.get('totalFee') ?? MOCK_EXIT_SESSION.totalFee)
  const depositAlreadyPaid = Number(params.get('depositAlreadyPaid') ?? 0)
  const amountDue = Number(params.get('amountDue') ?? totalFee)

  return (
    <ExitPayment
      sessionId={sessionId}
      licensePlate={licensePlate}
      entryTime={entryTime}
      totalFee={totalFee}
      depositAlreadyPaid={depositAlreadyPaid}
      amountDue={amountDue}
    />
  )
}

export default function ExitPaymentPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<div className="py-16 text-center text-sm text-gray-500">Đang tải...</div>}>
        <ExitPaymentContent />
      </Suspense>
    </ProtectedLayout>
  )
}
