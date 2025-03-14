const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { EMBED_COLORS } = require('../../constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Provides social media links for the organization.'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.DEFAULT)
      .setTitle('Follow Us on Social Media')
      .setDescription(
        'Stay connected with us through our social media channels.',
      )
      .addFields(
        {
          name: 'Twitter',
          value: 'https://twitter.com/gnome_nepal',
          inline: true,
        },
        {
          name: 'Facebook',
          value: 'https://facebook.com/gnome.nepal',
          inline: true,
        },
        {
          name: 'Instagram',
          value: 'https://instagram.com/gnome_nepal',
          inline: true,
        },
      )
      .setFooter({ text: 'Thank you for your support!' });

    await interaction.reply({ embeds: [embed] });
  },
};
