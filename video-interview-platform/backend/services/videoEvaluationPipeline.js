const db = require('../db');
const transcription = require('./transcription');
const evaluation = require('./evaluation');
const { upsertSessionEvaluation } = require('./sessionEvaluationStore');

/**
 * Runs after each video upload: transcribe -> LLM evaluation -> save to DB.
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

        console.log(`[Pipeline] Transcribing...`);
        const { text: transcriptText } = await transcription.transcribe(filePath);
        if (!transcriptText || !transcriptText.trim()) {
            await db.setVideoEvaluationStatus(sessionVideoId, 'failed');
            console.error(`[Pipeline] Empty transcript for video ${sessionVideoId}`);
            return;
        }
        console.log(`[Pipeline] Transcript done (${transcriptText.length} chars)`);

        const qaJson = {
            question: questionText || '',
            answer: transcriptText || ''
        };

        console.log(`[Pipeline] Running LLM evaluation...`);
        const { answer_text, score, expected_expression, expected_emotions, evaluation_json } = await evaluation.evaluateAnswer(
            questionText || '',
            transcriptText,
            qaJson
        );
        console.log(`[Pipeline] Evaluation done — score: ${score}/10`);

        await db.updateSessionVideoEvaluation(
            sessionVideoId,
            transcriptText,
            answer_text,
            expected_expression,
            evaluation_json,
            score
        );
        console.log(`[Pipeline] Saved to DB — video ${sessionVideoId} completed (score: ${score})`);

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
                score,
                filename: resolvedFilename,
                filePath,
                qaJson
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
