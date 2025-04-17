# GNOME Nepal Discord Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1233242660966236220)](https://discord.gg/tpsVFJN8WC)

<p align="center">
  <a href="https://nepal.gnome.org" target="_blank">
    <img src="public/images/icon.svg" alt="GNOME Nepal Logo" width="280">
  </a>
</p>

A Discord bot specifically designed for the GNOME Nepal community server, featuring role-based commands and community engagement tools.


## Overview

This Discord bot is built using:
- [Node.js](https://nodejs.org/) (v16.6.0 or later)
- [discord.js](https://discord.js.org/) library
- Role-based command system

## Quick Start

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/GNOME-Nepal/discord-bot.git
   cd discord-bot
   npm install
   ```

2. Create a `config.json` file with your Discord credentials. You can simply rename the provided `.config.json` template file:
   ```bash
   cp .config.json config.json
   ```

   Then edit the `config.json` file with your actual credentials.

3. Validate configuration and start the bot:
   ```bash
   npm run ttest   # Validate token configuration
   npm run dev     # Start in development mode
   ```

## Commands

The bot supports two types of commands:

1. **Slash Commands**: Available to all users (use `/help` to see the list)
   - Examples: `/report`, `/about`, `/contributors`, `/meme`, `/social`

2. **Role-based Commands**: Access depends on user roles
   - Members: `sudo help`
   - Contributors: `$sudo help`
   - Maintainers: `$packman help`

## Project Structure

- `index.js`: Main bot script
- `.config.json`: Template configuration file
- `config.json`: Your actual configuration file (gitignored)
- `commands.js`: Command definitions
- `Src/`: Command implementations
  - `Src/Slash-Commands/`: Slash commands
  - `Src/Member/`, `Src/Contributor/`, `Src/Maintainer/`: Role-based commands

## Testing

Run tests with:
```bash
node tests/commandtest.js
```

# Contributing

We welcome contributions to enhance this project! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated.

For detailed guidelines, check out our contributing [Guidelines](guidelines.md).

## License

This project is licensed under the [MIT LICENSE](LICENSE).
