const {
  MEMBER_ROLE_ID,
  CONTRIBUTOR_ROLE_ID,
  MAINTAINER_ROLE_ID,
} = require('../../../Utils/bot/config-global');
const funMessages = require('../../../Utils/bot/Funtext.js');
const { EmbedBuilder } = require('discord.js');
const { EMBED_COLORS } = require('../../../Utils/cmds/constants.js');

// Cache messages and configuration
const cachedMessages = [...funMessages];
const HELP_FOOTER_TEXT =
  'Use the command shown below each category to see details'; // Local constant

const ROLE_COMMANDS = {
  [MAINTAINER_ROLE_ID]: {
    name: '⚙️ Maintainer Commands',
    value: '`$packman help` - Advanced server management tools',
    color: EMBED_COLORS.WARNING,
  },
  [CONTRIBUTOR_ROLE_ID]: {
    name: '💻 Contributor Commands',
    value: '`$sudo help` - Development and moderation tools',
    color: EMBED_COLORS.SUCCESS,
  },
  [MEMBER_ROLE_ID]: {
    name: '👤 Member Commands',
    value: '`sudo help` - Community interaction features',
    color: EMBED_COLORS.DEFAULT,
  },
};

const getRandomFunMessage = () => {
  return cachedMessages[Math.floor(Math.random() * cachedMessages.length)];
};

const createHelpEmbed = (member) => {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.DEFAULT)
    .setTitle('🛠️ Available Command Categories')
    .setDescription(`${getRandomFunMessage()}\nHere's what you can access:`)
    .setFooter({
      text: 'Use the command shown below each category to see details',
    });

  Object.entries(ROLE_COMMANDS).forEach(([roleId, config]) => {
    if (member.roles.cache.has(roleId)) {
      embed.addFields({
        name: config.name,
        value: config.value,
        inline: false,
      });
    }
  });

  embed.addFields({
    name: '🌍 General Commands',
    value: '`/help` - Basic bot functionality',
    inline: false,
  });

  return embed;
};

/**
 * Handles user mentions to the bot (@bot) and responds with available commands
 * based on the user's roles.
 *
 * @param {Object} message - The Discord message object
 * @param {Object} client - The Discord client object
 * @returns {Promise<void>}
 */
const handleMention = async (message, client) => {
  if (!message.mentions.has(client.user)) return;
  if (message.author.bot) return;

  try {
    const member =
      message.member ?? (await message.guild.members.fetch(message.author.id));
    const helpEmbed = createHelpEmbed(member);

    await message.reply({
      embeds: [helpEmbed],
      allowedMentions: { repliedUser: true },
    });
  } catch (error) {
    console.log('Mention Handler Error:', error);
    const fallbackResponse = `${getRandomFunMessage()} I couldn't fetch your details! \n Try \`/help\` instead.`;

    await message.reply({
      content: fallbackResponse,
      allowedMentions: { repliedUser: false },
    });
  }
};

module.exports = {
  handleMention,
};
