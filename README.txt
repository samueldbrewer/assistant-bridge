Assistant Bridge (Railway)
==========================

Overview
- Simple Express service that forwards chat requests to a single OpenAI Assistant.
- Endpoint: POST /chat
  - Body: JSON { "message": "your text", "threadId": "optional-thread-id" }
  - Returns: { threadId, messages: [ { id, role, created_at, content } ... ] }
- Health check: GET /health

Quick Start (local)
1) Install deps: npm install
2) Copy .env.example -> .env and set:
   OPENAI_API_KEY=<your key>
   ASSISTANT_ID=<assistant id>
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
- Env vars set: OPENAI_API_KEY, ASSISTANT_ID, PORT
- Redeploy after changes: railway up

Assistant
- Sample assistant definition: assistant.json
- If you create a new one: `openai assistants create -f assistant.json` and update ASSISTANT_ID.
