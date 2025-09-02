# CSV Upload Response Format

## Overview

The CSV upload endpoint now provides comprehensive responses that include detailed information about uploaded tasks, duplicates, skipped items, and processing statistics. This helps frontend applications better understand what happened during the upload process.

## Response Structure

### Success Response (Tasks Created)

```json
{
  "message": "Tasks uploaded successfully",
  "summary": {
    "totalProcessed": 10,
    "validTasks": 8,
    "insertedTasks": 8,
    "duplicateTasks": 1,
    "skippedTasks": 1,
    "emailsSent": 7,
    "emailErrors": 1
  },
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "File Annual Return",
      "description": "Complete annual return filing for FY 2023-24",
      "priority": "high",
      "status": "open",
      "bucket": "ROC",
      "dueDate": "2024-03-25T00:00:00.000Z",
      "recurringFrequency": "yearly",
      "assignedTo": "507f1f77bcf86cd799439012",
      "entity": "507f1f77bcf86cd799439013",
      "estimatedHours": 12,
      "tags": ["compliance", "annual"],
      "createdAt": "2024-03-21T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Prepare GST filing",
      "description": "Monthly GST return for March 2024",
      "priority": "medium",
      "status": "upcoming",
      "bucket": "GST",
      "dueDate": "2024-04-20T00:00:00.000Z",
      "recurringFrequency": "monthly",
      "assignedTo": "507f1f77bcf86cd799439015",
      "entity": "507f1f77bcf86cd799439016",
      "estimatedHours": 6,
      "tags": ["tax", "monthly"],
      "createdAt": "2024-03-21T10:00:00.000Z"
    }
  ],
  "duplicates": [
    {
      "name": "Duplicate Task Name",
      "entity": "ABC Corp",
      "dueDate": "2024-03-25",
      "reason": "Duplicate task found"
    }
  ],
  "skipped": [
    {
      "name": "Invalid Task",
      "reason": "Missing required fields",
      "details": {
        "missingFields": ["description", "priority"]
      }
    }
  ]
}
```

### No Valid Tasks Response

```json
{
  "message": "No valid tasks to upload",
  "summary": {
    "totalProcessed": 5,
    "validTasks": 0,
    "insertedTasks": 0,
    "duplicateTasks": 3,
    "skippedTasks": 2,
    "emailsSent": 0,
    "emailErrors": 0
  },
  "tasks": [],
  "duplicates": [
    {
      "name": "Task 1",
      "entity": "Client A",
      "dueDate": "2024-03-25",
      "reason": "Duplicate task found"
    },
    {
      "name": "Task 2",
      "entity": "Client B",
      "dueDate": "2024-03-26",
      "reason": "Duplicate task found"
    },
    {
      "name": "Task 3",
      "entity": "Client C",
      "dueDate": "2024-03-27",
      "reason": "Duplicate task found"
    }
  ],
  "skipped": [
    {
      "name": "Task 4",
      "reason": "User not found",
      "details": {
        "assignedTo": "nonexistent@email.com"
      }
    },
    {
      "name": "Task 5",
      "reason": "Invalid due date format",
      "details": {
        "providedDate": "invalid-date"
      }
    }
  ]
}
```

## Response Fields

### Summary Object

| Field | Type | Description |
|-------|------|-------------|
| `totalProcessed` | number | Total number of rows processed from CSV |
| `validTasks` | number | Number of tasks that passed validation |
| `insertedTasks` | number | Number of tasks successfully inserted into database |
| `duplicateTasks` | number | Number of duplicate tasks found |
| `skippedTasks` | number | Number of tasks skipped due to validation errors |
| `emailsSent` | number | Number of assignment emails successfully sent |
| `emailErrors` | number | Number of email sending failures |

### Tasks Array

Each task object contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | MongoDB ObjectId of the created task |
| `name` | string | Task name |
| `description` | string | Task description |
| `priority` | string | Task priority (low, medium, high, critical) |
| `status` | string | Task status (open, upcoming, escalated) |
| `bucket` | string | Task category (GST, IT, TDS, PF, ESI, ROC, other) |
| `dueDate` | string | ISO date string of task due date |
| `recurringFrequency` | string | Task frequency (one time, monthly, quarterly, half yearly, yearly) |
| `assignedTo` | string | MongoDB ObjectId of assigned user |
| `entity` | string | MongoDB ObjectId of client/entity |
| `estimatedHours` | number | Estimated hours to complete task |
| `tags` | array | Array of task tags |
| `createdAt` | string | ISO date string of task creation |

### Duplicates Array

Each duplicate object contains:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Task name that was duplicated |
| `entity` | string | Client/entity name |
| `dueDate` | string | Due date of duplicate task |
| `reason` | string | Always "Duplicate task found" |

### Skipped Array

Each skipped object contains:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Task name (or "Unnamed task" if missing) |
| `reason` | string | Reason for skipping |
| `details` | object | Additional details about why task was skipped |

#### Common Skip Reasons

1. **Missing Required Fields**
   ```json
   {
     "reason": "Missing required fields",
     "details": {
       "missingFields": ["description", "priority"]
     }
   }
   ```

2. **User Not Found**
   ```json
   {
     "reason": "User not found",
     "details": {
       "assignedTo": "nonexistent@email.com"
     }
   }
   ```

3. **Invalid Due Date Format**
   ```json
   {
     "reason": "Invalid due date format",
     "details": {
       "providedDate": "invalid-date"
     }
   }
   ```

## Status Codes

- **201 Created**: Tasks were successfully uploaded and created
- **200 OK**: No valid tasks to upload (all were duplicates or invalid)
- **500 Internal Server Error**: Server error during upload process

## Frontend Integration Examples

### React/JavaScript Example

```javascript
const handleFileUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/v1/tasks/upload-tasks', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      if (result.tasks.length > 0) {
        // Show success message with task details
        showSuccess(`Successfully uploaded ${result.tasks.length} tasks`);
        
        // Display created tasks
        setCreatedTasks(result.tasks);
        
        // Show summary
        showSummary(result.summary);
        
        // Handle duplicates if any
        if (result.duplicates.length > 0) {
          showWarning(`${result.duplicates.length} duplicate tasks found`);
        }
        
        // Handle skipped tasks if any
        if (result.skipped.length > 0) {
          showWarning(`${result.skipped.length} tasks were skipped`);
        }
      } else {
        // No valid tasks uploaded
        showInfo('No valid tasks to upload');
        
        // Show what was processed
        if (result.duplicates.length > 0) {
          showWarning(`${result.duplicates.length} duplicate tasks found`);
        }
        if (result.skipped.length > 0) {
          showWarning(`${result.skipped.length} tasks were skipped`);
        }
      }
    } else {
      showError(result.message || 'Upload failed');
    }
  } catch (error) {
    showError('Upload failed: ' + error.message);
  }
};
```

### Vue.js Example

```javascript
async uploadTasks(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.$http.post('/v1/tasks/upload-tasks', formData, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    const result = response.data;
    
    if (result.tasks.length > 0) {
      this.$notify({
        type: 'success',
        title: 'Upload Successful',
        message: `Successfully uploaded ${result.tasks.length} tasks`
      });
      
      // Update local state
      this.createdTasks = result.tasks;
      this.uploadSummary = result.summary;
      
      // Handle duplicates and skipped tasks
      this.handleUploadResults(result);
    } else {
      this.$notify({
        type: 'info',
        title: 'No Tasks Uploaded',
        message: 'No valid tasks to upload'
      });
    }
    
    // Show detailed results
    this.showUploadResults(result);
    
  } catch (error) {
    this.$notify({
      type: 'error',
      title: 'Upload Failed',
      message: error.response?.data?.message || 'Upload failed'
    });
  }
}
```

## Error Handling

### File Format Errors

```json
{
  "message": "Unsupported file format.",
  "status": 400
}
```

### Server Errors

```json
{
  "message": "Failed to upload tasks",
  "error": "Database connection failed",
  "details": "Error stack trace in development mode"
}
```

## Best Practices

### Frontend

1. **Always check response status** before processing data
2. **Handle empty tasks array** gracefully
3. **Display summary information** to users
4. **Show duplicate warnings** when applicable
5. **Provide feedback** for skipped tasks
6. **Handle email errors** appropriately

### Backend

1. **Validate all required fields** before processing
2. **Check for duplicates** using name + dueDate + entity combination
3. **Provide detailed error messages** for debugging
4. **Clean up uploaded files** in all scenarios
5. **Log processing statistics** for monitoring
6. **Handle email failures** gracefully

## Monitoring and Debugging

### Log Examples

```javascript
// Successful upload
console.log(`Bulk upload completed: ${insertedTasks.length} tasks created, ${emailsSent} emails sent, ${emailErrors} email errors`);

// Duplicate detection
console.log(`Duplicate found: ${item.name} (${item.entity}) on ${dueDate}`);

// Task scheduling
console.log(`Task scheduled for future: ${item.name} - Due: ${dueDate.toDateString()}, Scheduled: ${scheduledAt.toDateString()}`);
```

### Common Issues

1. **Missing required fields**: Check CSV format and required columns
2. **User not found**: Verify user names/emails exist in database
3. **Invalid dates**: Ensure date format is YYYY-MM-DD
4. **Duplicate tasks**: Check for existing tasks with same name, entity, and due date
5. **Email failures**: Verify SMTP configuration and user email addresses

---

**Version**: 1.0.0  
**Last Updated**: March 2024  
**Maintainer**: Compli-AI Development Team
