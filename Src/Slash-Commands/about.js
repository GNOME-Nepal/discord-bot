const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { githubApi, endpoints } = require('../../api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Provides information about the GNOME-Nepal organization.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { data: orgData } = await githubApi.get(endpoints.GITHUB_ORG('GNOME-Nepal'));

            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('About GNOME-Nepal')
                .setDescription(orgData.description || 'No description provided.')
                .addFields(
                    { name: 'Public Repos', value: `${orgData.public_repos}`, inline: true },
                    { name: 'Followers', value: `${orgData.followers}`, inline: true },
                    { name: 'Location', value: orgData.location || 'N/A', inline: true },
                    { name: 'Website', value: orgData.blog || 'N/A', inline: true },
                    { name: 'Twitter', value: orgData.twitter_username || 'N/A', inline: true },
                    { name: 'GitHub URL', value: orgData.html_url }
                )
                .setThumbnail(orgData.avatar_url)
                .setFooter({ text: 'Data fetched from GitHub API' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            await interaction.editReply('There was an error fetching the organization data.');
        }
    },
};