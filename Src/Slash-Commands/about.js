const {SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder} = require('discord.js');
const {fetchGnomeNepalData} = require('../../utils/api.js');
const {MESSAGE_COLLECTOR_TIMEOUT, EMBED_COLORS, remainingTime} = require('../../utils/constants.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Provides information about the GNOME-Nepal organization.'),
    name: 'about',
    description: 'Provides information about the GNOME-Nepal organization.',
    syntax: '/about',
    usage: '/about',
    emoji: 'ℹ️',
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const {org, repos, contributors} = await fetchGnomeNepalData();

            const options = repos.map(repo => ({
                label: repo.name,
                description: repo.description ? repo.description.substring(0, 97) + '...' : 'No description',
                value: repo.name,
            }));

            const orgEmbed = new EmbedBuilder()
                .setColor(EMBED_COLORS.DEFAULT)
                .setTitle('About.us GNOME Nepal')
                .setThumbnail(org.avatar_url)
                .addFields(
                    {name: 'Name', value: org.name || 'N/A', inline: true},
                    {name: 'Description', value: org.description || 'No description provided', inline: true},
                    {name: 'Public Repositories', value: `${org.public_repos}`, inline: true},
                    {name: 'Followers', value: `${org.followers}`, inline: true},
                    {name: 'Website', value: org.blog || 'Not provided', inline: true},
                    {name: 'GitHub URL', value: `[Visit Here](${org.html_url})`, inline: true},
                    {name: 'Contributors', value: `${contributors.length}`, inline: true},
                    {
                        name: 'Code of Conduct',
                        value: org.code_of_conduct ? `[View Here](${org.code_of_conduct.url})` : 'Not provided',
                        inline: true
                    },
                    {
                        name: 'Social Media',
                        value: org.twitter_username ? `[Twitter](https://twitter.com/${org.twitter_username})` : 'Not provided',
                        inline: true
                    },
                    {name: 'Email', value: org.email || 'Not provided', inline: true},
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select-repo')
                        .setPlaceholder('Select a repository')
                        .addOptions(options)
                );

            let remainingTimeLocal = remainingTime;
            const message = await interaction.editReply({
                content: `Time remaining: ${remainingTimeLocal} seconds`,
                embeds: [orgEmbed],
                components: [row]
            });

            const filter = i => i.customId === 'select-repo' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: MESSAGE_COLLECTOR_TIMEOUT
            });

            const interval = setInterval(async () => {
                remainingTimeLocal -= 1;
                if (remainingTimeLocal <= 0) {
                    clearInterval(interval);
                } else {
                    await message.edit({content: `Time remaining: ${remainingTimeLocal} seconds`});
                }
            }, 1000);

            collector.on('collect', async i => {
                const selectedRepoName = i.values[0];
                const selectedRepo = repos.find(repo => repo.name === selectedRepoName);

                const repoEmbed = new EmbedBuilder()
                    .setColor(EMBED_COLORS.DEFAULT)
                    .setTitle(`Repository Information for ${selectedRepo.name}`)
                    .addFields(
                        {name: 'Name', value: selectedRepo.name || 'N/A', inline: true},
                        {
                            name: 'Description',
                            value: selectedRepo.description || 'No description provided',
                            inline: true
                        },
                        {name: 'Stars', value: `${selectedRepo.stargazers_count}`, inline: true},
                        {name: 'Forks', value: `${selectedRepo.forks_count}`, inline: true},
                        {name: 'Open Issues', value: `${selectedRepo.open_issues_count}`, inline: true},
                        {name: 'GitHub URL', value: `[Visit Here](${selectedRepo.html_url})`, inline: true}
                    );

                await i.reply({embeds: [repoEmbed], flags: 64});
            });

            collector.on('end', async () => {
                clearInterval(interval);
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select-repo')
                            .setPlaceholder('Select a repository')
                            .addOptions(options)
                            .setDisabled(true)
                    );
                await message.edit({
                    content: 'Time expired. Please use the command again to view repository details.',
                    components: [disabledRow]
                });
            });

        } catch (error) {
            console.error('Error fetching organization or repository info:', error.response ? error.response.data : error.message);
            await interaction.editReply({
                content: 'Unable to fetch organization or repository details. Please check if the organization is public or the GitHub token is valid.',
                flags: 64
            });
        }
    },
};
