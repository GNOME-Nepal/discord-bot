const axios = require('axios');
const {GITHUB_TOKEN} = require('./config-global');

const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Discord-Bot',
    },
});

const memeApi = axios.create({
    baseURL: 'https://meme-api.com'
});

async function fetchTopContributors() {
    try {
        const response = await githubAPI.get('/repos/GNOME-Nepal/discord-bot/contributors');
        const contributors = response.data;
        const topContributors = contributors.slice(0, 3);
        const totalContributors = contributors.length;

        return {
            topContributors,
            totalContributors
        };
    } catch (error) {
        console.error('Error fetching contributors:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function fetchRandomMeme() {
    try {
        const response = await memeApi.get('/gimme');
        return response.data;
    } catch (error) {
        console.error('Error fetching meme:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function fetchGnomeNepalData() {
    try {
        // Get organization data
        const orgResponse = await githubAPI.get('/orgs/GNOME-Nepal');
        const org = orgResponse.data;

        // Get repositories
        const reposResponse = await githubAPI.get('/orgs/GNOME-Nepal/repos');
        const repos = reposResponse.data;

        // Get contributors (from all repos)
        const contributorsSet = new Set();
        for (const repo of repos) {
            try {
                const contributorsResponse = await githubAPI.get(`/repos/GNOME-Nepal/${repo.name}/contributors`);
                contributorsResponse.data.forEach(contributor => {
                    contributorsSet.add(contributor.id);
                });
            } catch (error) {
                console.log(`Could not fetch contributors for ${repo.name}`);
            }
        }

        return {
            org,
            repos,
            contributors: Array.from(contributorsSet).map(id => ({id}))
        };
    } catch (error) {
        console.error('Error in fetchGnomeNepalData:', error.message);
        throw error;
    }
}

module.exports = {
    githubAPI,
    fetchTopContributors,
    fetchRandomMeme,
    memeApi,
    fetchGnomeNepalData
};
