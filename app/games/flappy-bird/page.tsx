'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements } from '../../lib/storage';
import { playSFX } from '../../lib/sound';
import Tutorial, { GAME_TUTORIALS } from '../../components/Tutorial';
import styles from './page.module.css';

// Game Configuration
const CONFIG = {
    GRAVITY: 0.5,
    JUMP_FORCE: -8,
    PIPE_SPEED: 3,
    PIPE_GAP: 150,
    PIPE_WIDTH: 60,
    PIPE_SPAWN_INTERVAL: 1500,
    BIRD_SIZE: 30,
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 600,
};

interface Pipe {
    x: number;
    topHeight: number;
    passed: boolean;
}

export default function FlappyBirdGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    // Game state refs
    const birdRef = useRef({ y: CONFIG.CANVAS_HEIGHT / 2, velocity: 0 });
    const pipesRef = useRef<Pipe[]>([]);
    const scoreRef = useRef(0);
    const gameLoopRef = useRef<number | null>(null);
    const lastPipeSpawnRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        setHighScore(getHighScore('flappy-bird'));
        try {
            audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        } catch (e) { }
    }, []);

    const playSound = useCallback((type: 'jump' | 'score' | 'hit') => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        const now = audioCtxRef.current.currentTime;

        switch (type) {
            case 'jump':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'score':
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.05);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'hit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
        }
    }, []);

    const jump = useCallback(() => {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing') {
            birdRef.current.velocity = CONFIG.JUMP_FORCE;
            playSound('jump');
        }
    }, [gameState, playSound]);

    const startGame = () => {
        birdRef.current = { y: CONFIG.CANVAS_HEIGHT / 2, velocity: 0 };
        pipesRef.current = [];
        scoreRef.current = 0;
        setScore(0);
        lastPipeSpawnRef.current = Date.now();
        setGameState('playing');
        unlockAchievement('flappy_beginner');
    };

    const gameOver = useCallback(() => {
        setGameState('gameover');
        playSound('hit');
        const finalScore = scoreRef.current;
        saveScore('flappy-bird', finalScore, Math.floor(finalScore / 10) + 1, 'normal');
        checkScoreAchievements(finalScore, 'normal');
        setHighScore(getHighScore('flappy-bird'));
    }, [playSound]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#1a0a2e');
        bgGradient.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw pipes
        pipesRef.current.forEach(pipe => {
            // Top pipe
            ctx.fillStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 15;
            ctx.fillRect(pipe.x, 0, CONFIG.PIPE_WIDTH, pipe.topHeight);

            // Bottom pipe
            const bottomY = pipe.topHeight + CONFIG.PIPE_GAP;
            ctx.fillRect(pipe.x, bottomY, CONFIG.PIPE_WIDTH, canvas.height - bottomY);

            // Pipe caps
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, CONFIG.PIPE_WIDTH + 10, 20);
            ctx.fillRect(pipe.x - 5, bottomY, CONFIG.PIPE_WIDTH + 10, 20);
        });

        ctx.shadowBlur = 0;

        // Draw bird
        const bird = birdRef.current;
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(80, bird.y, CONFIG.BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Bird eye
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(88, bird.y - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(89, bird.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Bird beak
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.moveTo(95, bird.y);
        ctx.lineTo(105, bird.y + 3);
        ctx.lineTo(95, bird.y + 6);
        ctx.closePath();
        ctx.fill();
    }, []);

    const update = useCallback(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Update bird physics
        birdRef.current.velocity += CONFIG.GRAVITY;
        birdRef.current.y += birdRef.current.velocity;

        // Check ground/ceiling collision
        if (birdRef.current.y < CONFIG.BIRD_SIZE / 2 ||
            birdRef.current.y > canvas.height - CONFIG.BIRD_SIZE / 2) {
            gameOver();
            return;
        }

        // Spawn new pipe
        const now = Date.now();
        if (now - lastPipeSpawnRef.current > CONFIG.PIPE_SPAWN_INTERVAL) {
            const topHeight = Math.random() * (canvas.height - CONFIG.PIPE_GAP - 100) + 50;
            pipesRef.current.push({ x: canvas.width, topHeight, passed: false });
            lastPipeSpawnRef.current = now;
        }

        // Update pipes
        pipesRef.current = pipesRef.current.filter(pipe => {
            pipe.x -= CONFIG.PIPE_SPEED;

            // Check collision
            const birdLeft = 80 - CONFIG.BIRD_SIZE / 2;
            const birdRight = 80 + CONFIG.BIRD_SIZE / 2;
            const birdTop = birdRef.current.y - CONFIG.BIRD_SIZE / 2;
            const birdBottom = birdRef.current.y + CONFIG.BIRD_SIZE / 2;

            const pipeRight = pipe.x + CONFIG.PIPE_WIDTH;
            const gapTop = pipe.topHeight;
            const gapBottom = pipe.topHeight + CONFIG.PIPE_GAP;

            if (birdRight > pipe.x && birdLeft < pipeRight) {
                if (birdTop < gapTop || birdBottom > gapBottom) {
                    gameOver();
                    return false;
                }
            }

            // Check if passed
            if (!pipe.passed && pipe.x + CONFIG.PIPE_WIDTH < birdLeft) {
                pipe.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
                playSound('score');
            }

            return pipe.x > -CONFIG.PIPE_WIDTH;
        });

        draw();
        gameLoopRef.current = requestAnimationFrame(update);
    }, [gameState, gameOver, draw, playSound]);

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

    // Input handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [jump]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>← Back</Link>
                    <h1 className={styles.title}>
                        <span className="neon-text yellow">FLAPPY</span>
                        <span className="neon-text cyan">BIRD</span>
                    </h1>
                </header>

                <div className={styles.scorePanel}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>SCORE</span>
                        <span className={styles.scoreValue}>{score}</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>BEST</span>
                        <span className={styles.scoreValue}>{highScore}</span>
                    </div>
                </div>

                <div className={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        width={CONFIG.CANVAS_WIDTH}
                        height={CONFIG.CANVAS_HEIGHT}
                        onClick={jump}
                        onTouchStart={(e) => { e.preventDefault(); jump(); }}
                    />

                    {gameState === 'start' && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text cyan`}>🐦 FLAPPY BIRD</h2>
                                <p className={styles.instructions}>Tap atau tekan Space untuk terbang!</p>
                                <button
                                    className={`${styles.btn} ${styles.btnTutorial}`}
                                    onClick={(e) => { e.stopPropagation(); setShowTutorial(true); playSFX('click'); }}
                                >
                                    📖 Cara Main
                                </button>
                                <button className={`${styles.btn} ${styles.btnStart}`} onClick={jump}>
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
                                    <span className={styles.finalScoreLabel}>Skor</span>
                                    <span className={styles.finalScoreValue}>{score}</span>
                                </div>
                                <button className={`${styles.btn} ${styles.btnRestart}`} onClick={() => setGameState('start')}>
                                    🔄 MAIN LAGI
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className={styles.hint}>💡 Tap layar atau tekan Space/↑ untuk terbang</p>

                {showTutorial && (
                    <Tutorial
                        {...GAME_TUTORIALS['flappy-bird']}
                        onClose={() => setShowTutorial(false)}
                    />
                )}
            </div>
        </div>
    );
}
