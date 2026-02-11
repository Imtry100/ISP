const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/signup', async (req, res) => {
    try {
        const { email, password, role = 'user' } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be admin or user'
            });
        }
        if (!db.pool) {
            return res.status(503).json({
                success: false,
                message: 'Database not configured'
            });
        }
        const existing = await db.getUserByEmail(email);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await db.createUser(email, passwordHash, role);
        if (!user) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: '7d' }
        );
        res.status(201).json({
            success: true,
            data: {
                token,
                user: { id: user.id, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during signup',
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        if (!db.pool) {
            return res.status(503).json({
                success: false,
                message: 'Database not configured'
            });
        }
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            data: {
                token,
                user: { id: user.id, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

module.exports = router;
