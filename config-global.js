/**
 * NOTICE:
 * This file contains configuration tokens used throughout the application.
 * Any changes to this file should be carefully reviewed to ensure they do not
 * affect other parts of the application that rely on these configuration values.
 */

const config = require('./config.json');

module.exports = {
    CLIENT_ID: config.CLIENT_ID,
    TOKEN: config.TOKEN,
    GUILD_ID: config.GUILD_ID,
    GITHUB_TOKEN: config.GITHUB_TOKEN,
    REPORT_WEBHOOK_URL: config.REPORT_WEBHOOK_URL,
    REPORT_LOG_CHANNEL_ID: config.REPORT_LOG_CHANNEL_ID,
    MOD_ROLE_ID: config.MOD_ROLE_ID || '',
    MEMBER_ROLE_ID: config.MEMBER_ROLE_ID || '',
    CONTRIBUTOR_ROLE_ID: config.CONTRIBUTOR_ROLE_ID || '',
    MAINTAINER_ROLE_ID: config.MAINTAINER_ROLE_ID || '',
    CONTRIBUTORS_URL: 'https://raw.githubusercontent.com/GNOME-Nepal/contributors/main/contributors.json'
};