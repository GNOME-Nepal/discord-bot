const {SlashCommandBuilder} = require('@discordjs/builders');
const {EmbedBuilder} = require('discord.js');

const COMMANDS = [
    {name: 'help', description: 'Displays a list of available commands and their descriptions.'},
    {name: 'ping', description: 'Replies with bot\'s shards and node latency.'},
    {name: 'about', description: 'Provides information about the GNOME-Nepal organization.'},
    {name: 'social', description: 'Provides links to our social media accounts.'},
    {name: 'contributors', description: 'Displays the list of contributors from the GNOME Nepal GitHub account.'},
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands and their descriptions.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('Help - Command List')
            .setDescription('Below is a list of available commands:')
            .addFields(COMMANDS.map(cmd => ({name: `/${cmd.name}`, value: cmd.description})))
            .setFooter({text: 'These are Slash Commands. Use "$sudo.js help" for Prefix Commands'});

        await interaction.reply({embeds: [embed]});
    },
};