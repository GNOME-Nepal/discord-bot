const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {memeApi} = require('../../utils/api.js');
const {EMBED_COLORS, BUTTON_TIMEOUT} = require('../../utils/constants.js');

module.exports = {
    name: 'meme',
    description: 'Fetches a random meme from Reddit',
    syntax: 'sudo meme',
    usage: 'sudo meme',
    emoji: '😂',
    async execute(message) {
        try {
            const response = await memeApi.get('/gimme');
            const data = response.data;

            if (!data || !data.url) {
                console.error('Invalid API response:', data);
                await message.reply({content: 'There was an error while fetching the meme!', flags: 64});
                return;
            }

            // Create the button
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('next_meme')
                    .setLabel('Next Meme')
                    .setStyle(ButtonStyle.Primary)
            );

            // Calculate initial remaining time in seconds
            let remainingTimeSeconds = Math.floor(BUTTON_TIMEOUT / 1000);

            // Build the embed
            const embed = this.createMemeEmbed(data, remainingTimeSeconds);

            // Send the message with the button and timer
            const sentMessage = await message.reply({
                content: `⏳ Time remaining: ${remainingTimeSeconds} seconds`,
                embeds: [embed],
                components: [row]
            });

            // Update timer every second
            const interval = setInterval(() => {
                remainingTimeSeconds--;
                if (remainingTimeSeconds >= 0) {
                    sentMessage.edit({
                        content: `⏳ Time remaining: ${remainingTimeSeconds} seconds`
                    }).catch(() => {
                    });
                }
            }, 1000);

            // Create a collector for the button
            const filter = (interaction) =>
                interaction.customId === 'next_meme' &&
                interaction.user.id === message.author.id;

            const collector = sentMessage.createMessageComponentCollector({
                filter,
                time: BUTTON_TIMEOUT
            });

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate(); // Acknowledge the interaction

                try {
                    // Fetch new meme
                    const newResponse = await memeApi.get('/gimme');
                    const newData = newResponse.data;

                    // Update the embed
                    const newEmbed = this.createMemeEmbed(newData, remainingTimeSeconds);

                    // Edit the message with the new embed
                    await interaction.editReply({
                        embeds: [newEmbed],
                        components: [row]
                    });
                } catch (error) {
                    console.error('Error fetching next meme:', error);
                    await interaction.followUp({
                        content: 'Failed to fetch next meme.',
                        flags: 64
                    });
                }
            });

            collector.on('end', () => {
                // Stop the timer
                clearInterval(interval);

                // Disable the button
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_meme')
                        .setLabel('Next Meme')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

                sentMessage.edit({
                    content: '⌛ Button expired - Use the command again for new memes',
                    components: [disabledRow]
                }).catch(console.error);
            });

        } catch (error) {
            console.error('Error fetching meme:', error);

            let errorMessage = 'An unexpected error occurred. Please try again later.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            await message.reply({
                content: `❌ Error: ${errorMessage}`,
                flags: 64
            });
        }
    },

    createMemeEmbed(data, remainingSeconds) {
        return {
            title: data.title,
            description: `From r/${data.subreddit}`,
            image: {url: data.url},
            color: EMBED_COLORS.DEFAULT,
            footer: {
                text: `👍 ${data.ups || 0} | Author: ${data.author || 'Unknown'} | Updates for ${typeof remainingSeconds === 'number' ? remainingSeconds : 0}s`
            }
        };
    }
};
