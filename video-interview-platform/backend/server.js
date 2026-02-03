const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Load environment variables FIRST
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup OpenRouter Client AFTER dotenv loads
const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

console.log('OpenRouter API Key loaded:', process.env.OPENROUTER_API_KEY ? 'Yes' : 'No');

// Seed questions for personalization
const SEED_QUESTIONS = [
    "Tell me a little about yourself and what motivates you to wake up in the morning.",
    "Tell me about a time you made a significant mistake at work. How did you handle it?",
    "Describe a situation where you had to deal with a difficult coworker or client.",
    "Have you ever been assigned a task you felt was impossible? What did you do?",
    "If we asked your previous manager to describe you in three words, what would they be and why?",
    "Describe your ideal work environment.",
    "Tell me about a time you had to deliver bad news to a stakeholder.",
    "What is the one professional achievement you are most proud of?",
    "Tell me about a time you had to learn a completely new tool or skill very quickly.",
    "Is there anything about this job description that makes you nervous?"
];

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Configure Multer storage for videos
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique timestamped filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
        const extension = file.mimetype.includes('webm') ? '.webm' : '.mp4';
        cb(null, `interview-${uniqueSuffix}${extension}`);
    }
});

// Configure Multer storage for PDFs (resumes)
const pdfStorage = multer.memoryStorage();

// File filter for video files only
const videoFileFilter = (req, file, cb) => {
    const allowedMimes = ['video/webm', 'video/mp4', 'video/x-matroska'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only WebM and MP4 videos are allowed.'), false);
    }
};

// File filter for PDF files only
const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
};

const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB max file size
    }
});

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size for PDFs
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Upload video endpoint - now saves to candidate folder with proper naming
app.post('/upload', uploadVideo.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file provided'
            });
        }

        const { questionId, questionText, candidateName, candidateFolder } = req.body;
        
        // Determine destination folder and filename
        let destFolder = uploadsDir;
        let newFilename = req.file.filename;
        
        if (candidateFolder) {
            destFolder = path.join(uploadsDir, candidateFolder);
            // Create folder if it doesn't exist
            if (!fs.existsSync(destFolder)) {
                fs.mkdirSync(destFolder, { recursive: true });
            }
            
            // Rename file to candidateName_questionId.webm
            const safeName = (candidateName || candidateFolder).replace(/[^a-zA-Z0-9]/g, '_');
            const extension = path.extname(req.file.filename);
            newFilename = `${safeName}_Q${questionId}${extension}`;
            
            // Move file to candidate folder with new name
            const oldPath = req.file.path;
            const newPath = path.join(destFolder, newFilename);
            fs.renameSync(oldPath, newPath);
            
            console.log(`✓ Video uploaded successfully`);
            console.log(`  - Candidate: ${candidateName}`);
            console.log(`  - Filename: ${newFilename}`);
            console.log(`  - Folder: ${destFolder}`);
            console.log(`  - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`  - Question ID: ${questionId || 'N/A'}`);

            res.status(200).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    filename: newFilename,
                    folder: candidateFolder,
                    size: req.file.size,
                    path: newPath,
                    questionId: questionId || null,
                    candidateName: candidateName,
                    uploadedAt: new Date().toISOString()
                }
            });
        } else {
            // Fallback to old behavior
            console.log(`✓ Video uploaded successfully`);
            console.log(`  - Filename: ${req.file.filename}`);
            console.log(`  - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`  - Question ID: ${questionId || 'N/A'}`);

            res.status(200).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    filename: req.file.filename,
                    size: req.file.size,
                    path: req.file.path,
                    questionId: questionId || null,
                    uploadedAt: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading video',
            error: error.message
        });
    }
});

// Generate personalized interview questions from resume PDF
app.post('/generate-questions', uploadPdf.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file provided'
            });
        }

        console.log(`✓ Resume PDF received`);
        console.log(`  - Size: ${(req.file.size / 1024).toFixed(2)} KB`);

        // Extract text from PDF using pdf-parse
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(req.file.buffer);
        const cvText = pdfData.text;

        console.log(`  - Extracted ${cvText.length} characters from PDF`);

        // Build the prompt - also extract candidate name
        const prompt = `CV TEXT:\n${cvText}\n\nSEED QUESTIONS:\n${JSON.stringify(SEED_QUESTIONS)}\n\n` +
            `Based on this CV/resume, do the following:
1. Extract the candidate's full name from the CV
2. Generate exactly 10 personalized interview questions that are tailored to the candidate's experience, skills, and background.

The questions should be inspired by the seed questions but customized based on specific details from the CV.
Output ONLY valid JSON in this exact format:
{
    "candidateName": "Full Name from CV",
    "questions": [
        {"id": 1, "text": "question text here"},
        {"id": 2, "text": "question text here"},
        {"id": 3, "text": "question text here"},
        {"id": 4, "text": "question text here"},
        {"id": 5, "text": "question text here"},
        {"id": 6, "text": "question text here"},
        {"id": 7, "text": "question text here"},
        {"id": 8, "text": "question text here"},
        {"id": 9, "text": "question text here"},
        {"id": 10, "text": "question text here"}
    ]
}`;

        // Call OpenRouter API
        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-nano-9b-v2:free",
            messages: [
                { role: "system", content: "You are a recruitment assistant. Output ONLY valid JSON with exactly 10 questions. No markdown, no extra text." },
                { role: "user", content: prompt }
            ]
        });

        const generatedContent = response.choices[0].message.content;
        console.log(`✓ Generated personalized questions`);
        
        // Parse and validate the response
        let parsedResponse;
        try {
            // Clean up response if it has markdown code blocks
            let cleanContent = generatedContent;
            if (cleanContent.includes('```json')) {
                cleanContent = cleanContent.split('```json')[1].split('```')[0];
            } else if (cleanContent.includes('```')) {
                cleanContent = cleanContent.split('```')[1].split('```')[0];
            }
            parsedResponse = JSON.parse(cleanContent.trim());
        } catch (parseError) {
            console.error('Failed to parse LLM response:', generatedContent);
            throw new Error('Failed to parse generated questions');
        }

        const candidateName = parsedResponse.candidateName || 'Unknown';
        const questions = parsedResponse.questions || [];
        
        // Create candidate folder
        const safeName = candidateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const candidateFolder = path.join(uploadsDir, `candidate_${safeName}`);
        if (!fs.existsSync(candidateFolder)) {
            fs.mkdirSync(candidateFolder, { recursive: true });
        }

        // Save questions to candidate folder for the Whisper pipeline
        const questionsFilePath = path.join(candidateFolder, 'questions.json');
        fs.writeFileSync(questionsFilePath, JSON.stringify({
            candidateName: candidateName,
            generatedAt: new Date().toISOString(),
            questions: questions
        }, null, 2));

        console.log(`  - Candidate: ${candidateName}`);
        console.log(`  - Questions generated: ${questions.length}`);
        console.log(`  - Folder created: ${candidateFolder}`);
        console.log(`  - Questions saved to: ${questionsFilePath}`);

        res.status(200).json({
            success: true,
            message: 'Questions generated successfully',
            data: {
                candidateName: candidateName,
                candidateFolder: `candidate_${safeName}`,
                questions: questions
            }
        });

    } catch (error) {
        console.error('Question generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating questions',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 500MB.'
            });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║       Video Interview Platform - Backend Server              ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on:    http://localhost:${PORT}                  ║
║  Upload endpoint:      POST /upload                          ║
║  Generate questions:   POST /generate-questions              ║
║  Health check:         GET /health                           ║
║  Uploads folder:       ./uploads                             ║
╚══════════════════════════════════════════════════════════════╝
    `);
});
