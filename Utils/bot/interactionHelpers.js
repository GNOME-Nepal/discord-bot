/**
 * GNOME Nepal Discord Bot - Interaction Helpers
 * ============================================
 * This file provides helper functions for working with Discord interactions.
 */

/**
 * Send a temporary ephemeral message
 * @param {Object} interaction - The interaction object
 * @param {string} content - The message content
 * @param {Object} options - Additional options (embeds, components, etc.)
 * @returns {Promise<Object>} The sent message
 */
async function sendTemporaryMessage(interaction, content, options = {}) {
  try {
    const messageOptions = {
      content,
      flags: 64, // Ephemeral flag
      ...options,
    };

    // Check if interaction has already been replied to
    if (interaction.deferred || interaction.replied) {
      return await interaction.followUp(messageOptions);
    } else {
      return await interaction.reply(messageOptions);
    }
  } catch (error) {
    console.error('Error sending temporary message:', error);
    return null;
  }
}

/**
 * Create a modal for collecting user input
 * @param {Object} interaction - The interaction object
 * @param {Object} modalData - Modal configuration (id, title, inputs)
 * @param {Function} onSubmit - Callback function when modal is submitted
 * @param {number} timeout - Time in ms to wait for submission (default: 5 minutes)
 * @returns {Promise<Object>} The modal submission or null if timed out
 */
async function createInputModal(
  interaction,
  modalData,
  onSubmit,
  timeout = 300000,
) {
  try {
    await interaction.showModal(modalData.modal);

    const filter = (i) => i.user.id === interaction.user.id;
    const submission = await interaction
      .awaitModalSubmit({ filter, time: timeout })
      .catch(() => null);

    if (submission && typeof onSubmit === 'function') {
      return await onSubmit(submission);
    }

    return submission;
  } catch (error) {
    console.error('Error with modal interaction:', error);
    return null;
  }
}

/**
 * Clean up messages after a delay
 * @param {Array} messages - Array of messages to clean up
 * @param {number} delay - Delay in ms before cleaning up
 * @param {Function} filter - Function to filter which messages to delete
 * @returns {Promise<void>}
 */
async function cleanupMessages(
  messages,
  delay = 5000,
  filter = (msg) => msg.deletable && msg.attachments.size === 0,
) {
  setTimeout(async () => {
    await Promise.all(
      messages.map(async (msg) => {
        try {
          if (filter(msg)) {
            await msg.delete();
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }),
    );
  }, delay);
}

module.exports = {
  sendTemporaryMessage,
  createInputModal,
  cleanupMessages,
};
