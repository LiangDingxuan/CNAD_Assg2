import { Link } from 'react-router-dom'
import { Users, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface InterfaceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  buttonText: string
  buttonClassName?: string
  to: string
}

function InterfaceCard({
  icon,
  title,
  description,
  buttonText,
  buttonClassName,
  to,
}: InterfaceCardProps) {
  return (
    <Card className="w-80 bg-card">
      <CardContent className="flex flex-col items-center pt-8 pb-8 gap-4">
        <div className="text-primary">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
        <Button asChild className={buttonClassName}>
          <Link to={to}>{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Care Facility System</h1>
        <p className="text-muted-foreground">Choose your interface</p>
      </div>

      <div className="flex gap-6">
        <InterfaceCard
          icon={<Users className="size-16" />}
          title="Staff Dashboard"
          description="Monitor residents, view analytics, manage alerts and vouchers"
          buttonText="Login to Staff Dashboard"
          buttonClassName="w-full"
          to="/login?role=staff"
        />
        <InterfaceCard
          icon={<User className="size-16" />}
          title="Resident Interface"
          description="View your tasks, track progress, earn rewards and redeem vouchers"
          buttonText="Login to Resident Interface"
          buttonClassName="w-full bg-purple-600 hover:bg-purple-700 text-white"
          to="/login?role=resident"
        />
      </div>
    </div>
  )
}
