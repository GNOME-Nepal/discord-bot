/**
 * GNOME Nepal Discord Bot - Command Definitions
 * ============================================
 * This file contains the definitions for all commands available in the bot.
 * Commands are organized by role-level and include usage examples and descriptions.
 */

const fs = require('fs');
const path = require('path');

// Function to load commands from a directory
const loadCommands = (dir) => {
    try {
        if (!fs.existsSync(dir)) {
            console.warn(`[WARN] Directory does not exist: ${dir}`);
            return [];
        }

        return fs.readdirSync(dir).reduce((acc, file) => {
            if (file.endsWith('.js')) {
                try {
                    const cmdPath = path.join(dir, file);
                    // Clear require cache to avoid circular dependencies
                    delete require.cache[require.resolve(cmdPath)];
                    const cmd = require(cmdPath);
                    acc.push(cmd);
                } catch (error) {
                    console.error(`[ERROR] Failed to load command from ${file}: ${error.message}`);
                }
            }
            return acc;
        }, []);
    } catch (error) {
        console.error(`[ERROR] Failed to load commands from ${dir}: ${error.message}`);
        return [];
    }
};

// Define paths
const memberPath = path.join(__dirname, '..', 'Src', 'Member');
const contributorPath = path.join(__dirname, '..', 'Src', 'Contributor');
const maintainerPath = path.join(__dirname, '..', 'Src', 'Maintainer');
const slashCommandsPath = path.join(__dirname, '..', 'Src', 'Slash-Commands');

// Export command collections
module.exports = {
    member: loadCommands(memberPath),
    contributor: loadCommands(contributorPath),
    maintainer: loadCommands(maintainerPath),
    'slash-commands': loadCommands(slashCommandsPath)
};
