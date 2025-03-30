const { MEMBER_ROLE_ID, CONTRIBUTOR_ROLE_ID, MAINTAINER_ROLE_ID } = require('../config-global.js');
    const funMessages = require('../Funtext.js');

    // Function to get a random fun message
    const getRandomFunMessage = () => {
        return funMessages[Math.floor(Math.random() * funMessages.length)];
    };

    // Function to determine the appropriate help command based on roles
    const getHelpCommandSuggestion = (member) => {
        if (MAINTAINER_ROLE_ID && member.roles.cache.has(MAINTAINER_ROLE_ID)) {
            return '`$packman help` (Maintainer commands)';
        } else if (CONTRIBUTOR_ROLE_ID && member.roles.cache.has(CONTRIBUTOR_ROLE_ID)) {
            return '`$sudo help` (Contributor commands)';
        } else if (MEMBER_ROLE_ID && member.roles.cache.has(MEMBER_ROLE_ID)) {
            return '`sudo help` (Member commands)';
        } else {
            return '`/help` (general commands)';
        }
    };

    // Main handler for when the bot is mentioned
    const handleMention = async (message, client) => {
        // Check if the message mentions the bot
        if (!message.mentions.has(client.user)) return;

        // Ignore if the message is from a bot or has a command prefix
        if (message.author.bot || message.content.startsWith('sudo') || message.content.startsWith('$sudo') || message.content.startsWith('$packman')) return;

        // Fetch member if not already available
        const member = message.member ?? await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!member) {
            return message.reply({
                content: `${getRandomFunMessage()} I couldn't check your roles, but you can use \`/help\` for general commands!`,
                allowedMentions: { repliedUser: false }
            });
        }

        // Get the appropriate help command suggestion
        const helpCommand = getHelpCommandSuggestion(member);

        // Send the response
        await message.reply({
            content: `${getRandomFunMessage()} Try ${helpCommand} to see what I can do for you!`,
            allowedMentions: { repliedUser: false }
        });
    };

    module.exports = { handleMention };