# Task Notification Service

## Overview

The Task Notification Service is a comprehensive email notification system that automatically sends emails to users whenever tasks are assigned, updated, reassigned, or have their status changed. This service ensures that users are always informed about changes to their assigned tasks in real-time.

## Features

### 🎯 **Task Assignment Notifications**
- Sends emails when new tasks are assigned to users
- Includes comprehensive task details (name, description, priority, due date, etc.)
- Works for both individual task creation and bulk task uploads

### 🔄 **Task Update Notifications**
- Notifies users when any field of their assigned task is modified
- Provides detailed change logs showing what was changed
- Includes information about who made the changes

### 📊 **Status Change Notifications**
- Specialized emails for task status changes
- Context-aware messages based on the new status
- Motivational messages for completed tasks
- Warning messages for escalated tasks

### 👥 **Task Reassignment Notifications**
- Alerts users when tasks are transferred to them
- Shows who previously had the task
- Includes who initiated the reassignment

## Service Functions

### Core Functions

#### `sendTaskAssignmentEmail(task, assignedUser, client)`
Sends notification when a task is first assigned to a user.

**Parameters:**
- `task`: The task object with all details
- `assignedUser`: The user object the task is assigned to
- `client`: The client/entity the task is for

#### `sendTaskUpdateEmail(task, assignedUser, client, changes, updatedBy)`
Sends notification when a task is updated with general changes.

**Parameters:**
- `task`: The updated task object
- `assignedUser`: The user the task is assigned to
- `client`: The client/entity the task is for
- `changes`: Object containing field changes
- `updatedBy`: The user who made the changes

#### `sendTaskStatusChangeEmail(task, assignedUser, client, oldStatus, newStatus, updatedBy)`
Sends specialized notification for status changes.

**Parameters:**
- `task`: The task object
- `assignedUser`: The user the task is assigned to
- `client`: The client/entity the task is for
- `oldStatus`: Previous status value
- `newStatus`: New status value
- `updatedBy`: The user who changed the status

#### `sendTaskReassignmentEmail(task, newAssignedUser, previousAssignedUser, client, reassignedBy)`
Sends notification when a task is reassigned to a different user.

**Parameters:**
- `task`: The task object
- `newAssignedUser`: The new user the task is assigned to
- `previousAssignedUser`: The previous user who had the task
- `client`: The client/entity the task is for
- `reassignedBy`: The user who initiated the reassignment

#### `getTaskNotificationData(task)`
Helper function to extract user and client information from a task.

**Parameters:**
- `task`: The task object

**Returns:**
- Object with `assignedUser` and `client` properties

## Integration Points

### 1. Task Creation (`createTask`)
- Automatically sends assignment emails when tasks are created
- Works for both immediate and scheduled task creation
- Handles both individual and bulk task creation

### 2. Task Updates (`updateTask`)
- Sends appropriate notifications based on the type of change
- Automatically detects reassignments, status changes, and general updates
- Creates comprehensive audit trails with email notifications

### 3. Bulk Task Upload (`uploadTasksFromFile`)
- Sends assignment emails for all tasks uploaded via file
- Processes Excel (.xlsx, .xls) and CSV files
- Handles multiple users and clients efficiently

## Email Templates

### Assignment Email Template
```
Subject: New Task Assigned: [Task Name]

Dear [User Name],

You have been assigned a new task:

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: [Priority with emoji]
📅 Due Date: [Formatted Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]
⏱️ Estimated Hours: [Hours]

Please review the task details and update the status accordingly.

Best regards,
Compli-AI Team
```

### Update Email Template
```
Subject: Task Updated: [Task Name]

Dear [User Name],

Your assigned task has been updated:

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: [Priority with emoji]
📅 Due Date: [Formatted Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]
⏱️ Estimated Hours: [Hours]

🔄 Changes Made:
• [Field Name]: [Old Value] → [New Value]
• [Field Name]: [Old Value] → [New Value]

👤 Updated by: [User Name] ([Email])

Please review the changes and take any necessary action.

Best regards,
Compli-AI Team
```

### Status Change Email Template
```
Subject: Task Status Changed: [Task Name] - [New Status]

Dear [User Name],

The status of your assigned task has been changed:

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: [Priority with emoji]
📅 Due Date: [Formatted Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]

🔄 Status Change: [Old Status] → [New Status]

👤 Status changed by: [User Name] ([Email])

[Context-specific message based on new status]

Best regards,
Compli-AI Team
```

## Configuration

### Environment Variables
The service uses the existing email configuration from your `.env` file:

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### Email Service Dependencies
- **Nodemailer**: For SMTP email delivery
- **Logger**: For comprehensive logging of email operations
- **User Model**: For user information retrieval
- **Client Model**: For client/entity information

## Error Handling

### Graceful Degradation
- Email failures don't interrupt task operations
- Comprehensive error logging for debugging
- Fallback mechanisms for missing user/client data

### Logging
All email operations are logged with:
- Success/failure status
- Task and user IDs
- Error details when failures occur
- Timestamps for audit purposes

## Testing

### Test Script
Run the included test script to verify email functionality:

```bash
node test-task-notifications.js
```

### Test Coverage
The test script covers:
- Task assignment emails
- Task update emails
- Status change emails
- Reassignment emails
- Data extraction functions

## Usage Examples

### Basic Task Assignment
```javascript
const { taskNotificationService } = require('../services');

// Send assignment email
await taskNotificationService.sendTaskAssignmentEmail(task, user, client);
```

### Task Update with Changes
```javascript
const changes = {
  priority: { from: 'medium', to: 'high' },
  dueDate: { from: '2024-03-25', to: '2024-03-31' }
};

await taskNotificationService.sendTaskUpdateEmail(
  updatedTask, 
  assignedUser, 
  client, 
  changes, 
  updatedBy
);
```

### Status Change Notification
```javascript
await taskNotificationService.sendTaskStatusChangeEmail(
  task,
  assignedUser,
  client,
  'open',
  'inprogress',
  updatedBy
);
```

## Best Practices

### 1. **Error Handling**
Always wrap email notifications in try-catch blocks to prevent task operations from failing due to email issues.

### 2. **Async Operations**
Email notifications are asynchronous and won't block the main task operations.

### 3. **User Validation**
The service automatically handles various user identification methods (ID, name, email).

### 4. **Client Resolution**
Automatically resolves client/entity references to provide meaningful context in emails.

### 5. **Logging**
All operations are logged for monitoring and debugging purposes.

## Troubleshooting

### Common Issues

#### Email Not Sending
1. Check SMTP configuration in `.env`
2. Verify email server credentials
3. Check firewall/network settings
4. Review email service logs

#### User Not Found
1. Verify user exists in database
2. Check user ID format and references
3. Ensure user has valid email address

#### Client Information Missing
1. Verify client exists in database
2. Check entity field references
3. Ensure proper client model relationships

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment.

## Future Enhancements

### Planned Features
- **Email Templates**: Customizable HTML email templates
- **Notification Preferences**: User-configurable notification settings
- **SMS Notifications**: Integration with SMS services
- **Push Notifications**: Real-time browser notifications
- **Digest Emails**: Daily/weekly task summaries
- **Escalation Notifications**: Automatic escalation for overdue tasks

### Integration Opportunities
- **Slack/Teams**: Send notifications to chat platforms
- **Calendar Integration**: Add tasks to user calendars
- **Mobile App**: Push notifications for mobile users
- **Webhook Support**: External system integrations

## Support

For issues or questions about the Task Notification Service:
1. Check the application logs for error details
2. Verify email configuration settings
3. Test with the provided test script
4. Review this documentation for usage examples

---

**Version**: 1.0.0  
**Last Updated**: March 2024  
**Maintainer**: Compli-AI Development Team
