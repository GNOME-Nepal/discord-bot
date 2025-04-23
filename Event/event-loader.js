/**
 * Event Loader - Loads custom event handlers from the Event directory
 * ==================================================================
 * This module loads and initializes custom event handlers from the Event directory.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Loads and initializes the animal keyword detection system
 * @param {Client} client - The Discord client
 */
async function loadAnimalKeywordSystem(client) {
    try {
        // Load event configuration
        const eventConfig = require('./event.json');

        // Check if the event is enabled via Special_key
        if (eventConfig.Special_key !== "Enable") {
            console.log('[INFO] Animal Keyword Detection System is disabled. Set "Special_key": "Enable" in event.json to enable it.');
            return;
        }

        const guessPath = path.join(__dirname, 'Ubucon-asia/Guess.js');
        const animalSystem = require(guessPath);

        if (animalSystem && typeof animalSystem.initAnimalKeywordSystem === 'function') {
            animalSystem.initAnimalKeywordSystem(client);
            console.log('[INFO] Successfully loaded Animal Keyword Detection System');
        } else {
            console.warn('[WARN] Animal Keyword Detection System module found but initAnimalKeywordSystem function is missing');
        }
    } catch (error) {
        console.error('[ERROR] Failed to load Animal Keyword Detection System:', error.message);
    }
}

/**
 * Loads all custom event handlers
 * @param {Client} client - The Discord client
 */
async function loadEventHandlers(client) {
    console.log('[INFO] Loading custom event handlers...');

    // Load the animal keyword detection system
    await loadAnimalKeywordSystem(client);

    // Additional event handlers can be loaded here in the future

    console.log('[INFO] Custom event handlers loaded');
}

module.exports = {
    loadEventHandlers
};
