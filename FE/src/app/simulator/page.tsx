'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { GateCameraSimulator } from '@/components/gate-camera-simulator'

export default function SimulatorPage() {
  return (
    <ProtectedLayout>
      <GateCameraSimulator />
    </ProtectedLayout>
  )
}
