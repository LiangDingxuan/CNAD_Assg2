import { useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { ResidentCard } from '@/components/staff/ResidentCard'
import { mockResidents } from '@/data/mockResidents'
import type { Resident } from '@/types/staff'

export function DashboardPage() {
  const [residents, setResidents] = useState<Resident[]>(mockResidents)

  function handleCreateTask(residentId: string, payload: { name: string; scheduledTime: string }) {
    void payload
    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              tasksTotal: resident.tasksTotal + 1,
            }
          : resident
      )
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map((resident) => (
            <ResidentCard
              key={resident.id}
              resident={resident}
              onCreateTask={handleCreateTask}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
