/*
  SIMULATION NOTE: In production, this alarm modal would be triggered by a cron
  job via the Alert Service (port 3003). Currently simulated by clicking a task
  card for development/demo purposes. When the alert service is ready, this
  component will be triggered by incoming alert events instead of click handlers.
*/

import { Bell } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AlarmData } from '@/types/alert'

interface AlarmModalProps {
  open: boolean
  alarm: AlarmData | null
  onSnooze: () => void
  onComplete: () => void
}

export function AlarmModal({ open, alarm, onSnooze, onComplete }: AlarmModalProps) {
  if (!alarm) return null

  const now = new Date()
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 backdrop-blur-md bg-gray-900/60',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-lg rounded-2xl border bg-background p-8 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex flex-col items-center text-center gap-6">
            <Bell className="size-10 text-primary animate-bounce" />

            <DialogPrimitive.Title className="sr-only">
              Task Alarm
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              It is time to complete: {alarm.taskName}
            </DialogPrimitive.Description>

            <p className="text-5xl font-bold tracking-tight">{currentTime}</p>

            <Separator />

            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">{alarm.taskIcon}</span>
              <h2 className="text-2xl font-semibold">{alarm.taskName}</h2>
              <p className="text-muted-foreground">Scheduled for {alarm.scheduledTime}</p>
            </div>

            <div className="flex gap-4 w-full mt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 text-lg"
                onClick={onSnooze}
              >
                Snooze
              </Button>
              <Button
                size="lg"
                className="flex-1 text-lg"
                onClick={onComplete}
              >
                Complete
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
