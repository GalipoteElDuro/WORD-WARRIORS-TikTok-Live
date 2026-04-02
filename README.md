<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Architecture

- **Frontend** (React + Vite): Port 3000
- **Backend** (Node.js + WebSocket): Port 3001 — Connects to TikTok Live via `tiktok-live-connector`

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`

2. Set the `OPENROUTER_API_KEY` in `.env.local` (copy from `.env.local.example`):
   ```
   OPENROUTER_API_KEY="sk-or-v1-your-key"
   OPENROUTER_MODEL="openrouter/free"
   ```

3. Run both servers (frontend + backend):
   `npm run dev`

   Or run them separately:
   ```
   npm run dev:server   # Backend WebSocket on port 3001
   npm run dev:client   # Frontend Vite on port 3000
   ```

4. Open http://localhost:3000, enter your TikTok username and connect.
