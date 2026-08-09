import React from 'react'
import { Pencil, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { QuotaTableProps } from './types'

export function QuotaTable({ groups, onEdit, onToggle, isToggling }: QuotaTableProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div
          key={group.vehicleTypeId}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          {/* Group header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
            <span className="text-sm font-semibold text-gray-700">
              {group.vehicleTypeName}
            </span>
            <span className="text-xs text-gray-500">
              Sức chứa: <span className="font-medium text-gray-700">{group.capacity}</span> suất
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-36 text-xs">Khung giờ</TableHead>
                  <TableHead className="text-right text-xs">% sức chứa</TableHead>
                  <TableHead className="text-right text-xs">Số tuyệt đối</TableHead>
                  <TableHead className="text-center text-xs">Trạng thái</TableHead>
                  <TableHead className="text-center text-xs">Bật/Tắt</TableHead>
                  <TableHead className="text-center text-xs">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-400">
                      Chưa có hạn mức nào
                    </TableCell>
                  </TableRow>
                ) : (
                  group.rows.map((row) => (
                    <TableRow key={row.quotaId} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium">
                        {row.windowStart}–{row.windowEnd}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.quotaPercent}%
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {row.quotaAbs} suất
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                            row.isActive
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-red-200 bg-red-50 text-red-700',
                          )}
                        >
                          {row.isActive ? (
                            <>
                              <Unlock className="h-3 w-3" />
                              Còn nhận
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Đang khóa
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.isActive}
                          onCheckedChange={() => onToggle(row.quotaId)}
                          disabled={isToggling}
                          aria-label={`Bật/tắt hạn mức ${row.windowStart}–${row.windowEnd}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="h-3 w-3" />
                          Sửa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
