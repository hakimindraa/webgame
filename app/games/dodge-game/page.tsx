'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements } from '../../lib/storage';
import { playSFX } from '../../lib/sound';
import Tutorial, { GAME_TUTORIALS } from '../../components/Tutorial';
import styles from './page.module.css';

const CONFIG = {
    PLAYER_SIZE: 30,
    PLAYER_SPEED: 8,
    ENEMY_SIZE: 25,
    ENEMY_SPEED_MIN: 3,
    ENEMY_SPEED_MAX: 7,
    SPAWN_INTERVAL: 800,
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 500,
};

interface Enemy {
    x: number;
    y: number;
    speed: number;
    color: string;
}

export default function DodgeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    const playerRef = useRef({ x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT - 50 });
    const enemiesRef = useRef<Enemy[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const scoreRef = useRef(0);
    const gameLoopRef = useRef<number | null>(null);
    const lastSpawnRef = useRef(0);
    const startTimeRef = useRef(0);

    useEffect(() => {
        setHighScore(getHighScore('dodge-game'));
    }, []);

    const startGame = () => {
        playerRef.current = { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT - 50 };
        enemiesRef.current = [];
        scoreRef.current = 0;
        setScore(0);
        startTimeRef.current = Date.now();
        lastSpawnRef.current = Date.now();
        setGameState('playing');
        unlockAchievement('dodge_beginner');
    };

    const gameOver = useCallback(() => {
        setGameState('gameover');
        playSFX('gameover');
        const finalScore = scoreRef.current;
        saveScore('dodge-game', finalScore, Math.floor(finalScore / 10) + 1, 'normal');
        checkScoreAchievements(finalScore, 'normal');
        setHighScore(getHighScore('dodge-game'));
    }, []);

    const colors = ['#00ffff', '#ff00ff', '#39ff14', '#ff6b35', '#ffff00'];

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Draw enemies
        enemiesRef.current.forEach(enemy => {
            ctx.fillStyle = enemy.color;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 15;
            ctx.fillRect(
                enemy.x - CONFIG.ENEMY_SIZE / 2,
                enemy.y - CONFIG.ENEMY_SIZE / 2,
                CONFIG.ENEMY_SIZE,
                CONFIG.ENEMY_SIZE
            );
        });

        ctx.shadowBlur = 0;

        // Draw player
        const player = playerRef.current;
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(player.x, player.y, CONFIG.PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Player glow ring
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, CONFIG.PLAYER_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }, []);

    const update = useCallback(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Update player position based on keys
        const player = playerRef.current;
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
            player.x = Math.max(CONFIG.PLAYER_SIZE / 2, player.x - CONFIG.PLAYER_SPEED);
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
            player.x = Math.min(canvas.width - CONFIG.PLAYER_SIZE / 2, player.x + CONFIG.PLAYER_SPEED);
        }
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
            player.y = Math.max(CONFIG.PLAYER_SIZE / 2, player.y - CONFIG.PLAYER_SPEED);
        }
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
            player.y = Math.min(canvas.height - CONFIG.PLAYER_SIZE / 2, player.y + CONFIG.PLAYER_SPEED);
        }

        // Spawn enemies
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        const spawnInterval = Math.max(300, CONFIG.SPAWN_INTERVAL - elapsed / 100);

        if (now - lastSpawnRef.current > spawnInterval) {
            const speed = CONFIG.ENEMY_SPEED_MIN + Math.random() * (CONFIG.ENEMY_SPEED_MAX - CONFIG.ENEMY_SPEED_MIN);
            enemiesRef.current.push({
                x: Math.random() * (canvas.width - CONFIG.ENEMY_SIZE) + CONFIG.ENEMY_SIZE / 2,
                y: -CONFIG.ENEMY_SIZE,
                speed: speed + elapsed / 10000,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
            lastSpawnRef.current = now;
        }

        // Update enemies
        enemiesRef.current = enemiesRef.current.filter(enemy => {
            enemy.y += enemy.speed;

            // Check collision
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (CONFIG.PLAYER_SIZE + CONFIG.ENEMY_SIZE) / 2;

            if (distance < minDistance) {
                gameOver();
                return false;
            }

            return enemy.y < canvas.height + CONFIG.ENEMY_SIZE;
        });

        // Update score (time survived in seconds)
        const newScore = Math.floor(elapsed / 100);
        if (newScore !== scoreRef.current) {
            scoreRef.current = newScore;
            setScore(newScore);
        }

        draw();
        gameLoopRef.current = requestAnimationFrame(update);
    }, [gameState, gameOver, draw, colors]);

    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = requestAnimationFrame(update);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameState, update]);

    useEffect(() => {
        draw();
    }, [draw]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysRef.current.add(e.key);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current.delete(e.key);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Touch controls
    const handleTouch = (e: React.TouchEvent) => {
        if (gameState !== 'playing') return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return;

        const x = ((touch.clientX - rect.left) / rect.width) * CONFIG.CANVAS_WIDTH;
        const y = ((touch.clientY - rect.top) / rect.height) * CONFIG.CANVAS_HEIGHT;

        playerRef.current.x = Math.max(CONFIG.PLAYER_SIZE / 2, Math.min(CONFIG.CANVAS_WIDTH - CONFIG.PLAYER_SIZE / 2, x));
        playerRef.current.y = Math.max(CONFIG.PLAYER_SIZE / 2, Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER_SIZE / 2, y));
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>← Back</Link>
                    <h1 className={styles.title}>
                        <span className="neon-text cyan">DODGE</span>
                        <span className="neon-text magenta">GAME</span>
                    </h1>
                </header>

                <div className={styles.scorePanel}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>TIME</span>
                        <span className={styles.scoreValue}>{(score / 10).toFixed(1)}s</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>BEST</span>
                        <span className={styles.scoreValue}>{(highScore / 10).toFixed(1)}s</span>
                    </div>
                </div>

                <div className={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        width={CONFIG.CANVAS_WIDTH}
                        height={CONFIG.CANVAS_HEIGHT}
                        onTouchMove={handleTouch}
                        onTouchStart={handleTouch}
                    />

                    {gameState === 'start' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text cyan`}>🎯 DODGE GAME</h2>
                                <p className={styles.instructions}>Hindari semua rintangan!</p>
                                <button
                                    className={`${styles.btn} ${styles.btnTutorial}`}
                                    onClick={() => { setShowTutorial(true); playSFX('click'); }}
                                >
                                    📖 Cara Main
                                </button>
                                <button className={`${styles.btn} ${styles.btnStart}`} onClick={startGame}>
                                    ▶️ MULAI
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text magenta`}>💥 GAME OVER</h2>
                                <div className={styles.finalScore}>
                                    <span className={styles.finalScoreLabel}>Bertahan</span>
                                    <span className={styles.finalScoreValue}>{(score / 10).toFixed(1)}s</span>
                                </div>
                                <button className={`${styles.btn} ${styles.btnRestart}`} onClick={() => setGameState('start')}>
                                    🔄 MAIN LAGI
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className={styles.hint}>💡 Arrow Keys / WASD / Touch untuk bergerak</p>

                {showTutorial && (
                    <Tutorial
                        {...GAME_TUTORIALS['dodge-game']}
                        onClose={() => setShowTutorial(false)}
                    />
                )}
            </div>
        </div>
    );
}
