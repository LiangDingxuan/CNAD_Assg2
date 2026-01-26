# Account Service — Implementation Design (Final)

## Core Architecture

**Identity & Access Control Layer** — Centralised authentication and user profile management. Serves as the authoritative source for identity across all microservices.

**Multi-Tenancy Isolation** — Unit-based access boundaries. Staff see only their assigned unit's residents. Admin bypasses unit restrictions.

**Persistent PWID Sessions** — Residents remain logged into tablets until admin logs them out. PIN verification grants a limited-scope JWT for API access. Token refresh is handled via refresh tokens (not PIN re-entry).

---

## Database Schema (Mongoose)

### users (Identity Store)

```js
{
  username:     { type: String, required: true, unique: true, trim: true },
  email:        { type: String, unique: true, sparse: true, trim: true }, // nullable for residents
  role:         { type: String, enum: ['admin', 'staff', 'resident'], required: true },
  unitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null }, // null for admins (cross-unit access)
  passwordHash: { type: String, default: null }, // null for residents
  passwordSalt: { type: String, default: null }, // null for residents
  pinHash:      { type: String, default: null }, // 4-digit PIN hash, residents only
  pinSalt:      { type: String, default: null },
  isActive:     { type: Boolean, default: true },
  timestamps:   true // createdAt, updatedAt
}
```

**Notes:**
- `email` uses `sparse: true` so multiple null values don't violate uniqueness
- `passwordHash`/`passwordSalt` null for residents (they use PIN only)
- `pinHash`/`pinSalt` null for admin/staff (they use password only)
- Soft deletion via `isActive` preserves audit trails
- `unitId` is an ObjectId reference to the `units` collection for referential integrity and `.populate()` support

### units (Multi-Tenancy Boundary)

```js
{
  unitNumber: { type: String, required: true, unique: true },
  floor:      { type: Number, default: null },
  block:      { type: String, default: null },
  isActive:   { type: Boolean, default: true },
  timestamps: true
}
```

### tabletSessions (Persistent PWID Sessions)

```js
{
  tabletId:      { type: String, required: true, unique: true },
  unitId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  deviceSecret:  { type: String, required: true }, // API key assigned during tablet registration
  loggedInUsers: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: [v => v.length <= 2, 'Maximum 2 residents per tablet']
  },
  timestamps: true
}
```

**Notes:**
- Tracks which residents are logged into which tablet
- Admin can log up to 2 residents into the same tablet (shared household)
- `tabletId` is an assigned identifier (e.g. "unit-12-tablet-1")
- `deviceSecret` is generated during tablet registration and sent with requests from the tablet as `X-Device-Secret` header
- `loggedInUsers` is capped at 2 (can be 0 when no PWID has moved in yet)

### refreshTokens (Token Refresh for Residents)

```js
{
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tabletId:  { type: String, required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  timestamps: true
}
```

**Notes:**
- Issued alongside the access JWT after successful PIN verification
- Stored in httpOnly cookie on the tablet
- Used to silently refresh expired access tokens without re-entering PIN
- Expiry: 7 days (admin logout invalidates by deleting the record)

---

## Standardized Error Response Format

All error responses follow this shape:

```json
{
  "error": {
    "code": "USERNAME_EXISTS",
    "message": "A user with this username already exists."
  }
}
```

**Error codes used:**

| Code | HTTP | Meaning |
|------|------|---------|
| `MISSING_FIELDS` | 400 | Required fields not provided |
| `INVALID_PIN_FORMAT` | 400 | PIN is not exactly 4 digits |
| `INVALID_CREDENTIALS` | 401 | Username/password mismatch |
| `INVALID_PIN` | 401 | PIN verification failed |
| `ACCOUNT_DEACTIVATED` | 403 | Account isActive === false |
| `INSUFFICIENT_ROLE` | 403 | Role not authorized for action |
| `UNIT_MISMATCH` | 403 | Resident's unit doesn't match tablet's unit |
| `TABLET_FULL` | 403 | Tablet already has 2 residents |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `NOT_LOGGED_IN` | 404 | User not in tablet's loggedInUsers |
| `UNIT_NOT_FOUND` | 404 | Unit does not exist |
| `USERNAME_EXISTS` | 409 | Duplicate username |
| `INVALID_DEVICE_SECRET` | 401 | Tablet device secret mismatch |

---

## Core Business Logic

### 1. Admin/Staff Login (Password-Based)

**Purpose:** Admin/staff authenticate to access dashboards.

**Flow:**
1. Validate username and password provided
2. Query user by username, check `isActive === true`
3. Reject if role is `'resident'` (residents don't use password login)
4. Verify password with async `crypto.scrypt` + `crypto.timingSafeEqual`
5. Generate JWT:
```json
{
  "sub": "ObjectId",
  "username": "string",
  "role": "admin|staff",
  "unitId": "string|null",
  "iat": 1706000000,
  "exp": 1706028800
}
```
6. Return `{ token, user: { id, username, role, unitId } }`

**Error Responses:**
- 400 `MISSING_FIELDS`: Missing fields
- 401 `INVALID_CREDENTIALS`: Invalid credentials or account is resident
- 403 `ACCOUNT_DEACTIVATED`: Account deactivated

### 2. Resident Registration (Admin Action)

**Purpose:** Admin creates resident account when PWID moves into unit.

**Flow:**
1. Validate requester is admin
2. Validate: username (3-20 chars, alphanumeric + underscore), pin (exactly 4 digits), unitId (must exist as ObjectId)
3. Check duplicate username → 409
4. Generate salt, hash PIN: `await scrypt(pin, salt, 64)`
5. Create user with `role: 'resident'`, `passwordHash: null`, `passwordSalt: null`
6. Return 201 with `{ id, username, unitId }` (PIN not echoed back)

**Error Responses:**
- 400 `INVALID_PIN_FORMAT`: Invalid PIN format or missing fields
- 403 `INSUFFICIENT_ROLE`: Requester not admin
- 409 `USERNAME_EXISTS`: Username exists

### 3. Tablet Registration (Admin Action)

**Purpose:** Admin registers a new tablet, generating a device secret for API access.

**Flow:**
1. Validate requester is admin
2. Validate: tabletId (string identifier), unitId (must exist)
3. Generate a random device secret (32-byte hex string)
4. Create tabletSession with empty `loggedInUsers`
5. Return `{ tabletId, unitId, deviceSecret }` (device secret shown once, stored on tablet)

**Error Responses:**
- 403 `INSUFFICIENT_ROLE`: Requester not admin
- 409: Tablet already registered

### 4. Admin Logs Resident into Tablet

**Purpose:** Admin uses admin panel to add a resident to a tablet's active user list.

**Flow:**
1. Validate requester is admin
2. Validate target user exists, `role === 'resident'`, `isActive === true`
3. Verify resident's `unitId` matches tablet's `unitId` → 403 if mismatch
4. Check `loggedInUsers.length < 2` → 403 `TABLET_FULL` if at cap
5. `$addToSet` userId to `loggedInUsers`
6. Return `{ tabletId, loggedInUsers: [...] }`

**Implementation:**
```js
const session = await TabletSession.findOne({ tabletId });
if (session.loggedInUsers.length >= 2) {
  return res.status(403).json({ error: { code: 'TABLET_FULL', message: '...' } });
}
await TabletSession.findOneAndUpdate(
  { tabletId },
  { $addToSet: { loggedInUsers: userId } },
  { new: true }
);
```

### 5. Resident Accesses Dashboard (PIN Verification)

**Purpose:** Resident enters PIN to access their personalised dashboard on an already-logged-in tablet.

**Flow:**
1. Validate `X-Device-Secret` header matches tablet's `deviceSecret`
2. Query tablet session by `tabletId`
3. Check userId is in `loggedInUsers` → 404 if not
4. Verify PIN with async `crypto.scrypt` + `crypto.timingSafeEqual`
5. Issue a limited-scope access JWT (1 hour expiry):
```json
{
  "sub": "ObjectId",
  "username": "string",
  "role": "resident",
  "unitId": "string",
  "tabletId": "string",
  "iat": 1706000000,
  "exp": 1706003600
}
```
6. Issue a refresh token (7-day expiry), store in DB, set as httpOnly cookie
7. Return `{ token, user: { id, username, unitId } }`

**Why refresh tokens:** The resident's dashboard calls the Task Service. Instead of caching the PIN in session storage (XSS risk), a refresh token in an httpOnly cookie silently mints new access JWTs when they expire.

**Error Responses:**
- 401 `INVALID_DEVICE_SECRET`: Device secret mismatch
- 401 `INVALID_PIN`: Invalid PIN
- 404 `NOT_LOGGED_IN`: User not logged into this tablet

### 6. Token Refresh (Resident)

**Purpose:** Silently refresh an expired access JWT using the refresh token.

**Flow:**
1. Read refresh token from httpOnly cookie
2. Look up in `refreshTokens` collection, verify not expired
3. Verify associated user is still active and still in tablet's `loggedInUsers`
4. Issue new access JWT (1 hour)
5. Return `{ token }`

**Error Responses:**
- 401: Refresh token expired or invalid

### 7. Admin Logs Resident out of Tablet

**Purpose:** Remove resident from tablet when they move out or for troubleshooting.

**Flow:**
1. Validate requester is admin
2. `$pull` userId from `loggedInUsers`
3. Delete any refresh tokens for this user + tablet combination
4. Return updated session

**Implementation:**
```js
await TabletSession.findOneAndUpdate(
  { tabletId },
  { $pull: { loggedInUsers: userId } },
  { new: true }
);
await RefreshToken.deleteMany({ userId, tabletId });
```

### 8. User Profile Updates (Admin Only)

**Allowed fields:** username, email, pin, unitId, isActive

**Flow:**
1. Validate requester is admin
2. If changing username or email — check uniqueness
3. If changing pin — generate new salt, hash new PIN (async)
4. If changing unitId — verify target unit exists and is active; remove user from any tablet sessions in the **old** unit; delete associated refresh tokens
5. If setting `isActive: false` — remove user from any tablet sessions; delete their refresh tokens
6. Return updated user object

---

## API Endpoints

### Authentication (4 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Admin/staff login, returns JWT |
| GET | `/api/auth/me` | Bearer | Returns current user profile |
| POST | `/api/auth/logout` | Bearer | Returns 204 No Content (client discards token) |
| POST | `/api/auth/refresh` | Cookie | Refresh access token using refresh token |

**Note:** No public `/register` endpoint. All user creation goes through admin-only user management.

### User Management (4 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | List users. Query: `?role=&unitId=&isActive=` |
| GET | `/api/users/:userId` | Admin | Get single user |
| POST | `/api/users` | Admin | Create user (staff with password, resident with PIN) |
| PATCH | `/api/users/:userId` | Admin | Update user fields |

### Tablet Sessions (5 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tablets/register` | Admin | Register tablet, returns device secret |
| POST | `/api/tablets/:tabletId/login` | Admin | Log resident into tablet |
| POST | `/api/tablets/:tabletId/verify-pin` | Device Secret | Resident PIN verification, returns JWT + refresh token |
| POST | `/api/tablets/:tabletId/logout` | Admin | Log resident out of tablet |
| GET | `/api/tablets/:tabletId/sessions` | Device Secret | Get logged-in users for tablet UI (returns display names only) |

### Units (3 endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/units` | Staff+ | List active units |
| POST | `/api/units` | Admin | Create unit |
| PATCH | `/api/units/:unitId` | Admin | Update unit (including deactivation via isActive: false) |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Readiness check |

**Total: 17 endpoints (including health)**

---

## Middleware Pipeline

### 1. requireAuth
- Extract Bearer token from Authorization header
- Verify JWT signature and expiry
- Attach decoded payload to `req.user`
- Applied to all endpoints except: `/api/auth/login`, `/api/tablets/:tabletId/verify-pin`, `/api/tablets/:tabletId/sessions`, `/api/auth/refresh`, `/health`

### 2. requireRole(allowedRoles)
- Check `req.user.role` against allowed list
- Return 403 `INSUFFICIENT_ROLE` if not permitted
- Applied to: all `/api/users/*`, POST/PATCH `/api/units`, tablet login/logout/register

### 3. requireDeviceSecret
- Extract `X-Device-Secret` header
- Look up tablet session by `tabletId` param
- Compare secrets with `crypto.timingSafeEqual`
- Applied to: `/api/tablets/:tabletId/verify-pin`, `/api/tablets/:tabletId/sessions`

### 4. Rate limiting (express-rate-limit, in-memory store)
- Login: 5 attempts per IP per 15 minutes
- PIN verification: 5 attempts per IP per 15 minutes

---

## What's Deferred

| Feature | Reason |
|---------|--------|
| Redis token blacklisting | Short-lived JWTs are sufficient. Add later if force-logout becomes a requirement. |
| Event emissions | Services communicate via REST only. Gamification service will poll or be notified via REST when added. |
| Password change/reset | Not critical for MVP. Admin can update credentials directly. |
| Input sanitization library | Basic validation in controllers for now. Can add express-validator later. |
| Frontend integration details | Frontend team handles auth flow with the JWT contract defined above. |

---

## File Structure

```
Account_service/
├── models/
│   ├── user.model.js
│   ├── unit.model.js
│   ├── tabletSession.model.js
│   └── refreshToken.model.js
├── config/
│   └── db.js
├── controllers/
│   ├── auth.controller.js       (login, me, logout, refresh)
│   ├── user.controller.js       (CRUD)
│   ├── tablet.controller.js     (register, session management)
│   └── unit.controller.js       (CRUD)
├── middleware/
│   ├── auth.middleware.js       (requireAuth, requireRole, requireDeviceSecret)
│   └── rateLimiter.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── tablet.routes.js
│   └── unit.routes.js
├── utils/
│   ├── password.utils.js        (hash/verify passwords, async scrypt)
│   └── pin.utils.js             (hash/verify PINs, async scrypt)
├── index.js                     (mount all routes)
├── Dockerfile
├── package.json                 (remove redis, add express-rate-limit)
└── package-lock.json
```

---

## Implementation Order

### Phase 1 — Fix Bugs & Restructure
- Fix file naming/path mismatches (controller import, model location)
- Update `user.model.js` schema to match design (nullable fields, ObjectId unitId, PIN fields, isActive)
- Update `auth.controller.js` to use standardized error format and reject resident login
- Rename `utils/password.js` → `utils/password.utils.js`

### Phase 2 — Models & Utils
- Create `models/unit.model.js`
- Create `models/tabletSession.model.js`
- Create `models/refreshToken.model.js`
- Create `utils/pin.utils.js`

### Phase 3 — Middleware
- Add `requireDeviceSecret` to `middleware/auth.middleware.js`
- Create `middleware/rateLimiter.js` (install `express-rate-limit`)

### Phase 4 — Units CRUD
- Create `controllers/unit.controller.js` + `routes/unit.routes.js`
- Mount in `index.js`

### Phase 5 — User Management CRUD
- Create `controllers/user.controller.js` + `routes/user.routes.js`
- Mount in `index.js`

### Phase 6 — Auth Enhancements
- Add `logout`, `refresh` to `auth.controller.js`
- Update `auth.routes.js`

### Phase 7 — Tablet Session Management
- Create `controllers/tablet.controller.js` + `routes/tablet.routes.js`
- Mount in `index.js`

### Phase 8 — Cleanup
- Remove `redis` from `package.json`
- Remove demo `/api/auth/register` route
- Add error response helper utility

### Phase 9 - Delete functions and Integration
- Full integration into Frontend and other services.
- Since other services are complete, prepare code for implementation
- Integrate delete endpoints across all endpoints possible
