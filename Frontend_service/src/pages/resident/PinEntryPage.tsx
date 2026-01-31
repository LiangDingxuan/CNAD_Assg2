import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { EmojiAvatar } from '@/components/resident/EmojiAvatar';
import { useTabletAuth } from '@/context/TabletAuthContext';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

const PIN_LENGTH = 4;

function NumPad({
  onDigit,
  onBackspace,
  onClear,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {digits.map((digit) => (
        <Button
          key={digit}
          variant="outline"
          className="size-14 text-xl font-semibold border-border hover:bg-accent"
          onClick={() => onDigit(digit)}
          disabled={disabled}
        >
          {digit}
        </Button>
      ))}
      <Button
        variant="outline"
        className="size-14 text-lg border-border hover:bg-accent"
        onClick={onBackspace}
        disabled={disabled}
      >
        <ArrowLeft className="size-5" />
      </Button>
      <Button
        variant="outline"
        className="size-14 text-xl font-semibold border-border hover:bg-accent"
        onClick={() => onDigit('0')}
        disabled={disabled}
      >
        0
      </Button>
      <Button
        variant="outline"
        className="size-14 bg-destructive/10 border-destructive/50 hover:bg-destructive/20"
        onClick={onClear}
        disabled={disabled}
      >
        <X className="size-5 text-destructive" />
      </Button>
    </div>
  );
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

export function PinEntryPage() {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user') || '';

  const { loggedInUsers, verifyPin, error, clearError, tabletConfig } = useTabletAuth();

  // Find the selected user from logged-in users
  const user = loggedInUsers.find((u) => u.id === userId);

  // Redirect if user not found or tablet not configured
  useEffect(() => {
    if (!tabletConfig || (!user && loggedInUsers.length > 0)) {
      navigate('/resident');
    }
  }, [tabletConfig, user, loggedInUsers, navigate]);

  // Clear errors when component mounts or user changes
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [userId, clearError]);

  const handleDigit = async (digit: string) => {
    if (pin.length < PIN_LENGTH && !isVerifying) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        setIsVerifying(true);
        setLocalError(null);

        const success = await verifyPin(userId, newPin);

        if (success) {
          navigate('/resident/dashboard');
        } else {
          // Clear PIN on failure
          setPin('');
          setLocalError('Invalid PIN. Please try again.');
        }

        setIsVerifying(false);
      }
    }
  };

  const handleBackspace = () => {
    if (!isVerifying) {
      setPin((prev) => prev.slice(0, -1));
      setLocalError(null);
    }
  };

  const handleClear = () => {
    if (!isVerifying) {
      setPin('');
      setLocalError(null);
    }
  };

  const handleBack = () => {
    navigate('/resident');
  };

  if (!user) {
    return (
      <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarEmoji = getAvatarEmoji(user.username);
  const displayError = localError || error;

  return (
    <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
      <Card className="w-[480px] py-4">
        <CardContent className="flex flex-col items-center py-6 gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="self-start mb-2"
            onClick={handleBack}
            disabled={isVerifying}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>

          <EmojiAvatar emoji={avatarEmoji} size="xl" />

          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground text-lg">{user.username}</p>
          </div>

          {displayError && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <p className="text-muted-foreground">Enter your 4-digit PIN</p>

          <div className="relative">
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
                    className="size-12 text-xl font-bold rounded-lg border-2"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {isVerifying && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          <NumPad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onClear={handleClear}
            disabled={isVerifying}
          />
        </CardContent>
      </Card>
    </div>
  );
}
