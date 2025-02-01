const { EmbedBuilder } = require('discord.js');
const { memeApi, endpoints } = require('../../api');
const config = require('../../config-global');

module.exports = {
    name: 'meme',
    description: 'Sends a random meme from the internet.',
    async execute(message) {
        if (!message.content.startsWith(config.prefix) || message.author.bot) return;

        const commandName = message.content.slice(config.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        if (commandName !== this.name) return;

        try {
            const { data: meme, headers } = await memeApi.get(endpoints.RANDOM_MEME);

            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle(meme.title || 'Random Meme')
                .setImage(meme.url || meme.image)
                .setFooter({ text: `Powered by apileague.com | Responses left today: ${headers['x-api-quota-left'] || 'Unknown'}` });

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching meme:', error);
            message.channel.send('There was an error fetching a meme. Please try again later.');
        }
    },
};