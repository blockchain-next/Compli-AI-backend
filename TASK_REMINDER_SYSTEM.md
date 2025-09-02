# Task Reminder System

## Overview

The Task Reminder System is an automated email notification service that sends timely reminders to users about their assigned tasks based on due dates, priority levels, and task status. This system ensures that users never miss important deadlines and helps maintain compliance with regulatory requirements.

## Features

### 🚨 **Automatic Reminder Scheduling**
- **Hourly Reminders**: General reminders sent every hour for tasks due soon
- **30-Minute Overdue Alerts**: Urgent reminders for overdue tasks every 30 minutes
- **Smart Timing**: Reminders sent based on task priority and due date proximity

### 📅 **Intelligent Reminder Types**

#### **Overdue Reminders** (🔴 CRITICAL)
- Sent for tasks past their due date
- Marked as "IMMEDIATE ACTION REQUIRED"
- Includes compliance violation warnings
- Sent every 30 minutes for maximum urgency

#### **Due Today Reminders** (🟠 HIGH)
- Sent for tasks due on the current day
- Marked as "DUE TODAY"
- Emphasizes immediate prioritization

#### **Due Soon Reminders** (🟡 MEDIUM)
- **Critical Priority**: 1 day before due date
- **High Priority**: 2 days before due date
- **Medium Priority**: 3 days before due date

#### **Upcoming Reminders** (🟢 LOW)
- **Low Priority**: 7 days before due date
- Friendly planning reminders

### 🎯 **Priority-Based Reminder Logic**

| Priority | Reminder Timing | Frequency |
|----------|----------------|-----------|
| Critical | 1 day before | Every hour |
| High | 2 days before | Every hour |
| Medium | 3 days before | Every hour |
| Low | 7 days before | Every hour |
| Any | Overdue | Every 30 minutes |

## System Architecture

### **Core Components**

#### 1. **Task Reminder Service** (`src/services/taskReminder.service.js`)
- Handles all reminder logic and email sending
- Manages reminder scheduling and execution
- Provides API endpoints for manual reminder operations

#### 2. **Scheduler Service** (`src/services/scheduler.service.js`)
- Integrates with existing task scheduling system
- Runs multiple cron jobs for different reminder types
- Coordinates with task status updates

#### 3. **Email Integration**
- Uses existing email service infrastructure
- Sends formatted reminder emails with task details
- Includes urgency indicators and action requirements

### **Scheduled Jobs**

```javascript
// Schedule 1: Task Status Updates (Every minute)
'* * * * *' → Updates upcoming tasks to open status

// Schedule 2: General Reminders (Every hour)
'0 * * * *' → Sends reminders for tasks due soon

// Schedule 3: Overdue Alerts (Every 30 minutes)
'*/30 * * * *' → Sends urgent reminders for overdue tasks
```

## API Endpoints

### **Reminder Management**

#### **Send All Reminders**
```http
POST /v1/tasks/reminders/send-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Reminders sent successfully",
  "summary": {
    "totalTasks": 15,
    "remindersSent": 12,
    "errors": 0,
    "timestamp": "2024-03-21T10:00:00.000Z"
  }
}
```

#### **Send Specific Task Reminder**
```http
POST /v1/tasks/reminders/send/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "reminderType": "due_soon"
}
```

**Response:**
```json
{
  "message": "Reminder sent successfully",
  "taskId": "507f1f77bcf86cd799439011",
  "reminderType": "due_soon"
}
```

#### **Get Reminder Status**
```http
GET /v1/tasks/reminders/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Reminder status retrieved successfully",
  "totalTasksNeedingReminders": 8,
  "tasks": [
    {
      "taskId": "507f1f77bcf86cd799439011",
      "taskName": "GST Filing Q1 2024",
      "assignedTo": "John Doe",
      "dueDate": "2024-03-25T00:00:00.000Z",
      "priority": "high",
      "status": "open",
      "reminderType": "due_soon",
      "daysUntilDue": 2
    }
  ]
}
```

## Email Templates

### **Overdue Task Reminder**
```
Subject: 🚨 URGENT: Task Overdue - [Task Name]

🔴 CRITICAL - IMMEDIATE ACTION REQUIRED

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: 🔴 critical
📅 Due Date: [Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]
⏱️ Estimated Hours: [Hours]
📊 Current Status: 📋 open

🚨 This task is OVERDUE and requires immediate attention. 
Please update the status and complete as soon as possible.

🔴 OVERDUE TASKS MAY RESULT IN COMPLIANCE VIOLATIONS AND PENALTIES.

Best regards,
Compli-AI Team
```

### **Due Today Reminder**
```
Subject: ⚠️ Task Due Today - [Task Name]

🟠 HIGH - DUE TODAY

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: 🟠 high
📅 Due Date: [Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]
⏱️ Estimated Hours: [Hours]
📊 Current Status: 🔄 inprogress

⚠️ This task is due TODAY. Please ensure it is completed 
or updated with current progress.

⚠️ Please prioritize this task to avoid delays.

Best regards,
Compli-AI Team
```

### **Due Soon Reminder**
```
Subject: 📅 Task Due Soon - [Task Name]

🟡 MEDIUM - Due in [X] days

📋 Task: [Task Name]
📝 Description: [Description]
🏢 Client/Entity: [Client Name]
📊 Priority: 🟡 medium
📅 Due Date: [Date]
🔄 Frequency: [Frequency]
🏷️ Category: [Bucket]
⏱️ Estimated Hours: [Hours]
📊 Current Status: 📋 open

📅 This task is due soon. Please review and update 
the status accordingly.

Best regards,
Compli-AI Team
```

## Configuration

### **Environment Variables**
The reminder system uses the existing email configuration:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### **Scheduling Configuration**
Default reminder schedules can be modified in `src/services/scheduler.service.js`:

```javascript
// Change reminder frequency (every 2 hours instead of every hour)
nodecron.schedule('0 */2 * * *', async () => {
  // Send reminders every 2 hours
});

// Change overdue alert frequency (every hour instead of every 30 minutes)
nodecron.schedule('0 * * * *', async () => {
  // Send overdue alerts every hour
});
```

## Integration with CSV Upload

### **Enhanced CSV Processing**
The reminder system works seamlessly with the improved CSV upload functionality:

1. **7-Day Deadline Logic**: Tasks due in more than 7 days are scheduled for future creation
2. **Immediate Creation**: Tasks due within 7 days are created immediately
3. **Overdue Handling**: Tasks with past due dates are created with 'escalated' status
4. **Automatic Email Notifications**: Assignment emails sent for all uploaded tasks

### **CSV Format Support**
```csv
status,name,description,priority,assignedTo,entity,bucket,dueDate,recurringFrequency,tags,estimatedHours,closureRightsEmail
open,GST Filing Q1 2024,Complete monthly GST return,high,John Doe,ABC Corp,GST,2024-03-25,monthly,"tax,compliance",8,jane@company.com
```

### **Validation and Error Handling**
- Required field validation
- User existence verification
- Duplicate task detection
- Date format validation
- Comprehensive error logging

## Monitoring and Logging

### **Log Levels**
- **Info**: Successful reminder operations
- **Warning**: Non-critical issues
- **Error**: Failed operations and system errors

### **Log Examples**
```javascript
// Successful reminder
logger.info(`Task reminder email sent to john@example.com for task: GST Filing (overdue)`);

// Reminder summary
logger.info('Reminder summary', {
  totalTasks: 15,
  remindersSent: 12,
  errors: 0,
  timestamp: new Date()
});

// Error logging
logger.error('Failed to send task reminder email', {
  error: error.message,
  taskId: task._id,
  userId: assignedUser._id,
  reminderType: 'overdue'
});
```

### **Performance Metrics**
- Total tasks needing reminders
- Successful email deliveries
- Failed operations count
- Processing time per batch
- Email delivery success rate

## Best Practices

### **1. Reminder Timing**
- Avoid sending reminders during non-business hours
- Consider user time zones for global teams
- Balance urgency with user experience

### **2. Email Content**
- Keep subject lines clear and actionable
- Include all relevant task information
- Use appropriate urgency indicators
- Provide clear next steps

### **3. System Monitoring**
- Monitor email delivery success rates
- Track reminder effectiveness
- Monitor system performance
- Set up alerts for system failures

### **4. User Experience**
- Allow users to configure reminder preferences
- Provide opt-out options for non-critical reminders
- Include links to task management interface
- Offer multiple communication channels

## Troubleshooting

### **Common Issues**

#### **Reminders Not Sending**
1. Check scheduler service logs
2. Verify email configuration
3. Check database connectivity
4. Verify task data integrity

#### **Incorrect Reminder Timing**
1. Check cron schedule configuration
2. Verify server timezone settings
3. Review task due date formats
4. Check priority level assignments

#### **Email Delivery Failures**
1. Verify SMTP configuration
2. Check email server status
3. Review firewall settings
4. Check email service logs

### **Debug Mode**
Enable detailed logging by setting `NODE_ENV=development`:
```javascript
// Enhanced logging in development
if (config.env === 'development') {
  logger.debug('Detailed reminder processing information');
}
```

## Future Enhancements

### **Planned Features**
- **User Preferences**: Customizable reminder schedules
- **Smart Reminders**: AI-powered reminder timing optimization
- **Multi-Channel Notifications**: SMS, Slack, Teams integration
- **Escalation Management**: Automatic manager notifications
- **Reminder Analytics**: Effectiveness tracking and reporting

### **Integration Opportunities**
- **Calendar Systems**: Add reminders to user calendars
- **Mobile Apps**: Push notifications for mobile users
- **Chat Platforms**: Integration with Slack, Microsoft Teams
- **Project Management**: Integration with Jira, Asana, etc.

## Support and Maintenance

### **Regular Maintenance**
- Monitor system performance
- Review reminder effectiveness
- Update email templates
- Optimize scheduling algorithms

### **Support Contacts**
- Check application logs for error details
- Verify email configuration settings
- Review reminder scheduling
- Monitor system health metrics

---

**Version**: 1.0.0  
**Last Updated**: March 2024  
**Maintainer**: Compli-AI Development Team
