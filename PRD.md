# Product Requirements Document (PRD)

## Smart Display Hub - Solution Requirements & MVP Definition

---

## Core Problem Statement

**Target Users:** 2 PWIDs per HDB unit, high-functioning (can use smartphones), aged 35-64

**Pain Point:** Forgetting or delaying ADLs (grooming, medication, cleaning, meals) due to executive function challenges, not inability

**Desired Outcome:** Complete ADLs independently with technology scaffolding, whilst staff can verify completion remotely without intrusive monitoring

> **Prototype Focus:** Since this is a prototype, we can focus on specific tasks like taking medicine or doing dishes - activities suitable for camera placement and easier for AI to detect.

---

## Functional Requirements (Prioritised)

### Must-Have (MVP Core)

#### 1. Task Scheduling & Reminders

**User Story:** "As a PWID, I need to know what tasks I should do and when, so I don't forget important routines."

**Requirements:**
- Predefined daily schedule per user (e.g., "Brush teeth at 8:00 AM, 8:00 PM")
- Visual task cards showing:
  - Large icon (toothbrush, pill bottle, etc.)
  - Task name (max 3-4 words, e.g., "Brush Your Teeth")
  - Countdown timer until task is due
  - Status indicator (upcoming / due now / overdue)
- Tasks appear automatically at scheduled times (no manual navigation)
- Only show current task (no overwhelming list of 10 tasks at once)

**Acceptance Criteria:**
- [ ] User sees next task 15 minutes before scheduled time (green "upcoming" state)
- [ ] Task becomes prominent when due (amber glow, gentle audio cue)
- [ ] Task turns red if not completed 10 minutes after due time

---

#### 2. Task Completion Mechanism

**User Story:** "As a PWID, I need a simple way to tell the system I've finished a task."

**Requirements:**
- Single large "Done" button (80% of screen width, high-contrast)
- Haptic feedback on button press (vibration if tablet supports it)
- Visual confirmation (green checkmark animation, positive audio tone)
- Task card auto-dismisses after 3 seconds, shows next task

**Acceptance Criteria:**
- [ ] Button tap registers completion within 500ms
- [ ] Completion timestamp recorded to database
- [ ] User cannot accidentally double-tap (debouncing)
- [ ] Works offline (queues completion, syncs when online)

---

#### 3. Snooze Functionality (Limited)

**User Story:** "As a PWID, if I'm in the middle of something, I need to postpone a task briefly, but the system should prevent me from snoozing indefinitely."

**Requirements:**
- "Snooze" button available only if task never snoozed before (1× limit)
- Snooze duration: 15 minutes fixed (no user choice to reduce complexity)
- Button shows countdown after snooze ("Task returns in 14:32")
- After snooze expires, task reappears with no snooze option

**Acceptance Criteria:**
- [ ] Snooze button disabled after first use (greyed out + label "Already snoozed")
- [ ] Snoozed task reappears exactly 15 minutes later
- [ ] Database records snooze timestamp and count
- [ ] Staff dashboard shows snooze usage patterns (flag if user snoozes >50% of tasks)

---

#### 4. Staff Verification Dashboard

**User Story:** "As a staff member, I need to check if residents completed their tasks without constantly monitoring them."

**Requirements:**
- Web dashboard showing unit-by-unit overview (grid layout)
- Each unit displays:
  - Resident names (2 per unit)
  - Today's completion rate (e.g., "7/10 tasks completed")
  - Traffic light indicator (green: all done, amber: some pending, red: tasks missed)
- Click unit → drill down to individual task timeline for that day
- Exception-based alerts only: Notification appears only when task missed (>15 min overdue)

**Acceptance Criteria:**
- [ ] Dashboard updates every 60 seconds (no real-time requirement for MVP)
- [ ] Staff sees task completion within 2 minutes of user pressing "Done"
- [ ] Alerts show: Resident name, task name, time missed
- [ ] Staff can acknowledge/dismiss alerts (doesn't change task status, just removes from alert feed)

---

#### 5. Offline Operation (Optional for MVP)

**User Story:** "As a PWID, the system should work even if Wi-Fi drops, so I don't lose access to my task list."

**Requirements:**
- Tablet caches today's tasks locally (loads from local storage if offline)
- Completion button still works offline (stores in local queue)
- When connection restored, auto-sync completions to server
- Visual indicator shows "Offline Mode" (small icon in corner, not alarming)

**Acceptance Criteria:**
- [ ] User can complete tasks during 1-hour Wi-Fi outage
- [ ] All offline completions sync within 5 minutes of reconnection
- [ ] No data loss even if tablet restarts whilst offline

---

#### 6. Gamification (Streaks/Badges/Points)

**User Story:** "As a PWID, I want to earn rewards for completing tasks consistently, so I feel motivated and recognised for my efforts."

**Requirements:**
- Daily streak counter (consecutive days with 100% task completion)
- Weekly points system (1 point per completed task)
- Badge unlocking system (similar to TikTok):
  - "First Week" (7-day streak)
  - "Perfect Month" (30-day streak)
- Rewards redemption screen showing available vouchers
- Prize tiers:
  - 50 points = $5 NTUC voucher
  - 100 points = $10 NTUC voucher
  - 200 points = $20 NTUC voucher
  - *Prizes need not be monetary and can be set accordingly*
- Visual celebration when earning badges (confetti animation, sound effect)
- Points balance displayed on main screen (persistent top bar)

**Acceptance Criteria:**
- [ ] Streak resets to 0 if user completes <100% tasks in a day
- [ ] Points awarded immediately upon task completion (optimistic UI update)
- [ ] Badge earned notification appears fullscreen with "Collect" button
- [ ] Voucher redemption deducts points and generates unique code
- [ ] Staff dashboard shows points/voucher activity for monitoring abuse
- [ ] Points persist during offline mode, sync when reconnected
- [ ] Streak survives single missed task if completion rate ≥90% (grace rule)

---

### Should-Have (Nice-to-Have for Hackathon Demo)

#### 7. Task Instructions (Help Mode)

**User Story:** "As a PWID, if I forget how to do a task properly, I need step-by-step guidance."

**Requirements:**
- "Help" button on each task card (secondary action, less prominent than "Done")
- Opens fullscreen modal with:
  - 30-60 second instructional video (e.g., proper teeth brushing technique)
  - OR step-by-step images with text (if video not ready)
- Simple "Close" button to return to task

**Acceptance Criteria:**
- [ ] Help modal plays video without leaving task screen
- [ ] User can replay video unlimited times
- [ ] Video loads within 3 seconds (CDN-hosted, not database blob)

---

#### 8. Daily Summary View

**User Story:** "As a PWID, I want to see what I've accomplished today to feel motivated."

**Requirements:**
- "My Day" button accessible from main screen (top-right corner)
- Shows completed tasks with green checkmarks
- Shows pending tasks greyed out
- Simple progress bar (e.g., "8 out of 10 tasks done!")
- Encouraging message based on completion rate:
  - 100%: "Amazing work today! 🌟"
  - 70-99%: "Great job! Almost there!"
  - <70%: "Keep going, you're doing well!"

**Acceptance Criteria:**
- [ ] Summary updates immediately after task completion
- [ ] User can navigate back to current task with one tap

---

## Excluded from MVP (Phase 2+)

| Feature | Reason for Exclusion |
|---------|---------------------|
| Camera verification | KIV for later / Dingxuan research |
| Customisable schedules | Fixed schedules sufficient for pilot; reduces config complexity |
| Multi-language support | English-only for initial deployment; add later if needed |
| Integration with external systems | No HealthHub/SingPass linkage needed for POC |

---

## Key Design Decisions

### 1. Task Overload Prevention

**Question:** Should users see ALL upcoming tasks, or only current + next 2-3?

| Option | Description |
|--------|-------------|
| **Option A** ✓ | Show only current task (cleanest, least cognitive load) |
| Option B | Show current + preview of next 3 (helps with planning) |

**Recommendation:** Option A for MVP—validate with users if they want visibility into "what's next".

---

### 2. Snooze Duration

**Question:** Is 15 minutes the right snooze length?

**Consideration:** Too short (5 min) = annoying; too long (30 min) = defeats urgency

**Recommendation:** 15 minutes fixed for MVP, make configurable later if needed.

---

### 3. Missed Task Handling

**Question:** What happens if a task is never completed?

| Option | Description |
|--------|-------------|
| Option A | Task stays red on screen until done (blocks next tasks) |
| Option B | Task auto-expires after 1 hour, marks as "missed", shows next task |
| **Option C** ✓ | Task persists but next tasks still appear (can have multiple overdue) |

**Recommendation:** Option C for autonomy—user can go back to missed tasks, but isn't blocked from continuing their day.

---

### 4. Emergency Contact Access

**Question:** Should tablet have a persistent "Call Staff" button?

**Consideration:** Safety vs. potential misuse (calling for non-emergencies)

**Recommendation:** Yes, always visible (top-right corner)—staff can educate users on appropriate usage; safety > convenience.

---

### 5. Task Difficulty Calibration

**Question:** Should some tasks have longer time windows (e.g., "Clean room" has 2-hour window vs. "Take medication" has 15-min window)?

**Recommendation:** Not for MVP—all tasks treated equally (due time ± 15 min tolerance). Add task-specific windows in Phase 2 based on usage data.

---

## Open Questions for Stakeholder Validation

1. **User Profile:** Do all target PWIDs have similar routines, or highly individualised? (Affects whether we need custom scheduling in MVP)

2. **Staff Availability:** How quickly do staff expect to respond to alerts? (30 min? 2 hours? Affects alert urgency design)

3. **Task Granularity:** Should "Brush teeth" be one task, or broken into steps ("Wet brush → Apply toothpaste → Brush 2 min → Rinse")? (Affects UI complexity)

4. **Failure Tolerance:** If tablet breaks/loses charge, what's the backup plan? (Paper checklist? Staff visit?)

5. **Data Retention:** How long should completion history be stored? (7 days? 6 months? Affects database design)

---

## Service Breakdown

> **Note:** Services communicate via APIs only. Not all functions need to be complete for demo - can note "can expand to include…" or "can be scaled".

### Tablet Services

#### Service 1.1: Frontend - Tablet (PWID-facing)
**Tech:** React + TypeScript + Vite + Tailwind + shadcn

**Responsibilities:**
- Task card display
- Done/Snooze/Help buttons
- Offline mode (Service Worker + IndexedDB)
- Gamification UI (points, badges, streaks)
- Voice commands (Phase 2)

**APIs Called:**
- `GET /api/tasks/user/{userId}/today`
- `POST /api/tasks/{instanceId}/complete`
- `GET /api/gamification/user/{userId}`
- `POST /api/gamification/redeem`

---

#### Service 1.2: Frontend - Staff Dashboard
**Tech:** React + TypeScript + Node.js + Tailwind

**Responsibilities:**
- Unit grid overview
- Create Task
- Task completion timeline
- Alert feed
- Voucher audit log
- Real-time updates (WebSocket / Long polling / On request)

**APIs Called:**
- `GET /api/units/overview`
- `GET /api/alerts/active`
- `PATCH /api/alerts/{alertId}/acknowledge`
- `GET /api/gamification/stats` (aggregate)

---

### Backend Services

#### Service 3: Task Service
**Tech:** Node.js (NestJS)

**Responsibilities:**
- Generate daily task instances (cron job)
- Handle task completion
- Handle snooze logic (15-min timer, 1× limit)
- Mark tasks as missed (if overdue >15 min)
- Emit events to Alert Service

**Database Tables:** `tasks`, `user_task_schedules`, `task_instances`

**Endpoints:**
```
POST   /api/tasks/generate-daily      (cron-triggered)
GET    /api/tasks/user/{userId}/today
POST   /api/tasks/{instanceId}/complete
POST   /api/tasks/{instanceId}/snooze
PATCH  /api/tasks/{instanceId}/status
```

---

#### Service 4: Account Service
**Tech:** Node.js (Express)

**Responsibilities:**
- CRUD user profiles
- Manage accessibility preferences
- Assign tasks to users
- Handle authentication tokens (if not using Supabase Auth)
- Login Function
- Double Tap Profile - To change (Something similar)

**Database Tables:** `users`, `user_task_schedules`

**Endpoints:**
```
GET    /api/users/{userId}
PATCH  /api/users/{userId}/preferences
GET    /api/users/{userId}/assigned-tasks
POST   /api/users/{userId}/assign-task
```

---

#### Service 5: Gamification Service
**Tech:** Node.js (Express)

**Responsibilities:**
- Calculate daily streaks (midnight job)
- Award points on task completion
- Check badge unlock criteria
- Handle voucher redemption
- Generate unique voucher codes

**Database Tables:** `user_gamification`, `badges`, `user_badges`, `voucher_redemptions`

**Endpoints:**
```
GET    /api/gamification/user/{userId}
POST   /api/gamification/award-points      (internal, called by Task Service)
POST   /api/gamification/check-badges      (internal, cron-triggered)
POST   /api/gamification/redeem-voucher
GET    /api/gamification/stats             (for staff dashboard)
```

---

#### Service 6: Alert Service
**Tech:** Node.js (Express) + Bull Queue (Redis)

**Responsibilities:**
- Monitor for missed tasks (polling every 5 min)
- Send WebSocket notifications to staff dashboard
- (Optional) SMS alerts via Twilio for critical events
- Manage alert lifecycle (created → acknowledged)

**Database Tables:** `alerts`

**Endpoints:**
```
POST   /api/alerts                  (internal, called by Task Service)
GET    /api/alerts/active
PATCH  /api/alerts/{alertId}/acknowledge
DELETE /api/alerts/{alertId}
```

---

#### Service 7: Database Layer
**Tech:** MongoDB (with potential migration to PostgreSQL + Supabase)

**Responsibilities:**
- Single source of truth for all data
- Real-time subscriptions (WebSocket)
- Row-Level Security (RLS) policies (if using Supabase)
- Storage for media assets (task videos, icons)

> Not a separate microservice - shared backend-as-a-service

---

### Camera Services (Phase 2)

#### Service 8: Vision Processing Service
**Tech:** Python 3.11 + FastAPI + OpenCV + MediaPipe + YOLO v8

**Responsibilities:**
- Capture video frames from camera (1 FPS to save compute)
- Detect activity-specific objects/poses:
  - Dishwashing: Hands + running water + dish + sponge
  - Teeth brushing: Toothbrush near face + hand motion
  - Medication: Pill bottle + glass of water + hand-to-mouth gesture
  - Cleaning: Mop/broom + floor/surface + sweeping motion
- Calculate confidence score (0-100%)
- Emit detection events when confidence >70%

**Endpoints:**
```
POST   /api/vision/start-detection
       Body: { userId, taskId, taskType }
       Returns: { sessionId }

POST   /api/vision/process-frame
       Body: { sessionId, frameBase64 }
       Returns: { detected, confidence, objects[] }

POST   /api/vision/stop-detection
       Body: { sessionId }
       Returns: { summary: { duration, avgConfidence } }

GET    /api/vision/session/{sessionId}/events
       Returns: [{ timestamp, detected, confidence }]
```

---

#### Service 9: Verification Orchestrator Service
**Tech:** TypeScript + NestJS + XState + Supabase

**Responsibilities:**
- Receive AI detection events from Vision Service
- Maintain verification state machine:
  - `WAITING → AI_DETECTED → USER_PROMPTED → CONFIRMED/REJECTED`
- Decision logic:
  - If confidence ≥90% for ≥30 seconds → Prompt user for confirmation
  - If confidence <70% → Require manual "Done" button only
  - If confidence 70-89% → Show "Almost done!" encouragement + manual confirm
- Aggregate multi-modal verification (AI + user input)
- Final completion sent to Task Service

**Endpoints:**
```
POST   /api/verification/start
       Body: { instanceId, userId, taskId }
       Returns: { verificationSessionId }

POST   /api/verification/ai-event
       Body: { sessionId, confidence, detectedObjects[] }
       (Internal - called by Vision Service)

POST   /api/verification/user-confirm
       Body: { sessionId, userConfirmed: boolean }
       Returns: { completionStatus }

GET    /api/verification/session/{sessionId}
       Returns: { aiConfidence, userConfirmed, finalStatus }
```
