/**
 * UBUCON-Asia@2025 - Guess the Mascot Event
 * ====================================
 * * Core Features:
 *  * - Hybrid Verification: Combines Wikipedia API checks with local animal list validation
 *  * - Contextual Feedback: Color-coded embeds (Green: correct guess, Yellow: mixed content, Gray: valid animal)
 *  * - Message Tracing: Built-in message jump buttons for moderation
 *  * - Performance Optimizations:
 *  *   - Multi-word combination analysis
 *  *   - Short-circuit validation for common animals
 *  *   - Asynchronous batch processing
 *  * - Fault Tolerance:
 *  *   - Automated API error fallback
 *  *   - Content sanitization (3+ character word filtering)
 *  *   - Ephemeral user notifications
 *  *
 *  * System Integration:
 *  * - Discord.js event handling architecture
 *  * - Wikipedia REST API integration
 *  * - Configurable through external JSON files
 *  * - Comprehensive logging system
 *  *
 */

const {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const botanicZooApi = require('botanic-zoo-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const eventConfig = require('../event.json');
const MONITORED_CHANNEL_ID = eventConfig.Channel_id;
const INCORRECT_GUESS_EMOJI = '<:gnome:1342508917560971325>';
const CORRECT_GUESS_EMOJI = '<:gnome:1342508917560971325>';
const MASCOT = eventConfig.Mascot.toLowerCase();

// API URL for animal search
// Using Wikipedia API instead of A-Z Animals due to 403 errors
const WIKI_API_URL =
  'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=';

// List of valid animal keywords - used as fallback when API is unavailable
const ANIMAL_KEYWORDS = [
  'acadian flycatcher',
  'achrioptera manga',
  'ackie monitor',
  'addax',
  'adélie penguin',
  'admiral butterfly',
  'aesculapian snake',
  'affenpinscher',
  'afghan hound',
  'african bullfrog',
  'african bush elephant',
  'african civet',
  'african clawed frog',
  'african elephant',
  'african fish eagle',
  'african forest elephant',
  'african golden cat',
  'african grey parrot',
  'african jacana',
  'african palm civet',
  'african penguin',
  'african sugarcane borer',
  'african tree toad',
  'african wild dog',
  'africanized bee (killer bee)',
  'agama lizard',
  'agkistrodon contortrix',
  'agouti',
  'aidi',
  'ainu',
  'airedale terrier',
  'airedoodle',
  'akbash',
  'akita',
  'akita shepherd',
  'alabai (central asian shepherd)',
  'red panda',
  'alaskan husky',
  'alaskan klee kai',
  'alaskan malamute',
  'alaskan pollock',
  'alaskan shepherd',
  'albacore tuna',
  'albatross',
  'albertonectes',
  'albino (amelanistic) corn snake',
  'aldabra giant tortoise',
  'alligator gar',
  'allosaurus',
  'alpaca',
  'alpine dachsbracke',
  'alpine goat',
  'alusky',
  'amano shrimp',
  'amargasaurus',
  'amazon parrot',
  'amazon river dolphin (pink dolphin)',
  'amazon tree boa',
  'amazonian royal flycatcher',
  'amberjack',
  'ambrosia beetle',
  'american alligator',
  'lion',
  'tiger',
  'bear',
  'elephant',
  'giraffe',
  'zebra',
  'monkey',
  'gorilla',
  'panda',
  'koala',
  'kangaroo',
  'penguin',
  'dolphin',
  'whale',
  'shark',
  'octopus',
  'eagle',
  'owl',
  'parrot',
  'flamingo',
  'crocodile',
  'snake',
  'turtle',
  'frog',
  'butterfly',
  'bee',
  'ant',
  'spider',
  'wolf',
  'fox',
  'deer',
  'rabbit',
  'squirrel',
  'cat',
  'dog',
  'horse',
  'cow',
  'sheep',
  'goat',
  'pig',
  'chicken',
  'duck',
  'bird',
  'insect',
  'fish',
  'crab',
  'lobster',
  'snail',
  'slug',
  'flea',
  'fly',
  'beetle',
  'ant',
  'spider',
  'scorpion',
  'centipede',
  'moth',
  'butterfly',
  'ladybug',
  'grasshopper',
  'cicada',
  'dragonfly',
  'lacewing',
  'lionfish',
  'lobster',
  'crab',
  'snail',
  'slug',
  'flea',
  'fly',
  'beetle',
  'ant',
  'spider',
  'scorpion',
  'centipede',
  'moth',
  'butterfly',
  'ladybug',
  'grasshopper',
  'cicada',
  'dragonfly',
  'lacewing',
  'lionfish',
].map((animal) => animal.toLowerCase()); // Convert all to lowercase

/**
 * Custom function to search for animals using the Wikipedia API
 * @param {string} searchTerm - The animal name to search for
 * @returns {Promise<boolean>} - True if the animal exists, false otherwise
 */
async function searchAnimal(searchTerm) {
  try {
    // First, check if the term is in our predefined list of animals
    // This is a quick check that doesn't require an API call
    const lowerTerm = searchTerm.toLowerCase();
    if (ANIMAL_KEYWORDS.includes(lowerTerm)) {
      return true;
    }

    // For terms not in our list, use the Wikipedia API
    // Use the Wikipedia API to search for the term (without adding 'animal')
    const url = `${WIKI_API_URL}${encodeURIComponent(searchTerm)}`;

    const response = await axios.get(url);

    // Check if the response contains search results
    if (response.data && response.data.query && response.data.query.search) {
      // We need to be more selective about what we consider an animal
      // Look for specific animal classification terms in the top results
      const animalClassificationTerms = [
        'species',
        'genus',
        'family',
        'order',
        'class',
        'phylum',
        'kingdom',
        'mammal',
        'bird',
        'reptile',
        'amphibian',
        'fish',
        'insect',
        'arachnid',
        'taxonomy',
        'zoology',
        'wildlife',
        'fauna',
        'anime',
      ];

      // Check the top 3 results (or fewer if there are less than 3)
      const topResults = response.data.query.search.slice(0, 3);

      // Count how many animal-related terms appear in each result
      for (const result of topResults) {
        const lowerTitle = result.title.toLowerCase();
        const lowerSnippet = result.snippet.toLowerCase();

        // If the title exactly matches our search term and contains animal classification terms
        if (lowerTitle.includes(searchTerm.toLowerCase())) {
          let animalTermCount = 0;

          // Count animal classification terms in the snippet
          for (const term of animalClassificationTerms) {
            if (lowerSnippet.includes(term)) {
              animalTermCount++;
            }
          }

          // If we found at least 2 animal classification terms, consider it an animal
          if (animalTermCount >= 2) {
            return true;
          }
        }
      }
    }

    // If we get here, we didn't find enough evidence that this is an animal
    return false;
  } catch (error) {
    console.error(
      `Error searching for animal "${searchTerm}" using Wikipedia API:`,
      error.message,
    );
    return false;
  }
}

/**
 * Checks if a message contains any animal keywords
 * @param {string} content - The message content to check
 * @returns {Promise<{isAnimal: boolean, animalName: string|null, nonAnimalWords: string[]}>} - Object with result, animal name if found, and non-animal words
 */
async function containsAnimalKeyword(content) {
  const words = content.toLowerCase().split(/\s+/);
  const nonAnimalWords = [];

  const lowerContent = content.toLowerCase();
  const negativeIndicators = [
    'not an animal',
    "isn't an animal",
    'is not an animal',
    'no animal',
  ];
  for (const indicator of negativeIndicators) {
    if (lowerContent.includes(indicator)) {
      return {
        isAnimal: false,
        animalName: null,
        nonAnimalWords: words.filter((w) => w.length >= 3),
      };
    }
  }

  if (content.length >= 3) {
    try {
      const isAnimal = await searchAnimal(content.toLowerCase());

      if (isAnimal) {
        return {
          isAnimal: true,
          animalName: content.toLowerCase(),
          nonAnimalWords: [],
        };
      }
    } catch (error) {}
  }

  const wordCombinations = [];

  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length >= 2 && words[i + 1].length >= 2) {
      wordCombinations.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  for (let i = 0; i < words.length - 2; i++) {
    if (
      words[i].length >= 2 &&
      words[i + 1].length >= 2 &&
      words[i + 2].length >= 2
    ) {
      wordCombinations.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  for (const combination of wordCombinations) {
    try {
      const isAnimal = await searchAnimal(combination);

      if (isAnimal) {
        const combinationWords = combination.split(/\s+/);
        const otherWords = words.filter((w) => !combinationWords.includes(w));

        return {
          isAnimal: true,
          animalName: combination,
          nonAnimalWords: otherWords.filter((w) => w.length >= 3), // Only include words with 3+ chars
        };
      }
    } catch (error) {}
  }

  for (const word of words) {
    if (word.length < 3) {
      nonAnimalWords.push(word);
      continue; // Skip very short words
    }

    try {
      const isAnimal = await searchAnimal(word);

      if (isAnimal) {
        nonAnimalWords.push(...words.filter((w) => w !== word));
        return {
          isAnimal: true,
          animalName: word,
          nonAnimalWords: nonAnimalWords.filter((w) => w.length >= 3), // Only include words with 3+ chars
        };
      } else {
        nonAnimalWords.push(word);
      }
    } catch (error) {
      nonAnimalWords.push(word);
    }
  }

  const multiWordAnimals = ANIMAL_KEYWORDS.filter((keyword) =>
    keyword.includes(' '),
  ).sort((a, b) => b.length - a.length);

  for (const animal of multiWordAnimals) {
    if (lowerContent.includes(animal)) {
      const animalWords = animal.split(' ');
      const filteredNonAnimalWords = nonAnimalWords.filter(
        (word) => !animalWords.includes(word),
      );

      return {
        isAnimal: true,
        animalName: animal,
        nonAnimalWords: filteredNonAnimalWords.filter((w) => w.length >= 3),
      };
    }

    const animalWords = animal.split(' ');
    if (animalWords.every((word) => lowerContent.includes(word))) {
      const filteredNonAnimalWords = nonAnimalWords.filter(
        (word) => !animalWords.includes(word),
      );

      return {
        isAnimal: true,
        animalName: animal,
        nonAnimalWords: filteredNonAnimalWords.filter((w) => w.length >= 3),
      };
    }
  }

  const singleWordAnimal = ANIMAL_KEYWORDS.filter(
    (keyword) => !keyword.includes(' '),
  ).find((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerContent);
  });

  if (singleWordAnimal) {
    const filteredNonAnimalWords = nonAnimalWords.filter(
      (word) => word !== singleWordAnimal,
    );

    return {
      isAnimal: true,
      animalName: singleWordAnimal,
      nonAnimalWords: filteredNonAnimalWords.filter((w) => w.length >= 3),
    };
  }

  return {
    isAnimal: false,
    animalName: null,
    nonAnimalWords: nonAnimalWords.filter((w) => w.length >= 3),
  };
}

/**
 * Custom function to get animal information using the Wikipedia API
 * @param {string} animal - The animal name to get info for
 * @returns {Promise<Object>} - The animal information
 */
async function getAnimalInfo(animal) {
  try {
    const extractUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(animal)}`;
    const extractResponse = await axios.get(extractUrl);

    return {
      name: animal,
      description:
        extractResponse.data?.extract || `Learn about ${animal} on Wikipedia!`,
      imageUrl: extractResponse.data?.thumbnail?.source || '',
      wikiUrl: extractResponse.data?.content_urls?.desktop?.page || '',
    };
  } catch (error) {
    console.error(`Error getting Wikipedia data: ${error.message}`);
    return {
      name: animal,
      description: `The ${animal} is a fascinating creature!`,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(animal)}`,
    };
  }
}

/**
 * Creates an embed for user replies
 * @param {Object} animalInfo - The animal information
 * @returns {Object} - The embed for user replies
 */
function createUserReplyEmbed(animalInfo) {
  return new EmbedBuilder()
    .setTitle(`**${animalInfo.name.toUpperCase()}**`)
    .setDescription(animalInfo.description.slice(0, 2000))
    .setThumbnail(animalInfo.imageUrl)
    .addFields({
      name: ' Wikipedia Article',
      value: `[Read More](${animalInfo.wikiUrl})`,
      inline: true,
    })
    .setFooter({ text: 'UBUCON Asia 2025 - Guess the Mascot' })
    .setTimestamp();
}

/**
 * Handles a message in the monitored channel
 * @param {Object} message - The Discord message object
 */
async function handleMessage(message) {
  if (message.author.bot || message.channel.id !== MONITORED_CHANNEL_ID) return;

  try {
    const { isAnimal, animalName, nonAnimalWords } =
      await containsAnimalKeyword(message.content);
    const isCorrectGuess = isCorrectMascotGuess(message.content);

    if (isAnimal && animalName) {
      const animalInfo = await getAnimalInfo(animalName);

      const userEmbed = createUserReplyEmbed(animalInfo);
      await message.reply({
        embeds: [userEmbed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('View Full Article')
              .setStyle(ButtonStyle.Link)
              .setURL(animalInfo.wikiUrl),
          ),
        ],
      });

      const logChannel = message.guild.channels.cache.get(
        eventConfig.UbuconAsia2025,
      );
      if (logChannel) {
        let logColor, logDescription;

        if (isCorrectGuess) {
          logColor = 0x00ff00; // Green for correct guess
          logDescription = `**Correct Guess**: ${animalName}`;
        } else if (nonAnimalWords.length > 0) {
          logColor = 0xffff00; // Yellow for mixed content
          logDescription = `**Mixed Content**: ${animalName} (Non-animal words: ${nonAnimalWords.join(', ')})`;
        } else {
          logColor = 0x808080; // Gray for valid animal but not a guess
          logDescription = `**Valid Animal**: ${animalName}`;
        }

        const logEmbed = new EmbedBuilder()
          .setColor(logColor)
          .setAuthor({
            name: `${message.author.tag}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(logDescription)
          .addFields(
            {
              name: 'Channel',
              value: `<#${message.channel.id}>`,
              inline: true,
            },
            { name: 'Message ID', value: `${message.id}`, inline: true },
          )
          .setFooter({ text: 'UBUCON Asia 2025 - Guess the Mascot' })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      await message.react(isCorrectGuess ? CORRECT_GUESS_EMOJI : INCORRECT_GUESS_EMOJI);
    } else {
      await message.delete();
      const reply = await message.channel.send({
        content: `${message.author}, Please include an animal name in your guess!`,
        ephemeral: true,
      });
      setTimeout(() => reply.delete(), 5000); // 5 seconds after deleting prompt message
    }
  } catch (error) {
    console.error(`Error handling message: ${error.message}`);
  }
}

/**
 * Checks if the message is a correct guess of the mascot
 * @param {string} content - The message content to check
 * @returns {boolean} - True if the message correctly guesses the mascot
 */
function isCorrectMascotGuess(content) {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes(MASCOT)) {
    return true;
  }

  if (MASCOT.includes(' ')) {
    const mascotWords = MASCOT.split(' ');
    return mascotWords.every((word) => lowerContent.includes(word));
  }

  return false;
}

/**
 * Initializes the "Guess the Mascot" event system
 * @param {Client} client - The Discord client
 */
function initAnimalKeywordSystem(client) {
  if (!MONITORED_CHANNEL_ID) {
    console.warn(
      '[WARN] Guess the Mascot Event: No monitored channel ID specified in event.json',
    );
    return;
  }

  client.on(Events.MessageCreate, handleMessage);
  console.log(
    `[INFO] Guess the Mascot Event: Monitoring channel ${MONITORED_CHANNEL_ID}`,
  );
  console.log(`[INFO] Mascot detection system initialized`);
}

module.exports = {
  initAnimalKeywordSystem,
  containsAnimalKeyword,
};
