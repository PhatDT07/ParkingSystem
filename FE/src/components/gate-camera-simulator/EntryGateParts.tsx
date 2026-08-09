'use client'

import type { EntryState } from './types'

export function EntryStatusBadge({ state }: { state: EntryState }) {
  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${
        state === 'ADMITTED'
          ? 'bg-green-100 text-green-700'
          : state === 'FULL'
            ? 'bg-red-100 text-red-700 animate-pulse'
            : state === 'DUPLICATE'
              ? 'bg-red-100 text-red-700 animate-pulse'
              : state === 'SCAN_FAILED'
                ? 'bg-yellow-100 text-yellow-700'
                : state === 'PLATE_MISMATCH'
                  ? 'bg-orange-100 text-orange-700'
                  : state === 'SCANNING'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
      }`}
    >
      {state === 'IDLE' && 'Chờ quét'}
      {state === 'SCANNING' && 'Đang quét…'}
      {state === 'SCAN_FAILED' && 'Quét lỗi'}
      {state === 'PLATE_MISMATCH' && 'Không khớp'}
      {state === 'FULL' && 'HẾT CHỖ'}
      {state === 'DUPLICATE' && 'ĐÃ TRONG BÃI'}
      {state === 'ADMITTED' && 'Đã vào'}
    </span>
  )
}

export function EntryCameraFeed({
  state,
  scannedPlate,
  failureRate,
}: {
  state: EntryState
  scannedPlate: string
  failureRate: number
}) {
  return (
    <div className="relative bg-gray-900 rounded-lg h-40 overflow-hidden border border-gray-700 flex items-center justify-center">
      <span className="material-symbols-outlined text-5xl text-gray-600">videocam</span>
      {state !== 'SCAN_FAILED' && (
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
          <span className="bg-black/70 border border-yellow-500/60 px-2 py-0.5 rounded font-mono text-yellow-400 text-sm">
            {scannedPlate}
          </span>
          <span className="text-xs font-mono text-green-400 bg-black/60 px-1 rounded">
            Conf: {Math.max(10, 98 - failureRate)}%
          </span>
        </div>
      )}
      {state === 'SCAN_FAILED' && (
        <div className="absolute inset-4 border-2 border-dashed border-red-500/70 rounded flex items-center justify-center">
          <span className="bg-red-700 text-white text-xs font-mono px-2 py-1 rounded">UNREADABLE</span>
        </div>
      )}
      {state === 'FULL' && (
        <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
          <span className="text-white text-2xl font-black tracking-widest">HẾT CHỖ</span>
        </div>
      )}
      {state === 'DUPLICATE' && (
        <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-center px-4">
          <span className="text-white text-lg font-black tracking-wide">
            BIỂN SỐ XE ĐÃ CÓ TRONG BÃI, HÃY KIỂM TRA LẠI
          </span>
        </div>
      )}
      {state === 'ADMITTED' && (
        <div className="absolute inset-0 bg-green-900/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-300 text-5xl">check_circle</span>
        </div>
      )}
      <div className="absolute top-2 left-2 flex gap-1">
        <span className="bg-black/60 text-white text-[10px] font-mono px-1 rounded">CAM_IN_01</span>
      </div>
    </div>
  )
}

export function ScanInput({
  scannedPlate,
  onPlateChange,
  onScan,
  disabled,
}: {
  scannedPlate: string
  onPlateChange: (v: string) => void
  onScan: () => void
  disabled: boolean
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={scannedPlate}
        onChange={(e) => onPlateChange(e.target.value.toUpperCase())}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Biển số nhận diện"
        disabled={disabled}
      />
      <button
        onClick={onScan}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">document_scanner</span>
        Quét
      </button>
    </div>
  )
}

export function ManualEntryPanel({
  manualPlate,
  onPlateChange,
  onSubmit,
  onForce,
  disabled,
}: {
  manualPlate: string
  onPlateChange: (v: string) => void
  onSubmit: () => void
  onForce: () => void
  disabled: boolean
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col gap-2">
      <p className="text-sm font-semibold text-yellow-800 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">edit_document</span>
        Nhập tay biển số
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={manualPlate}
          onChange={(e) => onPlateChange(e.target.value.toUpperCase())}
          placeholder="VD: 30G-123.45"
          className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label="Nhập tay biển số"
          disabled={disabled}
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !manualPlate.trim()}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          Gửi
        </button>
      </div>
      <button
        onClick={onForce}
        disabled={disabled}
        className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
        Force Check-in (Quét QR)
      </button>
    </div>
  )
}

export function PlateMismatchPanel({
  scannedPlate,
  forceReason,
  onReasonChange,
  onOverride,
  onCancel,
  disabled,
}: {
  scannedPlate: string
  forceReason: string
  onReasonChange: (v: string) => void
  onOverride: () => void
  onCancel: () => void
  disabled: boolean
}) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col gap-2">
      <p className="text-sm font-semibold text-orange-800 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">warning</span>
        Biển số không khớp đặt chỗ
      </p>
      <p className="text-xs text-orange-700">
        Biển số <span className="font-mono font-bold">{scannedPlate}</span> không tìm thấy đặt chỗ tương ứng.
      </p>
      <p className="text-xs text-gray-600">Nhân viên có thể ghi đè (hành động sẽ được ghi vào audit log):</p>
      <textarea
        value={forceReason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Lý do ghi đè (tuỳ chọn)…"
        rows={2}
        disabled={disabled}
        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />
      <button
        onClick={onOverride}
        disabled={disabled}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">edit_note</span>
        Ghi đè biển số (Có audit log)
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:underline text-center">
        Huỷ / Thử lại
      </button>
    </div>
  )
}

export function FullPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-center">
      <p className="text-red-700 font-bold text-lg">HẾT CHỖ</p>
      <p className="text-red-600 text-sm mt-1">Bãi xe không còn chỗ trống. Từ chối xe vào.</p>
      <button onClick={onReset} className="mt-3 text-xs text-gray-500 hover:underline">
        Đặt lại
      </button>
    </div>
  )
}

export function DuplicatePanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-center">
      <p className="text-red-700 font-bold text-lg">Biển số xe đã có trong bãi, hãy kiểm tra lại</p>
      <p className="text-red-600 text-sm mt-1">Biển số này đang có một phiên đỗ khác chưa check-out.</p>
      <button onClick={onReset} className="mt-3 text-xs text-gray-500 hover:underline">
        Đặt lại
      </button>
    </div>
  )
}

export function AdmittedPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
      <p className="text-green-700 font-bold flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        Xe đã vào thành công
      </p>
      <button onClick={onReset} className="mt-2 text-xs text-gray-500 hover:underline">
        Đặt lại
      </button>
    </div>
  )
}
