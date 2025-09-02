const Task = require('../models/task.model');
const User = require('../models/user.model');
const Client = require('../models/client.model');
const TaskHistory = require('../models/taskHistory.model');
const mongoose = require('mongoose');
const { taskNotificationService } = require('../services'); 


const createTask = async (req, res) =>{
    try {
        const {
            name, title, description, priority, 
            assignedToName, assignedTo, 
            entity: entityName, entity,
            bucket, dueDate,
            recurringFrequency, frequency,
            tags, estimatedHours, closureRightsEmail, alertEmails
        } = req.body;

        // Use flexible field names
        const taskName = name || title;
        const assignedToField = assignedToName || assignedTo;
        const entityField = entityName || entity;
        const frequencyField = recurringFrequency || frequency;

        if (!taskName) {
            return res.status(400).json({ message: 'Task name or title is required' });
        }
        if (!assignedToField) {
            return res.status(400).json({ message: 'assignedToName or assignedTo is required' });
        }
        if (!description) {
            return res.status(400).json({ message: 'Task description is required' });
        }
        if (!bucket) {
            return res.status(400).json({ message: 'Task bucket is required' });
        }
        if (!dueDate) {
            return res.status(400).json({ message: 'Task due date is required' });
        }
        if (!priority) {
            return res.status(400).json({ message: 'Task priority is required' });
        }
        if (!frequencyField) {
            return res.status(400).json({ message: 'Task recurring frequency is required' });
        }

        // Validate enum values
        const validBuckets = ['GST', 'IT', 'TDS', 'PF', 'ESI', 'ROC', 'other'];
        if (!validBuckets.includes(bucket)) {
            return res.status(400).json({ 
                message: `Invalid bucket value. Must be one of: ${validBuckets.join(', ')}`,
                providedValue: bucket
            });
        }

        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ 
                message: `Invalid priority value. Must be one of: ${validPriorities.join(', ')}`,
                providedValue: priority
            });
        }

        const validFrequencies = ['one time', 'monthly', 'quarterly', 'half yearly', 'yearly'];
        if (!validFrequencies.includes(frequencyField)) {
            return res.status(400).json({ 
                message: `Invalid frequency value. Must be one of: ${validFrequencies.join(', ')}`,
                providedValue: frequencyField
            });
        }

        console.log('[CREATE_TASK_DEBUG]', {
            taskName,
            assignedToField,
            entityField,
            frequencyField,
            bucket,
            priority,
            dueDate,
            timestamp: new Date().toISOString()
        });

        // Handle tags and alertEmails conversion
        let processedTags = tags;
        let processedAlertEmails = alertEmails;
        
        // Convert string to array if needed
        if (typeof tags === 'string') {
            processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        if (typeof alertEmails === 'string') {
            processedAlertEmails = alertEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
        }

        const due = new Date(dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        // Find user by name or email
        const user = await User.findOne({ 
            $or: [
                { name: assignedToField },
                { email: assignedToField }
            ]
        });
        const assignedToValue = user ? user._id : assignedToField;

        // Find entity by name
        const client = await Client.findOne({ name: entityField });
        const entityValue = client ? client._id : entityField;

        if (daysUntilDue > 7) {
            const scheduledAt = new Date(due.getTime() - (7 * 24 * 60 * 60 * 1000));
            const taskAssigned = !!user;
            const status = 'upcoming';

            const task = new Task({
                name: taskName,
                description,
                priority,
                assignedTo: assignedToValue,
                entity: entityValue,
                bucket,
                dueDate,
                recurringFrequency: frequencyField,
                tags: processedTags,
                estimatedHours,
                closureRightsEmail,
                alertEmails: processedAlertEmails,
                scheduledAt,
                taskAssigned,
                status
            });
            await task.save();

            // Send task assignment email notification
            if (user) {
                try {
                    await taskNotificationService.sendTaskAssignmentEmail(task, user, client);
                    console.log(`[CREATE_TASK_EMAIL_SUCCESS] Assignment email sent for future task: ${task.name} to ${user.email}`);
                } catch (emailError) {
                    console.error('[CREATE_TASK_EMAIL_ERROR]', {
                        message: 'Failed to send assignment email for future task',
                        error: emailError.message,
                        taskId: task._id,
                        userId: user._id,
                        taskName: task.name,
                        userEmail: user.email
                    });
                }
            } else {
                console.log(`[CREATE_TASK_EMAIL_SKIP] No user found for task: ${task.name}, skipping email`);
            }

            return res.status(201).json({ 
                message: 'Task queued for the future creation', 
                task, 
                scheduledAt,
                emailSent: !!user 
            });
        } else {
            const taskAssigned = !!user;
            const task = new Task({
                name: taskName,
                description,
                priority,
                assignedTo: assignedToValue,
                entity: entityValue,
                bucket,
                dueDate,
                recurringFrequency: frequencyField,
                tags: processedTags,
                estimatedHours,
                closureRightsEmail,
                alertEmails: processedAlertEmails,
                taskAssigned
            });
            await task.save();

            // Send task assignment email notification
            if (user) {
                try {
                    await taskNotificationService.sendTaskAssignmentEmail(task, user, client);
                    console.log(`[CREATE_TASK_EMAIL_SUCCESS] Assignment email sent for immediate task: ${task.name} to ${user.email}`);
                } catch (emailError) {
                    console.error('[CREATE_TASK_EMAIL_ERROR]', {
                        message: 'Failed to send assignment email for immediate task',
                        error: emailError.message,
                        taskId: task._id,
                        userId: user._id,
                        taskName: task.name,
                        userEmail: user.email
                    });
                }
            } else {
                console.log(`[CREATE_TASK_EMAIL_SKIP] No user found for task: ${task.name}, skipping email`);
            }

            return res.status(201).json({ 
                message: 'Task created immediately successfully', 
                task,
                emailSent: !!user 
            });
        }
    } catch (error) {
        console.error('[CREATE_TASK_ERROR]', {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
            timestamp: new Date().toISOString()
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed creating task';
        let statusCode = 400;
        
        if (error.name === 'ValidationError') {
            // Mongoose validation errors
            const validationErrors = Object.values(error.errors).map(err => err.message);
            errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
        } else if (error.name === 'CastError') {
            // Invalid ObjectId or type casting errors
            errorMessage = `Invalid data format for field: ${error.path}`;
        } else if (error.code === 11000) {
            // Duplicate key error
            errorMessage = 'Task with this combination already exists';
        } else if (error.message.includes('required')) {
            // Missing required fields
            errorMessage = `Missing required field: ${error.message}`;
        } else {
            // Generic server error
            statusCode = 500;
            errorMessage = 'Internal server error while creating task';
        }
        
        res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getAllTasks = async (req, res) => {
    try {
        console.log('[GET_ALL_TASKS_DEBUG] Starting task fetch', {
            user: req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : 'No user',
            query: req.query,
            timestamp: new Date().toISOString()
        });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const user = req.user; // User from auth middleware
        let filter = {};

        // Role-based filtering
        if (user.role === 'admin') {
            // Admin can see all tasks
            filter = {};
            console.log('[GET_ALL_TASKS_DEBUG] Admin access - no filter applied');
        } else {
            // Regular user can only see tasks assigned to them or where they have closure rights
            filter = {
                $or: [
                    { assignedTo: user._id }, // Tasks assigned to user (by ID)
                    { assignedTo: user.name }, // Tasks assigned to user (by name)
                    { assignedTo: user.email }, // Tasks assigned to user (by email)
                    { closureRightsEmail: user.email } // Tasks where user has closure rights
                ]
            };
            console.log('[GET_ALL_TASKS_DEBUG] User filter applied:', filter);
        }

        console.log('[GET_ALL_TASKS_DEBUG] Finding tasks with filter:', filter);
        
        // First get tasks without population to avoid casting errors
        const tasks = await Task.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        console.log('[GET_ALL_TASKS_DEBUG] Found tasks:', tasks.length);

        // Handle population manually to avoid ObjectId casting errors
        const populatedTasks = await Promise.all(tasks.map(async (task, index) => {
            try {
                console.log(`[GET_ALL_TASKS_DEBUG] Processing task ${index + 1}:`, {
                    id: task._id,
                    name: task.name,
                    assignedTo: task.assignedTo,
                    assignedToType: typeof task.assignedTo,
                    entity: task.entity,
                    entityType: typeof task.entity
                });

                const taskObj = task.toObject();
                
                // Handle assignedTo population
                if (task.assignedTo) {
                    if (mongoose.Types.ObjectId.isValid(task.assignedTo)) {
                        try {
                            const assignedUser = await User.findById(task.assignedTo).select('name email');
                            taskObj.assignedTo = assignedUser || task.assignedTo;
                            console.log(`[GET_ALL_TASKS_DEBUG] Successfully populated assignedTo for task ${task.name}`);
                        } catch (userErr) {
                            console.warn(`[GET_ALL_TASKS_WARN] Failed to populate assignedTo for task ${task.name}:`, userErr.message);
                            taskObj.assignedTo = task.assignedTo;
                        }
                    } else {
                        // It's a string, try to find user by name or email
                        try {
                            const assignedUser = await User.findOne({
                                $or: [
                                    { name: task.assignedTo },
                                    { email: task.assignedTo }
                                ]
                            }).select('name email');
                            taskObj.assignedTo = assignedUser || task.assignedTo;
                            console.log(`[GET_ALL_TASKS_DEBUG] Found user by string match for task ${task.name}`);
                        } catch (userErr) {
                            console.warn(`[GET_ALL_TASKS_WARN] Failed to find user by string for task ${task.name}:`, userErr.message);
                            taskObj.assignedTo = task.assignedTo;
                        }
                    }
                }
                
                // Handle entity population
                if (task.entity) {
                    if (mongoose.Types.ObjectId.isValid(task.entity)) {
                        try {
                            const client = await Client.findById(task.entity).select('name');
                            taskObj.entity = client || task.entity;
                            console.log(`[GET_ALL_TASKS_DEBUG] Successfully populated entity for task ${task.name}`);
                        } catch (clientErr) {
                            console.warn(`[GET_ALL_TASKS_WARN] Failed to populate entity for task ${task.name}:`, clientErr.message);
                            taskObj.entity = task.entity;
                        }
                    } else {
                        // It's a string, try to find client by name
                        try {
                            const client = await Client.findOne({ name: task.entity }).select('name');
                            taskObj.entity = client || task.entity;
                            console.log(`[GET_ALL_TASKS_DEBUG] Found client by string match for task ${task.name}`);
                        } catch (clientErr) {
                            console.warn(`[GET_ALL_TASKS_WARN] Failed to find client by string for task ${task.name}:`, clientErr.message);
                            taskObj.entity = task.entity;
                        }
                    }
                }
                
                return taskObj;
            } catch (taskError) {
                console.error(`[GET_ALL_TASKS_ERROR] Error processing task ${index + 1}:`, {
                    taskId: task._id,
                    error: taskError.message,
                    stack: taskError.stack
                });
                // Return task as-is if processing fails
                return task.toObject();
            }
        }));

        // Add document analysis for each task
        const { analyzeTaskDocuments } = require('../services/llm.doc.service');
        const Doc = require('../models/Doc.model');

        const tasksWithAnalysis = await Promise.all(populatedTasks.map(async (task) => {
            try {
                // Get document summary and detailed analysis
                const documents = await Doc.find({ task_id: task._id }).sort({ createdAt: -1 });
                
                const documentSummary = {
                    totalDocuments: documents.length,
                    lastUpload: documents.length > 0 ? documents[documents.length - 1].createdAt : null,
                    hasAnalysis: documents.some(doc => doc.ai_doc_suggestions && Object.keys(doc.ai_doc_suggestions).length > 2)
                };

                // Get analysis metrics
                let analysisMetrics = null;
                let documentDetails = [];
                let overallAnalysis = null;

                if (documents.length > 0) {
                    const analysis = await analyzeTaskDocuments(task._id, task);
                    analysisMetrics = {
                        overallCompletionPercentage: analysis.overallCompletionPercentage,
                        completedDocuments: analysis.fullyCompletedDocuments,
                        totalAnalyzedDocuments: analysis.documentsAnalyzed,
                        highRiskDocuments: documents.filter(doc => 
                            doc.ai_doc_suggestions?.riskAssessment === 'high'
                        ).length,
                        taskReadiness: analysis.taskReadiness,
                        lastAnalyzed: documents.reduce((latest, doc) => {
                            const docAnalyzedAt = doc.ai_doc_suggestions?.analyzedAt;
                            if (docAnalyzedAt && (!latest || docAnalyzedAt > latest)) {
                                return docAnalyzedAt;
                            }
                            return latest;
                        }, null)
                    };

                    // Include overall analysis
                    overallAnalysis = {
                        overallCompletionStatus: analysis.overallCompletionStatus,
                        overallCompletionPercentage: analysis.overallCompletionPercentage,
                        taskReadiness: analysis.taskReadiness,
                        consolidatedRecommendations: analysis.consolidatedRecommendations,
                        overallRiskLevel: analysis.overallRiskLevel,
                        estimatedCompletionTime: analysis.estimatedCompletionTime
                    };

                    // Include detailed document information with download links
                    documentDetails = documents.map(doc => ({
                        id: doc._id,
                        fileName: doc.file_name,
                        mimeType: doc.mime,
                        fileSize: doc.file_size,
                        status: doc.status,
                        uploadDate: doc.createdAt,
                        downloadUrl: `/docs/download/${doc._id}`, // Download link
                        analysis: doc.ai_doc_suggestions ? {
                            summary: doc.ai_doc_suggestions.summary,
                            taskCompletionStatus: doc.ai_doc_suggestions.taskCompletionStatus,
                            completionPercentage: doc.ai_doc_suggestions.completionPercentage,
                            performanceRating: doc.ai_doc_suggestions.performanceRating,
                            riskAssessment: doc.ai_doc_suggestions.riskAssessment,
                            keyFindings: doc.ai_doc_suggestions.keyFindings,
                            recommendations: doc.ai_doc_suggestions.recommendations,
                            contributionToTask: doc.ai_doc_suggestions.contributionToTask
                        } : null,
                        hasAnalysis: !!(doc.ai_doc_suggestions && Object.keys(doc.ai_doc_suggestions).length > 2)
                    }));

                    // Categorize documents by sections
                    const documentSections = categorizeDocuments(documents, task.bucket);
                    
                    return {
                        ...task,
                        documentSummary,
                        analysisMetrics,
                        overallAnalysis,
                        documentDetails,
                        documentSections: {
                            primary: documentSections.primary,
                            supporting: documentSections.supporting,
                            compliance: documentSections.compliance,
                            other: documentSections.other,
                            bucketType: documentSections.bucketType,
                            totalDocuments: documentSections.totalDocuments
                        }
                    };
                }

                return {
                    ...task,
                    documentSummary,
                    analysisMetrics,
                    overallAnalysis,
                    documentDetails,
                    documentSections: null
                };
            } catch (error) {
                console.error(`Error adding analysis for task ${task._id}:`, error);
                return task; // Return task without analysis if error occurs
            }
        }));
            
        const total = await Task.countDocuments(filter);

        console.log('[GET_ALL_TASKS_DEBUG] Successfully completed task fetch', {
            tasksReturned: populatedTasks.length,
            totalTasks: total,
            page,
            totalPages: Math.ceil(total / limit)
        });

        return res.status(200).json({
            tasks: tasksWithAnalysis,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalTasks: total,
            userRole: user.role
        });
    } catch (error) {
        console.error('[GET_ALL_TASKS_ERROR]', {
            message: error.message,
            stack: error.stack,
            user: req.user ? { id: req.user._id, role: req.user.role } : 'No user',
            query: req.query,
            timestamp: new Date().toISOString()
        });

        // Provide more specific error messages
        let errorMessage = 'Failed to fetch tasks';
        let statusCode = 500;
        
        if (error.name === 'CastError') {
            errorMessage = `Database query error: Invalid ${error.path} value "${error.value}"`;
            statusCode = 400;
        } else if (error.name === 'ValidationError') {
            errorMessage = `Query validation failed: ${error.message}`;
            statusCode = 400;
        } else if (error.message.includes('unauthorized')) {
            errorMessage = 'Unauthorized access to tasks';
            statusCode = 401;
        }
        
        return res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * General task update API with audit history
 * @route PATCH /tasks/update/:taskId
 * @body { field updates } (any task fields)
 */
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updateData = req.body;
        const userId = req.user._id;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        console.log('[UPDATE_TASK_DEBUG]', {
            taskId,
            updateData,
            user: { id: userId, role: req.user.role },
            timestamp: new Date().toISOString()
        });

        // Get current task for history logging
        const currentTask = await Task.findById(taskId);
        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Validate enum fields if they're being updated
        if (updateData.bucket) {
            const validBuckets = ['GST', 'IT', 'TDS', 'PF', 'ESI', 'ROC', 'other'];
            if (!validBuckets.includes(updateData.bucket)) {
                return res.status(400).json({ 
                    message: `Invalid bucket value. Must be one of: ${validBuckets.join(', ')}`,
                    providedValue: updateData.bucket
                });
            }
        }

        if (updateData.priority) {
            const validPriorities = ['low', 'medium', 'high', 'critical'];
            if (!validPriorities.includes(updateData.priority)) {
                return res.status(400).json({ 
                    message: `Invalid priority value. Must be one of: ${validPriorities.join(', ')}`,
                    providedValue: updateData.priority
                });
            }
        }

        if (updateData.status) {
            const validStatuses = ['open', 'inprogress', 'escalated', 'completed', 'on hold', 'upcoming'];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({ 
                    message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`,
                    providedValue: updateData.status
                });
            }
        }

        if (updateData.recurringFrequency) {
            const validFrequencies = ['one time', 'monthly', 'quarterly', 'half yearly', 'yearly'];
            if (!validFrequencies.includes(updateData.recurringFrequency)) {
                return res.status(400).json({ 
                    message: `Invalid frequency value. Must be one of: ${validFrequencies.join(', ')}`,
                    providedValue: updateData.recurringFrequency
                });
            }
        }

        // Handle special field processing
        const processedUpdate = { ...updateData };

        // Handle assignedTo field (resolve user)
        if (updateData.assignedTo) {
            let user = null;
            if (mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
                user = await User.findById(updateData.assignedTo);
            }
            if (!user) {
                user = await User.findOne({
                    $or: [
                        { email: updateData.assignedTo },
                        { name: updateData.assignedTo }
                    ]
                });
            }
            processedUpdate.assignedTo = user ? user._id : updateData.assignedTo;
            processedUpdate.taskAssigned = !!user;
        }

        // Handle entity field (resolve client)
        if (updateData.entity) {
            let client = null;
            if (mongoose.Types.ObjectId.isValid(updateData.entity)) {
                client = await Client.findById(updateData.entity);
            }
            if (!client) {
                client = await Client.findOne({ name: updateData.entity });
            }
            processedUpdate.entity = client ? client._id : updateData.entity;
        }

        // Handle tags and alertEmails conversion
        if (updateData.tags && typeof updateData.tags === 'string') {
            processedUpdate.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        if (updateData.alertEmails && typeof updateData.alertEmails === 'string') {
            processedUpdate.alertEmails = updateData.alertEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
        }

        // Track what fields are being changed
        const changedFields = {};
        const previousValues = {};
        const newValues = {};

        for (const [key, value] of Object.entries(processedUpdate)) {
            if (JSON.stringify(currentTask[key]) !== JSON.stringify(value)) {
                changedFields[key] = {
                    from: currentTask[key],
                    to: value
                };
                previousValues[key] = currentTask[key];
                newValues[key] = value;
            }
        }

        if (Object.keys(changedFields).length === 0) {
            return res.status(200).json({ 
                message: 'No changes detected', 
                task: currentTask 
            });
        }

        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            processedUpdate,
            { new: true, runValidators: true }
        );

        // Create audit history entry
        const historyEntry = new TaskHistory({
            taskId,
            action: 'updated',
            changedBy: userId,
            changes: changedFields,
            previousValues,
            newValues,
            description: `Task updated: ${Object.keys(changedFields).join(', ')}`
        });
        await historyEntry.save();

        // Send email notifications for task updates
        try {
            const { assignedUser, client } = await taskNotificationService.getTaskNotificationData(updatedTask);
            
            if (assignedUser) {
                // Check if this is a reassignment
                if (changedFields.assignedTo) {
                    const previousAssignedUser = await User.findById(currentTask.assignedTo);
                    await taskNotificationService.sendTaskReassignmentEmail(
                        updatedTask, 
                        assignedUser, 
                        previousAssignedUser, 
                        client, 
                        req.user
                    );
                }
                // Check if status changed
                else if (changedFields.status) {
                    await taskNotificationService.sendTaskStatusChangeEmail(
                        updatedTask,
                        assignedUser,
                        client,
                        changedFields.status.from,
                        changedFields.status.to,
                        req.user
                    );
                }
                // General update notification
                else {
                    await taskNotificationService.sendTaskUpdateEmail(
                        updatedTask,
                        assignedUser,
                        client,
                        changedFields,
                        req.user
                    );
                }
            }
        } catch (emailError) {
            console.error('[UPDATE_TASK_EMAIL_ERROR]', {
                message: 'Failed to send update email',
                error: emailError.message,
                taskId: updatedTask._id
            });
        }

        console.log('[UPDATE_TASK_SUCCESS]', {
            taskId,
            taskName: updatedTask.name,
            changedFields: Object.keys(changedFields),
            user: { id: userId, role: req.user.role },
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({ 
            message: 'Task updated successfully', 
            task: updatedTask,
            changedFields: Object.keys(changedFields)
        });

    } catch (error) {
        console.error('[UPDATE_TASK_ERROR]', {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            user: req.user ? { id: req.user._id, role: req.user.role } : 'No user',
            timestamp: new Date().toISOString()
        });

        // Provide more specific error messages
        let errorMessage = 'Failed to update task';
        let statusCode = 500;
        
        if (error.name === 'CastError' && error.path === '_id') {
            errorMessage = 'Invalid task ID format';
            statusCode = 400;
        } else if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'Duplicate value constraint violation';
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Get task history/audit trail
 * @route GET /tasks/history/:taskId
 */
const getTaskHistory = async (req, res) => {
    try {
        const { taskId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        console.log('[GET_TASK_HISTORY_DEBUG]', {
            taskId,
            page,
            limit,
            user: req.user ? { id: req.user._id, role: req.user.role } : 'No user',
            timestamp: new Date().toISOString()
        });

        // Verify task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get history entries
        const history = await TaskHistory.find({ taskId })
            .populate('changedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await TaskHistory.countDocuments({ taskId });

        console.log('[GET_TASK_HISTORY_SUCCESS]', {
            taskId,
            historyEntries: history.length,
            totalEntries: total,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            taskId,
            taskName: task.name,
            history,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalEntries: total
        });

    } catch (error) {
        console.error('[GET_TASK_HISTORY_ERROR]', {
            message: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query,
            user: req.user ? { id: req.user._id, role: req.user.role } : 'No user',
            timestamp: new Date().toISOString()
        });

        let errorMessage = 'Failed to fetch task history';
        let statusCode = 500;
        
        if (error.name === 'CastError' && error.path === '_id') {
            errorMessage = 'Invalid task ID format';
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get detailed task information with documents and analysis
const getTaskDetails = async (req, res) => {
    try {
        const { taskId } = req.params;
        const includeDocuments = req.query.includeDocuments !== 'false';
        const includeAnalysis = req.query.includeAnalysis !== 'false';

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check permissions (similar to getAllTasks)
        const user = req.user;
        if (user.role !== 'admin') {
            const hasAccess = task.assignedTo.toString() === user._id.toString() ||
                             task.assignedTo === user.name ||
                             task.assignedTo === user.email ||
                             task.closureRightsEmail === user.email;
            
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Populate assignedTo and entity
        let populatedTask = task.toObject();
        
        // Handle assignedTo population
        if (mongoose.Types.ObjectId.isValid(task.assignedTo)) {
            const assignedUser = await User.findById(task.assignedTo).select('name email');
            populatedTask.assignedTo = assignedUser || task.assignedTo;
        } else {
            const assignedUser = await User.findOne({
                $or: [{ name: task.assignedTo }, { email: task.assignedTo }]
            }).select('name email');
            populatedTask.assignedTo = assignedUser || task.assignedTo;
        }

        // Handle entity population
        if (mongoose.Types.ObjectId.isValid(task.entity)) {
            const client = await Client.findById(task.entity).select('name email');
            populatedTask.entity = client || task.entity;
        } else {
            const client = await Client.findOne({ name: task.entity }).select('name email');
            populatedTask.entity = client || task.entity;
        }

        let result = {
            task: populatedTask,
            metrics: {
                daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
                isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() : false,
                documentsCount: 0,
                hasDocuments: false,
                lastActivity: task.updatedAt
            }
        };

        if (includeDocuments || includeAnalysis) {
            const Doc = require('../models/Doc.model');
            const documents = await Doc.find({ task_id: taskId }).sort({ createdAt: -1 });
            
            result.metrics.documentsCount = documents.length;
            result.metrics.hasDocuments = documents.length > 0;

            if (includeDocuments) {
                // Categorize documents by compliance requirements
                const documentSections = categorizeDocuments(documents, task.bucket);
                result.documentSections = documentSections;

                // Add documents to task object
                result.task.documents = documents.map(doc => ({
                    id: doc._id,
                    fileName: doc.file_name,
                    mimeType: doc.mime,
                    fileSize: doc.file_size,
                    status: doc.status,
                    uploadDate: doc.createdAt,
                    analysis: doc.ai_doc_suggestions || null,
                    hasAnalysis: !!(doc.ai_doc_suggestions && Object.keys(doc.ai_doc_suggestions).length > 2)
                }));
            }

            if (includeAnalysis && documents.length > 0) {
                const { analyzeTaskDocuments } = require('../services/llm.doc.service');
                const overallAssessment = await analyzeTaskDocuments(taskId, task);
                
                result.analysis = {
                    overallAssessment,
                    documentAnalyses: documents.map(doc => ({
                        documentId: doc._id,
                        fileName: doc.file_name,
                        analysis: doc.ai_doc_suggestions || null,
                        uploadDate: doc.createdAt
                    }))
                };
            }
        }

        result.generatedAt = new Date();
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ 
            message: 'Failed to fetch task details', 
            error: error.message 
        });
    }
};

// Get comprehensive task analysis
const getTaskAnalysis = async (req, res) => {
    try {
        const { task_id } = req.params;

        // Find the task
        const task = await Task.findById(task_id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check permissions
        const user = req.user;
        if (user.role !== 'admin') {
            const hasAccess = task.assignedTo.toString() === user._id.toString() ||
                             task.assignedTo === user.name ||
                             task.assignedTo === user.email ||
                             task.closureRightsEmail === user.email;
            
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Get all documents for this task
        const Doc = require('../models/Doc.model');
        const documents = await Doc.find({ task_id });

        // Get overall analysis
        const { analyzeTaskDocuments } = require('../services/llm.doc.service');
        const analysis = await analyzeTaskDocuments(task_id, task);

        // Prepare document analyses
        const documentAnalyses = documents.map(doc => ({
            documentId: doc._id,
            fileName: doc.file_name,
            analysis: doc.ai_doc_suggestions || null,
            uploadDate: doc.createdAt
        }));

        // Create summary
        const summary = {
            totalDocuments: documents.length,
            completionPercentage: analysis.overallCompletionPercentage,
            readyForClosure: analysis.taskReadiness === 'ready_for_closure',
            riskLevel: analysis.overallRiskLevel,
            recommendations: analysis.consolidatedRecommendations
        };

        return res.status(200).json({
            task: {
                _id: task._id,
                name: task.name,
                description: task.description,
                priority: task.priority,
                bucket: task.bucket,
                dueDate: task.dueDate,
                status: task.status,
                estimatedHours: task.estimatedHours
            },
            analysis,
            documentAnalyses,
            summary,
            analyzedAt: new Date()
        });

    } catch (error) {
        console.error('Error analyzing task:', error);
        res.status(500).json({ 
            message: 'Failed to analyze task', 
            error: error.message 
        });
    }
};

// Helper function to categorize documents by compliance requirements
function categorizeDocuments(documents, bucketType) {
    const sections = {
        primary: [],
        supporting: [],
        compliance: [],
        other: []
    };

    const bucketPatterns = {
        GST: {
            primary: /gst|return|form|filing/i,
            supporting: /invoice|receipt|bill|purchase|sales/i,
            compliance: /certificate|acknowledgment|challan/i
        },
        IT: {
            primary: /income|tax|return|itr|form/i,
            supporting: /salary|tds|form16|investment/i,
            compliance: /certificate|acknowledgment|receipt/i
        },
        TDS: {
            primary: /tds|deduction|form26|quarterly/i,
            supporting: /salary|payment|vendor|contractor/i,
            compliance: /certificate|form16|challan/i
        },
        PF: {
            primary: /pf|provident|fund|ecr|monthly/i,
            supporting: /employee|salary|contribution/i,
            compliance: /certificate|acknowledgment|receipt/i
        },
        ESI: {
            primary: /esi|insurance|monthly|return/i,
            supporting: /employee|salary|medical/i,
            compliance: /certificate|acknowledgment|receipt/i
        },
        ROC: {
            primary: /roc|registrar|annual|return|form/i,
            supporting: /balance|sheet|audit|financial/i,
            compliance: /certificate|acknowledgment|filing/i
        }
    };

    const patterns = bucketPatterns[bucketType] || bucketPatterns.GST;

    documents.forEach(doc => {
        const fileName = doc.file_name.toLowerCase();
        
        if (patterns.primary.test(fileName)) {
            sections.primary.push({
                id: doc._id,
                fileName: doc.file_name,
                uploadDate: doc.createdAt,
                analysis: doc.ai_doc_suggestions
            });
        } else if (patterns.supporting.test(fileName)) {
            sections.supporting.push({
                id: doc._id,
                fileName: doc.file_name,
                uploadDate: doc.createdAt,
                analysis: doc.ai_doc_suggestions
            });
        } else if (patterns.compliance.test(fileName)) {
            sections.compliance.push({
                id: doc._id,
                fileName: doc.file_name,
                uploadDate: doc.createdAt,
                analysis: doc.ai_doc_suggestions
            });
        } else {
            sections.other.push({
                id: doc._id,
                fileName: doc.file_name,
                uploadDate: doc.createdAt,
                analysis: doc.ai_doc_suggestions
            });
        }
    });

    return {
        ...sections,
        bucketType,
        totalDocuments: documents.length,
        sectionsInfo: {
            primary: {
                count: sections.primary.length,
                description: `Primary ${bucketType} documents required for compliance`
            },
            supporting: {
                count: sections.supporting.length,
                description: `Supporting documents for ${bucketType} filing`
            },
            compliance: {
                count: sections.compliance.length,
                description: 'Compliance certificates and acknowledgments'
            },
            other: {
                count: sections.other.length,
                description: 'Other related documents'
            }
        }
    };
}

module.exports = { createTask, getAllTasks, updateTask, getTaskHistory, getTaskDetails, getTaskAnalysis };


