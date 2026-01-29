import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ResidentLayout } from '@/components/ResidentLayout'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/staff/DashboardPage'
import { ResidentDetailsPage } from '@/pages/staff/ResidentDetailsPage'
import KitchenMonitoringPage from '@/pages/staff/KitchenMonitoringPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequireAuth } from '@/components/RequireAuth'
import { ProfileSelectPage } from '@/pages/resident/ProfileSelectPage'
import { PinEntryPage } from '@/pages/resident/PinEntryPage'
import { ResidentDashboardPage } from '@/pages/resident/DashboardPage'
import { TabletSetupPage } from '@/pages/resident/TabletSetupPage'
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
      <Route
        path="/staff/kitchen"
        element={
          //<RequireAuth allowedRoles={['staff', 'admin']}>
            <KitchenMonitoringPage />
          //</RequireAuth>
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

        {/* Resident routes - wrapped in TabletAuthProvider via ResidentLayout */}
        <Route path="/resident" element={<ResidentLayout />}>
          <Route index element={<ProfileSelectPage />} />
          <Route path="pin" element={<PinEntryPage />} />
          <Route path="dashboard" element={<ResidentDashboardPage />} />
          <Route path="setup" element={<TabletSetupPage />} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
