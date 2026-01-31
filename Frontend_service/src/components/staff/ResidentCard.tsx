import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Flame, Sparkles, Sunrise, Users, Star, Target, Footprints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Resident, ResidentStatus, Badge as BadgeType } from '@/types/staff'

function StatusIndicator({ status }: { status: ResidentStatus }) {
  return (
    <span
      className={cn(
        'size-3 rounded-full',
        status === 'good' && 'bg-green-500',
        status === 'warning' && 'bg-yellow-500',
        status === 'alert' && 'bg-red-500'
      )}
    />
  )
}

const badgeIcons: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="size-3" />,
  sunrise: <Sunrise className="size-3" />,
  users: <Users className="size-3" />,
  star: <Star className="size-3" />,
  target: <Target className="size-3" />,
  footprints: <Footprints className="size-3" />,
}

function AchievementBadge({ badge }: { badge: BadgeType }) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {badgeIcons[badge.icon]}
      {badge.name}
    </Badge>
  )
}

interface ResidentCardProps {
  resident: Resident
  onCreateTask?: (
    residentId: string,
    payload: { name: string; description: string; scheduledTime: string }
  ) => void
}

export function ResidentCard({ resident, onCreateTask }: ResidentCardProps) {
  const progressPercent =
    resident.tasksTotal === 0 ? 0 : (resident.tasksCompleted / resident.tasksTotal) * 100
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!taskName.trim() || !description.trim() || !scheduledTime) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await onCreateTask?.(resident.id, {
        name: taskName.trim(),
        description: description.trim(),
        scheduledTime
      })
      setTaskName('')
      setDescription('')
      setScheduledTime('')
      setIsDialogOpen(false)
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Link
            to={`/staff/resident/${resident.id}`}
            className="flex items-start gap-4 flex-1 min-w-0"
          >
            <div className="relative">
              <Avatar className="size-12">
                <AvatarImage src={resident.avatarUrl} alt={resident.name} />
                <AvatarFallback>
                  {resident.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -left-1">
                <StatusIndicator status={resident.status} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{resident.name}</h3>
              <p className="text-sm text-muted-foreground">{resident.unit}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Today's Progress</span>
                  <span className="text-foreground">
                    {resident.tasksCompleted}/{resident.tasksTotal} tasks
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                <Flame className="size-4 text-orange-500" />
                <span>{resident.currentStreak} day streak</span>
              </div>

              {resident.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {resident.badges.map((badge) => (
                    <AchievementBadge key={badge.id} badge={badge} />
                  ))}
                </div>
              )}
            </div>
          </Link>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (open) setSubmitError(null)
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsDialogOpen(true)}
            >
              Create Task
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>
                  Assign a new task to {resident.name}.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor={`task-name-${resident.id}`} className="text-sm font-medium">
                    Task name
                  </label>
                  <Input
                    id={`task-name-${resident.id}`}
                    placeholder="e.g., Take Medication"
                    value={taskName}
                    onChange={(event) => setTaskName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`task-time-${resident.id}`} className="text-sm font-medium">
                    Scheduled time
                  </label>
                  <Input
                    id={`task-time-${resident.id}`}
                    type="time"
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`task-desc-${resident.id}`} className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id={`task-desc-${resident.id}`}
                    placeholder="Short instructions for the resident"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      !taskName.trim() || !description.trim() || !scheduledTime || isSubmitting
                    }
                  >
                    {isSubmitting ? 'Creating…' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
