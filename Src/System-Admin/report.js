const { WebhookClient, MessageFlags } = require('discord.js');
const { REPORT_WEBHOOK_URL } = require('../../config-global');

module.exports = {
    name: 'report',
    description: 'Report an issue to the admins.',
    async execute(interaction) {
        const webhookURL = REPORT_WEBHOOK_URL;
        if (!webhookURL) {
            return interaction.reply({
                content: 'Webhook URL is not defined.',
                flags: MessageFlags.Ephemeral
            });
        }

        const webhookClient = new WebhookClient({ url: webhookURL });

        try {
            const userTag = interaction.user ? interaction.user.tag : 'Unknown User';
            const message = interaction.options?.getString('message') || 'No message provided';

            await webhookClient.send({
                content: `New report from ${userTag}: ${message}`,
                username: 'Report Bot',
                avatarURL: 'https://i.imgur.com/AfFp7pu.png',
            });

            await interaction.reply({
                content: 'Your report has been sent successfully.',
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error sending report:', error);
            await interaction.reply({
                content: 'There was an error sending your report.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};