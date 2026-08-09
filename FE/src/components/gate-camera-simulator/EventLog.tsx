'use client'

import { cn } from '@/lib/utils'
import type { EventLogProps, EventKind } from './types'

const KIND_META: Record<EventKind, { label: string; color: string; border: string }> = {
  ENTRY: { label: 'VÀO',   color: 'text-green-600',  border: 'border-green-500' },
  EXIT:  { label: 'RA',    color: 'text-blue-600',   border: 'border-blue-500'  },
  ERROR: { label: 'LỖI',   color: 'text-red-600',    border: 'border-red-500'   },
  SLOT:  { label: 'Ô ĐỖ',  color: 'text-purple-600', border: 'border-purple-500'},
  FORCE: { label: 'FORCE', color: 'text-orange-600', border: 'border-orange-500'},
  SYS:   { label: 'SYS',   color: 'text-gray-500',   border: 'border-gray-300'  },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function EventLog({ entries }: EventLogProps) {
  return (
    <section
      className="bg-gray-900 rounded-xl border border-gray-700 flex flex-col h-48 overflow-hidden shrink-0"
      aria-label="Nhật ký sự kiện"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/60">
        <h3 className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <span className="material-symbols-outlined text-sm">terminal</span>
          event_log.sh
        </h3>
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
      </div>

      <ol className="flex-1 overflow-y-auto p-2 space-y-0.5" aria-live="polite" aria-atomic="false">
        {entries.length === 0 && (
          <li className="text-xs font-mono text-gray-500 px-1 py-1">Chưa có sự kiện…</li>
        )}
        {[...entries].reverse().map((e) => {
          const meta = KIND_META[e.kind]
          return (
            <li
              key={e.id}
              className={cn(
                'flex gap-2 items-start px-2 py-1 rounded border-l-2 text-xs font-mono text-gray-300 hover:bg-white/5 transition-colors',
                meta.border,
              )}
            >
              <span className="text-gray-500 shrink-0 w-20">[{fmt(e.ts)}]</span>
              <span className={cn('shrink-0 w-14 font-bold', meta.color)}>{meta.label}</span>
              <span className="truncate">
                {e.message}
                {e.plate && (
                  <span className="ml-1 text-yellow-400">{e.plate}</span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
