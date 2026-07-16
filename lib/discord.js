/**
 * Minimal Discord REST API client.
 * https://docs.discord.com/developers/reference
 */

const API_BASE = "https://discord.com/api/v10";

async function discordRequest(token, path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 429) {
    const { retry_after: retryAfter } = await response.json();
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return discordRequest(token, path, options);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord API error ${response.status}: ${body}`);
  }

  return response.json();
}

function createChannel(token, userId) {
  return discordRequest(token, "/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });
}

function sendMessage(token, channelId, content) {
  return discordRequest(token, `/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

module.exports = {
  createChannel,
  sendMessage,
};
