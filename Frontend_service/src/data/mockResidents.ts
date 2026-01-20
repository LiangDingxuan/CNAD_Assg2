import type { Resident, Task } from '@/types/staff'

// Temporary mock data - will be replaced with MongoDB data
export const mockResidents: Resident[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    unit: 'Unit A',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    status: 'good',
    tasksCompleted: 6,
    tasksTotal: 6,
    currentStreak: 12,
    longestStreak: 12,
    totalPoints: 720,
    badges: [
      { id: 'b1', name: 'Perfect Week', icon: 'sparkles' },
      { id: 'b2', name: 'Early Bird', icon: 'sunrise' },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    unit: 'Unit A',
    avatarUrl: 'https://i.pravatar.cc/150?u=michael',
    status: 'warning',
    tasksCompleted: 4,
    tasksTotal: 6,
    currentStreak: 5,
    longestStreak: 18,
    totalPoints: 520,
    badges: [{ id: 'b3', name: 'Team Player', icon: 'users' }],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    unit: 'Unit B',
    avatarUrl: 'https://i.pravatar.cc/150?u=emily',
    status: 'warning',
    tasksCompleted: 3,
    tasksTotal: 6,
    currentStreak: 2,
    longestStreak: 8,
    totalPoints: 310,
    badges: [{ id: 'b4', name: 'First Steps', icon: 'footprints' }],
  },
  {
    id: '4',
    name: 'David Thompson',
    unit: 'Unit B',
    avatarUrl: 'https://i.pravatar.cc/150?u=david',
    status: 'warning',
    tasksCompleted: 5,
    tasksTotal: 6,
    currentStreak: 8,
    longestStreak: 14,
    totalPoints: 480,
    badges: [
      { id: 'b5', name: 'Consistent', icon: 'target' },
      { id: 'b6', name: 'Team Player', icon: 'users' },
    ],
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    unit: 'Unit C',
    avatarUrl: 'https://i.pravatar.cc/150?u=lisa',
    status: 'good',
    tasksCompleted: 6,
    tasksTotal: 6,
    currentStreak: 15,
    longestStreak: 15,
    totalPoints: 890,
    badges: [
      { id: 'b7', name: 'Perfect Week', icon: 'sparkles' },
      { id: 'b8', name: 'Early Bird', icon: 'sunrise' },
      { id: 'b9', name: 'Superstar', icon: 'star' },
    ],
  },
  {
    id: '6',
    name: 'Robert Martinez',
    unit: 'Unit C',
    avatarUrl: 'https://i.pravatar.cc/150?u=robert',
    status: 'alert',
    tasksCompleted: 2,
    tasksTotal: 6,
    currentStreak: 1,
    longestStreak: 5,
    totalPoints: 150,
    badges: [],
  },
]

// Tasks for Michael Chen (id: '2')
export const mockTasksForMichael: Task[] = [
  {
    id: 't1',
    name: 'Morning Medication',
    scheduledTime: '08:00',
    completedTime: '08:15',
    status: 'completed',
  },
  {
    id: 't2',
    name: 'Breakfast',
    scheduledTime: '09:00',
    status: 'snoozed',
  },
  {
    id: 't3',
    name: 'Hygiene Routine',
    scheduledTime: '10:00',
    completedTime: '10:30',
    status: 'completed',
  },
  {
    id: 't4',
    name: 'Lunch',
    scheduledTime: '12:00',
    completedTime: '12:15',
    status: 'completed',
  },
  {
    id: 't5',
    name: 'Afternoon Activity',
    scheduledTime: '15:00',
    status: 'pending',
  },
  {
    id: 't6',
    name: 'Evening Medication',
    scheduledTime: '18:00',
    completedTime: '18:10',
    status: 'completed',
  },
]

export function getResidentById(id: string): Resident | undefined {
  return mockResidents.find((r) => r.id === id)
}

export function getTasksForResident(residentId: string): Task[] {
  if (residentId === '2') return mockTasksForMichael
  // Return generic tasks for other residents
  return mockTasksForMichael.map((t) => ({ ...t, status: 'completed' as const }))
}
