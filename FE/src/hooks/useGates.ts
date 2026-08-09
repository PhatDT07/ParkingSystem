import { useQuery, type QueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BeGate } from '@/lib/beApi'
import { useGateStore } from '@/store'

/** Danh sách cổng vào/ra — GET /gates. */
export function useGates() {
  return useQuery({
    queryKey: ['gates'],
    queryFn: () => api.get<BeGate[]>('/gates'),
    staleTime: 5 * 60 * 1000,
  })
}

export interface FloorOption {
  floorId: number
  floorName: string
}

/** Danh sách tầng duy nhất suy ra từ danh sách cổng — mỗi tầng có ít nhất 1 cổng. */
export function distinctFloors(gates: BeGate[]): FloorOption[] {
  const seen = new Map<number, string>()
  for (const g of gates) {
    if (g.floorId != null && !seen.has(g.floorId)) {
      seen.set(g.floorId, g.floorName ?? `Tầng #${g.floorId}`)
    }
  }
  return Array.from(seen.entries()).map(([floorId, floorName]) => ({ floorId, floorName }))
}

/**
 * Lấy id một cổng theo loại (Entry/Exit): ưu tiên cache ['gates'], chưa có thì fetch.
 * Fallback về 1 nếu BE chưa seed cổng nào (tránh chặn luồng demo).
 */
export async function resolveGateId(
  queryClient: QueryClient,
  type: 'Entry' | 'Exit',
): Promise<number> {
  const gates = await getGatesFromCacheOrFetch(queryClient)
  const match = gates.find((g) => g.gateType === type) ?? gates[0]
  return match ? match.gateId : 1
}

/**
 * Lấy id cổng theo loại (Entry/Exit) TRÊN TẦNG staff đang trực (useGateStore) — tầng chọn
 * một lần đầu ca, đúng loại cổng suy ra tự động theo hành động (check-in -> Entry, check-out
 * -> Exit). Chưa chọn tầng, hoặc tầng đó thiếu cổng đúng loại (vd tầng chỉ có 1 cổng) thì rơi
 * về resolveGateId (cổng đầu tiên đúng loại, không phân biệt tầng) để không chặn luồng.
 */
export async function resolveFloorGateId(
  queryClient: QueryClient,
  type: 'Entry' | 'Exit',
): Promise<number> {
  const floorId = useGateStore.getState().floorId
  if (floorId != null) {
    const gates = await getGatesFromCacheOrFetch(queryClient)
    const match = gates.find((g) => g.floorId === floorId && g.gateType === type)
    if (match) return match.gateId
  }
  return resolveGateId(queryClient, type)
}

async function getGatesFromCacheOrFetch(queryClient: QueryClient): Promise<BeGate[]> {
  let gates = queryClient.getQueryData<BeGate[]>(['gates'])
  if (!gates || gates.length === 0) {
    try {
      gates = await api.get<BeGate[]>('/gates')
      queryClient.setQueryData(['gates'], gates)
    } catch {
      gates = []
    }
  }
  return gates
}
