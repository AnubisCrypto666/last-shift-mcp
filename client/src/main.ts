import { getClient } from "./mcpClient.js";

const chatLog = document.querySelector<HTMLDivElement>("#chat-log")!;
const chatForm = document.querySelector<HTMLFormElement>("#chat-form")!;
const chatInput = document.querySelector<HTMLInputElement>("#chat-input")!;
const connectionStatus = document.querySelector<HTMLSpanElement>("#connection-status")!;

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
  .then((client) => {
    const server = client.getServerVersion();
    connectionStatus.textContent = `connected: ${server?.name ?? "unknown"} v${server?.version ?? "?"}`;
    appendLine(`Connected to ${server?.name} v${server?.version}.`);
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
