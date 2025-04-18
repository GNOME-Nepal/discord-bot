const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    WebhookClient,
    AttachmentBuilder
} = require('discord.js');
const {EMBED_COLORS} = require('../../Utils/cmds/constants.js');
const config = require('../../Utils/bot/config-global');
const axios = require('axios');
const { sendTemporaryMessage, cleanupMessages } = require('../../Utils/bot/interactionHelpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Submit a formal report to the moderation team'),
    name: 'report',
    description: 'Submit a formal report to the moderation team',
    syntax: '/report',
    usage: '/report',
    emoji: '📝',
    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('reportModal')
            .setTitle('Submit a Report');

        // Create text input components
        const whatInput = new TextInputBuilder()
            .setCustomId('whatReport')
            .setLabel("What are you reporting?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Describe the issue in detail")
            .setMaxLength(300);

        const whyInput = new TextInputBuilder()
            .setCustomId('whyReport')
            .setLabel("Why is this important?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Explain why moderators should address this")
            .setMaxLength(100);

        const whenInput = new TextInputBuilder()
            .setCustomId('whenReport')
            .setLabel("When did this happen?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("DD/MM/YYYY or approximate time");

        // Add action rows with text inputs to modal
        modal.addComponents(new ActionRowBuilder().addComponents(whatInput), new ActionRowBuilder().addComponents(whyInput), new ActionRowBuilder().addComponents(whenInput));

        // Show the modal
        await interaction.showModal(modal);

        try {
            const modalInteraction = await interaction.awaitModalSubmit({
                filter: i => i.user.id === interaction.user.id, time: 300000
            });

            // Get report data
            const [whatReported, whyReported, whenReported] = ['whatReport', 'whyReport', 'whenReport'].map(field => modalInteraction.fields.getTextInputValue(field));

            // Initialize evidence storage
            const evidence = [];
            const cleanupQueue = [];

            // Create evidence collector
            const evidenceCollector = modalInteraction.channel.createMessageCollector({
                filter: m => m.author.id === interaction.user.id, time: 120_000, max: 8
            });

            // Send evidence instructions
            const evidenceEmbed = new EmbedBuilder()
                .setColor(EMBED_COLORS.WARNING)
                .setTitle("📁 Evidence Submission")
                .setDescription(["**Attach your evidence files now**", "- Max 8 files (8MB each)", "- Supported: PNG, JPG, MP4, TXT", "- Type `done` to submit or `cancel` to abort"].join('\n'));

            const instructions = await sendTemporaryMessage(modalInteraction, null, {
                embeds: [evidenceEmbed], fetchReply: true
            });
            if (instructions) cleanupQueue.push(instructions);

            // Process collected evidence
            evidenceCollector.on('collect', async m => {
                try {
                    if (m.content.toLowerCase() === 'cancel') {
                        evidenceCollector.stop('userCancelled');
                        return;
                    }

                    if (m.content.toLowerCase() === 'done') {
                        evidenceCollector.stop('userFinished');
                        return;
                    }

                    // Process attachments
                    for (const attachment of m.attachments.values()) {
                        // Validate attachment
                        if (attachment.size > 8_388_608) {
                            await sendTemporaryMessage(modalInteraction, `❌ ${attachment.name} exceeds 8MB limit`);
                            continue;
                        }

                        // Download and store attachment
                        const response = await axios.get(attachment.url, {
                            responseType: 'arraybuffer'
                        });

                        evidence.push({
                            name: attachment.name, data: Buffer.from(response.data), type: attachment.contentType
                        });
                    }

                    cleanupQueue.push(m);
                } catch (error) {
                    console.error('Error processing attachment:', error);
                }
            });

            // Handle collector completion
            evidenceCollector.on('end', async (collected, reason) => {
                try {
                    if (reason === 'userCancelled' || reason === 'time') {
                        await sendTemporaryMessage(modalInteraction, '❌ Report cancelled');
                        return;
                    }

                    // Create report embed
                    const caseId = Math.random().toString(36).slice(2, 8).toUpperCase();
                    const reportEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLORS.WARNING)
                        .setTitle(`⚠️ New Report - Case ${caseId}`)
                        .setDescription(`Report submitted by ${interaction.user.tag}`)
                        .addFields({name: 'What', value: whatReported}, {
                            name: 'Why',
                            value: whyReported
                        }, {name: 'When', value: whenReported}, {
                            name: 'Attachments',
                            value: evidence.length > 0 ? evidence.map(e => e.name).join('\n') : 'No files attached'
                        })
                        .setFooter({text: `Reporter ID: ${interaction.user.id}`});

                    // Prepare attachments
                    const attachments = evidence.map(e => new AttachmentBuilder(e.data, {name: e.name}));

                    // Send to webhook
                    if (config.REPORT_WEBHOOK_URL) {
                        const webhook = new WebhookClient({url: config.REPORT_WEBHOOK_URL});
                        await webhook.send({
                            username: 'Report System',
                            avatarURL: interaction.client.user.displayAvatarURL(),
                            embeds: [reportEmbed],
                            files: attachments,
                            content: `**Case ID:** ${caseId}`
                        });
                    }

                    // Send confirmation
                    const confirmation = new EmbedBuilder()
                        .setColor(EMBED_COLORS.SUCCESS)
                        .setDescription([`✅ Report submitted with ${evidence.length} files`, `**Case ID:** ${caseId}`, "Moderators will review your submission"].join('\n'));

                    await sendTemporaryMessage(modalInteraction, null, { embeds: [confirmation] });

                    // Cleanup non-attachment messages after delay
                    cleanupMessages(cleanupQueue);

                } catch (error) {
                    console.error('Report submission error:', error);
                    await sendTemporaryMessage(modalInteraction, '❌ Failed to submit report');
                }
            });

        } catch (error) {
            console.error('Report command error:', error);
            await sendTemporaryMessage(interaction, '❌ Report process failed');
        }
    }
};
