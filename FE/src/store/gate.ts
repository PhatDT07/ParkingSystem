import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Tầng staff đang trực — chọn một lần đầu ca, hiếm khi đổi. Check-in/check-out tự tra
 * cổng Entry/Exit tương ứng của tầng này (xem resolveFloorGate trong useGates.ts) thay
 * vì cần chọn đúng cổng thủ công mỗi lần.
 */
interface GateState {
  floorId: number | null
  floorName: string | null
  /** False cho đến khi state đã được khôi phục từ localStorage — tránh dùng giá trị
   *  mặc định (null) trước khi giá trị đã lưu thực sự nạp xong. */
  _hasHydrated: boolean
  _setHasHydrated: (v: boolean) => void
  setFloor: (floorId: number, floorName: string) => void
}

export const useGateStore = create<GateState>()(
  persist(
    (set) => ({
      floorId: null,
      floorName: null,
      _hasHydrated: false,
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      setFloor: (floorId: number, floorName: string) => set({ floorId, floorName }),
    }),
    {
      name: 'gate-storage',
      version: 1,
      partialize: (state) => ({ floorId: state.floorId, floorName: state.floorName }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state._setHasHydrated(true)
      },
    }
  )
)
