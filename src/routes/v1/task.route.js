const { createTask, getAllTasks, updateTask, getTaskHistory, getTaskDetails, getTaskAnalysis } = require('../../controllers/Task.controller');
const auth = require('../../middlewares/auth');
const { taskReminderService } = require('../../services');

const express = require('express');

const router = express.Router();

const  getUploader = require('../../middlewares/upload');

const uploadTasks = getUploader('tasks');
const uploadDoc = getUploader('docs')
const { uploadTasksFromFile, taskCompletedDocumentationUpload } = require('../../controllers/taskUpload.controller');

const {DocAnalysis, aiSuggestions} = require('../../controllers/llmController');


router.post('/create-task', createTask);

// General task update API (replaces reassign and status update)
router.patch('/update/:taskId', auth(), updateTask);

// Task history/audit trail API
router.get('/history/:taskId', auth(), getTaskHistory);

router.post('/upload-tasks', uploadTasks.single('file'), uploadTasksFromFile);

router.post('/upload-task-doc', uploadDoc.single('file'), taskCompletedDocumentationUpload);

router.get('/get-all-tasks', auth(), getAllTasks);

// New enhanced endpoints for analysis
router.get('/details/:taskId', auth(), getTaskDetails);
router.get('/analysis/:task_id', auth(), getTaskAnalysis);

// Get comments for a specific task
router.get('/:taskId/comments', auth(), async (req, res) => {
    try {
        const { taskId } = req.params;
        const Comment = require('../../models/comment.model');
        
        const comments = await Comment.find({ task: taskId })
            .populate('user', 'name email')
            .populate('parent')
            .sort({ createdAt: -1 });
            
        return res.status(200).json({ 
            taskId,
            comments,
            totalComments: comments.length
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Failed to fetch task comments', 
            error: error.message 
        });
    }
});

// Task reminder management routes
router.post('/reminders/send-all', auth(), async (req, res) => {
    try {
        const summary = await taskReminderService.sendAllReminders();
        return res.status(200).json({
            message: 'Reminders sent successfully',
            summary
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to send reminders',
            error: error.message
        });
    }
});

router.post('/reminders/send/:taskId', auth(), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { reminderType = 'due_soon' } = req.body;
        
        const result = await taskReminderService.sendImmediateReminder(taskId, reminderType);
        
        if (result) {
            return res.status(200).json({
                message: 'Reminder sent successfully',
                taskId,
                reminderType
            });
        } else {
            return res.status(400).json({
                message: 'Failed to send reminder',
                taskId
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to send reminder',
            error: error.message
        });
    }
});

router.get('/reminders/status', auth(), async (req, res) => {
    try {
        const tasksNeedingReminders = await taskReminderService.getTasksNeedingReminders();
        
        return res.status(200).json({
            message: 'Reminder status retrieved successfully',
            totalTasksNeedingReminders: tasksNeedingReminders.length,
            tasks: tasksNeedingReminders.map(({ task, reminderType, daysUntilDue }) => ({
                taskId: task._id,
                taskName: task.name,
                assignedTo: task.assignedTo?.name || 'Unknown',
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status,
                reminderType,
                daysUntilDue
            }))
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get reminder status',
            error: error.message
        });
    }
});

module.exports  =  router;