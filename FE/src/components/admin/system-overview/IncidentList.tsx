'use client'

import { useIncidents } from '@/hooks/useIncidents'
import { INCIDENT_TYPE_LABELS } from '@/lib/constants'
import type { Incident, IncidentType } from '@/types/model'

const TOP_N = 3

// Sự cố liên quan an ninh/sức chứa được coi là mức cao; còn lại là cảnh báo.
const HIGH_SEVERITY_TYPES: ReadonlySet<IncidentType> = new Set([
  'CapacityCrash',
  'ExitTailgating',
  'PlateMismatch',
  'Loiterer',
])

function severityOf(inc: Incident): 'high' | 'warning' {
  return HIGH_SEVERITY_TYPES.has(inc.issueType) ? 'high' : 'warning'
}

function formatAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes}p trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export function IncidentList() {
  const { data: incidents, isLoading } = useIncidents({ status: 'Open' })

  const topIncidents = [...(incidents ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, TOP_N)

  const totalCount = incidents?.length ?? 0

  return (
    <div className="flex flex-col gap-md">
      <h2 className="font-headline-md text-headline-md text-on-background flex items-center gap-xs">
        <span className="material-symbols-outlined text-error" style={{ fontSize: 20 }}>gpp_maybe</span>
        Top sự cố cần xử lý
      </h2>
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col flex-1">
        {isLoading ? (
          <div className="p-md text-center text-on-surface-variant font-body-md text-body-md">
            Đang tải…
          </div>
        ) : topIncidents.length === 0 ? (
          <div className="p-md text-center text-on-surface-variant font-body-md text-body-md">
            Không có sự cố nào đang chờ xử lý.
          </div>
        ) : (
          topIncidents.map((inc) => {
            const level = severityOf(inc)
            return (
              <div
                key={inc.incidentId}
                className="p-md border-b border-surface-container hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-xs">
                  {level === 'high' ? (
                    <span className="font-label-mono text-label-mono text-error bg-error/10 px-2 py-0.5 rounded border border-error/20">
                      MỨC CAO
                    </span>
                  ) : (
                    <span className="font-label-mono text-label-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20">
                      CẢNH BÁO
                    </span>
                  )}
                  <span className="font-label-mono text-label-mono text-outline">
                    {formatAgo(inc.createdAt)}
                  </span>
                </div>
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface">
                  {INCIDENT_TYPE_LABELS[inc.issueType] ?? inc.issueType}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  {inc.description}
                </p>
              </div>
            )
          })
        )}
        <div className="p-md bg-surface-container flex items-center justify-center mt-auto">
          <button className="font-body-md text-body-md font-bold text-primary hover:underline">
            Xem tất cả {totalCount} sự cố
          </button>
        </div>
      </div>
    </div>
  )
}
