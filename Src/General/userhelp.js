const { EmbedBuilder } = require('discord.js');

const PREFIX_COMMANDS = [
  {
    name: '$sudo help',
    description:
      'Displays a list of available prefix commands and their descriptions.',
  },
  {
    name: '$sudo purge <amount>',
    description: 'Delete a specified number of messages from a channel.',
  },
];

module.exports = {
  name: 'help',
  description:
    'Displays a list of available prefix commands and their descriptions.',
  execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle('Help - Prefix Command List')
      .setDescription('Below is a list of available prefix commands:')
      .addFields(
        PREFIX_COMMANDS.map((cmd) => ({
          name: cmd.name,
          value: cmd.description,
        })),
      )
      .setFooter({
        text: 'These are Prefix Commands. Use "/help" for Slash Commands',
      });

    message.channel.send({ embeds: [embed] });
  },
};
