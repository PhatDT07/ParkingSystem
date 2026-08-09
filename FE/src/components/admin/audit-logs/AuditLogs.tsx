'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { useAuditLogs, type AuditFilter } from '@/hooks/useAdmin'

type Mode = 'all' | 'action' | 'entity' | 'date'

export function AuditLogs() {
  const [mode, setMode] = useState<Mode>('all')
  const [actionText, setActionText] = useState('')
  const [entityText, setEntityText] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [applied, setApplied] = useState<AuditFilter>({})
  const [page, setPage] = useState(0)

  const { data, isLoading, refetch } = useAuditLogs(applied, page)
  const logs = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  function apply() {
    setPage(0) // luôn về trang đầu khi đổi bộ lọc
    if (mode === 'action') setApplied({ action: actionText.trim() })
    else if (mode === 'entity') setApplied({ entityName: entityText.trim() })
    else if (mode === 'date' && from && to) setApplied({ from, to })
    else setApplied({})
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Nhật ký hệ thống</h2>
        <p className="text-sm text-gray-600">Lịch sử hành động (audit log)</p>
      </div>

      <div className="flex flex-col flex-wrap items-stretch gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="action">Theo hành động</SelectItem>
            <SelectItem value="entity">Theo đối tượng</SelectItem>
            <SelectItem value="date">Theo ngày</SelectItem>
          </SelectContent>
        </Select>

        {mode === 'action' && (
          <Input
            placeholder="VD: STAFF_CHECK_IN"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            className="md:w-64"
          />
        )}
        {mode === 'entity' && (
          <Input
            placeholder="VD: ParkingSession"
            value={entityText}
            onChange={(e) => setEntityText(e.target.value)}
            className="md:w-64"
          />
        )}
        {mode === 'date' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-gray-400">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}

        <Button onClick={apply}>Lọc</Button>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    Không có nhật ký nào
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.logId} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {log.createdAt ? formatDateTime(log.createdAt) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.userFullName ?? log.userName ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-sm">
                      {log.entityName}
                      {log.entityId ? <span className="text-gray-400"> #{log.entityId}</span> : null}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-gray-600">
                      {log.detail || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <span className="text-gray-500">
            Trang {page + 1}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
