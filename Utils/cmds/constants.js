/**
 * NOTICE:
 * It contains configuration constants used throughout the application.
 * Any changes to this file should be carefully reviewed to ensure they do not
 * affect other parts of the application that rely on these configuration values.
 */

const os = require('os');
const packageJson = require('../../package.json'); // Corrected path
const { EmbedBuilder } = require('discord.js');
const RANDOM_MEME = 'https://meme-api.herokuapp.com/gimme';

function createContributors(data) {
  return data.map((contributor) => ({
    name: contributor.login,
    contributions: contributor.contributions,
    avatar_url: contributor.avatar_url,
    profile_url: contributor.html_url,
  }));
}

const createEmbed = (contributor, index, totalContributors, color) =>
  new EmbedBuilder()
    .setColor(color)
    .setTitle(`👤 ${contributor.login}`)
    .setURL(contributor.html_url)
    .setThumbnail(contributor.avatar_url)
    .addFields(
      {
        name: 'Contributions',
        value: `${contributor.contributions}`,
        inline: true,
      },
      { name: 'GitHub Profile', value: contributor.html_url, inline: false },
      { name: 'Name', value: contributor.name || 'N/A', inline: true },
      { name: 'Location', value: contributor.location || 'N/A', inline: true },
      { name: 'Bio', value: contributor.bio || 'N/A', inline: false },
      { name: 'Company', value: contributor.company || 'N/A', inline: true },
      { name: 'Blog', value: contributor.blog || 'N/A', inline: true },
    )
    .setFooter({ text: `Contributor ${index + 1} of ${totalContributors}` });

const calculateLatencies = (interaction) => {
  const startTime = Date.now();
  const endTime = Date.now();

  return {
    shardLatency:
      interaction.client.ws.shards.reduce((acc, shard) => acc + shard.ping, 0) /
      interaction.client.ws.shards.size,
    nodeLatency: endTime - startTime,
    apiLatency: Math.round(interaction.client.ws.ping),
    uptime: Math.floor(process.uptime()),
    serverCount: interaction.client.guilds.cache.size,
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    totalMemory: (os.totalmem() / 1024 / 1024).toFixed(2),
    cpuUsage: (process.cpuUsage().user / 1024 / 1024).toFixed(2),
    systemUptime: Math.floor(os.uptime() / 60),
    discordJsVersion: packageJson.dependencies['discord.js'],
  };
};

const MESSAGE_COLLECTOR_TIMEOUT = 100000;
const remainingTime = MESSAGE_COLLECTOR_TIMEOUT / 1000;
const cooldown = new Set();
const COOLDOWN_TIME = 5000;

const EMBED_COLORS = {
  DEFAULT: 0x62a0ea, // Blue
  SUCCESS: 0x33d17a, // Green
  ERROR: 0xe01b24, // Red
  WARNING: 0xf6d32d, // Yellow
  NO_ACCESS_TIMEOUT: 0x5e5c64, // Dark
};

module.exports = {
  MESSAGE_COLLECTOR_TIMEOUT,
  remainingTime,
  EMBED_COLORS,
  cooldown,
  COOLDOWN_TIME,
  createContributors,
  createEmbed,
  calculateLatencies,
  RANDOM_MEME,
};
