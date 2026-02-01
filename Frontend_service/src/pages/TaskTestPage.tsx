// Frontend_service/src/pages/TaskTestPage.tsx
import React, { useState } from 'react';
import Dashboard from './Dashboard';

const TaskTestPage: React.FC = () => {
  // For testing purposes, we'll use a mock user
  // In a real app, this would come from authentication
  const [userRole, setUserRole] = useState<'resident' | 'staff' | 'admin'>('staff'); // Change to 'resident' or 'admin' to test different views
  const [userId] = useState('507f1f77bcf86cd799439011'); // Mock user ID

  return (
    <div>
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-blue-900">Task Management Test Page</h1>
              <p className="text-sm text-blue-700">
                This is a test page to demonstrate the task management features
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-blue-900">Role:</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as 'resident' | 'staff' | 'admin')}
                className="px-3 py-1 border border-blue-300 rounded-md text-sm"
              >
                <option value="resident">Resident</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <Dashboard 
        userRole={userRole} 
        userId={userId}
      />
    </div>
  );
};

export default TaskTestPage;
