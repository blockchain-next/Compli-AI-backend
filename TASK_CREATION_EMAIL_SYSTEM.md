# Task Creation Email System

## Overview

The Task Creation Email System automatically sends email notifications to users whenever tasks are assigned to them, whether through manual creation or bulk CSV upload. This ensures users are immediately notified of their new responsibilities and can take action accordingly.

## Email Triggers

### 1. Manual Task Creation (`POST /v1/tasks/create-task`)

**When emails are sent:**
- ✅ **Immediate tasks** (due within 7 days) - Email sent immediately upon creation
- ✅ **Future tasks** (due in >7 days) - Email sent when task is created (even though it's scheduled for future)

**Email timing:**
- **Immediate tasks**: Email sent right after task is saved to database
- **Future tasks**: Email sent right after task is saved, even though task status is 'upcoming'

### 2. Bulk CSV Upload (`POST /v1/tasks/upload-tasks`)

**When emails are sent:**
- ✅ **All valid tasks** - Assignment emails sent for each successfully created task
- ✅ **Immediate tasks** (due within 7 days) - Email sent immediately
- ✅ **Future tasks** (due in >7 days) - Email sent immediately
- ✅ **Overdue tasks** - Email sent immediately

**Email timing:**
- Emails sent after all tasks are inserted into database
- Batch processing with error handling for individual email failures

## Email Content

### Task Assignment Email Template

**Subject:** `📋 New Task Assigned - [Task Name]`

**Content includes:**
- Task name and description
- Priority level with color coding
- Due date and recurring frequency
- Client/entity information
- Task category (bucket)
- Estimated hours
- Current status
- Clear call-to-action

**Example:**
```
Dear [User Name],

📋 A new task has been assigned to you:

Task: [Task Name]
Description: [Task Description]
Priority: 🔴 Critical
Due Date: [Due Date]
Client: [Client Name]
Category: [Bucket]
Frequency: [Recurring Frequency]
Estimated Hours: [Hours]

Please review and update the status accordingly.

Best regards,
Compli-AI Team
```

## Implementation Details

### Manual Task Creation Flow

```javascript
// 1. Create task
const task = new Task({...});
await task.save();

// 2. Send assignment email
if (user) {
    try {
        await taskNotificationService.sendTaskAssignmentEmail(task, user, client);
        console.log(`Assignment email sent for task: ${task.name} to ${user.email}`);
    } catch (emailError) {
        console.error('Failed to send assignment email', emailError);
    }
}
```

### CSV Upload Flow

```javascript
// 1. Insert all valid tasks
const insertedTasks = await Task.insertMany(validTasks);

// 2. Send emails for each task
for (const task of insertedTasks) {
    try {
        if (task.assignedTo && task.taskAssigned) {
            const assignedUser = await User.findById(task.assignedTo);
            const client = await Client.findById(task.entity);
            
            if (assignedUser && assignedUser.email) {
                await taskNotificationService.sendTaskAssignmentEmail(task, assignedUser, client);
                emailsSent++;
            }
        }
    } catch (emailError) {
        emailErrors++;
        console.error('Failed to send email for task', emailError);
    }
}
```

## Email Service Integration

### Task Notification Service

The system uses `taskNotificationService.sendTaskAssignmentEmail()` which:

1. **Formats the email** with task details and user information
2. **Sends via email service** using configured SMTP settings
3. **Handles errors gracefully** without breaking task creation
4. **Logs success/failure** for monitoring and debugging

### Email Configuration

Uses existing email service configuration:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## Response Enhancements

### Manual Task Creation Response

```json
{
  "message": "Task created immediately successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "File Annual Return",
    "description": "Complete annual return filing",
    "priority": "high",
    "status": "open",
    "assignedTo": "507f1f77bcf86cd799439012",
    "entity": "507f1f77bcf86cd799439013",
    "dueDate": "2024-03-25T00:00:00.000Z",
    "bucket": "ROC",
    "recurringFrequency": "yearly"
  },
  "emailSent": true
}
```

### Future Task Response

```json
{
  "message": "Task queued for the future creation",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "File Annual Return",
    "status": "upcoming",
    "scheduledAt": "2024-03-18T00:00:00.000Z"
  },
  "scheduledAt": "2024-03-18T00:00:00.000Z",
  "emailSent": true
}
```

## Error Handling

### Email Failure Scenarios

1. **User not found**: Task created but no email sent
2. **Invalid email address**: Task created but email delivery fails
3. **SMTP server issues**: Task created but email service unavailable
4. **Email service errors**: Task created but email sending fails

### Error Logging

```javascript
console.error('[CREATE_TASK_EMAIL_ERROR]', {
    message: 'Failed to send assignment email for immediate task',
    error: emailError.message,
    taskId: task._id,
    userId: user._id,
    taskName: task.name,
    userEmail: user.email
});
```

### Graceful Degradation

- **Task creation continues** even if email fails
- **No rollback** of task creation due to email failures
- **Comprehensive logging** for debugging email issues
- **Response indicates** whether email was sent successfully

## Monitoring and Debugging

### Success Logs

```javascript
// Manual task creation
console.log(`[CREATE_TASK_EMAIL_SUCCESS] Assignment email sent for immediate task: ${task.name} to ${user.email}`);

// CSV upload
console.log(`Assignment email sent for task: ${task.name} to ${user.email}`);
```

### Failure Logs

```javascript
// Email service errors
console.error('[CREATE_TASK_EMAIL_ERROR]', {
    message: 'Failed to send assignment email for immediate task',
    error: emailError.message,
    taskId: task._id,
    userId: user._id,
    taskName: task.name,
    userEmail: user.email
});

// CSV upload email errors
console.error('[BULK_UPLOAD_EMAIL_ERROR]', {
    message: 'Failed to send assignment email for bulk uploaded task',
    error: emailError.message,
    taskId: task._id,
    taskName: task.name
});
```

### Skip Logs

```javascript
// No user found
console.log(`[CREATE_TASK_EMAIL_SKIP] No user found for task: ${task.name}, skipping email`);

// CSV upload - user not found
console.log(`Skipping email for task: ${task.name} - User not found or no email`);
```

## Best Practices

### 1. Email Timing
- Send emails immediately after task creation
- Don't delay emails for future tasks
- Ensure users are notified as soon as possible

### 2. Error Handling
- Never let email failures break task creation
- Log all email successes and failures
- Provide clear error messages for debugging

### 3. User Experience
- Include all relevant task information in emails
- Use clear, actionable language
- Provide context about task importance and urgency

### 4. Monitoring
- Track email delivery success rates
- Monitor email sending performance
- Set up alerts for email service failures

## Testing

### Manual Task Creation Test

```bash
curl -X POST http://localhost:3000/v1/tasks/create-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Task",
    "description": "Test task description",
    "priority": "high",
    "assignedToName": "test@example.com",
    "entity": "Test Client",
    "bucket": "GST",
    "dueDate": "2024-03-25",
    "recurringFrequency": "monthly"
  }'
```

### Expected Response

```json
{
  "message": "Task created immediately successfully",
  "task": {
    "_id": "...",
    "name": "Test Task",
    "status": "open"
  },
  "emailSent": true
}
```

### CSV Upload Test

```bash
curl -X POST http://localhost:3000/v1/tasks/upload-tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@tasks.csv"
```

### Expected Response

```json
{
  "message": "Tasks uploaded successfully",
  "summary": {
    "totalProcessed": 1,
    "validTasks": 1,
    "insertedTasks": 1,
    "emailsSent": 1,
    "emailErrors": 0
  },
  "tasks": [...],
  "duplicates": [],
  "skipped": []
}
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP configuration
   - Verify user email addresses exist
   - Check email service logs

2. **Task created but no email**
   - Verify user exists in database
   - Check user email field is populated
   - Review email service configuration

3. **Email delivery failures**
   - Check SMTP server status
   - Verify firewall settings
   - Review email service error logs

### Debug Steps

1. **Check application logs** for email success/failure messages
2. **Verify user data** in database
3. **Test email service** independently
4. **Check SMTP configuration** and credentials
5. **Review network connectivity** to SMTP server

---

**Version**: 1.0.0  
**Last Updated**: March 2024  
**Maintainer**: Compli-AI Development Team
