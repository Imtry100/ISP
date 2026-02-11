const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

async function serveVideo(req, res) {
    try {
        const sessionVideo = await db.getSessionVideoById(req.params.id);
        if (!sessionVideo || !sessionVideo.file_path) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }
        const absolutePath = path.join(__dirname, '..', sessionVideo.file_path);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ success: false, message: 'Video file not found' });
        }
        res.setHeader('Content-Type', 'video/webm');
        res.sendFile(absolutePath);
    } catch (error) {
        console.error('Admin video serve error:', error);
        res.status(500).json({ success: false, message: 'Error serving video', error: error.message });
    }
}

router.get('/sessions', async (req, res) => {
    try {
        if (!db.pool) {
            return res.status(503).json({
                success: false,
                message: 'Database not configured'
            });
        }
        const sessions = await db.getAllSessionsWithVideos();
        res.json({
            success: true,
            data: { sessions }
        });
    } catch (error) {
        console.error('Admin sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sessions',
            error: error.message
        });
    }
});

module.exports = router;
module.exports.serveVideo = serveVideo;
