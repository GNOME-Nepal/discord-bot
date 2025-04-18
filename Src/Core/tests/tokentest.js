const axios = require('axios');
const config = require('../../../utils/config-global');
const Table = require('cli-table3');

const results = [];

const checkToken = async (url, token, tokenType, serviceName) => {
    try {
        const response = await axios.get(url, {
            headers: {'Authorization': `${tokenType} ${token}`}
        });
        results.push({
            name: serviceName,
            type: tokenType || 'API Key',
            status: '✓',
            message: 'Valid token'
        });
    } catch (error) {
        const errorMessage = error.response ?
            error.response.data.message || JSON.stringify(error.response.data).substring(0, 45) :
            error.message;
        results.push({
            name: serviceName,
            type: tokenType || 'API Key',
            status: '✗',
            message: `Error: ${errorMessage}`
        });
    }
};

const checkReportWebhookUrl = async () => {
    try {
        const response = await axios.post(config.REPORT_WEBHOOK_URL, {
            content: 'Test message to verify the tokens in the code'
        });
        results.push({
            name: 'Discord Webhook',
            type: 'Webhook URL',
            status: '✓',
            message: 'Valid webhook URL'
        });
    } catch (error) {
        const errorMessage = error.response ?
            error.response.data.message || JSON.stringify(error.response.data).substring(0, 45) :
            error.message;
        results.push({
            name: 'Discord Webhook',
            type: 'Webhook URL',
            status: '✗',
            message: `Error: ${errorMessage}`
        });
    }
};

const displayResults = () => {
    const resultsTable = new Table({
        head: ['Service', 'Type', 'Status', 'Message'],
        colWidths: [20, 15, 10, 50]
    });

    results.forEach(result => {
        resultsTable.push([
            result.name,
            result.type,
            result.status,
            result.message
        ]);
    });

    console.log('\n=== GNOME Nepal Bot Token Validation Results ===');
    console.log(resultsTable.toString());

    const valid = results.filter(r => r.status === '✓').length;
    const invalid = results.filter(r => r.status === '✗').length;
    console.log(`Token validation complete: ${valid} valid, ${invalid} invalid tokens | LGTM 🚀`);
}

const runTests = async () => {
    await checkToken('https://api.github.com/user', config.GITHUB_TOKEN, 'Bearer', 'GitHub API');
    await checkToken('https://discord.com/api/v10/users/@me', config.TOKEN, 'Bot', 'Discord Bot');
    await checkReportWebhookUrl();

    displayResults();
};

runTests();
