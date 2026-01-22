import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, X, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { EmojiAvatar } from '@/components/resident/EmojiAvatar'
import { getUserById } from '@/data/mockHousehold'
import { REGEXP_ONLY_DIGITS } from 'input-otp'

const PIN_LENGTH = 4

function NumPad({
  onDigit,
  onBackspace,
  onClear,
}: {
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="grid grid-cols-3 gap-3">
      {digits.map((digit) => (
        <Button
          key={digit}
          variant="outline"
          className="size-20 text-2xl font-semibold border-border hover:bg-accent"
          onClick={() => onDigit(digit)}
        >
          {digit}
        </Button>
      ))}
      <Button
        variant="outline"
        className="size-20 text-xl border-border hover:bg-accent"
        onClick={onBackspace}
      >
        <ArrowLeft className="size-6" />
      </Button>
      <Button
        variant="outline"
        className="size-20 text-2xl font-semibold border-border hover:bg-accent"
        onClick={() => onDigit('0')}
      >
        0
      </Button>
      <Button
        variant="outline"
        className="size-20 bg-destructive/10 border-destructive/50 hover:bg-destructive/20"
        onClick={onClear}
      >
        <X className="size-6 text-destructive" />
      </Button>
    </div>
  )
}

export function PinEntryPage() {
  const [pin, setPin] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user') || ''
  const user = getUserById(userId)

  const handleDigit = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          navigate(`/resident/dashboard?user=${userId}`)
        }, 300)
      }
    }
  }

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
  }

  if (!user) {
    navigate('/resident')
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-[480px]">
        <CardContent className="flex flex-col items-center py-10 gap-6">
          <EmojiAvatar emoji={user.avatarEmoji} size="xl" />

          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground text-lg">{user.name}</p>
          </div>

          <p className="text-muted-foreground">Enter your 4-digit PIN</p>

          <Alert className="bg-primary/10 border-primary/50">
            <Lightbulb className="size-4 text-yellow-500" />
            <AlertDescription className="text-primary">
              <strong>Demo Mode:</strong> Any 4-digit combination works
            </AlertDescription>
          </Alert>

          <InputOTP
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={setPin}
            pattern={REGEXP_ONLY_DIGITS}
            disabled
          >
            <InputOTPGroup className="gap-4">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="size-16 text-2xl font-bold rounded-lg border-2"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <NumPad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </CardContent>
      </Card>
    </div>
  )
}
