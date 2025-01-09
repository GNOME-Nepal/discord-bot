const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const { CLIENT_ID, TOKEN, GUILD_IDS, MOD_ROLE_ID, MEMBER_ROLE_ID, PREFIX } = require('./config.json');
const fs = require('fs');
const path = require('path');
const activities = require('./activities'); // Import activities

// Client Initialization
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
client.commands = new Collection();
client.slashCommands = new Collection();

// Load commands from the commands directory
const COMMANDS_DIR = path.join(__dirname, 'Src');
const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if (command.data) {
                client.slashCommands.set(command.data.name, command);
                console.log(`Loaded slash command: ${command.data.name}`);
            } else if (command.name) {
                client.commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            } else {
                console.error(`Command file ${filePath} is missing required properties.`);
            }
        }
    }
};
loadCommands(COMMANDS_DIR);

// Register slash commands with Discord
const registerCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('Registering slash commands...');
        const commands = client.slashCommands.map(cmd => cmd.data.toJSON());
        for (const guildId of GUILD_IDS) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
            console.log(`Registered commands for guild: ${guildId}`);
        }
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Handle message commands
client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        await message.reply('There was an error executing that command!');
    }
});

// Set bot activities
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    let i = 0;
    setInterval(() => {
        const activity = activities[i];
        client.user.setActivity(activity.name, { type: ActivityType[activity.type] });
        i = (i + 1) % activities.length;
    }, 30000); // Change activity every 30 seconds
});

// Execution
(async () => {
    await registerCommands();
    try {
        await client.login(TOKEN);
    } catch (error) {
        console.error('Error logging in:', error);
    }
})();

// Export client for testing purposes
module.exports = { client };
