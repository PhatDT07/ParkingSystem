import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'

// ── BE shapes (dùng trực tiếp, không cần map nhiều) ────────────────────────────
export interface AdminRole {
  roleId: number
  roleName: string
  description?: string | null
}

export interface AdminPermission {
  permissionId: number
  permissionCode: string
  description?: string | null
}

export interface AdminUser {
  userId: number
  username: string
  fullName: string
  phoneNumber?: string | null
  email?: string | null
  role?: AdminRole | null
  status: string // Active | Inactive | Banned
  createdAt?: string | null
  updatedAt?: string | null
  // Riêng biệt với `status` — chặn đặt chỗ (USER_BLACKLISTED) sau nhiều lần no-show liên tiếp,
  // tài khoản vẫn có thể đang Active.
  blacklisted?: boolean | null
  consecutiveNoShows?: number | null
}

export interface SystemConfigItem {
  configKey: string
  configValue: string
  description?: string | null
}

export interface AuditLogItem {
  logId: number
  // BE @JsonIgnore quan hệ user, phơi phẳng tên người thực hiện qua getter.
  userFullName?: string | null
  userName?: string | null
  action: string
  entityName: string
  entityId?: string | null
  detail?: string | null
  createdAt?: string | null
}

// ── Users — /api/admin/users ───────────────────────────────────────────────────
export function useUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users'),
  })
}

export interface CreateUserInput {
  username: string
  password: string
  fullName: string
  phoneNumber?: string
  email?: string
  roleName: string // 'Manager' | 'Staff' (BE chặn 'Admin')
}

/**
 * Tạo tài khoản nội bộ — POST /api/admin/users. BE cho phép cả Admin và Manager gọi
 * (Manager tạo được Manager/Staff, không tạo được Admin). Chỉ dùng cho phần console.
 */
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation<AdminUser, AppError, CreateUserInput>({
    mutationFn: (body) => api.post<AdminUser>('/admin/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Đã tạo tài khoản')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation<AdminUser, AppError, { id: number; status: string }>({
    mutationFn: ({ id, status }) => api.patch<AdminUser>(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Đã cập nhật trạng thái tài khoản')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useResetUserPassword() {
  return useMutation<void, AppError, { id: number; newPassword: string }>({
    // BE nhận DTO { newPassword } — không gửi chuỗi thô (JSON string sẽ bị lưu kèm dấu ngoặc kép).
    mutationFn: ({ id, newPassword }) =>
      api.patch<void>(`/admin/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => toast.success('Đã đặt lại mật khẩu'),
    onError: (e) => toast.error(e.message),
  })
}

// ── RBAC — /api/admin/rbac ──────────────────────────────────────────────────────
export function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => api.get<AdminRole[]>('/admin/rbac/roles'),
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => api.get<AdminPermission[]>('/admin/rbac/permissions'),
  })
}

export function useRolePermissions(roleId: number | null) {
  return useQuery({
    queryKey: ['admin', 'role-permissions', roleId],
    queryFn: () => api.get<AdminPermission[]>(`/admin/rbac/roles/${roleId}/permissions`),
    enabled: roleId != null,
  })
}

export function useTogglePermission() {
  const qc = useQueryClient()
  return useMutation<unknown, AppError, { roleId: number; permissionId: number; enabled: boolean }>({
    mutationFn: ({ roleId, permissionId, enabled }) =>
      enabled
        ? api.post(`/admin/rbac/roles/${roleId}/permissions/${permissionId}`)
        : api.del(`/admin/rbac/roles/${roleId}/permissions/${permissionId}`),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-permissions', v.roleId] })
    },
    onError: (e) => toast.error(e.message),
  })
}

// ── System config — /api/admin/system-configs ──────────────────────────────────
export function useSystemConfigs() {
  return useQuery({
    queryKey: ['admin', 'configs'],
    queryFn: () => api.get<SystemConfigItem[]>('/admin/system-configs'),
  })
}

export function useUpsertSystemConfig() {
  const qc = useQueryClient()
  return useMutation<
    SystemConfigItem,
    AppError,
    { isNew: boolean; configKey: string; configValue: string; description?: string }
  >({
    mutationFn: ({ isNew, ...body }) =>
      isNew
        ? api.post<SystemConfigItem>('/admin/system-configs', body)
        : api.put<SystemConfigItem>(
            `/admin/system-configs/${encodeURIComponent(body.configKey)}`,
            body,
          ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'configs'] })
      toast.success('Đã lưu cấu hình')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteSystemConfig() {
  const qc = useQueryClient()
  return useMutation<unknown, AppError, string>({
    mutationFn: (key) => api.del(`/admin/system-configs/${encodeURIComponent(key)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'configs'] })
      toast.success('Đã xóa cấu hình')
    },
    onError: (e) => toast.error(e.message),
  })
}

// ── Audit logs — /api/admin/audit-logs ─────────────────────────────────────────
export interface AuditFilter {
  action?: string
  entityName?: string
  from?: string
  to?: string
}

/** BE PageResponse<T> — simple pagination envelope. */
export interface AuditPage {
  content: AuditLogItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function useAuditLogs(filter: AuditFilter = {}, page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'audit', filter, page, size],
    // Chỉ chế độ "Tất cả" phân trang phía server; các chế độ lọc trả mảng → gói thành 1 trang.
    queryFn: async (): Promise<AuditPage> => {
      const wrap = (arr: AuditLogItem[]): AuditPage => ({
        content: arr,
        page: 0,
        size: arr.length,
        totalElements: arr.length,
        totalPages: 1,
      })
      if (filter.action)
        return wrap(
          await api.get<AuditLogItem[]>(
            `/admin/audit-logs/by-action?action=${encodeURIComponent(filter.action)}`,
          ),
        )
      if (filter.entityName)
        return wrap(
          await api.get<AuditLogItem[]>(
            `/admin/audit-logs/by-entity?entityName=${encodeURIComponent(filter.entityName)}`,
          ),
        )
      if (filter.from && filter.to)
        return wrap(
          await api.get<AuditLogItem[]>(`/admin/audit-logs/by-date?from=${filter.from}&to=${filter.to}`),
        )
      return api.get<AuditPage>(`/admin/audit-logs?page=${page}&size=${size}`)
    },
    placeholderData: (prev) => prev, // keep previous page visible while the next loads
  })
}
