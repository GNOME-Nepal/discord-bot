const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description:
    'Displays a list of available prefix commands and their descriptions.',
  syntax: 'sudo help',
  usage: 'sudo help',
  emoji: '📚',
  execute(message) {
    const client = message.client;
    const memberCommands = client.memberCommands;

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle('Help - Member Command List')
      .setDescription('Below is a list of available member commands:');

    memberCommands.forEach((cmd) => {
      embed.addFields({
        name: `${cmd.emoji || '🔹'} ${cmd.name}`,
        value: `${cmd.description || 'No description'}\n**Syntax:** \`${cmd.syntax || `sudo ${cmd.name}`}\`\n**Example:** \`${cmd.usage || `sudo ${cmd.name}`}\``,
      });
    });

    embed.setFooter({
      text: 'These are Member Prefix Commands. Use "/help" for Slash Commands',
    });

    message.channel.send({ embeds: [embed] });
  },
};
