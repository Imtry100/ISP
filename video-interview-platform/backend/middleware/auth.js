const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

/** Like requireAuth but also accepts token from query (e.g. ?token=...) for video src requests */
function requireAuthOrQueryToken(req, res, next) {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token && req.query && req.query.token) token = req.query.token;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = { requireAuth, requireAuthOrQueryToken, requireRole };
