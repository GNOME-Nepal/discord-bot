# GNOME Nepal Discord Bot

Discord Bot for GNOME Nepal Discord Server.

## Prerequisites

1. [Node.js](https://nodejs.org/) installed (v16.6.0 or later recommended).
2. A Discord account with access to the [Discord Developer Portal](https://discord.com/developers/applications).

## Getting Started

### 1. Setting Up the Bot in Discord Developer Portal

1. Log in to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on **New Application** to create a new bot application.
3. Copy the **Client ID** from the application settings.
4. Navigate to the **Bot** section, click **Add Bot**, and copy the **Token**.
5. Go to the **OAuth2** section, select **URL Generator**, and enable the following scopes:
    - `bot`
    - `applications.commands`
6. Under **Bot Permissions**, select the permissions your bot needs (for now `Send Messages`, `Read Message History`,
   etc.).
7. Copy the generated URL and use it to invite the bot to your server.

---

### 2. Setting Up the Project Locally

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `config.json` file in the project root and add the following keys:
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
   Replace the placeholder values with your actual Discord IDs and tokens.

---

### 3. Setting Up Report System Webhook

1. In your Discord server, go to the channel where you want to receive reports
2. Right-click on the channel and select "Edit Channel"
3. Go to "Integrations" tab
4. Click on "Create Webhook"
5. Configure the webhook name and avatar as desired
6. Copy the webhook URL and paste it in your `config.json` as `REPORT_WEBHOOK_URL`
7. The channel ID should be used as `REPORT_LOG_CHANNEL_ID` in your config

---

### 4. Running the Bot

Start the bot in development mode:

```bash
npm run dev
```

If successful, you will see the following logs:

- `Registering slash commands...`
- `Slash commands registered successfully!`
- `Logged in as <Your Bot's Username>`

---

### 5. Using the Commands

- **Slash Commands**: Type `/help` to see the list of available slash commands
  - `/report` - Submit a formal report to the moderation team
  - `/about` - Information about the GNOME-Nepal organization
  - `/contributors` - View contributors from the GNOME Nepal GitHub organization
  - `/meme` - Fetch a random meme from Reddit
  - `/social` - Get social media links for the organization
  - `/ping` - Check bot latency information
  - `/docs` - Access documentation links

- **Role-based Commands**:
  - Members: `sudo help` - Shows member commands
  - Contributors: `$sudo help` - Shows contributor commands
  - Maintainers: `$packman help` - Shows maintainer commands

---

## Project Structure

- `index.js`: Main script for the bot's functionality
- `config.json`: Configuration file for sensitive credentials
- `config-global.js`: Exports configuration values throughout the application
- `commands.js`: Definitions for all commands available in the bot
- `tokentest.js`: Script to validate token configuration
- `api.js`: API calls to fetch data from external sources
- `mention.js`: Handles user mentions and interactions
- `constants.js`: Shared constant values and utility functions
- `Src/Slash-Commands/`: Contains all slash command implementations
- `Src/Member/`: Contains member-level commands
- `Src/Contributor/`: Contains contributor-level commands
- `Src/Maintainer/`: Contains maintainer-level commands

---

## Features

### Report System
The bot includes a comprehensive report system that allows users to:
- Submit formal reports to moderators using `/report`
- Attach evidence files (images, videos, text)
- Keep track of report status with case IDs
- All reports are logged to a configured webhook channel

---

## Dependencies

- [discord.js](https://www.npmjs.com/package/discord.js)
- [@discordjs/builders](https://www.npmjs.com/package/@discordjs/builders)
- [axios](https://www.npmjs.com/package/axios)
- [cli-table3](https://www.npmjs.com/package/cli-table3)

Install dependencies using:

```bash
npm install discord.js @discordjs/builders axios cli-table3
```

---

## Validating Configuration

You can validate your token configuration by running:

```bash
node tokentest.js
```

This will check if your Discord bot token, GitHub token, and webhook URLs are working correctly.

---

## Contributing

Contributions are welcome! Feel free to fork the project and submit a pull request.

---
