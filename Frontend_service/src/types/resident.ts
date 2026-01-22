export interface HouseholdUser {
  id: string
  name: string
  avatarEmoji: string
  streak: number
  points: number
}

export type TaskStatus = 'completed' | 'upcoming' | 'due_now' | 'overdue'

export interface TabletTask {
  id: string
  name: string
  icon: string
  scheduledTime: string
  completedTime?: string
  status: TaskStatus
}
