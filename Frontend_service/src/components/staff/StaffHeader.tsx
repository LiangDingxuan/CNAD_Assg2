import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Bell, Ticket, BarChart3, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface NavTabProps {
  label: string
  to: string
  icon: React.ReactNode
  badge?: number
}

function NavTab({ label, to, icon, badge }: NavTabProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  )
}

export function StaffHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Care Facility Dashboard</h1>
        <nav className="flex items-center gap-2">
          <NavTab label="Overview" to="/staff" icon={<LayoutGrid className="size-4" />} />
          <NavTab label="Alerts" to="/staff/alerts" icon={<Bell className="size-4" />} badge={4} />
          <NavTab label="Vouchers" to="/staff/vouchers" icon={<Ticket className="size-4" />} />
          <NavTab label="Kitchen" to="/staff/kitchen" icon={<Camera className="size-4" />} />
          <NavTab label="Analytics" to="/staff/analytics" icon={<BarChart3 className="size-4" />} />
        </nav>
      </div>
    </header>
  )
}
