const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CONFIG = {
    admin: {
        email: 'admin@example.com',
        password: 'password123'
    },
    user: {
        email: 'john.doe@example.com',
        password: 'password123'
    }
};

let adminToken = null;
let userToken = null;
let testTaskId = null;
let testDocumentId = null;

// Helper function to authenticate
async function authenticate(email, password) {
    try {
        const response = await axios.post(`${BASE_URL}/v1/auth/login`, {
            email,
            password
        });
        return response.data.tokens.access.token;
    } catch (error) {
        console.error('Authentication failed:', error.response?.data || error.message);
        throw error;
    }
}

// Test getAllTasks with enhanced document analysis
async function testGetAllTasks(token, userRole) {
    console.log(`\n=== Testing getAllTasks for ${userRole} ===`);
    
    try {
        const response = await axios.get(`${BASE_URL}/v1/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 5 }
        });

        console.log(`✅ getAllTasks successful for ${userRole}`);
        console.log(`📊 Tasks returned: ${response.data.tasks.length}`);
        console.log(`📄 Total tasks: ${response.data.totalTasks}`);
        
        if (response.data.tasks.length > 0) {
            const taskWithDocs = response.data.tasks.find(task => 
                task.documentSummary?.totalDocuments > 0
            );
            
            if (taskWithDocs) {
                testTaskId = taskWithDocs._id;
                console.log(`\n📋 Sample task with documents:`);
                console.log(`   - Task ID: ${taskWithDocs._id}`);
                console.log(`   - Name: ${taskWithDocs.name}`);
                console.log(`   - Documents: ${taskWithDocs.documentSummary.totalDocuments}`);
                console.log(`   - Has Analysis: ${taskWithDocs.documentSummary.hasAnalysis}`);
                console.log(`   - Bulk Download URL: ${taskWithDocs.documentSummary.bulkDownloadUrl}`);
                console.log(`   - Bulk Reanalyze URL: ${taskWithDocs.documentSummary.bulkReanalyzeUrl}`);
                
                if (taskWithDocs.documentDetails && taskWithDocs.documentDetails.length > 0) {
                    testDocumentId = taskWithDocs.documentDetails[0].id;
                    console.log(`   - Sample Document:`);
                    console.log(`     * ID: ${taskWithDocs.documentDetails[0].id}`);
                    console.log(`     * File: ${taskWithDocs.documentDetails[0].fileName}`);
                    console.log(`     * Download URL: ${taskWithDocs.documentDetails[0].downloadUrl}`);
                    console.log(`     * Has Analysis: ${taskWithDocs.documentDetails[0].hasAnalysis}`);
                    
                    if (taskWithDocs.documentDetails[0].analysis) {
                        console.log(`     * Completion: ${taskWithDocs.documentDetails[0].analysis.completionPercentage}%`);
                        console.log(`     * Status: ${taskWithDocs.documentDetails[0].analysis.taskCompletionStatus}`);
                    }
                }
                
                if (taskWithDocs.overallAnalysis) {
                    console.log(`   - Overall Analysis:`);
                    console.log(`     * Completion: ${taskWithDocs.overallAnalysis.overallCompletionPercentage}%`);
                    console.log(`     * Status: ${taskWithDocs.overallAnalysis.overallCompletionStatus}`);
                    console.log(`     * Readiness: ${taskWithDocs.overallAnalysis.taskReadiness}`);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error(`❌ getAllTasks failed for ${userRole}:`, error.response?.data || error.message);
        return false;
    }
}

// Test getTaskDetails with enhanced information
async function testGetTaskDetails(token, taskId) {
    console.log(`\n=== Testing getTaskDetails for task ${taskId} ===`);
    
    try {
        const response = await axios.get(`${BASE_URL}/v1/tasks/details/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { 
                includeDocuments: true, 
                includeAnalysis: true 
            }
        });

        console.log(`✅ getTaskDetails successful`);
        console.log(`📋 Task: ${response.data.task.name}`);
        console.log(`📊 Documents count: ${response.data.metrics.documentsCount}`);
        console.log(`🔄 Bulk Download URL: ${response.data.metrics.bulkDownloadUrl}`);
        console.log(`🔄 Bulk Reanalyze URL: ${response.data.metrics.bulkReanalyzeUrl}`);
        
        if (response.data.documentDetails) {
            console.log(`📄 Document details: ${response.data.documentDetails.length} documents`);
        }
        
        if (response.data.analysis?.overallAssessment) {
            console.log(`🎯 Overall completion: ${response.data.analysis.overallAssessment.overallCompletionPercentage}%`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ getTaskDetails failed:`, error.response?.data || error.message);
        return false;
    }
}

// Test document download
async function testDocumentDownload(token, docId) {
    console.log(`\n=== Testing Document Download for ${docId} ===`);
    
    try {
        const response = await axios.get(`${BASE_URL}/v1/docs/download/${docId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        console.log(`✅ Document download successful`);
        console.log(`📁 Content-Type: ${response.headers['content-type']}`);
        console.log(`📏 Content-Length: ${response.headers['content-length']} bytes`);
        
        return true;
    } catch (error) {
        console.error(`❌ Document download failed:`, error.response?.data || error.message);
        return false;
    }
}

// Test bulk document download (ZIP)
async function testBulkDocumentDownload(token, taskId) {
    console.log(`\n=== Testing Bulk Document Download for task ${taskId} ===`);
    
    try {
        const response = await axios.get(`${BASE_URL}/v1/docs/download-task-docs/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        console.log(`✅ Bulk document download successful`);
        console.log(`📁 Content-Type: ${response.headers['content-type']}`);
        console.log(`📏 Content-Length: ${response.headers['content-length']} bytes`);
        console.log(`📦 Content-Disposition: ${response.headers['content-disposition']}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Bulk document download failed:`, error.response?.data || error.message);
        return false;
    }
}

// Test document analysis
async function testDocumentAnalysis(token, docId) {
    console.log(`\n=== Testing Document Analysis for ${docId} ===`);
    
    try {
        const response = await axios.get(`${BASE_URL}/v1/docs/document/${docId}/analysis`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Document analysis successful`);
        console.log(`📄 Document: ${response.data.document.file_name}`);
        
        if (response.data.analysis) {
            console.log(`🎯 Analysis Summary: ${response.data.analysis.summary}`);
            console.log(`📊 Completion: ${response.data.analysis.completionPercentage}%`);
            console.log(`⚠️  Risk Level: ${response.data.analysis.riskAssessment}`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Document analysis failed:`, error.response?.data || error.message);
        return false;
    }
}

// Test bulk re-analysis
async function testBulkReanalysis(token, taskId) {
    console.log(`\n=== Testing Bulk Re-analysis for task ${taskId} ===`);
    
    try {
        const response = await axios.post(`${BASE_URL}/v1/docs/bulk-reanalyze/${taskId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Bulk re-analysis successful`);
        console.log(`📋 Task: ${response.data.task_name}`);
        console.log(`📊 Total documents: ${response.data.total_documents}`);
        console.log(`✅ Successful analyses: ${response.data.successful_analyses}`);
        console.log(`❌ Failed analyses: ${response.data.failed_analyses}`);
        
        if (response.data.overall_analysis) {
            console.log(`🎯 Overall completion: ${response.data.overall_analysis.overallCompletionPercentage}%`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Bulk re-analysis failed:`, error.response?.data || error.message);
        return false;
    }
}

// Main test execution
async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive API Tests...\n');
    
    try {
        // Authenticate users
        console.log('🔐 Authenticating users...');
        adminToken = await authenticate(TEST_CONFIG.admin.email, TEST_CONFIG.admin.password);
        userToken = await authenticate(TEST_CONFIG.user.email, TEST_CONFIG.user.password);
        console.log('✅ Authentication successful');
        
        // Test results
        const results = {
            getAllTasks_admin: false,
            getAllTasks_user: false,
            getTaskDetails: false,
            documentDownload: false,
            bulkDownload: false,
            documentAnalysis: false,
            bulkReanalysis: false
        };
        
        // Run tests
        results.getAllTasks_admin = await testGetAllTasks(adminToken, 'admin');
        results.getAllTasks_user = await testGetAllTasks(userToken, 'user');
        
        if (testTaskId) {
            results.getTaskDetails = await testGetTaskDetails(adminToken, testTaskId);
            results.bulkDownload = await testBulkDocumentDownload(adminToken, testTaskId);
            results.bulkReanalysis = await testBulkReanalysis(adminToken, testTaskId);
            
            if (testDocumentId) {
                results.documentDownload = await testDocumentDownload(adminToken, testDocumentId);
                results.documentAnalysis = await testDocumentAnalysis(adminToken, testDocumentId);
            }
        }
        
        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        
        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${test.replace(/_/g, ' ')}`);
        });
        
        const totalTests = Object.keys(results).length;
        const passedTests = Object.values(results).filter(Boolean).length;
        
        console.log('\n' + '='.repeat(50));
        console.log(`🎯 OVERALL: ${passedTests}/${totalTests} tests passed`);
        console.log('='.repeat(50));
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! The enhanced API is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('💥 Test execution failed:', error.message);
    }
}

// Run the tests
if (require.main === module) {
    runComprehensiveTests();
}

module.exports = {
    runComprehensiveTests,
    testGetAllTasks,
    testGetTaskDetails,
    testDocumentDownload,
    testBulkDocumentDownload,
    testDocumentAnalysis,
    testBulkReanalysis
};
