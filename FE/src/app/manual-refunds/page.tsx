import { ManualRefundList } from '@/components/manual-refunds/ManualRefundList'
import { HandCoins } from 'lucide-react'

export default function ManualRefundsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <HandCoins className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoàn cọc thủ công</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các yêu cầu hoàn cọc từ tài xế. Vui lòng chuyển khoản thủ công cho tài xế, sau đó đánh dấu "Đã chuyển khoản".
          </p>
        </div>
      </div>

      <ManualRefundList />
    </div>
  )
}
