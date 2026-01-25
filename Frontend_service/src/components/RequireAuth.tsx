import { Navigate } from 'react-router-dom'

export function RequireAuth({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const token = localStorage.getItem('auth_token')
  const userRaw = localStorage.getItem('auth_user')

  if (!token || !userRaw) return <Navigate to="/" replace />

  try {
    const user = JSON.parse(userRaw)
    if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />
    return <>{children}</>
  } catch {
    return <Navigate to="/" replace />
  }
}
