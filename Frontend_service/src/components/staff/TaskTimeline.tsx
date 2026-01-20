import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/staff'

function getSegmentColor(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'snoozed':
      return 'bg-amber-500'
    case 'pending':
      return 'bg-muted'
    case 'overdue':
      return 'bg-red-500'
  }
}

interface TaskTimelineProps {
  tasks: Array<{ id: string; status: TaskStatus }>
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
  return (
    <div className="flex gap-1 h-8">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn('flex-1 rounded-md', getSegmentColor(task.status))}
        />
      ))}
    </div>
  )
}
