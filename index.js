/**
 * GNOME Nepal Discord Bot - Core File
 * ==================================
 * DO NOT MODIFY WITHOUT MAINTAINER APPROVAL
 *
 * This file implements the core bot infrastructure including:
 * - Dynamic command loading from file structure (for maintainability)
 * - Dual command support (prefix and slash commands for flexibility)
 * - Guild-specific command registration (for permission management)
 * - Detailed console reporting (for monitoring and debugging)
 * - Activity rotation (for user engagement)
 *
 * WARNING: This is a critical system file. Any modifications without explicit
 * approval from project maintainers may break functionality or cause security issues.
 * Please open an issue or pull request instead of directly editing this file.
 */
const {Client, GatewayIntentBits, Collection, REST, Routes, ActivityType} = require('discord.js');
const {CLIENT_ID, TOKEN, PREFIX, GUILD_ID} = require('./config-global');
const {ACTIVITY_ROTATION_INTERVAL} = require('./constants');
const fs = require('fs').promises;
const path = require('path');
const activities = require('./activities');
const Table = require('cli-table3');

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

client.commands = new Collection();
client.slashCommands = new Collection();

const allCommands = [];
const registeredGuilds = [];

const loadCommands = async () => {
    const categories = ['General', 'System-Admin', 'Moderation', 'Slash-Commands'];

    for (const category of categories) {
        const categoryPath = path.join(__dirname, 'Src', category);

        let files;
        try {
            files = await fs.readdir(categoryPath);
        } catch (err) {
            // Just skip missing directories
            continue;
        }

        for (const file of files) {
            if (!file.endsWith('.js')) continue;

            // If one command fails, log error but continue loading others
            try {
                const command = require(path.join(categoryPath, file));

                if (command.data) {
                    client.slashCommands.set(command.data.name, command);
                    allCommands.push({
                        name: command.data.name,
                        type: 'Slash',
                        description: command.data.description || 'No description',
                        status: '✓'
                    });
                } else if (command.name) {
                    client.commands.set(command.name, command);
                    allCommands.push({
                        name: command.name,
                        type: 'Regular',
                        description: command.description || 'No description',
                        status: '✓'
                    });
                } else {
                    console.log(`Skipping ${file}: missing required properties`);
                }
            } catch (err) {
                console.log(`Failed to load ${file}: ${err.message}`);
            }
        }
    }
};

// Register commands to guilds
const registerCommands = async () => {
    const rest = new REST({version: '9'}).setToken(TOKEN);
    const commands = client.slashCommands.map(cmd => cmd.data.toJSON());

    // Critical operation - maintain full error handling
    const guildIds = GUILD_ID.split(',');

    for (const guildId of guildIds) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, guildId),
                {body: commands}
            );
            registeredGuilds.push({id: guildId, status: '✓'});
        } catch (error) {
            if (error.code === 50001) {
                console.error(`Failed to register commands in guild ${guildId}: Missing Access`);
            } else {
                console.error(`Failed to register commands in guild ${guildId}:`, error);
            }
            registeredGuilds.push({id: guildId, status: '✗'});
        }
    }
};

// Status display for console
const displayFinalTable = (botTag) => {
    const commandTable = new Table({
        head: ['Title / Name', 'Type', 'Description', 'Status'],
        colWidths: [25, 15, 70, 9]
    });

    allCommands.forEach(cmd => {
        commandTable.push([cmd.name, cmd.type, cmd.description, cmd.status]);
    });

    registeredGuilds.forEach(guild => {
        const guildObj = client.guilds.cache.get(guild.id);
        const memberCount = guildObj ? guildObj.memberCount : 'Unknown';
        const guildName = guildObj ? guildObj.name : 'Unknown Guild';
        const commandCount = client.slashCommands.size;

        commandTable.push([
            `Guild: ${guild.id.substring(0, 11)}...`,
            'Registered',
            `${guildName} (${memberCount} members, ${commandCount} commands)`,
            guild.status
        ]);
    });

    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const guildCount = client.guilds.cache.size;

    commandTable.push([
        'Server Stats',
        'Info',
        `${guildCount} servers with ${totalUsers} total members`,
        '✓'
    ]);
    commandTable.push([
        `Bot: ${botTag}`,
        'Logged in',
        `${client.slashCommands.size} commands available`,
        '✓'
    ]);

    console.log('\n=== GNOME Nepal Discord Bot Status ===');
    console.log(commandTable.toString());
    console.log('Bot is ready to use! ✓ | LGTM 🚀 ');
};

// Critical user-facing function - maintain full error handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Command error /${interaction.commandName}:`, error);

        // Ephemeral error message
        const replyContent = {
            content: 'There was an error while executing this command!',
            flags: 64
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(replyContent).catch(() => {
            });
        } else {
            await interaction.reply(replyContent).catch(() => {
            });
        }
    }
});

// Handle prefix commands
client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Command error ${commandName}:`, error);
        message.reply('There was an error executing that command!').catch(() => {
        });
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

    // Critical connection - maintain full error handling
    try {
        await client.login(TOKEN);
    } catch (error) {
        console.error("CRITICAL: Failed to connect to Discord:", error);
        process.exit(1);
    }
})();