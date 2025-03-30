const {EmbedBuilder} = require('discord.js');
const commands = require('../../commands');

module.exports = {
    name: 'help',
    description: 'Displays a list of available prefix commands and their descriptions.',
    execute(message) {
        const memberCommands = commands.member;

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('Help - Member Command List')
            .setDescription('Below is a list of available member commands:');

        memberCommands.forEach(cmd => {
            embed.addFields({
                name: `${cmd.emoji} ${cmd.name}`,
                value: `${cmd.description}\n**Syntax:** \`${cmd.syntax}\`\n**Example:** \`${cmd.usage}\``
            });
        });

        embed.setFooter({text: 'These are Member Prefix Commands. Use "/help" for Slash Commands'});

        message.channel.send({embeds: [embed]});
    },
};
