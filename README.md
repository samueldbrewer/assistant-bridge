# Assistant Bridge Service

Minimal Express service that forwards CLI-friendly chat requests to a single OpenAI Assistant thread. Send a message (and optionally an existing thread id) and it returns the ordered thread messages.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set `OPENAI_API_KEY` (do **not** commit this) and `ASSISTANT_ID` for the assistant you want to use.
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

Use the returned `threadId` on the next request to continue the same conversation:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Continue","threadId":"thread_xxx"}'
```

## Notes

- The service expects a pre-created assistant (set `ASSISTANT_ID`). To create one with the OpenAI CLI:
  ```bash
  openai assistants create -f assistant.json
  ```
  A sample `assistant.json` is included; keep the resulting `id` and set it as `ASSISTANT_ID`.
- Health check: `GET /health` returns `{ "ok": true }`.
