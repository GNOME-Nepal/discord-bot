/**
 * GNOME Nepal Discord Bot - Core File
 * ==================================
 * DO NOT MODIFY WITHOUT MAINTAINER APPROVAL
 *
 * This file implements the core bot infrastructure including:
 * - Dynamic command loading from file structure (for maintainability)
 * - Dual command support (slash commands and role-based prefix commands)
 * - Guild-specific command registration (for permission management)
 * - Detailed console reporting (for monitoring and debugging)
 * - Activity rotation (for user engagement)
 *
 * WARNING: This is a critical system file. Any modifications without explicit
 * approval from project maintainers may break functionality or cause security issues.
 * Please open an issue or pull request instead of directly editing this file.
 */
const {Client, GatewayIntentBits, Collection, REST, Routes, ActivityType} = require('discord.js');
const {
    CLIENT_ID,
    TOKEN,
    GUILD_ID,
    MEMBER_ROLE_ID,
    CONTRIBUTOR_ROLE_ID,
    MAINTAINER_ROLE_ID
} = require('./Utils/bot/config-global');
const {ACTIVITY_ROTATION_INTERVAL} = require('./Utils/cmds/constants');
const fs = require('fs').promises;
const path = require('path');
const activities = require('./Utils/bot/activities');
const Table = require('cli-table3');
const {handleMention} = require('./Src/Core/events/mentionHandler.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Prevent EventEmitter memory leaks in larger servers
client.setMaxListeners(25);
client.once('ready', () => client.ws.setMaxListeners(25));

// Command Collections
client.slashCommands = new Collection();
client.memberCommands = new Collection(); // For 'sudo' commands
client.contributorCommands = new Collection(); // For '$sudo' commands
client.maintainerCommands = new Collection(); // For '$packman' commands

const allCommands = [];
const registeredGuilds = [];

// Define role-based prefix mappings (THIS IS WHERE PREFIXES ARE DEFINED)
const prefixCommandMappings = [
    {prefix: 'sudo', roleId: MEMBER_ROLE_ID, collection: client.memberCommands, dir: 'Member', roleName: 'Member'},
    {
        prefix: '$sudo',
        roleId: CONTRIBUTOR_ROLE_ID,
        collection: client.contributorCommands,
        dir: 'Contributor',
        roleName: 'Contributor'
    },
    {
        prefix: '$packman',
        roleId: MAINTAINER_ROLE_ID,
        collection: client.maintainerCommands,
        dir: 'Maintainer',
        roleName: 'Maintainer'
    }
];

const loadCommands = async () => {
    console.log("[INFO] Starting command loading process");
    console.log("--- Starting Command Loading ---");

    // Load from main Src directory (only for slash commands)
    const srcPath = path.join(__dirname, 'Src');
    try {
        const mainFiles = await fs.readdir(srcPath);
        for (const file of mainFiles) {
            const filePath = path.join(srcPath, file);
            const stat = await fs.stat(filePath);
            if (stat.isFile() && file.endsWith('.js')) {
                try {
                    const command = require(filePath);
                    if (command.data) {
                        client.slashCommands.set(command.data.name, command);
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

    // Load from subdirectories (role-based commands and Slash-Commands)
    const categories = ['Member', 'Contributor', 'Maintainer', 'Slash-Commands'];
    for (const category of categories) {
        const categoryPath = path.join(__dirname, 'Src', category);
        let files;
        try {
            files = await fs.readdir(categoryPath);
            console.log(`Found ${files.length} files in ${categoryPath} (Category: ${category})`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`[INFO] Directory ${categoryPath} not found, creating it`);
                await fs.mkdir(categoryPath, {recursive: true});
            } else {
                console.log(`[INFO] Skipping ${category} directory: ${err.message}`);
            }
            continue;
        }

        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            const filePath = path.join(categoryPath, file);
            try {
                const command = require(filePath);
                if (command.data) {
                    // Slash command
                    client.slashCommands.set(command.data.name, command);
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
};

// Register commands to guilds
const registerCommands = async () => {
    const rest = new REST({version: '10'}).setToken(TOKEN);
    const commands = client.slashCommands.map(cmd => cmd.data.toJSON());

    const guildIds = GUILD_ID ? GUILD_ID.split(',').map(id => id.trim()) : [];
    if (guildIds.length === 0) {
        console.warn("[WARN] No GUILD_ID specified, skipping command registration");
        return;
    }

    for (const guildId of guildIds) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, guildId),
                {body: commands}
            );
            registeredGuilds.push({id: guildId, status: '✓'});
            console.log(`[OK] Registered commands for guild ${guildId}`);
        } catch (error) {
            let errorMsg = `Failed to register commands in guild ${guildId}:`;
            if (error.code === 50001) errorMsg += " Missing Access";
            else errorMsg += ` ${error.message}`;
            console.error(`[FAIL] ${errorMsg}`);
            registeredGuilds.push({id: guildId, status: '✗'});
        }
    }
    console.log("--- Slash Command Registration Finished ---");
};

// Status display for console
const displayFinalTable = (botTag) => {
    const commandTable = new Table({
        head: ['Title / Name', 'Type', 'User', 'Description', 'Status'],
        colWidths: [25, 15, 15, 60, 9]
    });

    allCommands.forEach(cmd => {
        commandTable.push([cmd.name, cmd.type, cmd.role || 'N/A', cmd.description, cmd.status]);
    });

    registeredGuilds.forEach(guild => {
        const guildObj = client.guilds.cache.get(guild.id);
        const memberCount = guildObj ? guildObj.memberCount : 'Unknown';
        const guildName = guildObj ? guildObj.name : 'Unknown Guild';
        commandTable.push([
            `Guild: ${guild.id.substring(0, 11)}...`,
            'Registered',
            'N/A',
            `${guildName} (${memberCount} members, ${client.slashCommands.size} commands)`,
            guild.status
        ]);
    });

    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const guildCount = client.guilds.cache.size;
    commandTable.push([
        'Server Stats',
        'Info',
        'N/A',
        `${guildCount} servers with ${totalUsers} total members`,
        '✓'
    ]);
    commandTable.push([
        `Bot: ${botTag}`,
        'Logged in',
        'N/A',
        `${client.slashCommands.size} slash, ${client.memberCommands.size} member, ${client.contributorCommands.size} contributor, ${client.maintainerCommands.size} maintainer commands`,
        '✓'
    ]);

    console.log('\n=== GNOME Nepal Discord Bot Status ===');
    console.log(commandTable.toString());
    console.log('Bot is ready to use! ✓ | LGTM 🚀 ');
};

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[ERROR] Slash command /${interaction.commandName}: ${error.message}`);
        const replyContent = {content: 'There was an error while executing this command!', ephemeral: true};
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(replyContent).catch(() => {
            });
        } else {
            await interaction.reply(replyContent).catch(() => {
            });
        }
    }
});


client.on('messageCreate', async message => {
    await handleMention(message, client);
});

// Handle role-based prefix commands only
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !message.content) return;

    // Check role-based prefixes
    for (const mapping of prefixCommandMappings) {
        const fullPrefix = mapping.prefix + ' ';
        if (message.content.startsWith(fullPrefix)) {
            if (!mapping.roleId) {
                console.warn(`[WARN] ${mapping.roleName} commands disabled: No ${mapping.dir.toUpperCase()}_ROLE_ID`);
                await message.reply({
                    content: `\`${mapping.prefix}\` commands are disabled due to missing configuration`,
                    allowedMentions: {repliedUser: false}
                });
                return;
            }

            const member = message.member ?? await message.guild.members.fetch(message.author.id).catch(() => null);
            if (!member) {
                console.log(`[WARN] Could not fetch member for ${message.author.tag} (${message.author.id})`);
                await message.reply({
                    content: 'Unable to verify your roles. Try again later.',
                    allowedMentions: {repliedUser: false}
                });
                return;
            }

            if (!member.roles.cache.has(mapping.roleId)) {
                await message.reply({
                    content: `You need the **${mapping.roleName}** role to use \`${mapping.prefix}\` commands!`,
                    allowedMentions: {repliedUser: false}
                });
                return;
            }

            const args = message.content.slice(fullPrefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            if (!commandName) {
                await message.reply({
                    content: `Please specify a command after \`${mapping.prefix}\`.`,
                    allowedMentions: {repliedUser: false}
                });
                return;
            }

            const command = mapping.collection.get(commandName);
            if (!command) {
                await message.reply({
                    content: `Unknown command \`${commandName}\` for \`${mapping.prefix}\`.`,
                    allowedMentions: {repliedUser: false}
                });
                return;
            }

            try {
                await command.execute(message, args);
            } catch (error) {
                console.error(`[ERROR] ${mapping.roleName} command ${commandName}: ${error.message}`);
                await message.reply({
                    content: 'There was an error executing that command!',
                    allowedMentions: {repliedUser: false}
                });
            }
            return;
        }
    }
});

// Set up activities
client.on('ready', () => {
    displayFinalTable(client.user.tag);

    if (activities.length) {
        let currentActivityIndex = 0;
        const interval = setInterval(() => {
            const activity = activities[currentActivityIndex];
            client.user.setActivity(activity.name, {type: ActivityType[activity.type]});
            currentActivityIndex = (currentActivityIndex + 1) % activities.length;
        }, ACTIVITY_ROTATION_INTERVAL);

        client.on('disconnect', () => clearInterval(interval));
    }
});

// Main startup sequence
(async () => {
    await loadCommands();
    await registerCommands();

    try {
        console.log("[INFO] Connecting to Discord...");
        await client.login(TOKEN);
        console.log("[OK] Bot successfully connected to Discord");
    } catch (error) {
        console.error("CRITICAL: Failed to connect to Discord:", error);
        process.exit(1);
    }
})();
