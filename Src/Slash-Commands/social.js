const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
                                                                const { MESSAGE_COLLECTOR_TIMEOUT, EMBED_COLORS, remainingTime } = require('../../constants.js');

                                                                module.exports = {
                                                                    data: new SlashCommandBuilder()
                                                                        .setName('social')
                                                                        .setDescription('Provides social media links for the organization.'),
                                                                    async execute(interaction) {
                                                                        const embed = new EmbedBuilder()
                                                                            .setColor(EMBED_COLORS.DEFAULT)
                                                                            .setTitle('Follow Us on Social Media')
                                                                            .setDescription('Stay connected with us through our social media channels.')
                                                                            .addFields(
                                                                                { name: 'Twitter', value: 'https://twitter.com/gnome_nepal', inline: true },
                                                                                { name: 'Facebook', value: '@gnome_nepal](https://m.facebook.com/61560797123131/)', inline: true },
                                                                                { name: 'Instagram', value: '@gnome_nepal](https://www.instagram.com/gnomenepal/)', inline: true }
                                                                            )
                                                                            .setFooter({ text: 'Thank you for your support!' });

                                                                        const options = [
                                                                            {
                                                                                label: 'Website',
                                                                                description: 'Visit our website',
                                                                                value: '[GNOME Nepal](https://nepal.gnome.org/)',
                                                                                emoji: '🌐'
                                                                            },
                                                                            {
                                                                                label: 'Facebook',
                                                                                description: 'Follow us on Facebook',
                                                                                value: '[@gnome_nepal](https://m.facebook.com/61560797123131/)',
                                                                                emoji: '📘'
                                                                            },
                                                                            {
                                                                                label: 'Instagram',
                                                                                description: 'Follow us on Instagram',
                                                                                value: '[@gnome_nepal](https://www.instagram.com/gnomenepal/)',
                                                                                emoji: '📸'
                                                                            },
                                                                            {
                                                                                label: 'LinkedIn',
                                                                                description: 'Connect with us on LinkedIn',
                                                                                value: 'https://www.linkedin.com/company/gnomenepal/posts/?feedView=all (@gnomenepal)',
                                                                                emoji: '🔗'
                                                                            }
                                                                        ];

                                                                        const row = new ActionRowBuilder()
                                                                            .addComponents(
                                                                                new StringSelectMenuBuilder()
                                                                                    .setCustomId('select-social')
                                                                                    .setPlaceholder('Select a social media platform')
                                                                                    .addOptions(options)
                                                                            );

                                                                        let remainingTimeLocal = remainingTime;
                                                                        const message = await interaction.reply({
                                                                            content: `Time remaining: ${remainingTimeLocal} seconds`,
                                                                            embeds: [embed],
                                                                            components: [row]
                                                                        });

                                                                        const filter = i => i.customId === 'select-social' && i.user.id === interaction.user.id;
                                                                        const collector = interaction.channel.createMessageComponentCollector({ filter, time: MESSAGE_COLLECTOR_TIMEOUT });

                                                                        const interval = setInterval(async () => {
                                                                            remainingTimeLocal -= 1;
                                                                            if (remainingTimeLocal <= 0) {
                                                                                clearInterval(interval);
                                                                            } else {
                                                                                await message.edit({ content: `Time remaining: ${remainingTimeLocal} seconds` });
                                                                            }
                                                                        }, 1000);

                                                                        collector.on('collect', async i => {
                                                                            const selectedOption = options.find(option => option.value === i.values[0]);
                                                                            await i.reply({ content: `You selected: ${selectedOption.label} - ${selectedOption.value}`, ephemeral: true });
                                                                        });

                                                                        collector.on('end', async () => {
                                                                            clearInterval(interval);
                                                                            const disabledRow = new ActionRowBuilder()
                                                                                .addComponents(
                                                                                    new StringSelectMenuBuilder()
                                                                                        .setCustomId('select-social')
                                                                                        .setPlaceholder('Select a social media platform')
                                                                                        .addOptions(options)
                                                                                        .setDisabled(true)
                                                                                );
                                                                            await message.edit({ content: 'Time expired. Please use the command again to view social media links.', components: [disabledRow] });
                                                                        });
                                                                    },
                                                                };