// Src/Moderation/purge.js
const { MOD_ROLE_ID } = require('../../config.json');

module.exports = {
    name: 'purge',
    description: 'Delete a specified number of messages from a channel',
    async execute(message, args) {
        if (!message.member.roles.cache.has(MOD_ROLE_ID)) {
            return message.reply('You do not have permission to use this command.');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('Please provide a number between 1 and 100 for the number of messages to delete.');
        }

        try {
            await message.channel.bulkDelete(amount, true);
            message.channel.send(`Successfully deleted ${amount} messages.`);
        } catch (error) {
            console.error(error);
            message.reply('There was an error trying to purge messages in this channel.');
        }
    }
};