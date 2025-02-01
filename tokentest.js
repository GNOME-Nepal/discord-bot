const axios = require('axios');
const config = require('./config-global');

const checkToken = async (url, token, tokenType) => {
    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `${tokenType} ${token}` }
        });
        console.log(`${tokenType} token is valid:`, response.data);
    } catch (error) {
        console.error(`${tokenType} token is invalid:`, error.response ? error.response.data : error.message);
    }
};

const checkReportWebhookUrl = async () => {
    try {
        const response = await axios.post(config.REPORT_WEBHOOK_URL, {
            content: 'Test message to verify the tokens in the code'
        });
        console.log('Report webhook URL is valid:', response.data);
    } catch (error) {
        console.error('Report webhook URL is invalid:', error.response ? error.response.data : error.message);
    }
};

const runTests = async () => {
    await checkToken('https://api.github.com/user', config.GITHUB_TOKEN, 'Bearer');
    await checkToken('https://discord.com/api/v10/users/@me', config.TOKEN, 'Bot');
    await checkToken(config.MEME_API_URL, config.MEME_API_KEY, 'Bearer');
    await checkReportWebhookUrl();
};

runTests();