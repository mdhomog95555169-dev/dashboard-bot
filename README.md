# Discord Bot & Web Dashboard Suite (Render Fixed Edition)

This is the fully corrected, production-ready Discord Bot and Web Dashboard repository.
All OAuth2 Login Loops, express-session cookie conflicts, trust-proxy issues, and Gateway Intents have been resolved.

## 🚀 Quick Start on Render.com

1. Create a new **Web Service** on [Render.com](https://dashboard.render.com).
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `node src/index.js`
4. Add the following **Environment Variables** in Render:
   - `BOT_TOKEN`: Your Discord Bot Token
   - `CLIENT_ID`: Your Discord OAuth2 Client ID
   - `CLIENT_SECRET`: Your Discord OAuth2 Client Secret
   - `CALLBACK_URL`: `https://your-app-name.onrender.com/auth/discord/callback`
   - `SESSION_SECRET`: A random 32+ character string
   - `NODE_ENV`: `production`
   - `MONGO_URI`: (Optional) MongoDB connection string for persistent sessions

5. In **Discord Developer Portal > Applications > OAuth2 > Redirects**:
   Add: `https://your-app-name.onrender.com/auth/discord/callback`

6. In **Discord Developer Portal > Applications > Bot**:
   Enable all 3 **Privileged Gateway Intents** (Presence, Server Members, Message Content).

## 🛠️ Key Fixes Included
- ✅ `app.set('trust proxy', 1)` for Render reverse proxy HTTPS detection.
- ✅ Cookie `sameSite: 'lax'` and dynamic `secure` flag to prevent OAuth2 redirect cookie drops.
- ✅ Discord.js v14 Intents & Partials support.
- ✅ Safe `req.session.save()` on OAuth2 callback.
- ✅ Keep-alive `/health` route for 24/7 uptime monitoring.
