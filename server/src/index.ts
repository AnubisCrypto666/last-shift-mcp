import { createApp } from "./app.js";

const PORT = process.env.MCP_PORT ? Number.parseInt(process.env.MCP_PORT, 10) : 3000;
const ALLOWED_ORIGINS = (process.env.MCP_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = createApp({ allowedOrigins: ALLOWED_ORIGINS });

app.listen(PORT, () => {
  console.log(`last-shift-mcp server listening on http://127.0.0.1:${PORT}/mcp`);
});
