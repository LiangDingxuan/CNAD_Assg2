import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Flame, Star, CheckCircle2, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ResidentHeader } from '@/components/resident/ResidentHeader'
import { MetricCard } from '@/components/resident/MetricCard'
import { TaskCard } from '@/components/resident/TaskCard'
import { getUserById, getTasksForUser } from '@/data/mockHousehold'

export function ResidentDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user') || ''
  const user = getUserById(userId)
  const tasks = getTasksForUser(userId)

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
    <div className="min-h-screen bg-background flex flex-col">
      <ResidentHeader currentUser={user} currentTime={currentTime} />

      <main className="flex-1 px-6 pb-6">
        <div className="flex gap-4 mb-6">
          <MetricCard
            icon={<Flame className="size-6 text-orange-500" />}
            label="Streak"
            value={`${user.streak} days`}
          />
          <MetricCard
            icon={<Star className="size-6 text-yellow-500" />}
            label="Total Points"
            value={user.points}
          />
          <MetricCard
            icon={<CheckCircle2 className="size-6 text-green-500" />}
            label="Completed"
            value={`${completedTasks.length}/${tasks.length}`}
            variant="completed"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border">
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
    </div>
  )
}
