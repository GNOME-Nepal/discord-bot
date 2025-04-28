const assert = require('assert').strict;
const fs = require('fs').promises;
const path = require('path');
const Table = require('cli-table3');
const { Collection } = require('discord.js');
const commands = require('../../../Utils/cmds/commands.js');

const memberCommands = new Collection();
const contributorCommands = new Collection();
const maintainerCommands = new Collection();

const allCommands = [];
const registeredGuilds = [];

const prefixCommandMappings = [
  {
    prefix: 'sudo',
    roleId:
      process.env.MEMBER_ROLE_ID ||
      require('../../../Utils/bot/config-global.js').MEMBER_ROLE_ID,
    collection: memberCommands,
    dir: 'Member',
    roleName: 'Member',
  },
  {
    prefix: '$sudo',
    roleId:
      process.env.CONTRIBUTOR_ROLE_ID ||
      require('../../../Utils/bot/config-global.js').CONTRIBUTOR_ROLE_ID,
    collection: contributorCommands,
    dir: 'Contributor',
    roleName: 'Contributor',
  },
  {
    prefix: '$packman',
    roleId:
      process.env.MAINTAINER_ROLE_ID ||
      require('../../../Utils/bot/config-global.js').MAINTAINER_ROLE_ID,
    collection: maintainerCommands,
    dir: 'Maintainer',
    roleName: 'Maintainer',
  },
];

const loadCommands = async () => {
  console.log('--- Starting Command Loading ---');

  const srcPath = path.join(__dirname, '..', 'Src');
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
              status: '✓',
            });
          } else {
            console.log(
              `[WARN] Skipping ${file} in Src: only slash commands allowed here`,
            );
            allCommands.push({
              name: file,
              type: 'Unknown',
              role: 'N/A',
              description: 'Load Failed: Not a slash command',
              status: '✗',
            });
          }
        } catch (err) {
          console.log(
            `[FAIL] Failed to load ${file} from main Src: ${err.message}`,
          );
          allCommands.push({
            name: file,
            type: 'Unknown',
            role: 'N/A',
            description: `Load Failed: ${err.message}`,
            status: '✗',
          });
        }
      }
    }
  } catch (err) {
    console.log(`[INFO] Failed to read main Src directory: ${err.message}`);
  }

  const categories = ['Member', 'Contributor', 'Maintainer', 'Slash-Commands'];
  for (const category of categories) {
    const categoryPath = path.join(__dirname, '..', 'Src', category);
    let files;
    try {
      files = await fs.readdir(categoryPath);
      console.log(
        `Found ${files.length} files in ${categoryPath} (Category: ${category})`,
      );
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
        const command = require(filePath);
        if (command.data) {
          // Slash command
          slashCommands.set(command.data.name, command);
          allCommands.push({
            name: command.data.name,
            type: 'Slash',
            role: 'Everyone',
            description: command.data.description || 'No description',
            status: '✓',
          });
        } else if (command.name) {
          // Role-based prefix command
          const mapping = prefixCommandMappings.find((m) => m.dir === category);
          if (mapping) {
            mapping.collection.set(command.name, command);
            allCommands.push({
              name: command.name,
              type: 'Prefix',
              role: mapping.roleName,
              description: command.description || 'No description',
              status: mapping.roleId ? '✓' : '✗ (No Role ID)',
            });
          } else {
            console.log(
              `[WARN] Skipping ${file} in ${category}: not a role-based command directory`,
            );
            allCommands.push({
              name: file,
              type: 'Unknown',
              role: 'N/A',
              description: 'Load Failed: Invalid directory',
              status: '✗',
            });
          }
        } else {
          console.log(
            `[WARN] Skipping ${file} in ${category}: missing required properties`,
          );
          allCommands.push({
            name: file,
            type: 'Unknown',
            role: 'N/A',
            description: 'Load Failed',
            status: '✗',
          });
        }
      } catch (err) {
        console.log(
          `[FAIL] Failed to load ${file} in ${category}: ${err.message}`,
        );
        allCommands.push({
          name: file,
          type: 'Unknown',
          role: 'N/A',
          description: `Load Failed: ${err.message}`,
          status: '✗',
        });
      }
    }
  }
  console.log('--- Command Loading Finished ---');
  return {
    slashCommands,
    memberCommands,
    contributorCommands,
    maintainerCommands,
    allCommands,
  };
};

const displayFinalTable = (botTag, guilds) => {
  const commandTable = new Table({
    head: ['Title / Name', 'Type', 'User', 'Description', 'Status'],
    colWidths: [25, 15, 15, 60, 9],
  });

  allCommands.forEach((cmd) => {
    commandTable.push([
      cmd.name,
      cmd.type,
      cmd.role || 'N/A',
      cmd.description,
      cmd.status,
    ]);
  });

  registeredGuilds.forEach((guild) => {
    const guildObj = guilds?.get(guild.id);
    const memberCount = guildObj ? guildObj.memberCount : 'Unknown';
    const guildName = guildObj ? guildObj.name : 'Unknown Guild';
    commandTable.push([
      `Guild: ${guild.id.substring(0, 11)}...`,
      'Registered',
      'N/A',
      `${guildName} (${memberCount} members, ${slashCommands.size} commands)`,
      guild.status,
    ]);
  });

  if (guilds) {
    const totalUsers = guilds.reduce(
      (acc, guild) => acc + guild.memberCount,
      0,
    );
    const guildCount = guilds.size;
    commandTable.push([
      'Server Stats',
      'Info',
      'N/A',
      `${guildCount} servers with ${totalUsers} total members`,
      '✓',
    ]);
  }

  commandTable.push([
    `Bot: ${botTag || 'N/A'}`,
    'Logged in',
    'N/A',
    `${slashCommands.size} slash, ${memberCommands.size} member, ${contributorCommands.size} contributor, ${maintainerCommands.size} maintainer commands`,
    '✓',
  ]);

  console.log('\n=== GNOME Nepal Discord Bot Status ===');
  console.log(commandTable.toString());
  console.log('Bot is ready to use! ✓ | LGTM 🚀 ');
};

const addRegisteredGuild = (guildId, status) => {
  registeredGuilds.push({ id: guildId, status });
};

// Original test function
async function testCommandDefinitions() {
  try {
    assert.ok(commands.member, 'Member commands should exist');
    assert.ok(commands.contributor, 'Contributor commands should exist');
    assert.ok(commands.maintainer, 'Maintainer commands should exist');
    assert.ok(commands['slash-commands'], 'Slash commands should exist');

    const allTestCommands = [
      ...commands.member,
      ...commands.contributor,
      ...commands.maintainer,
      ...commands['slash-commands'],
    ];

    assert.ok(
      allTestCommands.length > 0,
      'At least one command should be defined',
    );

    for (const cmd of allTestCommands) {
      assert.ok(cmd.name, `Command missing name: ${JSON.stringify(cmd)}`);
      assert.ok(cmd.description, `Command ${cmd.name} missing description`);
      assert.ok(cmd.syntax, `Command ${cmd.name} missing syntax`);
      assert.ok(cmd.usage, `Command ${cmd.name} missing usage example`);
      assert.ok(cmd.emoji, `Command ${cmd.name} missing emoji`);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCommandDefinitions().catch((error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
  });
}

module.exports = {
  loadCommands,
  displayFinalTable,
  addRegisteredGuild,
  testCommandDefinitions,
};
