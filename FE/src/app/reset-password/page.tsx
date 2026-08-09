'use client'

import { AuthShell } from '@/components/auth/AuthShell'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <AuthShell
      heading="Đặt lại mật khẩu"
      subheading="Nhập mã OTP đã gửi tới email và mật khẩu mới để tiếp tục."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đặt lại mật khẩu</h2>
        <p className="text-sm text-gray-600">
          Nhập mã OTP 6 số vừa được gửi tới email của bạn, sau đó đặt mật khẩu mới.
        </p>
      </div>
      <ResetPasswordForm />
    </AuthShell>
  )
}
