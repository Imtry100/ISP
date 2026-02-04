const db = require('../db');
const transcription = require('./transcription');
const evaluation = require('./evaluation');

/**
 * Runs after each video upload: transcribe -> LLM evaluation -> save to DB.
 * Fires asynchronously; does not block the upload response.
 * @param {string} sessionVideoId - UUID of the session_videos row
 * @param {string} filePath - Absolute path to the uploaded video file
 * @param {string} questionText - The interview question text
 */
async function runPipeline(sessionVideoId, filePath, questionText) {
    if (!sessionVideoId || !db.pool) return;

    console.log(`[Pipeline] Starting evaluation for video ${sessionVideoId}`);

    try {
        await db.setVideoEvaluationStatus(sessionVideoId, 'processing');
        console.log(`[Pipeline] Status set to processing`);

        console.log(`[Pipeline] Transcribing...`);
        const { text: transcriptText } = await transcription.transcribe(filePath);
        if (!transcriptText || !transcriptText.trim()) {
            await db.setVideoEvaluationStatus(sessionVideoId, 'failed');
            console.error(`[Pipeline] Empty transcript for video ${sessionVideoId}`);
            return;
        }
        console.log(`[Pipeline] Transcript done (${transcriptText.length} chars)`);

        console.log(`[Pipeline] Running LLM evaluation...`);
        const { answer_text, evaluation: evaluationText, score, expected_expression, evaluation_json } = await evaluation.evaluateAnswer(questionText || '', transcriptText);
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
function triggerPipeline(sessionVideoId, filePath, questionText) {
    console.log(`[Pipeline] Queued for video ${sessionVideoId}`);
    setImmediate(() => {
        runPipeline(sessionVideoId, filePath, questionText).catch((e) =>
            console.error('[Pipeline] Unhandled:', e)
        );
    });
}

module.exports = { runPipeline, triggerPipeline };
