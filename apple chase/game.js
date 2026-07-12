// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.55;
const PLAYER_SPEED = 4.5;
const JUMP_FORCE = -11.5;
const LEVEL_UP_APPLES = 5;



// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State Variables
let gameState = 'loading'; // loading, menu, playing, gameover, submit
let score = 0;
let level = 1;
let applesCollected = 0;
let lives = 3;
let keys = {};
let previousKeys = {};


// Audio & Screen Juice State
let audioCtx = null;
let isMuted = false;
let screenShake = 0;
let bgScrollOffset = 0;
let dogFreezeTimer = 0;        // frames dogs remain frozen (rainbow apple)
let shrinkSpeedMult = 1.0;     // platform shrink speed multiplier (golden apple slows it)

// Game Entities
let player;
let platforms = [];
let trees = [];
let apples = [];
let dogs = [];
let snakes = [];
let floatingTexts = [];
let particles = [];
let gameTime = 0;

// New state variables for Easter Egg & Plane
let goldApplesCollected = 0;
let consecutiveJumps = 0;
let easterEggTimer = 0;
let fireworks = [];
let planes = [];
let nextPlaneAppleTarget = 30;

// Asset Loading
const assets = {
  background: new Image(),
  hedgehog_idle: new Image(),
  hedgehog_run: new Image(),
  dog_run: new Image(),
  dog_idle: new Image(),
  apple_tree: new Image(),
  apple: new Image(),
  apple_gold: new Image(),
  apple_rainbow: new Image(),
  plane: new Image()
};

const assetPaths = {
  background: 'assets/background.png',
  hedgehog_idle: 'assets/hedgehog_idle.png',
  hedgehog_run: 'assets/hedgehog_run.png',
  dog_run: 'assets/dog_run.png',
  dog_idle: 'assets/dog_idle.png',
  apple_tree: 'assets/apple_tree.png',
  apple: 'assets/apple.png',
  apple_gold: 'assets/apple_gold.png',
  apple_rainbow: 'assets/apple_rainbow.png',
  plane: 'assets/plane.png'
};

// Background Music
const bgMusic = new Audio('assets/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.25;

let loadedAssetsCount = 0;
const totalAssets = Object.keys(assetPaths).length;

function loadAssets() {
  for (let key in assetPaths) {
    assets[key].src = assetPaths[key];
    assets[key].onload = () => {
      loadedAssetsCount++;
      if (loadedAssetsCount === totalAssets) {
        onAssetsLoaded();
      }
    };
    assets[key].onerror = () => {
      console.warn(`Failed to load asset: ${key}, using procedural fallback drawings.`);
      loadedAssetsCount++;
      if (loadedAssetsCount === totalAssets) {
        onAssetsLoaded();
      }
    };
  }
}

// Platforms definitions
function initPlatforms() {
  platforms = [
    // Bottom Floor (Floor 0)
    { x: 0, y: 550, width: CANVAS_WIDTH, height: 50, id: 0 },
    // Floor 1 (Split in the middle: Left is 50-350, Right is 450-750)
    { x: 50, y: 450, width: 300, height: 20, id: 1 },
    { x: 450, y: 450, width: 300, height: 20, id: 1, shrinkable: true, origX: 450, origWidth: 300, shrinkTimer: 0 },
    // Floor 2
    { x: 50, y: 350, width: 700, height: 20, id: 2 },
    // Floor 3 (Top Floor)
    { x: 100, y: 250, width: 600, height: 20, id: 3 }
  ];
}

// Tree definitions - one per floor, staggered locations
function initTrees() {
  trees = [
    // Floor 0 tree (on bottom, right side)
    { x: 670, y: 454, floorY: 550, shakeTimer: 0, nextShake: 200, state: 'idle', id: 0 },
    // Floor 1 tree (left side of the left platform)
    { x: 80, y: 354, floorY: 450, shakeTimer: 0, nextShake: 400, state: 'idle', id: 1 },
    // Floor 2 tree (right side)
    { x: 620, y: 254, floorY: 350, shakeTimer: 0, nextShake: 300, state: 'idle', id: 2 },
    // Floor 3 tree (top, center)
    { x: 352, y: 154, floorY: 250, shakeTimer: 0, nextShake: 500, state: 'idle', id: 3 }
  ];
}

// Dog definitions - one per floor, staying on their floor
function initDogs() {
  dogs = [
    // Floor 0 dog
    { x: 200, y: 502, width: 48, height: 48, speed: 2, dir: 1, minX: 10, maxX: 740, floorId: 0 },
    // Floor 1 dog (stays on left platform)
    { x: 150, y: 402, width: 48, height: 48, speed: 2.3, dir: -1, minX: 60, maxX: 300, floorId: 1 },
    // Floor 2 dog
    { x: 400, y: 302, width: 48, height: 48, speed: 2.6, dir: 1, minX: 70, maxX: 700, floorId: 2 },
    // Floor 3 dog
    { x: 250, y: 202, width: 48, height: 48, speed: 3, dir: -1, minX: 120, maxX: 640, floorId: 3 }
  ];
}

// Player / Hedgehog initialization
function initPlayer() {
  player = {
    x: 150,
    y: 490, // starts above Floor 0
    width: 44,
    height: 44,
    vx: 0,
    vy: 0,
    facing: 1, // 1 for right, -1 for left
    isGrounded: false,
    jumpHoldTimer: 0,
    invulnTimer: 0,
    slowTimer: 0, // slowed if rotten apple collected
    underTreeTimer: 0, // timer for standing under trees
    currentFloor: 0,
    wobblePhase: 0,
    squashX: 1,
    squashY: 1,
    state: 'idle' // idle, running, jumping, dead
  };
}



// Particle System
function spawnParticle(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      size: Math.random() * 4 + 3,
      color: color,
      alpha: 1,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

// Floating Text System (+10, etc)
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x: x,
    y: y,
    text: text,
    color: color,
    vy: -1.5,
    alpha: 1,
    life: 50
  });
}

// Sound Synthesis Engine (Web Audio API)
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (isMuted) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    if (type === 'jump') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'collect') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(480, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'gold') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.setValueAtTime(554, now + 0.06);
      osc1.frequency.setValueAtTime(659, now + 0.12);
      osc1.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.setValueAtTime(523, now);
      osc2.frequency.setValueAtTime(659, now + 0.06);
      osc2.frequency.setValueAtTime(784, now + 0.12);
      osc2.frequency.setValueAtTime(1046, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === 'hit') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'rotten') {
      // Rotten apple hit sound: descending buzz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(261.6, now); // C4
      osc.frequency.setValueAtTime(329.6, now + 0.08); // E4
      osc.frequency.setValueAtTime(392.0, now + 0.16); // G4
      osc.frequency.setValueAtTime(523.3, now + 0.24); // C5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'gameover') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(196, now + 0.18); // G3
      osc.frequency.setValueAtTime(164.8, now + 0.36); // E3
      osc.frequency.setValueAtTime(110, now + 0.54); // A2
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  } catch (e) {
    console.error("Web Audio API not allowed / error:", e);
  }
}

// Event Listeners for UI
function setupEventListeners() {
  // Start Game
  document.getElementById('btn-start').addEventListener('click', () => {
    switchScreen('hud', true);
    startGame();
  });

  // How to Play Screen
  document.getElementById('btn-how').addEventListener('click', () => {
    switchScreen('how-screen');
  });
  document.getElementById('btn-how-back').addEventListener('click', () => {
    switchScreen('menu-screen');
  });



  // Play Again / Restart
  document.getElementById('btn-restart').addEventListener('click', () => {
    switchScreen('hud', true);
    startGame();
  });
  document.getElementById('btn-gameover-menu').addEventListener('click', () => {
    switchScreen('menu-screen');
  });



  // Keyboard events
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Prevent space & arrow keys scrolling the window
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Touch controls events
  setupTouchButton('ctrl-left', 'ArrowLeft');
  setupTouchButton('ctrl-right', 'ArrowRight');
  setupTouchButton('ctrl-up', 'ArrowUp');

  // Detect touch support and show on-screen buttons
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    document.getElementById('touch-controls').classList.remove('hidden');
  }

  // Swipe Gestures on the game canvas/wrapper
  const gameWrapper = document.getElementById('game-wrapper');
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let swipeTimeout = null;

  gameWrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      
      // Stop active swipe movement on tap
      if (swipeTimeout) {
        clearTimeout(swipeTimeout);
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
      }
    }
  }, { passive: true });

  gameWrapper.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const dt = touchEndTime - touchStartTime;

      const minDistance = 30; // Min pixels for swipe
      const maxTime = 400; // Max time for swipe in ms

      if (dt < maxTime) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (Math.abs(dx) > minDistance) {
            if (dx > 0) {
              triggerSwipeKey('ArrowRight');
            } else {
              triggerSwipeKey('ArrowLeft');
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(dy) > minDistance) {
            if (dy < 0) {
              // Swipe up to jump
              triggerSwipeKey('ArrowUp');
            } else {
              // Swipe down to drop
              triggerSwipeKey('ArrowDown');
            }
          }
        }
      }
    }
  }, { passive: true });

  function triggerSwipeKey(keyCode) {
    if (keyCode === 'ArrowUp') {
      keys['ArrowUp'] = true;
      setTimeout(() => { keys['ArrowUp'] = false; }, 80);
    } else if (keyCode === 'ArrowDown') {
      keys['ArrowDown'] = true;
      setTimeout(() => { keys['ArrowDown'] = false; }, 120);
    } else {
      // Clear movement keys and apply new direction
      keys['ArrowLeft'] = false;
      keys['ArrowRight'] = false;
      keys[keyCode] = true;
      
      if (swipeTimeout) clearTimeout(swipeTimeout);
      swipeTimeout = setTimeout(() => {
        keys[keyCode] = false;
      }, 400); // Hold direction key down for 400ms
    }
  }

  // Handle click on canvas to cancel horizontal swipe movement too
  gameWrapper.addEventListener('mousedown', () => {
    if (swipeTimeout) {
      clearTimeout(swipeTimeout);
      keys['ArrowLeft'] = false;
      keys['ArrowRight'] = false;
    }
  });

  // Mute Button listener - toggles both SFX and background music
  document.getElementById('btn-mute').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('btn-mute').innerText = isMuted ? '🔇' : '🔊';
    if (isMuted) {
      bgMusic.pause();
    } else if (gameState === 'playing') {
      bgMusic.play().catch(e => console.log("BGM play blocked:", e));
    }
    initAudio();
  });
}

function setupTouchButton(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys[keyCode] = true;
  });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys[keyCode] = false;
  });
  btn.addEventListener('mousedown', () => {
    keys[keyCode] = true;
  });
  btn.addEventListener('mouseup', () => {
    keys[keyCode] = false;
  });
  btn.addEventListener('mouseleave', () => {
    keys[keyCode] = false;
  });
}

function switchScreen(screenId, isGameOverlay = false) {
  // Hide all screens
  const screens = ['menu-screen', 'how-screen', 'gameover-screen'];
  screens.forEach(s => {
    document.getElementById(s).className = 'overlay-screen hidden';
  });

  const hud = document.getElementById('hud');
  if (isGameOverlay) {
    hud.className = 'hud-container'; // Make HUD visible
    gameState = 'playing';
  } else {
    hud.className = 'hidden';
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
      activeScreen.className = 'overlay-screen active';
    }
    if (screenId === 'menu-screen') {
      gameState = 'menu';
      bgMusic.pause();
    } else if (screenId === 'gameover-screen') {
      gameState = 'gameover';
      bgMusic.pause();

    }
  }
}

// Game Start Logic
function startGame() {
  score = 0;
  level = 1;
  applesCollected = 0;
  lives = 3;
  apples = [];
  snakes = [];
  particles = [];
  floatingTexts = [];
  gameTime = 0;
  dogFreezeTimer = 0;
  shrinkSpeedMult = 1.0;
  
  goldApplesCollected = 0;
  consecutiveJumps = 0;
  easterEggTimer = 0;
  fireworks = [];
  planes = [];
  nextPlaneAppleTarget = 30;
  
  updateHUD();
  initPlatforms();
  initTrees();
  initDogs();
  initPlayer();
  
  gameState = 'playing';

  // Start background music
  if (!isMuted) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("BGM autoplay blocked:", e));
  }
}

function updateHUD() {
  document.getElementById('hud-score').innerText = String(score).padStart(5, '0');
  document.getElementById('hud-level').innerText = level;
  document.getElementById('hud-apples').innerText = applesCollected;
  document.getElementById('hud-lives').innerText = '❤️'.repeat(Math.max(0, lives));
}

// Assets Load finish trigger
function onAssetsLoaded() {
  gameState = 'menu';

}

// Helper: check if AABB box overlap
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Core Game Update Loop
function update() {
  if (gameState !== 'playing') {
    // Menu background animation tick
    gameTime++;
    return;
  }

  gameTime++;
  
  // Invulnerability timer tick
  if (player.invulnTimer > 0) {
    player.invulnTimer--;
  }

  // Screen shake decay
  if (screenShake > 0) {
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }

  // 1. UPDATE PLAYER PHYSICS
  player.vx = 0;

  // Speed multiplier if slowed by rotten apple
  let speedMultiplier = 1.0;
  if (player.slowTimer > 0) {
    player.slowTimer--;
    speedMultiplier = 0.55;
    // Spawn toxic particles
    if (gameTime % 8 === 0) {
      spawnParticle(player.x + player.width/2, player.y + player.height/2, '#8a2be2', 1);
    }
  }

  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = -PLAYER_SPEED * speedMultiplier;
    player.facing = -1;
    player.state = 'running';
    player.wobblePhase += 0.2;
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = PLAYER_SPEED * speedMultiplier;
    player.facing = 1;
    player.state = 'running';
    player.wobblePhase += 0.2;
  } else {
    player.state = 'idle';
  }

  // Update parallax scroll offset based on movement
  bgScrollOffset += player.vx * 0.15;

  // Horizontal Movement
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x > CANVAS_WIDTH - player.width) player.x = CANVAS_WIDTH - player.width;

  // Jump Input
  const jumpTriggered = (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !(previousKeys['Space'] || previousKeys['ArrowUp'] || previousKeys['KeyW']);
  if (jumpTriggered && player.isGrounded) {
    player.vy = JUMP_FORCE;
    player.isGrounded = false;
    player.squashX = 0.7; // jump squash
    player.squashY = 1.3;
    playSound('jump');
    
    // Easter Egg Jump Tracking
    if (player.currentFloor === 3 && player.x > 600) {
      consecutiveJumps++;
      if (consecutiveJumps >= 3 && goldApplesCollected >= 3 && easterEggTimer <= 0) {
        triggerEasterEgg();
        consecutiveJumps = 0; // reset after triggering
      }
    } else {
      consecutiveJumps = 1; // Not at the right edge, start over
    }
  }

  // Reset consecutive jumps if moving left or off floor 3
  if (player.state === 'running' && player.vx < 0) {
    consecutiveJumps = 0;
  }
  if (player.currentFloor !== 3) {
    consecutiveJumps = 0;
  }

  // Apply Gravity
  player.vy += GRAVITY;
  player.y += player.vy;
  player.isGrounded = false;

  // Platform collision resolution (downwards landing)
  // Check if player is moving down
  if (player.vy >= 0) {
    // Determine if player drops down through platform
    const dropPressed = keys['ArrowDown'] || keys['KeyS'];
    
    for (let platform of platforms) {
      // Check collision with platform top only if not dropping through
      if (dropPressed && platform.id > 0 && player.y + player.height - player.vy <= platform.y + 4) {
        // Let player pass through Floor 1,2,3 platforms if S/Down is pressed
        continue;
      }
      
      // AABB check with platform
      if (player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y &&
          player.y + player.height - player.vy <= platform.y + 8) {
        
        player.y = platform.y - player.height;
        player.vy = 0;
        
        if (!player.isGrounded) {
          player.isGrounded = true;
          player.currentFloor = platform.id;
          player.squashX = 1.25; // landing squash
          player.squashY = 0.75;
        }
        break;
      }
    }
  }

  // Smooth squash/stretch recovery
  player.squashX += (1 - player.squashX) * 0.15;
  player.squashY += (1 - player.squashY) * 0.15;

  // Bounds checks
  if (player.y > CANVAS_HEIGHT) {
    // Fell out of bounds (should not happen with floor 0 solid platform, but for safety)
    player.y = 500;
    player.vy = 0;
    takeDamage();
  }

  // Save key states for triggers
  previousKeys = { ...keys };

  // 1b. UPDATE SHRINKABLE PLATFORM
  // Accumulated timer: 60 seconds total (3600 frames at 60fps) of standing to fully collapse
  // Shrink rate is multiplied by shrinkSpeedMult (golden apple makes it 1.5x slower)
  const SHRINK_TOTAL_FRAMES = 3600;
  platforms.forEach(platform => {
    if (!platform.shrinkable) return;
    const onPlatform = player.isGrounded &&
      player.currentFloor === 1 &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width;
    if (onPlatform && platform.origWidth > 0 && platform.width > 0) {
      // Accumulate fractional frames, shrinkSpeedMult < 1 = slower shrink
      platform.shrinkTimer += shrinkSpeedMult;
      // Recompute width/x from accumulated timer
      const shrinkAmt = platform.origWidth / SHRINK_TOTAL_FRAMES;
      platform.x = Math.min(platform.origX + platform.origWidth, platform.origX + (platform.shrinkTimer * shrinkAmt));
      platform.width = Math.max(0, platform.origWidth - (platform.shrinkTimer * shrinkAmt));
      // Warning flicker at halfway
      if (Math.floor(platform.shrinkTimer) === Math.floor(SHRINK_TOTAL_FRAMES / 2)) {
        spawnFloatingText(platform.origX + platform.origWidth / 2, platform.y - 20, '⚠️ CRUMBLING!', '#fffb00');
      }
      // Platform fully gone
      if (platform.width <= 0) {
        platform.width = 0;
        if (player.isGrounded && player.currentFloor === 1) {
          player.isGrounded = false;
        }
      }
    }
  });

  // Decay shrinkSpeedMult back to 1.0 over time (golden apple effect wears off after ~10 secs)
  if (shrinkSpeedMult < 1.0) {
    shrinkSpeedMult = Math.min(1.0, shrinkSpeedMult + 1 / 600);
  }

  // 2. UPDATE APPLE TREES
  trees.forEach(tree => {
    if (tree.state === 'idle') {
      tree.nextShake--;
      if (tree.nextShake <= 0) {
        tree.state = 'shaking';
        // Shakes longer/more intense at higher levels
        tree.shakeTimer = 80; 
      }
    } else if (tree.state === 'shaking') {
      tree.shakeTimer--;
      if (tree.shakeTimer <= 0) {
        tree.state = 'idle';
        // Base frequency 400 frames, reduces by 40 frames per level (max frequency trigger every 150 frames)
        tree.nextShake = Math.max(150, 400 - (level * 35) + Math.random() * 200);
        // Spawn apple!
        spawnApple(tree.x + 36, tree.y + 48, tree.floorY);
      }
    }
  });

  // Standing under trees timer check (anti-camping snake mechanic)
  let underAnyTree = false;
  let targetTree = null;
  if (trees && trees.length > 0) {
    trees.forEach(tree => {
      // Check if player is on the same floor as the tree
      // AND within 60px of the tree center horizontally
      if (player.currentFloor === tree.id && Math.abs((player.x + player.width/2) - (tree.x + 48)) < 60) {
        underAnyTree = true;
        targetTree = tree;
      }
    });
  }

  if (underAnyTree) {
    player.underTreeTimer++;
    // Warning warning at 120 frames (2 seconds)
    if (player.underTreeTimer === 120) {
      spawnFloatingText(player.x - 20, player.y - 30, "⚠️ CAREFUL!", '#fffb00');
    }
    // Spawn snake after 4 seconds (240 frames)
    if (player.underTreeTimer >= 240) {
      spawnSnake(targetTree);
      player.underTreeTimer = 0; // reset timer to avoid spawning continuously
    }
  } else {
    player.underTreeTimer = 0;
  }

  // 3. UPDATE APPLES
  apples.forEach((apple, idx) => {
    // Fall physics
    if (!apple.isGrounded) {
      apple.vy += GRAVITY * 0.8;
      apple.y += apple.vy;
      
      // Check collision with its target floor platform
      if (apple.y + apple.height >= apple.floorY) {
        apple.y = apple.floorY - apple.height;
        if (apple.bounceCount > 0) {
          apple.vy = -apple.vy * 0.4; // bounce
          apple.bounceCount--;
        } else {
          apple.vy = 0;
          apple.isGrounded = true;
        }
      }
    }

    // Lifetime countdown
    apple.lifetime--;
    if (apple.lifetime <= 0) {
      // Disappear particles
      spawnParticle(apple.x + 10, apple.y + 10, '#990000', 4);
      apples.splice(idx, 1);
      return;
    }

    // Collect Collision check
    const appleRect = { x: apple.x, y: apple.y, width: apple.width, height: apple.height };
    const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
    if (checkCollision(playerRect, appleRect)) {
      // Collect!
      if (apple.type === 'rainbow') {
        score += 50;
        applesCollected++;
        // Freeze all dogs for 6 seconds (360 frames)
        dogFreezeTimer = 360;
        spawnParticle(apple.x + 10, apple.y + 10, '#ff00ff', 20);
        spawnFloatingText(apple.x - 20, apple.y - 10, "🌈 FREEZE! +50", '#ff77ff');
        playSound('gold');
      } else if (apple.type === 'golden') {
        score += apple.scoreValue;
        applesCollected++;
        goldApplesCollected++;
        spawnParticle(apple.x + 10, apple.y + 10, '#fffb00', 12);
        spawnFloatingText(apple.x - 15, apple.y - 10, "+30 GOLD!", '#fffb00');
        // Slow platform shrink: current rate * (1/1.5) = 0.667x for 10 seconds
        shrinkSpeedMult = Math.min(shrinkSpeedMult, 1.0 / 1.5);
        playSound('gold');
      } else if (apple.type === 'rotten') {
        score = Math.max(0, score + apple.scoreValue);
        player.slowTimer = 180; // 3 seconds slow
        spawnParticle(apple.x + 10, apple.y + 10, '#8a2be2', 8);
        spawnFloatingText(apple.x - 20, apple.y - 10, "-15 ROTTEN!", '#ff007f');
        playSound('rotten');
      } else {
        score += apple.scoreValue;
        applesCollected++;
        spawnParticle(apple.x + 10, apple.y + 10, '#fffb00', 8);
        spawnFloatingText(apple.x, apple.y - 10, "+10", '#fffb00');
        playSound('collect');
      }
      
      // Level Up check
      if (applesCollected > 0 && applesCollected % LEVEL_UP_APPLES === 0 && apple.type !== 'rotten' && apple.type !== 'heart') {
        level++;
        spawnFloatingText(player.x, player.y - 30, `LEVEL ${level}!`, '#00f2fe');
        spawnParticle(player.x + 20, player.y + 20, '#00f2fe', 12);
        playSound('levelup');
      }

      // Airplane flyover check
      if (applesCollected >= nextPlaneAppleTarget && nextPlaneAppleTarget <= 90 && apple.type !== 'rotten' && apple.type !== 'heart') {
        spawnPlane();
        nextPlaneAppleTarget += 10;
      }

      // 50 apples gives you one life! (Ignored if airplane spawns)
      if (applesCollected > 0 && applesCollected % 50 === 0 && apple.type !== 'rotten' && apple.type !== 'heart') {
        lives++;
        spawnFloatingText(player.x, player.y - 45, "+1 LIFE!", '#ff007f');
        spawnParticle(player.x + 20, player.y + 20, '#ff007f', 15);
        playSound('levelup');
      } else if (apple.type === 'heart') {
        lives++;
        spawnFloatingText(player.x, player.y - 45, "+1 LIFE!", '#ff007f');
        spawnParticle(player.x + 20, player.y + 20, '#ff007f', 15);
        playSound('levelup');
      }
      
      updateHUD();
      apples.splice(idx, 1);
    }
  });

  // 3b. UPDATE SNAKES
  if (snakes && snakes.length > 0) {
    snakes.forEach((snake, idx) => {
      // Fall physics
      if (!snake.isGrounded) {
        snake.vy += GRAVITY * 0.75;
        snake.y += snake.vy;
        
        // Check collision with the floor where the tree sits
        if (snake.y + snake.height >= snake.floorY) {
          snake.y = snake.floorY - snake.height;
          snake.vy = 0;
          snake.isGrounded = true;
        }
      } else {
        // Slither logic: wiggles slightly on floor
        snake.x += Math.sin(gameTime * 0.5) * 1.5;
        snake.lifetime--;
        if (snake.lifetime <= 0) {
          // Disappear with green smoke
          spawnParticle(snake.x + 12, snake.y + 24, '#39ff14', 6);
          snakes.splice(idx, 1);
          return;
        }
      }

      // Collision with Player
      if (player.invulnTimer === 0) {
        const snakeRect = { x: snake.x, y: snake.y, width: snake.width, height: snake.height };
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkCollision(playerRect, snakeRect)) {
          // Snake bites and deals damage / takes a life!
          takeDamage();
          spawnFloatingText(snake.x, snake.y - 15, "BITTEN!", '#ff007f');
          snakes.splice(idx, 1);
        }
      }
    });
  }

  // 4. UPDATE DOGS
  // Tick down freeze timer
  if (dogFreezeTimer > 0) {
    dogFreezeTimer--;
    // Show freeze effect every 60 frames while active
    if (dogFreezeTimer % 60 === 0 && dogFreezeTimer > 0) {
      dogs.forEach(dog => spawnParticle(dog.x + dog.width/2, dog.y, '#aaddff', 4));
    }
  }

  dogs.forEach(dog => {
    // Skip movement while frozen by rainbow apple
    if (dogFreezeTimer > 0) return;

    // Current actual speed (scales up by 0.45 per level)
    const currentSpeed = dog.speed + (level - 1) * 0.45;
    dog.x += currentSpeed * dog.dir;

    // Bounds checking on its assigned floor
    if (dog.x <= dog.minX) {
      dog.x = dog.minX;
      dog.dir = 1;
    } else if (dog.x >= dog.maxX) {
      dog.x = dog.maxX;
      dog.dir = -1;
    }

    // Collision with Player
    if (player.invulnTimer === 0) {
      const dogRect = { x: dog.x, y: dog.y, width: dog.width, height: dog.height };
      const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
      if (checkCollision(playerRect, dogRect)) {
        takeDamage();
      }
    }
  });

  // 5. UPDATE PARTICLES & TEXTS
  particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(idx, 1);
    }
  });

  floatingTexts.forEach((t, idx) => {
    t.y += t.vy;
    t.alpha = t.life / 50;
    t.life--;
    if (t.life <= 0) {
      floatingTexts.splice(idx, 1);
    }
  });

  // 6. UPDATE EASTER EGG & AIRPLANE
  if (easterEggTimer > 0) {
    easterEggTimer--;
    if (Math.random() < 0.05) {
      spawnFirework(Math.random() * CANVAS_WIDTH, Math.random() * (CANVAS_HEIGHT / 2));
    }
  }

  fireworks.forEach((fw, idx) => {
    fw.life--;
    if (fw.life <= 0) {
      fireworks.splice(idx, 1);
    } else {
      fw.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha *= 0.95;
      });
    }
  });

  planes.forEach((plane, idx) => {
    plane.x += plane.vx;
    
    if (plane.dropsLeft > 0) {
      plane.dropTimer--;
      if (plane.dropTimer <= 0) {
        const targetFloor = platforms[Math.floor(Math.random() * platforms.length)];
        let type = plane.dropsLeft === 1 ? 'heart' : 'normal';
        
        apples.push({
          x: plane.x + 40,
          y: plane.y + 20,
          vy: 0,
          vx: (Math.random() - 0.5) * 2, // scatter horizontally
          width: 24,
          height: 24,
          floorY: targetFloor.y,
          bounceCount: 2,
          isGrounded: false,
          lifetime: 600,
          maxLifetime: 600,
          type: type,
          color: type === 'heart' ? '#ff0000' : '#e63946',
          scoreValue: type === 'heart' ? 0 : 10
        });
        
        plane.dropsLeft--;
        plane.dropTimer = 15 + Math.random() * 20;
      }
    }

    if (plane.x > CANVAS_WIDTH + 100) {
      planes.splice(idx, 1);
    }
  });
}

function spawnPlane() {
  planes.push({
    x: -100,
    y: 50,
    vx: 3,
    dropsLeft: 7, // 6 apples + 1 heart
    dropTimer: 40
  });
}

function triggerEasterEgg() {
  easterEggTimer = 20 * 60; // 20 seconds
  lives += 2;
  updateHUD();
  spawnFloatingText(player.x, player.y - 40, "+2 LIVES!", '#00f2fe');
  playSound('levelup');
}

function spawnFirework(x, y) {
  const fw = { life: 60, particles: [] };
  const numParticles = 20 + Math.random() * 20;
  const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4;
    fw.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      alpha: 1
    });
  }
  fireworks.push(fw);
}

function spawnApple(x, y, floorY) {
  // Apple types: 'normal' (80%), 'golden' (10%), 'rotten' (10%)
  const rand = Math.random();
  let type = 'normal';
  let color = '#e63946'; // red
  let scoreValue = 10;
  
  if (rand < 0.02) {
    // 2% chance: very rare rainbow apple
    type = 'rainbow';
    color = '#ff77ff';
    scoreValue = 50;
  } else if (rand < 0.12) {
    type = 'golden';
    color = varColorHex('--neon-yellow'); // gold
    scoreValue = 30;
  } else if (rand < 0.22) {
    type = 'rotten';
    color = '#8a2be2'; // purple/toxic
    scoreValue = -15; // penalty
  }

  const lifetime = Math.max(180, 480 - (level * 35));
  apples.push({
    x: x,
    y: y,
    vy: 0,
    width: 24,
    height: 24,
    floorY: floorY,
    bounceCount: 2,
    isGrounded: false,
    lifetime: lifetime,
    maxLifetime: lifetime,
    type: type,
    color: color,
    scoreValue: scoreValue
  });
}

function spawnSnake(tree) {
  playSound('rotten');
  snakes.push({
    x: tree.x + 36,
    y: tree.y + 12,
    width: 24,
    height: 48,
    vy: 0.5,
    floorY: tree.floorY,
    isGrounded: false,
    lifetime: 150
  });
  spawnParticle(tree.x + 48, tree.y + 24, '#39ff14', 8);
  spawnFloatingText(tree.x + 18, tree.y - 15, "🐍 SNAKE!", '#39ff14');
}

function takeDamage() {
  lives--;
  updateHUD();
  
  // Hit particles
  spawnParticle(player.x + 20, player.y + 20, '#ff007f', 20);
  
  // Trigger screen shake & hit sound
  screenShake = 15;
  playSound('hit');
  
  if (lives <= 0) {
    gameOver();
  } else {
    // Reset positions to bottom Floor 0 & trigger temporary invulnerability
    player.invulnTimer = 90; // 1.5 seconds invuln
    player.x = 150;
    player.y = 490; // Ground starting level
    player.vy = 0;
    
    // Reset dogs to initial positions to avoid spawn camping
    initDogs();
  }
}

function gameOver() {
  gameState = 'gameover';
  document.getElementById('gameover-score-val').innerText = score;
  document.getElementById('final-score-val').innerText = score;
  
  bgMusic.pause();
  playSound('gameover');
  
  setTimeout(() => {
    switchScreen('gameover-screen');
  }, 1200);
}

// Hex Helper to get CSS root variables
function varColorHex(varName) {
  if (varName === '--neon-cyan') return '#00f2fe';
  if (varName === '--neon-magenta') return '#ff007f';
  if (varName === '--neon-yellow') return '#fffb00';
  if (varName === '--neon-green') return '#39ff14';
  return '#ffffff';
}

// Core Game Draw Loop
function draw() {
  // Clear screen
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  if (screenShake > 0) {
    let dx = (Math.random() - 0.5) * screenShake;
    let dy = (Math.random() - 0.5) * screenShake;
    ctx.translate(dx, dy);
  }

  // 1. DRAW BACKGROUND
  ctx.fillStyle = '#5cadff'; // Sky blue from reference image
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw Parallax Hills (Background Layer 1 - Far mountains, scroll slowly)
  ctx.fillStyle = '#4fa1d8';
  const drawFarHill = (hx, hy, hr) => {
    let x = (hx - bgScrollOffset * 0.35) % (CANVAS_WIDTH + hr * 2);
    if (x < -hr) x += (CANVAS_WIDTH + hr * 2);
    ctx.beginPath();
    ctx.arc(x, hy, hr, Math.PI, 0);
    ctx.fill();
  };
  drawFarHill(200, 600, 220);
  drawFarHill(600, 620, 260);

  // Draw Parallax Hills (Background Layer 2 - Mid hills, scroll slightly faster)
  ctx.fillStyle = '#65b252';
  const drawMidHill = (hx, hy, hr) => {
    let x = (hx - bgScrollOffset * 0.65) % (CANVAS_WIDTH + hr * 2);
    if (x < -hr) x += (CANVAS_WIDTH + hr * 2);
    ctx.beginPath();
    ctx.arc(x, hy, hr, Math.PI, 0);
    ctx.fill();
  };
  drawMidHill(-50, 580, 160);
  drawMidHill(400, 590, 180);
  drawMidHill(850, 580, 160);

  // Draw some retro pixel-art clouds scrolling dynamically in the sky
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  const drawCloud = (cx, cy) => {
    ctx.fillRect(cx, cy, 80, 20);
    ctx.fillRect(cx + 15, cy - 15, 50, 15);
    ctx.fillRect(cx + 30, cy - 25, 25, 10);
    ctx.fillRect(cx - 10, cy + 10, 100, 15);
  };
  
  // Dynamic scrolling positions
  let c1x = (120 + gameTime * 0.15) % (CANVAS_WIDTH + 200) - 100;
  let c2x = (550 + gameTime * 0.08) % (CANVAS_WIDTH + 200) - 100;
  let c3x = (320 + gameTime * 0.22) % (CANVAS_WIDTH + 200) - 100;
  
  drawCloud(c1x, 80);
  drawCloud(c2x, 60);
  drawCloud(c3x, 110);

  // Easter Egg background text
  if (easterEggTimer > 0) {
    ctx.save();
    ctx.font = '900 24px "Press Start 2P", monospace'; // Extra bold
    ctx.textAlign = 'center';
    
    const hue = (gameTime * 2) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Add a stroke to make the pixel font visually bolder
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    
    ctx.fillText("Created by Amir Odinaev & Papa", CANVAS_WIDTH / 2, 230); // Lowered to floor 3
    ctx.strokeText("Created by Amir Odinaev & Papa", CANVAS_WIDTH / 2, 230);
    ctx.restore();
  }

  // 2. DRAW PLATFORMS
  if (platforms && platforms.length > 0) {
    platforms.forEach(platform => {
      if (platform.shrinkable) {
        if (platform.width <= 0) return; // fully gone, don't draw
        // Calculate how much has crumbled (0 = fresh, 1 = almost gone)
        const crumblePct = 1 - (platform.width / platform.origWidth);
        // Tint toward red/orange as it crumbles
        const r = Math.round(141 + crumblePct * 114); // 141 -> 255
        const g = Math.round(91 - crumblePct * 91);   // 91 -> 0
        const b = Math.round(76 - crumblePct * 76);   // 76 -> 0
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        // Crack lines on the crumbling section
        ctx.strokeStyle = `rgba(0,0,0,${0.3 + crumblePct * 0.5})`;
        ctx.lineWidth = 1;
        for (let cx = platform.x + 15; cx < platform.x + platform.width; cx += 25) {
          ctx.beginPath();
          ctx.moveTo(cx, platform.y);
          ctx.lineTo(cx + 5, platform.y + platform.height / 2);
          ctx.lineTo(cx - 3, platform.y + platform.height);
          ctx.stroke();
        }
        // Grass top (fades orange as crumbling)
        ctx.fillStyle = crumblePct < 0.5 ? '#7cd322' : `rgba(${r}, ${Math.round(180 - crumblePct * 180)}, 0, 1)`;
        ctx.fillRect(platform.x, platform.y, platform.width, 8);
      } else {
        // Dirt base (Brown '#8d5b4c')
        ctx.fillStyle = '#8d5b4c';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Dirt pixel speckles (Dark Brown '#5a382f')
        ctx.fillStyle = '#5a382f';
        const pixelSize = 4;
        for (let px = platform.x + 8; px < platform.x + platform.width - 8; px += 32) {
          let offset1 = (px % 7) * 4;
          let offset2 = (px % 5) * 6;
          ctx.fillRect(px + offset1, platform.y + 10 + (px % 3) * 4, pixelSize, pixelSize);
          ctx.fillRect(px + offset2, platform.y + 12 + (px % 4) * 2, pixelSize, pixelSize);
        }

        // Grass top (Light Green '#7cd322')
        ctx.fillStyle = '#7cd322';
        ctx.fillRect(platform.x, platform.y, platform.width, 8);

        // Darker green jagged lower border for grass ('#58a618')
        ctx.fillStyle = '#58a618';
        for (let gx = platform.x; gx < platform.x + platform.width; gx += 8) {
          if ((gx / 8) % 2 === 0) {
            ctx.fillRect(gx, platform.y + 8, 8, 4);
          }
        }
      }
    });
  }
  // 3. DRAW TREES
  if (trees && trees.length > 0) {
    trees.forEach(tree => {
      let shakeOffset = 0;
      if (tree.state === 'shaking') {
        shakeOffset = Math.sin(gameTime * 0.8) * 3.5;
      }

      ctx.save();
      ctx.translate(tree.x + 48 + shakeOffset, tree.y + 48);

      if (assets.apple_tree.complete && assets.apple_tree.naturalWidth !== 0) {
        // Draw tree sprite centered
        ctx.drawImage(assets.apple_tree, -48, -48, 96, 96);
      } else {
        // Procedural fallback apple tree
        // Trunk
        ctx.fillStyle = '#654321';
        ctx.fillRect(-12, 0, 24, 48);
        // Leaves
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.arc(0, -18, 36, 0, Math.PI * 2);
        ctx.fill();
        // Little apples in tree
        ctx.fillStyle = '#d92b2b';
        ctx.beginPath();
        ctx.arc(-14, -20, 5, 0, Math.PI * 2);
        ctx.arc(12, -12, 5, 0, Math.PI * 2);
        ctx.arc(0, -28, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // 4. DRAW DOGS (Guards)
  if (dogs && dogs.length > 0) {
    dogs.forEach(dog => {
      ctx.save();
      ctx.translate(dog.x + dog.width/2, dog.y + dog.height/2);
      
      // Direction flip (sprite naturally faces left, so flip when moving right)
      if (dog.dir === 1) {
        ctx.scale(-1, 1);
      }

      // Ice-blue glow while frozen by rainbow apple
      if (dogFreezeTimer > 0) {
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur = 14;
        ctx.filter = 'hue-rotate(180deg) saturate(0.5) brightness(1.4)';
      }
      // Walking wobble animation
      const dogWobble = Math.sin(gameTime * 0.25) * 0.08;
      ctx.rotate(dogWobble);

      if (assets.dog_run.complete && assets.dog_run.naturalWidth !== 0) {
        // Toggle frames between idle and run every 6 frames to animate the walkcycle
        const dImg = (Math.floor(gameTime / 6) % 2 === 0 && assets.dog_idle.complete && assets.dog_idle.naturalWidth !== 0)
          ? assets.dog_idle
          : assets.dog_run;
        ctx.drawImage(dImg, -dog.width/2, -dog.height/2, dog.width, dog.height);
      } else {
        // Procedural fallback dog (facing left by default)
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(-dog.width/2, -dog.height/2 + 5, dog.width, dog.height - 5);
        // Angry face detail on the left
        ctx.fillStyle = '#000';
        ctx.fillRect(-dog.width/4 - 4, -dog.height/4, 4, 4);
        // Spikes collar on the right side of the head
        ctx.fillStyle = varColorHex('--neon-magenta');
        ctx.fillRect(-dog.width/8 - 2, -dog.height/6, 4, 12);
      }
      ctx.restore();
    });
  }

  // 5. DRAW APPLES
  if (apples && apples.length > 0) {
    apples.forEach(apple => {
      // Flashing when about to disappear
      if (apple.lifetime < 120 && Math.floor(apple.lifetime / 10) % 2 === 0) {
        return; // Skip drawing this frame to flash
      }

      ctx.save();
      ctx.translate(apple.x + apple.width/2, apple.y + apple.height/2);
      
      // Rotating wobble on floor
      if (apple.isGrounded) {
        const appleRot = Math.sin(gameTime * 0.15) * 0.12;
        ctx.rotate(appleRot);
      }

      // Special visual effects for special apples
      if (apple.type === 'rainbow') {
        // Spinning prismatic hue-rotate + pulsing glow
        const hue = (gameTime * 4) % 360;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 16;
        ctx.filter = `hue-rotate(${hue}deg) saturate(2.5) brightness(1.3)`;
      } else if (apple.type === 'golden') {
        ctx.shadowColor = '#fffb00';
        ctx.shadowBlur = 10;
        if (!assets.apple_gold.complete || assets.apple_gold.naturalWidth === 0) {
          ctx.filter = 'hue-rotate(50deg) saturate(1.8) brightness(1.2)';
        }
      } else if (apple.type === 'rotten') {
        ctx.shadowColor = '#8a2be2';
        ctx.shadowBlur = 10;
        ctx.filter = 'hue-rotate(270deg) saturate(1.5) brightness(0.7)';
      }

      if (apple.type === 'rainbow' && assets.apple_rainbow.complete && assets.apple_rainbow.naturalWidth !== 0) {
        ctx.drawImage(assets.apple_rainbow, -apple.width/2, -apple.width/2, apple.width, apple.height);
      } else if (apple.type === 'golden' && assets.apple_gold.complete && assets.apple_gold.naturalWidth !== 0) {
        ctx.drawImage(assets.apple_gold, -apple.width/2, -apple.width/2, apple.width, apple.height);
      } else if (apple.type === 'heart') {
        // Procedural heart
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        let topCurveHeight = apple.height * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -apple.width/2, 0, -apple.width/2, topCurveHeight);
        ctx.bezierCurveTo(-apple.width/2, apple.height/2, 0, apple.height*0.8, 0, apple.height);
        ctx.bezierCurveTo(0, apple.height*0.8, apple.width/2, apple.height/2, apple.width/2, topCurveHeight);
        ctx.bezierCurveTo(apple.width/2, 0, 0, 0, 0, topCurveHeight);
        ctx.fill();
      } else if (apple.type !== 'rainbow' && apple.type !== 'heart' && assets.apple.complete && assets.apple.naturalWidth !== 0) {
        ctx.drawImage(assets.apple, -apple.width/2, -apple.width/2, apple.width, apple.height);
      } else {
        // Procedural apple
        ctx.fillStyle = apple.color || '#e63946';
        ctx.beginPath();
        ctx.arc(0, 0, apple.width/2, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#4a2c11';
        ctx.fillRect(-2, -apple.height/2 - 2, 3, 5);
      }

      ctx.restore();

      // Small lifetime slider underneath the apple if it is on the ground
      if (apple.isGrounded && apple.lifetime > 0) {
        const pct = apple.lifetime / apple.maxLifetime;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(apple.x - 2, apple.y + apple.height + 4, apple.width + 4, 3);
        
        ctx.fillStyle = pct < 0.35 ? varColorHex('--neon-magenta') : varColorHex('--neon-green');
        ctx.fillRect(apple.x - 2, apple.y + apple.height + 4, (apple.width + 4) * pct, 3);
      }
    });
  }

  // 5b. DRAW SNAKES
  if (snakes && snakes.length > 0) {
    snakes.forEach(snake => {
      ctx.save();
      ctx.translate(snake.x + snake.width/2, snake.y + snake.height/2);

      // Add a neon toxic green glow
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 10;

      // Draw slithering snake body: a wavy green chain of circles/rectangles!
      const segments = 6;
      for (let i = 0; i < segments; i++) {
        // Slithering horizontal offset based on segment index and time
        let segY = -snake.height/2 + (i * (snake.height / segments));
        let segX = Math.sin(gameTime * 0.25 + i * 0.8) * 5;
        
        // Face of the snake is at the bottom (since it falls head-first!)
        if (i === segments - 1) {
          ctx.fillStyle = '#1e7b1e'; // darker green head
          ctx.beginPath();
          ctx.arc(segX, segY, 6, 0, Math.PI * 2);
          ctx.fill();
          // Red eyes
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(segX - 3, segY - 2, 2, 2);
          ctx.fillRect(segX + 1, segY - 2, 2, 2);
        } else {
          ctx.fillStyle = '#2d9c2d'; // green body segment
          ctx.beginPath();
          ctx.arc(segX, segY, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });
  }

  // 6. DRAW PLAYER (Hedgehog)
  if (player && (player.invulnTimer === 0 || Math.floor(player.invulnTimer / 6) % 2 === 0)) {
    ctx.save();

    // 🌈 Rainbow glow while dog-freeze power-up is active
    if (dogFreezeTimer > 0) {
      const rainbowHue = (gameTime * 6) % 360;
      ctx.shadowColor = `hsl(${rainbowHue}, 100%, 60%)`;
      ctx.shadowBlur = 20;
    }

    // Center matrix at player center for squash and stretch
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    
    // Apply squashing & stretching (juiciness)
    ctx.scale(player.squashX, player.squashY);

    // Apply flip based on facing direction (sprite naturally faces left, so flip when moving right)
    if (player.facing === 1) {
      ctx.scale(-1, 1);
    }

    // Run walkcycle rotation wobble
    if (player.state === 'running' && player.isGrounded) {
      const wobble = Math.sin(player.wobblePhase) * 0.12;
      ctx.rotate(wobble);
    } else if (!player.isGrounded) {
      // Pitch forward/backward slightly in air
      ctx.rotate(player.vy * 0.02);
    }

    let pImg = assets.hedgehog_idle;
    let drawW = player.width;
    let drawH = player.height;

    if (player.state === 'running') {
      // Cycle run frames based on game time
      pImg = Math.floor(gameTime / 8) % 2 === 0 ? assets.hedgehog_run : assets.hedgehog_idle;
    } else if (player.state === 'idle') {
      // Idle: make hedgehog slightly taller (same as jump stretch)
      drawH = player.height * 1.15;
    }

    if (pImg.complete && pImg.naturalWidth !== 0) {
      ctx.drawImage(pImg, -drawW/2, -drawH/2, drawW, drawH);
    } else {
      // Procedural hedgehog (facing left by default)
      ctx.fillStyle = '#8b5a2b';
      // Body
      ctx.beginPath();
      ctx.arc(0, 2, player.width/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      // Quills (outer spikes on the right side)
      ctx.fillStyle = '#4a2c11';
      for (let angle = -Math.PI * 0.4; angle < Math.PI * 0.9; angle += 0.35) {
        let sx = Math.cos(angle) * (player.width/2 - 2);
        let sy = Math.sin(angle) * (player.height/2 - 2);
        let ex = Math.cos(angle) * (player.width/2 + 6);
        let ey = Math.sin(angle) * (player.height/2 + 6);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.lineTo(sx + 4, sy + 4);
        ctx.closePath();
        ctx.fill();
      }
      // Face on the left
      ctx.fillStyle = '#ffe0bd';
      ctx.beginPath();
      ctx.arc(-player.width/4, 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(-player.width/4 - 4, 2, 2, 2); // eye
      ctx.fillRect(-player.width/2, 4, 3, 3); // nose
    }
    
    ctx.restore();
  }

  // 7. DRAW PARTICLES
  if (particles && particles.length > 0) {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });
  }

  // 8. DRAW FLOATING TEXTS
  if (floatingTexts && floatingTexts.length > 0) {
    floatingTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 0.75rem "Press Start 2P", monospace';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  // 8b. DRAW FIREWORKS & PLANES
  if (fireworks && fireworks.length > 0) {
    fireworks.forEach(fw => {
      fw.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    });
  }

  if (planes && planes.length > 0) {
    planes.forEach(plane => {
      ctx.save();
      // Translate to the center of the plane for flipping
      ctx.translate(plane.x + 40, plane.y + 20);
      // Flip horizontally so the plane (which faces left originally) faces right
      ctx.scale(-1, 1);
      
      if (assets.plane && assets.plane.complete && assets.plane.naturalWidth !== 0) {
        ctx.drawImage(assets.plane, -40, -20, 80, 40);
      } else {
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(-40, -20, 60, 20);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-20, -30, 10, 30);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(10, -15, 10, 10);
      }
      ctx.restore();
    });
  }

  // 9. DRAW SCREEN STATE OVERLAYS (Procedural details on canvas if needed)
  if (gameState === 'loading') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.font = '1.2rem "Press Start 2P", monospace';
    ctx.fillStyle = varColorHex('--neon-cyan');
    ctx.textAlign = 'center';
    ctx.fillText("LOADING SYSTEM ASSETS...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    // Loading bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = CANVAS_HEIGHT / 2 + 10;
    ctx.strokeStyle = varColorHex('--neon-cyan');
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    const pct = loadedAssetsCount / totalAssets;
    ctx.fillStyle = varColorHex('--neon-magenta');
    ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * pct, barHeight - 4);
  }

  ctx.restore();
}

// Main Loop caller
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Initialise Everything on load
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAssets();
  loop();
});
