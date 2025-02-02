const axios = require('axios');
                        const { GITHUB_TOKEN, MEME_API_URL, MEME_API_KEY } = require('./config-global');

                        const githubAPI = axios.create({
                            baseURL: 'https://api.github.com',
                            headers: {
                                Authorization: `Bearer ${GITHUB_TOKEN}`,
                                'User-Agent': 'Discord-Bot',
                            },
                        });

                        const memeApi = axios.create({
                            baseURL: MEME_API_URL,
                            headers: {
                                'Authorization': `Bearer ${MEME_API_KEY}`,
                                'User-Agent': 'Discord-Bot',
                            },
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
                                const response = await memeApi.get('/random');
                                return response.data;
                            } catch (error) {
                                console.error('Error fetching meme:', error.response ? error.response.data : error.message);
                                throw error;
                            }
                        }

                        module.exports = {
                            githubAPI,
                            fetchTopContributors,
                            fetchRandomMeme,
                            memeApi,
                        }