import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Flame, Star, CheckCircle2, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ResidentHeader } from '@/components/resident/ResidentHeader'
import { MetricCard } from '@/components/resident/MetricCard'
import { TaskCard } from '@/components/resident/TaskCard'
import { AlarmModal } from '@/components/resident/AlarmModal'
import { getUserById, getTasksForUser } from '@/data/mockHousehold'
import type { AlarmData } from '@/types/alert'
import type { TabletTask } from '@/types/resident'

export function ResidentDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user') || ''
  const user = getUserById(userId)
  const tasks = getTasksForUser(userId)

  // Simulates a cron-triggered alarm by clicking a task card.
  // TODO: Replace with alert service polling/WebSocket when ready.
  const handleTaskClick = useCallback((task: TabletTask) => {
    setAlarmData({
      taskName: task.name,
      taskIcon: task.icon,
      scheduledTime: task.scheduledTime,
    })
    setAlarmOpen(true)
  }, [])

  const handleSnooze = useCallback(() => {
    // TODO: Call snoozeAlert(scheduleId) when alert service is ready
    setAlarmOpen(false)
  }, [])

  const handleComplete = useCallback(() => {
    // TODO: Call completeAlert(scheduleId) when alert service is ready
    setAlarmOpen(false)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  if (!user) {
    navigate('/resident')
    return null
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const upcomingTasks = tasks.filter((t) => t.status !== 'completed')

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <ResidentHeader currentUser={user} currentTime={currentTime} />

      <main className="flex-1 flex flex-col overflow-hidden px-6 pb-4">
        <div className="flex gap-4 mb-3">
          <MetricCard
            icon={<Flame className="size-6 text-orange-500" />}
            label="Streak"
            value={`${user.streak} days`}
            variant="streak"
          />
          <MetricCard
            icon={<Star className="size-6 text-yellow-500" />}
            label="Total Points"
            value={user.points}
            variant="points"
          />
          <MetricCard
            icon={<CheckCircle2 className="size-6 text-green-500" />}
            label="Completed"
            value={`${completedTasks.length}/${tasks.length}`}
            variant="completed"
          />
        </div>

        <Separator className="mb-3" />

        <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 overflow-hidden">
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
          ))}
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </main>

      <footer className="px-6 py-2 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="gap-2 text-green-500 border-green-800">
            <CheckCircle2 className="size-4" />
            {completedTasks.length} completed
          </Badge>
          <Badge variant="outline" className="gap-2 text-yellow-500 border-yellow-800">
            <Calendar className="size-4" />
            {upcomingTasks.length} upcoming
          </Badge>
        </div>
      </footer>

      <AlarmModal
        open={alarmOpen}
        alarm={alarmData}
        onSnooze={handleSnooze}
        onComplete={handleComplete}
      />
    </div>
  )
}
