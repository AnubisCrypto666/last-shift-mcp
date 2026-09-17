import { getClient } from "./mcpClient.js";
import { mountRoomView } from "./roomHost.js";

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

appendLine("The Last Shift - client shell loaded.");

// Step 2: establish and hold the MCP session for the app's lifetime. Chat
// input isn't wired to tools/call yet - that's step 4. This only proves the
// connection itself is real and persistent.
connectionStatus.textContent = "connecting...";
getClient()
  .then(async (client) => {
    const server = client.getServerVersion();
    connectionStatus.textContent = `connected: ${server?.name ?? "unknown"} v${server?.version ?? "?"}`;
    appendLine(`Connected to ${server?.name} v${server?.version}.`);

    // Step 3: sandboxed iframe + AppBridge + PostMessageTransport, loading
    // the server's ui:// resource. Fullscreen ("Expand") wiring is step 5.
    try {
      const host = await mountRoomView(client, roomFrameContainer);
      if (!host) {
        appendLine("No MCP Apps UI resource declared by the server's tools.");
      }
    } catch (error) {
      appendLine(`Failed to load room view: ${error instanceof Error ? error.message : String(error)}`);
    }
  })
  .catch((error: unknown) => {
    connectionStatus.textContent = "connection failed";
    appendLine(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
  });

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  appendLine(`> ${value}`);
  appendLine("(tools/call wiring lands in step 4)");
  chatInput.value = "";
});
