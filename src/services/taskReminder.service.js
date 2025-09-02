const emailService = require('./email.service');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Client = require('../models/client.model');
const logger = require('../config/logger');
const cron = require('node-cron');

/**
 * Send task reminder email
 * @param {Object} task - The task object
 * @param {Object} assignedUser - The user the task is assigned to
 * @param {Object} client - The client/entity the task is for
 * @param {string} reminderType - Type of reminder (due_soon, overdue, upcoming)
 * @returns {Promise}
 */
const sendTaskReminderEmail = async (task, assignedUser, client, reminderType = 'due_soon') => {
  try {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    let subject, urgencyLevel, actionRequired;
    
    switch (reminderType) {
      case 'overdue':
        subject = `🚨 URGENT: Task Overdue - ${task.name}`;
        urgencyLevel = '🔴 CRITICAL';
        actionRequired = 'IMMEDIATE ACTION REQUIRED';
        break;
      case 'due_today':
        subject = `⚠️ Task Due Today - ${task.name}`;
        urgencyLevel = '🟠 HIGH';
        actionRequired = 'DUE TODAY';
        break;
      case 'due_soon':
        subject = `📅 Task Due Soon - ${task.name}`;
        urgencyLevel = '🟡 MEDIUM';
        actionRequired = `Due in ${daysUntilDue} days`;
        break;
      case 'upcoming':
        subject = `📋 Task Reminder - ${task.name}`;
        urgencyLevel = '🟢 LOW';
        actionRequired = `Due in ${daysUntilDue} days`;
        break;
      default:
        subject = `Task Reminder - ${task.name}`;
        urgencyLevel = '🟡 MEDIUM';
        actionRequired = `Due in ${daysUntilDue} days`;
    }
    
    const priorityColor = {
      'low': '🟢',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    };
    
    const statusEmoji = {
      'open': '📋',
      'inprogress': '🔄',
      'escalated': '⚠️',
      'completed': '✅',
      'on hold': '⏸️',
      'upcoming': '📅'
    };
    
    const text = `Dear ${assignedUser.name},

${urgencyLevel} - ${actionRequired}

📋 Task: ${task.name}
📝 Description: ${task.description}
🏢 Client/Entity: ${client ? client.name : 'N/A'}
📊 Priority: ${priorityColor[task.priority] || ''} ${task.priority}
📅 Due Date: ${dueDate.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
🔄 Frequency: ${task.recurringFrequency}
🏷️ Category: ${task.bucket}
⏱️ Estimated Hours: ${task.estimatedHours || 'Not specified'}
📊 Current Status: ${statusEmoji[task.status] || ''} ${task.status}

${reminderType === 'overdue' ? 
  '🚨 This task is OVERDUE and requires immediate attention. Please update the status and complete as soon as possible.' :
  reminderType === 'due_today' ?
  '⚠️ This task is due TODAY. Please ensure it is completed or updated with current progress.' :
  reminderType === 'due_soon' ?
  '📅 This task is due soon. Please review and update the status accordingly.' :
  '📋 This is a friendly reminder about your upcoming task. Please plan accordingly.'}

${reminderType === 'overdue' ? 
  '🔴 OVERDUE TASKS MAY RESULT IN COMPLIANCE VIOLATIONS AND PENALTIES.' :
  reminderType === 'due_today' ?
  '⚠️ Please prioritize this task to avoid delays.' :
  ''}

Best regards,
Compli-AI Team

---
This is an automated reminder. Please do not reply to this email.`;

    await emailService.sendEmail(assignedUser.email, subject, text);
    
    logger.info(`Task reminder email sent to ${assignedUser.email} for task: ${task.name} (${reminderType})`);
    
    return true;
  } catch (error) {
    logger.error('Failed to send task reminder email', {
      error: error.message,
      taskId: task._id,
      userId: assignedUser._id,
      reminderType
    });
    return false;
  }
};

/**
 * Get tasks that need reminders based on due dates
 * @returns {Promise<Array>} Array of tasks needing reminders
 */
const getTasksNeedingReminders = async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      status: { $nin: ['completed', 'cancelled'] },
      assignedTo: { $exists: true, $ne: null }
    }).populate('assignedTo').populate('entity');
    
    const tasksNeedingReminders = [];
    
    for (const task of tasks) {
      if (!task.assignedTo || !task.assignedTo.email) continue;
      
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      // Determine reminder type based on due date and priority
      let reminderType = null;
      let shouldSendReminder = false;
      
      if (daysUntilDue < 0) {
        // Overdue tasks
        reminderType = 'overdue';
        shouldSendReminder = true;
      } else if (daysUntilDue === 0) {
        // Due today
        reminderType = 'due_today';
        shouldSendReminder = true;
      } else if (daysUntilDue <= 1 && task.priority === 'critical') {
        // Critical tasks due tomorrow
        reminderType = 'due_soon';
        shouldSendReminder = true;
      } else if (daysUntilDue <= 2 && task.priority === 'high') {
        // High priority tasks due in 2 days
        reminderType = 'due_soon';
        shouldSendReminder = true;
      } else if (daysUntilDue <= 3 && task.priority === 'medium') {
        // Medium priority tasks due in 3 days
        reminderType = 'due_soon';
        shouldSendReminder = true;
      } else if (daysUntilDue <= 7 && task.priority === 'low') {
        // Low priority tasks due in a week
        reminderType = 'upcoming';
        shouldSendReminder = true;
      }
      
      if (shouldSendReminder) {
        tasksNeedingReminders.push({
          task,
          reminderType,
          daysUntilDue
        });
      }
    }
    
    return tasksNeedingReminders;
  } catch (error) {
    logger.error('Failed to get tasks needing reminders', { error: error.message });
    return [];
  }
};

/**
 * Send reminders for all tasks that need them
 * @returns {Promise<Object>} Summary of reminders sent
 */
const sendAllReminders = async () => {
  try {
    const tasksNeedingReminders = await getTasksNeedingReminders();
    let remindersSent = 0;
    let errors = 0;
    
    logger.info(`Found ${tasksNeedingReminders.length} tasks needing reminders`);
    
    for (const { task, reminderType, daysUntilDue } of tasksNeedingReminders) {
      try {
        const assignedUser = task.assignedTo;
        const client = task.entity;
        
        if (assignedUser && assignedUser.email) {
          await sendTaskReminderEmail(task, assignedUser, client, reminderType);
          remindersSent++;
          
          // Log reminder details
          logger.info(`Reminder sent for task: ${task.name}`, {
            taskId: task._id,
            userId: assignedUser._id,
            reminderType,
            daysUntilDue,
            priority: task.priority
          });
        }
      } catch (error) {
        errors++;
        logger.error('Failed to send reminder for task', {
          taskId: task._id,
          error: error.message
        });
      }
    }
    
    const summary = {
      totalTasks: tasksNeedingReminders.length,
      remindersSent,
      errors,
      timestamp: new Date()
    };
    
    logger.info('Reminder summary', summary);
    return summary;
    
  } catch (error) {
    logger.error('Failed to send all reminders', { error: error.message });
    return {
      totalTasks: 0,
      remindersSent: 0,
      errors: 1,
      timestamp: new Date()
    };
  }
};

/**
 * Start the automatic reminder scheduler
 * @param {string} schedule - Cron schedule (default: every hour)
 */
const startReminderScheduler = (schedule = '0 * * * *') => {
  try {
    // Schedule reminders to run every hour by default
    cron.schedule(schedule, async () => {
      logger.info('Running scheduled task reminders...');
      await sendAllReminders();
    });
    
    logger.info(`Task reminder scheduler started with schedule: ${schedule}`);
    
    // Send initial reminders on startup
    setTimeout(async () => {
      logger.info('Sending initial task reminders...');
      await sendAllReminders();
    }, 5000); // Wait 5 seconds after startup
    
  } catch (error) {
    logger.error('Failed to start reminder scheduler', { error: error.message });
  }
};

/**
 * Stop the reminder scheduler
 */
const stopReminderScheduler = () => {
  try {
    cron.getTasks().forEach(task => task.stop());
    logger.info('Task reminder scheduler stopped');
  } catch (error) {
    logger.error('Failed to stop reminder scheduler', { error: error.message });
  }
};

/**
 * Send immediate reminder for a specific task
 * @param {string} taskId - The task ID
 * @param {string} reminderType - Type of reminder to send
 * @returns {Promise<boolean>}
 */
const sendImmediateReminder = async (taskId, reminderType = 'due_soon') => {
  try {
    const task = await Task.findById(taskId).populate('assignedTo').populate('entity');
    
    if (!task) {
      logger.error('Task not found for immediate reminder', { taskId });
      return false;
    }
    
    if (!task.assignedTo || !task.assignedTo.email) {
      logger.error('Task has no assigned user or email', { taskId });
      return false;
    }
    
    const result = await sendTaskReminderEmail(task, task.assignedTo, task.entity, reminderType);
    
    if (result) {
      logger.info(`Immediate reminder sent for task: ${task.name}`, {
        taskId: task._id,
        reminderType
      });
    }
    
    return result;
    
  } catch (error) {
    logger.error('Failed to send immediate reminder', {
      taskId,
      error: error.message
    });
    return false;
  }
};

module.exports = {
  sendTaskReminderEmail,
  getTasksNeedingReminders,
  sendAllReminders,
  startReminderScheduler,
  stopReminderScheduler,
  sendImmediateReminder
};
