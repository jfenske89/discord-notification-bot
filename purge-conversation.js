/**
 * Discord Conversation Purge Tool
 * A utility to delete all bot messages from a direct message conversation.
 * Useful for testing and maintenance purposes.
 *
 * @module purge-conversation
 */

const { Client, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

// Constants
const CONFIG = {
  REQUIRED_ENV_VARS: ["BOT_TOKEN", "DM_USER_ID"],
  EXIT_CODES: {
    SUCCESS: 0,
    MISSING_ENV: 1,
    DISCORD_ERROR: 2,
    RATE_LIMIT: 3,
  },
  RATE_LIMIT: {
    DELAY_MS: 1000,
    BATCH_SIZE: 50,
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
 * Creates a delay for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates and configures a Discord client
 * @returns {Client} Configured Discord client
 */
function createDiscordClient() {
  return new Client({
    intents: [GatewayIntentBits.DirectMessages],
    partials: [Partials.Channel],
  });
}

/**
 * Deletes all bot messages from a direct message conversation
 * @param {Client} client - Discord client instance
 * @param {string} userId - Target user ID
 * @returns {Promise<number>} Number of messages deleted
 * @throws {Error} If deletion fails
 */
async function deleteBotMessagesFromDM(client, userId) {
  let messagesDeleted = 0;
  let lastMessageId;

  try {
    const user = await client.users.fetch(userId);
    const dmChannel = await user.createDM();

    while (true) {
      const options = { limit: CONFIG.RATE_LIMIT.BATCH_SIZE };
      if (lastMessageId) options.before = lastMessageId;

      const messages = await dmChannel.messages.fetch(options);
      if (messages.size === 0) break;

      for (const message of messages.values()) {
        if (message.author.id === client.user.id) {
          try {
            await message.delete();
            messagesDeleted++;
            console.log(`Deleted message ID: ${message.id}`);
            await delay(CONFIG.RATE_LIMIT.DELAY_MS);
          } catch (error) {
            if (error.code === 50001) {
              throw new Error("Rate limit exceeded");
            }
            console.error(
              `Failed to delete message ${message.id}:`,
              error.message
            );
          }
        }
      }

      lastMessageId = messages.last().id;
    }

    return messagesDeleted;
  } catch (error) {
    throw new Error(`Failed to delete messages: ${error.message}`);
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

    // Initialize Discord client
    const client = createDiscordClient();

    // Set up client event handling
    client.once("ready", async () => {
      console.log(`Logged in as ${client.user.tag}`);

      try {
        const deletedCount = await deleteBotMessagesFromDM(
          client,
          process.env.DM_USER_ID
        );
        console.log(`✅ Finished. Deleted ${deletedCount} messages.`);
        await client.destroy();
        process.exit(CONFIG.EXIT_CODES.SUCCESS);
      } catch (error) {
        console.error("Error:", error.message);
        await client.destroy();
        process.exit(
          error.message.includes("Rate limit")
            ? CONFIG.EXIT_CODES.RATE_LIMIT
            : CONFIG.EXIT_CODES.DISCORD_ERROR
        );
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
    process.exit(
      error.message.includes("environment variables")
        ? CONFIG.EXIT_CODES.MISSING_ENV
        : CONFIG.EXIT_CODES.DISCORD_ERROR
    );
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
