const OpenAI = require("openai");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const AdmZip = require("adm-zip");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractText(fileBuffer, mimeType) {
  try {
    if (mimeType === "application/zip") {
      const zip = new AdmZip(fileBuffer);
      const entries = zip.getEntries();
      for (const entry of entries) {
        if (entry.entryName.endsWith(".pdf")) {
          try {
            const pdfData = await pdfParse(entry.getData());
            return pdfData.text;
          } catch (pdfError) {
            console.warn(`Failed to parse PDF in ZIP: ${entry.entryName}`, pdfError.message);
            continue;
          }
        }
        if (entry.entryName.endsWith(".docx")) {
          try {
            const docxData = await mammoth.extractRawText({ buffer: entry.getData() });
            return docxData.value;
          } catch (docxError) {
            console.warn(`Failed to parse DOCX in ZIP: ${entry.entryName}`, docxError.message);
            continue;
          }
        }
        if (entry.entryName.endsWith(".txt")) {
          return entry.getData().toString("utf8");
        }
      }
      return "No supported document found in ZIP or all documents failed to parse.";
    } else if (mimeType === "application/pdf") {
      try {
        const data = await pdfParse(fileBuffer);
        return data.text;
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError.message);
        return "PDF parsing failed - document may be corrupted or password protected";
      }
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const data = await mammoth.extractRawText({ buffer: fileBuffer });
        return data.value;
      } catch (docxError) {
        console.error('DOCX parsing failed:', docxError.message);
        return "DOCX parsing failed - document may be corrupted or password protected";
      }
    } else if (mimeType.startsWith("text/")) {
      return fileBuffer.toString("utf8");
    }
    return "Unsupported file type";
  } catch (error) {
    console.error('Text extraction failed:', error.message);
    return `Text extraction failed: ${error.message}`;
  }
}

async function analyzeWithLLM(fileBuffer, mimeType, taskContext = null) {
  const text = await extractText(fileBuffer, mimeType);

  const prompt = `
  You are an AI compliance expert analyzing a document for task completion assessment and validation.
  
  ${taskContext ? `
  TASK CONTEXT:
  - Task Name: ${taskContext.name}
  - Description: ${taskContext.description}
  - Bucket: ${taskContext.bucket}
  - Priority: ${taskContext.priority}
  - Due Date: ${taskContext.dueDate}
  ` : ''}

  Your primary responsibility is to:
  1. Validate if the uploaded document is relevant and appropriate for the specified task
  2. Assess the document's contribution to task completion
  3. Identify any compliance issues or missing elements
  4. Provide actionable recommendations for improvement

  Please analyze this document and provide a comprehensive JSON response with the following structure:
  {
    "summary": "Brief 2-3 sentence summary of the document",
    "taskRelevance": "high|medium|low|irrelevant",
    "taskCompletionStatus": "completed|partially_completed|not_completed|unclear",
    "completionConfidence": "high|medium|low",
    "completionPercentage": 0-100,
    "keyFindings": ["finding1", "finding2", "finding3"],
    "complianceMetrics": {
      "documentationQuality": "excellent|good|satisfactory|needs_improvement|poor",
      "completenessScore": 0-100,
      "accuracyAssessment": "high|medium|low",
      "timelySubmission": true|false,
      "regulatoryCompliance": "compliant|partially_compliant|non_compliant|unclear"
    },
    "missingElements": ["element1", "element2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "riskAssessment": "low|medium|high|critical",
    "nextSteps": ["step1", "step2"],
    "contributionToTask": "Detailed explanation of how this document contributes to overall task completion",
    "performanceRating": "excellent|good|satisfactory|needs_improvement|poor",
    "validationNotes": "Specific notes about document validity for the task",
    "requiresAdditionalDocs": true|false,
    "additionalDocsNeeded": ["doc1", "doc2"]
  }

  IMPORTANT VALIDATION CRITERIA:
  - Document must be relevant to the specified task and bucket category
  - Content should align with the task description and requirements
  - Document should be complete and properly formatted
  - All required compliance elements should be present
  - Document should be submitted within appropriate timeframes

  Document Content:
  ${text.substring(0, 4000)}
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  try {
    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Ensure all required fields exist with defaults
    return {
      summary: analysis.summary || "Document analysis completed",
      taskRelevance: analysis.taskRelevance || "medium",
      taskCompletionStatus: analysis.taskCompletionStatus || "unclear",
      completionConfidence: analysis.completionConfidence || "medium",
      completionPercentage: analysis.completionPercentage || 0,
      keyFindings: analysis.keyFindings || [],
      complianceMetrics: {
        documentationQuality: analysis.complianceMetrics?.documentationQuality || "satisfactory",
        completenessScore: analysis.complianceMetrics?.completenessScore || 50,
        accuracyAssessment: analysis.complianceMetrics?.accuracyAssessment || "medium",
        timelySubmission: analysis.complianceMetrics?.timelySubmission || false,
        regulatoryCompliance: analysis.complianceMetrics?.regulatoryCompliance || "unclear"
      },
      missingElements: analysis.missingElements || [],
      recommendations: analysis.recommendations || [],
      riskAssessment: analysis.riskAssessment || "medium",
      nextSteps: analysis.nextSteps || [],
      contributionToTask: analysis.contributionToTask || "Document contributes to task completion",
      performanceRating: analysis.performanceRating || "satisfactory",
      validationNotes: analysis.validationNotes || "Document analyzed for task relevance",
      requiresAdditionalDocs: analysis.requiresAdditionalDocs || false,
      additionalDocsNeeded: analysis.additionalDocsNeeded || [],
      analyzedAt: new Date()
    };
  } catch (parseError) {
    console.error('Failed to parse LLM response:', parseError);
    // Fallback to simple analysis
    const output = response.choices[0].message.content;
    return {
      summary: output.split("\n")[0]?.trim() || "Document analyzed",
      singleLine: output.split("\n")[1]?.trim() || "Analysis completed",
      taskCompletionStatus: "unclear",
      completionPercentage: 50,
      performanceRating: "satisfactory",
      analyzedAt: new Date()
    };
  }
}

// New function for analyzing multiple documents for a task
async function analyzeTaskDocuments(taskId, taskContext = null) {
  try {
    const Doc = require('../models/Doc.model');
    const documents = await Doc.find({ task_id: taskId });

    if (documents.length === 0) {
      return {
        overallCompletionStatus: "not_completed",
        overallCompletionPercentage: 0,
        documentsAnalyzed: 0,
        fullyCompletedDocuments: 0,
        highConfidenceDocuments: 0,
        taskReadiness: "needs_more_work",
        consolidatedRecommendations: ["Upload documents to begin task analysis"],
        overallRiskLevel: "medium",
        estimatedCompletionTime: taskContext?.estimatedHours ? `${taskContext.estimatedHours} hours estimated` : "Time estimation unavailable"
      };
    }

    let totalCompletionPercentage = 0;
    let fullyCompletedDocs = 0;
    let highConfidenceDocs = 0;
    let allRecommendations = [];
    let allRisks = [];

    for (const doc of documents) {
      if (doc.ai_doc_suggestions) {
        const analysis = doc.ai_doc_suggestions;
        totalCompletionPercentage += analysis.completionPercentage || 0;
        
        if ((analysis.completionPercentage || 0) >= 90) {
          fullyCompletedDocs++;
        }
        
        if (analysis.completionConfidence === 'high') {
          highConfidenceDocs++;
        }

        if (analysis.recommendations) {
          allRecommendations = allRecommendations.concat(analysis.recommendations);
        }

        if (analysis.riskAssessment) {
          allRisks.push(analysis.riskAssessment);
        }
      }
    }

    const averageCompletion = Math.round(totalCompletionPercentage / documents.length);
    const taskReadiness = averageCompletion >= 90 ? "ready_for_closure" : "needs_more_work";
    
    // Determine overall risk level
    const highRiskCount = allRisks.filter(risk => risk === 'high').length;
    const mediumRiskCount = allRisks.filter(risk => risk === 'medium').length;
    let overallRiskLevel = "low";
    
    if (highRiskCount > 0) {
      overallRiskLevel = "high";
    } else if (mediumRiskCount > documents.length / 2) {
      overallRiskLevel = "medium";
    }

    // Remove duplicate recommendations
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      overallCompletionStatus: averageCompletion >= 90 ? "completed" : 
                               averageCompletion >= 50 ? "partially_completed" : "not_completed",
      overallCompletionPercentage: averageCompletion,
      documentsAnalyzed: documents.length,
      fullyCompletedDocuments: fullyCompletedDocs,
      highConfidenceDocuments: highConfidenceDocs,
      taskReadiness,
      consolidatedRecommendations: uniqueRecommendations.slice(0, 5), // Limit to top 5
      overallRiskLevel,
      estimatedCompletionTime: taskContext?.estimatedHours ? `${taskContext.estimatedHours} hours estimated` : "Time estimation unavailable",
      analyzedAt: new Date()
    };

  } catch (error) {
    console.error('Error analyzing task documents:', error);
    return {
      overallCompletionStatus: "unclear",
      overallCompletionPercentage: 0,
      documentsAnalyzed: 0,
      fullyCompletedDocuments: 0,
      highConfidenceDocuments: 0,
      taskReadiness: "needs_more_work",
      consolidatedRecommendations: ["Error occurred during analysis"],
      overallRiskLevel: "medium",
      error: error.message
    };
  }
}

module.exports = { analyzeWithLLM, analyzeTaskDocuments };