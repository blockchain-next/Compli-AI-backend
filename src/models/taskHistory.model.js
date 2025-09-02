const mongoose = require('mongoose');

const taskHistorySchema = mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'reassigned', 'status_changed', 'deleted'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
taskHistorySchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('TaskHistory', taskHistorySchema, 'taskhistory');
