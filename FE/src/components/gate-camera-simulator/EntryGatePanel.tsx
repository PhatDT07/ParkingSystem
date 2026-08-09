'use client'

import { useEntryGate } from './useEntryGate'
import {
  EntryStatusBadge,
  EntryCameraFeed,
  ScanInput,
  ManualEntryPanel,
  PlateMismatchPanel,
  FullPanel,
  DuplicatePanel,
  AdmittedPanel,
} from './EntryGateParts'
import type { EntryGatePanelProps } from './types'

export function EntryGatePanel({ failureRate, onEvent }: EntryGatePanelProps) {
  const g = useEntryGate(failureRate, onEvent)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="material-symbols-outlined text-green-600">login</span>
          Cổng Vào (IN-01)
        </h3>
        <EntryStatusBadge state={g.state} />
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <EntryCameraFeed state={g.state} scannedPlate={g.scannedPlate} failureRate={failureRate} />

        {(g.state === 'IDLE' || g.state === 'SCANNING') && (
          <ScanInput
            scannedPlate={g.scannedPlate}
            onPlateChange={g.setScannedPlate}
            onScan={g.scan}
            disabled={g.isLoading}
          />
        )}

        {g.state === 'SCAN_FAILED' && (
          <ManualEntryPanel
            manualPlate={g.manualPlate}
            onPlateChange={g.setManualPlate}
            onSubmit={g.submitManual}
            onForce={g.forceViaQr}
            disabled={g.isLoading}
          />
        )}

        {g.state === 'PLATE_MISMATCH' && (
          <PlateMismatchPanel
            scannedPlate={g.scannedPlate}
            forceReason={g.forceReason}
            onReasonChange={g.setForceReason}
            onOverride={g.staffOverride}
            onCancel={g.reset}
            disabled={g.isLoading}
          />
        )}

        {g.state === 'FULL' && <FullPanel onReset={g.reset} />}
        {g.state === 'DUPLICATE' && <DuplicatePanel onReset={g.reset} />}
        {g.state === 'ADMITTED' && <AdmittedPanel onReset={g.reset} />}
      </div>
    </section>
  )
}
