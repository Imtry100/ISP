const OpenAI = require('openai');
const config = require('../config');

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openRouterApiKey
});

console.log('OpenRouter API Key loaded:', config.openRouterApiKey ? 'Yes' : 'No');

module.exports = openai;
