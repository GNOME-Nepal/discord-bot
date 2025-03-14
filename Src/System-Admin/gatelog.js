const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gatelog')
    .setDescription('Logs user join and leave events in a specific channel.'),
  async execute(interaction) {
    await interaction.reply({
      content: 'This command is under development.',
      flags: 64,
    });
  },
};
