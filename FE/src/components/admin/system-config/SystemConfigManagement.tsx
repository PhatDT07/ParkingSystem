'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useSystemConfigs,
  useUpsertSystemConfig,
  useDeleteSystemConfig,
  type SystemConfigItem,
} from '@/hooks/useAdmin'

interface FormState {
  isNew: boolean
  configKey: string
  configValue: string
  description: string
}

export function SystemConfigManagement() {
  const { data: configs = [], isLoading } = useSystemConfigs()
  const upsert = useUpsertSystemConfig()
  const remove = useDeleteSystemConfig()

  const [form, setForm] = useState<FormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SystemConfigItem | null>(null)

  function openCreate() {
    setForm({ isNew: true, configKey: '', configValue: '', description: '' })
  }
  function openEdit(c: SystemConfigItem) {
    setForm({
      isNew: false,
      configKey: c.configKey,
      configValue: c.configValue,
      description: c.description ?? '',
    })
  }

  function handleSubmit() {
    if (!form || !form.configKey || !form.configValue) return
    upsert.mutate(
      {
        isNew: form.isNew,
        configKey: form.configKey,
        configValue: form.configValue,
        description: form.description || undefined,
      },
      { onSuccess: () => setForm(null) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Cấu hình hệ thống</h2>
          <p className="text-sm text-gray-600">Tham số vận hành dạng key–value</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm cấu hình
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khóa</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                    Chưa có cấu hình nào
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((c) => (
                  <TableRow key={c.configKey} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm font-medium text-gray-900">
                      {c.configKey}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.configValue}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.description || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{form?.isNew ? 'Thêm cấu hình' : 'Sửa cấu hình'}</DialogTitle>
            <DialogDescription>Tham số dạng key–value cho hệ thống.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="ckey">Khóa (key)</Label>
                <Input
                  id="ckey"
                  value={form.configKey}
                  disabled={!form.isNew}
                  onChange={(e) => setForm({ ...form, configKey: e.target.value })}
                  placeholder="VD: DAY_START_HOUR"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cval">Giá trị</Label>
                <Input
                  id="cval"
                  value={form.configValue}
                  onChange={(e) => setForm({ ...form, configValue: e.target.value })}
                  placeholder="VD: 06:00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cdesc">Mô tả</Label>
                <Input
                  id="cdesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tùy chọn"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form?.configKey || !form?.configValue || upsert.isPending}
            >
              {upsert.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Xóa cấu hình?</DialogTitle>
            <DialogDescription>
              Xóa <span className="font-mono font-semibold">{deleteTarget?.configKey}</span> không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={remove.isPending}
              onClick={() =>
                deleteTarget &&
                remove.mutate(deleteTarget.configKey, { onSuccess: () => setDeleteTarget(null) })
              }
            >
              {remove.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
