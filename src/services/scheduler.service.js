const nodecron = require('node-cron');
const Task = require('../models/task.model');
const { taskReminderService } = require('./index');

// Schedule 1: Update upcoming tasks to open status (every minute)
nodecron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
        const tasksToUpdate = await Task.find({
            status: 'upcoming',
            taskAssigned: false,
            scheduledAt: { $lte: now }
        });
        
        for (const task of tasksToUpdate) {
            task.status = 'open';
            task.taskAssigned = true;
            await task.save();
            
            console.log(`[CRON] Task status updated: ${task.name} - ${task.status}`);
        }
        
        if (tasksToUpdate.length) {
            console.log(`[CRON] Updated ${tasksToUpdate.length} task(s) from upcoming to open`);
        }
    } catch (error) {
        console.error('Error updating task status:', error);
    }
});

// Schedule 2: Send task reminders (every hour at minute 0)
nodecron.schedule('0 * * * *', async () => {
    try {
        console.log('[CRON] Running scheduled task reminders...');
        const reminderSummary = await taskReminderService.sendAllReminders();
        console.log(`[CRON] Reminders sent: ${reminderSummary.remindersSent}/${reminderSummary.totalTasks}`);
    } catch (error) {
        console.error('Error sending task reminders:', error);
    }
});

// Schedule 3: Send urgent reminders for overdue tasks (every 30 minutes)
nodecron.schedule('*/30 * * * *', async () => {
    try {
        const now = new Date();
        const overdueTasks = await Task.find({
            status: { $nin: ['completed', 'cancelled'] },
            dueDate: { $lt: now },
            assignedTo: { $exists: true, $ne: null }
        }).populate('assignedTo').populate('entity');
        
        if (overdueTasks.length > 0) {
            console.log(`[CRON] Found ${overdueTasks.length} overdue tasks, sending urgent reminders...`);
            
            for (const task of overdueTasks) {
                if (task.assignedTo && task.assignedTo.email) {
                    await taskReminderService.sendTaskReminderEmail(
                        task, 
                        task.assignedTo, 
                        task.entity, 
                        'overdue'
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error sending overdue task reminders:', error);
    }
});

console.log('[SCHEDULER] Task scheduler and reminder service initialized');
console.log('[SCHEDULER] Schedules:');
console.log('[SCHEDULER] - Task status updates: Every minute');
console.log('[SCHEDULER] - General reminders: Every hour');
console.log('[SCHEDULER] - Overdue reminders: Every 30 minutes');