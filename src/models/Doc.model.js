const mongoose = require('mongoose');

const HashSchema = new mongoose.Schema({

    alg:{ type:String, enum: ['SHA-256'], required: true},
    value: {type: String, required: true},
    },{_id:false});

const EncryptionSchema = new mongoose.Schema({
    alg:{ type: String, enum: ['AES-256'], required:true},
    key: {type: String, required:true},
    iv: {type: String, required:true},  
    tag: {type: String, required:true},

}, {_id:false});


const DocSchema = new mongoose.Schema({
    file_name:{ type: String, required: true },
    task_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // file meta data
    stored_file_name: { type: String, required: true },
    mime: { type: String, required: true }, 
    file_size: { type: Number, required: true },

    //security

    hash: {type : HashSchema, required: true},
    encryption: {type: EncryptionSchema, required: false}, // Made optional for backward compatibility

    //storage location

    storage_location: {
        type: String,
        required: true
    },
    status: {
    type: String,
    enum: ['pending', 'validated', 'failed'],
    default: 'validated'
},
     ai_doc_suggestions: {
    summary: { type: String },
    singleLine: { type: String },
    taskCompletionStatus: { 
      type: String, 
      enum: ['completed', 'partially_completed', 'not_completed', 'unclear'],
      default: 'unclear'
    },
    completionConfidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    keyFindings: [{ type: String }],
    complianceMetrics: {
      documentationQuality: {
        type: String,
        enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'],
        default: 'satisfactory'
      },
      completenessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      accuracyAssessment: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      timelySubmission: {
        type: Boolean,
        default: false
      }
    },
    missingElements: [{ type: String }],
    recommendations: [{ type: String }],
    riskAssessment: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    nextSteps: [{ type: String }],
    contributionToTask: { type: String },
    performanceRating: {
      type: String,
      enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'],
      default: 'satisfactory'
    },
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Doc', DocSchema, 'docs');