'use client'

import { useMemo, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IncidentStatsBar } from './IncidentStatsBar'
import { IncidentTable } from './IncidentTable'
import { ResolveIncidentDialog } from './ResolveIncidentDialog'
import { useIncidents, useResolveIncident, useTakeOverIncident } from '@/hooks/useIncidents'
import { useAuthStore } from '@/store'
import { INCIDENT_TYPE_LABELS } from '@/lib/constants'
import type { Incident, IncidentStatus, IncidentType } from '@/types/model'

export function Incidents() {
  const { user } = useAuthStore()

  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [resolving, setResolving] = useState<Incident | null>(null)

  const { data: incidents = [], isLoading, refetch } = useIncidents({})
  const resolveIncident = useResolveIncident()
  const takeOverIncident = useTakeOverIncident()

  const filtered = useMemo(
    () =>
      incidents.filter((i) => {
        const matchStatus = statusFilter === 'all' || i.status === statusFilter
        const matchType = typeFilter === 'all' || i.issueType === typeFilter
        const matchSearch =
          !search ||
          i.description.toLowerCase().includes(search.toLowerCase()) ||
          (i.slotCode ?? '').toLowerCase().includes(search.toLowerCase())
        return matchStatus && matchType && matchSearch
      }),
    [incidents, statusFilter, typeFilter, search],
  )

  const handleConfirm = (resolutionNotes: string) => {
    if (!resolving) return
    resolveIncident.mutate(
      { incidentId: resolving.incidentId, handledByStaffId: user?.id, resolutionNotes },
      { onSuccess: () => setResolving(null) },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Sự cố</h2>
        <p className="text-sm text-gray-600">Theo dõi và xử lý các sự cố vận hành</p>
      </div>

      <IncidentStatsBar incidents={incidents} />

      {/* Filters */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:flex-row">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo mô tả, vị trí..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IncidentStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Open">Chưa xử lý</SelectItem>
              <SelectItem value="InProgress">Đang xử lý</SelectItem>
              <SelectItem value="Resolved">Đã xử lý</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as IncidentType | 'all')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Loại sự cố" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải sự cố...</div>
      ) : (
        <IncidentTable
          incidents={filtered}
          onResolve={setResolving}
          canTakeOver={user?.role === 'Manager'}
          onTakeOver={(inc) => takeOverIncident.mutate(inc.incidentId)}
          isTakingOver={takeOverIncident.isPending}
        />
      )}

      <ResolveIncidentDialog
        incident={resolving}
        isResolving={resolveIncident.isPending}
        onConfirm={handleConfirm}
        onClose={() => setResolving(null)}
      />
    </div>
  )
}
