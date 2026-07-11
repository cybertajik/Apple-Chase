# Apple Chase

**Apple Chase** is a retro-style 2D platformer web game where you play as a hedgehog trying to catch falling apples from shaking trees while dodging angry guard dogs and slithering snakes!

## Features

* **Cross-Platform Controls**: Play on desktop using keyboard arrow keys/WASD, or on mobile using on-screen touch buttons and swipe gestures.
* **Dynamic Gameplay Elements**: 
  * Crumbling platforms that disappear if you stand on them too long.
  * Special apples (Golden apples for bonus points, Rainbow apples to freeze enemies, Rotten apples that slow you down).
  * An airplane supply drop that flies over periodically (at 30, 40, 50... apples) to drop extra apples and a heart (extra life).
* **Easter Eggs**: Discover hidden secrets by performing specific actions (e.g., jumping at the edge of the top floor after collecting golden apples!).
* **Global Leaderboard**: Compete with players worldwide using the built-in high score server.

---

## Self-Hosting Guide

Apple Chase consists of two parts: a static frontend (HTML/CSS/JS) and a lightweight Node.js backend for the leaderboard.

### 1. Requirements
* **Node.js** (v14.x or higher recommended)
* `npm` (Node Package Manager)
* A modern web browser

### 2. Running Locally
To run the full game and server locally on your own machine:

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your web browser and navigate to `http://localhost:3000`.

### 3. Deploying to the Web

#### Frontend (Static Files)
Since the game logic is entirely client-side, the frontend (`index.html`, `index.css`, `game.js`, and the `assets/` folder) can be hosted on any static file hosting service for free!
* **Netlify**, **Vercel**, **GitHub Pages**, or **Cloudflare Pages**.
* The game automatically detects if it's running remotely and adjusts its API calls accordingly.

#### Backend (Leaderboard Server)
To enable the global leaderboard, you need to host the `server.js` file on a platform that supports Node.js.
* **Render.com**, **Railway**, **Heroku**, or a **VPS** (like DigitalOcean).
* The server uses a local `highscores.json` file to store data. If your host uses an ephemeral file system (like Heroku), high scores will reset when the server restarts unless you map it to a persistent disk or modify `server.js` to use a database (like MongoDB or Redis).
* Make sure your Node.js hosting service exposes the port correctly (Render handles this automatically).

**Zero-Config Deployment Note:** 
The `game.js` frontend script automatically attempts to contact the server at the exact same URL it's hosted on. If you host the frontend and backend on the same service (e.g., Render Web Service serving both static files and the API), no configuration is needed!
