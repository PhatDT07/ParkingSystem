'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Banknote, QrCode, CheckCircle2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { useSessionPayosLink } from '@/hooks/useSessionPayosLink'
import type { PaymentMethod } from '@/types/model'
import type { PaymentQrPanelProps } from './types'

const METHODS: { value: PaymentMethod; icon: React.ReactNode; label: string }[] = [
  { value: 'Cash', icon: <Banknote className="h-4 w-4" />, label: PAYMENT_METHOD_LABELS.Cash },
  { value: 'QR', icon: <QrCode className="h-4 w-4" />, label: PAYMENT_METHOD_LABELS.QR },
]

export function PaymentQrPanel({
  sessionId,
  amountDue,
  selectedMethod,
  onMethodChange,
  onConfirm,
  isPending,
  collectedAmount,
  onCollectedAmountChange,
  discountReason,
  onDiscountReasonChange,
  requireDiscountReason,
}: PaymentQrPanelProps) {
  // QR PayOS THẬT (VietQR) tạo động theo phí đỗ hiện tại của phiên — thay cho QR placeholder.
  const payos = useSessionPayosLink()
  const link = payos.data

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Phương thức thanh toán
        </h3>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onMethodChange(m.value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                selectedMethod === m.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedMethod === 'QR' && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Quét mã PayOS để thanh toán
          </h3>

          {!link ? (
            // Chưa tạo mã → nút tạo QR PayOS động (gọi BE POST /staff/sessions/{id}/payos-link)
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <QrCode className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">
                Tạo mã QR PayOS động theo phí đỗ hiện tại để khách quét bằng app ngân hàng.
              </p>
              <Button onClick={() => payos.mutate({ sessionId })} disabled={payos.isPending} className="gap-1.5">
                {payos.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Tạo mã QR PayOS
              </Button>
              {payos.isError && (
                <p className="text-xs text-red-600">
                  {payos.error?.message ?? 'Không tạo được mã QR — kiểm tra cấu hình PayOS trên máy chủ.'}
                </p>
              )}
            </div>
          ) : (
            // Đã có mã → render QR PayOS THẬT + số tiền + mã nội dung thanh toán độc quyền của phiên
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <QRCodeSVG value={link.qrCode} size={192} level="M" marginSize={2} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(link.amount)}</p>
              <div className="w-full rounded-md bg-gray-50 px-3 py-2 text-center">
                <p className="text-xs uppercase tracking-wide text-gray-400">Mã nội dung thanh toán</p>
                <p className="select-all font-mono text-sm font-semibold text-gray-800">{link.orderCode}</p>
              </div>
              <p className="text-center text-xs text-gray-500">
                Khách quét bằng app ngân hàng / MoMo / ZaloPay / VNPAY
              </p>
              <button
                type="button"
                onClick={() => payos.mutate({ sessionId })}
                disabled={payos.isPending}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
              >
                <RefreshCw className={cn('h-3 w-3', payos.isPending && 'animate-spin')} />
                Tạo lại mã
              </button>
            </div>
          )}
        </div>
      )}

      {selectedMethod === 'Cash' && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center gap-2 pb-4 text-center">
            <Banknote className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">Số tiền phải thu (hệ thống tính)</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(amountDue)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collected-amount">Số tiền mặt thực thu</Label>
            <Input
              id="collected-amount"
              type="number"
              min={0}
              value={collectedAmount}
              onChange={(e) => onCollectedAmountChange(Number(e.target.value))}
            />
          </div>

          {requireDiscountReason && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Số tiền lệch so với hệ thống — cần nhập lý do để gửi Manager duyệt
              </div>
              <Textarea
                value={discountReason}
                onChange={(e) => onDiscountReasonChange(e.target.value)}
                placeholder="Vd: khách trả thiếu, đồng ý giảm giá..."
                rows={2}
              />
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onConfirm}
        disabled={isPending}
        className="h-12 w-full gap-2 bg-blue-600 text-base font-semibold hover:bg-blue-700"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
        Xác nhận đã thanh toán — Mở barie
      </Button>
    </div>
  )
}
