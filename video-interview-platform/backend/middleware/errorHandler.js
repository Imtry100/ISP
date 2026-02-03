const multer = require('multer');

function errorHandler(error, req, res, next) {
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
}

module.exports = errorHandler;
