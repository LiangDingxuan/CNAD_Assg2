import { useEffect, useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { ResidentCard } from '@/components/staff/ResidentCard'
import type { Resident } from '@/types/staff'
import { createTask, listTasks } from '@/services/taskService'
import * as accountService from '@/services/accountService'

export function DashboardPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadResidents() {
      try {
        const [users, units] = await Promise.all([
          accountService.listUsers({ role: 'resident' }),
          accountService.listUnits({ isActive: true })
        ])
        if (!isMounted) return

        const unitMap = new Map(units.map((unit) => [unit.id, unit.unitNumber]))
        const taskResults = await Promise.all(users.map((user) => listTasks(user.id).catch(() => [])))

        const mapped: Resident[] = users.map((user, index) => {
          const tasks = taskResults[index] || []
          const tasksTotal = tasks.length
          const tasksCompleted = tasks.filter((task) => task.status === 'completed').length

          return {
            id: user.id,
            name: user.username,
            unit: user.unitId ? `Unit ${unitMap.get(user.unitId) || user.unitId}` : 'Unassigned',
            status: 'good',
            tasksCompleted,
            tasksTotal,
            currentStreak: 0,
            longestStreak: 0,
            totalPoints: 0,
            badges: []
          }
        })

        setResidents(mapped)
        setLoadError(null)
      } catch (err: any) {
        if (!isMounted) return
        setLoadError(err?.message || 'Failed to load residents')
      }
    }

    loadResidents()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleCreateTask(
    residentId: string,
    payload: { name: string; description: string; scheduledTime: string }
  ) {
    await createTask({ userId: residentId, ...payload })
    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              tasksTotal: resident.tasksTotal + 1,
            }
          : resident
      )
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="container mx-auto px-4 py-6">
        {loadError && <p className="text-sm text-destructive mb-4">{loadError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map((resident) => (
            <ResidentCard
              key={resident.id}
              resident={resident}
              onCreateTask={handleCreateTask}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
