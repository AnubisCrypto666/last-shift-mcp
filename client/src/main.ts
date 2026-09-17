const chatLog = document.querySelector<HTMLDivElement>("#chat-log")!;
const chatForm = document.querySelector<HTMLFormElement>("#chat-form")!;
const chatInput = document.querySelector<HTMLInputElement>("#chat-input")!;

function appendLine(text: string): void {
  const line = document.createElement("p");
  line.textContent = text;
  chatLog.append(line);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Step 1 scaffold only: no MCP wiring yet (that's step 2). This just proves
// the Vite shell and DOM wiring work before any protocol code touches it.
appendLine("The Last Shift - client shell loaded. Not connected to the server yet.");

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  appendLine(`> ${value}`);
  appendLine("(not connected yet - tools/call wiring lands in step 2)");
  chatInput.value = "";
});
