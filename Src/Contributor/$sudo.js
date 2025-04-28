const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description:
    'Displays a list of available contributor commands and their descriptions.',
  syntax: '$sudo help',
  usage: '$sudo help',
  emoji: '📚',
  execute(message) {
    const client = message.client;
    const contributorCommands = client.contributorCommands;

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('Help - Contributor Command List')
      .setDescription('Below is a list of available contributor commands:');

    contributorCommands.forEach((cmd) => {
      embed.addFields({
        name: `${cmd.emoji || '🔹'} ${cmd.name}`,
        value: `${cmd.description || 'No description'}\n**Syntax:** \`${cmd.syntax || `$sudo ${cmd.name}`}\`\n**Example:** \`${cmd.usage || `$sudo ${cmd.name}`}\``,
      });
    });

    embed.setFooter({
      text: 'These are Contributor Prefix Commands. Use "/help" for general commands',
    });

    message.channel.send({ embeds: [embed] });
  },
};
