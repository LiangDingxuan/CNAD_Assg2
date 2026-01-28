import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmojiAvatar } from '@/components/resident/EmojiAvatar';
import { useTabletAuth, type TabletUser } from '@/context/TabletAuthContext';

interface ResidentHeaderProps {
  currentTime: Date;
}

function getAvatarEmoji(username: string): string {
  const emojis = ['👨', '👩', '🧑', '👴', '👵', '🧓', '👦', '👧'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash = hash & hash;
  }
  return emojis[Math.abs(hash) % emojis.length];
}

export function ResidentHeader({ currentTime }: ResidentHeaderProps) {
  const navigate = useNavigate();
  const { currentUser, loggedInUsers, clearSession } = useTabletAuth();

  const otherUsers = loggedInUsers.filter((u) => u.id !== currentUser?.id);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSwitchUser = (userId: string) => {
    clearSession();
    navigate(`/resident/pin?user=${userId}`);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/resident');
  };

  if (!currentUser) {
    return null;
  }

  const avatarEmoji = getAvatarEmoji(currentUser.username);

  return (
    <header className="flex items-center justify-between px-6 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto py-2 px-4">
            <div className="flex items-center gap-3">
              <EmojiAvatar emoji={avatarEmoji} size="md" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <p className="font-semibold">{currentUser.username}</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {otherUsers.length > 0 && (
            <>
              <DropdownMenuLabel>Switch user</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {otherUsers.map((user: TabletUser) => (
                <DropdownMenuItem
                  key={user.id}
                  className="gap-3 cursor-pointer"
                  onClick={() => handleSwitchUser(user.id)}
                >
                  <EmojiAvatar emoji={getAvatarEmoji(user.username)} size="sm" />
                  <span>{user.username}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="gap-3 cursor-pointer text-destructive" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
          <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/staff')}>
          <Users className="size-4 mr-2" />
          Staff View
        </Button>
      </div>
    </header>
  );
}
