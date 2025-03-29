/**
     * NOTICE:
     * It contains configuration Token used throughout the application.
     * Any changes to this file should be carefully reviewed to ensure they do not
     * affect other parts of the application that rely on these configuration values.
     */

    const config = require('./config.json');

    module.exports = {
        CLIENT_ID: config.CLIENT_ID,
        TOKEN: config.TOKEN,
        PREFIX: config.ADMINPREFIX,
        GUILD_ID: config.GUILD_ID,
        GITHUB_TOKEN: config.GITHUB_TOKEN,
        REPORT_WEBHOOK_URL: config.REPORT_WEBHOOK_URL,
        MOD_ROLE_ID: config.MOD_ROLE_ID,
        REPORT_LOG_CHANNEL_ID: config.REPORT_LOG_CHANNEL_ID,
        prefix: config.prefix,
        Member: config.Member,
        CONTRIBUTORS_URL: 'https://raw.githubusercontent.com/GNOME-Nepal/contributors/main/contributors.json'
    };
