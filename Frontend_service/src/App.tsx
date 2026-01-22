import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/staff/DashboardPage'
import { ResidentDetailsPage } from '@/pages/staff/ResidentDetailsPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequireAuth } from '@/components/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Staff routes protected */}
      <Route
        path="/staff"
        element={
          <RequireAuth allowedRoles={['staff', 'admin']}>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/staff/resident/:id"
        element={
          <RequireAuth allowedRoles={['staff', 'admin']}>
            <ResidentDetailsPage />
          </RequireAuth>
        }
      />

      {/* Resident placeholder (protected) */}
      <Route
        path="/resident"
        element={
          <RequireAuth allowedRoles={['resident', 'user']}>
            <PlaceholderPage title="Resident Interface" />
          </RequireAuth>
        }
      />
      <Route
        path="/resident/*"
        element={
          <RequireAuth allowedRoles={['resident', 'user']}>
            <PlaceholderPage title="Resident Interface" />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">{title} - Coming Soon</p>
    </div>
  )
}

export default App
