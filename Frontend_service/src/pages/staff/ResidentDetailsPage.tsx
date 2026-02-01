import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Flame, Trophy, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskTimeline } from '@/components/staff/TaskTimeline'
import { TaskList } from '@/components/staff/TaskList'
import { listTasks } from '@/services/taskService'
import * as accountService from '@/services/accountService'
import type { Task, Resident } from '@/types/staff'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  suffix?: string
}

function StatCard({ label, value, icon, suffix }: StatCardProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

export function ResidentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [resident, setResident] = useState<Resident | null>(null)
  const [residentError, setResidentError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksError, setTasksError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadResident() {
      if (!id) return
      try {
        const [user, units] = await Promise.all([
          accountService.getUser(id),
          accountService.listUnits({ isActive: true })
        ])
        if (!isMounted) return
        const unitMap = new Map(units.map((unit) => [unit.id, unit.unitNumber]))

        const mapped: Resident = {
          id: user.id,
          name: user.username,
          unit: user.unitId ? `Unit ${unitMap.get(user.unitId) || user.unitId}` : 'Unassigned',
          status: 'good',
          tasksCompleted: 0,
          tasksTotal: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalPoints: 0,
          badges: []
        }
        setResident(mapped)
        setResidentError(null)
      } catch (err: any) {
        if (!isMounted) return
        setResidentError(err?.message || 'Resident not found')
      }
    }

    async function loadTasks() {
      if (!id) return
      try {
        const data = await listTasks(id)
        if (!isMounted) return
        const mapped: Task[] = data.map((item) => ({
          id: item._id || item.id || '',
          name: item.name,
          scheduledTime: item.scheduledTime,
          status: (item.status as Task['status']) || 'pending'
        }))
        setTasks(mapped)
        setTasksError(null)
      } catch (err: any) {
        if (!isMounted) return
        setTasksError(err?.message || 'Failed to load tasks')
      }
    }

    loadResident()
    loadTasks()
    return () => {
      isMounted = false
    }
  }, [id])

  if (!resident || residentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{residentError || 'Resident not found'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/staff">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Resident Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="size-20">
                <AvatarImage src={resident.avatarUrl} alt={resident.name} />
                <AvatarFallback className="text-2xl">
                  {resident.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{resident.name}</h2>
                <p className="text-muted-foreground">{resident.unit}</p>

                <div className="grid grid-cols-3 gap-8 mt-6">
                  <StatCard
                    label="Current Streak"
                    value={resident.currentStreak}
                    icon={<Flame className="size-5 text-orange-500" />}
                    suffix="days"
                  />
                  <StatCard
                    label="Total Points"
                    value={resident.totalPoints}
                    icon={<Trophy className="size-5 text-yellow-500" />}
                  />
                  <StatCard
                    label="Longest Streak"
                    value={resident.longestStreak}
                    icon={<TrendingUp className="size-5 text-blue-500" />}
                    suffix="days"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Task Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {tasksError ? (
              <p className="text-sm text-destructive">{tasksError}</p>
            ) : (
              <>
                <TaskTimeline tasks={tasks} />
                <TaskList tasks={tasks} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
