'use client'

import { X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const REASONS = ['Sửa chữa vạch kẻ', 'Hư hỏng mặt sàn', 'Lắp đặt thiết bị', 'Khác']

interface MaintenancePanelProps {
  readonly selected: string[]
  readonly reason: string
  readonly notes: string
  readonly isLocking: boolean
  readonly onDeselect: (code: string) => void
  readonly onReasonChange: (reason: string) => void
  readonly onNotesChange: (notes: string) => void
  readonly onLock: () => void
  readonly onClear: () => void
}

export function MaintenancePanel({
  selected,
  reason,
  notes,
  isLocking,
  onDeselect,
  onReasonChange,
  onNotesChange,
  onLock,
  onClear,
}: MaintenancePanelProps) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Thao tác Bảo trì</h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Đã chọn {selected.length}
        </span>
      </div>

      {selected.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Chọn các ô <span className="font-medium text-emerald-600">Trống</span> trên sơ đồ để đánh dấu bảo trì.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Vị trí đã chọn
            </span>
            <div className="flex flex-wrap gap-2">
              {selected.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-sm"
                >
                  {code}
                  <button type="button" onClick={() => onDeselect(code)} className="text-gray-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Lý do bảo trì</label>
            <Select value={reason} onValueChange={onReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-5 space-y-2">
            <label className="text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Nhập chi tiết..."
              rows={3}
            />
          </div>

          <p className="mb-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            Nếu việc bảo trì làm sức chứa khả dụng xuống dưới 0, hệ thống sẽ tự động hủy các đặt chỗ mới nhất
            đang chờ vào bãi và hoàn cọc.
          </p>

          <Button className="mb-2 w-full gap-2" disabled={isLocking} onClick={onLock}>
            <Lock className="h-4 w-4" />
            {isLocking ? 'Đang khóa...' : 'Khóa vị trí & bảo trì'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClear} disabled={isLocking}>
            Bỏ chọn tất cả
          </Button>
        </>
      )}
    </div>
  )
}
