const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
                        const { MESSAGE_COLLECTOR_TIMEOUT, EMBED_COLORS, remainingTime } = require('../../constants.js');

                        module.exports = {
                            data: new SlashCommandBuilder()
                                .setName('social')
                                .setDescription('Provides social media links for the organization.'),
                            async execute(interaction) {
                                try {
                                    const embed = new EmbedBuilder()
                                        .setColor(EMBED_COLORS.DEFAULT)
                                        .setTitle('Follow Us on Social Media')
                                        .setDescription('Stay connected with us through our social media channels. Use the dropdown menu below to select a platform.')
                                        .setFooter({ text: 'Drop Suggestion in any Platforms' });

                                    const options = [
                                        {
                                            label: 'Website',
                                            description: 'Visit our website',
                                            value: 'website',
                                            emoji: '🌐'
                                        },
                                        {
                                            label: 'Facebook',
                                            description: 'Follow us on Facebook',
                                            value: 'facebook',
                                            emoji: '📘'
                                        },
                                        {
                                            label: 'Instagram',
                                            description: 'Follow us on Instagram',
                                            value: 'instagram',
                                            emoji: '📸'
                                        },
                                        {
                                            label: 'LinkedIn',
                                            description: 'Connect with us on LinkedIn',
                                            value: 'linkedin',
                                            emoji: '🔗'
                                        }
                                    ];

                                    const socialLinks = {
                                        website: 'https://nepal.gnome.org/',
                                        facebook: 'https://m.facebook.com/61560797123131/',
                                        instagram: 'https://www.instagram.com/gnomenepal/',
                                        linkedin: 'https://www.linkedin.com/company/gnomenepal/posts/?feedView=all'
                                    };

                                    const row = new ActionRowBuilder()
                                        .addComponents(
                                            new StringSelectMenuBuilder()
                                                .setCustomId('select-social')
                                                .setPlaceholder('Select a social media platform')
                                                .addOptions(options)
                                        );

                                    let remainingTimeLocal = remainingTime;

                                    await interaction.reply({
                                        content: `Time remaining: ${remainingTimeLocal} seconds`,
                                        embeds: [embed],
                                        components: [row]
                                    });

                                    // Get the message after replying
                                    const message = await interaction.fetchReply();

                                    const filter = i => i.customId === 'select-social' && i.user.id === interaction.user.id;
                                    const collector = message.createMessageComponentCollector({
                                        filter,
                                        time: MESSAGE_COLLECTOR_TIMEOUT
                                    });

                                    const interval = setInterval(async () => {
                                        remainingTimeLocal -= 1;
                                        if (remainingTimeLocal <= 0) {
                                            clearInterval(interval);
                                        } else {
                                            try {
                                                await message.edit({ content: `Time remaining: ${remainingTimeLocal} seconds` });
                                            } catch (error) {
                                                console.error('Failed to update timer:', error);
                                                clearInterval(interval);
                                            }
                                        }
                                    }, 1000);

                                    collector.on('collect', async i => {
                                        const selected = i.values[0];
                                        const selectedOption = options.find(option => option.value === selected);
                                        const link = socialLinks[selected];

                                        // Create a button that links directly to the website
                                        const linkButton = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setLabel(`Visit ${selectedOption.label}`)
                                                    .setURL(link)
                                                    .setStyle(ButtonStyle.Link)
                                                    .setEmoji(selectedOption.emoji)
                                            );

                                        await i.reply({
                                            content: `Click the button below to visit our ${selectedOption.label} page:`,
                                            components: [linkButton],
                                            flags: MessageFlags.Ephemeral
                                        });
                                    });

                                    collector.on('end', async () => {
                                        clearInterval(interval);
                                        const disabledRow = new ActionRowBuilder()
                                            .addComponents(
                                                new StringSelectMenuBuilder()
                                                    .setCustomId('select-social')
                                                    .setPlaceholder('Selection time expired')
                                                    .addOptions(options)
                                                    .setDisabled(true)
                                            );

                                        try {
                                            await message.edit({
                                                content: 'Time expired. Please use the command again to view social media links.',
                                                components: [disabledRow]
                                            });
                                        } catch (error) {
                                            console.error('Failed to update message after timer ended:', error);
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error in social command:', error);
                                    if (!interaction.replied && !interaction.deferred) {
                                        await interaction.reply({
                                            content: 'There was an error executing this command!',
                                            flags: 64
                                        });
                                    }
                                }
                            },
                        };