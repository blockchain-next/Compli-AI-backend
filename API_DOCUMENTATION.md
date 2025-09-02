# Compli-AI Enhanced Document Analysis API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints require authentication via Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📤 Document Upload API

### Upload Task Documentation
**Endpoint:** `POST /task/upload-task-doc`

**Description:** Upload a document for task completion with AI-powered analysis

**Content-Type:** `multipart/form-data`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Document file (PDF, DOCX, TXT, ZIP) |
| `task_id` | String | Yes | MongoDB ObjectId of the task |
| `user_id` | String | Yes | MongoDB ObjectId of the user |

**Request Example:**
```javascript
const formData = new FormData();
formData.append('file', documentFile);
formData.append('task_id', '507f1f77bcf86cd799439011');
formData.append('user_id', '507f1f77bcf86cd799439012');

fetch('/api/v1/task/upload-task-doc', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "doc": {
    "id": "66d1234567890abcdef12345",
    "file_name": "compliance_report.pdf",
    "stored_file_name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
    "task_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "mime": "application/pdf",
    "file_size": 1024000,
    "status": "validated",
    "createdAt": "2025-09-01T10:00:00.000Z"
  },
  "analysis": {
    "summary": "Document contains comprehensive GST compliance checklist with all required sections completed and proper documentation format maintained.",
    "taskCompletionStatus": "completed",
    "completionConfidence": "high",
    "completionPercentage": 95,
    "keyFindings": [
      "All required GST forms completed",
      "Supporting documents attached",
      "No discrepancies in calculations",
      "Proper audit trail maintained"
    ],
    "complianceMetrics": {
      "documentationQuality": "excellent",
      "completenessScore": 95,
      "accuracyAssessment": "high",
      "timelySubmission": true
    },
    "missingElements": [],
    "recommendations": [
      "Maintain current documentation standards",
      "Archive documents as per retention policy"
    ],
    "riskAssessment": "low",
    "nextSteps": [
      "Submit final report to authorities",
      "Update compliance tracking sheet"
    ],
    "contributionToTask": "This document fully satisfies the GST compliance requirements and demonstrates complete adherence to regulatory standards.",
    "performanceRating": "excellent",
    "analyzedAt": "2025-09-01T10:01:00.000Z"
  },
  "taskStatusUpdated": true
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "message": "No file uploaded."
}

// 500 Internal Server Error
{
  "message": "Failed to upload file",
  "error": "Detailed error message"
}
```

---

## 📊 Task Analysis API

### Get Comprehensive Task Analysis
**Endpoint:** `GET /task/analysis/:task_id`

**Description:** Get comprehensive analysis of all documents uploaded for a specific task

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | String (URL) | Yes | MongoDB ObjectId of the task |

**Request Example:**
```javascript
fetch('/api/v1/task/analysis/507f1f77bcf86cd799439011', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
```

**Response:**
```json
{
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Monthly GST Filing",
    "description": "Complete monthly GST return filing with all supporting documents",
    "priority": "high",
    "bucket": "GST",
    "dueDate": "2025-09-15T00:00:00.000Z",
    "status": "completed",
    "estimatedHours": 4
  },
  "analysis": {
    "overallCompletionStatus": "completed",
    "overallCompletionPercentage": 92,
    "documentsAnalyzed": 3,
    "fullyCompletedDocuments": 2,
    "highConfidenceDocuments": 3,
    "taskReadiness": "ready_for_closure",
    "consolidatedRecommendations": [
      "Final review of calculations",
      "Ensure all signatures are in place",
      "Submit before deadline"
    ],
    "overallRiskLevel": "low",
    "estimatedCompletionTime": "4 hours estimated"
  },
  "documentAnalyses": [
    {
      "documentId": "66d1234567890abcdef12345",
      "fileName": "gst_return_form.pdf",
      "analysis": {
        "summary": "GST return form properly filled with all sections complete",
        "taskCompletionStatus": "completed",
        "completionPercentage": 95,
        "performanceRating": "excellent"
      },
      "uploadDate": "2025-09-01T10:00:00.000Z"
    },
    {
      "documentId": "66d1234567890abcdef12346",
      "fileName": "supporting_invoices.pdf",
      "analysis": {
        "summary": "All supporting invoices and receipts properly organized",
        "taskCompletionStatus": "completed",
        "completionPercentage": 90,
        "performanceRating": "good"
      },
      "uploadDate": "2025-09-01T11:00:00.000Z"
    }
  ],
  "summary": {
    "totalDocuments": 3,
    "completionPercentage": 92,
    "readyForClosure": true,
    "riskLevel": "low",
    "recommendations": [
      "Final review of calculations",
      "Ensure all signatures are in place"
    ]
  },
  "analyzedAt": "2025-09-01T12:00:00.000Z"
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "message": "Task not found"
}

// 500 Internal Server Error
{
  "message": "Failed to analyze task",
  "error": "Detailed error message"
}
```

---

## 📄 Document Analysis API

### Get Document with Analysis
**Endpoint:** `GET /task/document/:doc_id/analysis`

**Description:** Get detailed analysis of a specific document

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | String (URL) | Yes | MongoDB ObjectId of the document |

**Request Example:**
```javascript
fetch('/api/v1/task/document/66d1234567890abcdef12345/analysis', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
```

**Response:**
```json
{
  "document": {
    "id": "66d1234567890abcdef12345",
    "fileName": "compliance_report.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024000,
    "uploadDate": "2025-09-01T10:00:00.000Z",
    "status": "validated",
    "task": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Monthly GST Filing",
      "description": "Complete monthly GST return filing",
      "priority": "high",
      "bucket": "GST",
      "dueDate": "2025-09-15T00:00:00.000Z"
    }
  },
  "analysis": {
    "summary": "Document contains comprehensive GST compliance checklist with all required sections completed",
    "taskCompletionStatus": "completed",
    "completionConfidence": "high",
    "completionPercentage": 95,
    "keyFindings": [
      "All required GST forms completed",
      "Supporting documents attached",
      "No discrepancies in calculations"
    ],
    "complianceMetrics": {
      "documentationQuality": "excellent",
      "completenessScore": 95,
      "accuracyAssessment": "high",
      "timelySubmission": true
    },
    "missingElements": [],
    "recommendations": [
      "Maintain current documentation standards",
      "Archive documents as per retention policy"
    ],
    "riskAssessment": "low",
    "nextSteps": [
      "Submit final report to authorities",
      "Update compliance tracking sheet"
    ],
    "contributionToTask": "This document fully satisfies the GST compliance requirements and demonstrates complete adherence to regulatory standards.",
    "performanceRating": "excellent",
    "analyzedAt": "2025-09-01T10:01:00.000Z"
  },
  "contribution": {
    "taskContribution": "This document fully satisfies the GST compliance requirements and demonstrates complete adherence to regulatory standards.",
    "completionImpact": 95,
    "performanceRating": "excellent",
    "riskLevel": "low"
  }
}
```

---

## 🔄 Document Re-analysis API

### Re-analyze Document
**Endpoint:** `POST /task/document/:doc_id/re-analyze`

**Description:** Re-analyze a document with updated AI models or criteria

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | String (URL) | Yes | MongoDB ObjectId of the document |

**Request Example:**
```javascript
fetch('/api/v1/task/document/66d1234567890abcdef12345/re-analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
```

**Response:**
```json
{
  "message": "Document re-analyzed successfully",
  "previousAnalysis": {
    "summary": "Previous analysis summary",
    "taskCompletionStatus": "partially_completed",
    "completionPercentage": 85,
    "performanceRating": "good"
  },
  "newAnalysis": {
    "summary": "Updated analysis summary with more details",
    "taskCompletionStatus": "completed",
    "completionPercentage": 95,
    "performanceRating": "excellent",
    "keyFindings": [
      "Additional compliance requirements identified",
      "Documentation quality improved"
    ]
  },
  "changes": {
    "completionStatusChanged": true,
    "completionPercentageChange": 10
  }
}
```

---

## 📂 Document Management APIs

### Get Documents for Task
**Endpoint:** `GET /docs/task-docs?task_id=:task_id`

**Description:** Get all documents uploaded for a specific task

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | String (Query) | Yes | MongoDB ObjectId of the task |

**Request Example:**
```javascript
fetch('/api/v1/docs/task-docs?task_id=507f1f77bcf86cd799439011', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response:**
```json
{
  "docs": [
    {
      "_id": "66d1234567890abcdef12345",
      "file_name": "compliance_report.pdf",
      "stored_file_name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "task_id": "507f1f77bcf86cd799439011",
      "user_id": "507f1f77bcf86cd799439012",
      "mime": "application/pdf",
      "file_size": 1024000,
      "status": "validated",
      "ai_doc_suggestions": {
        "summary": "Document analysis summary",
        "completionPercentage": 95,
        "performanceRating": "excellent"
      },
      "createdAt": "2025-09-01T10:00:00.000Z",
      "updatedAt": "2025-09-01T10:01:00.000Z"
    }
  ]
}
```

### Update Document Status
**Endpoint:** `PATCH /docs/update-status/:id`

**Description:** Update the status of a document

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String (URL) | Yes | MongoDB ObjectId of the document |
| `status` | String (Body) | Yes | New status: `pending`, `validated`, or `failed` |

**Request Example:**
```javascript
fetch('/api/v1/docs/update-status/66d1234567890abcdef12345', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "status": "validated"
  })
});
```

**Response:**
```json
{
  "message": "Status updated",
  "doc": {
    "_id": "66d1234567890abcdef12345",
    "file_name": "compliance_report.pdf",
    "status": "validated",
    "updatedAt": "2025-09-01T12:00:00.000Z"
  }
}
```

### Download Document
**Endpoint:** `GET /docs/download/:doc_id`

**Description:** Download a document file (decrypted)

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | String (URL) | Yes | MongoDB ObjectId of the document |

**Request Example:**
```javascript
// Direct download via browser
window.open('/v1/docs/download/66d1234567890abcdef12345');

// Or fetch for processing
fetch('/v1/docs/download/66d1234567890abcdef12345', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.pdf';
  a.click();
});
```

**Response:**
- **Success**: Binary file data with appropriate headers
- **Content-Type**: Original file MIME type
- **Content-Disposition**: `attachment; filename="original_filename.ext"`

**Error Responses:**
```json
// 404 Not Found
{
  "message": "Document not found"
}

// 403 Forbidden
{
  "message": "Access denied"
}

// 500 Internal Server Error
{
  "message": "Failed to download document",
  "error": "Detailed error message"
}
```

---

## 📋 Task Management APIs

### Get All Tasks (Enhanced)
**Endpoint:** `GET /task/get-all-tasks`

**Description:** Get paginated list of tasks with document analysis summaries

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number (Query) | No | Page number (default: 1) |
| `limit` | Number (Query) | No | Items per page (default: 10) |
| `status` | String (Query) | No | Filter by task status |
| `priority` | String (Query) | No | Filter by priority |
| `bucket` | String (Query) | No | Filter by compliance bucket |

**Response:**
```json
{
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Monthly GST Filing",
      "description": "Complete monthly GST return filing",
      "priority": "high",
      "status": "inprogress",
      "bucket": "GST",
      "dueDate": "2025-09-15T00:00:00.000Z",
      "assignedTo": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "entity": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "ABC Corp"
      },
      "documentSummary": {
        "totalDocuments": 3,
        "lastUpload": "2025-09-01T10:00:00.000Z",
        "hasAnalysis": true
      },
      "analysisMetrics": {
        "overallCompletionPercentage": 85,
        "completedDocuments": 2,
        "totalAnalyzedDocuments": 3,
        "highRiskDocuments": 0,
        "taskReadiness": "needs_more_work",
        "lastAnalyzed": "2025-09-01T12:00:00.000Z"
      },
      "overallAnalysis": {
        "overallCompletionStatus": "partially_completed",
        "overallCompletionPercentage": 85,
        "taskReadiness": "needs_more_work",
        "consolidatedRecommendations": [
          "Complete remaining compliance sections",
          "Review document quality",
          "Submit before deadline"
        ],
        "overallRiskLevel": "low",
        "estimatedCompletionTime": "4 hours estimated"
      },
      "documentDetails": [
        {
          "id": "66d1234567890abcdef12345",
          "fileName": "gst_return_form.pdf",
          "mimeType": "application/pdf",
          "fileSize": 1024000,
          "status": "validated",
          "uploadDate": "2025-09-01T10:00:00.000Z",
          "downloadUrl": "/docs/download/66d1234567890abcdef12345",
          "analysis": {
            "summary": "GST return form properly completed with all sections filled",
            "taskCompletionStatus": "completed",
            "completionPercentage": 95,
            "performanceRating": "excellent",
            "riskAssessment": "low",
            "keyFindings": [
              "All required sections completed",
              "Proper calculations verified"
            ],
            "recommendations": [
              "Final review recommended",
              "Ready for submission"
            ],
            "contributionToTask": "Primary document that satisfies main GST filing requirements"
          },
          "hasAnalysis": true
        },
        {
          "id": "66d1234567890abcdef12346",
          "fileName": "supporting_invoices.pdf",
          "mimeType": "application/pdf",
          "fileSize": 512000,
          "status": "validated",
          "uploadDate": "2025-09-01T11:00:00.000Z",
          "downloadUrl": "/docs/download/66d1234567890abcdef12346",
          "analysis": {
            "summary": "Supporting invoices properly organized and categorized",
            "taskCompletionStatus": "completed",
            "completionPercentage": 90,
            "performanceRating": "good",
            "riskAssessment": "low",
            "keyFindings": [
              "All invoices properly formatted",
              "Complete audit trail maintained"
            ],
            "recommendations": [
              "Ensure all amounts match GST return"
            ],
            "contributionToTask": "Supporting documentation that validates GST calculations"
          },
          "hasAnalysis": true
        }
      ],
      "documentSections": {
        "primary": [
          {
            "id": "66d1234567890abcdef12345",
            "fileName": "gst_return_form.pdf",
            "uploadDate": "2025-09-01T10:00:00.000Z",
            "analysis": {
              "completionPercentage": 95,
              "performanceRating": "excellent"
            }
          }
        ],
        "supporting": [
          {
            "id": "66d1234567890abcdef12346",
            "fileName": "supporting_invoices.pdf",
            "uploadDate": "2025-09-01T11:00:00.000Z",
            "analysis": {
              "completionPercentage": 90,
              "performanceRating": "good"
            }
          }
        ],
        "compliance": [],
        "other": [],
        "bucketType": "GST",
        "totalDocuments": 3
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalTasks": 47,
  "userRole": "user"
}
```

### Get Task Details (Enhanced)
**Endpoint:** `GET /task/details/:taskId`

**Description:** Get comprehensive task information with documents and analysis

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | String (URL) | Yes | MongoDB ObjectId of the task |
| `includeDocuments` | Boolean (Query) | No | Include document list (default: true) |
| `includeAnalysis` | Boolean (Query) | No | Include AI analysis (default: true) |

**Response:**
```json
{
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Monthly GST Filing",
    "description": "Complete monthly GST return filing with all supporting documents",
    "priority": "high",
    "status": "inprogress",
    "bucket": "GST",
    "dueDate": "2025-09-15T00:00:00.000Z",
    "estimatedHours": 4,
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "entity": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "ABC Corp",
      "email": "contact@abccorp.com"
    },
    "documents": [
      {
        "id": "66d1234567890abcdef12345",
        "fileName": "gst_return_form.pdf",
        "mimeType": "application/pdf",
        "fileSize": 1024000,
        "status": "validated",
        "uploadDate": "2025-09-01T10:00:00.000Z",
        "analysis": {
          "summary": "GST return form properly completed with all sections filled",
          "taskCompletionStatus": "completed",
          "completionPercentage": 95,
          "performanceRating": "excellent",
          "riskAssessment": "low"
        },
        "hasAnalysis": true
      }
    ]
  },
  "metrics": {
    "daysUntilDue": 14,
    "isOverdue": false,
    "documentsCount": 3,
    "hasDocuments": true,
    "lastActivity": "2025-09-01T10:00:00.000Z"
  },
  "analysis": {
    "overallAssessment": {
      "overallCompletionStatus": "partially_completed",
      "overallCompletionPercentage": 85,
      "documentsAnalyzed": 3,
      "fullyCompletedDocuments": 2,
      "highConfidenceDocuments": 3,
      "taskReadiness": "needs_more_work",
      "consolidatedRecommendations": [
        "Complete remaining compliance sections",
        "Submit before deadline"
      ],
      "overallRiskLevel": "low"
    },
    "documentAnalyses": [
      {
        "documentId": "66d1234567890abcdef12345",
        "fileName": "gst_return_form.pdf",
        "analysis": {
          "summary": "GST return form properly completed",
          "taskCompletionStatus": "completed",
          "completionPercentage": 95,
          "keyFindings": [
            "All required sections completed",
            "Proper calculations verified"
          ],
          "performanceRating": "excellent"
        },
        "uploadDate": "2025-09-01T10:00:00.000Z"
      }
    ]
  },
  "documentSections": {
    "primary": [
      {
        "id": "66d1234567890abcdef12345",
        "fileName": "gst_return_form.pdf",
        "uploadDate": "2025-09-01T10:00:00.000Z"
      }
    ],
    "supporting": [
      {
        "id": "66d1234567890abcdef12346",
        "fileName": "invoice_summary.pdf",
        "uploadDate": "2025-09-01T11:00:00.000Z"
      }
    ],
    "compliance": [],
    "other": [],
    "bucketType": "GST",
    "totalDocuments": 3,
    "sectionsInfo": {
      "primary": {
        "count": 1,
        "description": "Primary GST documents required for compliance"
      },
      "supporting": {
        "count": 2,
        "description": "Supporting documents for GST filing"
      },
      "compliance": {
        "count": 0,
        "description": "Compliance certificates and acknowledgments"
      },
      "other": {
        "count": 0,
        "description": "Other related documents"
      }
    }
  },
  "generatedAt": "2025-09-01T12:00:00.000Z"
}
```

---

### Upload Tasks from File
**Endpoint:** `POST /task/upload-tasks`

**Description:** Upload multiple tasks from Excel or CSV file

**Content-Type:** `multipart/form-data`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Excel (.xlsx, .xls) or CSV file with task data |

**Required File Columns:**
- `name` or `title` - Task name
- `description` - Task description
- `priority` - Task priority (low, medium, high, critical)
- `assignedTo` - User name or ID
- `entity` - Client/entity name or ID
- `bucket` - Compliance area (GST, IT, TDS, PF, ESI, ROC, other)
- `dueDate` - Task due date
- `recurringFrequency` - Frequency (one time, monthly, quarterly, half yearly, yearly)

**Request Example:**
```javascript
const formData = new FormData();
formData.append('file', excelFile);

fetch('/api/v1/task/upload-tasks', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response:**
```json
{
  "message": "Tasks uploaded successfully",
  "tasks": 15
}
```

---

## 🔧 Data Models

### Task Completion Status Values
- `completed` - Task fully completed
- `partially_completed` - Task partially done
- `not_completed` - Task not completed
- `unclear` - Status cannot be determined

### Completion Confidence Levels
- `high` - Very confident in analysis
- `medium` - Moderately confident
- `low` - Low confidence, needs review

### Performance Ratings
- `excellent` - Outstanding performance
- `good` - Good performance
- `satisfactory` - Meets requirements
- `needs_improvement` - Below standards
- `poor` - Requires immediate attention

### Risk Assessment Levels
- `low` - Minimal compliance risk
- `medium` - Moderate risk, monitor
- `high` - High risk, immediate attention needed

### Document Status Values
- `pending` - Under review
- `validated` - Approved and validated
- `failed` - Failed validation

### Task Readiness Status
- `ready_for_closure` - Task can be closed
- `needs_more_work` - Additional work required
- `under_review` - Currently being reviewed

---

## 🎯 Usage Examples

### Complete Workflow Example
```javascript
// 1. Upload document
const uploadResponse = await fetch('/api/v1/task/upload-task-doc', {
  method: 'POST',
  body: formData,
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. Get comprehensive task analysis
const taskAnalysis = await fetch('/api/v1/task/analysis/' + taskId, {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 3. Check if task is ready for closure
const analysis = await taskAnalysis.json();
if (analysis.summary.readyForClosure) {
  console.log('Task ready for closure!');
}

// 4. Get individual document details
const docDetails = await fetch('/api/v1/task/document/' + docId + '/analysis', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### Error Handling Example
```javascript
try {
  const response = await fetch('/api/v1/task/upload-task-doc', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Upload failed:', error.message);
    return;
  }

  const result = await response.json();
  console.log('Analysis:', result.analysis);
  
} catch (error) {
  console.error('Network error:', error.message);
}
```

---

## 🔒 Security Notes

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Encryption**: Documents are encrypted with AES-256-GCM
3. **File Validation**: Only supported file types are accepted
4. **Access Control**: Users can only access their own documents
5. **Data Integrity**: SHA-256 hashing ensures file integrity

---

## 📊 Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |

This comprehensive API documentation covers all the enhanced document upload and analysis features of your Compli-AI system.
