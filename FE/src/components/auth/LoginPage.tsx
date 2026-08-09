'use client';

import Image from 'next/image';
import { Car } from 'lucide-react';
import { LoginForm } from './LoginForm';

interface LoginPageProps {
  onLogin: (email: string, password: string, remember: boolean) => void;
  isLoading?: boolean;
}

export function LoginPage({ onLogin, isLoading = false }: LoginPageProps) {
  return (
    <div className="h-screen w-full overflow-hidden flex">
      {/* Left Panel (40%) - Hidden on mobile */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-blue-500 to-blue-800 flex-col justify-between p-8 relative overflow-hidden">
        {/* Subtle Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="z-10 mt-8">
          <div className="h-12 mb-8 flex items-center">
            <span className="text-white text-2xl font-bold">ParkFlow Pro</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Chào mừng bạn quay trở lại
          </h1>
          <p className="text-lg text-blue-100">
            Hệ thống quản lý bãi đỗ xe thông minh
          </p>
        </div>

        <div className="z-10 mb-8 relative">
          <div className="absolute -right-20 -bottom-20 opacity-20 transform rotate-12 scale-150">
            <Car className="w-48 h-48 text-white" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Right Panel (60%) */}
      <div className="w-full lg:w-3/5 bg-white flex flex-col justify-center items-center p-4 sm:p-8 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden">
          <span className="text-blue-600 text-xl font-bold">ParkFlow Pro</span>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Đăng nhập
            </h2>
            <p className="text-sm text-gray-600">
              Vui lòng nhập thông tin để truy cập hệ thống quản lý.
            </p>
          </div>

          <LoginForm onSubmit={onLogin} isLoading={isLoading} />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-gray-500 font-mono">
            © 2026 ParkFlow Pro. Phiên bản 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
