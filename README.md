# Discord Notification Bot

A Node tool for sending Discord DMs.

<div align="center">
  <img src="./assets/avatar.png" alt="Discord Notification Bot Avatar" width="150px">
</div>

## Requirements

- Node.js v26 or higher
- A Discord bot token and user ID

## Configuration

Copy `sample.env` to `.env` and fill in:

| Variable     | Description       |
| ------------ | ----------------- |
| `BOT_TOKEN`  | Your bot token    |
| `DM_USER_ID` | The user ID to DM |

Never commit `.env`.

### Pre-commit hooks

This repo uses [pre-commit](https://pre-commit.com/) to run a Prettier format check and [gitleaks](https://github.com/gitleaks/gitleaks) secret scanning before each commit.

```bash
pre-commit install
```

## Usage

```bash
echo "Hello, World!" | npm run send
```

```bash
npm run send <<EOF
# Formatting
Markdown is supported.
EOF
```

Discord Markdown (`**bold**`, `_italic_`, `# heading`, `> quote`, `` `code` ``) is supported in the message.

For longer or more complex Markdown, pass a file instead of piping to stdin:

```bash
npm run send -- --file ./message.md
```

Attach a single file (e.g. a log) alongside the message:

```bash
npm run send -- --attach ./build.log <<< "Build failed"
```

| Flag             | Description                          |
| ---------------- | ------------------------------------ |
| `--file`, `-f`   | Read the message content from a file |
| `--attach`, `-a` | Attach a single file to the message  |

## Exit codes

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 0    | Success                            |
| 1    | Missing or empty stdin message     |
| 2    | Missing `BOT_TOKEN` / `DM_USER_ID` |
| 3    | Discord API error                  |
| 4    | Error reading stdin                |

## License

MIT — see [LICENSE](LICENSE).
