/**
 * GNOME Nepal Discord Bot - Command Registration
 * =============================================
 * This file handles registering slash commands with Discord's API.
 */

const { REST, Routes } = require('discord.js');

/**
 * Register slash commands with Discord's API
 * @param {string} token - Bot token
 * @param {string} clientId - Client ID
 * @param {string} guildId - Guild ID (comma-separated list)
 * @param {Collection} slashCommands - Collection of slash commands
 * @param {Function} addRegisteredGuild - Function to add a registered guild to the list
 * @returns {Promise<void>}
 */
async function registerCommands(
  token,
  clientId,
  guildId,
  slashCommands,
  addRegisteredGuild,
) {
  const rest = new REST({ version: '10' }).setToken(token);
  const commands = slashCommands.map((cmd) => cmd.data.toJSON());

  const guildIds = guildId ? guildId.split(',').map((id) => id.trim()) : [];
  if (guildIds.length === 0) {
    console.warn('[WARN] No GUILD_ID specified, skipping command registration');
    return;
  }

  for (const guildId of guildIds) {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      addRegisteredGuild(guildId, '✓');
      console.log(`[OK] Registered commands for guild ${guildId}`);
    } catch (error) {
      let errorMsg = `Failed to register commands in guild ${guildId}:`;
      if (error.code === 50001) errorMsg += ' Missing Access';
      else errorMsg += ` ${error.message}`;
      console.error(`[FAIL] ${errorMsg}`);
      addRegisteredGuild(guildId, '✗');
    }
  }
  console.log('--- Slash Command Registration Finished ---');
}

module.exports = { registerCommands };
