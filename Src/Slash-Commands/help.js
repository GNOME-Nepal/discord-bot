const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(
      'Displays a list of available commands and their descriptions.',
    ),
  name: 'help',
  description: 'Displays a list of available commands and their descriptions.',
  syntax: '/help',
  usage: '/help',
  emoji: '📚',
  async execute(interaction) {
    const client = interaction.client;
    const slashCommands = client.slashCommands;

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle('Help - Slash Command List')
      .setDescription('Below is a list of available slash commands:');

    slashCommands.forEach((cmd) => {
      embed.addFields({
        name: `${cmd.emoji || '🔹'} ${cmd.name}`,
        value: `${cmd.description}\n**Syntax:** \`${cmd.syntax || `/${cmd.name}`}\`\n**Example:** \`${cmd.usage || `/${cmd.name}`}\``,
      });
    });

    embed.setFooter({
      text: 'These are Slash Commands. Use "sudo help" for Member Commands',
    });

    await interaction.reply({ embeds: [embed] });
  },
};
