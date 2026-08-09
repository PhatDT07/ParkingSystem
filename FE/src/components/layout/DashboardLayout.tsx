'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { User } from '@/types/model';

interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
  breadcrumbs: { label: string; href?: string }[];
  lastUpdate?: Date;
  onNewEntry?: () => void;
  onLogout?: () => void;
}

export function DashboardLayout({
  children,
  user,
  breadcrumbs,
  lastUpdate,
  onNewEntry,
  onLogout,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role}
        onNewEntry={onNewEntry}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-[280px] min-h-screen">
        <TopBar
          user={user}
          breadcrumbs={breadcrumbs}
          lastUpdate={lastUpdate}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content Area */}
        <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
