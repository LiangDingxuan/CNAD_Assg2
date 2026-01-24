# Database Schema

## Account Service (Database: `account`)

### users

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| username | String | Yes | - | Unique, trimmed |
| email | String | No | null | Unique (sparse), trimmed |
| role | String (enum) | Yes | - | `admin`, `staff`, `resident` |
| unitId | ObjectId (ref: Unit) | No | null | null for admins (cross-unit access) |
| passwordHash | String | No | null | null for residents |
| passwordSalt | String | No | null | null for residents |
| pinHash | String | No | null | 4-digit PIN, residents only |
| pinSalt | String | No | null | residents only |
| isActive | Boolean | No | true | Soft deletion flag |
| createdAt | Date | Auto | - | Mongoose timestamps |
| updatedAt | Date | Auto | - | Mongoose timestamps |

### units

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| unitNumber | String | Yes | - | Unique |
| floor | Number | No | null | |
| block | String | No | null | |
| isActive | Boolean | No | true | Soft deletion flag |
| createdAt | Date | Auto | - | Mongoose timestamps |
| updatedAt | Date | Auto | - | Mongoose timestamps |

### tabletSessions

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| tabletId | String | Yes | - | Unique identifier (e.g. "unit-12-tablet-1") |
| unitId | ObjectId (ref: Unit) | Yes | - | Which unit this tablet belongs to |
| deviceSecret | String | Yes | - | 32-byte hex, generated at registration |
| loggedInUsers | [ObjectId] (ref: User) | No | [] | Max 2 residents |
| createdAt | Date | Auto | - | Mongoose timestamps |
| updatedAt | Date | Auto | - | Mongoose timestamps |

### refreshTokens

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| userId | ObjectId (ref: User) | Yes | - | Which resident owns this token |
| tabletId | String | Yes | - | Which tablet issued it |
| token | String | Yes | - | Unique, random token value |
| expiresAt | Date | Yes | - | 7-day expiry from issuance |
| createdAt | Date | Auto | - | Mongoose timestamps |
| updatedAt | Date | Auto | - | Mongoose timestamps |

---

## Task Service (Database: `Task`)

### tasks

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| name | String | Yes | - | Task name |
| description | String | No | - | Task description |
| status | String (enum) | No | `pending` | `pending`, `in_progress`, `completed`, `snoozed`, `missed` |
| time_taken | Number | No | - | Minutes taken to complete |
| createdAt | Date | Auto | - | Mongoose timestamps |
| updatedAt | Date | Auto | - | Mongoose timestamps |
