'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements } from '../../lib/storage';
import { playSFX } from '../../lib/sound';
import Tutorial, { GAME_TUTORIALS } from '../../components/Tutorial';
import styles from './page.module.css';

const EMOJIS = ['🎮', '🎯', '🏆', '⭐', '🔥', '💎', '🚀', '🌟', '🎨', '🎪', '🎭', '🎬', '🎵'];

interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'won'>('start');
    const [highScore, setHighScore] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [showTutorial, setShowTutorial] = useState(false);

    const gridSizes = { easy: 3, medium: 4, hard: 5 };

    useEffect(() => {
        setHighScore(getHighScore('memory-game'));
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, startTime]);

    const initializeGame = useCallback((diff: 'easy' | 'medium' | 'hard') => {
        setDifficulty(diff);
        const gridSize = gridSizes[diff];
        const numPairs = Math.floor((gridSize * gridSize) / 2);
        const selectedEmojis = EMOJIS.slice(0, numPairs);

        const cardPairs = [...selectedEmojis, ...selectedEmojis];
        const shuffled = cardPairs.sort(() => Math.random() - 0.5);

        const newCards: Card[] = shuffled.map((emoji, index) => ({
            id: index,
            emoji,
            isFlipped: false,
            isMatched: false,
        }));

        setCards(newCards);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setStartTime(Date.now());
        setElapsedTime(0);
        setGameState('playing');
        unlockAchievement('memory_beginner');
    }, []);

    const handleCardClick = (cardId: number) => {
        if (gameState !== 'playing') return;
        if (flippedCards.length >= 2) return;
        if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

        const newCards = [...cards];
        newCards[cardId].isFlipped = true;
        setCards(newCards);
        playSFX('flip');

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(prev => prev + 1);

            const [first, second] = newFlipped;
            if (cards[first].emoji === cards[second].emoji) {
                // Match found
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[first].isMatched = true;
                    matchedCards[second].isMatched = true;
                    setCards(matchedCards);
                    setFlippedCards([]);
                    playSFX('match');

                    const newMatches = matches + 1;
                    setMatches(newMatches);

                    // Check win
                    const gridSize = gridSizes[difficulty];
                    const totalPairs = Math.floor((gridSize * gridSize) / 2);
                    if (newMatches === totalPairs) {
                        handleWin();
                    }
                }, 300);
            } else {
                // No match
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[first].isFlipped = false;
                    resetCards[second].isFlipped = false;
                    setCards(resetCards);
                    setFlippedCards([]);
                    playSFX('error');
                }, 800);
            }
        }
    };

    const handleWin = () => {
        setGameState('won');
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        // Score = lower is better, so invert for leaderboard
        const score = Math.max(1000 - (moves * 10 + finalTime), 100);
        saveScore('memory-game', score, 1, difficulty);
        checkScoreAchievements(score, difficulty);
        setHighScore(getHighScore('memory-game'));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>← Back</Link>
                    <h1 className={styles.title}>
                        <span className="neon-text magenta">MEMORY</span>
                        <span className="neon-text cyan">GAME</span>
                    </h1>
                </header>

                {gameState === 'start' && (
                    <div className={styles.startScreen}>
                        <h2 className={styles.startTitle}>🧠 Pilih Level</h2>
                        <button
                            className={`${styles.btn} ${styles.btnTutorial}`}
                            onClick={() => { setShowTutorial(true); playSFX('click'); }}
                        >
                            📖 Cara Main
                        </button>
                        <div className={styles.difficultyButtons}>
                            <button className={`${styles.btn} ${styles.btnEasy}`} onClick={() => initializeGame('easy')}>
                                🌟 Easy (3x3)
                            </button>
                            <button className={`${styles.btn} ${styles.btnMedium}`} onClick={() => initializeGame('medium')}>
                                ⚡ Medium (4x4)
                            </button>
                            <button className={`${styles.btn} ${styles.btnHard}`} onClick={() => initializeGame('hard')}>
                                🔥 Hard (5x5)
                            </button>
                        </div>
                    </div>
                )}

                {gameState !== 'start' && (
                    <>
                        <div className={styles.scorePanel}>
                            <div className={styles.scoreItem}>
                                <span className={styles.scoreLabel}>MOVES</span>
                                <span className={styles.scoreValue}>{moves}</span>
                            </div>
                            <div className={styles.scoreItem}>
                                <span className={styles.scoreLabel}>TIME</span>
                                <span className={styles.scoreValue}>{formatTime(elapsedTime)}</span>
                            </div>
                            <div className={styles.scoreItem}>
                                <span className={styles.scoreLabel}>PAIRS</span>
                                <span className={styles.scoreValue}>{matches}/{Math.floor(cards.length / 2)}</span>
                            </div>
                        </div>

                        <div
                            className={styles.cardGrid}
                            style={{
                                gridTemplateColumns: `repeat(${gridSizes[difficulty]}, 1fr)`,
                                width: '100%',
                                maxWidth: `${gridSizes[difficulty] * 80 + 40}px`
                            }}
                        >
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`${styles.card} ${card.isFlipped || card.isMatched ? styles.flipped : ''} ${card.isMatched ? styles.matched : ''}`}
                                    onClick={() => handleCardClick(card.id)}
                                >
                                    <div className={styles.cardInner}>
                                        <div className={styles.cardFront}>?</div>
                                        <div className={styles.cardBack}>{card.emoji}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {gameState === 'won' && (
                            <div className={styles.winMessage}>
                                <h2 className="neon-text lime">🎉 SELAMAT!</h2>
                                <p>Moves: {moves} | Time: {formatTime(elapsedTime)}</p>
                                <button className={`${styles.btn} ${styles.btnRestart}`} onClick={() => setGameState('start')}>
                                    🔄 MAIN LAGI
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Tutorial Modal */}
                {showTutorial && (
                    <Tutorial
                        {...GAME_TUTORIALS['memory-game']}
                        onClose={() => setShowTutorial(false)}
                    />
                )}
            </div>
        </div>
    );
}
