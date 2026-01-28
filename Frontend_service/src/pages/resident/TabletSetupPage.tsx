import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTabletAuth } from '@/context/TabletAuthContext';
import * as tabletService from '@/services/tabletService';

export function TabletSetupPage() {
  const [tabletId, setTabletId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { configureTablet, clearConfig, tabletConfig } = useTabletAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tabletId.trim()) {
      setError('Tablet ID is required');
      return;
    }

    if (!username.trim()) {
      setError('Admin username is required');
      return;
    }

    if (!password.trim()) {
      setError('Admin password is required');
      return;
    }

    setIsLoading(true);

    try {
      // Login as admin to get JWT
      const loginResponse = await tabletService.adminLogin(username, password);

      // Verify the user is an admin
      if (loginResponse.user.role !== 'admin') {
        setError('Only admin accounts can configure tablets');
        setIsLoading(false);
        return;
      }

      // Configure tablet with admin token
      configureTablet(tabletId.trim(), loginResponse.token, loginResponse.user.username);
      setSuccess(true);

      // Redirect to profile select after a short delay
      setTimeout(() => {
        navigate('/resident');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConfig = () => {
    clearConfig();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Tablet Setup</CardTitle>
          <CardDescription>
            Configure this tablet using admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tabletConfig && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This tablet is configured as <strong>{tabletConfig.tabletId}</strong>
                {tabletConfig.adminUsername && (
                  <> (by {tabletConfig.adminUsername})</>
                )}.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-destructive"
                  onClick={handleClearConfig}
                >
                  Clear configuration
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert className="border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Tablet configured successfully! Redirecting...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="tabletId">Tablet ID</Label>
                <Input
                  id="tabletId"
                  placeholder="e.g., 12-345-tablet"
                  value={tabletId}
                  onChange={(e) => setTabletId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  The tablet ID registered for this unit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  'Configure Tablet'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/resident')}>
              Back to Profile Select
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
