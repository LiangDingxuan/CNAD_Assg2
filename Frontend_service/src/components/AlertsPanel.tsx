// Frontend_service/src/components/AlertsPanel.tsx
import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

interface Alert {
  _id: string;
  userId: string;
  taskId: {
    _id: string;
    name: string;
    description: string;
    category: string;
    priority?: string;
  };
  scheduleId: {
    _id: string;
    time: string;
    days: number[];
  };
  type: 'reminder' | 'overdue' | 'missed' | 'snoozed';
  title: string;
  message: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  acknowledgedAt?: string;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AlertsPanelProps {
  userId: string;
  onAlertAction?: (action: string, alertId: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ userId, onAlertAction }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // all, pending, acknowledged, dismissed

  useEffect(() => {
    fetchAlerts();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAlerts, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId, filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(
        `http://localhost:3002/api/tasks/user/${userId}/alerts${statusFilter}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/tasks/alerts/${alertId}/acknowledge`,
        { method: 'PATCH' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert._id === alertId 
          ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
          : alert
      ));
      
      if (onAlertAction) {
        onAlertAction('acknowledged', alertId);
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/tasks/alerts/${alertId}/dismiss`,
        { method: 'PATCH' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert._id === alertId 
          ? { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() }
          : alert
      ));
      
      if (onAlertAction) {
        onAlertAction('dismissed', alertId);
      }
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    const icons: Record<string, string> = {
      reminder: '🔔',
      overdue: '⚠️',
      missed: '❌',
      snoozed: '⏰'
    };
    return icons[type] || '📢';
  };

  const getAlertColor = (type: string, status: string) => {
    if (status === 'acknowledged') return 'bg-green-50 border-green-200';
    if (status === 'dismissed') return 'bg-gray-50 border-gray-200';
    
    const colors: Record<string, string> = {
      reminder: 'bg-blue-50 border-blue-200',
      overdue: 'bg-orange-50 border-orange-200',
      missed: 'bg-red-50 border-red-200',
      snoozed: 'bg-yellow-50 border-yellow-200'
    };
    return colors[type] || colors.reminder;
  };

  const getPriorityBadge = (priority?: string) => {
    const badges: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return badges[priority || 'medium'] || badges.medium;
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

  const activeAlerts = alerts.filter(alert => alert.status === 'pending');
  const pendingCount = activeAlerts.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Alerts & Notifications
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Alerts</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No alerts found</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`border rounded-lg p-4 transition-all ${getAlertColor(alert.type, alert.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {alert.title}
                      </h3>
                      {alert.taskId?.priority && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(alert.taskId.priority)}`}>
                          {alert.taskId.priority}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Scheduled: {format(new Date(alert.scheduledTime), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(alert.scheduledTime), { addSuffix: true })}
                      </span>
                      {alert.taskId?.category && (
                        <span className="capitalize">
                          Category: {alert.taskId.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {alert.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      ✓ Acknowledge
                    </button>
                    <button
                      onClick={() => handleDismiss(alert._id)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                )}
                
                {alert.status === 'acknowledged' && (
                  <div className="text-green-600 text-sm font-medium">
                    ✓ Acknowledged
                  </div>
                )}
                
                {alert.status === 'dismissed' && (
                  <div className="text-gray-500 text-sm font-medium">
                    ✕ Dismissed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Auto-refreshing every 30 seconds</span>
          <button
            onClick={fetchAlerts}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
