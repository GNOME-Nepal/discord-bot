const {EmbedBuilder} = require('discord.js');
const commands = require('../../commands');

module.exports = {
    name: 'help',
    description: 'Displays a list of available contributor commands and their descriptions.',
    execute(message) {
        const contributorCommands = commands.contributor;

        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('Help - Contributor Command List')
            .setDescription('Below is a list of available contributor commands:');

        contributorCommands.forEach(cmd => {
            embed.addFields({
                name: `${cmd.emoji} ${cmd.name}`,
                value: `${cmd.description}\n**Syntax:** \`${cmd.syntax}\`\n**Example:** \`${cmd.usage}\``
            });
        });

        embed.setFooter({text: 'These are Contributor Prefix Commands. Use "/help" for general commands'});

        message.channel.send({embeds: [embed]});
    },
};
