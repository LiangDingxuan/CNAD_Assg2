import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  variant?: 'default' | 'streak' | 'points' | 'completed'
}

const variantStyles = {
  default: '',
  streak: 'bg-orange-900/15 border-orange-800/50',
  points: 'bg-yellow-900/15 border-yellow-800/50',
  completed: 'bg-green-900/20 border-green-800',
}

export function MetricCard({ icon, label, value, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={cn(
      'flex-1',
      variantStyles[variant]
    )}>
      <CardContent className="flex items-center gap-4 py-4 px-6">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
