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

// Helper function to get icon for task category
const getTaskIcon = (category: string): string => {
  const icons: Record<string, string> = {
    medication: '💊',
    meals: '🍽️',
    hygiene: '🪥',
    chores: '🧹',
    other: '📋'
  };
  return icons[category] || icons.other;
};

// Helper function to determine task status based on time and completion
const getTaskStatus = (taskStatus: string, scheduledTime: string): TabletTask['status'] => {
  if (taskStatus === 'completed') return 'completed';
  
  const now = new Date();
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const taskTime = new Date();
  taskTime.setHours(hours, minutes, 0, 0);
  
  const diffMs = taskTime.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  if (diffMinutes < -30) return 'overdue';
  if (diffMinutes <= 0) return 'due_now';
  return 'upcoming';
};

// Helper function to transform schedule data to TabletTask format
const transformScheduleToTabletTask = (schedule: any): TabletTask => {
  const task = schedule.taskId;
  const status = getTaskStatus(task.status || 'pending', schedule.time);
  
  return {
    id: schedule._id,
    name: task.name,
    icon: getTaskIcon(task.category),
    scheduledTime: schedule.time,
    completedTime: task.status === 'completed' ? schedule.time : undefined,
    status,
  };
};

export function ResidentDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null);
  const [tasks, setTasks] = useState<TabletTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch tasks from task service
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes, use user1's ID. In real app, this would come from currentUser
        const userId = currentUser.id || '507f1f77bcf86cd799439011';
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(
          `http://localhost:3002/api/tasks/user/${userId}/timetable?date=${today}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const schedules = await response.json();
        const tabletTasks = schedules.map(transformScheduleToTabletTask);
        
        // Sort tasks by scheduled time
        tabletTasks.sort((a: TabletTask, b: TabletTask) => a.scheduledTime.localeCompare(b.scheduledTime));
        
        setTasks(tabletTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError((err as Error).message);
        
        // Fallback to mock data if API fails
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && currentUser) {
      fetchTasks();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchTasks, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

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

  const handleSnooze = useCallback(async () => {
    if (!alarmData) return;
    
    try {
      // Find the task corresponding to this alarm
      const task = tasks.find(t => t.name === alarmData.taskName);
      if (!task) return;
      
      // Get the task ID from the schedule (task.id is actually schedule.id)
      // We need to find the actual task ID from the schedule data
      const userId = currentUser?.id || '507f1f77bcf86cd799439011';
      const scheduleResponse = await fetch(`http://localhost:3002/api/tasks/user/${userId}/timetable?date=${new Date().toISOString().split('T')[0]}`);
      const schedules = await scheduleResponse.json();
      const schedule = schedules.find((s: any) => s._id === task.id);
      
      if (!schedule || !schedule.taskId?._id) {
        throw new Error('Task not found');
      }
      
      // Update task status to snoozed
      const response = await fetch(`http://localhost:3002/api/tasks/${schedule.taskId._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'snoozed' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to snooze task');
      }
      
      // Refresh tasks
      window.location.reload();
    } catch (err) {
      console.error('Error snoozing task:', err);
    } finally {
      setAlarmOpen(false);
    }
  }, [alarmData, tasks]);

  const handleComplete = useCallback(async () => {
    if (!alarmData) return;
    
    try {
      // Find the task corresponding to this alarm
      const task = tasks.find(t => t.name === alarmData.taskName);
      if (!task) return;
      
      // Get the task ID from the schedule (task.id is actually schedule.id)
      const userId = currentUser?.id || '507f1f77bcf86cd799439011';
      const scheduleResponse = await fetch(`http://localhost:3002/api/tasks/user/${userId}/timetable?date=${new Date().toISOString().split('T')[0]}`);
      const schedules = await scheduleResponse.json();
      const schedule = schedules.find((s: any) => s._id === task.id);
      
      if (!schedule || !schedule.taskId?._id) {
        throw new Error('Task not found');
      }
      
      // Update task status to completed
      const response = await fetch(`http://localhost:3002/api/tasks/${schedule.taskId._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete task');
      }
      
      // Refresh tasks
      window.location.reload();
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setAlarmOpen(false);
    }
  }, [alarmData, tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading || loading) {
    return (
      <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (error) {
    return (
      <div className="h-screen overflow-hidden bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading tasks</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
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
