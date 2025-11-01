# DeyaRun - API Documentation

Complete API reference for the DeyaRun backend. All endpoints return JSON responses.

---

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Workouts](#workouts)
5. [Training Plans](#training-plans)
6. [Integrations](#integrations)
7. [Admin Endpoints](#admin-endpoints)
8. [Error Handling](#error-handling)

---

## Base Information

### Base URLs

| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:3001` |
| **Production** | `https://api.deyarun.com` |

### OpenAPI Specification

Complete OpenAPI 3.0 spec available at: `backend/docs/openapi.yaml`

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK - Successful GET/PUT/DELETE |
| `201` | Created - Successful POST |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing/invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server error |

### Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated users**: 200 requests per 15 minutes
- **Admin users**: No limit

---

## Authentication

### Register New User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Authentication Cookie:**
- httpOnly cookie `auth_token` set automatically
- Use either cookie OR `Authorization: Bearer <token>` header

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "subscription": {
      "plan": "free",
      "status": "active"
    },
    "integrations": {
      "strava": { "connected": false },
      "googleFit": { "connected": false }
    }
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Forgot Password

```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## User Management

### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 175,
    "weight": 70,
    "fitnessLevel": "intermediate",
    "weeklyGoal": 30,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Update User Profile

```http
PUT /api/users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "height": 178,
  "weight": 72,
  "weeklyGoal": 35
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Smith",
    "height": 178,
    "weight": 72,
    "weeklyGoal": 35
  },
  "message": "Profile updated successfully"
}
```

### Get User Statistics

```http
GET /api/users/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalWorkouts": 42,
    "totalDistance": 315.5,
    "totalDuration": 156000,
    "averagePace": 5.8,
    "thisWeek": {
      "workouts": 3,
      "distance": 25.5,
      "goalProgress": 85
    },
    "thisMonth": {
      "workouts": 12,
      "distance": 98.3
    }
  }
}
```

---

## Workouts

### List Workouts

```http
GET /api/workouts?page=1&limit=20&type=running&sort=-date
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `type` | string | all | Filter by type (running, cycling, walking) |
| `sort` | string | -date | Sort field (prefix - for descending) |
| `startDate` | string | - | Filter from date (ISO 8601) |
| `endDate` | string | - | Filter to date (ISO 8601) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "workouts": [
      {
        "id": "507f1f77bcf86cd799439011",
        "type": "running",
        "date": "2025-11-01T08:00:00Z",
        "duration": 3600,
        "distance": 10000,
        "pace": 6.0,
        "avgHeartRate": 145,
        "calories": 650,
        "source": "app"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 42,
      "itemsPerPage": 20
    }
  }
}
```

### Get Workout Details

```http
GET /api/workouts/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "type": "running",
    "date": "2025-11-01T08:00:00Z",
    "duration": 3600,
    "distance": 10000,
    "pace": 6.0,
    "avgHeartRate": 145,
    "maxHeartRate": 165,
    "calories": 650,
    "elevationGain": 120,
    "source": "app",
    "route": {
      "type": "LineString",
      "coordinates": [
        [24.1051, 56.9496],
        [24.1052, 56.9497]
      ]
    },
    "notes": "Great morning run!",
    "createdAt": "2025-11-01T08:00:00Z"
  }
}
```

### Create Workout

```http
POST /api/workouts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "running",
  "date": "2025-11-01T08:00:00Z",
  "duration": 3600,
  "distance": 10000,
  "avgHeartRate": 145,
  "route": {
    "type": "LineString",
    "coordinates": [[24.1051, 56.9496], [24.1052, 56.9497]]
  },
  "notes": "Great morning run!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "type": "running",
    "date": "2025-11-01T08:00:00Z",
    "duration": 3600,
    "distance": 10000,
    "pace": 6.0,
    "calories": 650
  },
  "message": "Workout created successfully"
}
```

### Update Workout

```http
PUT /api/workouts/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Updated notes",
  "avgHeartRate": 148
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "notes": "Updated notes",
    "avgHeartRate": 148
  },
  "message": "Workout updated successfully"
}
```

### Delete Workout

```http
DELETE /api/workouts/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workout deleted successfully"
}
```

---

## Training Plans

### List Training Plans

```http
GET /api/training-plans?level=intermediate&goal=10K
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `level` | string | Filter by level (beginner, intermediate, advanced) |
| `goal` | string | Filter by goal (5K, 10K, halfMarathon, marathon) |
| `isPublic` | boolean | Show only public plans |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trainingPlans": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "10K Training Plan",
        "description": "8-week plan for intermediate runners",
        "level": "intermediate",
        "goal": "10K",
        "duration": 8,
        "isPublic": true,
        "createdBy": "507f1f77bcf86cd799439012"
      }
    ]
  }
}
```

### Get Training Plan Details

```http
GET /api/training-plans/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "10K Training Plan",
    "description": "8-week plan for intermediate runners",
    "level": "intermediate",
    "goal": "10K",
    "duration": 8,
    "weeksData": [
      {
        "weekNumber": 1,
        "workouts": [
          {
            "day": 1,
            "type": "running",
            "distance": 5000,
            "duration": 1800,
            "intensity": "easy",
            "description": "Easy run"
          }
        ]
      }
    ]
  }
}
```

### Enroll in Training Plan

```http
POST /api/training-plans/:id/enroll
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2025-11-01"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enrollmentId": "507f1f77bcf86cd799439013",
    "trainingPlanId": "507f1f77bcf86cd799439011",
    "startDate": "2025-11-01",
    "endDate": "2025-12-27",
    "status": "active"
  },
  "message": "Enrolled in training plan successfully"
}
```

---

## Integrations

### Strava

#### Initiate Strava OAuth

```http
GET /api/strava/auth
Authorization: Bearer <token>
```

**Response (302):**
Redirects to Strava authorization page.

#### Strava OAuth Callback

```http
GET /api/strava/callback?code=xxx&scope=xxx
```

Internal endpoint - handled automatically after Strava authorization.

#### Sync Strava Activities

```http
POST /api/strava/sync
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "synced": 15,
    "skipped": 3,
    "failed": 0
  },
  "message": "Strava activities synced successfully"
}
```

#### Disconnect Strava

```http
DELETE /api/strava/disconnect
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Strava disconnected successfully"
}
```

### Google Fit

#### Initiate Google Fit OAuth

```http
GET /api/google-fit/auth
Authorization: Bearer <token>
```

**Response (302):**
Redirects to Google OAuth consent screen.

#### Google Fit OAuth Callback

```http
GET /api/google-fit/callback?code=xxx&scope=xxx
```

Internal endpoint - handled automatically after Google authorization.

#### Sync Google Fit Data

```http
POST /api/google-fit/sync
Authorization: Bearer <token>
```

**Request Body (optional):**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-11-01"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "synced": 25,
    "skipped": 5,
    "failed": 0
  },
  "message": "Google Fit data synced successfully"
}
```

#### Disconnect Google Fit

```http
DELETE /api/google-fit/disconnect
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google Fit disconnected successfully"
}
```

---

## Admin Endpoints

**Note:** All admin endpoints require `admin` role.

### List All Users

```http
GET /api/admin/users?page=1&limit=50&role=user
Authorization: Bearer <admin-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page (max 100) |
| `role` | string | Filter by role (user, admin, coach) |
| `search` | string | Search by email/name |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "subscription": {
          "plan": "premium",
          "status": "active"
        },
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 500
    }
  }
}
```

### Get System Statistics

```http
GET /api/admin/statistics
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 500,
      "active": 450,
      "newThisMonth": 35
    },
    "workouts": {
      "total": 5000,
      "thisMonth": 450
    },
    "integrations": {
      "strava": 120,
      "googleFit": 80
    },
    "subscriptions": {
      "free": 400,
      "premium": 90,
      "coach": 10
    }
  }
}
```

### Get Deployment Status

```http
GET /api/admin/deployment-status
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "version": "1.17.124",
    "environment": "production",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "connections": 5
    },
    "cache": {
      "hitRate": 0.75,
      "size": 1024000
    }
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-11-01T12:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Email is required"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters"
        }
      ]
    }
  }
}
```

---

## Health Check Endpoints

### Simple Health Check

```http
GET /health-simple
```

No authentication required. Returns 200 if server is running.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

### Comprehensive Health Check

```http
GET /health
```

No authentication required. Checks server + database connectivity.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00Z",
  "version": "1.17.124",
  "database": "connected",
  "uptime": 86400
}
```

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST https://api.deyarun.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST https://api.deyarun.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get workouts (with token)
curl -X GET https://api.deyarun.com/api/workouts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import OpenAPI spec: `backend/docs/openapi.yaml`
2. Set environment variable `baseUrl` = `https://api.deyarun.com`
3. Add token to Authorization → Bearer Token

---

**Last Updated**: 2025-11-01
**API Version**: v1.17.124
**OpenAPI Spec**: `backend/docs/openapi.yaml`
