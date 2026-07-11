# Deployment Guide: Hedgehog Apple Chase

This guide explains how to run, deploy, and play **Hedgehog Apple Chase** on your local machine and publish it to the web.

---

## 🎮 Playing Locally

### Option 1: Double-Click (Single Player Offline)
You can play the game without running any servers:
1. Double-click `index.html` on your desktop or open it in any web browser.
2. The game will automatically detect that the backend server is offline and fall back to **Local Leaderboard Mode** (saving highscores directly to your browser's local storage).

### Option 2: Run Local Server (Full Highscore Integration)
To run the local server and host global highscores in a local JSON database:
1. Ensure you have **Node.js** installed ([https://nodejs.org](https://nodejs.org)).
2. Open a terminal (PowerShell or Command Prompt) and navigate to the game folder:
   ```bash
   cd "C:\Users\AD\Desktop\game"
   ```
3. Install dependencies (if you clean out `node_modules`):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📱 Touch & Swipe Controls

The game automatically detects touch screens and scales to fit mobile screens in portrait mode (maximizing the game canvas at the top and placing retro gaming controls at the bottom):

* **On-Screen Gamepad**:
  * ◀ / ▶: Move Left / Right.
  * ▲: Jump UP / Climb up platforms.
  * ▼: Drop DOWN through platforms.
* **Swipe Gestures** (swipe anywhere on the game canvas):
  * **Swipe Left / Right**: Run left or right.
  * **Swipe Up**: Jump.
  * **Swipe Down**: Drop through platforms.
  * **Tap Canvas**: Stop running.

---

## 🌐 Deploying to the Web

Since this project consists of a simple HTML5/JS frontend and a lightweight Express backend, it can be deployed to several free hosting services:

### 1. Render (Recommended for full backend)
Render is a free platform that supports full Node.js services:
1. Create a free account at [https://render.com](https://render.com).
2. Create a new **Web Service** and link your Git repository (containing this game's code).
3. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Render will deploy the backend and static pages at a custom URL (e.g. `https://hedgehog-apple-chase.onrender.com`).

### 2. Vercel / Netlify (Frontend Only)
If you only want to deploy the frontend static files:
1. Upload `index.html`, `index.css`, `game.js`, and the `assets/` directory to a new project on Vercel or Netlify.
2. Vercel/Netlify will automatically build the static pages.
3. The game will run in **Offline Leaderboard Mode** since the backend URL isn't configured, saving scores locally in players' browsers.

---

## 📂 Project Structure
- `index.html` - Premium game viewport structure, HUD, overlays, and touch controls.
- `index.css` - Custom styling, glassmorphism panel glowing gradients, and scrolling CRT overscan filters.
- `game.js` - Main game engine, canvas updates, physics loops, particle rendering, synthesised audio, and snake warning/dropping anti-camping logic.
- `server.js` - Express highscore manager storing global highscores in `highscores.json`.
- `assets/` - Generated retro graphics files.
