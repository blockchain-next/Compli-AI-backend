const emailService = require('./email.service');
const User = require('../models/user.model');
const Client = require('../models/client.model');
const logger = require('../config/logger');

/**
 * Send task assignment notification email
 * @param {Object} task - The task object
 * @param {Object} assignedUser - The user the task is assigned to
 * @param {Object} client - The client/entity the task is for
 * @returns {Promise}
 */
const sendTaskAssignmentEmail = async (task, assignedUser, client) => {
  try {
    const subject = `New Task Assigned: ${task.name}`;
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const priorityColor = {
      'low': '🟢',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    };
    
    const text = `Dear ${assignedUser.name},

You have been assigned a new task:

📋 Task: ${task.name}
📝 Description: ${task.description}
🏢 Client/Entity: ${client ? client.name : 'N/A'}
📊 Priority: ${priorityColor[task.priority] || ''} ${task.priority}
📅 Due Date: ${dueDate}
🔄 Frequency: ${task.recurringFrequency}
🏷️ Category: ${task.bucket}
⏱️ Estimated Hours: ${task.estimatedHours || 'Not specified'}

Please review the task details and update the status accordingly.

Best regards,
Compli-AI Team`;

    await emailService.sendEmail(assignedUser.email, subject, text);
    
    logger.info(`Task assignment email sent to ${assignedUser.email} for task: ${task.name}`);
    
    return true;
  } catch (error) {
    logger.error('Failed to send task assignment email', {
      error: error.message,
      taskId: task._id,
      userId: assignedUser._id
    });
    return false;
  }
};

/**
 * Send task update notification email
 * @param {Object} task - The updated task object
 * @param {Object} assignedUser - The user the task is assigned to
 * @param {Object} client - The client/entity the task is for
 * @param {Object} changes - Object containing the changes made
 * @param {Object} updatedBy - The user who made the changes
 * @returns {Promise}
 */
const sendTaskUpdateEmail = async (task, assignedUser, client, changes, updatedBy) => {
  try {
    const subject = `Task Updated: ${task.name}`;
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const priorityColor = {
      'low': '🟢',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    };
    
    // Format changes for email
    const changesList = Object.entries(changes).map(([field, change]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      return `• ${fieldName}: ${change.from || 'Not set'} → ${change.to || 'Not set'}`;
    }).join('\n');
    
    const text = `Dear ${assignedUser.name},

Your assigned task has been updated:

📋 Task: ${task.name}
📝 Description: ${task.description}
🏢 Client/Entity: ${client ? client.name : 'N/A'}
📊 Priority: ${priorityColor[task.priority] || ''} ${task.priority}
📅 Due Date: ${dueDate}
🔄 Frequency: ${task.recurringFrequency}
🏷️ Category: ${task.bucket}
⏱️ Estimated Hours: ${task.estimatedHours || 'Not specified'}

🔄 Changes Made:
${changesList}

👤 Updated by: ${updatedBy.name} (${updatedBy.email})

Please review the changes and take any necessary action.

Best regards,
Compli-AI Team`;

    await emailService.sendEmail(assignedUser.email, subject, text);
    
    logger.info(`Task update email sent to ${assignedUser.email} for task: ${task.name}`);
    
    return true;
  } catch (error) {
    logger.error('Failed to send task update email', {
      error: error.message,
      taskId: task._id,
      userId: assignedUser._id
    });
    return false;
  }
};

/**
 * Send task status change notification email
 * @param {Object} task - The task object
 * @param {Object} assignedUser - The user the task is assigned to
 * @param {Object} client - The client/entity the task is for
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} updatedBy - The user who made the status change
 * @returns {Promise}
 */
const sendTaskStatusChangeEmail = async (task, assignedUser, client, oldStatus, newStatus, updatedBy) => {
  try {
    const subject = `Task Status Changed: ${task.name} - ${newStatus}`;
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
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

The status of your assigned task has been changed:

📋 Task: ${task.name}
📝 Description: ${task.description}
🏢 Client/Entity: ${client ? client.name : 'N/A'}
📊 Priority: ${priorityColor[task.priority] || ''} ${task.priority}
📅 Due Date: ${dueDate}
🔄 Frequency: ${task.recurringFrequency}
🏷️ Category: ${task.bucket}

🔄 Status Change: ${statusEmoji[oldStatus] || ''} ${oldStatus} → ${statusEmoji[newStatus] || ''} ${newStatus}

👤 Status changed by: ${updatedBy.name} (${updatedBy.email})

${newStatus === 'completed' ? '🎉 Congratulations on completing this task!' : 
  newStatus === 'escalated' ? '⚠️ This task has been escalated and may require immediate attention.' :
  newStatus === 'on hold' ? '⏸️ This task has been put on hold. Please check with your manager for details.' :
  'Please review the task and take any necessary action.'}

Best regards,
Compli-AI Team`;

    await emailService.sendEmail(assignedUser.email, subject, text);
    
    logger.info(`Task status change email sent to ${assignedUser.email} for task: ${task.name}`);
    
    return true;
  } catch (error) {
    logger.error('Failed to send task status change email', {
      error: error.message,
      taskId: task._id,
      userId: assignedUser._id
    });
    return false;
  }
};

/**
 * Send task reassignment notification email
 * @param {Object} task - The task object
 * @param {Object} newAssignedUser - The new user the task is assigned to
 * @param {Object} previousAssignedUser - The previous user the task was assigned to
 * @param {Object} client - The client/entity the task is for
 * @param {Object} reassignedBy - The user who reassigned the task
 * @returns {Promise}
 */
const sendTaskReassignmentEmail = async (task, newAssignedUser, previousAssignedUser, client, reassignedBy) => {
  try {
    const subject = `Task Reassigned: ${task.name}`;
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const priorityColor = {
      'low': '🟢',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    };
    
    const text = `Dear ${newAssignedUser.name},

A task has been reassigned to you:

📋 Task: ${task.name}
📝 Description: ${task.description}
🏢 Client/Entity: ${client ? client.name : 'N/A'}
📊 Priority: ${priorityColor[task.priority] || ''} ${task.priority}
📅 Due Date: ${dueDate}
🔄 Frequency: ${task.recurringFrequency}
🏷️ Category: ${task.bucket}
⏱️ Estimated Hours: ${task.estimatedHours || 'Not specified'}

👤 Previously assigned to: ${previousAssignedUser ? previousAssignedUser.name : 'Unassigned'}
👤 Reassigned by: ${reassignedBy.name} (${reassignedBy.email})

Please review the task details and update the status accordingly.

Best regards,
Compli-AI Team`;

    await emailService.sendEmail(newAssignedUser.email, subject, text);
    
    logger.info(`Task reassignment email sent to ${newAssignedUser.email} for task: ${task.name}`);
    
    return true;
  } catch (error) {
    logger.error('Failed to send task reassignment email', {
      error: error.message,
      taskId: task._id,
      userId: newAssignedUser._id
    });
    return false;
  }
};

/**
 * Get user and client information for a task
 * @param {Object} task - The task object
 * @returns {Promise<Object>} Object containing user and client information
 */
const getTaskNotificationData = async (task) => {
  try {
    let assignedUser = null;
    let client = null;
    
    // Get assigned user information
    if (task.assignedTo) {
      if (typeof task.assignedTo === 'string' && task.assignedTo.includes('@')) {
        // Email address
        assignedUser = await User.findOne({ email: task.assignedTo });
      } else if (typeof task.assignedTo === 'string' && !task.assignedTo.includes('@')) {
        // Name
        assignedUser = await User.findOne({ name: task.assignedTo });
      } else if (task.assignedTo._id) {
        // ObjectId reference
        assignedUser = await User.findById(task.assignedTo._id);
      } else {
        // Direct ObjectId
        assignedUser = await User.findById(task.assignedTo);
      }
    }
    
    // Get client information
    if (task.entity) {
      if (typeof task.entity === 'string') {
        client = await Client.findOne({ name: task.entity });
      } else if (task.entity._id) {
        client = await Client.findById(task.entity._id);
      } else {
        client = await Client.findById(task.entity);
      }
    }
    
    return { assignedUser, client };
  } catch (error) {
    logger.error('Failed to get task notification data', {
      error: error.message,
      taskId: task._id
    });
    return { assignedUser: null, client: null };
  }
};

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskUpdateEmail,
  sendTaskStatusChangeEmail,
  sendTaskReassignmentEmail,
  getTaskNotificationData
};
