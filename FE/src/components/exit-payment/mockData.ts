import type { ExitPaymentProps } from './types'

export const MOCK_EXIT_SESSION: ExitPaymentProps = {
  sessionId: 'SESSION-001',
  licensePlate: '29A-123.45',
  entryTime: new Date(Date.now() - 4 * 60 * 60 * 1000 - 20 * 60 * 1000).toISOString(),
  totalFee: 45000,
  depositAlreadyPaid: 0,
  amountDue: 45000,
}
