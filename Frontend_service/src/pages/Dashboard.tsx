// Frontend_service/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import Timetable from '../components/Timetable';
import AlertsPanel from '../components/AlertsPanel';
import TaskForm from '../components/TaskForm';

interface Schedule {
  _id: string;
  taskId: {
    _id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    priority?: string;
  };
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

interface Task {
  _id: string;
  name: string;
  description: string;
  category: 'hygiene' | 'medication' | 'meals' | 'chores' | 'other';
  status: string;
  priority: 'low' | 'medium' | 'high';
  time_taken: number;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardProps {
  userRole: 'resident' | 'staff' | 'admin';
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, userId }) => {
  const [activeView, setActiveView] = useState('timetable');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskClick = (schedule: Schedule) => {
    setSelectedTask(schedule.taskId as Task);
    // Could open a modal or navigate to task details
  };

  const handleAlertAction = (_action: string, _alertId: string) => {
    // Trigger refresh when alerts are acknowledged/dismissed
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      const response = await fetch('http://localhost:3002/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const result = await response.json();
      console.log('Task created:', result);
      
      setShowTaskForm(false);
      setSelectedTask(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const canCreateTasks = userRole === 'staff' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Task Management Dashboard
            </h1>
            
            <div className="flex items-center space-x-4">
              {canCreateTasks && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  + Create Task
                </button>
              )}
              
              <div className="text-sm text-gray-600">
                Role: <span className="font-medium capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('timetable')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'timetable'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Timetable
            </button>
            
            <button
              onClick={() => setActiveView('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts & Notifications
            </button>
            
            {canCreateTasks && (
              <button
                onClick={() => setActiveView('tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Tasks
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <TaskForm
                initialData={selectedTask || undefined}
                onSubmit={handleTaskSubmit}
                onCancel={() => {
                  setShowTaskForm(false);
                  setSelectedTask(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Content based on active view */}
        {activeView === 'timetable' && (
          <Timetable
            userId={userId}
            onTaskClick={handleTaskClick}
            key={refreshTrigger}
          />
        )}

        {activeView === 'alerts' && (
          <AlertsPanel
            userId={userId}
            onAlertAction={handleAlertAction}
            key={refreshTrigger}
          />
        )}

        {activeView === 'tasks' && canCreateTasks && (
          <div className="space-y-6">
            <TasksManagement 
              userId={userId}
              onEditTask={(task) => {
                setSelectedTask(task);
                setShowTaskForm(true);
              }}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </main>
    </div>
  );
};

// Tasks Management Component
interface TasksManagementProps {
  userId: string;
  onEditTask: (task: Task) => void;
  refreshTrigger: number;
}

const TasksManagement: React.FC<TasksManagementProps> = ({ userId, onEditTask, refreshTrigger }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/tasks?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      snoozed: 'bg-orange-100 text-orange-800',
      missed: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return badges[priority] || badges.medium;
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Tasks</h2>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>No tasks found. Create your first task!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm text-gray-900">
                      {task.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.time_taken} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="snoozed">Snoozed</option>
                        <option value="missed">Missed</option>
                      </select>
                      
                      <button
                        onClick={() => onEditTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
