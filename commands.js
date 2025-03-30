/**
 * GNOME Nepal Discord Bot - Command Definitions
 * ============================================
 * This file contains the definitions for all commands available in the bot.
 * Commands are organized by role-level and include usage examples and descriptions.
 */

module.exports = {
    // Member commands (sudo prefix)
    member: [{
        name: 'help',
        description: 'Displays this help message with available member commands',
        syntax: 'sudo help',
        usage: 'sudo help',
        emoji: '📚'
    }, {
        name: 'meme',
        description: 'Fetches a random meme from Reddit',
        syntax: 'sudo meme',
        usage: 'sudo meme',
        emoji: '😂'
    }, {
        name: 'docs',
        description: 'Provides documentation links (under development)',
        syntax: 'sudo docs',
        usage: 'sudo docs',
        emoji: '📄'
    }],

    // Contributor commands ($sudo prefix)
    contributor: [{
        name: 'help',
        description: 'Displays this help message with available contributor commands',
        syntax: '$sudo help',
        usage: '$sudo help',
        emoji: '📚'
    }, {
        name: 'ping',
        description: 'Replies with bot\'s latency information and top contributors',
        syntax: '$sudo ping',
        usage: '$sudo ping',
        emoji: '🏓'
    }],

    // Maintainer commands ($packman prefix)
    maintainer: [{
        name: 'help',
        description: 'Displays this help message with available maintainer commands',
        syntax: '$packman help',
        usage: '$packman help',
        emoji: '📚'
    }, {
        name: 'purge',
        description: 'Deletes a specified number of messages from a channel',
        syntax: '$packman purge <number>',
        usage: '$packman purge 10',
        emoji: '🗑️'
    }, {
        name: 'gatelog',
        description: 'Logs user join and leave events in a specific channel (under development)',
        syntax: '$packman gatelog',
        usage: '$packman gatelog',
        emoji: '🚪'
    }],

    // Slash commands
    'slash-commands': [{
        name: 'help',
        description: 'Displays a list of available slash commands and their descriptions',
        syntax: '/help',
        usage: '/help',
        emoji: '📚'
    }, {
        name: 'social',
        description: 'Provides social media links for the organization',
        syntax: '/social',
        usage: '/social',
        emoji: '🌐'
    }, {
        name: 'about',
        description: 'Provides information about the GNOME-Nepal organization',
        syntax: '/about',
        usage: '/about',
        emoji: 'ℹ️'
    }, {
        name: 'contributors',
        description: 'Displays the list of contributors from the GNOME Nepal GitHub organization',
        syntax: '/contributors',
        usage: '/contributors',
        emoji: '👥'
    },
        {
            name: 'meme',
            description: 'Fetches a random meme from Reddit',
            syntax: '/meme',
            usage: '/meme',
            emoji: '😂'
        }, {
            name: 'docs',
            description: 'Provides documentation links (under development)',
            syntax: '/docs',
            usage: '/docs',
            emoji: '📄'
        }, {
            name: 'ping',
            description: 'Replies with bot\'s latency information and top contributors',
            syntax: '/ping',
            usage: '/ping',
            emoji: '🏓'
        }, {
            name: "report",
            description: "Report an issue with the bot or user",
            syntax: "/report <issue>",
            usage: "/report <issue>",
            emoji: "📝"
        }
    ]
};