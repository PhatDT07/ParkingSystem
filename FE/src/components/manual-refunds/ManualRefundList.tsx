'use client'

import { useState } from 'react'
import { useAllRefundRequests, useMarkRefundProcessed } from '@/hooks/useManualRefund'
import { Check, HandCoins } from 'lucide-react'
import { toast } from 'sonner'

export function ManualRefundList() {
  const { data: requests, isLoading } = useAllRefundRequests()
  const markProcessed = useMarkRefundProcessed()

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        Không có yêu cầu hoàn cọc nào.
      </div>
    )
  }

  const handleMarkProcessed = (id: string) => {
    if (!window.confirm("Xác nhận bạn đã chuyển khoản hoàn cọc cho tài xế này?")) return

    markProcessed.mutate(id, {
      onSuccess: () => {
        toast.success("Đã đánh dấu xử lý thành công")
      },
      onError: () => {
        toast.error("Có lỗi xảy ra, vui lòng thử lại")
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Booking</th>
              <th className="px-6 py-4 font-medium">Khách hàng</th>
              <th className="px-6 py-4 font-medium">Số tiền cọc</th>
              <th className="px-6 py-4 font-medium">Lý do & Ngân hàng</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <span className="font-mono text-blue-600 font-medium">#{req.reservationId}</span>
                  <div className="text-xs text-gray-400 mt-1">
                    Ngày yêu cầu: {new Date(req.requestedAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{req.fullName || req.username}</div>
                  <div className="text-xs text-gray-500">{req.phoneNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN').format(req.depositAmount)} ₫
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Lý do: <span className="font-normal text-gray-600">{req.reason}</span></div>
                  <div className="text-sm font-medium text-gray-700">Ngân hàng: <span className="font-normal text-gray-600">{req.bankInfo}</span></div>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'Processed' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Check className="w-3 h-3" />
                      Đã xử lý
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <HandCoins className="w-3 h-3" />
                      Chờ xử lý
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status !== 'Processed' && (
                    <button
                      onClick={() => handleMarkProcessed(req.id)}
                      disabled={markProcessed.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Đánh dấu đã chuyển khoản
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
