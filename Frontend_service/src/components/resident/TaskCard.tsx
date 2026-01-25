import { Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TabletTask } from '@/types/resident'

interface TaskCardProps {
  task: TabletTask
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isCompleted = task.status === 'completed'

  return (
    <Card
      className={cn(
        'transition-all py-2',
        isCompleted && 'bg-green-900/20 border-green-800',
        !isCompleted && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={!isCompleted ? onClick : undefined}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between">
          <span className="text-2xl">{task.icon}</span>
          {isCompleted && (
            <Badge variant="outline" className="border-green-700 text-green-500">
              <CheckCircle2 className="size-4" />
            </Badge>
          )}
        </div>
        <h3 className="font-semibold mt-1">{task.name}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
          <Clock className="size-4" />
          <span>{task.scheduledTime}</span>
        </div>
        {isCompleted && task.completedTime && (
          <p className="text-green-500 text-sm mt-1">
            ✓ {task.completedTime}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
