const fs = require('fs');
const path = require('path');
const config = require('../config');

function getSessionEvaluationPath(sessionId) {
    return path.join(config.evaluationsDir, `session_${sessionId}.json`);
}

function loadSessionEvaluation(sessionId) {
    const filePath = getSessionEvaluationPath(sessionId);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (err) {
            console.error('[SessionEvaluationStore] Failed to parse JSON, recreating:', err.message);
        }
    }
    return {
        session_id: sessionId,
        updated_at: new Date().toISOString(),
        videos: {},
        summary: {
            total_videos: 0,
            average_score: 0,
            scores: []
        }
    };
}

function saveSessionEvaluation(sessionId, data) {
    const filePath = getSessionEvaluationPath(sessionId);
    data.updated_at = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
}

function recomputeSummary(data) {
    const scores = [];
    for (const key of Object.keys(data.videos || {})) {
        const score = Number(data.videos[key]?.score);
        if (!Number.isNaN(score)) scores.push(score);
    }
    const total = scores.length;
    const avg = total > 0 ? Number((scores.reduce((a, b) => a + b, 0) / total).toFixed(2)) : 0;
    data.summary = {
        total_videos: total,
        average_score: avg,
        scores
    };
}

function upsertSessionEvaluation({
    sessionId,
    sessionVideoId,
    questionId,
    questionText,
    transcriptText,
    answerText,
    expectedExpression,
    evaluationJson,
    score,
    filename,
    filePath,
    qaJson,
    emotionData = null
}) {
    if (!sessionId || !sessionVideoId) return null;

    const data = loadSessionEvaluation(sessionId);

    data.videos = data.videos || {};
    data.videos[sessionVideoId] = {
        session_video_id: sessionVideoId,
        question_id: questionId ?? null,
        question_text: questionText || null,
        filename: filename || null,
        file_path: filePath || null,
        qa_json: qaJson || null,
        transcript_text: transcriptText || null,
        answer_text: answerText || null,
        expected_expression: expectedExpression || null,
        evaluation: evaluationJson || null,
        score: score ?? null,
        emotion_analysis: emotionData ? {
            emotions_timeline: emotionData.emotions_timeline,
            summary: emotionData.summary
        } : null,
        evaluated_at: new Date().toISOString()
    };

    recomputeSummary(data);
    return saveSessionEvaluation(sessionId, data);
}

module.exports = {
    upsertSessionEvaluation,
    getSessionEvaluationPath
};
