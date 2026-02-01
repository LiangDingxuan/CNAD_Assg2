import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, Building2, LogOut, Bell, Ticket, BarChart3, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface NavTabProps {
  label: string
  to: string
  icon: React.ReactNode
  badge?: number
}

function NavTab({ label, to, icon, badge }: NavTabProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {icon}
      {label}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

export function StaffHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

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
          <NavTab label="Users" to="/staff/users" icon={<Users className="size-4" />} />
          <NavTab label="Units" to="/staff/units" icon={<Building2 className="size-4" />} />
          <div className="ml-4 flex items-center gap-2 border-l pl-4">
            <span className="text-sm text-muted-foreground">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
