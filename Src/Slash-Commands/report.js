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
const {EMBED_COLORS} = require('../../constants');
const config = require('../../config-global');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Submit a formal report to the moderation team'),

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
        modal.addComponents(
            new ActionRowBuilder().addComponents(whatInput),
            new ActionRowBuilder().addComponents(whyInput),
            new ActionRowBuilder().addComponents(whenInput)
        );

        // Show the modal
        await interaction.showModal(modal);

        // Handle modal submission
        try {
            const filter = (modalInteraction) =>
                modalInteraction.customId === 'reportModal' &&
                modalInteraction.user.id === interaction.user.id;

            const modalInteraction = await interaction.awaitModalSubmit({
                filter,
                time: 300000 // 5 minutes
            });

            // Get the data from inputs
            const whatReported = modalInteraction.fields.getTextInputValue('whatReport');
            const whyReported = modalInteraction.fields.getTextInputValue('whyReport');
            const whenReported = modalInteraction.fields.getTextInputValue('whenReport');

            // Send evidence request instead of immediate acknowledgment
            const evidenceRequest = new EmbedBuilder()
                .setColor(EMBED_COLORS.WARNING)
                .setTitle("📁 Evidence Submission")
                .setDescription([
                    "**Please upload your files now**",
                    "- Max 8 files total",
                    "- Supported types: PNG, JPG, MP4, TXT",
                    "- Max file size: 8MB each",
                    "- Drag & drop or click the '+' button",
                    "\nType `done` when finished or `cancel` to abort"
                ].join('\n'))
                .setFooter({text: "You have 2 minutes to submit evidence"});

            await modalInteraction.reply({
                embeds: [evidenceRequest],
                flags: 64
            });

            // Evidence collector
            const evidence = [];
            const cleanupQueue = []; // Messages to clean up later
            
            const evidenceFilter = m => {
                const isAuthor = m.author.id === modalInteraction.user.id;
                const hasAttachments = m.attachments.size > 0;
                const isTextCommand = ['done', 'cancel'].includes(m.content.toLowerCase());

                return isAuthor && (hasAttachments || isTextCommand);
            };

            const collector = modalInteraction.channel.createMessageCollector({
                filter: evidenceFilter,
                time: 120_000,
                max: 8
            });

            // Create report embed here so we can modify it later
            const reportEmbed = new EmbedBuilder()
                .setColor(EMBED_COLORS.WARNING)
                .setTitle('New Report Submitted')
                .setDescription(`A new report has been submitted by ${interaction.user.tag}`)
                .addFields(
                    {name: 'What was reported', value: whatReported},
                    {name: 'Why it was reported', value: whyReported},
                    {name: 'When it happened', value: whenReported || 'Not specified'}
                )
                .setFooter({text: `Reporter ID: ${interaction.user.id}`})
                .setTimestamp();

            const reporterInfo = `${interaction.user.tag} (ID: ${interaction.user.id})`;
            
            // Generate a unique case ID
            const caseId = Math.random().toString(36).slice(2, 8).toUpperCase();

            collector.on('collect', async m => {
                try {
                    if (m.content.toLowerCase() === 'cancel') {
                        collector.stop('userCancelled');
                        cleanupQueue.push(m);
                        return;
                    }

                    if (m.content.toLowerCase() === 'done') {
                        collector.stop('userFinished');
                        cleanupQueue.push(m);
                        return;
                    }
                    
                    // Process attachments using AttachmentBuilder
                    for (const attachment of m.attachments.values()) {
                        if (attachment.size > 8_388_608) { // 8MB limit
                            const limitMsg = await modalInteraction.followUp({
                                content: `❌ ${attachment.name} exceeds 8MB limit`,
                                ephemeral: true
                            });
                            cleanupQueue.push(limitMsg);
                            continue;
                        }

                        const allowedTypes = ['image/png', 'image/jpeg', 'video/mp4', 'text/plain'];
                        if (!allowedTypes.includes(attachment.contentType)) {
                            const typeMsg = await modalInteraction.followUp({
                                content: `❌ Unsupported file type for ${attachment.name}`,
                                ephemeral: true
                            });
                            cleanupQueue.push(typeMsg);
                            continue;
                        }

                        // Create AttachmentBuilder from URL
                        const attachmentBuilder = new AttachmentBuilder(attachment.url, {
                            name: attachment.name
                        });

                        evidence.push({
                            originalUrl: attachment.url,
                            name: attachment.name,
                            type: attachment.contentType,
                            size: (attachment.size / 1024 / 1024).toFixed(2) + 'MB',
                            attachment: attachmentBuilder
                        });

                        // Create file preview embed
                        const previewEmbed = new EmbedBuilder()
                            .setColor(EMBED_COLORS.DEFAULT)
                            .setTitle(`✅ Added ${attachment.name}`)
                            .addFields(
                                {name: 'Type', value: attachment.contentType, inline: true},
                                {name: 'Size', value: (attachment.size / 1024 / 1024).toFixed(2) + 'MB', inline: true}
                            );

                        if (attachment.contentType.startsWith('image/')) {
                            previewEmbed.setImage(attachment.url);
                        }

                        const confirmMsg = await modalInteraction.followUp({
                            embeds: [previewEmbed],
                            ephemeral: true
                        });
                        
                        cleanupQueue.push(confirmMsg);
                    }
                } catch (error) {
                    console.error('Error processing files:', error);
                    const errorMsg = await modalInteraction.followUp({
                        content: '❌ Error processing your files. Please try again.',
                        ephemeral: true
                    });
                    cleanupQueue.push(errorMsg);
                }
            });

            collector.on('end', async (collected, reason) => {
                const cancelled = reason === 'userCancelled' || reason === 'time';

                if (cancelled) {
                    await modalInteraction.followUp({
                        content: '❌ Report cancelled',
                        ephemeral: true
                    });
                    return;
                }

                // Create file list embed
                const fileListEmbed = new EmbedBuilder()
                    .setColor(EMBED_COLORS.SUCCESS)
                    .setTitle(`📦 Collected Evidence (${evidence.length} files)`)
                    .setDescription(evidence.length > 0 ?
                        evidence.map(e => `${e.name} - ${e.type} (${e.size})`).join('\n') :
                        "No files provided");

                // Add to existing report embed
                reportEmbed.addFields({
                    name: `Attachments (${evidence.length})`,
                    value: evidence.length > 0
                        ? evidence.map(e => e.name).join('\n')
                        : 'No files attached'
                });
                
                // Add case ID to report embed
                reportEmbed.addFields({
                    name: 'Case ID',
                    value: caseId
                });

                // Send to webhook if configured
                if (config.REPORT_WEBHOOK_URL) {
                    try {
                        const webhookClient = new WebhookClient({url: config.REPORT_WEBHOOK_URL});
                        
                        // Extract AttachmentBuilders from evidence array
                        const evidenceFiles = evidence.map(e => e.attachment);
                        
                        await webhookClient.send({
                            username: 'GNOME Nepal Report System',
                            avatarURL: interaction.client.user.displayAvatarURL(),
                            embeds: [reportEmbed],
                            files: evidenceFiles, // Send directly as AttachmentBuilder objects
                            content: `**Reporter Information**\n${reporterInfo}`
                        });

                        console.log(`Report submitted by ${interaction.user.tag} (${interaction.user.id}) with ${evidence.length} attachments`);
                    } catch (error) {
                        console.error('Error sending report to webhook:', error);
                        // Send fallback message to log channel if webhook fails
                        if (config.REPORT_LOG_CHANNEL_ID) {
                            try {
                                const channel = await interaction.client.channels.fetch(config.REPORT_LOG_CHANNEL_ID);
                                await channel.send({
                                    embeds: [reportEmbed], 
                                    files: evidence.map(e => e.attachment)
                                });
                            } catch (err) {
                                console.error('Error sending report to log channel:', err);
                            }
                        }
                    }
                } else {
                    console.warn('REPORT_WEBHOOK_URL not configured. Reports will not be forwarded.');
                }

                // Final confirmation
                const confirmationEmbed = new EmbedBuilder()
                    .setColor(EMBED_COLORS.SUCCESS)
                    .setDescription([
                        `✅ Report submitted with ${evidence.length} files`,
                        `**Case ID:** ${caseId}`,
                        "Moderators will review your submission shortly"
                    ].join('\n'));

                await modalInteraction.followUp({
                    embeds: [confirmationEmbed, fileListEmbed],
                    ephemeral: true
                });
                
                // Perform message cleanup
                try {
                    setTimeout(async () => {
                        await Promise.all(cleanupQueue.map(async msg => {
                            if (msg.deletable) {
                                await msg.delete().catch(() => {});
                            }
                        }));
                    }, 5000); // Delay cleanup by 5 seconds to ensure all messages are processed
                } catch (cleanupError) {
                    console.error('Error during cleanup:', cleanupError);
                }
            });
        } catch (error) {
            if (error.code === 'InteractionCollectorError') {
                console.log(`Report modal timed out for ${interaction.user.tag}`);
            } else {
                console.error('Error handling report modal:', error);
            }
        }
    }
};
