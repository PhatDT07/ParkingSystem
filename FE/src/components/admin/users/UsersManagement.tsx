'use client'

import { useMemo, useState } from 'react'
import { Search, RefreshCw, KeyRound, UserPlus } from 'lucide-react'
import { CreateAccount } from '@/components/accounts/CreateAccount'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, getStatusColor, formatDateTime } from '@/lib/utils'
import {
  useUsers,
  useUpdateUserStatus,
  useResetUserPassword,
  type AdminUser,
} from '@/hooks/useAdmin'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Banned'] as const
const STATUS_LABELS: Record<string, string> = {
  Active: 'Hoạt động',
  Inactive: 'Tạm khóa',
  Banned: 'Cấm',
}

export function UsersManagement() {
  const { data: users = [], isLoading, refetch } = useUsers()
  const updateStatus = useUpdateUserStatus()
  const resetPassword = useResetUserPassword()

  const [search, setSearch] = useState('')
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = search.toLowerCase()
        return (
          !q ||
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
        )
      }),
    [users, search],
  )

  function handleResetConfirm() {
    if (!resetTarget || newPassword.length < 4) return
    resetPassword.mutate(
      { id: resetTarget.userId, newPassword },
      {
        onSuccess: () => {
          setResetTarget(null)
          setNewPassword('')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý tài khoản</h2>
          <p className="text-sm text-gray-600">Khóa/mở tài khoản, đặt lại mật khẩu và tạo tài khoản mới</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Tạo tài khoản
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:flex-row">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    Không có tài khoản nào
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.userId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{u.fullName}</div>
                      <div className="font-mono text-xs text-gray-500">@{u.username}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div>{u.email || '—'}</div>
                      <div className="text-xs text-gray-400">{u.phoneNumber || ''}</div>
                    </TableCell>
                    <TableCell className="text-sm">{u.role?.roleName ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {u.createdAt ? formatDateTime(u.createdAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
                            getStatusColor(u.status),
                          )}
                        >
                          {STATUS_LABELS[u.status] ?? u.status}
                        </span>
                        {u.blacklisted && (
                          <span
                            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                            title={
                              u.consecutiveNoShows != null
                                ? `${u.consecutiveNoShows} lần không đến liên tiếp`
                                : undefined
                            }
                          >
                            Đã hạn chế đặt chỗ
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Select
                          value={u.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({ id: u.userId, status: v })
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setResetTarget(u)
                            setNewPassword('')
                          }}
                        >
                          <KeyRound className="h-3 w-3" />
                          Mật khẩu
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
            <DialogDescription>Tạo tài khoản Quản lý (Manager) hoặc Nhân viên (Staff).</DialogDescription>
          </DialogHeader>
          <CreateAccount onCreated={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Mật khẩu mới cho <span className="font-semibold">@{resetTarget?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="newpw">Mật khẩu mới</Label>
            <Input
              id="newpw"
              type="text"
              placeholder="Tối thiểu 4 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleResetConfirm}
              disabled={newPassword.length < 4 || resetPassword.isPending}
            >
              {resetPassword.isPending ? 'Đang lưu...' : 'Đặt lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
