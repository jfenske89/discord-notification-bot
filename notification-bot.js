/**
 * Discord Notification Bot
 * A simple bot that sends direct messages to a specified user.
 *
 * @module notification-bot
 */

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ClientOptions,
} = require("discord.js");

require("dotenv").config();

// Constants
const CONFIG = {
  REQUIRED_ENV_VARS: ["BOT_TOKEN", "DM_USER_ID"],
  EXIT_CODES: {
    SUCCESS: 0,
    NO_MESSAGE: 1,
    MISSING_ENV: 2,
    DISCORD_ERROR: 3,
    STDIN_ERROR: 4,
  },
};

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
function validateEnvironment() {
  const missingVars = CONFIG.REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

/**
 * Reads input from stdin and returns it as a promise
 * @returns {Promise<string>} The input from stdin
 * @throws {Error} If there's an error reading from stdin
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";

    process.stdin.setEncoding("utf8");

    process.stdin
      .on("data", (chunk) => {
        input += chunk;
      })
      .on("end", () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) {
          reject(new Error("No message input received"));
        }
        resolve(trimmedInput);
      })
      .on("error", (error) => {
        reject(new Error(`Failed to read from stdin: ${error.message}`));
      });
  });
}

/**
 * Creates and configures a Discord client
 * @returns {Client} Configured Discord client
 */
function createDiscordClient() {
  const clientOptions = {
    intents: [GatewayIntentBits.DirectMessages],
    partials: [Partials.Channel],
  };

  return new Client(clientOptions);
}

/**
 * Sends a direct message to a specified user
 * @param {Client} client - Discord client instance
 * @param {Object} options - Message options
 * @param {string} options.message - The message to send
 * @returns {Promise<void>}
 * @throws {Error} If the user is not found or message fails to send
 */
async function sendDM(client, { message }) {
  const userId = process.env.DM_USER_ID;

  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    await user.send(message);
  } catch (error) {
    throw new Error(`Failed to send DM: ${error.message}`);
  }
}

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Validate environment variables
    validateEnvironment();

    // Read message from stdin
    const message = await readStdin();

    // Initialize Discord client
    const client = createDiscordClient();

    // Set up client event handling
    client.once("shardReady", async () => {
      console.log(`Logged in as ${client.user.tag}`);

      try {
        await sendDM(client, { message });
        await client.destroy();
        process.exit(CONFIG.EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error(error.message);
        await client.destroy();
        process.exit(CONFIG.EXIT_CODES.DISCORD_ERROR);
      }
    });

    // Handle client errors
    client.on("error", async (error) => {
      console.error("Discord client error:", error.message);
      await client.destroy();
      process.exit(CONFIG.EXIT_CODES.DISCORD_ERROR);
    });

    // Login to Discord
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    console.error(error.message);

    // Determine appropriate exit code based on error type
    const exitCode = error.message.includes("environment variables")
      ? CONFIG.EXIT_CODES.MISSING_ENV
      : error.message.includes("stdin")
      ? CONFIG.EXIT_CODES.STDIN_ERROR
      : CONFIG.EXIT_CODES.DISCORD_ERROR;

    process.exit(exitCode);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(CONFIG.EXIT_CODES.DISCORD_ERROR);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(CONFIG.EXIT_CODES.DISCORD_ERROR);
});

// Start the application
main();
