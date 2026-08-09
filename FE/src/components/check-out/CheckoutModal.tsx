'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExitPayment } from '@/components/exit-payment'
import type { ParkingSession } from '@/types/model'

interface CheckoutModalProps {
  readonly session: ParkingSession | null
  readonly onClose: () => void
}

/**
 * Modal check-out thủ công cho một phiên đã chọn trong danh sách (demo: không có camera
 * quét biển số nên Staff tự chọn xe). Tái sử dụng luồng ExitPayment (phí động + QR PayOS
 * thật + xác nhận mở barie). Đóng modal khi bấm ra ngoài / nút X.
 */
export function CheckoutModal({ session, onClose }: CheckoutModalProps) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-out thủ công — {session?.licensePlate}</DialogTitle>
          <DialogDescription>
            Tính phí động theo thời gian đỗ, tạo QR PayOS để khách quét, rồi xác nhận mở barie.
          </DialogDescription>
        </DialogHeader>

        {session && (
          <ExitPayment
            key={session.sessionId}
            sessionId={session.sessionId}
            licensePlate={session.licensePlate}
            entryTime={session.entryTime}
            totalFee={session.totalFee ?? 0}
            depositAlreadyPaid={session.depositAlreadyPaid ?? 0}
            amountDue={session.amountDue ?? session.totalFee ?? 0}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
