import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/staff/DashboardPage'
import { ResidentDetailsPage } from '@/pages/staff/ResidentDetailsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/staff" element={<DashboardPage />} />
      <Route path="/staff/resident/:id" element={<ResidentDetailsPage />} />
      <Route path="/resident/*" element={<PlaceholderPage title="Resident Interface" />} />
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
