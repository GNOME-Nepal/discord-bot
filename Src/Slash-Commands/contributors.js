const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const axios = require('axios');
const {CONTRIBUTORS_URL} = require('../../Utils/bot/config-global');
const {MESSAGE_COLLECTOR_TIMEOUT, remainingTime, createEmbed, EMBED_COLORS} = require('../../Utils/cmds/constants.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contributors')
        .setDescription('Displays the list of contributors from the GNOME Nepal GitHub organization.'),
    name: 'contributors',
    description: 'Displays the list of contributors from the GNOME Nepal GitHub organization.',
    syntax: '/contributors',
    usage: '/contributors',
    emoji: '👥',
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await axios.get(CONTRIBUTORS_URL);
            const contributors = response.data;
            let currentIndex = 0;
            let remainingTimeLocal = remainingTime;

            const createActionRow = (index) => new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev').setLabel('Previous')
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
                    content: `Time remaining: ${remainingTimeLocal} seconds`,
                    embeds: [createEmbed(contributors[currentIndex], currentIndex, contributors.length, EMBED_COLORS.DEFAULT)],
                    components: [createActionRow(currentIndex)]
                });
            };

            const message = await interaction.editReply({
                content: `Time remaining: ${remainingTimeLocal} seconds`,
                embeds: [createEmbed(contributors[currentIndex], currentIndex, contributors.length, EMBED_COLORS.DEFAULT)],
                components: [createActionRow(currentIndex)]
            });

            const filter = (i) => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({filter, time: MESSAGE_COLLECTOR_TIMEOUT});

            const interval = setInterval(async () => {
                remainingTimeLocal -= 1;
                if (remainingTimeLocal <= 0) {
                    clearInterval(interval);
                } else {
                    await updateMessage();
                }
            }, 1000);

            collector.on('collect', async (i) => {
                currentIndex += i.customId === 'prev' ? -1 : 1;
                await i.update({
                    content: `Time remaining: ${remainingTimeLocal} seconds`,
                    embeds: [createEmbed(contributors[currentIndex], currentIndex, contributors.length, EMBED_COLORS.DEFAULT)],
                    components: [createActionRow(currentIndex)]
                });
            });

            collector.on('end', async () => {
                clearInterval(interval);
                const disabledActionRow = createActionRow(currentIndex).components.map(button => button.setDisabled(true));
                await message.edit({
                    content: 'The time limit for changing contributors has ended.',
                    components: [new ActionRowBuilder().addComponents(disabledActionRow)]
                });
            });

        } catch (error) {
            console.error('Error fetching contributors:', error);
            await interaction.editReply('There was an error fetching the contributors list.');
        }
    },
};
