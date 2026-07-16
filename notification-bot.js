#!/usr/bin/env node

const { createChannel, sendMessage } = require("./lib/discord");

async function main() {
  try {
    const required = ["BOT_TOKEN", "DM_USER_ID"];
    const missing = required.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    const message = await readMessageFromStdin();
    const { BOT_TOKEN: botToken, DM_USER_ID: userID } = process.env;
    const channel = await createChannel(botToken, userID);
    await sendMessage(botToken, channel.id, message);

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

async function readMessageFromStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin
      .on("data", (chunk) => {
        input += chunk;
      })
      .on("end", () => {
        const trimmed = input.trim();
        if (!trimmed) {
          return reject(new Error("No message input received"));
        }
        resolve(trimmed);
      })
      .on("error", (error) => {
        reject(new Error(`Failed to read from stdin: ${error.message}`));
      });
  });
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main();
