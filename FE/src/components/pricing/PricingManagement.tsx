'use client'

import { useState } from 'react'
import { DollarSign, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  usePricingPolicies,
  useUpdatePricing,
  useFeeConfig,
  useUpdateFeeConfig,
} from '@/hooks/usePricing'
import type { FeeConfig, PricingPolicy } from '@/types/model'

interface PricingTableProps {
  readonly policies: PricingPolicy[]
}

/** Bảng giá đầy đủ — mỗi loại xe một chính sách, sửa & lưu nguyên vẹn cả chính sách. */
function PricingTable({ policies }: PricingTableProps) {
  return (
    <div className="divide-y divide-gray-100">
      {policies.map((p) => (
        <PricingPolicyRow key={p.policyId} policy={p} />
      ))}
    </div>
  )
}

/** Các trường số của một chính sách giá; `min` khớp ràng buộc @DecimalMin/@Min bên BE. */
const PRICING_FIELDS = [
  { key: 'basePrice', label: 'Giá cơ bản', suffix: 'đ', step: 1000, min: 1 },
  { key: 'baseHours', label: 'Số giờ cơ bản', suffix: 'giờ', step: 1, min: 1 },
  { key: 'extraHourPrice', label: 'Giá mỗi giờ vượt', suffix: 'đ/giờ', step: 1000, min: 1 },
  { key: 'nightSurcharge', label: 'Phụ thu đêm', suffix: 'đ', step: 1000, min: 0 },
  { key: 'lostTicketFee', label: 'Phí mất vé', suffix: 'đ', step: 1000, min: 0 },
] as const

type PricingFieldKey = (typeof PRICING_FIELDS)[number]['key']

/**
 * Form một chính sách giá, prefill từ giá trị hiện tại trong DB. Khi lưu gửi ĐẦY ĐỦ các field
 * nên không xoá mất phụ thu đêm / phí mất vé. Giá mới dùng cho các lần check-out kể từ khi lưu.
 */
function PricingPolicyRow({ policy }: { readonly policy: PricingPolicy }) {
  const updatePricing = useUpdatePricing()
  const [form, setForm] = useState<Record<PricingFieldKey, string> & { effectiveDate: string }>(() => ({
    basePrice: String(policy.basePrice),
    baseHours: String(policy.baseHours),
    extraHourPrice: String(policy.extraHourPrice),
    nightSurcharge: String(policy.nightSurcharge),
    lostTicketFee: String(policy.lostTicketFee),
    effectiveDate: policy.effectiveDate
      ? new Date(policy.effectiveDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }))

  const num = (k: PricingFieldKey) => Number(form[k])
  const dirty = PRICING_FIELDS.some((f) => num(f.key) !== policy[f.key]) ||
    form.effectiveDate !== new Date(policy.effectiveDate).toISOString().split('T')[0]
  const valid =
    PRICING_FIELDS.every((f) => form[f.key].trim() !== '' && Number.isFinite(num(f.key))) &&
    num('basePrice') > 0 &&
    num('baseHours') >= 1 &&
    num('extraHourPrice') > 0 &&
    num('nightSurcharge') >= 0 &&
    num('lostTicketFee') >= 0

  function save() {
    updatePricing.mutate({
      policyId: policy.policyId,
      vehicleTypeId: policy.vehicleTypeId,
      effectiveDate: form.effectiveDate ? new Date(form.effectiveDate).toISOString() : policy.effectiveDate,
      basePrice: num('basePrice'),
      baseHours: num('baseHours'),
      extraHourPrice: num('extraHourPrice'),
      nightSurcharge: num('nightSurcharge'),
      lostTicketFee: num('lostTicketFee'),
    })
  }

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-900">{policy.vehicleTypeName}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Áp dụng từ</span>
          <input
            type="date"
            value={form.effectiveDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm((s) => ({ ...s, effectiveDate: e.target.value }))}
            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PRICING_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <Label htmlFor={`${policy.policyId}-${f.key}`} className="text-xs text-gray-500">
              {f.label}
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id={`${policy.policyId}-${f.key}`}
                type="number"
                min={f.min}
                step={f.step}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-full"
              />
              <span className="whitespace-nowrap text-xs text-gray-400">{f.suffix}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {dirty && !valid && <span className="text-xs text-red-500">Giá trị không hợp lệ</span>}
        <Button
          size="sm"
          disabled={!dirty || !valid || updatePricing.isPending}
          onClick={save}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" />
          Lưu
        </Button>
      </div>
    </div>
  )
}

interface FeeConfigFormProps {
  readonly fee: FeeConfig
}

/** Form chính sách phí — key theo hàm cha để reset local state khi server trả dữ liệu mới. */
function FeeConfigForm({ fee }: FeeConfigFormProps) {
  const updateFee = useUpdateFeeConfig()
  const [form, setForm] = useState<FeeConfig>(fee)

  return (
    <form
      className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        updateFee.mutate(form)
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="depositPercent">% cọc booking</Label>
        <Input
          id="depositPercent"
          type="number"
          min={0}
          max={100}
          value={form.depositPercent}
          onChange={(e) => setForm({ ...form, depositPercent: Number(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="overstayRatePerHour">Phí quá giờ (đ/giờ)</Label>
        <Input
          id="overstayRatePerHour"
          type="number"
          min={0}
          step={1000}
          value={form.overstayRatePerHour}
          onChange={(e) => setForm({ ...form, overstayRatePerHour: Number(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="noShowGraceMinutes" className="text-gray-400">
          Gia hạn khi khách không đến (phút) — không còn tác dụng
        </Label>
        <Input
          id="noShowGraceMinutes"
          type="number"
          min={0}
          value={form.noShowGraceMinutes}
          onChange={(e) => setForm({ ...form, noShowGraceMinutes: Number(e.target.value) })}
        />
        <span className="text-xs text-gray-400">
          No-show giờ tính hoàn toàn theo hạn check-in riêng của từng booking, đổi giá trị này không
          ảnh hưởng gì.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="blacklistThreshold">Ngưỡng blacklist (số lần không đến)</Label>
        <Input
          id="blacklistThreshold"
          type="number"
          min={1}
          value={form.blacklistThreshold}
          onChange={(e) => setForm({ ...form, blacklistThreshold: Number(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="depositPaymentWindowMinutes">Thời hạn thanh toán cọc (phút)</Label>
        <Input
          id="depositPaymentWindowMinutes"
          type="number"
          min={1}
          value={form.depositPaymentWindowMinutes ?? ''}
          onChange={(e) => setForm({ ...form, depositPaymentWindowMinutes: Number(e.target.value) })}
        />
        <span className="text-xs text-gray-400">Booking Pending tự hết hạn nếu chưa thanh toán cọc trong thời gian này.</span>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="cashToleranceVnd">Sai số tiền mặt cho phép (đ)</Label>
        <Input
          id="cashToleranceVnd"
          type="number"
          min={0}
          step={1000}
          value={form.cashToleranceVnd ?? ''}
          onChange={(e) => setForm({ ...form, cashToleranceVnd: Number(e.target.value) })}
        />
        <span className="text-xs text-gray-400">Lệch quá mức này giữa tiền mặt Staff báo thu và số hệ thống tính sẽ cần Manager duyệt.</span>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={updateFee.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          Lưu chính sách phí
        </Button>
      </div>
    </form>
  )
}

export function PricingManagement() {
  const { data: policies = [], isLoading } = usePricingPolicies()
  const { data: fee } = useFeeConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý giá</h1>
        <p className="mt-0.5 text-sm text-gray-500">Bảng giá gửi xe và các chính sách phí</p>
      </div>

      {/* Bảng giá theo giờ */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Bảng giá gửi xe</h2>
        </header>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Đang tải...</div>
        ) : (
          <PricingTable key={policies.map((p) => p.policyId).join(',')} policies={policies} />
        )}
      </section>

      {/* Chính sách phí */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Chính sách phí</h2>
        </header>
        {fee && <FeeConfigForm fee={fee} />}
      </section>
    </div>
  )
}
