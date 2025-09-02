const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = require('../../docs/swaggerDef');
const { updateDocStatus, getDocsForTask } = require('../../controllers/taskUpload.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.js'],
});

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
  })
);

// Update document status
router.patch('/update-status/:id', auth(), updateDocStatus);

// Get all documents for a specific task
router.get('/task-docs', auth(), getDocsForTask);

// Debug endpoint to check document info
router.get('/debug/:doc_id', async (req, res) => {
    try {
        const { doc_id } = req.params;
        const Doc = require('../../models/Doc.model');
        const fs = require('fs');

        const document = await Doc.findById(doc_id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const fileExists = fs.existsSync(document.storage_location);
        let fileSize = 0;
        if (fileExists) {
            const stats = fs.statSync(document.storage_location);
            fileSize = stats.size;
        }

        return res.json({
            document: {
                id: document._id,
                fileName: document.file_name,
                mimeType: document.mime,
                dbFileSize: document.file_size,
                storageLocation: document.storage_location,
                hasEncryption: !!(document.encryption && document.encryption.key),
                encryptionInfo: document.encryption ? {
                    alg: document.encryption.alg,
                    hasKey: !!document.encryption.key,
                    hasIv: !!document.encryption.iv,
                    hasTag: !!document.encryption.tag
                } : null
            },
            storage: {
                fileExists,
                actualFileSize: fileSize,
                sizeMismatch: fileExists && fileSize !== document.file_size
            },
            uploadDate: document.createdAt
        });

    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({ 
            message: 'Debug failed', 
            error: error.message 
        });
    }
});

// Download document (public access)
router.get('/download/:doc_id', async (req, res) => {
    try {
        const { doc_id } = req.params;
        const Doc = require('../../models/Doc.model');
        const fs = require('fs');
        const crypto = require('crypto');

        const document = await Doc.findById(doc_id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // No authentication or permission checks - public access

        // Check if file exists
        if (!fs.existsSync(document.storage_location)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Read and serve the file (with support for both encrypted and unencrypted files)
        const fileData = fs.readFileSync(document.storage_location);
        
        let finalFileData;
        let decryptionAttempted = false;
        
        // Check if file is encrypted (backward compatibility)
        if (document.encryption && document.encryption.key && document.encryption.iv && document.encryption.tag) {
            try {
                console.log(`Attempting to decrypt file: ${document.file_name}`);
                decryptionAttempted = true;
                
                // File is encrypted - decrypt it using the stored IV and auth tag
                const iv = Buffer.from(document.encryption.iv, 'hex');
                const authTag = Buffer.from(document.encryption.tag, 'hex');
                
                // The file format is: [iv(16 bytes) + encrypted_data + authTag(16 bytes)]
                // But we use the IV and authTag from the database, so we just need the encrypted portion
                const encrypted = fileData.subarray(16, fileData.length - 16); // Skip first 16 (IV) and last 16 (authTag)

                const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(document.encryption.key, 'hex'), iv);
                decipher.setAuthTag(authTag);
                finalFileData = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                
                console.log(`Successfully decrypted file: ${document.file_name}, original: ${fileData.length}, decrypted: ${finalFileData.length}`);
            } catch (decryptError) {
                console.error(`Decryption failed for ${document.file_name}:`, decryptError.message);
                console.log('File appears to be encrypted but decryption failed - trying direct serve');
                
                // If decryption fails, it might be an unencrypted file misidentified as encrypted
                // Try serving the original data
                finalFileData = fileData;
            }
        } else {
            // File is not encrypted - serve directly
            console.log(`Serving unencrypted file: ${document.file_name}, size: ${fileData.length}`);
            finalFileData = fileData;
        }

        // Validate file data
        if (!finalFileData || finalFileData.length === 0) {
            console.error(`Empty file data for ${document.file_name}`);
            return res.status(500).json({ 
                message: 'File data is empty or corrupted',
                debug: {
                    originalFileSize: fileData.length,
                    finalFileSize: finalFileData ? finalFileData.length : 0,
                    decryptionAttempted,
                    hasEncryption: !!(document.encryption && document.encryption.key)
                }
            });
        }

        // Set appropriate headers for download
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', document.mime);
        res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
        res.setHeader('Content-Length', finalFileData.length);
        
        console.log(`Serving file: ${document.file_name}, mime: ${document.mime}, size: ${finalFileData.length}`);

        // Send the file
        return res.send(finalFileData);

    } catch (error) {
        console.error('Error downloading document:', error);
        console.error('Document info:', {
            id: req.params.doc_id,
            fileName: document?.file_name,
            storageLocation: document?.storage_location,
            hasEncryption: !!(document?.encryption?.key),
            fileExists: document?.storage_location ? fs.existsSync(document.storage_location) : false
        });
        res.status(500).json({ 
            message: 'Failed to download document', 
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? {
                fileName: document?.file_name,
                hasEncryption: !!(document?.encryption?.key),
                fileExists: document?.storage_location ? fs.existsSync(document.storage_location) : false
            } : undefined
        });
    }
});

// Get document with analysis
router.get('/document/:doc_id/analysis', auth(), async (req, res) => {
    try {
        const { doc_id } = req.params;
        const Doc = require('../../models/Doc.model');
        const Task = require('../../models/task.model');

        const document = await Doc.findById(doc_id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Get task information
        const task = await Task.findById(document.task_id);
        
        // Check permissions
        const user = req.user;
        if (user.role !== 'admin' && task) {
            const hasAccess = task.assignedTo.toString() === user._id.toString() ||
                             task.assignedTo === user.name ||
                             task.assignedTo === user.email ||
                             task.closureRightsEmail === user.email;
            
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const response = {
            document: {
                id: document._id,
                fileName: document.file_name,
                mimeType: document.mime,
                fileSize: document.file_size,
                uploadDate: document.createdAt,
                status: document.status,
                task: task ? {
                    _id: task._id,
                    name: task.name,
                    description: task.description,
                    priority: task.priority,
                    bucket: task.bucket,
                    dueDate: task.dueDate
                } : null
            },
            analysis: document.ai_doc_suggestions || null,
            contribution: document.ai_doc_suggestions ? {
                taskContribution: document.ai_doc_suggestions.contributionToTask,
                completionImpact: document.ai_doc_suggestions.completionPercentage,
                performanceRating: document.ai_doc_suggestions.performanceRating,
                riskLevel: document.ai_doc_suggestions.riskAssessment
            } : null
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching document analysis:', error);
        res.status(500).json({ 
            message: 'Failed to fetch document analysis', 
            error: error.message 
        });
    }
});

// Re-analyze document
router.post('/document/:doc_id/re-analyze', auth(), async (req, res) => {
    try {
        const { doc_id } = req.params;
        const Doc = require('../../models/Doc.model');
        const Task = require('../../models/task.model');
        const fs = require('fs');
        const crypto = require('crypto');
        const { analyzeWithLLM } = require('../../services/llm.doc.service');

        const document = await Doc.findById(doc_id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Get task context
        const task = await Task.findById(document.task_id);
        const taskContext = task ? {
            name: task.name,
            description: task.description,
            bucket: task.bucket,
            priority: task.priority,
            dueDate: task.dueDate
        } : null;

        // Check permissions
        const user = req.user;
        if (user.role !== 'admin' && task) {
            const hasAccess = task.assignedTo.toString() === user._id.toString() ||
                             task.assignedTo === user.name ||
                             task.assignedTo === user.email ||
                             task.closureRightsEmail === user.email;
            
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Read and decrypt the file
        const fileData = fs.readFileSync(document.storage_location);
        
        let finalFileData;
        
        // Check if file is encrypted (backward compatibility)
        if (document.encryption && document.encryption.key && document.encryption.iv && document.encryption.tag) {
            try {
                // File is encrypted - decrypt it using stored IV and auth tag
                const iv = Buffer.from(document.encryption.iv, 'hex');
                const authTag = Buffer.from(document.encryption.tag, 'hex');
                
                // The file format is: [iv(16 bytes) + encrypted_data + authTag(16 bytes)]
                const encrypted = fileData.subarray(16, fileData.length - 16); // Skip first 16 (IV) and last 16 (authTag)

                const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(document.encryption.key, 'hex'), iv);
                decipher.setAuthTag(authTag);
                finalFileData = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            } catch (decryptError) {
                console.error('Decryption failed, using file directly:', decryptError.message);
                finalFileData = fileData; // Fallback to direct file if decryption fails
            }
        } else {
            // File is not encrypted - use directly
            finalFileData = fileData;
        }

        // Store previous analysis
        const previousAnalysis = document.ai_doc_suggestions;

        // Re-analyze with enhanced AI
        const newAnalysis = await analyzeWithLLM(finalFileData, document.mime, taskContext);

        // Update document with new analysis
        await Doc.findByIdAndUpdate(doc_id, {
            ai_doc_suggestions: newAnalysis
        });

        return res.status(200).json({
            message: 'Document re-analyzed successfully',
            previousAnalysis,
            newAnalysis,
            changes: {
                completionStatusChanged: previousAnalysis?.taskCompletionStatus !== newAnalysis.taskCompletionStatus,
                completionPercentageChange: (newAnalysis.completionPercentage || 0) - (previousAnalysis?.completionPercentage || 0)
            }
        });

    } catch (error) {
        console.error('Error re-analyzing document:', error);
        res.status(500).json({ 
            message: 'Failed to re-analyze document', 
            error: error.message 
        });
    }
});

module.exports = router;
