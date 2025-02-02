const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { fetchTopContributors } = require('../../api.js');
const { EMBED_COLORS, calculateLatencies } = require('../../constants.js'); // Corrected import
const packageJson = require('../../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with bot\'s latency information.'),
    async execute(interaction) {
        if (interaction.replied || interaction.deferred) return console.error('Interaction already replied or deferred.');

        await interaction.deferReply();

        const latencies = calculateLatencies(interaction);

        try {
            const { topContributors, totalContributors } = await fetchTopContributors();
            const topContributorsList = topContributors.map(contributor => contributor.login).join(', ');

            const fields = [
                { name: '🖥️ Shard Latency', value: `${latencies.shardLatency}ms` },
                { name: '⚙️ Node Latency', value: `${latencies.nodeLatency}ms` },
                { name: '🌐 API Latency', value: `${latencies.apiLatency}ms` },
                { name: '⏱️ Uptime', value: `${latencies.uptime} seconds` },
                { name: '🌍 Server Count', value: `${latencies.serverCount}` },
                { name: '💾 Memory Usage', value: `${latencies.memoryUsage} MB` },
                { name: '🗄️ Total Memory', value: `${latencies.totalMemory} MB` },
                { name: '🧠 CPU Usage', value: `${latencies.cpuUsage}%` },
                { name: '🕒 System Uptime', value: `${latencies.systemUptime} minutes` },
                { name: '🤖 Bot Version', value: packageJson.version },
                { name: '📦 Discord.js Version', value: latencies.discordJsVersion },
                { name: '👥 Contributor Count (Discord Bot Repo)', value: `${totalContributors}` }
            ];

            const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.DEFAULT)
                .setTitle('📊 Bot Latency Information and Contributors')
                .setDescription('Here is the current status of the bot:')
                .addFields(fields)
                .setFooter({ text: `Data fetched from Hosting Environment & GitHub API | Top 3 Contributors: ${topContributorsList}` });

            await interaction.editReply({ content: ' ', embeds: [embed] });
        } catch (error) {
            console.error('Error fetching contributors:', error.response ? error.response.data : error.message);
            await interaction.editReply('There was an error fetching the contributors list. Please check if the repository is public or the GitHub token is valid.');
        }
    }
};