import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmojiAvatar } from '@/components/resident/EmojiAvatar';
import { useTabletAuth, type TabletUser } from '@/context/TabletAuthContext';

interface ProfileCardProps {
  user: TabletUser;
  onClick: () => void;
}

function ProfileCard({ user, onClick }: ProfileCardProps) {
  // Generate a consistent avatar emoji from username
  const avatarEmoji = getAvatarEmoji(user.username);

  return (
    <Card
      className="w-80 cursor-pointer transition-all hover:scale-105 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center pt-8 pb-6 gap-4">
        <EmojiAvatar emoji={avatarEmoji} size="2xl" />
        <h2 className="text-2xl font-bold">{user.username}</h2>
        <p className="text-muted-foreground text-sm">Tap to continue</p>
      </CardContent>
    </Card>
  );
}

function getAvatarEmoji(username: string): string {
  // Simple hash-based emoji selection for consistent avatars
  const emojis = ['👨', '👩', '🧑', '👴', '👵', '🧓', '👦', '👧'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash = hash & hash;
  }
  return emojis[Math.abs(hash) % emojis.length];
}

function TabletNotConfigured() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
      <Settings className="size-16 text-muted-foreground" />
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Tablet Not Configured</h1>
        <p className="text-muted-foreground mb-4">
          This tablet needs to be configured before it can be used.
        </p>
        <Button onClick={() => navigate('/resident/setup')}>
          <Settings className="size-4 mr-2" />
          Configure Tablet
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          You'll need the tablet ID and device secret from your administrator.
        </p>
      </div>
    </div>
  );
}

function NoResidentsLoggedIn() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
      <AlertCircle className="size-16 text-muted-foreground" />
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">No Residents Available</h1>
        <p className="text-muted-foreground">
          No residents are currently logged into this tablet. Please ask an administrator to log
          residents into this tablet.
        </p>
      </div>
    </div>
  );
}

export function ProfileSelectPage() {
  const navigate = useNavigate();
  const {
    tabletConfig,
    loggedInUsers,
    isLoading,
    error,
    isAuthenticated,
    refreshProfiles,
    clearError,
  } = useTabletAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/resident/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Refresh profiles on mount
  useEffect(() => {
    if (tabletConfig) {
      refreshProfiles();
    }
  }, [tabletConfig, refreshProfiles]);

  const handleSelectProfile = (userId: string) => {
    navigate(`/resident/pin?user=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tabletConfig) {
    return <TabletNotConfigured />;
  }

  if (loggedInUsers.length === 0) {
    return <NoResidentsLoggedIn />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 p-8">
      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center">
        <h1 className="text-4xl font-bold italic mb-2">Who's using the app?</h1>
        <p className="text-muted-foreground text-lg">Select your profile</p>
      </div>

      <div className="flex gap-8 flex-wrap justify-center">
        {loggedInUsers.map((user) => (
          <ProfileCard key={user.id} user={user} onClick={() => handleSelectProfile(user.id)} />
        ))}
      </div>
    </div>
  );
}
