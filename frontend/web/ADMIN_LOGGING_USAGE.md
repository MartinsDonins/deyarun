# Admin Logging System - Usage Guide

The admin logging system has been implemented to help administrators identify data processing issues and debug problems in the frontend application.

## Features

### 🔒 Admin-Only Access
- Logs are only created and stored when user has admin role (`admin` or `super_admin`)
- Non-admin users cannot see or access any logs
- Automatic cleanup when user logs out or loses admin privileges

### 📊 Log Categories
- **AUTH**: Authentication related events
- **API_CALL**: All API requests with metadata
- **API_RESPONSE**: API responses with timing and status
- **USER_ACTION**: User interactions (form submissions, navigation)
- **USER_MANAGEMENT**: Admin user management operations
- **DATA_TRANSFORM**: Data processing and transformations
- **ERROR**: All error conditions with context

### 🎛️ Log Levels
- **info**: General information and successful operations
- **warn**: Warnings and non-critical issues
- **error**: Error conditions and failures
- **debug**: Detailed debugging information

## Usage Examples

### Basic Logging
```typescript
import { adminLogger } from '../lib/logger'

// Log an info message
adminLogger.info('USER_ACTION', 'User clicked save button', { formId: 'profile-form' })

// Log an error
adminLogger.error('DATA_PROCESSING', 'Failed to parse user data', { 
  userId: '12345',
  errorDetails: 'Invalid JSON format'
})

// Log a warning
adminLogger.warn('API_RESPONSE', 'API response took longer than expected', { 
  endpoint: '/api/users',
  duration: 5000 
})
```

### API Call Logging (Automatic)
```typescript
// These are automatically logged by the API service
adminLogger.logApiCall('/api/admin/users', 'GET', { filters: { role: 'admin' } })
adminLogger.logApiResponse('/api/admin/users', 200, { usersCount: 10, duration: 250 })
```

### User Action Logging
```typescript
// Form submissions
adminLogger.logUserAction('form_submit', 'user-profile', { 
  fieldCount: 8,
  hasChanges: true 
})

// Navigation
adminLogger.logUserAction('navigate', 'admin-dashboard', { 
  from: '/admin/users',
  to: '/admin/dashboard'
})

// Data operations
adminLogger.logUserAction('delete_user', 'user-123', { 
  reason: 'admin_request',
  confirmDialog: true 
})
```

### Error Logging with Context
```typescript
try {
  // Some operation that might fail
  processUserData(userData)
} catch (error) {
  adminLogger.logError('UserDataProcessor', error, {
    userId: userData.id,
    operationType: 'validation',
    inputSize: JSON.stringify(userData).length
  })
}
```

### Data Transformation Logging
```typescript
// Log data transformations for debugging
const originalData = apiResponse.users
const transformedData = originalData.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`
}))

adminLogger.logDataTransformation(
  'UserListProcessor',
  'Added fullName field to users',
  originalData,
  transformedData
)
```

## Log Viewer Interface

### Admin Dashboard Integration
The log viewer is integrated into the admin dashboard at `/admin/dashboard` and provides:

- **Real-time Updates**: Logs refresh every 2 seconds
- **Filtering**: Filter by level, category, or search text
- **Export**: Download logs as JSON for external analysis
- **Expandable Entries**: Click to see full log details
- **Summary View**: Collapsed view shows error/warning counts

### Filters Available
- **Level**: Filter by error, warn, info, debug
- **Category**: Filter by specific log categories
- **Search**: Text search across messages and data
- **Limit**: Control number of logs displayed (50-500)

### Log Entry Details
Each log entry includes:
- Timestamp (both readable and ISO format)
- Log level with color coding
- Category badge
- Message text
- Associated data/context (JSON formatted)
- Current URL when log was created
- User agent information

## Storage and Performance

### Local Storage
- Logs are stored in browser's localStorage
- Maximum 1000 logs kept (oldest removed automatically)
- Storage key: `runacademy_admin_logs`
- Automatic cleanup on admin privilege loss

### Performance Considerations
- Logging only active for admin users
- JSON serialization cached to prevent performance impact
- Large data objects are size-summarized rather than fully logged
- Configurable log limits to prevent memory issues

## Security and Privacy

### Data Protection
- Email addresses are partially masked in logs (`em***@domain.com`)
- Sensitive data should never be logged in plain text
- JWT tokens are logged as boolean presence indicators only
- User passwords and personal data are excluded from logs

### Access Control
- Logs only visible to super_admin and admin role users
- No API endpoints expose logs (frontend-only)
- Automatic cleanup prevents data persistence beyond session

## Integration Points

### Automatic Logging Components
- **useUsers hook**: All user management operations
- **AuthContext**: Login/logout events
- **API Service**: All API calls and responses
- **Forms**: Key form submissions (AddUserModal, etc.)

### Adding Logging to New Components
```typescript
import { adminLogger } from '../lib/logger'

// In form submission handlers
const handleSubmit = (formData) => {
  adminLogger.logUserAction('form_submit', 'component-name', { 
    fieldCount: Object.keys(formData).length 
  })
  
  try {
    // Process form
    await submitForm(formData)
    adminLogger.info('FORM_PROCESSING', 'Form submitted successfully')
  } catch (error) {
    adminLogger.logError('FormProcessor', error, { formType: 'user-profile' })
  }
}
```

## Troubleshooting Common Issues

### Logs Not Appearing
1. Verify user has admin or super_admin role
2. Check browser localStorage is enabled
3. Confirm adminLogger.setAdminStatus(true) was called

### Performance Issues
1. Reduce log limit in viewer settings
2. Clear old logs using "Dzēst" button
3. Check for excessive logging in tight loops

### Missing Context Data
1. Ensure error objects include relevant context
2. Add more descriptive log messages
3. Include operation identifiers for tracing

## Best Practices

### Do Log
- ✅ API call success/failure with timing
- ✅ User actions that modify data
- ✅ Error conditions with context
- ✅ Data transformation operations
- ✅ Authentication events

### Don't Log
- ❌ User passwords or sensitive personal data
- ❌ Complete JWT tokens (log presence only)
- ❌ Excessive detail in tight loops
- ❌ Large binary data or images
- ❌ Third-party API keys or secrets

This logging system provides comprehensive visibility into frontend operations for administrators while maintaining security and performance standards.