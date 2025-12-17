# Assistant Bridge Service (Responses API)

Minimal Express service that forwards CLI-friendly chat requests to the OpenAI Responses API. You send a message (and optionally an existing thread id) and it returns the ordered chat messages kept in-memory.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set `OPENAI_API_KEY` (do **not** commit this).
   - Optional: override `MODEL` (default `gpt-5.2`), `SYSTEM_PROMPT`, `TOOL_CHOICE` (defaults to `auto`), `DISABLE_WEB_SEARCH` (`true` to turn off), and `INCLUDE_WEB_SOURCES` (`false` to skip source return metadata).
3. Start locally:
   ```bash
   npm start
   # listens on PORT (default 3000)
   ```

## API

- `POST /chat`
  - Body (JSON):
    ```json
    { "message": "Hi there", "threadId": "optional-thread-id" }
    ```
  - Returns:
    ```json
    {
      "threadId": "thread_xxx",
      "messages": [
        { "id": "...", "role": "user", "created_at": 123, "content": "Hi there" },
        { "id": "...", "role": "assistant", "created_at": 124, "content": "Hello!" }
      ]
    }
    ```

Example curl:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from CLI"}'
```

Use the returned `threadId` on the next request to continue the same conversation (state is kept in-memory per service instance):
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Continue","threadId":"thread_xxx"}'
```

## Notes

- Uses the Responses API (no Assistants objects). Conversation history is stored in-memory; a restart will clear threads.
- To change the system prompt, set `SYSTEM_PROMPT` in your environment (or Railway variables) and restart/redeploy. The prompt is only injected for new threads.
- The service defaults to OpenAI model `gpt-5.2` with browsing enabled (`web_search` tool, `tool_choice: auto`, and `include: ["web_search_call.action.sources"]`). Set `MODEL`, `TOOL_CHOICE`, `DISABLE_WEB_SEARCH`, or `INCLUDE_WEB_SOURCES` to adjust.
- Health check: `GET /health` returns `{ "ok": true }`.
