import type { HouseholdUser, TabletTask } from '@/types/resident'

export const mockHouseholdUsers: HouseholdUser[] = [
  {
    id: 'john',
    name: 'John Smith',
    avatarEmoji: '👨',
    streak: 12,
    points: 1240,
  },
  {
    id: 'sarah',
    name: 'Sarah Smith',
    avatarEmoji: '👩',
    streak: 8,
    points: 890,
  },
]

export const mockTasksForJohn: TabletTask[] = [
  {
    id: 't1',
    name: 'Morning Medication',
    icon: '💊',
    scheduledTime: '08:00',
    completedTime: '08:05',
    status: 'completed',
  },
  {
    id: 't2',
    name: 'Breakfast',
    icon: '🍽️',
    scheduledTime: '09:00',
    completedTime: '09:10',
    status: 'completed',
  },
  {
    id: 't3',
    name: 'Hygiene Routine',
    icon: '🪥',
    scheduledTime: '10:00',
    completedTime: '10:15',
    status: 'completed',
  },
  {
    id: 't4',
    name: 'Lunch',
    icon: '🍽️',
    scheduledTime: '12:00',
    status: 'upcoming',
  },
  {
    id: 't5',
    name: 'Afternoon Activity',
    icon: '⏰',
    scheduledTime: '15:00',
    status: 'upcoming',
  },
  {
    id: 't6',
    name: 'Evening Medication',
    icon: '💊',
    scheduledTime: '18:00',
    status: 'upcoming',
  },
]

export function getUserById(id: string): HouseholdUser | undefined {
  return mockHouseholdUsers.find((u) => u.id === id)
}

export function getTasksForUser(userId: string): TabletTask[] {
  if (userId === 'john') return mockTasksForJohn
  return mockTasksForJohn.map((t) => ({
    ...t,
    status: t.status === 'completed' ? 'completed' : 'upcoming',
  })) as TabletTask[]
}
