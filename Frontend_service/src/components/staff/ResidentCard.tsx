import { Link } from 'react-router-dom'
import { Flame, Sparkles, Sunrise, Users, Star, Target, Footprints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
}

export function ResidentCard({ resident }: ResidentCardProps) {
  const progressPercent = (resident.tasksCompleted / resident.tasksTotal) * 100

  return (
    <Link to={`/staff/resident/${resident.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
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
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
