# GNOME Nepal Discord Bot Guidelines

This document provides setup, testing, and feature addition instructions.

<div align="center">
  <a href="https://www.instagram.com/gnomenepal/" target="_blank">
    <img src="public/socials/insta.svg" alt="Instagram" width="32">
  </a>
  <a href="https://www.linkedin.com/company/gnomenepal/" target="_blank">
    <img src="public/socials/linkedin.svg" alt="LinkedIn" width="32">
  </a>
  <a href="https://x.com/gnomeasia24" target="_blank">
    <img src="public/socials/x.svg" alt="X" width="32">
  </a>
  <a href="https://discord.gg/tpsVFJN8WC" target="_blank">
    <img src="public/socials/dc.svg" alt="Discord" width="32">
  </a>
</div>

### Prerequisites
- Node.js (v16.6.0 or later recommended)
- npm (comes with Node.js)
- A Discord account with access to the [Discord Developer Portal](https://discord.com/developers/applications)

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd discord-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `config.json` file in the project root with your Discord credentials. You can simply rename the provided `.config.json` template file:
   ```bash
   cp .config.json config.json
   ```

   Then edit the `config.json` file with your actual credentials:
   ```json
   {
    "CLIENT_ID": "your-client-id",
    "TOKEN": "your-bot-token",
    "GUILD_ID": "your-guild-id",
    "MOD_ROLE_ID": "your-mod-role-id",
    "REPORT_WEBHOOK_URL": "your-webhook-url",
    "REPORT_LOG_CHANNEL_ID": "your-log-channel-id",
    "MEMBER_ROLE_ID": "your-member-role-id",
    "CONTRIBUTOR_ROLE_ID": "your-contributor-role-id",
    "MAINTAINER_ROLE_ID": "your-maintainer-role-id"
   }
   ```

4. Validate your token configuration:
   ```bash
   npm run ttest
   ```

5. Start the bot in development mode:
   ```bash
   npm run dev
   ```

## Testing Information

### Running Tests

The project uses Node.js's built-in `assert` module for testing. Tests are located in the `tests` directory.

To run all tests:
```bash
node tests/commandtest.js
```

### Adding New Tests

1. Create a new test file in the `tests` directory with a descriptive name (e.g., `my-feature-test.js`).
2. Import the necessary modules and the code you want to test.
3. Write test functions that use `assert` to verify expected behavior.
4. Run your test with `node tests/my-feature-test.js`.

### Test Example

Here's a simple test that verifies command definitions:

```javascript
const assert = require('assert');
const commands = require('./commands');

function testCommandDefinitions() {
    // Test that all command categories exist
    assert(commands.member, 'Member commands should exist');
    assert(commands.contributor, 'Contributor commands should exist');
    assert(commands.maintainer, 'Maintainer commands should exist');
    assert(commands['slash-commands'], 'Slash commands should exist');

    // Test that each command has the required properties
    const allCommands = [
        ...commands.member,
        ...commands.contributor,
        ...commands.maintainer,
        ...commands['slash-commands']
    ];

    allCommands.forEach(cmd => {
        assert(cmd.name, `Command should have a name: ${JSON.stringify(cmd)}`);
        assert(cmd.description, `Command ${cmd.name} should have a description`);
        assert(cmd.syntax, `Command ${cmd.name} should have syntax`);
        assert(cmd.usage, `Command ${cmd.name} should have usage example`);
        assert(cmd.emoji, `Command ${cmd.name} should have an emoji`);
    });

    console.log('✓ All command definitions are valid');
}

// Run the test
testCommandDefinitions();
```

## Additional Development Information

### Project Structure

- `index.js`: Main script for the bot's functionality
- `.config.json`: Template configuration file that can be renamed and used as a starting point
- `config.json`: Configuration file for sensitive credentials (gitignored)
- `config-global.js`: Exports configuration values throughout the application
- `commands.js`: Definitions for all commands available in the bot
- `tokentest.js`: Script to validate token configuration
- `api.js`: API calls to fetch data from external sources
- `Src/`: Contains all command implementations
  - `Src/Slash-Commands/`: Contains all slash command implementations
  - `Src/Member/`: Contains member-level commands
  - `Src/Contributor/`: Contains contributor-level commands
  - `Src/Maintainer/`: Contains maintainer-level commands

### Command Structure

#### Slash Commands

Slash commands should be structured as follows:

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('command-name')
        .setDescription('Command description'),
    async execute(interaction) {
        // Command implementation
    },
};
```

#### Prefix / Role-Based Commands

Prefix / Role-based commands should be structured as follows:

```javascript
module.exports = {
    name: 'command-name',
    description: 'Command description',
    async execute(message, args) {
        // Command implementation
    },
};
```

### Adding New Commands

1. Create a new file in the appropriate directory:
   - Slash commands: `Src/Slash-Commands/`
   - Member commands: `Src/Member/`
   - Contributor commands: `Src/Contributor/`
   - Maintainer commands: `Src/Maintainer/`

2. Add the command definition to `commands.js` in the appropriate section.

3. Implement the command following the structure outlined above.

4. Restart the bot to load the new command.

### Debugging

- Use `console.log()` statements to debug issues.
- Check the console output for error messages.
- The bot logs detailed information about command loading and registration at startup.
- Use the `tokentest.js` script to validate your token configuration.
