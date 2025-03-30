const { EmbedBuilder } = require('discord.js');
const { fetchTopContributors } = require('../../api.js');
const { EMBED_COLORS, calculateLatencies } = require('../../constants.js');
const packageJson = require('../../package.json');

module.exports = {
    name: 'ping',
    description: 'Replies with bot\'s latency information.',
    async execute(message) {
        try {
            // Send initial loading message
            const sentMessage = await message.reply('Calculating bot latency...');

            // Get latency data
            const latencies = calculateLatencies(message);

            // Fetch contributor data
            const { topContributors, totalContributors } = await fetchTopContributors();
            const topContributorsList = topContributors.map(contributor => contributor.login).join(', ');

            // Build embed fields
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
                { name: '👥 Contributor Count (Discord Bot Repo)', value: `${totalContributors}`}
            ];

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.DEFAULT)
                .setTitle('📊 Bot Latency Information and Contributors')
                .setDescription('Here is the current status of the bot:')
                .addFields(fields)
                .setFooter({
                    text: `Data fetched from Hosting Environment & GitHub API | Top 3 Contributors: ${topContributorsList}`
                });

            // Edit initial message with results
            await sentMessage.edit({ content: ' ', embeds: [embed] });
        } catch (error) {
            console.error('Error fetching contributors:',
                error.response ? error.response.data : error.message
            );
            await message.reply('There was an error fetching the contributors list. ' +
                'Please check if the repository is public or the GitHub token is valid.');
        }
    }
};