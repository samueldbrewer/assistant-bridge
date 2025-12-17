Assistant Bridge (Responses API)
================================

Overview
- Simple Express service that forwards chat requests to the OpenAI Responses API.
- Endpoint: POST /chat
  - Body: JSON { "message": "your text", "threadId": "optional-thread-id" }
  - Returns: { threadId, messages: [ { id, role, created_at, content } ... ] }
- Health check: GET /health
- Conversation state stored in-memory; a restart clears threads.
- To change the system prompt, set SYSTEM_PROMPT in env/Railway and restart; it applies to new threads.

Quick Start (local)
1) Install deps: npm install
2) Copy .env.example -> .env and set:
   OPENAI_API_KEY=<your key>
   MODEL=gpt-4.1-mini (or your preferred model)
   SYSTEM_PROMPT=You are a concise CLI helper. (optional)
   PORT=3000
3) Run: npm start
4) Test:
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello"}'

Continue a thread
- Use the returned threadId in the next request:
  curl -X POST http://localhost:3000/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Continue","threadId":"thread_xxx"}'

Railway Deployment (already set up)
- Project: assistant-bridge
- Domain: https://assistant-bridge-production.up.railway.app
- Env vars set: OPENAI_API_KEY, MODEL, PORT
- Redeploy after changes: railway up
