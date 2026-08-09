'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { HelpCircle, Mail, Phone, BookOpen } from 'lucide-react'

const faqs = [
  {
    q: 'Tôi quên mật khẩu thì làm thế nào?',
    a: 'Tại màn hình đăng nhập, chọn "Quên mật khẩu", nhập tên đăng nhập. Nếu tài khoản có email, hướng dẫn đặt lại sẽ được gửi tới hộp thư (liên kết có hiệu lực 15 phút).',
  },
  {
    q: 'Phiên đăng nhập hết hạn khi đang thao tác?',
    a: 'Token đăng nhập có hiệu lực 2 giờ. Khi hết hạn, hệ thống tự động đưa về màn hình đăng nhập — chỉ cần đăng nhập lại để tiếp tục.',
  },
  {
    q: 'Nhập xe thủ công khi nào?',
    a: 'Khi camera không đọc được biển số hoặc biển số không khớp booking, nhân viên dùng nút "Nhập thủ công" ở thanh bên để ghi nhận biển số thực tế.',
  },
  {
    q: 'Không tìm thấy chỗ trống cho khách vãng lai?',
    a: 'Hệ thống chặn khách vãng lai khi sức chứa còn lại (đã trừ xe trong bãi và booking chưa vào) bằng 0. Xe có đặt chỗ vẫn luôn được vào.',
  },
]

export default function HelpPage() {
  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trợ giúp &amp; Hỗ trợ</h1>
            <p className="text-sm text-gray-500">
              Câu hỏi thường gặp và kênh liên hệ khi cần hỗ trợ vận hành.
            </p>
          </div>
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Email hỗ trợ</div>
              <div className="text-sm font-medium text-gray-900">support@parking.vn</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <Phone className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Hotline</div>
              <div className="text-sm font-medium text-gray-900">1900 1234</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Tài liệu</div>
              <div className="text-sm font-medium text-gray-900">Hướng dẫn sử dụng</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">
            Câu hỏi thường gặp
          </h2>
          <ul className="divide-y divide-gray-100">
            {faqs.map((item) => (
              <li key={item.q} className="px-5 py-4">
                <p className="text-sm font-medium text-gray-900">{item.q}</p>
                <p className="mt-1 text-sm text-gray-600">{item.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  )
}
