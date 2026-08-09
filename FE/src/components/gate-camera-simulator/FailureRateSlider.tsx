'use client'

import type { FailureRateSliderProps } from './types'

export function FailureRateSlider({ value, onChange }: FailureRateSliderProps) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
      <span className="material-symbols-outlined text-xl text-gray-500">tune</span>
      <label htmlFor="failure-rate" className="text-sm font-medium text-gray-600 whitespace-nowrap">
        Tỉ lệ lỗi quét
      </label>
      <input
        id="failure-rate"
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-red-500"
        aria-label="Tỉ lệ lỗi quét ALPR"
      />
      <span className="text-sm font-bold text-red-500 w-9 text-right font-mono">
        {value}%
      </span>
    </div>
  )
}
