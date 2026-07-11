const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SCORES_FILE = path.join(__dirname, 'highscores.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Utility to read scores
function readScores() {
  try {
    if (!fs.existsSync(SCORES_FILE)) {
      // Default placeholder scores to look nice
      const defaultScores = [
        { name: "Sonic", score: 150, country: "JP", date: new Date().toISOString() },
        { name: "Mario", score: 120, country: "IT", date: new Date().toISOString() },
        { name: "Yoshi", score: 95, country: "JP", date: new Date().toISOString() },
        { name: "Luigi", score: 80, country: "IT", date: new Date().toISOString() },
        { name: "Knuckles", score: 70, country: "US", date: new Date().toISOString() },
        { name: "Tails", score: 65, country: "US", date: new Date().toISOString() },
        { name: "Peach", score: 50, country: "CA", date: new Date().toISOString() },
        { name: "Bowser", score: 40, country: "JP", date: new Date().toISOString() },
        { name: "Toad", score: 30, country: "FR", date: new Date().toISOString() },
        { name: "Wario", score: 15, country: "DE", date: new Date().toISOString() }
      ];
      fs.writeFileSync(SCORES_FILE, JSON.stringify(defaultScores, null, 2));
      return defaultScores;
    }
    const data = fs.readFileSync(SCORES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading scores file:", err);
    return [];
  }
}

// Utility to write scores
function writeScores(scores) {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (err) {
    console.error("Error writing scores file:", err);
  }
}

// GET route for scores
app.get('/api/scores', (req, res) => {
  const scores = readScores();
  res.json(scores.slice(0, 10));
});

// POST route to submit score
app.post('/api/scores', (req, res) => {
  const { name, score, country } = req.body;
  
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: "Invalid data. 'name' (string) and 'score' (number) are required." });
  }

  const cleanName = name.trim().substring(0, 15) || "Anonymous";
  const cleanCountry = (country && country.trim().toUpperCase().substring(0, 2)) || "UN";

  const scores = readScores();
  
  // Add new score
  scores.push({
    name: cleanName,
    score: score,
    country: cleanCountry,
    date: new Date().toISOString()
  });

  // Sort descending by score, then ascending by name
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });

  // Keep top 50, but we'll return top 10
  const topScores = scores.slice(0, 50);
  writeScores(topScores);

  res.json(topScores.slice(0, 10));
});

// Serves the index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hedgehog Apple Chase server running at http://localhost:${PORT}`);
});
