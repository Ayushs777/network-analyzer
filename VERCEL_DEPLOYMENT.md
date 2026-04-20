# 🚀 Vercel Deployment Guide

This project is now ready for deployment on Vercel as a full-stack monorepo.

## 📁 Deployment Structure
- **Frontend**: Vite + React (Deploys as Static Assets)
- **Backend**: FastAPI (Deploys as Serverless Functions)

## 🛠️ Step-by-Step Deployment

1. **Push to GitHub/GitLab/Bitbucket**
   Make sure all your changes are pushed to a remote repository.

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **"New Project"**.
   - Import your repository.

3. **Configure Project**
   - **Framework Preset**: Vercel should automatically detect Vite. If not, select "Other" or "Vite".
   - **Root Directory**: Keep as `./` (the root of the repo).
   - **Build Command**: `npm run build` (This will use the root `package.json` to build the frontend).
   - **Output Directory**: `frontend/dist` (Vercel will look here for static files).

4. **Environment Variables**
   In the Vercel project settings, add the following variables:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `DATABASE_URL` | `postgresql://...` | Your Supabase or PostgreSQL connection string |
   | `OPENAI_API_KEY` | `sk-...` | (Optional) If using the AI Chatbot |
   | `GROQ_API_KEY` | `...` | (Optional) If using Groq for AI |
   | `ENVIRONMENT` | `production` | Set to production |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` | Your Vercel URL |

## ⚠️ Important Notes

### 1. Packet Sniffer Limitation
Vercel uses **Serverless Functions**, which are ephemeral and do not have permission to access raw sockets.
- **The Packet Sniffer is automatically disabled on Vercel** (via the `VERCEL` env var).
- The dashboard will display data from your database (e.g., Supabase).
- To see "Live" data on Vercel, you should run the sniffer on a local machine or VPS and have it push data to your Supabase database.

### 2. Database
SQLite (`network_analyzer.db`) will **not work** on Vercel because the filesystem is read-only.
- You **must** use a managed database like **Supabase** or **Neon**.
- Update your `DATABASE_URL` in Vercel settings.

### 3. WebSockets
Vercel functions have limited support for long-lived WebSockets. While the frontend is configured to connect, you might experience timeouts. For a production-grade live stream, consider using a dedicated backend (like DigitalOcean or AWS EC2) for the WebSocket part.

## ✅ Checklist
- [x] `vercel.json` created in root.
- [x] `api/index.py` entry point created.
- [x] Frontend dynamic URLs (`config.js`) implemented.
- [x] Backend sniffer made optional for serverless.
- [x] Root `package.json` for orchestration.
