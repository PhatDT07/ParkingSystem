import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import type { Incident, IncidentStatus } from '@/types/model'
import { mapIncident, type BeIncident } from '@/lib/beApi'

export interface IncidentFilter {
  status?: IncidentStatus | 'all'
}

/**
 * Danh sách sự cố — GET /staff/incidents (BE trả tất cả; lọc theo status ở client
 * vì endpoint staff không nhận query param status).
 */
export function useIncidents(filter: IncidentFilter = {}) {
  return useQuery({
    queryKey: ['incidents', filter.status ?? 'all'],
    queryFn: async () => {
      const list = await api.get<BeIncident[]>('/staff/incidents')
      const mapped = list.map(mapIncident)
      if (filter.status && filter.status !== 'all') {
        return mapped.filter((i) => i.status === filter.status)
      }
      return mapped
    },
  })
}

/** Open-incident count — feeds the dashboard "Sự cố đang mở" KPI. */
export function useOpenIncidentCount() {
  return useQuery({
    queryKey: ['incidents', 'Open'],
    queryFn: async () => {
      const list = await api.get<BeIncident[]>('/staff/incidents')
      return list.map(mapIncident).filter((i) => i.status === 'Open')
    },
    select: (list) => list.length,
  })
}

export interface ResolveIncidentInput {
  incidentId: string
  handledByStaffId?: string
  resolutionNotes?: string
}

/**
 * Nhận xử lý (claim) sự cố — PATCH /manager/incidents/{id}/take-over. Manager-only, atomic ở BE
 * (findAndModify) — thua trong race sẽ nhận INCIDENT_ALREADY_TAKEN thay vì lỗi chung chung.
 */
export function useTakeOverIncident() {
  const queryClient = useQueryClient()
  return useMutation<BeIncident, AppError, string>({
    mutationFn: (incidentId) => api.patch<BeIncident>(`/manager/incidents/${incidentId}/take-over`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('Đã nhận xử lý sự cố')
    },
    onError: (error) => {
      if (error.code === 'INCIDENT_ALREADY_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['incidents'] })
      }
      toast.error(error.message)
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    // BE: PATCH /staff/incidents/{id}/resolve with JSON body
    mutationFn: ({ incidentId, resolutionNotes }: ResolveIncidentInput) => {
      return api.patch<BeIncident>(`/staff/incidents/${incidentId}/resolve`, { resolutionNotes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('Đã xử lý sự cố')
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}
