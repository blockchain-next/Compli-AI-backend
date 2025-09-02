const mongoose = require('mongoose');

const Taskschema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    assignedTo: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
    entity: {
        type: mongoose.Schema.Types.Mixed ,
    },
    bucket: { 
        type: String, 
        enum: [
            'GST',
            'IT',
            'TDS',
            'PF',
            'ESI',
            'ROC',
            'other'
        ],
        required: true
    },
    dueDate: { type: Date, required: true },
    taskAssigned: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    recurringFrequency: {
        type: String,
        enum: [
            'one time',
            'monthly',
            'quarterly',
            'half yearly',
            'yearly'
        ],
        required: true
    },
    tags: { 
        type: [String],
    },
    estimatedHours: { type: Number },
    closureRightsEmail: { type: String },
    alertEmails: { type: [String]},
    status: {
        type: String,
        enum: ['open', 'inprogress', 'escalated', 'completed', 'on hold', 'upcoming'],
        default: 'open'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', Taskschema,'tasks');
