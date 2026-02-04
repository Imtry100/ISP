const multer = require('multer');
const path = require('path');
const config = require('../config');

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadsDir),
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
        const extension = file.mimetype.includes('webm') ? '.webm' : '.mp4';
        cb(null, `interview-${uniqueSuffix}${extension}`);
    }
});

const pdfStorage = multer.memoryStorage();

const videoFileFilter = (req, file, cb) => {
    const allowedMimes = ['video/webm', 'video/mp4', 'video/x-matroska'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only WebM and MP4 videos are allowed.'), false);
    }
};

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
    limits: { fileSize: 500 * 1024 * 1024 }
});

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { uploadVideo, uploadPdf };
