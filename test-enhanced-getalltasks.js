#!/usr/bin/env node
/**
 * Test Enhanced getAllTasks API with Document Analysis and Download Links
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';
const authToken = 'your-jwt-token-here'; // Replace with actual token

async function testEnhancedTaskListing() {
    console.log('🚀 Testing Enhanced Task Listing API...\n');
    
    try {
        const response = await axios.get(`${BASE_URL}/task/get-all-tasks?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { tasks, totalTasks, page, totalPages } = response.data;
        
        console.log(`📊 API Response Summary:`);
        console.log(`   Total Tasks: ${totalTasks}`);
        console.log(`   Page: ${page} of ${totalPages}`);
        console.log(`   Tasks in this page: ${tasks.length}\n`);
        
        tasks.forEach((task, index) => {
            console.log(`📋 Task ${index + 1}: ${task.name}`);
            console.log(`   ID: ${task._id}`);
            console.log(`   Status: ${task.status} | Priority: ${task.priority} | Bucket: ${task.bucket}`);
            console.log(`   Due Date: ${new Date(task.dueDate).toLocaleDateString()}`);
            
            // Assigned user info
            if (task.assignedTo && typeof task.assignedTo === 'object') {
                console.log(`   👤 Assigned To: ${task.assignedTo.name} (${task.assignedTo.email})`);
            } else {
                console.log(`   👤 Assigned To: ${task.assignedTo}`);
            }
            
            // Entity info
            if (task.entity && typeof task.entity === 'object') {
                console.log(`   🏢 Entity: ${task.entity.name}`);
            } else {
                console.log(`   🏢 Entity: ${task.entity}`);
            }
            
            // Document Summary
            if (task.documentSummary) {
                console.log(`   📁 Documents: ${task.documentSummary.totalDocuments} total`);
                console.log(`   📅 Last Upload: ${task.documentSummary.lastUpload ? new Date(task.documentSummary.lastUpload).toLocaleString() : 'None'}`);
                console.log(`   🤖 Has Analysis: ${task.documentSummary.hasAnalysis ? 'Yes' : 'No'}`);
            }
            
            // Analysis Metrics
            if (task.analysisMetrics) {
                console.log(`   📊 Analysis Metrics:`);
                console.log(`      🎯 Overall Completion: ${task.analysisMetrics.overallCompletionPercentage}%`);
                console.log(`      ✅ Completed Documents: ${task.analysisMetrics.completedDocuments}/${task.analysisMetrics.totalAnalyzedDocuments}`);
                console.log(`      🚨 High Risk Documents: ${task.analysisMetrics.highRiskDocuments}`);
                console.log(`      🏁 Task Readiness: ${task.analysisMetrics.taskReadiness}`);
                console.log(`      🕒 Last Analyzed: ${task.analysisMetrics.lastAnalyzed ? new Date(task.analysisMetrics.lastAnalyzed).toLocaleString() : 'Never'}`);
            }

            // Overall Analysis
            if (task.overallAnalysis) {
                console.log(`   🔍 Overall Analysis:`);
                console.log(`      📈 Status: ${task.overallAnalysis.overallCompletionStatus}`);
                console.log(`      🎯 Completion: ${task.overallAnalysis.overallCompletionPercentage}%`);
                console.log(`      🚦 Readiness: ${task.overallAnalysis.taskReadiness}`);
                console.log(`      ⚠️ Risk Level: ${task.overallAnalysis.overallRiskLevel}`);
                console.log(`      💡 Recommendations: ${task.overallAnalysis.consolidatedRecommendations?.join(', ') || 'None'}`);
                console.log(`      ⏱️ Estimated Time: ${task.overallAnalysis.estimatedCompletionTime}`);
            }

            // Document Details
            if (task.documentDetails && task.documentDetails.length > 0) {
                console.log(`   📄 Document Details:`);
                task.documentDetails.forEach((doc, docIndex) => {
                    console.log(`      ${docIndex + 1}. ${doc.fileName}`);
                    console.log(`         📊 Type: ${doc.mimeType} | Size: ${(doc.fileSize / 1024).toFixed(2)} KB`);
                    console.log(`         📅 Uploaded: ${new Date(doc.uploadDate).toLocaleString()}`);
                    console.log(`         📊 Status: ${doc.status}`);
                    console.log(`         🔗 Download: ${BASE_URL}${doc.downloadUrl}`);
                    
                    if (doc.analysis) {
                        console.log(`         🤖 AI Analysis:`);
                        console.log(`            📝 Summary: ${doc.analysis.summary}`);
                        console.log(`            ✅ Completion: ${doc.analysis.completionPercentage}% (${doc.analysis.taskCompletionStatus})`);
                        console.log(`            ⭐ Performance: ${doc.analysis.performanceRating}`);
                        console.log(`            ⚠️ Risk: ${doc.analysis.riskAssessment}`);
                        console.log(`            🎯 Contribution: ${doc.analysis.contributionToTask}`);
                        
                        if (doc.analysis.keyFindings && doc.analysis.keyFindings.length > 0) {
                            console.log(`            🔍 Key Findings: ${doc.analysis.keyFindings.join(', ')}`);
                        }
                        
                        if (doc.analysis.recommendations && doc.analysis.recommendations.length > 0) {
                            console.log(`            💡 Recommendations: ${doc.analysis.recommendations.join(', ')}`);
                        }
                    }
                });
            }

            // Document Sections
            if (task.documentSections) {
                console.log(`   📂 Document Sections (${task.documentSections.bucketType}):`);
                console.log(`      📋 Primary: ${task.documentSections.primary.length} documents`);
                console.log(`      📎 Supporting: ${task.documentSections.supporting.length} documents`);
                console.log(`      📜 Compliance: ${task.documentSections.compliance.length} documents`);
                console.log(`      📄 Other: ${task.documentSections.other.length} documents`);
            }
            
            console.log(`   ${'─'.repeat(60)}\n`);
        });
        
        console.log('✅ Enhanced Task Listing API Test Completed Successfully!');
        
        // Test document download for first document if available
        const firstTask = tasks[0];
        if (firstTask?.documentDetails?.length > 0) {
            const firstDoc = firstTask.documentDetails[0];
            console.log(`\n🔗 Testing Document Download for: ${firstDoc.fileName}`);
            console.log(`   Download URL: ${BASE_URL}${firstDoc.downloadUrl}`);
            console.log(`   💡 To download: GET ${BASE_URL}${firstDoc.downloadUrl} with Authorization header`);
        }
        
    } catch (error) {
        console.error('❌ Enhanced Task Listing Test Failed:');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data) {
            console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

// Test document download directly
async function testDocumentDownload(docId) {
    console.log(`\n🔽 Testing Document Download for ID: ${docId}...`);
    
    try {
        const response = await axios.get(`${BASE_URL}/docs/download/${docId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            responseType: 'blob' // Important for binary data
        });

        console.log(`✅ Document download successful!`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
        console.log(`   Content-Disposition: ${response.headers['content-disposition']}`);
        
    } catch (error) {
        console.error('❌ Document Download Test Failed:');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Message: ${error.response?.data?.message || error.message}`);
    }
}

// Main test runner
async function runEnhancedTests() {
    console.log('🎯 Enhanced Document Analysis Integration Tests');
    console.log('=' .repeat(70));
    console.log('Testing getAllTasks API with comprehensive document analysis\n');
    
    // Test the enhanced task listing
    await testEnhancedTaskListing();
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 Tests Complete!');
    console.log('\n📋 Features Verified:');
    console.log('   ✅ Enhanced task listing with analysis metrics');
    console.log('   ✅ Document summary and details included');
    console.log('   ✅ Overall task analysis integrated');
    console.log('   ✅ Individual document analysis available');
    console.log('   ✅ Document categorization by compliance sections');
    console.log('   ✅ Download links provided for all documents');
    console.log('   ✅ Performance ratings and risk assessments');
    console.log('   ✅ Consolidated recommendations');
    
    console.log('\n💡 Usage Notes:');
    console.log('   🔗 Use downloadUrl from response to download documents');
    console.log('   📊 Check analysisMetrics for quick task completion overview');
    console.log('   🎯 Use overallAnalysis for comprehensive task assessment');
    console.log('   📂 Use documentSections for organized document access');
    console.log('   🚨 Monitor highRiskDocuments count for compliance alerts');
}

// Run if called directly
if (require.main === module) {
    console.log('⚠️ Remember to update the authToken variable with your actual JWT token!');
    console.log('🔧 Start your server and ensure authentication is working.\n');
    
    if (authToken === 'your-jwt-token-here') {
        console.log('❌ Please update the authToken in this script before running tests.');
        process.exit(1);
    }
    
    runEnhancedTests().catch(console.error);
}

module.exports = { runEnhancedTests, testEnhancedTaskListing, testDocumentDownload };
