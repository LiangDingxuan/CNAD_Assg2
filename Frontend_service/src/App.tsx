import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/staff/DashboardPage'
import { ResidentDetailsPage } from '@/pages/staff/ResidentDetailsPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequireAuth } from '@/components/RequireAuth'
import { ProfileSelectPage } from '@/pages/resident/ProfileSelectPage'
import { PinEntryPage } from '@/pages/resident/PinEntryPage'
import { ResidentDashboardPage } from '@/pages/resident/DashboardPage'

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

      {/* Resident routes */}
      <Route path="/resident" element={<ProfileSelectPage />} />
      <Route path="/resident/pin" element={<PinEntryPage />} />
      <Route path="/resident/dashboard" element={<ResidentDashboardPage />} />
    </Routes>
  )
}

export default App
