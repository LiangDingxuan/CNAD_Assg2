export interface AlertSchedule {
  _id: string
  taskId: string
  userId: string | null
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  time: string
  days?: number[]
  isActive: boolean
  nextAlert: string | null
  lastAlerted: string | null
}

export interface AlarmData {
  taskName: string
  taskIcon: string
  scheduledTime: string
}
