import { useNavigate } from 'react-router-dom'
import { ChevronDown, Flame, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmojiAvatar } from '@/components/resident/EmojiAvatar'
import { mockHouseholdUsers } from '@/data/mockHousehold'
import type { HouseholdUser } from '@/types/resident'

interface ResidentHeaderProps {
  currentUser: HouseholdUser
  currentTime: Date
}

export function ResidentHeader({ currentUser, currentTime }: ResidentHeaderProps) {
  const navigate = useNavigate()
  const otherUsers = mockHouseholdUsers.filter((u) => u.id !== currentUser.id)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleSwitchUser = (userId: string) => {
    navigate(`/resident/pin?user=${userId}`)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-auto py-2 px-4"
          >
            <div className="flex items-center gap-3">
              <EmojiAvatar emoji={currentUser.avatarEmoji} size="md" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <p className="font-semibold">{currentUser.name}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Flame className="size-3 text-orange-500" />
                    {currentUser.streak}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3 text-yellow-500" />
                    {currentUser.points}
                  </span>
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch user</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {otherUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              className="gap-3 cursor-pointer"
              onClick={() => handleSwitchUser(user.id)}
            >
              <EmojiAvatar emoji={user.avatarEmoji} size="sm" />
              <span>{user.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
          <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/staff')}
        >
          <Users className="size-4 mr-2" />
          Staff View
        </Button>
      </div>
    </header>
  )
}
