'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, calculateDuration } from '@/lib/utils'
import { usePayParking } from '@/hooks/usePayParking'
import { useLiveAmountDue } from '@/hooks/useSessions'
import type { AppError } from '@/lib/api'
import { FeeBreakdown } from './FeeBreakdown'
import { PaymentQrPanel } from './PaymentQrPanel'
import type { ExitPaymentProps, FeeBreakdownLine, PaymentMethod } from './types'

function computeBreakdown(entryTime: string, totalFee: number): FeeBreakdownLine[] {
  const entry = new Date(entryTime)
  const now = new Date()
  const totalMinutes = Math.max(0, Math.floor((now.getTime() - entry.getTime()) / 60000))
  const totalHours = Math.ceil(totalMinutes / 60)

  // Aligning with BE formula: Base + (ExtraHour × hours)
  // Since BE returns the final totalFee, we display a simplified breakdown
  // rather than re-computing the exact split which caused FE/BE drift.
  return [
    {
      label: 'Phí đỗ xe (Theo chính sách giá)',
      hours: totalHours,
      ratePerHour: 0, // Hidden in UI if 0
      subtotal: totalFee,
    },
  ]
}

export function ExitPayment({
  sessionId,
  licensePlate,
  entryTime,
  totalFee,
  depositAlreadyPaid = 0,
  amountDue,
}: ExitPaymentProps) {
  const [method, setMethod] = useState<PaymentMethod>('QR')
  const [success, setSuccess] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [paidAmount, setPaidAmount] = useState(amountDue)
  const [isOverstay, setIsOverstay] = useState(false)
  // So tien thuc phai thu (da tru coc) — KHONG dung totalFee (gop) de tranh bat khach tra du
  // phan da coc, xem ActiveSessionDto.amountDue o BE.
  const [collectedAmount, setCollectedAmount] = useState(amountDue)
  const [discountReason, setDiscountReason] = useState('')
  const [requireDiscountReason, setRequireDiscountReason] = useState(false)

  const { mutate, isPending } = usePayParking()

  const durationMinutes = calculateDuration(entryTime)
  const breakdown = computeBreakdown(entryTime, totalFee)

  const handleConfirm = useCallback(
    (auto = false) => {
      // Check-out thật theo biển số; BE trả về số tiền đã tính để hiển thị biên nhận.
      // Cash: gửi kèm collectedAmount — nếu lệch quá cashToleranceVnd, BE báo CASH_AMOUNT_MISMATCH
      // (chưa có discountReason) hoặc trả pendingApproval=true (đã có discountReason, chờ Manager duyệt).
      mutate(
        {
          licensePlate,
          paymentMethod: method,
          collectedAmount: method === 'Cash' ? collectedAmount : undefined,
          discountReason: method === 'Cash' && requireDiscountReason ? discountReason : undefined,
        },
        {
          onSuccess: (res) => {
            setPaidAmount(res.amount ?? amountDue)
            setIsOverstay(res.isOverstay)
            if (res.pendingApproval) {
              setPendingApproval(true)
            } else {
              setSuccess(true)
            }
          },
          onError: (err) => {
            const appErr = err as AppError
            if (appErr.code === 'CASH_AMOUNT_MISMATCH') {
              setRequireDiscountReason(true)
            } else if (!auto) {
              // Truoc day loi khac CASH_AMOUNT_MISMATCH bi "nuot" — nut khong lam gi ca, khien
              // Staff tuong nhu khong hoat dong. Luon hien thong bao ro rang cho MOI loi khac.
              // Khi auto-confirm (poll QR) that bai thi khong hien loi tho — cu de Staff bam tay,
              // vong poll tiep theo se tu thu lai.
              toast.error(appErr.message || 'Check-out thất bại, vui lòng thử lại.')
            }
          },
        },
      )
    },
    [mutate, licensePlate, method, collectedAmount, requireDiscountReason, discountReason, amountDue],
  )

  // Tu dong xac nhan check-out khi phat hien khach da quet QR PayOS tra du tien (webhook cap
  // nhat Payment "Success" -> amountDue tut ve 0 tren server) — Staff khong can bam nut thu cong.
  // Chi bat khi dang chon phuong thuc QR, chua thanh cong/dang cho duyet, va chi tu bam 1 lan.
  const shouldPollPayment = method === 'QR' && !success && !pendingApproval
  const liveAmountDue = useLiveAmountDue(licensePlate, shouldPollPayment)
  const autoConfirmedRef = useRef(false)

  useEffect(() => {
    if (
      shouldPollPayment &&
      liveAmountDue != null &&
      liveAmountDue <= 0 &&
      !autoConfirmedRef.current &&
      !isPending
    ) {
      autoConfirmedRef.current = true
      handleConfirm(true)
    }
  }, [shouldPollPayment, liveAmountDue, isPending, handleConfirm])

  if (pendingApproval) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">Đang chờ Manager duyệt</p>
          <p className="mt-1 font-mono text-lg font-semibold text-gray-600">{licensePlate}</p>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Số tiền mặt báo thu lệch so với số hệ thống tính. Phiên đỗ xe vẫn đang mở — chờ Manager duyệt hoặc
            từ chối yêu cầu này ở mục Duyệt thanh toán.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">Đã thanh toán</p>
          <p className="mt-1 font-mono text-lg font-semibold text-gray-600">{licensePlate}</p>
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(paidAmount)} · Mời xe qua khỏi barie
          </p>
        </div>
        {isOverstay && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 max-w-sm text-left">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Quá hạn ưu đãi (Overstay)</p>
              <p className="text-xs text-amber-700 mt-1">
                Phiên đỗ xe đã vượt thời gian cho phép — phụ phí quá giờ đã được cộng vào tổng tiền.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Barie đang mở
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Thanh toán cổng ra</h2>
        <p className="text-sm text-gray-500">Cổng Ra · Làn A</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FeeBreakdown
          licensePlate={licensePlate}
          entryTime={entryTime}
          totalFee={totalFee}
          depositAlreadyPaid={depositAlreadyPaid}
          amountDue={amountDue}
          breakdown={breakdown}
          durationMinutes={durationMinutes}
        />

        <PaymentQrPanel
          sessionId={sessionId}
          amountDue={amountDue}
          selectedMethod={method}
          onMethodChange={setMethod}
          onConfirm={() => handleConfirm(false)}
          isPending={isPending}
          collectedAmount={collectedAmount}
          onCollectedAmountChange={setCollectedAmount}
          discountReason={discountReason}
          onDiscountReasonChange={setDiscountReason}
          requireDiscountReason={requireDiscountReason}
        />
      </div>

      {shouldPollPayment && (
        <p className="text-center text-xs text-gray-400">
          Hệ thống tự động kiểm tra thanh toán QR mỗi vài giây — không cần bấm xác nhận nếu khách đã
          quét trả tiền.
        </p>
      )}

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <AlertTriangle className="h-4 w-4" />
          Báo lỗi nhận diện
        </Button>
      </div>
    </div>
  )
}
