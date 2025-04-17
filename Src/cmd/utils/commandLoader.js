/**
 * GNOME Nepal Discord Bot - Command Loader
 * ========================================
 * This file handles loading commands from the file system.
 */

const fs = require('fs').promises;
const path = require('path');
const { Collection } = require('discord.js');

/**
 * Load commands from the file system
 * @returns {Promise<Object>} Object containing command collections
 */
async function loadCommands() {
    console.log("--- Starting Command Loading ---");

    // Initialize collections
    const slashCommands = new Collection();
    const memberCommands = new Collection();
    const contributorCommands = new Collection();
    const maintainerCommands = new Collection();
    const allCommands = [];

    // Load from main Src directory (only for slash commands)
    const srcPath = path.join(__dirname, '..', '..');
    try {
        const mainFiles = await fs.readdir(srcPath);
        for (const file of mainFiles) {
            const filePath = path.join(srcPath, file);
            const stat = await fs.stat(filePath);
            if (stat.isFile() && file.endsWith('.js')) {
                try {
                    const command = require(filePath);
                    if (command.data) {
                        slashCommands.set(command.data.name, command);
                        allCommands.push({
                            name: command.data.name,
                            type: 'Slash',
                            role: 'Everyone',
                            description: command.data.description || 'No description',
                            status: '✓'
                        });
                    } else {
                        console.log(`[WARN] Skipping ${file} in Src: only slash commands allowed here`);
                        allCommands.push({
                            name: file,
                            type: 'Unknown',
                            role: 'N/A',
                            description: 'Load Failed: Not a slash command',
                            status: '✗'
                        });
                    }
                } catch (err) {
                    console.log(`[FAIL] Failed to load ${file} from main Src: ${err.message}`);
                    allCommands.push({
                        name: file,
                        type: 'Unknown',
                        role: 'N/A',
                        description: `Load Failed: ${err.message}`,
                        status: '✗'
                    });
                }
            }
        }
    } catch (err) {
        console.log(`[INFO] Failed to read main Src directory: ${err.message}`);
    }

    // Define role-based prefix mappings
    const prefixCommandMappings = [
        { prefix: 'sudo', roleId: process.env.MEMBER_ROLE_ID || require('../../../utils/config-global').MEMBER_ROLE_ID, collection: memberCommands, dir: 'Member', roleName: 'Member' },
        {
            prefix: '$sudo',
            roleId: process.env.CONTRIBUTOR_ROLE_ID || require('../../../utils/config-global').CONTRIBUTOR_ROLE_ID,
            collection: contributorCommands,
            dir: 'Contributor',
            roleName: 'Contributor'
        },
        {
            prefix: '$packman',
            roleId: process.env.MAINTAINER_ROLE_ID || require('../../../utils/config-global').MAINTAINER_ROLE_ID,
            collection: maintainerCommands,
            dir: 'Maintainer',
            roleName: 'Maintainer'
        }
    ];

    // Load from subdirectories (role-based commands and Slash-Commands)
    const categories = ['Member', 'Contributor', 'Maintainer', 'Slash-Commands'];
    for (const category of categories) {
        const categoryPath = path.join(__dirname, '..', '..', category);
        let files;
        try {
            files = await fs.readdir(categoryPath);
            console.log(`Found ${files.length} files in ${categoryPath} (Category: ${category})`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`[INFO] Directory ${categoryPath} not found, creating it`);
                await fs.mkdir(categoryPath, { recursive: true });
            } else {
                console.log(`[INFO] Skipping ${category} directory: ${err.message}`);
            }
            continue;
        }

        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            const filePath = path.join(categoryPath, file);
            try {
                // Clear require cache to avoid circular dependencies
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                if (command.data) {
                    // Slash command
                    slashCommands.set(command.data.name, command);
                    allCommands.push({
                        name: command.data.name,
                        type: 'Slash',
                        role: 'Everyone',
                        description: command.data.description || 'No description',
                        status: '✓'
                    });
                } else if (command.name) {
                    // Role-based prefix command
                    const mapping = prefixCommandMappings.find(m => m.dir === category);
                    if (mapping) {
                        mapping.collection.set(command.name, command);
                        allCommands.push({
                            name: command.name,
                            type: 'Prefix',
                            role: mapping.roleName,
                            description: command.description || 'No description',
                            status: mapping.roleId ? '✓' : '✗ (No Role ID)'
                        });
                    } else {
                        console.log(`[WARN] Skipping ${file} in ${category}: not a role-based command directory`);
                        allCommands.push({
                            name: file,
                            type: 'Unknown',
                            role: 'N/A',
                            description: 'Load Failed: Invalid directory',
                            status: '✗'
                        });
                    }
                } else {
                    console.log(`[WARN] Skipping ${file} in ${category}: missing required properties`);
                    allCommands.push({
                        name: file,
                        type: 'Unknown',
                        role: 'N/A',
                        description: 'Load Failed',
                        status: '✗'
                    });
                }
            } catch (err) {
                console.log(`[FAIL] Failed to load ${file} in ${category}: ${err.message}`);
                allCommands.push({
                    name: file,
                    type: 'Unknown',
                    role: 'N/A',
                    description: `Load Failed: ${err.message}`,
                    status: '✗'
                });
            }
        }
    }
    console.log("--- Command Loading Finished ---");

    return {
        slashCommands,
        memberCommands,
        contributorCommands,
        maintainerCommands,
        allCommands
    };
}

module.exports = { loadCommands };
