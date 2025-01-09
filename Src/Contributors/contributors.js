const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
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
        .setName('contributors')
        .setDescription('Displays the list of contributors from the GNOME Nepal GitHub account.'),
    async execute(interaction) {
        await interaction.deferReply(); // Defer the response for better user experience

        try {
            // Fetch the contributors.json file from the contributors repository
            const url = 'https://raw.githubusercontent.com/GNOME-Nepal/contributors/main/contributors.json';
            const response = await axios.get(url);
            const contributors = response.data;

            // Create embeds for each contributor
            const embeds = contributors.map(contributor => new EmbedBuilder()
                .setColor(0x00ae86)
                .setTitle(contributor.name)
                .setURL(contributor.html_url)
                .setThumbnail(contributor.avatar_url)
                .addFields(
                    { name: 'Username', value: contributor.login, inline: true },
                    { name: 'Contributions', value: `${contributor.contributions}`, inline: true },
                    { name: 'Company', value: contributor.company || 'N/A', inline: true },
                    { name: 'Email', value: contributor.email || 'N/A', inline: true },
                    { name: 'Website', value: contributor.blog || 'N/A', inline: true },
                    { name: 'Twitter', value: contributor.twitter_username || 'N/A', inline: true },
                    { name: 'Hireable', value: contributor.hireable ? 'Yes' : 'No', inline: true },
                    { name: 'Location', value: contributor.location || 'N/A', inline: true },
                    { name: 'Bio', value: contributor.bio || 'N/A', inline: false },
                    { name: 'Public Repos', value: `${contributor.public_repos}`, inline: true },
                    { name: 'Followers', value: `${contributor.followers}`, inline: true },
                    { name: 'Following', value: `${contributor.following}`, inline: true },
                    { name: '> Feature by', value: '> <@1132618599798947871>', inline: true }
                )
                .setFooter({ text: 'Data fetched from GitHub API' })
            );

            let currentIndex = 0;

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === embeds.length - 1)
                );

            const message = await interaction.editReply({ embeds: [embeds[currentIndex]], components: [row] });

            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes

            collector.on('collect', async i => {
                if (i.customId === 'prev' && currentIndex > 0) {
                    currentIndex--;
                } else if (i.customId === 'next' && currentIndex < embeds.length - 1) {
                    currentIndex++;
                }

                await i.update({
                    embeds: [embeds[currentIndex]],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('prev')
                                    .setLabel('Previous')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentIndex === 0),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('Next')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentIndex === embeds.length - 1)
                            )
                    ]
                });
            });

            collector.on('end', async collected => {
                await message.edit({
                    content: 'The time limit for changing contributors has ended.',
                    components: []
                });
            });

        } catch (error) {
            console.error('Error fetching contributors:', error.response ? error.response.data : error.message);
            await interaction.editReply(
                'There was an error fetching the contributors list. Please check if the repository is public or the GitHub token is valid.'
            );
        }
    },
};
