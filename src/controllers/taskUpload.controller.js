// 📂 controllers/taskUpload.controller.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

const Task = require('../models/task.model');
const Doc = require('../models/Doc.model');
const User = require('../models/user.model');
const Client = require('../models/client.model');

const { analyzeWithLLM } = require('../services/llm.doc.service');
const { taskNotificationService } = require('../services');

// ----------------- UTILS -----------------

/**
 * Parse CSV file into JSON rows
 */
const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

/**
 * Validate required fields for task
 */
const validateTaskFields = (item) => {
  const missingFields = [
    !item.name && 'name',
    !item.description && 'description',
    !item.priority && 'priority',
    !item.assignedTo && 'assignedTo',
    !item.bucket && 'bucket',
    !item.dueDate && 'dueDate',
    !item.recurringFrequency && 'recurringFrequency',
  ].filter(Boolean);

  return missingFields;
};

// ----------------- TASK UPLOAD -----------------

const uploadTasksFromFile = async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Parse file into data rows
    const ext = path.extname(filePath).toLowerCase();
    let data = [];
    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
    } else if (ext === '.csv') {
      data = await parseCsvFile(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Unsupported file format.' });
    }

    const now = new Date();
    const duplicateTasks = [];
    const skippedTasks = [];
    const validTasks = [];

    for (const item of data) {
      // ✅ Validate required fields
      const missingFields = validateTaskFields(item);
      if (missingFields.length) {
        skippedTasks.push({
          name: item.name || 'Unnamed task',
          reason: 'Missing required fields',
          details: { missingFields },
        });
        continue;
      }

      // ✅ Validate due date
      const dueDate = new Date(item.dueDate);
      if (isNaN(dueDate.getTime())) {
        skippedTasks.push({
          name: item.name,
          reason: 'Invalid due date format',
          details: { providedDate: item.dueDate },
        });
        continue;
      }
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      // ✅ Find user
      let assignedUser =
        (await User.findOne({ name: item.assignedTo })) ||
        (item.assignedTo.includes('@')
          ? await User.findOne({ email: item.assignedTo })
          : null);

      if (!assignedUser) {
        skippedTasks.push({
          name: item.name,
          reason: 'User not found',
          details: { assignedTo: item.assignedTo },
        });
        continue;
      }

      const assignedToValue = assignedUser._id;

      // ✅ Find client
      const clientEntity = item.entity
        ? await Client.findOne({ name: item.entity })
        : null;
      const entityValue = clientEntity ? clientEntity._id : item.entity;

      // ✅ Duplicate check
      const duplicate = await Task.findOne({
        name: item.name,
        dueDate,
        entity: entityValue,
      });
      if (duplicate) {
        duplicateTasks.push({
          name: item.name,
          entity: item.entity,
          dueDate: item.dueDate,
          reason: 'Duplicate task found',
        });
        continue;
      }

      // ✅ Process tags & alert emails
      const processedTags =
        typeof item.tags === 'string'
          ? item.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : item.tags;

      const processedAlertEmails =
        typeof item.alertEmails === 'string'
          ? item.alertEmails.split(',').map((e) => e.trim()).filter(Boolean)
          : item.alertEmails;

      // ✅ Base task object
      const baseTask = {
        name: item.name,
        description: item.description,
        priority: item.priority,
        assignedTo: assignedToValue,
        entity: entityValue,
        bucket: item.bucket,
        dueDate,
        recurringFrequency: item.recurringFrequency,
        tags: processedTags,
        estimatedHours: item.estimatedHours
          ? parseFloat(item.estimatedHours)
          : undefined,
        closureRightsEmail: item.closureRightsEmail,
        alertEmails: processedAlertEmails,
        taskAssigned: true,
      };

      // ✅ Scheduling logic
      if (daysUntilDue > 7) {
        const scheduledAt = new Date(dueDate);
        scheduledAt.setDate(scheduledAt.getDate() - 7);
        validTasks.push({ ...baseTask, scheduledAt, status: 'upcoming' });
      } else if (daysUntilDue >= 0) {
        validTasks.push({ ...baseTask, status: 'open' });
      } else {
        validTasks.push({ ...baseTask, status: 'escalated' });
      }
    }

    // ✅ Insert tasks & send emails
    let insertedTasks = [];
    let emailsSent = 0;
    let emailErrors = 0;

    if (validTasks.length > 0) {
      insertedTasks = await Task.insertMany(validTasks);

      for (const task of insertedTasks) {
        try {
          const assignedUser = await User.findById(task.assignedTo);
          const client = await Client.findById(task.entity);
          if (assignedUser?.email) {
            await taskNotificationService.sendTaskAssignmentEmail(
              task,
              assignedUser,
              client
            );
            emailsSent++;
          }
        } catch (err) {
          emailErrors++;
          console.error('[EMAIL ERROR]', err.message, { taskId: task._id });
        }
      }
    }

    fs.unlinkSync(filePath);

    return res.status(validTasks.length > 0 ? 201 : 200).json({
      message:
        validTasks.length > 0
          ? 'Tasks uploaded successfully'
          : 'No valid tasks to upload',
      summary: {
        totalProcessed: data.length,
        validTasks: validTasks.length,
        insertedTasks: insertedTasks.length,
        duplicateTasks: duplicateTasks.length,
        skippedTasks: skippedTasks.length,
        emailsSent,
        emailErrors,
      },
      tasks: insertedTasks,
      duplicates: duplicateTasks,
      skipped: skippedTasks,
    });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
    return res
      .status(500)
      .json({ message: 'Failed to upload tasks', error: error.message });
  }
};

// ----------------- DOC UPLOAD -----------------

const taskCompletedDocumentationUpload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });

    const { task_id, user_id } = req.body;
    const stored_file_name = uuidv4() + path.extname(file.originalname);
    const storage_location = path.join(__dirname, '../uploads', stored_file_name);

    const fileBuffer = fs.readFileSync(file.path);
    const hashValue = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    fs.writeFileSync(storage_location, fileBuffer);

    const task = await Task.findById(task_id);
    const taskContext = task
      ? {
          name: task.name,
          description: task.description,
          bucket: task.bucket,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : null;

    let analysisResult;
    try {
      analysisResult = await analyzeWithLLM(fileBuffer, file.mimetype, taskContext);
    } catch (err) {
      analysisResult = {
        summary: 'Analysis failed',
        taskCompletionStatus: 'unknown',
        completionPercentage: 0,
        riskAssessment: 'medium',
        recommendations: ['Verify document format'],
        analyzedAt: new Date(),
        analysisSuccess: false,
        errorMessage: err.message,
      };
    }

    const newDoc = new Doc({
      file_name: file.originalname,
      stored_file_name,
      task_id,
      user_id,
      mime: file.mimetype,
      file_size: file.size,
      hash: { alg: 'SHA-256', value: hashValue },
      storage_location,
      ai_doc_suggestions: analysisResult,
    });

    await newDoc.save();
    fs.unlinkSync(file.path);

    return res.status(201).json({
      message: 'File uploaded successfully',
      doc: newDoc,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    return res
      .status(500)
      .json({ message: 'Failed to upload file', error: error.message });
  }
};

// ----------------- DOC MANAGEMENT -----------------

const updateDocStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doc = await Doc.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    return res.status(200).json({ message: 'Status updated', doc });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to update status', error: error.message });
  }
};

const getDocsForTask = async (req, res) => {
  try {
    const { task_id } = req.query;
    const docs = await Doc.find({ task_id });
    return res.status(200).json({ docs });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch documents', error: error.message });
  }
};

module.exports = {
  uploadTasksFromFile,
  taskCompletedDocumentationUpload,
  updateDocStatus,
  getDocsForTask,
};
