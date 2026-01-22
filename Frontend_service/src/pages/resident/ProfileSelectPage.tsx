import { useNavigate } from 'react-router-dom'
import { Flame, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmojiAvatar } from '@/components/resident/EmojiAvatar'
import { mockHouseholdUsers } from '@/data/mockHousehold'
import type { HouseholdUser } from '@/types/resident'

interface ProfileCardProps {
  user: HouseholdUser
  onClick: () => void
}

function ProfileCard({ user, onClick }: ProfileCardProps) {
  return (
    <Card
      className="w-80 cursor-pointer transition-all hover:scale-105 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center pt-8 pb-6 gap-4">
        <EmojiAvatar emoji={user.avatarEmoji} size="2xl" />
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <div className="flex gap-4">
          <Badge variant="outline" className="gap-2 px-3 py-1">
            <Flame className="size-4 text-orange-500" />
            <span className="text-muted-foreground">Streak</span>
            <span className="font-bold text-lg">{user.streak}</span>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1">
            <Star className="size-4 text-yellow-500" />
            <span className="text-muted-foreground">Points</span>
            <span className="font-bold text-lg">{user.points}</span>
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">Tap to continue</p>
      </CardContent>
    </Card>
  )
}

export function ProfileSelectPage() {
  const navigate = useNavigate()

  const handleSelectProfile = (userId: string) => {
    navigate(`/resident/pin?user=${userId}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold italic mb-2">
          Who's using the app?
        </h1>
        <p className="text-muted-foreground text-lg">Select your profile</p>
      </div>

      <div className="flex gap-8 flex-wrap justify-center">
        {mockHouseholdUsers.map((user) => (
          <ProfileCard
            key={user.id}
            user={user}
            onClick={() => handleSelectProfile(user.id)}
          />
        ))}
      </div>
    </div>
  )
}
