import { CheckCircle, Clock, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/staff'

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="size-5 text-green-500" />
    case 'snoozed':
      return <Clock className="size-5 text-amber-500" />
    case 'pending':
      return <Circle className="size-5 text-muted-foreground" />
    case 'overdue':
      return <Circle className="size-5 text-red-500" />
  }
}

function getStatusBadgeVariant(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return 'default'
    case 'snoozed':
      return 'destructive'
    case 'pending':
      return 'secondary'
    case 'overdue':
      return 'destructive'
  }
}

function TaskItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        {getStatusIcon(task.status)}
        <div>
          <p className="font-medium text-foreground">{task.name}</p>
          <p className="text-sm text-muted-foreground">Scheduled: {task.scheduledTime}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {task.completedTime && (
          <span className="text-sm text-muted-foreground">Completed: {task.completedTime}</span>
        )}
        <Badge
          variant={getStatusBadgeVariant(task.status)}
          className={cn(
            task.status === 'snoozed' && 'bg-amber-600 hover:bg-amber-600',
            task.status === 'completed' && 'bg-zinc-800 hover:bg-zinc-800'
          )}
        >
          {task.status}
        </Badge>
      </div>
    </div>
  )
}

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="divide-y divide-border">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
