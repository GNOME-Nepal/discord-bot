const axios = require('axios');
const { GITHUB_TOKEN, MEME_API_URL, MEME_API_KEY } = require('./config-global');

const createApiInstance = (baseURL, headers) => axios.create({ baseURL, headers });

const githubApi = createApiInstance('https://api.github.com', {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'Discord-Bot'
});

const memeApi = createApiInstance(MEME_API_URL, {
    'x-api-key': MEME_API_KEY
});

const endpoints = {
    GITHUB_ORG: (org) => `/orgs/${org}`,
    GITHUB_REPO_CONTRIBUTORS: (owner, repo) => `/repos/${owner}/${repo}/contributors`,
    RANDOM_MEME: '/retrieve-random-meme'
};

module.exports = {
    githubApi,
    memeApi,
    endpoints
};