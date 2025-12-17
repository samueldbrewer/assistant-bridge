const express = require("express");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const { randomUUID } = require("crypto");

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.MODEL || "gpt-5.2";
const toolChoice = process.env.TOOL_CHOICE || "auto";
const browsingEnabled = process.env.DISABLE_WEB_SEARCH !== "true";
const includeWebSources = process.env.INCLUDE_WEB_SOURCES !== "false";
const systemPrompt = process.env.SYSTEM_PROMPT;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set. Add it to your environment or .env file.");
}

const client = new OpenAI({ apiKey });

// Simple in-memory store for conversations keyed by threadId.
const threads = new Map();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/chat", async (req, res) => {
  const { threadId, message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string in request body" });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const id = threadId || randomUUID();
    const history = threads.get(id) || [];

    const input = buildInput(history, message);
    const response = await client.responses.create({
      model,
      input,
      tools: browsingEnabled ? [{ type: "web_search" }] : undefined,
      tool_choice: browsingEnabled ? toolChoice : undefined,
      include: browsingEnabled && includeWebSources ? ["web_search_call.action.sources"] : undefined,
    });
    const assistantText = extractResponseText(response);

    const updated = [
      ...history,
      { id: `user_${randomUUID()}`, role: "user", created_at: now, content: message },
    ];

    if (assistantText) {
      updated.push({
        id: `asst_${randomUUID()}`,
        role: "assistant",
        created_at: Math.floor(Date.now() / 1000),
        content: assistantText,
      });
    }

    threads.set(id, updated);

    res.json({
      threadId: id,
      messages: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process chat", details: err?.message });
  }
});

function buildInput(history, nextUserMessage) {
  const input = [];

  if (!history.length && systemPrompt) {
    input.push({ role: "system", content: systemPrompt });
  }

  for (const msg of history) {
    input.push({ role: msg.role, content: msg.content });
  }

  input.push({ role: "user", content: nextUserMessage });
  return input;
}

function extractResponseText(response) {
  if (response.output_text) return response.output_text.trim();

  const parts =
    response.output
      ?.flatMap((out) =>
        out?.content
          ?.filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
      )
      .filter(Boolean) || [];

  return parts.join("\n\n").trim();
}

app.listen(port, () => {
  console.log(`Assistant bridge listening on port ${port}`);
});
