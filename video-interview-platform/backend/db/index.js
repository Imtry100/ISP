const { Pool } = require('pg');
const config = require('../config');

let pool = null;
if (config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl });
    pool.on('error', (err) => console.error('Postgres pool error:', err));
    console.log('PostgreSQL: connected (DATABASE_URL from env)');
} else {
    console.log('PostgreSQL: DATABASE_URL not set, uploads will not be saved to DB');
}

async function getOrCreateGuestUserId() {
    if (!pool) return null;
    const guestEmail = 'guest@video-interview.local';
    let row = (await pool.query('SELECT id FROM users WHERE email = $1', [guestEmail])).rows[0];
    if (row) return row.id;
    const insert = await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, \'user\') RETURNING id',
        [guestEmail, '']
    );
    return insert.rows[0].id;
}

async function createSession(candidateName = null) {
    if (!pool) return null;
    const userId = await getOrCreateGuestUserId();
    if (!userId) return null;
    const result = await pool.query(
        'INSERT INTO interview_sessions (user_id, candidate_name) VALUES ($1, $2) RETURNING id',
        [userId, candidateName || null]
    );
    return result.rows[0].id;
}

async function insertSessionVideo(sessionId, questionId, questionText, filename, filePath, fileSizeBytes) {
    if (!pool) return null;
    const result = await pool.query(
        `INSERT INTO session_videos (session_id, question_id, question_text, filename, file_path, file_size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [sessionId, questionId ?? 0, questionText || null, filename, filePath, fileSizeBytes ?? null]
    );
    return result.rows[0].id;
}

module.exports = {
    get pool() { return pool; },
    getOrCreateGuestUserId,
    createSession,
    insertSessionVideo
};
