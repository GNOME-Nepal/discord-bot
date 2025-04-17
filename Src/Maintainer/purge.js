const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField} = require('discord.js');
const {EMBED_COLORS, MESSAGE_COLLECTOR_TIMEOUT} = require('../../utils/constants.js');

module.exports = {
    name: 'purge',
    description: 'Deletes a specified number of messages from a channel.',
    syntax: '$packman purge <number>',
    usage: '$packman purge 10',
    emoji: '🧹',
    async execute(message, args) {
        // Check if user has permission to manage messages
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ You need the `Manage Messages` permission to use this command.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {
                }), 5000));
        }

        const numMessages = parseInt(args[0], 10);
        if (isNaN(numMessages) || numMessages < 1 || numMessages > 100) {
            return message.reply('Please provide a number between 1 and 100.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {
                }), 5000));
        }

        try {
            const fetched = await message.channel.messages.fetch({limit: numMessages + 1});
            const messagesToDelete = fetched.filter(msg => !msg.pinned && msg.deletable);

            if (messagesToDelete.size === 0) {
                return message.reply('No messages found to delete, or messages are too old (>14 days).')
                    .then(msg => setTimeout(() => msg.delete().catch(() => {
                    }), 5000));
            }

            await message.delete().catch(() => {
            });

            const authorId = message.author.id;

            const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.WARNING)
                .setDescription(`Are you sure you want to delete ${messagesToDelete.size} messages in this channel?\n\n > **Note: ⚠️ Due to Discord policy, I cannot delete messages older than 14 days.**`)
                .setFooter({text: `Command run by ${message.author.tag}`, iconURL: message.author.displayAvatarURL()});

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`confirm_purge_${authorId}`).setLabel('Yes').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`cancel_purge_${authorId}`).setLabel('Nevermind').setStyle(ButtonStyle.Secondary)
            );

            const confirmationMessage = await message.channel.send({embeds: [embed], components: [row]});

            // Updated filter to include user ID verification
            const filter = i =>
                (i.customId === `confirm_purge_${authorId}` || i.customId === `cancel_purge_${authorId}`) &&
                i.user.id === authorId;

            const collector = confirmationMessage.createMessageComponentCollector({
                filter,
                time: MESSAGE_COLLECTOR_TIMEOUT
            });

            collector.on('collect', async i => {
                // Extra check to ensure only original user can interact
                if (i.user.id !== authorId) {
                    return i.reply({
                        content: 'Only the user who initiated this command can interact with these buttons.',
                        flags: 64
                    });
                }

                if (i.customId === `confirm_purge_${authorId}`) {
                    try {
                        const deleted = await message.channel.bulkDelete(messagesToDelete, true);

                        const successEmbed = new EmbedBuilder()
                            .setColor(EMBED_COLORS.SUCCESS)
                            .setDescription(`Successfully deleted ${deleted.size} messages in this channel.`)
                            .setFooter({
                                text: `Command run by ${message.author.tag}`,
                                iconURL: message.author.displayAvatarURL()
                            });

                        await i.update({embeds: [successEmbed], components: []});
                    } catch (error) {
                        console.error('Error deleting messages:', error);
                        await i.update({
                            content: 'There was an error trying to delete messages. Some messages might be too old.',
                            embeds: [],
                            components: []
                        });
                    }
                } else {
                    await i.update({content: 'Purge operation canceled.', embeds: [], components: []});
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    try {
                        await confirmationMessage.edit({
                            content: 'Purge operation timed out.',
                            embeds: [],
                            components: []
                        });
                    } catch (error) {
                        if (error.code !== 10008) {
                            console.error('Error editing message:', error);
                        }
                    }
                }
            });
        } catch (error) {
            const errorMessage = new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription('There was an error trying to delete messages in this channel.')
                .setFooter({text: `Command run by ${message.author.tag}`, iconURL: message.author.displayAvatarURL()});

            console.error('Error in purge command:', error);

            const errorMsg = await message.channel.send({embeds: [errorMessage]});
            setTimeout(() => errorMsg.delete().catch(() => {
            }), 5000);
        }
    },
};
