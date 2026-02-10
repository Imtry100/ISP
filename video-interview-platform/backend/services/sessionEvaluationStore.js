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
    const answerScores = [];
    const emotionScores = [];
    const overallScores = [];
    for (const key of Object.keys(data.videos || {})) {
        const video = data.videos[key];
        const overall = Number(video?.overall_score ?? video?.score);
        const answer = Number(video?.answer_score);
        const emotion = Number(video?.emotion_score);
        if (!Number.isNaN(overall)) overallScores.push(overall);
        if (!Number.isNaN(answer)) answerScores.push(answer);
        if (!Number.isNaN(emotion)) emotionScores.push(emotion);
    }
    const total = overallScores.length;
    const avgOverall = total > 0 ? Number((overallScores.reduce((a, b) => a + b, 0) / total).toFixed(2)) : 0;
    const avgAnswer = answerScores.length > 0 ? Number((answerScores.reduce((a, b) => a + b, 0) / answerScores.length).toFixed(2)) : 0;
    const avgEmotion = emotionScores.length > 0 ? Number((emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length).toFixed(2)) : 0;
    
    data.summary = {
        total_videos: total,
        average_overall_score: avgOverall,
        average_answer_score: avgAnswer,
        average_emotion_score: avgEmotion,
        overall_scores: overallScores,
        // Keep legacy field for backwards compatibility
        average_score: avgOverall,
        scores: overallScores
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
    answerScore,
    emotionScore,
    emotionEvaluation,
    overallScore,
    scoreBreakdown,
    filename,
    filePath,
    qaJson,
    emotionData = null,
    // Legacy support
    score = null
}) {
    if (!sessionId || !sessionVideoId) return null;

    const data = loadSessionEvaluation(sessionId);

    // Use overall score if provided, otherwise fall back to legacy score
    const finalOverallScore = overallScore ?? score;
    const finalAnswerScore = answerScore ?? score;
    const finalEmotionScore = emotionScore ?? 5;

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
        // New scoring structure
        answer_score: finalAnswerScore,
        emotion_score: finalEmotionScore,
        overall_score: finalOverallScore,
        score_breakdown: scoreBreakdown || {
            answer_score: finalAnswerScore,
            answer_weight: 0.7,
            emotion_score: finalEmotionScore,
            emotion_weight: 0.3,
            weighted_answer: Math.round(finalAnswerScore * 0.7 * 10) / 10,
            weighted_emotion: Math.round(finalEmotionScore * 0.3 * 10) / 10
        },
        emotion_evaluation: emotionEvaluation || null,
        // Legacy field for backwards compatibility
        score: finalOverallScore,
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
