const { memeApi } = require('../../api.js');
const { EMBED_COLORS, RANDOM_MEME } = require('../../constants.js');

module.exports = {
    name: 'meme',
    description: 'Fetches a random meme from Reddit',
    async execute(message) {
        try {
            console.log(`Making request to ${RANDOM_MEME}`);
            
            const response = await memeApi.get('/gimme');
            const data = response.data;

            if (!data || !data.url) {
                console.error('Invalid API response:', data);
                await message.reply({ content: 'There was an error while fetching the meme!', flags: 64 });
                return;
            }

            // Build embed with new data structure
            const embed = {
                title: data.title,
                description: `From r/${data.subreddit}`,
                image: { url: data.url },
                color: EMBED_COLORS.DEFAULT,
                footer: { text: `👍 ${data.ups} | Author: ${data.author}` }
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching meme:', error);
            
            let errorMessage = 'An unexpected error occurred. Please try again later.';
            if (error.response) {
                if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            await message.reply({ 
                content: `❌ Error: ${errorMessage}`,
                flags: 64 
            });
        }
    }
};
