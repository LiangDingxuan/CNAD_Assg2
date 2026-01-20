import { StaffHeader } from '@/components/staff/StaffHeader'
import { ResidentCard } from '@/components/staff/ResidentCard'
import { mockResidents } from '@/data/mockResidents'

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockResidents.map((resident) => (
            <ResidentCard key={resident.id} resident={resident} />
          ))}
        </div>
      </main>
    </div>
  )
}
