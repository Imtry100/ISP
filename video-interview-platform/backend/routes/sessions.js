const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        if (!db.pool) {
            return res.status(503).json({
                success: false,
                message: 'Database not configured (DATABASE_URL not set)'
            });
        }
        const { candidate_name: candidateName } = req.body || {};
        const sessionId = await db.createSession(candidateName);
        if (!sessionId) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create session'
            });
        }
        res.status(201).json({
            success: true,
            data: { session_id: sessionId }
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating session',
            error: error.message
        });
    }
});

module.exports = router;
