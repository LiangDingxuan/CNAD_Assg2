import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/staff/DashboardPage'
import { ResidentDetailsPage } from '@/pages/staff/ResidentDetailsPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequireAuth } from '@/components/RequireAuth'
import { ProfileSelectPage } from '@/pages/resident/ProfileSelectPage'
import { PinEntryPage } from '@/pages/resident/PinEntryPage'
import { ResidentDashboardPage } from '@/pages/resident/DashboardPage'
import UsersPage from '@/pages/staff/UsersPage'
import UserFormPage from '@/pages/staff/UserFormPage'
import UnitsPage from '@/pages/staff/UnitsPage'
import UnitFormPage from '@/pages/staff/UnitFormPage'
import UnitDetailPage from '@/pages/staff/UnitDetailPage'

function App() {
  return (
    <AuthProvider>
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

        {/* User management - admin only */}
        <Route
          path="/staff/users"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff/users/new"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UserFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff/users/:userId"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UserFormPage />
            </RequireAuth>
          }
        />

        {/* Unit management - admin only */}
        <Route
          path="/staff/units"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UnitsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff/units/new"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UnitFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff/units/:unitId"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UnitDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff/units/:unitId/edit"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <UnitFormPage />
            </RequireAuth>
          }
        />

        {/* Resident routes */}
        <Route path="/resident" element={<ProfileSelectPage />} />
        <Route path="/resident/pin" element={<PinEntryPage />} />
        <Route path="/resident/dashboard" element={<ResidentDashboardPage />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
