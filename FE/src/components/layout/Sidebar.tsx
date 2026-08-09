'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gauge,
  Map,
  Car,
  AlertTriangle,
  BarChart3,
  HelpCircle,
  LogOut,
  Plus,
  UserPlus,
  Sliders,
  CreditCard,
  LogIn,
  DollarSign,
  Users,
  Shield,
  ShieldCheck,
  Settings,
  ScrollText,
  MonitorDot,
  Wallet,
  HandCoins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types/model';

interface SidebarProps {
  userRole: UserRole;
  onNewEntry?: () => void;
  onLogout?: () => void;
}

const managerNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', filled: true },
  { href: '/capacity', icon: Gauge, label: 'Sức chứa' },
  { href: '/slots', icon: Map, label: 'Sơ đồ vị trí' },
  { href: '/sessions', icon: Car, label: 'Phiên hoạt động' },
  { href: '/incidents', icon: AlertTriangle, label: 'Sự cố' },
  { href: '/checkout-approvals', icon: ShieldCheck, label: 'Duyệt thanh toán' },
  { href: '/quota', icon: Sliders, label: 'Hạn mức đặt chỗ' },
  { href: '/pricing', icon: DollarSign, label: 'Quản lý giá' },
  { href: '/manual-refunds', icon: HandCoins, label: 'Hoàn cọc thủ công' },
  { href: '/reports', icon: BarChart3, label: 'Báo cáo' },
  { href: '/accounts', icon: UserPlus, label: 'Tạo tài khoản' },
];

const staffNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', filled: true },
  { href: '/slots', icon: Map, label: 'Sơ đồ vị trí' },
  { href: '/sessions', icon: Car, label: 'Phiên hoạt động' },
  { href: '/check-in', icon: LogIn, label: 'Check-in' },
  { href: '/check-out', icon: CreditCard, label: 'Check-out' },
  { href: '/incidents', icon: AlertTriangle, label: 'Sự cố' },
];

// Phân hệ Quản trị viên — Admin không còn là superset của Manager (BE 403 mọi endpoint /manager/** với
// token Admin), nên Admin chỉ thấy nav này, không còn managerNavItems.
const adminNavItems = [
  { href: '/admin/overview', icon: MonitorDot, label: 'Trung tâm Giám sát' },
  { href: '/admin/users', icon: Users, label: 'Tài khoản' },
  { href: '/admin/rbac', icon: Shield, label: 'Phân quyền' },
  { href: '/admin/system-config', icon: Settings, label: 'Cấu hình hệ thống' },
  { href: '/admin/audit-logs', icon: ScrollText, label: 'Nhật ký' },
];

export function Sidebar({ userRole, onNewEntry, onLogout }: SidebarProps) {
  const pathname = usePathname();
  // Staff: nav vận hành. Manager: nav quản lý. Admin (superset): nav quản lý + phân hệ quản trị.
  const navItems =
    userRole === 'Staff'
      ? staffNavItems
      : userRole === 'Admin'
        ? adminNavItems
        : managerNavItems;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 z-40 w-[280px] bg-gray-50 border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <span className="text-xl font-bold text-gray-900">ParkFlow Pro</span>
      </div>

      {/* New Entry Button (Staff only) */}
      {userRole === 'Staff' && onNewEntry && (
        <Button
          onClick={onNewEntry}
          className="w-full mb-4 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nhập thủ công
        </Button>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 border-t border-gray-200 space-y-1 pr-2">
        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-all rounded-lg text-sm"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Trợ giúp</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-all rounded-lg text-sm"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
