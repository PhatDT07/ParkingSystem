import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  EntryScanResult,
  ExitScanResult,
  ForceCheckinResult,
  CameraSlotResult,
} from '@/components/gate-camera-simulator/types'

// POST /api/gate/entry/scan
export function useEntryScan(failureRate: number) {
  const queryClient = useQueryClient()
  return useMutation<EntryScanResult, Error, { licensePlate: string }>({
    mutationFn: ({ licensePlate }) =>
      api.post<EntryScanResult>('/gate/entry/scan', { licensePlate, failureRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// POST /api/gate/exit/scan
export function useExitScan(failureRate: number) {
  const queryClient = useQueryClient()
  return useMutation<ExitScanResult, Error, { licensePlate: string }>({
    mutationFn: ({ licensePlate }) =>
      api.post<ExitScanResult>('/gate/exit/scan', { licensePlate, failureRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// POST /api/gate/force-checkin
export function useForceCheckin() {
  const queryClient = useQueryClient()
  return useMutation<ForceCheckinResult, Error, { licensePlate: string }>({
    mutationFn: ({ licensePlate }) =>
      api.post<ForceCheckinResult>('/gate/force-checkin', { licensePlate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}

// POST /api/camera/slot-occupied
export function useCameraOccupied() {
  const queryClient = useQueryClient()
  return useMutation<CameraSlotResult, Error, { slotCode: string; licensePlate?: string }>({
    mutationFn: ({ slotCode, licensePlate }) =>
      api.post<CameraSlotResult>('/camera/slot-occupied', { slotCode, licensePlate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

// POST /api/camera/slot-vacated
export function useCameraVacated() {
  const queryClient = useQueryClient()
  return useMutation<CameraSlotResult, Error, { slotCode: string }>({
    mutationFn: ({ slotCode }) =>
      api.post<CameraSlotResult>('/camera/slot-vacated', { slotCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
