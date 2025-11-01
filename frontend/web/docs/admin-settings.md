# Admin Settings Panel

Comprehensive admin settings section for RunAcademy web admin panel located at `/admin/settings`.

## Overview

The admin settings panel provides system administrators with centralized control over all global system configurations, integrations, and security settings.

## Features

### 📋 Settings Categories

#### 1. General Settings (`general`)
- **Site Name**: Application display name
- **Site Description**: Application description for meta tags
- **Maintenance Mode**: Toggle system-wide maintenance mode
- **Registration Enabled**: Control new user registrations
- **Default Language**: System default language (lv/en)
- **Timezone**: System timezone configuration

#### 2. Security Settings (`security`)
- **Session Timeout**: User session duration (1-168 hours)
- **Max Login Attempts**: Failed login limit (3-10 attempts)
- **Password Min Length**: Minimum password requirements (6-32 chars)
- **Email Verification**: Require email verification for new users
- **Two-Factor Authentication**: Enable 2FA system-wide
- **Allowed Domains**: Domain whitelist for registrations

#### 3. Email Configuration (`email`)
- **SMTP Settings**: Host, port, credentials configuration
- **Sender Information**: From email and name
- **Email Notifications**: System email notification toggle
- **Test Connection**: Built-in SMTP connection testing

#### 4. Notifications (`notifications`)
- **Push Notifications**: Mobile app push notification control
- **Email Notifications**: System email notification toggle
- **Slack Integration**: Slack webhook integration for system alerts
- **Slack Webhook URL**: Webhook configuration

#### 5. API Settings (`api`)
- **Rate Limiting**: API request throttling (10-1000 req/min)
- **Rate Limit Window**: Time window for rate limiting (60-3600 sec)
- **CORS Configuration**: Cross-origin resource sharing settings
- **Allowed Origins**: Whitelist of allowed origins

#### 6. Integrations (`integrations`)
- **Strava Integration**: Client ID and secret configuration
- **Google Analytics**: GA4 tracking configuration
- **Google Fit**: Fitness data integration toggle
- **Garmin Connect**: Device data integration toggle

## 🔧 Technical Implementation

### Component Structure
```typescript
interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  email: EmailSettings;
  notifications: NotificationSettings;
  api: ApiSettings;
  integrations: IntegrationSettings;
}
```

### Key Features

#### Responsive Design
- Mobile-first responsive layout
- Touch-friendly controls
- Collapsible tab navigation
- Optimized for all screen sizes

#### Real-time Validation
- Form validation on input
- Connection testing for SMTP
- Setting dependencies (conditional fields)
- Error handling and user feedback

#### Security Considerations
- Admin-only access (withAdminAuth HOC)
- Password fields with proper masking
- Sensitive data handling
- API token protection

### API Endpoints

#### GET `/api/admin/settings`
Retrieves current system settings
```json
{
  "success": true,
  "settings": SystemSettings
}
```

#### PUT `/api/admin/settings`
Updates system settings
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

#### POST `/api/admin/test-email`
Tests SMTP connection
```json
{
  "success": true,
  "message": "Connection successful"
}
```

## 🚀 Usage

### Accessing Settings
1. Log in as admin user
2. Navigate to Admin Panel
3. Click "Sistēmas iestatījumi" in sidebar
4. Select desired settings category

### Saving Changes
1. Modify settings in any category
2. Click "Saglabāt izmaiņas" button
3. Confirm success message
4. Changes take effect immediately

### Testing Configurations
- **Email Settings**: Use "Testēt savienojumu" button
- **Rate Limiting**: Monitor API response times
- **CORS**: Check browser console for CORS errors

## 🔍 Settings Details

### Maintenance Mode
When enabled:
- Blocks all non-admin users
- Shows maintenance message
- Allows admin access for testing
- Preserves user sessions

### Rate Limiting
- Protects against API abuse
- Configurable per-minute limits
- Rolling window implementation
- Bypass for admin users

### Email Configuration
- Supports standard SMTP providers
- Built-in connection testing
- Template customization support
- Delivery failure handling

### Security Features
- Session management
- Password policy enforcement
- Failed login tracking
- Domain-based restrictions

## 📱 Mobile Responsiveness

- **Tablet Navigation**: Horizontal scrolling tabs
- **Mobile Layout**: Stacked form elements
- **Touch Targets**: 44px minimum button sizes
- **Safe Areas**: iOS device compatibility

## 🛠 Development

### Adding New Settings
1. Update `SystemSettings` interface
2. Add form fields to appropriate tab
3. Implement backend validation
4. Update API endpoints
5. Add database migration

### Testing
```bash
# Build and test
npm run build

# Check for TypeScript errors
npm run type-check

# Run linting
npm run lint
```

## 🔒 Security Notes

- All settings require admin authentication
- Sensitive values (passwords, tokens) are masked
- API calls use JWT authentication
- Input validation on client and server
- SQL injection prevention
- XSS protection

## 📊 Performance

- Lazy loading of settings data
- Efficient form state management
- Minimal re-renders
- Optimized bundle size (6.97 kB)
- Fast navigation between tabs

## 🐛 Troubleshooting

### Common Issues

#### Settings Not Saving
- Check admin authentication
- Verify API endpoint availability
- Check browser console for errors
- Confirm network connectivity

#### Email Test Failing
- Verify SMTP credentials
- Check firewall settings
- Confirm port accessibility
- Test with different SMTP provider

#### Rate Limiting Too Strict
- Increase requests per minute
- Extend time window
- Check for legitimate high usage
- Consider IP whitelisting

### Debug Mode
Enable debugging in browser console:
```javascript
localStorage.setItem('admin-debug', 'true');
```

## 🔄 Future Enhancements

- [ ] Backup and restore functionality
- [ ] Settings import/export
- [ ] Change history tracking
- [ ] Advanced analytics configuration
- [ ] Multi-environment support
- [ ] Settings validation rules
- [ ] Bulk operations
- [ ] Settings search and filtering