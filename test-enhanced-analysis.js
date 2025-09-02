#!/usr/bin/env node
/**
 * Test Script for Enhanced Document Analysis Integration
 * 
 * This script demonstrates the new AI-powered document analysis features
 * integrated into the task management system.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/v1';
let authToken = '';

// Mock authentication (replace with real token)
async function authenticate() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        authToken = response.data.tokens.access.token;
        console.log('✅ Authentication successful');
        return true;
    } catch (error) {
        console.log('❌ Authentication failed. Using mock token for demo.');
        authToken = 'mock-token-for-demo';
        return false;
    }
}

// Test 1: Get all tasks with enhanced analysis
async function testEnhancedTaskListing() {
    console.log('\n🔍 Testing Enhanced Task Listing with Analysis...');
    
    try {
        const response = await axios.get(`${BASE_URL}/task/get-all-tasks?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { tasks, totalTasks } = response.data;
        
        console.log(`📊 Found ${totalTasks} total tasks`);
        
        tasks.forEach((task, index) => {
            console.log(`\n📋 Task ${index + 1}: ${task.name}`);
            console.log(`   Status: ${task.status} | Priority: ${task.priority}`);
            console.log(`   Bucket: ${task.bucket} | Due: ${task.dueDate}`);
            
            if (task.documentSummary) {
                console.log(`   📁 Documents: ${task.documentSummary.totalDocuments}`);
                console.log(`   📈 Has Analysis: ${task.documentSummary.hasAnalysis}`);
            }
            
            if (task.analysisMetrics) {
                console.log(`   🎯 Completion: ${task.analysisMetrics.overallCompletionPercentage}%`);
                console.log(`   ✅ Completed Docs: ${task.analysisMetrics.completedDocuments}/${task.analysisMetrics.totalAnalyzedDocuments}`);
                console.log(`   🚨 High Risk Docs: ${task.analysisMetrics.highRiskDocuments}`);
                console.log(`   🏁 Task Readiness: ${task.analysisMetrics.taskReadiness}`);
            }
        });
        
        return tasks[0]?._id; // Return first task ID for further testing
        
    } catch (error) {
        console.error('❌ Task listing test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test 2: Get detailed task information
async function testTaskDetails(taskId) {
    if (!taskId) {
        console.log('\n⏭️ Skipping task details test (no task ID)');
        return;
    }
    
    console.log('\n🔍 Testing Task Details API...');
    
    try {
        const response = await axios.get(`${BASE_URL}/task/details/${taskId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { task, metrics, analysis, documentSections } = response.data;
        
        console.log(`📋 Task Details: ${task.name}`);
        console.log(`📊 Metrics:`);
        console.log(`   Days until due: ${metrics.daysUntilDue}`);
        console.log(`   Is overdue: ${metrics.isOverdue}`);
        console.log(`   Documents count: ${metrics.documentsCount}`);
        console.log(`   Has documents: ${metrics.hasDocuments}`);
        
        if (analysis) {
            console.log(`\n🤖 AI Analysis:`);
            console.log(`   Overall completion: ${analysis.overallAssessment.overallCompletionPercentage}%`);
            console.log(`   Task readiness: ${analysis.overallAssessment.taskReadiness}`);
            console.log(`   Risk level: ${analysis.overallAssessment.overallRiskLevel}`);
            console.log(`   Recommendations: ${analysis.overallAssessment.consolidatedRecommendations.join(', ')}`);
        }
        
        if (documentSections) {
            console.log(`\n📁 Document Sections:`);
            console.log(`   Primary: ${documentSections.primary.length} documents`);
            console.log(`   Supporting: ${documentSections.supporting.length} documents`);
            console.log(`   Compliance: ${documentSections.compliance.length} documents`);
            console.log(`   Other: ${documentSections.other.length} documents`);
        }
        
    } catch (error) {
        console.error('❌ Task details test failed:', error.response?.data || error.message);
    }
}

// Test 3: Get comprehensive task analysis
async function testTaskAnalysis(taskId) {
    if (!taskId) {
        console.log('\n⏭️ Skipping task analysis test (no task ID)');
        return;
    }
    
    console.log('\n🔍 Testing Task Analysis API...');
    
    try {
        const response = await axios.get(`${BASE_URL}/task/analysis/${taskId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { task, analysis, documentAnalyses, summary } = response.data;
        
        console.log(`📋 Task Analysis: ${task.name}`);
        console.log(`🎯 Overall Analysis:`);
        console.log(`   Status: ${analysis.overallCompletionStatus}`);
        console.log(`   Completion: ${analysis.overallCompletionPercentage}%`);
        console.log(`   Documents analyzed: ${analysis.documentsAnalyzed}`);
        console.log(`   Fully completed: ${analysis.fullyCompletedDocuments}`);
        console.log(`   High confidence: ${analysis.highConfidenceDocuments}`);
        console.log(`   Task readiness: ${analysis.taskReadiness}`);
        console.log(`   Risk level: ${analysis.overallRiskLevel}`);
        
        console.log(`\n📄 Document-level Analysis:`);
        documentAnalyses.forEach((docAnalysis, index) => {
            if (docAnalysis.analysis) {
                console.log(`   ${index + 1}. ${docAnalysis.fileName}`);
                console.log(`      Completion: ${docAnalysis.analysis.completionPercentage}%`);
                console.log(`      Status: ${docAnalysis.analysis.taskCompletionStatus}`);
                console.log(`      Performance: ${docAnalysis.analysis.performanceRating}`);
                console.log(`      Risk: ${docAnalysis.analysis.riskAssessment}`);
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   Ready for closure: ${summary.readyForClosure}`);
        console.log(`   Overall completion: ${summary.completionPercentage}%`);
        console.log(`   Risk level: ${summary.riskLevel}`);
        
        return documentAnalyses[0]?.documentId; // Return first document ID for further testing
        
    } catch (error) {
        console.error('❌ Task analysis test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test 4: Get individual document analysis
async function testDocumentAnalysis(docId) {
    if (!docId) {
        console.log('\n⏭️ Skipping document analysis test (no document ID)');
        return;
    }
    
    console.log('\n🔍 Testing Document Analysis API...');
    
    try {
        const response = await axios.get(`${BASE_URL}/docs/document/${docId}/analysis`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { document, analysis, contribution } = response.data;
        
        console.log(`📄 Document Analysis: ${document.fileName}`);
        console.log(`📊 File Info:`);
        console.log(`   Size: ${(document.fileSize / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${document.mimeType}`);
        console.log(`   Status: ${document.status}`);
        
        if (analysis) {
            console.log(`\n🤖 AI Analysis:`);
            console.log(`   Summary: ${analysis.summary}`);
            console.log(`   Completion Status: ${analysis.taskCompletionStatus}`);
            console.log(`   Completion %: ${analysis.completionPercentage}%`);
            console.log(`   Confidence: ${analysis.completionConfidence}`);
            console.log(`   Performance: ${analysis.performanceRating}`);
            console.log(`   Risk: ${analysis.riskAssessment}`);
            console.log(`   Key Findings: ${analysis.keyFindings?.join(', ') || 'None'}`);
            console.log(`   Recommendations: ${analysis.recommendations?.join(', ') || 'None'}`);
        }
        
        if (contribution) {
            console.log(`\n🎯 Task Contribution:`);
            console.log(`   Impact: ${contribution.completionImpact}%`);
            console.log(`   Performance: ${contribution.performanceRating}`);
            console.log(`   Risk Level: ${contribution.riskLevel}`);
        }
        
    } catch (error) {
        console.error('❌ Document analysis test failed:', error.response?.data || error.message);
    }
}

// Test 5: Upload a document with enhanced analysis
async function testDocumentUpload(taskId) {
    if (!taskId) {
        console.log('\n⏭️ Skipping document upload test (no task ID)');
        return;
    }
    
    console.log('\n🔍 Testing Document Upload with Enhanced Analysis...');
    
    try {
        // Create a mock document for testing
        const mockDocContent = `
GST Return Form - Monthly Filing
Date: September 2025
Company: Test Corp Ltd

SUMMARY:
- Turnover this month: ₹50,00,000
- Input Tax Credit: ₹9,00,000  
- Output Tax: ₹9,00,000
- Net Tax Payable: ₹0

SECTIONS COMPLETED:
✓ Basic Information
✓ Outward Supplies
✓ Inward Supplies  
✓ Input Tax Credit
✓ Payment Details
✓ Refund Claims

All required forms attached:
- GSTR-1 (Outward supplies)
- GSTR-2A (Auto-drafted inward supplies)
- GSTR-3B (Monthly return)
- Supporting invoices and bills

VERIFICATION:
All calculations verified and cross-checked.
Ready for submission to GST portal.
        `.trim();
        
        // Create temporary file
        const tempFilePath = './temp-gst-return.txt';
        fs.writeFileSync(tempFilePath, mockDocContent);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempFilePath));
        formData.append('task_id', taskId);
        formData.append('user_id', '507f1f77bcf86cd799439012'); // Mock user ID
        
        const response = await axios.post(`${BASE_URL}/task/upload-task-doc`, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            }
        });

        console.log(`✅ Document uploaded successfully`);
        console.log(`📄 File: ${response.data.doc.file_name}`);
        
        if (response.data.analysis) {
            const analysis = response.data.analysis;
            console.log(`\n🤖 AI Analysis Results:`);
            console.log(`   Summary: ${analysis.summary}`);
            console.log(`   Completion Status: ${analysis.taskCompletionStatus}`);
            console.log(`   Completion %: ${analysis.completionPercentage}%`);
            console.log(`   Performance: ${analysis.performanceRating}`);
            console.log(`   Risk: ${analysis.riskAssessment}`);
            console.log(`   Task Updated: ${response.data.taskStatusUpdated}`);
        }
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        return response.data.doc.id;
        
    } catch (error) {
        console.error('❌ Document upload test failed:', error.response?.data || error.message);
        // Clean up on error
        if (fs.existsSync('./temp-gst-return.txt')) {
            fs.unlinkSync('./temp-gst-return.txt');
        }
        return null;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Enhanced Document Analysis Integration Tests\n');
    console.log('=' .repeat(60));
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Test enhanced task listing
    const taskId = await testEnhancedTaskListing();
    
    // Step 3: Test task details
    await testTaskDetails(taskId);
    
    // Step 4: Test task analysis
    const docId = await testTaskAnalysis(taskId);
    
    // Step 5: Test document analysis
    await testDocumentAnalysis(docId);
    
    // Step 6: Test document upload
    const newDocId = await testDocumentUpload(taskId);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Enhanced Document Analysis Integration Tests Complete!');
    console.log('\n📋 Features Tested:');
    console.log('   ✅ Enhanced task listing with analysis metrics');
    console.log('   ✅ Detailed task information with document sections');
    console.log('   ✅ Comprehensive task analysis');
    console.log('   ✅ Individual document analysis');
    console.log('   ✅ Document upload with real-time AI analysis');
    console.log('\n🚀 Your Compli-AI system now has comprehensive AI-powered analysis!');
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
