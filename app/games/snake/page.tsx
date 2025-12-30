'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements, incrementStat } from '../../lib/storage';
import styles from './page.module.css';

// Game Configuration
const CONFIG = {
    GRID_SIZE: 20,
    INITIAL_SNAKE_LENGTH: 3,
    POWERUP_DURATION: 5000,
    POWERUP_SPAWN_CHANCE: 0.15,
    OBSTACLE_SPAWN_CHANCE: 0.1,
    MAX_OBSTACLES: 10,
    DIFFICULTY: {
        easy: { speed: 150, obstacleMultiplier: 0.5, scoreMultiplier: 1, label: 'Mudah' },
        medium: { speed: 100, obstacleMultiplier: 1, scoreMultiplier: 1.5, label: 'Sedang' },
        hard: { speed: 70, obstacleMultiplier: 1.5, scoreMultiplier: 2, label: 'Sulit' },
    },
    POWERUP_TYPES: {
        speed: { icon: '🚀', name: 'Speed Boost', color: '#ff6b35' },
        shield: { icon: '🛡️', name: 'Shield', color: '#00bfff' },
        double: { icon: '⭐', name: 'Double Points', color: '#ffff00' },
    },
};

type Direction = { x: number; y: number };
type Position = { x: number; y: number };
type PowerupType = keyof typeof CONFIG.POWERUP_TYPES;
type Difficulty = keyof typeof CONFIG.DIFFICULTY;
type GameState = 'start' | 'playing' | 'paused' | 'gameover';

interface Powerup extends Position {
    type: PowerupType;
}

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [activePowerup, setActivePowerup] = useState<PowerupType | null>(null);
    const [powerupTimer, setPowerupTimer] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    // Game state refs (for game loop)
    const snakeRef = useRef<Position[]>([]);
    const directionRef = useRef<Direction>({ x: 1, y: 0 });
    const nextDirectionRef = useRef<Direction>({ x: 1, y: 0 });
    const foodRef = useRef<Position | null>(null);
    const obstaclesRef = useRef<Position[]>([]);
    const powerupRef = useRef<Powerup | null>(null);
    const activePowerupRef = useRef<PowerupType | null>(null);
    const powerupEndTimeRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const gameLoopRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Touch handling
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    // Initialize audio
    useEffect(() => {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }, []);

    // Load high score
    useEffect(() => {
        setHighScore(getHighScore('snake'));
    }, []);

    // Canvas resize
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const wrapper = canvas.parentElement;
            if (!wrapper) return;
            const size = Math.min(wrapper.clientWidth, wrapper.clientHeight, 400);
            canvas.width = size;
            canvas.height = size;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Play sound
    const playSound = useCallback((type: string) => {
        if (!soundEnabled || !audioCtxRef.current) return;

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        const now = audioCtxRef.current.currentTime;

        switch (type) {
            case 'eat':
                oscillator.frequency.setValueAtTime(523.25, now);
                oscillator.frequency.setValueAtTime(659.25, now + 0.05);
                oscillator.frequency.setValueAtTime(783.99, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;
            case 'powerup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
            case 'gameover':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
        }
    }, [soundEnabled]);

    // Spawn food
    const spawnFood = useCallback(() => {
        const isOccupied = (pos: Position): boolean => {
            if (snakeRef.current.some(seg => seg.x === pos.x && seg.y === pos.y)) return true;
            if (obstaclesRef.current.some(obs => obs.x === pos.x && obs.y === pos.y)) return true;
            if (powerupRef.current && powerupRef.current.x === pos.x && powerupRef.current.y === pos.y) return true;
            return false;
        };

        let newFood: Position;
        do {
            newFood = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            };
        } while (isOccupied(newFood));
        foodRef.current = newFood;
    }, []);

    // Spawn powerup
    const spawnPowerup = useCallback(() => {
        const isOccupied = (pos: Position): boolean => {
            if (snakeRef.current.some(seg => seg.x === pos.x && seg.y === pos.y)) return true;
            if (obstaclesRef.current.some(obs => obs.x === pos.x && obs.y === pos.y)) return true;
            if (foodRef.current && foodRef.current.x === pos.x && foodRef.current.y === pos.y) return true;
            return false;
        };

        let newPowerup: Position;
        do {
            newPowerup = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            };
        } while (isOccupied(newPowerup));

        const types = Object.keys(CONFIG.POWERUP_TYPES) as PowerupType[];
        powerupRef.current = {
            ...newPowerup,
            type: types[Math.floor(Math.random() * types.length)],
        };
    }, []);

    // Spawn obstacle
    const spawnObstacle = useCallback(() => {
        if (obstaclesRef.current.length >= CONFIG.MAX_OBSTACLES) return;

        const isOccupied = (pos: Position): boolean => {
            if (snakeRef.current.some(seg => seg.x === pos.x && seg.y === pos.y)) return true;
            if (obstaclesRef.current.some(obs => obs.x === pos.x && obs.y === pos.y)) return true;
            if (foodRef.current && foodRef.current.x === pos.x && foodRef.current.y === pos.y) return true;
            if (powerupRef.current && powerupRef.current.x === pos.x && powerupRef.current.y === pos.y) return true;
            // Keep away from head
            const head = snakeRef.current[0];
            if (head && Math.abs(pos.x - head.x) < 3 && Math.abs(pos.y - head.y) < 3) return true;
            return false;
        };

        let newObstacle: Position;
        let attempts = 0;
        do {
            newObstacle = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE),
            };
            attempts++;
        } while (isOccupied(newObstacle) && attempts < 50);

        if (attempts < 50) {
            obstaclesRef.current.push(newObstacle);
        }
    }, []);

    // Draw game
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = canvas.width / CONFIG.GRID_SIZE;

        // Clear
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CONFIG.GRID_SIZE; i++) {
            const pos = i * cellSize;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(canvas.width, pos);
            ctx.stroke();
        }

        // Draw obstacles
        obstaclesRef.current.forEach(obs => {
            const x = obs.x * cellSize;
            const y = obs.y * cellSize;
            ctx.shadowColor = '#ff3333';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + cellSize - 5, y + cellSize - 5);
            ctx.moveTo(x + cellSize - 5, y + 5);
            ctx.lineTo(x + 5, y + cellSize - 5);
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // Draw food
        if (foodRef.current) {
            const x = foodRef.current.x * cellSize + cellSize / 2;
            const y = foodRef.current.y * cellSize + cellSize / 2;
            const radius = cellSize / 2 - 4;
            const pulse = Math.sin(Date.now() / 200) * 0.15 + 1;

            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * pulse);
            gradient.addColorStop(0, '#ff66ff');
            gradient.addColorStop(1, '#ff00ff');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw powerup
        if (powerupRef.current) {
            const x = powerupRef.current.x * cellSize + cellSize / 2;
            const y = powerupRef.current.y * cellSize + cellSize / 2;
            const float = Math.sin(Date.now() / 300) * 3;
            const config = CONFIG.POWERUP_TYPES[powerupRef.current.type];

            ctx.shadowColor = config.color;
            ctx.shadowBlur = 25;
            ctx.font = `${cellSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.icon, x, y + float);
            ctx.shadowBlur = 0;
        }

        // Draw snake
        snakeRef.current.forEach((segment, index) => {
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            const padding = 2;

            let color: string;
            if (index === 0) {
                color = activePowerupRef.current === 'shield' ? '#00bfff' : '#39ff14';
            } else {
                const ratio = index / snakeRef.current.length;
                if (activePowerupRef.current === 'shield') {
                    color = `hsl(195, 100%, ${70 - ratio * 30}%)`;
                } else if (activePowerupRef.current === 'double') {
                    color = `hsl(60, 100%, ${70 - ratio * 30}%)`;
                } else if (activePowerupRef.current === 'speed') {
                    color = `hsl(20, 100%, ${60 - ratio * 20}%)`;
                } else {
                    color = `hsl(180, 100%, ${60 - ratio * 30}%)`;
                }
            }

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = index === 0 ? 15 : 8;

            const radius = cellSize / 4;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, radius);
            ctx.fill();

            // Draw eyes on head
            if (index === 0) {
                ctx.shadowBlur = 0;
                const eyeSize = cellSize / 6;
                const eyeOffset = cellSize / 4;
                let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;
                const dir = directionRef.current;

                if (dir.x === 1) {
                    eye1X = x + cellSize - eyeOffset; eye1Y = y + eyeOffset;
                    eye2X = x + cellSize - eyeOffset; eye2Y = y + cellSize - eyeOffset;
                } else if (dir.x === -1) {
                    eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
                    eye2X = x + eyeOffset; eye2Y = y + cellSize - eyeOffset;
                } else if (dir.y === -1) {
                    eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
                    eye2X = x + cellSize - eyeOffset; eye2Y = y + eyeOffset;
                } else {
                    eye1X = x + eyeOffset; eye1Y = y + cellSize - eyeOffset;
                    eye2X = x + cellSize - eyeOffset; eye2Y = y + cellSize - eyeOffset;
                }

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeSize / 2, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, eyeSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.shadowBlur = 0;
    }, []);

    // Game loop
    const gameLoop = useCallback((timestamp: number) => {
        if (gameState !== 'playing') return;

        const speed = activePowerupRef.current === 'speed'
            ? CONFIG.DIFFICULTY[difficulty].speed * 0.6
            : CONFIG.DIFFICULTY[difficulty].speed;

        if (timestamp - lastUpdateRef.current < speed) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }
        lastUpdateRef.current = timestamp;

        // Update direction
        directionRef.current = { ...nextDirectionRef.current };

        // Calculate new head position
        const head = { ...snakeRef.current[0] };
        head.x += directionRef.current.x;
        head.y += directionRef.current.y;

        // Wrap around
        if (head.x < 0) head.x = CONFIG.GRID_SIZE - 1;
        if (head.x >= CONFIG.GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = CONFIG.GRID_SIZE - 1;
        if (head.y >= CONFIG.GRID_SIZE) head.y = 0;

        // Check self collision
        const selfCollision = snakeRef.current.some((seg, i) => i > 0 && seg.x === head.x && seg.y === head.y);
        const obstacleCollision = obstaclesRef.current.some(obs => obs.x === head.x && obs.y === head.y);

        if (selfCollision || obstacleCollision) {
            if (activePowerupRef.current === 'shield') {
                activePowerupRef.current = null;
                setActivePowerup(null);
                playSound('powerup');
            } else {
                // Game over
                playSound('gameover');
                setGameState('gameover');

                const finalScore = scoreRef.current;
                const currentHighScore = getHighScore('snake');
                const isNew = finalScore > currentHighScore;
                setIsNewHighScore(isNew);

                saveScore('snake', finalScore, levelRef.current, difficulty);
                checkScoreAchievements(finalScore, difficulty);
                setHighScore(getHighScore('snake'));
                return;
            }
        }

        // Add new head
        snakeRef.current.unshift(head);

        // Check food collision
        if (foodRef.current && head.x === foodRef.current.x && head.y === foodRef.current.y) {
            let points = 10 * CONFIG.DIFFICULTY[difficulty].scoreMultiplier;
            if (activePowerupRef.current === 'double') points *= 2;
            scoreRef.current += Math.round(points);
            setScore(scoreRef.current);

            const newLevel = Math.floor(scoreRef.current / 100) + 1;
            if (newLevel > levelRef.current) {
                levelRef.current = newLevel;
                setLevel(newLevel);
            }

            playSound('eat');
            spawnFood();

            // Maybe spawn powerup
            if (!powerupRef.current && Math.random() < CONFIG.POWERUP_SPAWN_CHANCE) {
                spawnPowerup();
            }

            // Maybe spawn obstacle
            const obstacleChance = CONFIG.OBSTACLE_SPAWN_CHANCE * CONFIG.DIFFICULTY[difficulty].obstacleMultiplier;
            if (Math.random() < obstacleChance) {
                spawnObstacle();
            }
        } else {
            snakeRef.current.pop();
        }

        // Check powerup collision
        if (powerupRef.current && head.x === powerupRef.current.x && head.y === powerupRef.current.y) {
            activePowerupRef.current = powerupRef.current.type;
            setActivePowerup(powerupRef.current.type);
            powerupEndTimeRef.current = Date.now() + CONFIG.POWERUP_DURATION;
            powerupRef.current = null;
            playSound('powerup');
            incrementStat('powerupsCollected');
        }

        // Check powerup expiration
        if (activePowerupRef.current && Date.now() > powerupEndTimeRef.current) {
            activePowerupRef.current = null;
            setActivePowerup(null);
        }

        // Update powerup timer
        if (activePowerupRef.current) {
            setPowerupTimer(Math.max(0, Math.ceil((powerupEndTimeRef.current - Date.now()) / 1000)));
        }

        draw();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, difficulty, draw, playSound, spawnFood, spawnPowerup, spawnObstacle]);

    // Start game loop
    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameState, gameLoop]);

    // Handle direction change
    const setDirection = useCallback((x: number, y: number) => {
        if (directionRef.current.x + x !== 0 || directionRef.current.y + y !== 0) {
            nextDirectionRef.current = { x, y };
        }
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (gameState !== 'playing' && gameState !== 'paused') return;

            switch (e.key) {
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
                    if (gameState === 'playing') setGameState('paused');
                    else if (gameState === 'paused') setGameState('playing');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [gameState, setDirection]);

    // Touch controls
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
        };

        const diffX = touchEnd.x - touchStartRef.current.x;
        const diffY = touchEnd.y - touchStartRef.current.y;
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

        touchStartRef.current = null;
    };

    // Start game
    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        setScore(0);
        setLevel(1);
        setIsNewHighScore(false);
        scoreRef.current = 0;
        levelRef.current = 1;

        // Initialize snake
        const startX = Math.floor(CONFIG.GRID_SIZE / 2);
        const startY = Math.floor(CONFIG.GRID_SIZE / 2);
        snakeRef.current = [];
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            snakeRef.current.push({ x: startX - i, y: startY });
        }

        directionRef.current = { x: 1, y: 0 };
        nextDirectionRef.current = { x: 1, y: 0 };
        obstaclesRef.current = [];
        powerupRef.current = null;
        activePowerupRef.current = null;
        setActivePowerup(null);

        spawnFood();
        unlockAchievement('snake_beginner');
        setGameState('playing');
        lastUpdateRef.current = 0;
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>
                        ← Back
                    </Link>
                    <h1 className={styles.title}>
                        <span className="neon-text cyan">NEON</span>
                        <span className="neon-text magenta">SNAKE</span>
                    </h1>
                </header>

                {/* Score Panel */}
                <div className={styles.scorePanel}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>SCORE</span>
                        <span className={styles.scoreValue}>{score}</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>HIGH</span>
                        <span className={styles.scoreValue}>{highScore}</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>LEVEL</span>
                        <span className={styles.scoreValue}>{level}</span>
                    </div>
                </div>

                {/* Active Powerup */}
                {activePowerup && (
                    <div className={styles.powerupStatus}>
                        <span className={styles.powerupIcon}>
                            {CONFIG.POWERUP_TYPES[activePowerup].icon}
                        </span>
                        <span className={styles.powerupTimer}>{powerupTimer}s</span>
                    </div>
                )}

                {/* Canvas */}
                <div className={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    />

                    {/* Start Screen */}
                    {gameState === 'start' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text cyan`}>🐍 NEON SNAKE</h2>
                                <p className={styles.overlaySubtitle}>Pilih Level Kesulitan</p>
                                <div className={styles.difficultyButtons}>
                                    <button className={`${styles.btn} ${styles.btnEasy}`} onClick={() => startGame('easy')}>
                                        🌟 MUDAH
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnMedium}`} onClick={() => startGame('medium')}>
                                        ⚡ SEDANG
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnHard}`} onClick={() => startGame('hard')}>
                                        🔥 SULIT
                                    </button>
                                </div>
                                <div className={styles.controlsInfo}>
                                    <p>💻 Laptop: Arrow Keys / WASD</p>
                                    <p>📱 HP: Swipe atau D-Pad</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pause Screen */}
                    {gameState === 'paused' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text yellow`}>⏸️ PAUSED</h2>
                                <button className={`${styles.btn} ${styles.btnResume}`} onClick={() => setGameState('playing')}>
                                    ▶️ LANJUT
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === 'gameover' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text magenta`}>💀 GAME OVER</h2>
                                <div className={styles.finalScore}>
                                    <span className={styles.finalScoreLabel}>Skor Akhir</span>
                                    <span className={styles.finalScoreValue}>{score}</span>
                                </div>
                                {isNewHighScore && (
                                    <div className={`${styles.newHighscore} neon-text yellow`}>
                                        🎉 HIGH SCORE BARU! 🎉
                                    </div>
                                )}
                                <button className={`${styles.btn} ${styles.btnRestart}`} onClick={() => setGameState('start')}>
                                    🔄 MAIN LAGI
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* D-Pad Controls */}
                <div className={styles.dpadContainer}>
                    <button className={`${styles.dpadBtn} ${styles.dpadUp}`} onClick={() => setDirection(0, -1)}>▲</button>
                    <div className={styles.dpadMiddle}>
                        <button className={`${styles.dpadBtn} ${styles.dpadLeft}`} onClick={() => setDirection(-1, 0)}>◀</button>
                        <button className={`${styles.dpadBtn} ${styles.dpadCenter}`}>●</button>
                        <button className={`${styles.dpadBtn} ${styles.dpadRight}`} onClick={() => setDirection(1, 0)}>▶</button>
                    </div>
                    <button className={`${styles.dpadBtn} ${styles.dpadDown}`} onClick={() => setDirection(0, 1)}>▼</button>
                </div>

                {/* Controls */}
                <div className={styles.gameControls}>
                    {gameState === 'playing' && (
                        <button className={styles.controlBtn} onClick={() => setGameState('paused')}>
                            ⏸️
                        </button>
                    )}
                    <button className={styles.controlBtn} onClick={() => setSoundEnabled(!soundEnabled)}>
                        {soundEnabled ? '🔊' : '🔇'}
                    </button>
                </div>

                {/* Legend */}
                <div className={styles.legend}>
                    <div className={styles.legendItem}>🚀 Speed</div>
                    <div className={styles.legendItem}>🛡️ Shield</div>
                    <div className={styles.legendItem}>⭐ 2x Points</div>
                    <div className={styles.legendItem}>💣 Obstacle</div>
                </div>
            </div>
        </div>
    );
}
