import type { UserRole } from '@/types/model'

/**
 * Role-based routing config (one app, four roles).
 * - `roleHome`: where each role lands after login / from `/`.
 * - `canAccess`: per-route-prefix guard.
 *
 * Admin is NOT a superset anymore: a backend RBAC cleanup restricted every `/api/manager/**` endpoint to
 * `hasRole('MANAGER')` only (Admin tokens now get 403), and `/api/manager/availability` +
 * `/api/manager/slots/**` are `STAFF+MANAGER` only (Admin excluded there too). Admin is scoped to `/admin/**`.
 */
export const roleHome: Record<UserRole, string> = {
  Admin: '/admin/overview',
  Manager: '/dashboard',
  Staff: '/dashboard',
  // App này chỉ cho nội bộ — Driver dùng app parking-driver riêng; nếu lỡ đăng nhập ở đây thì về login.
  Driver: '/login',
}

const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: UserRole[] }> = [
  { prefix: '/admin', roles: ['Admin'] },
  // Manager-only analytics / operations
  { prefix: '/capacity', roles: ['Manager'] },
  { prefix: '/quota', roles: ['Manager'] },
  { prefix: '/pricing', roles: ['Manager'] },
  { prefix: '/reports', roles: ['Manager'] },
  { prefix: '/checkout-approvals', roles: ['Manager'] },
  { prefix: '/payments', roles: ['Manager'] },
  // Tạo tài khoản nội bộ (Manager tạo Manager/Staff).
  { prefix: '/accounts', roles: ['Manager'] },
  // Staff-only operations
  { prefix: '/check-in', roles: ['Staff'] },
  { prefix: '/check-out', roles: ['Staff'] },
  // Legacy routes (nay gộp vào /check-in + /check-out) — vẫn cho truy cập trực tiếp.
  { prefix: '/simulator', roles: ['Staff'] },
  { prefix: '/exit-payment', roles: ['Staff'] },
  // Shared console (Manager + Staff) — BE's AvailabilityController/ParkingSlotController are
  // hasAnyRole('STAFF','MANAGER') only, no Admin.
  { prefix: '/dashboard', roles: ['Manager', 'Staff'] },
  { prefix: '/slots', roles: ['Manager', 'Staff'] },
  { prefix: '/sessions', roles: ['Manager', 'Staff'] },
  { prefix: '/incidents', roles: ['Manager', 'Staff'] },
]

/**
 * Whether `role` may view `pathname`. Unguarded paths (e.g. /help) are open to any authed user —
 * this now applies to Admin too: Admin only matches the explicit `/admin` entry above, everything
 * else in `ROUTE_ROLES` deliberately omits `'Admin'` from its role list.
 */
export function canAccess(role: UserRole, pathname: string): boolean {
  const match = ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'),
  )
  return match ? match.roles.includes(role) : true
}
