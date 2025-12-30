/* ========================================
   NEON SNAKE GAME - GAME LOGIC
   ======================================== */

// ============ GAME CONFIGURATION ============
const CONFIG = {
    GRID_SIZE: 20,
    INITIAL_SNAKE_LENGTH: 3,
    POWERUP_DURATION: 5000, // 5 seconds
    POWERUP_SPAWN_CHANCE: 0.15, // 15% chance per food eaten
    OBSTACLE_SPAWN_CHANCE: 0.1, // 10% chance per food eaten
    MAX_OBSTACLES: 10,
    DIFFICULTY: {
        easy: { speed: 150, obstacleMultiplier: 0.5, scoreMultiplier: 1 },
        medium: { speed: 100, obstacleMultiplier: 1, scoreMultiplier: 1.5 },
        hard: { speed: 70, obstacleMultiplier: 1.5, scoreMultiplier: 2 }
    },
    POWERUP_TYPES: {
        speed: { icon: '🚀', name: 'Speed Boost', color: '#ff6b35' },
        shield: { icon: '🛡️', name: 'Shield', color: '#00bfff' },
        double: { icon: '⭐', name: 'Double Points', color: '#ffff00' }
    }
};

// ============ GAME STATE ============
let canvas, ctx;
let gameState = 'start'; // start, playing, paused, gameover
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let obstacles = [];
let powerup = null;
let activePowerup = null;
let powerupEndTime = 0;
let score = 0;
let highScore = 0;
let level = 1;
let difficulty = 'medium';
let gameLoop = null;
let cellSize = 0;
let soundEnabled = true;

// Audio Context for sound effects
let audioCtx = null;

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', init);

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load high score
    loadHighScore();
    updateScoreDisplay();
    
    // Event listeners
    setupEventListeners();
    
    // Initialize audio
    initAudio();
    
    // Draw initial state
    drawGrid();
}

function resizeCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / CONFIG.GRID_SIZE;
    
    if (gameState === 'playing' || gameState === 'paused') {
        draw();
    } else {
        drawGrid();
    }
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Difficulty buttons
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            difficulty = e.currentTarget.dataset.difficulty;
            startGame();
        });
    });
    
    // Resume button
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    
    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        hideOverlay('gameOverScreen');
        showOverlay('startScreen');
    });
    
    // Pause button
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    // Sound button
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    
    // Leaderboard buttons
    document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
    document.getElementById('showLeaderboardBtn').addEventListener('click', showLeaderboard);
    document.getElementById('closeLeaderboard').addEventListener('click', hideLeaderboard);
    document.getElementById('clearLeaderboard').addEventListener('click', clearLeaderboard);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeydown);
    
    // Touch controls (swipe)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // D-Pad controls
    document.getElementById('dpadUp').addEventListener('click', () => setDirection(0, -1));
    document.getElementById('dpadDown').addEventListener('click', () => setDirection(0, 1));
    document.getElementById('dpadLeft').addEventListener('click', () => setDirection(-1, 0));
    document.getElementById('dpadRight').addEventListener('click', () => setDirection(1, 0));
    
    // Prevent D-Pad from triggering multiple times
    document.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.click();
        }, { passive: false });
    });
}

function handleKeydown(e) {
    // Arrow keys or WASD
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            setDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            setDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            setDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            setDirection(1, 0);
            break;
        case ' ':
        case 'Escape':
            e.preventDefault();
            togglePause();
            break;
    }
}

function setDirection(x, y) {
    // Prevent 180-degree turns
    if (direction.x + x !== 0 || direction.y + y !== 0) {
        nextDirection = { x, y };
    }
}

// Touch handling for swipe
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    const minSwipe = 30;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipe) {
            setDirection(diffX > 0 ? 1 : -1, 0);
        }
    } else {
        if (Math.abs(diffY) > minSwipe) {
            setDirection(0, diffY > 0 ? 1 : -1);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}

// ============ GAME CONTROLS ============
function startGame() {
    // Reset game state
    snake = [];
    obstacles = [];
    powerup = null;
    activePowerup = null;
    score = 0;
    level = 1;
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    
    // Initialize snake in center
    const startX = Math.floor(CONFIG.GRID_SIZE / 2);
    const startY = Math.floor(CONFIG.GRID_SIZE / 2);
    for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    
    // Spawn food
    spawnFood();
    
    // Update display
    updateScoreDisplay();
    hidePowerupStatus();
    
    // Hide overlay and start game
    hideOverlay('startScreen');
    gameState = 'playing';
    
    // Start game loop
    const speed = CONFIG.DIFFICULTY[difficulty].speed;
    gameLoop = setInterval(update, speed);
    
    playSound('start');
}

function togglePause() {
    if (gameState === 'playing') {
        pauseGame();
    } else if (gameState === 'paused') {
        resumeGame();
    }
}

function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    clearInterval(gameLoop);
    showOverlay('pauseScreen');
}

function resumeGame() {
    if (gameState !== 'paused') return;
    hideOverlay('pauseScreen');
    gameState = 'playing';
    const speed = activePowerup === 'speed' 
        ? CONFIG.DIFFICULTY[difficulty].speed * 0.6 
        : CONFIG.DIFFICULTY[difficulty].speed;
    gameLoop = setInterval(update, speed);
}

function gameOver() {
    gameState = 'gameover';
    clearInterval(gameLoop);
    
    // Check for new high score
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
        highScore = score;
        saveHighScore();
    }
    
    // Save to leaderboard
    saveToLeaderboard();
    
    // Update UI
    document.getElementById('finalScore').textContent = score;
    const newHighscoreEl = document.getElementById('newHighscore');
    if (isNewHighScore) {
        newHighscoreEl.classList.remove('hidden');
    } else {
        newHighscoreEl.classList.add('hidden');
    }
    
    showOverlay('gameOverScreen');
    playSound('gameover');
}

// ============ GAME UPDATE ============
function update() {
    // Update direction
    direction = { ...nextDirection };
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Check wall collision (wrap around)
    if (head.x < 0) head.x = CONFIG.GRID_SIZE - 1;
    if (head.x >= CONFIG.GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = CONFIG.GRID_SIZE - 1;
    if (head.y >= CONFIG.GRID_SIZE) head.y = 0;
    
    // Check self collision
    if (checkSelfCollision(head)) {
        if (activePowerup === 'shield') {
            // Shield protects once, then deactivates
            deactivatePowerup();
            playSound('shield');
        } else {
            gameOver();
            return;
        }
    }
    
    // Check obstacle collision
    if (checkObstacleCollision(head)) {
        if (activePowerup === 'shield') {
            deactivatePowerup();
            playSound('shield');
        } else {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        eatFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Check powerup collision
    if (powerup && head.x === powerup.x && head.y === powerup.y) {
        collectPowerup();
    }
    
    // Check powerup expiration
    if (activePowerup && Date.now() > powerupEndTime) {
        deactivatePowerup();
    }
    
    // Update powerup timer display
    updatePowerupTimer();
    
    // Draw
    draw();
}

function checkSelfCollision(head) {
    return snake.some((segment, index) => {
        if (index === 0) return false;
        return segment.x === head.x && segment.y === head.y;
    });
}

function checkObstacleCollision(head) {
    return obstacles.some(obs => obs.x === head.x && obs.y === head.y);
}

function eatFood() {
    // Calculate score
    let points = 10 * CONFIG.DIFFICULTY[difficulty].scoreMultiplier;
    if (activePowerup === 'double') {
        points *= 2;
    }
    score += Math.round(points);
    
    // Level up every 100 points
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
        level = newLevel;
        playSound('levelup');
    }
    
    updateScoreDisplay();
    playSound('eat');
    
    // Spawn new food
    spawnFood();
    
    // Maybe spawn powerup
    if (!powerup && Math.random() < CONFIG.POWERUP_SPAWN_CHANCE) {
        spawnPowerup();
    }
    
    // Maybe spawn obstacle on harder difficulties
    const obstacleChance = CONFIG.OBSTACLE_SPAWN_CHANCE * CONFIG.DIFFICULTY[difficulty].obstacleMultiplier;
    if (obstacles.length < CONFIG.MAX_OBSTACLES && Math.random() < obstacleChance) {
        spawnObstacle();
    }
}

// ============ SPAWNING ============
function spawnFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
        };
    } while (isPositionOccupied(newFood));
    food = newFood;
}

function spawnPowerup() {
    let newPowerup;
    do {
        newPowerup = {
            x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
        };
    } while (isPositionOccupied(newPowerup));
    
    const types = Object.keys(CONFIG.POWERUP_TYPES);
    newPowerup.type = types[Math.floor(Math.random() * types.length)];
    powerup = newPowerup;
}

function spawnObstacle() {
    let newObstacle;
    let attempts = 0;
    do {
        newObstacle = {
            x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
        };
        attempts++;
    } while (isPositionOccupied(newObstacle) && attempts < 50);
    
    if (attempts < 50) {
        obstacles.push(newObstacle);
    }
}

function isPositionOccupied(pos) {
    // Check snake
    if (snake.some(seg => seg.x === pos.x && seg.y === pos.y)) return true;
    // Check food
    if (food && food.x === pos.x && food.y === pos.y) return true;
    // Check powerup
    if (powerup && powerup.x === pos.x && powerup.y === pos.y) return true;
    // Check obstacles
    if (obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) return true;
    // Check near snake head (give some space)
    const head = snake[0];
    if (head && Math.abs(pos.x - head.x) < 3 && Math.abs(pos.y - head.y) < 3) return true;
    return false;
}

// ============ POWERUPS ============
function collectPowerup() {
    activePowerup = powerup.type;
    powerupEndTime = Date.now() + CONFIG.POWERUP_DURATION;
    powerup = null;
    
    playSound('powerup');
    showPowerupStatus();
    
    // Apply speed boost effect
    if (activePowerup === 'speed') {
        clearInterval(gameLoop);
        const speed = CONFIG.DIFFICULTY[difficulty].speed * 0.6;
        gameLoop = setInterval(update, speed);
    }
}

function deactivatePowerup() {
    // Reset speed if was speed boost
    if (activePowerup === 'speed' && gameState === 'playing') {
        clearInterval(gameLoop);
        const speed = CONFIG.DIFFICULTY[difficulty].speed;
        gameLoop = setInterval(update, speed);
    }
    
    activePowerup = null;
    hidePowerupStatus();
}

function showPowerupStatus() {
    const statusEl = document.getElementById('powerupStatus');
    const iconEl = document.getElementById('activePowerupIcon');
    
    statusEl.classList.add('active');
    iconEl.textContent = CONFIG.POWERUP_TYPES[activePowerup].icon;
}

function hidePowerupStatus() {
    document.getElementById('powerupStatus').classList.remove('active');
}

function updatePowerupTimer() {
    if (!activePowerup) return;
    
    const remaining = Math.max(0, Math.ceil((powerupEndTime - Date.now()) / 1000));
    document.getElementById('powerupTimer').textContent = `${remaining}s`;
}

// ============ DRAWING ============
function draw() {
    // Clear canvas
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw food
    drawFood();
    
    // Draw powerup
    if (powerup) {
        drawPowerup();
    }
    
    // Draw snake
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= CONFIG.GRID_SIZE; i++) {
        const pos = i * cellSize;
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        const padding = 2;
        
        // Determine color based on position and powerup
        let color;
        if (index === 0) {
            // Head
            color = activePowerup === 'shield' ? '#00bfff' : '#39ff14';
        } else {
            // Body - gradient effect
            const ratio = index / snake.length;
            if (activePowerup === 'shield') {
                color = `hsl(195, 100%, ${70 - ratio * 30}%)`;
            } else if (activePowerup === 'double') {
                color = `hsl(60, 100%, ${70 - ratio * 30}%)`;
            } else if (activePowerup === 'speed') {
                color = `hsl(20, 100%, ${60 - ratio * 20}%)`;
            } else {
                color = `hsl(180, 100%, ${60 - ratio * 30}%)`;
            }
        }
        
        // Draw segment
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = index === 0 ? 15 : 8;
        
        // Rounded rectangle for snake
        const radius = cellSize / 4;
        drawRoundedRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, radius);
        
        // Draw eyes on head
        if (index === 0) {
            ctx.shadowBlur = 0;
            drawSnakeEyes(x, y);
        }
    });
    
    ctx.shadowBlur = 0;
}

function drawSnakeEyes(x, y) {
    const eyeSize = cellSize / 6;
    const eyeOffset = cellSize / 4;
    
    ctx.fillStyle = '#ffffff';
    
    // Position eyes based on direction
    let eye1X, eye1Y, eye2X, eye2Y;
    
    if (direction.x === 1) { // Right
        eye1X = x + cellSize - eyeOffset;
        eye1Y = y + eyeOffset;
        eye2X = x + cellSize - eyeOffset;
        eye2Y = y + cellSize - eyeOffset;
    } else if (direction.x === -1) { // Left
        eye1X = x + eyeOffset;
        eye1Y = y + eyeOffset;
        eye2X = x + eyeOffset;
        eye2Y = y + cellSize - eyeOffset;
    } else if (direction.y === -1) { // Up
        eye1X = x + eyeOffset;
        eye1Y = y + eyeOffset;
        eye2X = x + cellSize - eyeOffset;
        eye2Y = y + eyeOffset;
    } else { // Down
        eye1X = x + eyeOffset;
        eye1Y = y + cellSize - eyeOffset;
        eye2X = x + cellSize - eyeOffset;
        eye2Y = y + cellSize - eyeOffset;
    }
    
    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawFood() {
    const x = food.x * cellSize;
    const y = food.y * cellSize;
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    const radius = cellSize / 2 - 4;
    
    // Pulsing animation
    const pulse = Math.sin(Date.now() / 200) * 0.15 + 1;
    
    // Glow effect
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    
    // Draw food (apple/circle)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * pulse);
    gradient.addColorStop(0, '#ff66ff');
    gradient.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw apple stem
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius * pulse);
    ctx.lineTo(centerX + 3, centerY - radius * pulse - 5);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function drawPowerup() {
    const x = powerup.x * cellSize;
    const y = powerup.y * cellSize;
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    
    const config = CONFIG.POWERUP_TYPES[powerup.type];
    
    // Floating animation
    const float = Math.sin(Date.now() / 300) * 3;
    
    // Glow
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 25;
    
    // Draw powerup icon
    ctx.font = `${cellSize * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, centerX, centerY + float);
    
    ctx.shadowBlur = 0;
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const x = obs.x * cellSize;
        const y = obs.y * cellSize;
        const padding = 3;
        
        // Glow effect
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 10;
        
        // Draw obstacle
        ctx.fillStyle = '#ff3333';
        
        // Draw X shape
        const size = cellSize - padding * 2;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff3333';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + padding + size, y + padding + size);
        ctx.moveTo(x + padding + size, y + padding);
        ctx.lineTo(x + padding, y + padding + size);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    });
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// ============ UI HELPERS ============
function showOverlay(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideOverlay(id) {
    document.getElementById(id).classList.add('hidden');
}

function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('currentLevel').textContent = level;
}

// ============ AUDIO ============
function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    
    // Resume audio context if suspended
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'eat':
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            oscillator.frequency.setValueAtTime(659.25, now + 0.05); // E5
            oscillator.frequency.setValueAtTime(783.99, now + 0.1); // G5
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
            
        case 'powerup':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
            
        case 'shield':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.setValueAtTime(200, now + 0.1);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
            
        case 'levelup':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(523.25, now);
            oscillator.frequency.setValueAtTime(659.25, now + 0.1);
            oscillator.frequency.setValueAtTime(783.99, now + 0.2);
            oscillator.frequency.setValueAtTime(1046.5, now + 0.3);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
            break;
            
        case 'gameover':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            break;
            
        case 'start':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(262, now);
            oscillator.frequency.setValueAtTime(330, now + 0.1);
            oscillator.frequency.setValueAtTime(392, now + 0.2);
            oscillator.frequency.setValueAtTime(523, now + 0.3);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialDecayTo(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
            break;
    }
}

// Polyfill for exponentialDecayTo
if (typeof GainNode !== 'undefined') {
    GainNode.prototype.gain.exponentialDecayTo = function(value, endTime) {
        this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
    };
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundIcon').textContent = soundEnabled ? '🔊' : '🔇';
}

// ============ STORAGE ============
function loadHighScore() {
    const saved = localStorage.getItem('neonSnake_highScore');
    if (saved) {
        highScore = parseInt(saved, 10);
    }
}

function saveHighScore() {
    localStorage.setItem('neonSnake_highScore', highScore.toString());
}

function saveToLeaderboard() {
    const leaderboard = getLeaderboard();
    
    const entry = {
        score: score,
        difficulty: difficulty,
        level: level,
        date: new Date().toISOString()
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    const top10 = leaderboard.slice(0, 10);
    
    localStorage.setItem('neonSnake_leaderboard', JSON.stringify(top10));
}

function getLeaderboard() {
    const saved = localStorage.getItem('neonSnake_leaderboard');
    return saved ? JSON.parse(saved) : [];
}

function showLeaderboard() {
    const leaderboard = getLeaderboard();
    const listEl = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        listEl.innerHTML = '<div class="leaderboard-empty">Belum ada skor tersimpan.<br>Mainkan game untuk mulai!</div>';
    } else {
        listEl.innerHTML = leaderboard.map((entry, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';
            const date = new Date(entry.date).toLocaleDateString('id-ID');
            const difficultyLabel = {
                easy: 'Mudah',
                medium: 'Sedang', 
                hard: 'Sulit'
            }[entry.difficulty];
            
            return `
                <div class="leaderboard-entry">
                    <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-score">${entry.score}</div>
                        <div class="leaderboard-meta">
                            <span>Level ${entry.level}</span>
                            <span>•</span>
                            <span>${difficultyLabel}</span>
                            <span>•</span>
                            <span>${date}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('leaderboardModal').classList.remove('hidden');
}

function hideLeaderboard() {
    document.getElementById('leaderboardModal').classList.add('hidden');
}

function clearLeaderboard() {
    if (confirm('Hapus semua data leaderboard?')) {
        localStorage.removeItem('neonSnake_leaderboard');
        localStorage.removeItem('neonSnake_highScore');
        highScore = 0;
        updateScoreDisplay();
        showLeaderboard(); // Refresh display
    }
}
