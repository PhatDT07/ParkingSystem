'use client'

import { useEffect, useState } from 'react'

/**
 * Đồng hồ client-only, cập nhật mỗi `intervalMs` (mặc định 1s).
 * Tránh gọi `Date.now()` trực tiếp lúc render (react-hooks/purity) — giá trị
 * ban đầu là `null` cho tới sau lần mount đầu tiên để khớp SSR/CSR.
 */
export function useNow(intervalMs = 1000): number | null {
  // Lazy init đọc Date.now() ngay khi state được tạo (client-only, sau mount đầu) —
  // tránh gọi Date.now() ở thân effect (react-hooks/set-state-in-effect).
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
