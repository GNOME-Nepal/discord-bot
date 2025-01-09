const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');
const { GITHUB_TOKEN } = require('../../config.json'); // Load GitHub token

// GitHub API Configuration
const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`, // Set the authorization header with the GitHub token
        'User-Agent': 'Discord-Bot', // Set the user agent header
    },
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about') // Define the command name
        .setDescription('Provides information about the GNOME-Nepal organization.'), // Define the command description
    async execute(interaction) {
        await interaction.deferReply(); // Defer the response for better user experience

        try {
            // Fetch organization details via GitHub API
            console.log('Fetching organization details...');
            const orgResponse = await githubAPI.get('/orgs/GNOME-Nepal');
            const org = orgResponse.data; // Extract organization data
            console.log('Organization details fetched:', org);

            // Fetch repositories of the organization
            console.log('Fetching repositories...');
            const reposResponse = await githubAPI.get('/orgs/GNOME-Nepal/repos');
            const repos = reposResponse.data; // Extract repositories data
            console.log('Repositories fetched:', repos);

            // Fetch contributors of the organization
            console.log('Fetching contributors...');
            const contributorsResponse = await githubAPI.get('/orgs/GNOME-Nepal/members');
            const contributors = contributorsResponse.data; // Extract contributors data
            console.log('Contributors fetched:', contributors);

            // Create dropdown menu options
            const options = repos.map(repo => ({
                label: repo.name, // Set the label to the repository name
                description: repo.description ? repo.description.substring(0, 97) + '...' : 'No description', // Truncate description if it exceeds 100 characters
                value: repo.name, // Set the value to the repository name
            }));

            // Create the initial embed with organization details
            const orgEmbed = new EmbedBuilder()
                .setColor(0x00ae86) // Set the embed color
                .setTitle('Organization Information for GNOME-Nepal') // Set the embed title
                .setThumbnail(org.avatar_url) // Set the organization avatar
                .addFields(
                    { name: 'Name', value: org.name || 'N/A', inline: true }, // Add the organization name field
                    { name: 'Description', value: org.description || 'No description provided', inline: true }, // Add the organization description field
                    { name: 'Public Repositories', value: `${org.public_repos}`, inline: true }, // Add the public repositories field
                    { name: 'Followers', value: `${org.followers}`, inline: true }, // Add the followers field
                    { name: 'Website', value: org.blog || 'Not provided', inline: true }, // Add the website field
                    { name: 'GitHub URL', value: `[Visit Here](${org.html_url})`, inline: true }, // Add the GitHub URL field
                    { name: 'Contributors', value: `${contributors.length}`, inline: true }, // Add the contributors count field
                    { name: 'Code of Conduct', value: org.code_of_conduct ? `[View Here](${org.code_of_conduct.url})` : 'Not provided', inline: true }, // Add the code of conduct field
                    { name: 'Social Media', value: org.twitter_username ? `[Twitter](https://twitter.com/${org.twitter_username})` : 'Not provided', inline: true } // Add the social media field
                );

            // Create the dropdown menu
            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select-repo') // Set the custom ID for the select menu
                        .setPlaceholder('Select a repository') // Set the placeholder text
                        .addOptions(options) // Add the options to the select menu
                );

            // Send the initial reply with the organization embed and dropdown menu
            await interaction.editReply({ embeds: [orgEmbed], components: [row] });

            // Create a collector to handle the dropdown menu selection
            const filter = i => i.customId === 'select-repo' && i.user.id === interaction.user.id; // Filter for the select menu interaction
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 }); // Create the collector with a 60-second timeout

            collector.on('collect', async i => {
                const selectedRepoName = i.values[0]; // Get the selected repository name
                const selectedRepo = repos.find(repo => repo.name === selectedRepoName); // Find the selected repository

                // Create an embed with the selected repository details
                const repoEmbed = new EmbedBuilder()
                    .setColor(0x00ae86) // Set the embed color
                    .setTitle(`Repository Information for ${selectedRepo.name}`) // Set the embed title
                    .addFields(
                        { name: 'Name', value: selectedRepo.name || 'N/A', inline: true }, // Add the repository name field
                        { name: 'Description', value: selectedRepo.description || 'No description provided', inline: true }, // Add the repository description field
                        { name: 'Stars', value: `${selectedRepo.stargazers_count}`, inline: true }, // Add the stars field
                        { name: 'Forks', value: `${selectedRepo.forks_count}`, inline: true }, // Add the forks field
                        { name: 'Open Issues', value: `${selectedRepo.open_issues_count}`, inline: true }, // Add the open issues field
                        { name: 'GitHub URL', value: `[Visit Here](${selectedRepo.html_url})`, inline: true } // Add the GitHub URL field
                    );

                // Send a new message with the repository embed
                await i.reply({ embeds: [repoEmbed] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Time expired. Please use the command again to view repository details.', components: [] }); // Notify the user if the time expired
                }
            });

        } catch (error) {
            console.error('Error fetching organization or repository info:', error.response ? error.response.data : error.message); // Log the error
            console.error('Full error response:', error.response ? error.response : error); // Log the full error response
            await interaction.editReply({
                content: 'Unable to fetch organization or repository details. Please check if the organization is public or the GitHub token is valid.', // Notify the user of the error
                flags: 64 // Make the message ephemeral
            });
        }
    },
};