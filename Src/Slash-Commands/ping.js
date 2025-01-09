const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const os = require('os');
const axios = require('axios');
const packageJson = require('../../package.json');

const { GITHUB_TOKEN } = require('../../config.json'); // Load GitHub token

// GitHub API Configuration
const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Discord-Bot',
    },
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with bot\'s latency information and contributor count.'),
    async execute(interaction) {
        await interaction.deferReply(); // Defer the response for better user experience

        const startTime = Date.now();
        const message = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const endTime = Date.now();

        const shardLatency = interaction.client.ws.shards.reduce((acc, shard) => acc + shard.ping, 0) / interaction.client.ws.shards.size;
        const nodeLatency = endTime - startTime;
        const apiLatency = Math.round(interaction.client.ws.ping);
        const uptime = process.uptime();
        const serverCount = interaction.client.guilds.cache.size;
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);
        const cpuUsage = (process.cpuUsage().user / 1024 / 1024).toFixed(2);
        const systemUptime = Math.floor(os.uptime() / 60);
        const discordJsVersion = packageJson.dependencies['discord.js'];

        try {
            // Fetch the contributors.json file from the contributors repository
            const url = 'https://raw.githubusercontent.com/GNOME-Nepal/contributors/main/contributors.json';
            const response = await axios.get(url);
            const contributors = response.data;

            // Fetch contributor count for the specific repo
            const repoContributorsResponse = await githubAPI.get('/repos/GNOME-Nepal/discord-bot/contributors');
            const repoContributors = repoContributorsResponse.data;
            const repoContributorCount = repoContributors.length;

            // Create the embed message
            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('Bot Latency Information and Contributors')
                .addFields(
                    { name: 'Shard Latency', value: `${shardLatency}ms`, inline: true },
                    { name: 'Node Latency', value: `${nodeLatency}ms`, inline: true },
                    { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
                    { name: 'Uptime', value: `${Math.floor(uptime)} seconds`, inline: true },
                    { name: 'Server Count', value: `${serverCount}`, inline: true },
                    { name: 'Memory Usage', value: `${memoryUsage} MB`, inline: true },
                    { name: 'Total Memory', value: `${totalMemory} MB`, inline: true },
                    { name: 'CPU Usage', value: `${cpuUsage}%`, inline: true },
                    { name: 'System Uptime', value: `${systemUptime} minutes`, inline: true },
                    { name: 'Bot Version', value: packageJson.version, inline: true },
                    { name: 'Discord.js Version', value: discordJsVersion, inline: true },
                    { name: 'Contributor Count (Discord Bot Repo)', value: `${repoContributorCount}`, inline: true }
                )
                .setFooter({ text: 'Data fetched from bot system and GitHub API' });

            // Add contributors information
            embed.addFields(
                { name: 'Top Contributors', value: contributors.map(contributor => `**${contributor.login}**: ${contributor.contributions} contributions`).join('\n'), inline: false }
            );

            await interaction.editReply({ content: ' ', embeds: [embed] });
        } catch (error) {
            console.error('Error fetching contributors:', error.response ? error.response.data : error.message);
            await interaction.editReply(
                'There was an error fetching the contributors list. Please check if the repository is public or the GitHub token is valid.'
            );
        }
    }
};
