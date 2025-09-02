const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const fs = require('fs');
const path = require('path');
const Doc = require('../models/Doc.model');
// For PDF parsing (install with: npm install pdf-parse)
const pdfParse = require('pdf-parse');

const DocAnalysis = async (req, res) => {
    try {
        const { user_id, task_id } = req.body;

        // 1. Find the document in the DB
        const doc = await Doc.findOne({ user_id, task_id });
        if (!doc) {
            return res.status(404).json({ message: 'Document not found for this user and task.' });
        }

        // 2. Build the file path (assuming filename is stored in doc.title)
        const filePath = path.join(__dirname, '..', 'uploads', 'docs', doc.title);

        // 3. Read and extract text (example for PDF)
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        const docText = pdfData.text;

        if (!docText) {
            return res.status(400).json({ message: 'Could not extract text from document.' });
        }

        // 4. Analyze with LLM
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that analyzes and summarizes documents.' },
                { role: 'user', content: `Analyze and summarize the following document:\n\n${docText}` }
            ],
            max_tokens: 300
        });

        const summary = completion.choices[0].message.content;

        return res.status(200).json({ summary });
    } catch (error) {
        console.error('[LLM ANALYSIS ERROR]', error);
        return res.status(500).json({ message: 'Failed to analyze document', error: error.message });
    }
};

const aiSuggestions = async (req, res) => {
    try {
        const { docText } = req.body;

        if (!docText) {
            return res.status(400).json({ message: 'No document text provided.' });
        }

        // Ask the LLM for suggestions based on the document
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that provides suggestions for document improvement.' },
                { role: 'user', content: `Suggest improvements for the following document:\n\n${docText}` }
            ],
            max_tokens: 300
        });

        const suggestions = completion.choices[0].message.content;

        return res.status(200).json({ suggestions });
    } catch (error) {
        console.error('[LLM SUGGESTIONS ERROR]', error);
        return res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
    }
};

module.exports = { DocAnalysis, aiSuggestions };

