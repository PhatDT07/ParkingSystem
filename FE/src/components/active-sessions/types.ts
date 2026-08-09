import type { SessionStatus } from '@/types/model'

export type SessionStatusFilter = SessionStatus | 'all'

export interface SessionFilters {
  search: string
  status: SessionStatusFilter
}
