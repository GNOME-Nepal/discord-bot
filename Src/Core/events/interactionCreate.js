/**
 * GNOME Nepal Discord Bot - Interaction Create Event Handler
 * =========================================================
 * This file handles all interaction events, including slash commands.
 */

/**
 * Handle interaction create events
 * @param {Object} interaction - The interaction object
 * @param {Collection} slashCommands - Collection of slash commands
 */
async function handleInteraction(interaction, slashCommands) {
  if (!interaction.isCommand()) return;

  const command = slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `[ERROR] Slash command /${interaction.commandName}: ${error.message}`,
    );
    const replyContent = {
      content: 'There was an error while executing this command!',
      flags: 64,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(replyContent).catch(() => {});
    } else {
      await interaction.reply(replyContent).catch(() => {});
    }
  }
}

module.exports = { handleInteraction };
