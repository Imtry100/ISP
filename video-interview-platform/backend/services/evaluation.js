const openai = require('./openai');

/**
 * Evaluate a candidate's answer using the interview question and transcript.
 * Returns structured JSON including completeness and relevance.
 * @param {string} questionText
 * @param {string} transcriptText
 * @param {object|null} qaJson
 * @returns {Promise<{ answer_text: string, evaluation: object, score: number, expected_expression: string, expected_emotions: object }>} 
 */
async function evaluateAnswer(questionText, transcriptText, qaJson = null) {
    const systemPrompt = `You are an interview evaluator. Output ONLY valid JSON with no markdown or extra text.`;
    const qaBlock = qaJson ? `\n\nHere is the QA JSON from transcription:\n${JSON.stringify(qaJson)}` : '';
    const userPrompt = `Interview question: "${questionText}"

Candidate's spoken answer (transcript): "${transcriptText}"${qaBlock}

Provide:
1. expected_expression: What a strong answer to this question would typically include (key points, themes, or ideal expression in 2-4 sentences).
2. answer_text: A clear, concise summary of the candidate's answer in 1-3 sentences.
3. evaluation: An object with these keys: completeness, relevance, clarity, structure, examples, overall (each 1-3 sentences).
4. expected_emotions: {"should_show": [..], "red_flags": [..]} (empty arrays allowed).
5. score: A number from 1 to 10 (integer) for how well they answered.

Output ONLY this JSON (no code block, no explanation):
{"expected_expression":"...","answer_text":"...","evaluation":{"completeness":"...","relevance":"...","clarity":"...","structure":"...","examples":"...","overall":"..."},"expected_emotions":{"should_show":["confidence"],"red_flags":[]},"score":7}`;

    console.log('[Evaluation] Calling LLM...');
    const response = await openai.chat.completions.create({
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });

    const raw = response.choices[0].message.content;
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const expected_expression = typeof parsed.expected_expression === 'string' ? parsed.expected_expression : String(parsed.expected_expression || '');
    const answer_text = typeof parsed.answer_text === 'string' ? parsed.answer_text : String(parsed.answer_text || '');
    const evaluation = (parsed && typeof parsed.evaluation === 'object' && parsed.evaluation !== null)
        ? parsed.evaluation
        : { overall: String(parsed.evaluation || '') };
    const expected_emotions = (parsed && typeof parsed.expected_emotions === 'object' && parsed.expected_emotions !== null)
        ? parsed.expected_emotions
        : { should_show: [], red_flags: [] };
    let score = Number(parsed.score);
    if (Number.isNaN(score) || score < 1) score = 1;
    if (score > 10) score = 10;

    console.log('[Evaluation] Done — score:', score);
    return {
        answer_text,
        evaluation,
        score,
        expected_expression,
        expected_emotions,
        evaluation_json: { expected_expression, answer_text, evaluation, expected_emotions, score }
    };
}

module.exports = { evaluateAnswer };
