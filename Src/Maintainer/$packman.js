const {EmbedBuilder} = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays a list of available maintainer commands and their descriptions.',
    syntax: '$packman help',
    usage: '$packman help',
    emoji: '📚',
    execute(message) {
        // Access the client object through the message
        const client = message.client;
        const maintainerCommands = client.maintainerCommands;

        const embed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('Admin Help - Command List')
            .setDescription('Below is a list of available admin commands:');

        maintainerCommands.forEach(cmd => {
            embed.addFields({
                name: `${cmd.emoji || '🔹'} ${cmd.name}`,
                value: `${cmd.description || 'No description'}\n**Syntax:** \`${cmd.syntax || `$packman ${cmd.name}`}\`\n**Example:** \`${cmd.usage || `$packman ${cmd.name}`}\``
            });
        });

        embed.setFooter({text: 'These are Admin Commands. Use "/help" for general commands.'});

        message.channel.send({embeds: [embed]});
    },
};
