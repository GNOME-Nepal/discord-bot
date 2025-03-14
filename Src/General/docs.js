const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('docs')
    .setDescription('Provides documentation links.'),
  async execute(interaction) {
    await interaction.reply({
      content: 'This command is under development.',
      flags: 64,
    });
  },
};
