export type ResidentStatus = 'good' | 'warning' | 'alert'
export type TaskStatus = 'completed' | 'snoozed' | 'pending' | 'overdue'

export interface Badge {
  id: string
  name: string
  icon: string
}

export interface Resident {
  id: string
  name: string
  unit: string
  avatarUrl?: string
  status: ResidentStatus
  tasksCompleted: number
  tasksTotal: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  badges: Badge[]
}

export interface Task {
  id: string
  name: string
  scheduledTime: string
  completedTime?: string
  status: TaskStatus
}
