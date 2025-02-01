const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { CONTRIBUTORS_URL } = require('../../config-global');
const { MESSAGE_COLLECTOR_TIMEOUT } = require('../../constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contributors')
        .setDescription('Displays the list of contributors from the GNOME Nepal GitHub organization.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await axios.get(CONTRIBUTORS_URL);
            const contributors = response.data;

            let currentIndex = 0;
            let remainingTime = MESSAGE_COLLECTOR_TIMEOUT / 1000;

            const createEmbed = (contributor, index) => new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle(`👤 ${contributor.login}`)
                .setURL(contributor.html_url)
                .setThumbnail(contributor.avatar_url)
                .addFields(
                    { name: 'Contributions', value: `${contributor.contributions}`, inline: true },
                    { name: 'GitHub Profile', value: contributor.html_url, inline: false },
                    { name: 'Name', value: contributor.name || 'N/A', inline: true },
                    { name: 'Location', value: contributor.location || 'N/A', inline: true },
                    { name: 'Bio', value: contributor.bio || 'N/A', inline: false },
                    { name: 'Company', value: contributor.company || 'N/A', inline: true },
                    { name: 'Blog', value: contributor.blog || 'N/A', inline: true }
                )
                .setFooter({ text: `Contributor ${index + 1} of ${contributors.length}` });

            const createActionRow = (index) => new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === contributors.length - 1)
            );

            const updateMessage = async () => {
                await interaction.editReply({
                    content: `Time remaining: ${remainingTime} seconds`,
                    embeds: [createEmbed(contributors[currentIndex], currentIndex)],
                    components: [createActionRow(currentIndex)]
                });
            };

            const message = await interaction.editReply({
                content: `Time remaining: ${remainingTime} seconds`,
                embeds: [createEmbed(contributors[currentIndex], currentIndex)],
                components: [createActionRow(currentIndex)]
            });

            const filter = (i) => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: MESSAGE_COLLECTOR_TIMEOUT });

            const interval = setInterval(async () => {
                remainingTime -= 1;
                if (remainingTime <= 0) {
                    clearInterval(interval);
                } else {
                    await updateMessage();
                }
            }, 1000);

            collector.on('collect', async (i) => {
                currentIndex += i.customId === 'prev' ? -1 : 1;
                await i.update({
                    content: `Time remaining: ${remainingTime} seconds`,
                    embeds: [createEmbed(contributors[currentIndex], currentIndex)],
                    components: [createActionRow(currentIndex)]
                });
            });

            collector.on('end', async () => {
                clearInterval(interval);
                try {
                    await message.edit({
                        content: 'The time limit for changing contributors has ended.',
                        components: []
                    });
                } catch (error) {
                    if (error.code === 10008) {
                        console.error('Message not found:', error);
                    } else {
                        console.error('Error editing message:', error);
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching contributors:', error);
            await interaction.editReply('There was an error fetching the contributors list.');
        }
    },
};