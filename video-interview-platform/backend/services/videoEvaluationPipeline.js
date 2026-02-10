const db = require('../db');
const transcription = require('./transcription');
const evaluation = require('./evaluation');
const { analyzeEmotions } = require('./emotionAnalysis');
const { upsertSessionEvaluation } = require('./sessionEvaluationStore');

/**
 * Runs after each video upload: transcribe -> LLM evaluation -> emotion evaluation -> combined scoring -> save to DB.
 * Fires asynchronously; does not block the upload response.
 * @param {string} sessionVideoId - UUID of the session_videos row
 * @param {string} filePath - Absolute path to the uploaded video file
 * @param {string} questionText - The interview question text
 * @param {string|null} sessionId - UUID of the interview_sessions row
 * @param {number|null} questionId - Question ID from frontend
 * @param {string|null} filename - Stored filename in uploads
 */
async function runPipeline(sessionVideoId, filePath, questionText, sessionId = null, questionId = null, filename = null) {
    if (!sessionVideoId || !db.pool) return;

    console.log(`[Pipeline] Starting evaluation for video ${sessionVideoId}`);

    try {
        const claimed = await db.claimVideoForProcessing(sessionVideoId);
        if (!claimed) {
            console.log(`[Pipeline] Skipping ${sessionVideoId} (already processing or completed)`);
            return;
        }
        console.log(`[Pipeline] Status set to processing`);

        // Run transcription and emotion analysis in parallel
        console.log(`[Pipeline] Transcribing + Analyzing emotions...`);
        const [transcriptResult, emotionResult] = await Promise.allSettled([
            transcription.transcribe(filePath),
            analyzeEmotions(filePath)
        ]);

        const { text: transcriptText } = transcriptResult.status === 'fulfilled' ? transcriptResult.value : { text: '' };
        if (transcriptResult.status === 'rejected') {
            console.error(`[Pipeline] Transcription failed:`, transcriptResult.reason?.message);
        }
        if (!transcriptText || !transcriptText.trim()) {
            await db.setVideoEvaluationStatus(sessionVideoId, 'failed');
            console.error(`[Pipeline] Empty transcript for video ${sessionVideoId}`);
            return;
        }
        console.log(`[Pipeline] Transcript done (${transcriptText.length} chars)`);

        let emotionData = null;
        if (emotionResult.status === 'fulfilled' && emotionResult.value) {
            emotionData = emotionResult.value;
            console.log(`[Pipeline] Emotion analysis done — longest emotion: ${emotionData.summary?.longest_emotion?.emotion} (${emotionData.summary?.longest_emotion?.duration_sec}s)`);
        } else if (emotionResult.status === 'rejected') {
            console.error(`[Pipeline] Emotion analysis failed:`, emotionResult.reason?.message);
        }

        const qaJson = {
            question: questionText || '',
            answer: transcriptText || ''
        };

        console.log(`[Pipeline] Running LLM evaluation...`);
        const { answer_text, score: answerScore, expected_expression, expected_emotions, evaluation_json } = await evaluation.evaluateAnswer(
            questionText || '',
            transcriptText,
            qaJson
        );
        console.log(`[Pipeline] Answer evaluation done — answer score: ${answerScore}/10`);

        // Evaluate emotions if data is available
        let emotionScore = 5; // Default neutral score
        let emotionEvaluation = null;
        if (emotionData) {
            console.log(`[Pipeline] Running emotion evaluation...`);
            const emotionResult = await evaluation.evaluateEmotions(
                emotionData,
                expected_emotions,
                questionText || ''
            );
            emotionScore = emotionResult.emotion_score;
            emotionEvaluation = emotionResult.emotion_evaluation;
            console.log(`[Pipeline] Emotion evaluation done — emotion score: ${emotionScore}/10`);
        }

        // Compute overall score (70% answer, 30% emotions)
        const { overall_score, breakdown } = evaluation.computeOverallScore(answerScore, emotionScore);
        console.log(`[Pipeline] Overall score: ${overall_score}/10 (answer: ${answerScore}, emotion: ${emotionScore})`);

        // Use overall score for DB storage
        const score = overall_score;

        await db.updateSessionVideoEvaluation(
            sessionVideoId,
            transcriptText,
            answer_text,
            expected_expression,
            evaluation_json,
            score
        );
        console.log(`[Pipeline] Saved to DB — video ${sessionVideoId} completed (overall score: ${score})`);

        let resolvedSessionId = sessionId;
        let resolvedQuestionId = questionId;
        let resolvedQuestionText = questionText;
        let resolvedFilename = filename;
        if (!resolvedSessionId || resolvedQuestionId == null || !resolvedFilename) {
            const row = await db.getSessionVideoById(sessionVideoId);
            if (row) {
                resolvedSessionId = resolvedSessionId || row.session_id;
                resolvedQuestionId = resolvedQuestionId ?? row.question_id;
                resolvedQuestionText = resolvedQuestionText || row.question_text || '';
                resolvedFilename = resolvedFilename || row.filename;
            }
        }

        if (resolvedSessionId) {
            const sessionFilePath = upsertSessionEvaluation({
                sessionId: resolvedSessionId,
                sessionVideoId,
                questionId: resolvedQuestionId,
                questionText: resolvedQuestionText,
                transcriptText,
                answerText: answer_text,
                expectedExpression: expected_expression,
                evaluationJson: evaluation_json,
                answerScore,
                emotionScore,
                emotionEvaluation,
                overallScore: overall_score,
                scoreBreakdown: breakdown,
                filename: resolvedFilename,
                filePath,
                qaJson,
                emotionData
            });
            if (sessionFilePath) {
                console.log(`[Pipeline] Updated session JSON: ${sessionFilePath}`);
            }
        }
    } catch (err) {
        console.error(`[Pipeline] Error for ${sessionVideoId}:`, err.message);
        try {
            await db.setVideoEvaluationStatus(sessionVideoId, 'failed');
            console.log(`[Pipeline] Status set to failed`);
        } catch (e) {
            console.error('[Pipeline] Failed to set status:', e.message);
        }
    }
}

/**
 * Trigger the pipeline without awaiting (fire-and-forget).
 */
function triggerPipeline(sessionVideoId, filePath, questionText, sessionId = null, questionId = null, filename = null) {
    console.log(`[Pipeline] Queued for video ${sessionVideoId}`);
    setImmediate(() => {
        runPipeline(sessionVideoId, filePath, questionText, sessionId, questionId, filename).catch((e) =>
            console.error('[Pipeline] Unhandled:', e)
        );
    });
}

module.exports = { runPipeline, triggerPipeline };
