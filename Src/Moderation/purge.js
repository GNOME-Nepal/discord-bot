const config = require('../../config-global');

module.exports = {
  name: 'purge',
  description: 'Deletes a specified number of messages from a channel.',
  async execute(message, args) {
    if (!message.content.startsWith(config.prefix) || message.author.bot)
      return;

    const commandName = message.content
      .slice(config.prefix.length)
      .trim()
      .split(/\s+/)[0]
      .toLowerCase();
    if (commandName !== this.name) return;

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        'Please provide a valid number of messages to delete.',
      );
    }

    try {
      await message.channel.bulkDelete(amount, true);
      message.channel.send(`Successfully deleted ${amount} messages.`);
    } catch (error) {
      console.error('Error deleting messages:', error);
      message.channel.send(
        'There was an error trying to delete messages in this channel.',
      );
    }
  },
};
