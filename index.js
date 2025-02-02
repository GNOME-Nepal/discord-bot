const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const { CLIENT_ID, TOKEN, PREFIX, GUILD_ID } = require('./config-global');
const { ACTIVITY_ROTATION_INTERVAL } = require('./constants');
const fs = require('fs');
const path = require('path');
const activities = require('./activities');

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

const loadCommands = (dir) => {
    fs.readdirSync(dir).forEach(file => {
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
    });
};
loadCommands(path.join(__dirname, 'Src'));

const registerCommands = async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('Registering slash commands...');
        const commands = client.slashCommands.map(cmd => cmd.data.toJSON());
        for (const guildId of GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
            console.log(`Registered commands for guild: ${guildId}`);
        }
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const replyContent = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(replyContent);
        } else {
            await interaction.reply(replyContent);
        }
    }
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
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

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    if (activities.length === 0) {
        console.error('No activities found in activities.js. Please add at least one activity.');
        return;
    }

    let i = 0;
    setInterval(() => {
        const activity = activities[i];
        client.user.setActivity(activity.name, { type: ActivityType[activity.type] });
        i = (i + 1) % activities.length;
    }, ACTIVITY_ROTATION_INTERVAL);
});

(async () => {
    await registerCommands();
    try {
        await client.login(TOKEN);
    } catch (error) {
        console.error('Error logging in:', error);
    }
})();
