const { SlashCommandBuilder } = require('@discordjs/builders');
        const { EmbedBuilder } = require('discord.js');
        const os = require('os');
        const packageJson = require('../../package.json');
        const { githubApi } = require('../../api');

        module.exports = {
            data: new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Replies with bot\'s latency information.'),
            async execute(interaction) {
                if (interaction.replied || interaction.deferred) return console.error('Interaction already replied or deferred.');

                await interaction.deferReply();

                const startTime = Date.now();
                const endTime = Date.now();

                const shardLatency = interaction.client.ws.shards.reduce((acc, shard) => acc + shard.ping, 0) / interaction.client.ws.shards.size;
                const nodeLatency = endTime - startTime;
                const apiLatency = Math.round(interaction.client.ws.ping);
                const uptime = Math.floor(process.uptime());
                const serverCount = interaction.client.guilds.cache.size;
                const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
                const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);
                const cpuUsage = (process.cpuUsage().user / 1024 / 1024).toFixed(2);
                const systemUptime = Math.floor(os.uptime() / 60);
                const discordJsVersion = packageJson.dependencies['discord.js'];

                try {
                    const { data: repoContributors } = await githubApi.get('/repos/GNOME-Nepal/discord-bot/contributors');
                    const repoContributorCount = repoContributors.length;
                    const topContributors = repoContributors.slice(0, 3).map(contributor => contributor.login).join(', ');

                    const embed = new EmbedBuilder()
                        .setColor(0x00AE86)
                        .setTitle('📊 Bot Latency Information and Contributors')
                        .setDescription('Here is the current status of the bot and its top contributors:')
                        .addFields(
                            { name: '🖥️ Shard Latency', value: `${shardLatency}ms` },
                            { name: '⚙️ Node Latency', value: `${nodeLatency}ms` },
                            { name: '🌐 API Latency', value: `${apiLatency}ms` },
                            { name: '⏱️ Uptime', value: `${uptime} seconds` },
                            { name: '🌍 Server Count', value: `${serverCount}` },
                            { name: '💾 Memory Usage', value: `${memoryUsage} MB` },
                            { name: '🗄️ Total Memory', value: `${totalMemory} MB` },
                            { name: '🧠 CPU Usage', value: `${cpuUsage}%` },
                            { name: '🕒 System Uptime', value: `${systemUptime} minutes` },
                            { name: '🤖 Bot Version', value: packageJson.version },
                            { name: '📦 Discord.js Version', value: discordJsVersion },
                            { name: '👥 Contributor Count (Discord Bot Repo)', value: `${repoContributorCount}` }
                        )
                        .setFooter({ text: `Data fetched from Hosting Environment & GitHub API | Top 3 Contributors: ${topContributors}` });

                    await interaction.editReply({ content: ' ', embeds: [embed] });
                } catch (error) {
                    console.error('Error fetching contributors:', error.response ? error.response.data : error.message);
                    await interaction.editReply('There was an error fetching the contributors list. Please check if the repository is public or the GitHub token is valid.');
                }
            }
        };