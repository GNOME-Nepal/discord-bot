const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to store restart information
const restartInfoPath = path.join(__dirname, '../../restart-info.json');

module.exports = {
  name: 'restart',
  description: 'Restarts the bot with confirmation.',
  syntax: '$packman restart',
  usage: '$packman restart',
  emoji: '🔄',
  async execute(message) {
    const yesButton = new ButtonBuilder()
      .setCustomId('restart_yes')
      .setLabel('Yes')
      .setStyle(ButtonStyle.Success);

    const noButton = new ButtonBuilder()
      .setCustomId('restart_no')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(yesButton, noButton);

    const confirmMessage = await message.reply({
      content: 'Do you really want to restart the bot?',
      components: [row],
    });

    const collector = confirmMessage.createMessageComponentCollector({
      time: 30000, // 30 seconds timeout
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: 'Only the command initiator can use these buttons.',
          ephemeral: true,
        });
      }

      if (interaction.customId === 'restart_yes') {
        await interaction.update({
          content: 'The bot is restarting...',
          components: [],
        });

        const restartInfo = {
          channelId: message.channel.id,
          messageId: confirmMessage.id,
          userId: message.author.id,
          timestamp: Date.now(),
        };

        fs.writeFileSync(restartInfoPath, JSON.stringify(restartInfo, null, 2));

        setTimeout(() => {
          try {
            const isNodemon = process.env.NODEMON || process.env._NODEMON;

            if (isNodemon) {
              console.log(
                'Bot is restarting via nodemon - Exiting process to trigger nodemon restart',
              );
              process.exit(0);
            } else {
              console.log('No nodemon detected, attempting self-restart');

              const mainScript = path.join(__dirname, '../../index.js');

              const child = spawn(process.argv[0], [mainScript], {
                detached: true,
                stdio: 'inherit',
              });

              child.unref();

              console.log('Self-restart initiated, exiting current process');
              process.exit(0);
            }
          } catch (error) {
            console.error(`Restart error: ${error}`);
            interaction
              .editReply('Failed to restart the bot.')
              .catch(console.error);
          }
        }, 3000);
      } else if (interaction.customId === 'restart_no') {
        await interaction.update({
          content: 'Restart cancelled.',
          components: [],
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        confirmMessage.edit({
          content: 'Restart command timed out.',
          components: [],
        });
      }
    });
  },
};
