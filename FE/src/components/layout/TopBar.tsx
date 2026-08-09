'use client';

import { Menu, ChevronRight } from 'lucide-react';
import { USER_ROLE_LABELS } from '@/lib/constants';
import { useNow } from '@/hooks/useNow';
import type { User } from '@/types/model';
import { GateSwitcher } from './GateSwitcher';

interface TopBarProps {
  user: User;
  breadcrumbs: { label: string; href?: string }[];
  lastUpdate?: Date;
  onMenuClick?: () => void;
}

export function TopBar({ user, breadcrumbs, lastUpdate, onMenuClick }: TopBarProps) {
  const now = useNow();
  const timeSinceUpdate =
    lastUpdate && now !== null ? Math.floor((now - lastUpdate.getTime()) / 1000) : null;

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-white shadow-sm border-b border-gray-200">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {crumb.href ? (
                <a href={crumb.href} className="text-gray-600 hover:text-blue-600">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 font-semibold">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Status & User */}
      <div className="flex items-center gap-4">
        <GateSwitcher />

        {/* Live Update Indicator */}
        {timeSinceUpdate !== null && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-xs text-gray-600 font-mono">
              Cập nhật {timeSinceUpdate} giây trước
            </span>
          </div>
        )}

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">
              {user.fullName}
            </p>
            <p className="text-xs text-gray-600 uppercase tracking-tight">
              {USER_ROLE_LABELS[user.role]}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center">
            <span className="text-gray-600 font-semibold text-sm">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
