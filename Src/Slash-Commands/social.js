// commands/social.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('social')
        .setDescription('Provides links to our social media accounts.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('Social Media Links')
            .setDescription('Follow us on our social media accounts:')
            .addFields(
                { name: 'Facebook', value: '@gnomenepal', inline: true },
                { name: 'Instagram', value: '@gnomenepal', inline: true },
                { name: 'LinkedIn', value: '@gnomenepal', inline: true }
            )
            .setFooter({ text: 'Stay connected with us!' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link) // Link button for URL
                    .setURL('https://nepal.gnome.org/')
                    .setEmoji('🌐'), // Add emoji to represent the website
                new ButtonBuilder()
                    .setLabel('Facebook')
                    .setStyle(ButtonStyle.Link) // Link button for URL
                    .setURL('https://m.facebook.com/61560797123131/')
                    .setEmoji('📘'), // Add emoji to represent Facebook
                new ButtonBuilder()
                    .setLabel('Instagram')
                    .setStyle(ButtonStyle.Link) // Link button for URL
                    .setURL('https://www.instagram.com/gnomenepal/')
                    .setEmoji('📸'), // Add emoji to represent Instagram
                new ButtonBuilder()
                    .setLabel('LinkedIn')
                    .setStyle(ButtonStyle.Link) // Link button for URL
                    .setURL('https://www.linkedin.com/company/gnomenepal/posts/?feedView=all')
                    .setEmoji('🔗') // Add emoji to represent LinkedIn
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};