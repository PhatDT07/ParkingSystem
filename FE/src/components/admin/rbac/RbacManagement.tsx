'use client'

import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  useRoles,
  usePermissions,
  useRolePermissions,
  useTogglePermission,
} from '@/hooks/useAdmin'

export function RbacManagement() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: permissions = [], isLoading: permsLoading } = usePermissions()
  const togglePermission = useTogglePermission()

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const effectiveRoleId = selectedRoleId ?? roles[0]?.roleId ?? null

  const { data: rolePerms = [], isLoading: rolePermsLoading } =
    useRolePermissions(effectiveRoleId)

  const grantedIds = useMemo(
    () => new Set(rolePerms.map((p) => p.permissionId)),
    [rolePerms],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Phân quyền (RBAC)</h2>
        <p className="text-sm text-gray-600">Gán quyền hạn cho từng vai trò</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Roles */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Vai trò
            </div>
            {rolesLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {roles.map((r) => (
                  <li key={r.roleId}>
                    <button
                      onClick={() => setSelectedRoleId(r.roleId)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors',
                        effectiveRoleId === r.roleId
                          ? 'bg-blue-50 font-medium text-blue-700'
                          : 'hover:bg-gray-50',
                      )}
                    >
                      <span>{r.roleName}</span>
                      {effectiveRoleId === r.roleId && <ShieldCheck className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Quyền hạn {effectiveRoleId != null && `· ${roles.find((r) => r.roleId === effectiveRoleId)?.roleName ?? ''}`}
            </div>
            {permsLoading || rolePermsLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {permissions.map((p) => {
                  const granted = grantedIds.has(p.permissionId)
                  return (
                    <li
                      key={p.permissionId}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {p.permissionCode}
                        </div>
                        {p.description && (
                          <div className="truncate text-xs text-gray-500">{p.description}</div>
                        )}
                      </div>
                      <Switch
                        checked={granted}
                        disabled={effectiveRoleId == null || togglePermission.isPending}
                        onCheckedChange={(checked) =>
                          effectiveRoleId != null &&
                          togglePermission.mutate({
                            roleId: effectiveRoleId,
                            permissionId: p.permissionId,
                            enabled: checked,
                          })
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
