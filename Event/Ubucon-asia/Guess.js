/**
 * Botanic Zoo - Guess the Mascot Event
 * ====================================
 * This module implements a "Guess the Mascot" event where:
 * 1. Monitors messages in a specified channel
 * 2. Users try to guess the secret mascot animal
 * 3. Delete messages that don't contain animal keywords
 * 4. Reacts to valid messages with an emoji
 * 5. Logs valid messages to a designated channel
 * 6. Integrates with the Wikipedia API for animal detection and facts
 * 7. Logs when users guess the correct mascot
 * 
 * Features:
 * - Properly handles multi-word animals (like "red panda")
 * - Uses the Wikipedia API to reliably detect animals and fetch information
 * - Falls back to a predefined list of common animals when the API is unavailable
 * - Provides visual feedback with colored embeds (green for correct guesses, yellow for mixed content, gray for regular animal messages)
 * - Includes buttons to jump to the original message
 * 
 * Note: Previously used the A-Z Animals website, but switched to Wikipedia API due to 403 errors
 */

const { Client, Events, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botanicZooApi = require('botanic-zoo-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const eventConfig = require('../event.json');
const MONITORED_CHANNEL_ID = eventConfig.Channel_id;
const REACTION_EMOJI = "<:gnome:1342508917560971325>";
const MASCOT = eventConfig.Mascot.toLowerCase(); // Convert to lowercase for case-insensitive comparison

// API URL for animal search
// Using Wikipedia API instead of A-Z Animals due to 403 errors
const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=';

// List of valid animal keywords - used as fallback when API is unavailable
const ANIMAL_KEYWORDS = [
    "acadian flycatcher", "achrioptera manga", "ackie monitor", "addax", "adélie penguin",
    "admiral butterfly", "aesculapian snake", "affenpinscher", "afghan hound", "african bullfrog",
    "african bush elephant", "african civet", "african clawed frog", "african elephant",
    "african fish eagle", "african forest elephant", "african golden cat", "african grey parrot",
    "african jacana", "african palm civet", "african penguin", "african sugarcane borer",
    "african tree toad", "african wild dog", "africanized bee (killer bee)", "agama lizard",
    "agkistrodon contortrix", "agouti", "aidi", "ainu", "airedale terrier", "airedoodle", "akbash",
    "akita", "akita shepherd", "alabai (central asian shepherd)","red panda", "alaskan husky", "alaskan klee kai",
    "alaskan malamute", "alaskan pollock", "alaskan shepherd", "albacore tuna", "albatross",
    "albertonectes", "albino (amelanistic) corn snake", "aldabra giant tortoise", "alligator gar",
    "allosaurus", "alpaca", "alpine dachsbracke", "alpine goat", "alusky", "amano shrimp",
    "amargasaurus", "amazon parrot", "amazon river dolphin (pink dolphin)", "amazon tree boa",
    "amazonian royal flycatcher", "amberjack", "ambrosia beetle", "american alligator",
    "lion", "tiger", "bear", "elephant", "giraffe", "zebra", "monkey", "gorilla",
    "panda", "koala", "kangaroo", "penguin", "dolphin", "whale", "shark", "octopus",
    "eagle", "owl", "parrot", "flamingo", "crocodile", "snake", "turtle", "frog",
    "butterfly", "bee", "ant", "spider", "wolf", "fox", "deer", "rabbit", "squirrel",
    "cat", "dog", "horse", "cow", "sheep", "goat", "pig", "chicken", "duck"
].map(animal => animal.toLowerCase()); // Convert all to lowercase


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
                'species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom',
                'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'insect', 'arachnid',
                'taxonomy', 'zoology', 'wildlife', 'fauna'
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
        console.error(`Error searching for animal "${searchTerm}" using Wikipedia API:`, error.message);
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

    // Check for negative phrases that indicate it's NOT an animal
    const lowerContent = content.toLowerCase();
    const negativeIndicators = ['not an animal', 'isn\'t an animal', 'is not an animal', 'no animal'];
    for (const indicator of negativeIndicators) {
        if (lowerContent.includes(indicator)) {
            return { 
                isAnimal: false, 
                animalName: null,
                nonAnimalWords: words.filter(w => w.length >= 3)
            };
        }
    }

    // First, try the entire message as a potential multi-word animal
    if (content.length >= 3) {
        try {
            // Check if the entire content is an animal
            const isAnimal = await searchAnimal(content.toLowerCase());

            if (isAnimal) {
                return { 
                    isAnimal: true, 
                    animalName: content.toLowerCase(),
                    nonAnimalWords: [] 
                };
            }
        } catch (error) {
            // Error checking the entire content, continue with word-by-word check
        }
    }

    // Try common multi-word animals (like "red panda")
    // Generate all possible 2-word and 3-word combinations
    const wordCombinations = [];

    // Add 2-word combinations
    for (let i = 0; i < words.length - 1; i++) {
        if (words[i].length >= 2 && words[i+1].length >= 2) {
            wordCombinations.push(`${words[i]} ${words[i+1]}`);
        }
    }

    // Add 3-word combinations
    for (let i = 0; i < words.length - 2; i++) {
        if (words[i].length >= 2 && words[i+1].length >= 2 && words[i+2].length >= 2) {
            wordCombinations.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
        }
    }

    // Check each multi-word combination
    for (const combination of wordCombinations) {
        try {
            const isAnimal = await searchAnimal(combination);

            if (isAnimal) {
                // Found a multi-word animal
                // Add all other words to nonAnimalWords
                const combinationWords = combination.split(/\s+/);
                const otherWords = words.filter(w => !combinationWords.includes(w));

                return { 
                    isAnimal: true, 
                    animalName: combination,
                    nonAnimalWords: otherWords.filter(w => w.length >= 3) // Only include words with 3+ chars
                };
            }
        } catch (error) {
            // Error checking this combination, continue with next
        }
    }

    // Try each word as a potential animal name
    for (const word of words) {
        if (word.length < 3) {
            nonAnimalWords.push(word);
            continue; // Skip very short words
        }

        try {
            // Try to search for the animal using our custom function
            const isAnimal = await searchAnimal(word);

            // If it's an animal
            if (isAnimal) {
                // Add all other words to nonAnimalWords
                nonAnimalWords.push(...words.filter(w => w !== word));
                return { 
                    isAnimal: true, 
                    animalName: word,
                    nonAnimalWords: nonAnimalWords.filter(w => w.length >= 3) // Only include words with 3+ chars
                };
            } else {
                nonAnimalWords.push(word);
            }
        } catch (error) {
            // API call failed, not an animal or API error
            nonAnimalWords.push(word);
        }
    }

    // Fallback to the predefined list for common animals
    // This helps when the API is unavailable
    // Note: We already checked for negative phrases at the beginning of the function

    // First try to find multi-word animals (like "red panda")
    // Sort by length descending to prioritize longer matches (e.g., "red panda" over just "panda")
    const multiWordAnimals = ANIMAL_KEYWORDS
        .filter(keyword => keyword.includes(' '))
        .sort((a, b) => b.length - a.length);

    for (const animal of multiWordAnimals) {
        if (lowerContent.includes(animal)) {
            // Found a multi-word animal
            const animalWords = animal.split(' ');
            const filteredNonAnimalWords = nonAnimalWords.filter(word => 
                !animalWords.includes(word)
            );

            return { 
                isAnimal: true, 
                animalName: animal,
                nonAnimalWords: filteredNonAnimalWords.filter(w => w.length >= 3)
            };
        }

        // Check if all words of the animal are present, even if not in order
        const animalWords = animal.split(' ');
        if (animalWords.every(word => lowerContent.includes(word))) {
            const filteredNonAnimalWords = nonAnimalWords.filter(word => 
                !animalWords.includes(word)
            );

            return { 
                isAnimal: true, 
                animalName: animal,
                nonAnimalWords: filteredNonAnimalWords.filter(w => w.length >= 3)
            };
        }
    }

    // Then try single-word animals
    const singleWordAnimal = ANIMAL_KEYWORDS
        .filter(keyword => !keyword.includes(' '))
        .find(keyword => {
            // Make sure we're matching whole words, not parts of words
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(lowerContent);
        });

    if (singleWordAnimal) {
        // Filter out the animal keyword from nonAnimalWords
        const filteredNonAnimalWords = nonAnimalWords.filter(word => 
            word !== singleWordAnimal
        );

        return { 
            isAnimal: true, 
            animalName: singleWordAnimal,
            nonAnimalWords: filteredNonAnimalWords.filter(w => w.length >= 3) // Only include words with 3+ chars
        };
    }

    return { 
        isAnimal: false, 
        animalName: null,
        nonAnimalWords: nonAnimalWords.filter(w => w.length >= 3) // Only include words with 3+ chars
    };
}

/**
 * Custom function to get animal information using the Wikipedia API
 * @param {string} animal - The animal name to get info for
 * @returns {Promise<Object>} - The animal information
 */
async function getAnimalInfo(animal) {
    try {
        // First check if the animal exists using our custom search function
        const isAnimal = await searchAnimal(animal);

        if (!isAnimal) {
            return {}; // Not an animal or not found
        }

        // Try to get more detailed info from Wikipedia
        try {
            // Use Wikipedia's API to get an extract of the animal's page
            const extractUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(animal)}`;
            const extractResponse = await axios.get(extractUrl);

            if (extractResponse.data && extractResponse.data.extract) {
                return {
                    name: animal,
                    description: extractResponse.data.extract,
                    scientificName: extractResponse.data.title || "",
                    habitat: "",
                    diet: "",
                    // Add Wikipedia URL if available
                    url: extractResponse.data.content_urls?.desktop?.page || ""
                };
            }
        } catch (extractError) {
            console.error(`Error getting Wikipedia extract for ${animal}:`, extractError.message);
            // Continue with fallback if Wikipedia extract fails
        }

        // If Wikipedia API failed, try the botanicZooApi as a fallback
        try {
            const encodedAnimal = encodeURIComponent(animal);
            const animalInfo = await botanicZooApi.getAnimal(encodedAnimal);

            if (animalInfo && Object.keys(animalInfo).length > 0) {
                return animalInfo;
            }
        } catch (error) {
            // API call failed, continue with custom implementation
        }

        // If all APIs failed, create a basic animal info object
        return {
            name: animal,
            description: `The ${animal} is a fascinating creature in the animal kingdom!`,
            scientificName: "",
            habitat: "",
            diet: ""
        };
    } catch (error) {
        console.error(`Error getting animal info for ${animal}:`, error.message);
        return {};
    }
}

/**
 * Fetches animal facts from the API
 * @param {string} animal - The animal to fetch facts for
 * @returns {Promise<Object>} - The animal facts
 */
async function fetchAnimalFact(animal) {
    try {
        // Get animal info using our custom function
        const animalInfo = await getAnimalInfo(animal);

        // Check if we got valid data
        if (animalInfo && Object.keys(animalInfo).length > 0) {
            // If we have a description, use it as the fact
            if (animalInfo.description) {
                return { fact: animalInfo.description };
            }

            // Otherwise, create a fact from available data
            let fact = `The ${animal} is a fascinating creature!`;

            if (animalInfo.scientificName) {
                fact += ` Scientific name: ${animalInfo.scientificName}.`;
            }

            if (animalInfo.habitat) {
                fact += ` Habitat: ${animalInfo.habitat}.`;
            }

            if (animalInfo.diet) {
                fact += ` Diet: ${animalInfo.diet}.`;
            }

            return { fact };
        }

        // If no data was found, use a generic fallback fact
        return { fact: `The ${animal} is a fascinating creature in the animal kingdom!` };
    } catch (error) {
        console.error(`Error fetching animal fact for ${animal}:`, error.message);

        // Use a generic fallback fact for all animals
        return { fact: `The ${animal} is a fascinating creature in the animal kingdom!` };
    }
}

/**
 * Checks if the message is a correct guess of the mascot
 * @param {string} content - The message content to check
 * @returns {boolean} - True if the message correctly guesses the mascot
 */
function isCorrectMascotGuess(content) {
    const lowerContent = content.toLowerCase();

    // Check if the content contains the exact mascot name
    if (lowerContent.includes(MASCOT)) {
        return true;
    }

    // For multi-word mascots (like "red panda"), check if all words are present
    // This helps catch cases where words are in a different order or separated
    if (MASCOT.includes(' ')) {
        const mascotWords = MASCOT.split(' ');
        return mascotWords.every(word => lowerContent.includes(word));
    }

    return false;
}

/**
 * Creates an embed for logging valid messages
 * @param {Object} message - The Discord message object
 * @param {string} animalKeyword - The detected animal keyword
 * @param {Object} animalFact - The animal fact from the API
 * @param {boolean} isCorrectGuess - Whether this is a correct mascot guess
 * @param {string[]} nonAnimalWords - Non-animal words in the message
 * @returns {Object} - The embed and components for logging
 */
function createLogEmbed(message, animalKeyword, animalFact, isCorrectGuess, nonAnimalWords = []) {
    const hasNonAnimalContent = nonAnimalWords.length > 0;

    // Create the embed
    const embed = new EmbedBuilder()
        .setAuthor({
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL()
        })
        .setDescription(message.content)
        .addFields(
            { name: 'Animal Fact', value: animalFact.fact || 'No fact available' },
            { name: 'Channel', value: `<#${message.channel.id}>` },
            { name: 'Message ID', value: message.id }
        )
        .setTimestamp();

    // Set color and title based on message content
    if (isCorrectGuess) {
        // Green for correct guesses
        embed.setColor(0x00FF00)
            .setTitle(`🎉 Correct Mascot Guess: ${animalKeyword}`)
            .addFields({ name: 'Note', value: 'This user guessed the mascot!' });
    } else if (hasNonAnimalContent) {
        // Yellow for messages with non-animal content
        embed.setColor(0xFFFF00)
            .setTitle(`⚠️ Mixed Content: ${animalKeyword}`)
            .addFields({ 
                name: 'Non-Animal Words', 
                value: nonAnimalWords.join(', ') || 'None'
            });
    } else {
        // Gray for regular animal messages
        embed.setColor(0x808080)
            .setTitle(`🪶 Animal Message: ${animalKeyword}`);
    }

    // Create button to jump to the message
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Go to Message')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`)
        );

    return { embed, components: [row] };
}

/**
 * Handles a message in the monitored channel
 * @param {Object} message - The Discord message object
 */
async function handleMessage(message) {
    // Ignore bot messages and messages from other channels
    if (message.author.bot || message.channel.id !== MONITORED_CHANNEL_ID) return;

    try {
        // Check if the message contains an animal keyword
        const { isAnimal, animalName, nonAnimalWords } = await containsAnimalKeyword(message.content);

        if (isAnimal && animalName) {
            // Check if this is a correct mascot guess (for logging purposes only)
            const isCorrectGuess = isCorrectMascotGuess(message.content);
            const hasNonAnimalContent = nonAnimalWords && nonAnimalWords.length > 0;

            try {
                // React to the message with the same emoji for all valid animal messages
                await message.react(REACTION_EMOJI);

                // Fetch animal fact from API
                const animalFact = await fetchAnimalFact(animalName);

                // Log the valid message to the designated channel
                const logChannel = message.guild.channels.cache.get(eventConfig.UbuconAsia2025);
                if (logChannel) {
                    const { embed, components } = createLogEmbed(
                        message, 
                        animalName, 
                        animalFact, 
                        isCorrectGuess, 
                        nonAnimalWords
                    );

                    await logChannel.send({ 
                        embeds: [embed],
                        components: components
                    });
                }

                // Only log to console if there's something unusual (correct guess or non-animal content)
                if (isCorrectGuess) {
                    console.log(`[INFO] Correct mascot guess: "${message.content}" - User: ${message.author.tag}`);
                } else if (hasNonAnimalContent) {
                    console.log(`[INFO] Mixed content message: "${message.content}" - Animal: ${animalName}, Non-animal: ${nonAnimalWords.join(', ')}`);
                }
            } catch (error) {
                console.error('Error processing valid animal message:', error.message);
            }
        } else {
            // Delete messages without animal keywords
            try {
                await message.delete();
                // Send a temporary notification to the user
                const notification = await message.channel.send(
                    `${message.author}, your message was deleted because it did not contain any animal keywords. Try to guess what the mascot animal is!`
                );
                // Delete the notification after 5 seconds
                setTimeout(() => notification.delete().catch(() => {}), 5000);
            } catch (error) {
                console.error('Error deleting invalid message:', error.message);
            }
        }
    } catch (error) {
        console.error('Error in animal detection system:', error.message);
    }
}

/**
 * Initializes the "Guess the Mascot" event system
 * @param {Client} client - The Discord client
 */
function initAnimalKeywordSystem(client) {
    if (!MONITORED_CHANNEL_ID) {
        console.warn('[WARN] Guess the Mascot Event: No monitored channel ID specified in event.json');
        return;
    }

    client.on(Events.MessageCreate, handleMessage);
    console.log(`[INFO] Guess the Mascot Event: Monitoring channel ${MONITORED_CHANNEL_ID}`);
    console.log(`[INFO] Mascot detection system initialized`);
}

module.exports = {
    initAnimalKeywordSystem,
    containsAnimalKeyword
};
