import type { VehicleTypeGroup } from './types'
import type { BookingQuota } from '@/types/model'

/**
 * Gom quota theo loại xe, lấy TÊN và SỨC CHỨA thật (truyền từ vehicle-types +
 * availability API). Trước đây hardcode id loại xe cố định nên với dữ liệu BE
 * (vehicleTypeId dạng số) thì tên & capacity đều sai.
 */
export function buildGroups(
  quotas: BookingQuota[],
  nameById: Record<string, string>,
  capacityById: Record<string, number>,
): VehicleTypeGroup[] {
  const byType: Record<string, BookingQuota[]> = {}
  for (const q of quotas) {
    if (!byType[q.vehicleTypeId]) byType[q.vehicleTypeId] = []
    byType[q.vehicleTypeId].push(q)
  }

  return Object.entries(byType).map(([vehicleTypeId, rows]) => {
    const capacity = capacityById[vehicleTypeId] ?? 0
    const name = nameById[vehicleTypeId] ?? vehicleTypeId
    return {
      vehicleTypeId,
      vehicleTypeName: name,
      capacity,
      rows: rows
        .slice()
        .sort((a, b) => a.windowStart.localeCompare(b.windowStart))
        .map((q) => ({
          ...q,
          quotaAbs: Math.ceil((q.quotaPercent / 100) * capacity),
          vehicleTypeName: name,
        })),
    }
  })
}
