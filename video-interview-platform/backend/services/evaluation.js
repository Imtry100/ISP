const openai = require('./openai');

/**
 * Evaluate a candidate's answer using the interview question and transcript.
 * Returns structured JSON: answer_text, evaluation, score (1-10), expected_expression.
 * @param {string} questionText
 * @param {string} transcriptText
 * @returns {Promise<{ answer_text: string, evaluation: string, score: number, expected_expression: string }>}
 */
async function evaluateAnswer(questionText, transcriptText) {
    const systemPrompt = `You are an interview evaluator. Output ONLY valid JSON with no markdown or extra text.`;
    const userPrompt = `Interview question: "${questionText}"

Candidate's spoken answer (transcript): "${transcriptText}"

Provide:
1. expected_expression: What a strong answer to this question would typically include (key points, themes, or ideal expression in 2-4 sentences). This is what we expect from a good candidate.
2. answer_text: A clear, concise summary of the candidate's answer in 1-3 sentences.
3. evaluation: Brief evaluation (2-4 sentences) covering relevance, clarity, and strength of the answer compared to the expected expression.
4. score: A number from 1 to 10 (integer) for how well they answered.

Output ONLY this JSON (no code block, no explanation):
{"expected_expression":"...","answer_text":"...","evaluation":"...","score":7}`;

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
    const evaluation = typeof parsed.evaluation === 'string' ? parsed.evaluation : String(parsed.evaluation || '');
    let score = Number(parsed.score);
    if (Number.isNaN(score) || score < 1) score = 1;
    if (score > 10) score = 10;

    console.log('[Evaluation] Done — score:', score);
    return {
        answer_text,
        evaluation,
        score,
        expected_expression,
        evaluation_json: { expected_expression, answer_text, evaluation, score }
    };
}

module.exports = { evaluateAnswer };
