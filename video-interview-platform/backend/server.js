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

// Upload video endpoint
app.post('/upload', uploadVideo.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file provided'
            });
        }

        const { questionId, questionText } = req.body;

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

        // Build the prompt
        const prompt = `CV TEXT:\n${cvText}\n\nSEED QUESTIONS:\n${JSON.stringify(SEED_QUESTIONS)}\n\n` +
            `Based on this CV/resume, generate 10 personalized interview questions that are tailored to the candidate's experience, skills, and background. ` +
            `The questions should be inspired by the seed questions but customized based on specific details from the CV. ` +
            `Output ONLY valid JSON in this exact format: {"questions": [{"id": 1, "text": "question text here"}, {"id": 2, "text": "question text here"}, ...]}`;

        // Call OpenRouter API
        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-nano-9b-v2:free",
            messages: [
                { role: "system", content: "You are a recruitment assistant. Output ONLY valid JSON with no additional text or markdown." },
                { role: "user", content: prompt }
            ]
        });

        const generatedContent = response.choices[0].message.content;
        console.log(`✓ Generated personalized questions`);
        
        // Parse and validate the response
        let questions;
        try {
            questions = JSON.parse(generatedContent);
        } catch (parseError) {
            console.error('Failed to parse LLM response:', generatedContent);
            throw new Error('Failed to parse generated questions');
        }

        res.status(200).json({
            success: true,
            message: 'Questions generated successfully',
            data: questions
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
