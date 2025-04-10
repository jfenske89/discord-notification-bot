# Discord Notification Bot

A lightweight Discord bot designed to send direct messages to a specified user. Perfect for automated notifications, alerts, and system messages.

<div align="center">
  <img src="./assets/avatar.png" alt="Discord Notification Bot Avatar" width="150px">
</div>

## Features

- Send direct messages to a specified Discord user
- Accept messages via stdin
- Simple integration with shell scripts and automation tools
- Proper error handling and exit codes
- Markdown message support

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- A Discord Bot Token
- The Discord User ID of the message recipient

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd discord-notification-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
BOT_TOKEN=your_discord_bot_token_here
DM_USER_ID=target_user_id_here
```

## Usage

### Basic Usage

```bash
echo "Hello, World!" | npm run send
```

### Using Heredoc

```bash
npm run send <<EOF
# Title
This is a **formatted** message with _Markdown_ support.
EOF
```

### Integration Example

```bash
#!/bin/bash
# Example of integrating with a monitoring script
STATUS="All systems operational"
npm run send <<EOF
# System Status Update
${STATUS}
EOF
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0    | Success - Message sent successfully |
| 1    | No Message - Empty or missing input |
| 2    | Missing Environment - Required environment variables not set |
| 3    | Discord Error - Failed to send message or other Discord-related errors |
| 4    | STDIN Error - Error reading from standard input |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| BOT_TOKEN | Your Discord bot token | Yes |
| DM_USER_ID | The Discord user ID to send messages to | Yes |

## Message Formatting

The bot supports Discord's Markdown formatting:

- `**bold**`
- `*italic*` or `_italic_`
- `# Heading`
- `> Quote`
- ``` `code` ```

## Development

### Project Structure

notification-bot/
├── notification-bot.js # Main bot code
├── package.json
├── .env # Environment variables (create this)
└── README.md

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure your `.env` file exists and contains both `BOT_TOKEN` and `DM_USER_ID`

2. **"Failed to send DM"**
   - Verify the bot has proper permissions
   - Ensure the target user accepts DMs from server members

3. **"No message input received"**
   - Check that you're providing input to the script
   - Verify the input is not empty

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- Never commit your `.env` file
- Regularly rotate your bot token
- Keep dependencies updated
- Use environment variables for sensitive data

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [discord.js](https://discord.js.org/) - The Discord API library used
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management
