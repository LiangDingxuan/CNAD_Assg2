import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ResidentHeader } from '@/components/resident/ResidentHeader';
import { TaskCard } from '@/components/resident/TaskCard';
import { AlarmModal } from '@/components/resident/AlarmModal';
import { useTabletAuth } from '@/context/TabletAuthContext';
import type { AlarmData } from '@/types/alert';
import type { TabletTask } from '@/types/resident';

// TODO: Replace with real task service API call
const mockTasks: TabletTask[] = [
  {
    id: 't1',
    name: 'Morning Medication',
    icon: '💊',
    scheduledTime: '08:00',
    completedTime: '08:05',
    status: 'completed',
  },
  {
    id: 't2',
    name: 'Breakfast',
    icon: '🍽️',
    scheduledTime: '09:00',
    completedTime: '09:10',
    status: 'completed',
  },
  {
    id: 't3',
    name: 'Hygiene Routine',
    icon: '🪥',
    scheduledTime: '10:00',
    completedTime: '10:15',
    status: 'completed',
  },
  {
    id: 't4',
    name: 'Lunch',
    icon: '🍽️',
    scheduledTime: '12:00',
    status: 'upcoming',
  },
  {
    id: 't5',
    name: 'Afternoon Activity',
    icon: '⏰',
    scheduledTime: '15:00',
    status: 'upcoming',
  },
  {
    id: 't6',
    name: 'Evening Medication',
    icon: '💊',
    scheduledTime: '18:00',
    status: 'upcoming',
  },
];

export function ResidentDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null);
  const [tasks] = useState<TabletTask[]>(mockTasks);
  const navigate = useNavigate();

  const { currentUser, isAuthenticated, isLoading, tabletConfig } = useTabletAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/resident');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Redirect if tablet not configured
  useEffect(() => {
    if (!isLoading && !tabletConfig) {
      navigate('/resident');
    }
  }, [tabletConfig, isLoading, navigate]);

  // Simulates a cron-triggered alarm by clicking a task card.
  // TODO: Replace with alert service polling/WebSocket when ready.
  const handleTaskClick = useCallback((task: TabletTask) => {
    setAlarmData({
      taskName: task.name,
      taskIcon: task.icon,
      scheduledTime: task.scheduledTime,
    });
    setAlarmOpen(true);
  }, []);

  const handleSnooze = useCallback(() => {
    // TODO: Call snoozeAlert(scheduleId) when alert service is ready
    setAlarmOpen(false);
  }, []);

  const handleComplete = useCallback(() => {
    // TODO: Call completeAlert(scheduleId) when alert service is ready
    setAlarmOpen(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const upcomingTasks = tasks.filter((t) => t.status !== 'completed');

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <ResidentHeader currentTime={currentTime} />

      <main className="flex-1 flex flex-col overflow-hidden px-6 pb-4">
        <Separator className="mb-3" />

        <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 overflow-hidden">
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
          ))}
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </main>

      <footer className="px-6 py-2 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="gap-2 text-green-500 border-green-800">
            <CheckCircle2 className="size-4" />
            {completedTasks.length} completed
          </Badge>
          <Badge variant="outline" className="gap-2 text-yellow-500 border-yellow-800">
            <Calendar className="size-4" />
            {upcomingTasks.length} upcoming
          </Badge>
        </div>
      </footer>

      <AlarmModal
        open={alarmOpen}
        alarm={alarmData}
        onSnooze={handleSnooze}
        onComplete={handleComplete}
      />
    </div>
  );
}
