const express = require("express");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.ASSISTANT_ID;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set. Add it to your environment or .env file.");
}

if (!assistantId) {
  throw new Error("ASSISTANT_ID is not set. Create an assistant and export ASSISTANT_ID.");
}

const client = new OpenAI({ apiKey });

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/chat", async (req, res) => {
  const { threadId, message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string in request body" });
  }

  try {
    // Create or reuse a thread so we maintain conversation context.
    const thread = threadId
      ? { id: threadId }
      : await client.beta.threads.create();

    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    await waitForRunCompletion(thread.id, run.id);

    const messages = await client.beta.threads.messages.list(thread.id, { limit: 20 });
    const orderedMessages = [...messages.data].reverse();

    res.json({
      threadId: thread.id,
      messages: orderedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        created_at: m.created_at,
        content: extractText(m),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process chat", details: err?.message });
  }
});

async function waitForRunCompletion(threadId, runId) {
  // Poll the run until it completes or fails.
  while (true) {
    const run = await client.beta.threads.runs.retrieve(threadId, runId);
    if (run.status === "completed") return;
    if (["failed", "expired", "cancelled"].includes(run.status)) {
      throw new Error(`Run ${run.status}`);
    }

    // simple backoff; short sleep to avoid hammering API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function extractText(message) {
  // Collapses text content blocks into a single string for ease of display.
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text?.value ?? "")
    .join("\n\n")
    .trim();
}

app.listen(port, () => {
  console.log(`Assistant bridge listening on port ${port}`);
});
