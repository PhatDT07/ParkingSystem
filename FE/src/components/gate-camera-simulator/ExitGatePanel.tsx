'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useExitScan } from '@/hooks/useGateSim'
import type { ExitGatePanelProps, ExitState, EventLogEntry, ExitScanResult } from './types'

function mkEvent(partial: Omit<EventLogEntry, 'id' | 'ts'>): EventLogEntry {
  return { ...partial, id: crypto.randomUUID(), ts: new Date().toISOString() }
}

function fmtVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function fmtDuration(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function ExitGatePanel({ failureRate, onEvent }: ExitGatePanelProps) {
  const [state, setState] = useState<ExitState>('IDLE')
  const [plate, setPlate] = useState('30G-123.45')
  const [result, setResult] = useState<ExitScanResult | null>(null)

  const exitScan = useExitScan(failureRate)

  async function handleScan() {
    setState('SCANNING')
    try {
      const res = await exitScan.mutateAsync({ licensePlate: plate })
      setResult(res)
      setState('READY')
      onEvent(mkEvent({
        kind: 'EXIT',
        message: `Cổng OUT-02: Quét ra thành công. Phí: ${fmtVnd(res.totalFee)}`,
        plate: res.licensePlate,
      }))
    } catch {
      setState('SCAN_FAILED')
      onEvent(mkEvent({ kind: 'ERROR', message: 'Cổng OUT-02: Quét biển số ra thất bại.', plate }))
    }
  }

  function handleReset() {
    setState('IDLE')
    setResult(null)
  }

  const isLoading = exitScan.isPending

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="material-symbols-outlined text-blue-600">logout</span>
          Cổng Ra (OUT-02)
        </h3>
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${
          state === 'READY'       ? 'bg-blue-100 text-blue-700' :
          state === 'SCAN_FAILED' ? 'bg-red-100 text-red-700' :
          state === 'SCANNING'    ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-500'
        }`}>
          {state === 'IDLE'        && 'Chờ quét'}
          {state === 'SCANNING'    && 'Đang quét…'}
          {state === 'SCAN_FAILED' && 'Quét lỗi'}
          {state === 'READY'       && 'Sẵn sàng TT'}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Camera feed mock */}
        <div className="relative bg-gray-900 rounded-lg h-40 overflow-hidden border border-gray-700 flex items-center justify-center">
          {state === 'IDLE' || state === 'SCANNING' ? (
            <>
              <span className="material-symbols-outlined text-5xl text-gray-600">videocam</span>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <span className="bg-black/70 border border-yellow-500/60 px-2 py-0.5 rounded font-mono text-yellow-400 text-sm">{plate}</span>
              </div>
            </>
          ) : state === 'READY' && result ? (
            <>
              <span className="material-symbols-outlined text-5xl text-gray-600">videocam</span>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <span className="bg-black/70 border border-green-500/60 px-2 py-0.5 rounded font-mono text-green-400 text-sm">{result.licensePlate}</span>
                <span className="text-xs font-mono text-green-400 bg-black/60 px-1 rounded">Khớp DB</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <span className="material-symbols-outlined text-4xl">videocam_off</span>
              <span className="text-xs font-mono">Quét thất bại</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-black/60 text-white text-[10px] font-mono px-1 rounded">CAM_OUT_02</span>
          </div>
        </div>

        {/* Plate input + scan */}
        {(state === 'IDLE' || state === 'SCANNING') && (
          <div className="flex gap-2">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Biển số cổng ra"
              disabled={isLoading}
            />
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">document_scanner</span>
              Quét
            </button>
          </div>
        )}

        {/* Scan failed */}
        {state === 'SCAN_FAILED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-red-700 font-semibold text-sm">Quét biển số thất bại</p>
            <button onClick={handleReset} className="mt-2 text-xs text-gray-500 hover:underline">Thử lại</button>
          </div>
        )}

        {/* Ready — show fee and payment */}
        {state === 'READY' && result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600">
                Thời gian đỗ: <span className="font-semibold text-gray-800">{fmtDuration(result.durationHours)}</span>
              </span>
              <span className="font-mono text-xl font-bold text-blue-700">{fmtVnd(result.totalFee)}</span>
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              {result.paymentMethods.map((m) => (
                <span key={m} className="bg-white border border-gray-200 rounded px-2 py-0.5">{m}</span>
              ))}
            </div>
            <button
              onClick={() => {
                onEvent(mkEvent({ kind: 'EXIT', message: `Thanh toán: ${fmtVnd(result.totalFee)}. Xe ra.`, plate: result.licensePlate }))
                toast.success('Chuyển sang màn hình thanh toán.')
                handleReset()
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Chuyển sang Thanh toán
            </button>
            <button onClick={handleReset} className="text-xs text-gray-400 hover:underline text-center">Huỷ</button>
          </div>
        )}
      </div>
    </section>
  )
}
