#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createChannel, sendMessage } from "./lib/discord.js";

async function main() {
  try {
    const required = ["BOT_TOKEN", "DM_USER_ID"];
    const missing = required.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    const { file, attach } = parseArgs(process.argv.slice(2));
    const message = file
      ? await readMessageFromFile(file)
      : await readMessageFromStdin();
    const attachment = attach ? await readAttachment(attach) : undefined;
    const { BOT_TOKEN: botToken, DM_USER_ID: userID } = process.env;
    const channel = await createChannel(botToken, userID);
    await sendMessage(botToken, channel.id, message, attachment);

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {};
  const flags = {
    "--file": "file",
    "-f": "file",
    "--attach": "attach",
    "-a": "attach",
  };

  for (let i = 0; i < argv.length; i++) {
    const key = flags[argv[i]];
    if (!key) {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }

    const value = argv[++i];
    if (!value) {
      throw new Error(`Missing value for ${argv[i - 1]}`);
    }

    args[key] = value;
  }

  return args;
}

async function readMessageFromFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error(`File is empty: ${filePath}`);
  }
  return trimmed;
}

async function readAttachment(filePath) {
  const data = await readFile(filePath);
  return { filename: basename(filePath), data };
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
