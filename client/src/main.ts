import type { Client } from "@modelcontextprotocol/client";
import { COMMAND_HINT, parseCommand } from "./commandParser.js";
import { getClient } from "./mcpClient.js";
import { mountRoomView } from "./roomHost.js";
import { narrateRoomState } from "./roomState.js";

const chatLog = document.querySelector<HTMLDivElement>("#chat-log")!;
const chatForm = document.querySelector<HTMLFormElement>("#chat-form")!;
const chatInput = document.querySelector<HTMLInputElement>("#chat-input")!;
const connectionStatus = document.querySelector<HTMLSpanElement>("#connection-status")!;
const roomFrameContainer = document.querySelector<HTMLDivElement>("#room-frame-container")!;

function appendLine(text: string): void {
  const line = document.createElement("p");
  line.textContent = text;
  chatLog.append(line);
  chatLog.scrollTop = chatLog.scrollHeight;
}

interface PendingElicitation {
  properties?: Record<string, unknown>;
  resolve: (result: { action: "accept" | "decline" | "cancel"; content?: Record<string, string> }) => void;
}

let pendingElicitation: PendingElicitation | undefined;

/**
 * Registers the client-side handler for attempt_escape's server-initiated
 * elicitation (plan-pracy section 2). The chat input doubles as the answer
 * box while a request is pending - the next thing the player types is the
 * elicitation response, not a new command. Only form-mode elicitation is
 * handled (the only mode the server ever sends); URL-mode params carry no
 * requestedSchema.
 */
function registerElicitationHandler(client: Client): void {
  client.setRequestHandler("elicitation/create", async (request) => {
    const { message } = request.params;
    const properties = "requestedSchema" in request.params ? request.params.requestedSchema.properties : undefined;
    appendLine(`[${message}] (type your answer, or "cancel" to back out)`);
    return new Promise((resolve) => {
      pendingElicitation = { properties, resolve };
    });
  });
}

async function narrateAndLog(client: Client): Promise<void> {
  try {
    appendLine(await narrateRoomState(client));
  } catch (error) {
    appendLine(`(couldn't read room state: ${error instanceof Error ? error.message : String(error)})`);
  }
}

async function handleCommand(client: Client, text: string): Promise<void> {
  const parsed = parseCommand(text);
  if (!parsed) {
    appendLine(COMMAND_HINT);
    return;
  }

  try {
    const result = await client.callTool({ name: parsed.tool, arguments: parsed.args });
    for (const block of result.content ?? []) {
      if (block.type === "text") appendLine(block.text);
    }
  } catch (error) {
    appendLine(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await narrateAndLog(client);
}

appendLine("The Last Shift - client shell loaded.");

connectionStatus.textContent = "connecting...";
getClient()
  .then(async (client) => {
    const server = client.getServerVersion();
    connectionStatus.textContent = `connected: ${server?.name ?? "unknown"} v${server?.version ?? "?"}`;
    appendLine(`Connected to ${server?.name} v${server?.version}.`);

    registerElicitationHandler(client);

    try {
      const host = await mountRoomView(client, roomFrameContainer);
      if (!host) {
        appendLine("No MCP Apps UI resource declared by the server's tools.");
      }
    } catch (error) {
      appendLine(`Failed to load room view: ${error instanceof Error ? error.message : String(error)}`);
    }

    await narrateAndLog(client);

    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;
      chatInput.value = "";
      appendLine(`> ${value}`);

      if (pendingElicitation) {
        const { resolve, properties } = pendingElicitation;
        pendingElicitation = undefined;
        if (/^(cancel|decline)$/i.test(value)) {
          resolve({ action: value.toLowerCase() === "decline" ? "decline" : "cancel" });
        } else {
          const propertyKey = Object.keys(properties ?? {})[0] ?? "value";
          resolve({ action: "accept", content: { [propertyKey]: value } });
        }
        return;
      }

      void handleCommand(client, value);
    });
  })
  .catch((error: unknown) => {
    connectionStatus.textContent = "connection failed";
    appendLine(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
  });
