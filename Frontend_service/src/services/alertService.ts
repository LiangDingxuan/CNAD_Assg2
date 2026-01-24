import type { AlertSchedule } from '@/types/alert'

const ALERT_API = import.meta.env.VITE_ALERT_API || 'http://localhost:3003'

// TODO: Wire to alert service when ready — currently stubs
export async function getUpcomingAlerts(userId: string): Promise<AlertSchedule[]> {
  const res = await fetch(`${ALERT_API}/api/schedules/upcoming?userId=${userId}`)
  if (!res.ok) throw new Error('Failed to fetch upcoming alerts')
  const data = await res.json()
  return data.data
}

export async function snoozeAlert(scheduleId: string): Promise<void> {
  // TODO: Alert service does not yet have a snooze endpoint.
  // Expected: PATCH /api/schedules/:id/snooze
  await fetch(`${ALERT_API}/api/schedules/${scheduleId}/snooze`, { method: 'PATCH' })
}

export async function completeAlert(scheduleId: string): Promise<void> {
  // TODO: Alert service does not yet have a complete endpoint.
  // Expected: PATCH /api/schedules/:id/complete
  await fetch(`${ALERT_API}/api/schedules/${scheduleId}/complete`, { method: 'PATCH' })
}
