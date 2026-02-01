// Frontend_service/src/components/Timetable.tsx
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

interface Task {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priority?: string;
}

interface Schedule {
  _id: string;
  taskId: Task;
  userId: string;
  type: string;
  time: string;
  days: number[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  nextTrigger?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimetableProps {
  userId: string;
  onTaskClick?: (schedule: Schedule) => void;
}

const Timetable: React.FC<TimetableProps> = ({ userId, onTaskClick }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchTimetable();
  }, [selectedDate]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3002/api/tasks/user/${userId}/timetable?date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch timetable');
      }
      
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getScheduleForSlot = (date: Date, time: string) => {
    return schedules.find(schedule => {
      const scheduleTime = schedule.time.substring(0, 5); // Remove seconds if present
      const scheduleDate = schedule.nextTrigger ? parseISO(schedule.nextTrigger) : parseISO(schedule.createdAt);
      return scheduleTime === time && isSameDay(scheduleDate, date);
    });
  };

  const getTaskIcon = (category: string) => {
    const icons: Record<string, string> = {
      medication: '💊',
      meals: '🍽️',
      hygiene: '🧼',
      chores: '🧹',
      other: '📋'
    };
    return icons[category] || icons.other;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 border-yellow-300',
      completed: 'bg-green-100 border-green-300',
      snoozed: 'bg-orange-100 border-orange-300',
      missed: 'bg-red-100 border-red-300',
      in_progress: 'bg-blue-100 border-blue-300'
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Weekly Timetable</h2>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            ← Previous Week
          </button>
          <span className="text-lg font-semibold">
            {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - {' '}
            {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="font-semibold text-gray-600 text-sm">Time</div>
            {weekDays.map((day, index) => (
              <div key={day} className="font-semibold text-gray-600 text-sm text-center">
                {day}
                <div className="text-xs text-gray-500">
                  {format(weekDates[index], 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm text-gray-600 font-medium">
                {time}
              </div>
              {weekDates.map((date, dayIndex) => {
                const schedule = getScheduleForSlot(date, time);
                return (
                  <div
                    key={`${time}-${dayIndex}`}
                    className="border border-gray-200 rounded p-1 min-h-[60px] hover:bg-gray-50 transition-colors"
                  >
                    {schedule && (
                      <div
                        className={`p-2 rounded border cursor-pointer text-xs ${getStatusColor(schedule.taskId?.status || 'pending')}`}
                        onClick={() => onTaskClick && onTaskClick(schedule)}
                      >
                        <div className="flex items-center mb-1">
                          <span className="mr-1">{getTaskIcon(schedule.taskId?.category || 'other')}</span>
                          <span className="font-medium truncate">{schedule.taskId?.name}</span>
                        </div>
                        <div className="text-gray-600 truncate">
                          {schedule.taskId?.description}
                        </div>
                        {schedule.taskId?.status && (
                          <div className="mt-1 text-xs font-medium">
                            {schedule.taskId.status}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend:</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-1"></div>
            <span>Snoozed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
            <span>In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
