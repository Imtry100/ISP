const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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

module.exports = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || null,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    uploadsDir,
    SEED_QUESTIONS,
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type']
    }
};
