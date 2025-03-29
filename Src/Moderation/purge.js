const config = require('../../config-global');
const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {EMBED_COLORS, cooldown, COOLDOWN_TIME} = require('../../constants');

module.exports = {
    name: 'purge',
    description: 'Deletes a specified number of messages from a channel.',
    async execute(message, args) {
        if (!message.content.startsWith(config.prefix) || message.author.bot) return;

        const commandName = message.content.slice(config.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        if (commandName !== this.name) return;

        if (cooldown.has(message.author.id)) {
            return message.reply('You are on cooldown. Please wait a few seconds before using this command again.');
        }

        const numMessages = parseInt(args[0], 10);
        if (isNaN(numMessages) || numMessages < 1 || numMessages > 50) {
            return message.reply('Please provide a number between 1 and 50.');
        }

        try {
            const fetched = await message.channel.messages.fetch({limit: numMessages + 1});
            const totalMessages = fetched.size;

            if (totalMessages === 0) {
                return message.reply('No messages found to delete.');
            }

            await message.delete();

            const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.DEFAULT)
                .setDescription(`Are you sure you want to delete ${totalMessages - 1} messages in this channel?\n\n > **Note: ⚠️ Due to Discord policy, I cannot delete messages older than 14 days.**`)
                .setFooter({text: `Command run by ${message.author.tag}`, iconURL: message.author.displayAvatarURL()});

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('confirm').setLabel('Yes').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('cancel').setLabel('Nevermind').setStyle(ButtonStyle.Danger)
            );

            const confirmationMessage = await message.channel.send({embeds: [embed], components: [row]});

            const filter = i => i.customId === 'confirm' || i.customId === 'cancel';
            const collector = confirmationMessage.createMessageComponentCollector({filter, time: 15000});

            collector.on('collect', async i => {
                if (i.customId === 'confirm') {
                    const fetched = await message.channel.messages.fetch({limit: numMessages + 1});
                    const filtered = fetched.filter(msg => msg.id !== confirmationMessage.id);
                    const deleted = await message.channel.bulkDelete(filtered, true);
                    const totalDeleted = deleted.size;

                    if (totalDeleted === 0) {
                        await confirmationMessage.delete();
                        return message.channel.send('⚠️ Due to Discord policy, I cannot delete messages older than 14 days.');
                    }

                    const successEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLORS.SUCCESS)
                        .setDescription(`Successfully deleted ${totalDeleted} messages in this channel.`)
                        .setFooter({
                            text: `Command run by ${message.author.tag}`,
                            iconURL: message.author.displayAvatarURL()
                        });

                    try {
                        await confirmationMessage.edit({embeds: [successEmbed], components: []});
                    } catch (error) {
                        if (error.code !== 10008) {
                            console.error('Error updating message:', error);
                        }
                    }
                } else {
                    try {
                        await i.update({content: 'Purge operation canceled.', components: []});
                    } catch (error) {
                        if (error.code !== 10008) {
                            console.error('Error updating message:', error);
                        }
                    }
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    try {
                        await confirmationMessage.edit({content: 'Purge operation timed out.', components: []});
                    } catch (error) {
                        if (error.code !== 10008) {
                            console.error('Error editing message:', error);
                        }
                    }
                }
            });

            cooldown.add(message.author.id);
            setTimeout(() => cooldown.delete(message.author.id), COOLDOWN_TIME);
        } catch (error) {
            const errorMessage = new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription('There was an error trying to delete messages in this channel.')
                .setFooter({text: `Command run by ${message.author.tag}`, iconURL: message.author.displayAvatarURL()});

            if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                console.error('Connection timeout error:', error);
                errorMessage.setDescription('There was a connection timeout error while trying to delete messages in this channel.');
            } else {
                console.error('Error deleting messages:', error);
            }

            const errorMsg = await message.channel.send({embeds: [errorMessage]});
            setTimeout(() => errorMsg.delete(), COOLDOWN_TIME);
        }
    },
};