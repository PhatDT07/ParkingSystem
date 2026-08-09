'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { INCIDENT_TYPE_LABELS } from '@/lib/constants'
import type { Incident } from '@/types/model'

interface ResolveIncidentDialogProps {
  readonly incident: Incident | null
  readonly isResolving: boolean
  readonly onConfirm: (resolutionNotes: string) => void
  readonly onClose: () => void
}

interface DialogBodyProps {
  readonly incident: Incident
  readonly isResolving: boolean
  readonly onConfirm: (resolutionNotes: string) => void
  readonly onClose: () => void
}

/** Nội dung dialog — key theo incidentId ở component cha để notes reset mỗi khi mở sự cố mới. */
function DialogBody({ incident, isResolving, onConfirm, onClose }: DialogBodyProps) {
  const [notes, setNotes] = useState('')

  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Xử lý sự cố</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-gray-700">
            {INCIDENT_TYPE_LABELS[incident.issueType]}
            {incident.slotCode ? ` · ${incident.slotCode}` : ''}
          </span>
        </DialogDescription>
      </DialogHeader>

      <p className="text-sm text-gray-600">{incident.description}</p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Ghi chú xử lý</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Mô tả cách xử lý sự cố..."
          rows={3}
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isResolving}>
          Hủy
        </Button>
        <Button className="gap-2" onClick={() => onConfirm(notes)} disabled={isResolving}>
          <CheckCircle className="h-4 w-4" />
          {isResolving ? 'Đang xử lý...' : 'Đánh dấu đã xử lý'}
        </Button>
      </div>
    </DialogContent>
  )
}

export function ResolveIncidentDialog({ incident, isResolving, onConfirm, onClose }: ResolveIncidentDialogProps) {
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      {incident && (
        <DialogBody
          key={incident.incidentId}
          incident={incident}
          isResolving={isResolving}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}
