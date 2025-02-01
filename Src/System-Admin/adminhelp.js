const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminhelp')
        .setDescription('Displays a list of available admin commands and their descriptions.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('Admin Help - Command List')
            .setDescription('Below is a list of available admin commands:')
            .addFields(
                { name: '/purge <amount>', value: 'Delete a specified number of messages from a channel.' },
                { name: '/kick <user> <reason>', value: 'Kick a user from the server.' },
                { name: '/ban <user> <reason>', value: 'Ban a user from the server.' },
                { name: '/unban <user>', value: 'Unban a user from the server.' },
                { name: '/mute <user> <reason>', value: 'Mute a user in the server.' },
                { name: '/unmute <user>', value: 'Unmute a user in the server.' },
                { name: '/gatelog', value: 'Logs user join and leave events in a specific channel.' }
            )
            .setFooter({ text: 'These are Admin Commands. Use "/help" for general commands.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};