const { memeApi, endpoints } = require('../../api');

module.exports = {
  name: 'meme',
  description: 'Fetches a random meme',
  async execute(message) {
    try {
      console.log(`Making request to ${endpoints.RANDOM_MEME}`);

      const response = await memeApi.get(endpoints.RANDOM_MEME);

      // Log quota information
      const quotaUsed = response.headers['x-api-quota-used'];
      const quotaLeft = response.headers['x-api-quota-left'];
      console.log(`Quota Used: ${quotaUsed}, Quota Left: ${quotaLeft}`);

      // Validate response
      if (!response.data || !response.data.url) {
        console.error('Invalid API response: Missing meme URL');
        await message.reply({
          content: 'There was an error while fetching the meme!',
          flags: 64,
        });
        return;
      }

      // Extract meme details
      const memeUrl = response.data.url;
      const memeDescription = response.data.description || 'Enjoy this meme!';

      // Create an embed
      const embed = {
        title: 'Random Meme',
        description: memeDescription,
        image: { url: memeUrl },
        color: 16744192,
      };

      // Reply with the embed
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching meme:', error);

      if (error.response) {
        const { status } = error.response;

        if (status === 401) {
          await message.reply({
            content: 'Invalid API key. Please check your configuration.',
            flags: 64,
          });
        } else if (status === 404) {
          await message.reply({
            content: 'Meme not found. Please try again later.',
            flags: 64,
          });
        } else if (status === 429) {
          await message.reply({
            content: 'API quota exceeded. Please try again tomorrow.',
            flags: 64,
          });
        } else {
          await message.reply({
            content: 'There was an error while fetching the meme!',
            flags: 64,
          });
        }
      } else {
        await message.reply({
          content: 'An unexpected error occurred. Please try again later.',
          flags: 64,
        });
      }
    }
  },
};
