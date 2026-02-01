# Task Management System

This document describes how to set up and test the task management feature for PWIDs (Persons with Intellectual Disabilities).

## Features Implemented

### Backend (Task Service)
1. **Task Management**
   - Create, read, update, delete tasks
   - Task categories: hygiene, medication, meals, chores, other
   - Priority levels: low, medium, high
   - Task status tracking: pending, in_progress, completed, snoozed, missed

2. **Scheduling System**
   - Daily, weekly, and custom schedules
   - Time-based task reminders
   - Day-of-week selection
   - Active/inactive schedule management

3. **Alert System**
   - Automatic alert generation when scheduled time hits
   - Reminder alerts (when task is due)
   - Overdue alerts (when task is missed)
   - Alert acknowledgment and dismissal
   - Real-time polling for new alerts

4. **Scheduler Service**
   - Background service that runs every minute
   - Automatically creates alerts for scheduled tasks
   - Handles overdue task detection
   - Graceful shutdown on service stop

### Frontend Components
1. **Timetable View**
   - Weekly grid view of scheduled tasks
   - Color-coded task status
   - Task icons by category
   - Navigation between weeks
   - Click on tasks for details

2. **Alerts Panel**
   - Real-time alerts display
   - Filter by status (pending, acknowledged, dismissed)
   - Alert acknowledgment/dismissal actions
   - Auto-refresh every 30 seconds
   - Priority badges and time information

3. **Task Form**
   - Create new tasks with schedules
   - Edit existing tasks
   - Category and priority selection
   - Schedule configuration (time, days, dates)
   - User assignment

4. **Dashboard**
   - Role-based access (resident, staff, admin)
   - Tab navigation between views
   - Task management for staff/admin
   - Responsive design

## Database Schema

### Tasks Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String, // hygiene, medication, meals, chores, other
  status: String, // pending, in_progress, completed, snoozed, missed
  time_taken: Number,
  priority: String, // low, medium, high
  assignedTo: ObjectId, // User reference
  createdBy: ObjectId, // User reference
  createdAt: Date,
  updatedAt: Date
}
```

### Schedules Collection
```javascript
{
  _id: ObjectId,
  taskId: ObjectId, // Task reference
  userId: ObjectId, // User reference
  type: String, // daily, weekly, custom
  time: String, // HH:MM format
  days: [Number], // 1-7 (Monday-Sunday)
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  lastTriggered: Date,
  nextTrigger: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Alerts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // User reference
  taskId: ObjectId, // Task reference
  scheduleId: ObjectId, // Schedule reference
  type: String, // reminder, overdue, missed, snoozed
  title: String,
  message: String,
  scheduledTime: Date,
  status: String, // pending, sent, acknowledged, dismissed
  acknowledgedAt: Date,
  dismissedAt: Date,
  retryCount: Number,
  maxRetries: Number,
  nextRetryAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to task service directory
cd task_service

# Install dependencies
npm install

# Create .env file
echo "MONGODB_URI=mongodb+srv://liangdingxuan_db_user:8TTH27WozKMVs9s7@cluster0.dendyxq.mongodb.net/?appName=Cluster0" > .env
echo "TASK_DB_NAME=Task" >> .env
echo "TASK_SERVICE_PORT=3002" >> .env

# Start the service
npm start
```

### 2. Database Seeding

```bash
# From project root
node scripts/seed.js
```

This will create:
- 4 users (2 residents, 1 staff, 1 admin)
- 5 sample tasks
- 5 sample schedules

### 3. Frontend Setup

```bash
# Navigate to frontend service directory
cd Frontend_service

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

### 4. Testing

1. Open your browser to `http://localhost:5173` (or whatever port Vite shows)
2. You'll see the Task Test Page
3. Use the role selector to switch between:
   - **Resident**: Can view timetable and receive alerts
   - **Staff**: Can create tasks and manage schedules
   - **Admin**: Full access to all features

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks (with optional filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status

### Schedules & Timetables
- `GET /api/tasks/user/:userId/timetable` - Get user's timetable for a date

### Alerts
- `GET /api/tasks/user/:userId/alerts` - Get user's alerts
- `POST /api/tasks/alerts` - Create alert
- `PATCH /api/tasks/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/tasks/alerts/:id/dismiss` - Dismiss alert

## Testing Scenarios

### 1. Creating a Task (Staff/Admin)
1. Select "Staff" or "Admin" role
2. Click "Create Task" button
3. Fill in task details:
   - Name: "Take Evening Medicine"
   - Description: "Take prescribed evening medication with water"
   - Category: "Medication"
   - Priority: "High"
4. Set schedule:
   - Time: "20:00"
   - Days: Select all days
5. Click "Create Task"

### 2. Viewing Timetable (Any Role)
1. Click "Timetable" tab
2. Navigate between weeks using arrows
3. See scheduled tasks in the grid
4. Click on tasks for details

### 3. Receiving Alerts (Resident)
1. The scheduler will automatically create alerts when scheduled time hits
2. Click "Alerts & Notifications" tab
3. See pending alerts
4. Click "Acknowledge" or "Dismiss" on alerts

### 4. Managing Tasks (Staff/Admin)
1. Click "Manage Tasks" tab
2. See list of all tasks
3. Update task status using dropdown
4. Edit or delete tasks as needed

## Key Features for PWIDs

1. **Simple Interface**: Large buttons, clear icons, minimal text
2. **Visual Cues**: Color-coded status, icons for categories
3. **Gentle Reminders**: Non-intrusive alerts, no constant monitoring
4. **Privacy-Preserving**: No cameras, only task completion tracking
5. **Empowering**: Users can acknowledge and complete tasks independently

## Future Enhancements

1. **Mobile App**: React Native version for smartphones
2. **Voice Reminders**: Text-to-speech for alerts
3. **Gamification**: Points, streaks, achievements
4. **Caregiver Dashboard**: Real-time monitoring for staff
5. **Offline Support**: Local storage for poor connectivity areas

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGODB_URI in .env file
   - Ensure MongoDB Atlas is accessible

2. **Frontend Not Loading**
   - Check if backend is running on port 3002
   - Verify CORS settings in task service

3. **Alerts Not Showing**
   - Check if scheduler is running (look for "Task scheduler started" message)
   - Verify schedules have correct time and are active

4. **Tasks Not Saving**
   - Check network connection
   - Verify task form validation

### Debug Mode

To enable debug logging, set environment variable:
```bash
DEBUG=task:* npm start
```

## Support

For issues or questions:
1. Check console logs in browser and terminal
2. Verify database connections
3. Test API endpoints directly with curl or Postman
