const OpenAI = require('openai');
const config = require('../config');

const apiKey = config.openRouterApiKey || 'sk-placeholder';

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey
});

if (!config.openRouterApiKey) {
    console.warn('⚠️  OPENROUTER_API_KEY not set — LLM calls will fail');
} else {
    console.log('OpenRouter API Key loaded: Yes');
}

module.exports = openai;
