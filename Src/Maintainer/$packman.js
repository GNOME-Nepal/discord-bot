const {EmbedBuilder} = require('discord.js');
            const commands = require('../../commands');

            module.exports = {
                name: 'help',
                description: 'Displays a list of available maintainer commands and their descriptions.',
                execute(message) {
                    const maintainerCommands = commands.maintainer;

                    const embed = new EmbedBuilder()
                        .setColor(0xe74c3c)
                        .setTitle('Admin Help - Command List')
                        .setDescription('Below is a list of available admin commands:');

                    maintainerCommands.forEach(cmd => {
                        embed.addFields({
                            name: `${cmd.emoji} ${cmd.name}`,
                            value: `${cmd.description}\n**Syntax:** \`${cmd.syntax}\`\n**Example:** \`${cmd.usage}\``
                        });
                    });

                    embed.setFooter({ text: 'These are Admin Commands. Use "/help" for general commands.' });

                    message.channel.send({embeds: [embed]});
                },
            };