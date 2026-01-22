import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export function LoginPage() {
  const query = useQuery()
  const role = query.get('role') || 'staff' // staff | resident
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const accountApi = import.meta.env.VITE_ACCOUNT_API || 'http://localhost:3001'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post(`${accountApi}/api/auth/login`, { username, password })
      const { token, user } = res.data

      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      // simple role gate (frontend-only; backend can enforce later)
      if (role === 'staff' && (user.role === 'staff' || user.role === 'admin')) {
        navigate('/staff')
        return
      }
      if (role === 'resident' && (user.role === 'resident' || user.role === 'user')) {
        navigate('/resident')
        return
      }

      // wrong role
      setError(`Logged in as ${user.role}, but this is the ${role} interface.`)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{role === 'staff' ? 'Staff Login' : 'Resident Login'}</CardTitle>
          <CardDescription>
            Demo users (seeded): admin / staff1 / user1 / user2, password: password123
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-foreground">Username</label>
              <input
                className="w-full border border-border bg-background rounded-md px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., staff1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Password</label>
              <input
                className="w-full border border-border bg-background rounded-md px-3 py-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
