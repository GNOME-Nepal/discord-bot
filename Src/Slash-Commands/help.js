const {SlashCommandBuilder} = require('@discordjs/builders');
const {EmbedBuilder} = require('discord.js');
const commands = require('../../commands');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands and their descriptions.'),
    async execute(interaction) {
        const slashCommands = commands['slash-commands'];
        
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('Help - Slash Command List')
            .setDescription('Below is a list of available slash commands:');
            
        slashCommands.forEach(cmd => {
            embed.addFields({
                name: `${cmd.emoji} ${cmd.name}`,
                value: `${cmd.description}\n**Syntax:** \`${cmd.syntax}\`\n**Example:** \`${cmd.usage}\``
            });
        });
        
        embed.setFooter({text: 'These are Slash Commands. Use "sudo help" for Member Commands'});

        await interaction.reply({embeds: [embed]});
    },
};
