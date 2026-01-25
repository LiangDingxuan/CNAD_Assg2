import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'size-8 text-lg',
  md: 'size-12 text-2xl',
  lg: 'size-16 text-4xl',
  xl: 'size-24 text-7xl',
  '2xl': 'size-32 text-8xl',
}

interface EmojiAvatarProps {
  emoji: string
  size?: keyof typeof sizeClasses
  className?: string
}

export function EmojiAvatar({ emoji, size = 'md', className }: EmojiAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-transparent">{emoji}</AvatarFallback>
    </Avatar>
  )
}
