'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CheckoutSessionList } from './CheckoutSessionList'
import { CheckoutModal } from './CheckoutModal'
import { useOpenSessions } from '@/hooks/useSessions'
import type { ParkingSession } from '@/types/model'

/**
 * Trang Check-out (cổng ra). Demo không có camera quét biển số nên hiển thị DANH SÁCH xe
 * đang đỗ + nút Check-out từng xe → mở modal để Staff check-out thủ công (tính phí động,
 * QR PayOS thật, xác nhận mở barie). Search bar lọc danh sách theo biển số / ô đỗ.
 */
export function CheckOut() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ParkingSession | null>(null)
  const { data: sessions, isLoading } = useOpenSessions()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        s.licensePlate.toLowerCase().includes(q) ||
        (s.actualSlotCode ?? '').toLowerCase().includes(q),
    )
  }, [sessions, search])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Check-out cổng ra</h2>
        <p className="text-sm text-gray-500">
          Demo chưa có camera quét biển số — chọn xe trong danh sách rồi check-out thủ công.
        </p>
      </div>

      {/* Search bar — lọc danh sách theo biển số / ô đỗ */}
      <div className="flex flex-col items-stretch gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo biển số hoặc ô đỗ…"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="pl-9 font-mono uppercase"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải danh sách xe đang đỗ...</div>
      ) : (
        <CheckoutSessionList sessions={filtered} onCheckout={setSelected} />
      )}

      <CheckoutModal session={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
