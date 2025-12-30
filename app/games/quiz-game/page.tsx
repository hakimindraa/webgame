'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements } from '../../lib/storage';
import { playSFX } from '../../lib/sound';
import Tutorial, { GAME_TUTORIALS } from '../../components/Tutorial';
import styles from './page.module.css';

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    category: string;
}

const QUESTIONS: Question[] = [
    { question: "Berapa hasil dari 15 + 27?", options: ["42", "40", "45", "38"], correctIndex: 0, category: "Math" },
    { question: "Planet terdekat dengan Matahari?", options: ["Venus", "Mars", "Merkurius", "Bumi"], correctIndex: 2, category: "Science" },
    { question: "Siapa penemu lampu?", options: ["Einstein", "Edison", "Newton", "Tesla"], correctIndex: 1, category: "History" },
    { question: "Berapa jumlah kaki laba-laba?", options: ["6", "8", "10", "4"], correctIndex: 1, category: "Science" },
    { question: "Ibu kota Indonesia?", options: ["Surabaya", "Bandung", "Jakarta", "Medan"], correctIndex: 2, category: "Geography" },
    { question: "Berapa hasil 9 x 7?", options: ["56", "63", "72", "54"], correctIndex: 1, category: "Math" },
    { question: "Hewan tercepat di darat?", options: ["Singa", "Cheetah", "Kuda", "Harimau"], correctIndex: 1, category: "Science" },
    { question: "Warna primer adalah...", options: ["Hijau, Ungu, Orange", "Merah, Kuning, Biru", "Hitam, Putih, Abu", "Pink, Cyan, Lime"], correctIndex: 1, category: "Art" },
    { question: "Berapa sisi segitiga?", options: ["4", "5", "3", "6"], correctIndex: 2, category: "Math" },
    { question: "Gunung tertinggi di dunia?", options: ["K2", "Everest", "Kilimanjaro", "Fuji"], correctIndex: 1, category: "Geography" },
    { question: "Berapa detik dalam 1 menit?", options: ["100", "30", "60", "90"], correctIndex: 2, category: "Math" },
    { question: "Organ yang memompa darah?", options: ["Paru-paru", "Otak", "Jantung", "Ginjal"], correctIndex: 2, category: "Science" },
];

export default function QuizGame() {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [timeLeft, setTimeLeft] = useState(15);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        setHighScore(getHighScore('quiz-game'));
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && !showResult && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0 && !showResult) {
            handleTimeout();
        }
        return () => clearTimeout(timer);
    }, [gameState, timeLeft, showResult]);

    const startGame = () => {
        const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, totalQuestions);
        setShuffledQuestions(shuffled);
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(15);
        setGameState('playing');
        unlockAchievement('quiz_beginner');
    };

    const handleTimeout = () => {
        setShowResult(true);
        setSelectedAnswer(-1);
    };

    const handleAnswer = (answerIndex: number) => {
        if (showResult) return;

        setSelectedAnswer(answerIndex);
        setShowResult(true);

        if (answerIndex === shuffledQuestions[currentQuestion].correctIndex) {
            const points = 10 + timeLeft;
            setScore(prev => prev + points);
            playSFX('correct');
        } else {
            playSFX('wrong');
        }
    };

    const nextQuestion = () => {
        if (currentQuestion + 1 >= shuffledQuestions.length) {
            endGame();
        } else {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setTimeLeft(15);
        }
    };

    const endGame = () => {
        setGameState('result');
        const finalScore = score;
        saveScore('quiz-game', finalScore, Math.floor(finalScore / 50) + 1, 'normal');
        checkScoreAchievements(finalScore, 'normal');
        setHighScore(getHighScore('quiz-game'));
    };

    const getButtonClass = (index: number) => {
        if (!showResult) return styles.optionBtn;
        if (index === shuffledQuestions[currentQuestion].correctIndex) {
            return `${styles.optionBtn} ${styles.correct}`;
        }
        if (index === selectedAnswer) {
            return `${styles.optionBtn} ${styles.wrong}`;
        }
        return `${styles.optionBtn} ${styles.disabled}`;
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>← Back</Link>
                    <h1 className={styles.title}>
                        <span className="neon-text lime">QUIZ</span>
                        <span className="neon-text cyan">GAME</span>
                    </h1>
                </header>

                {gameState === 'start' && (
                    <div className={styles.startScreen}>
                        <h2 className={styles.startTitle}>🧠 Quiz Challenge</h2>
                        <p className={styles.startDesc}>Jawab {totalQuestions} pertanyaan dengan cepat dan benar!</p>
                        <div className={styles.questionCountSelect}>
                            <label>Jumlah Soal:</label>
                            <div className={styles.countButtons}>
                                {[5, 10, 12].map(count => (
                                    <button
                                        key={count}
                                        className={`${styles.countBtn} ${totalQuestions === count ? styles.active : ''}`}
                                        onClick={() => setTotalQuestions(count)}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            className={`${styles.btn} ${styles.btnTutorial}`}
                            onClick={() => { setShowTutorial(true); playSFX('click'); }}
                        >
                            📖 Cara Main
                        </button>
                        <button className={`${styles.btn} ${styles.btnStart}`} onClick={startGame}>
                            ▶️ MULAI QUIZ
                        </button>
                        <p className={styles.highScoreText}>🏆 Best Score: {highScore}</p>
                    </div>
                )}

                {gameState === 'playing' && shuffledQuestions.length > 0 && (
                    <>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}
                            />
                        </div>

                        <div className={styles.infoRow}>
                            <span className={styles.questionNum}>Q{currentQuestion + 1}/{shuffledQuestions.length}</span>
                            <span className={styles.category}>{shuffledQuestions[currentQuestion].category}</span>
                            <span className={`${styles.timer} ${timeLeft <= 5 ? styles.timerLow : ''}`}>⏱️ {timeLeft}s</span>
                        </div>

                        <div className={styles.questionCard}>
                            <p className={styles.questionText}>{shuffledQuestions[currentQuestion].question}</p>
                        </div>

                        <div className={styles.optionsGrid}>
                            {shuffledQuestions[currentQuestion].options.map((option, index) => (
                                <button
                                    key={index}
                                    className={getButtonClass(index)}
                                    onClick={() => handleAnswer(index)}
                                    disabled={showResult}
                                >
                                    <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                                    <span className={styles.optionText}>{option}</span>
                                </button>
                            ))}
                        </div>

                        {showResult && (
                            <div className={styles.resultFeedback}>
                                {selectedAnswer === shuffledQuestions[currentQuestion].correctIndex ? (
                                    <p className={styles.correctText}>✅ Benar! +{10 + timeLeft} poin</p>
                                ) : (
                                    <p className={styles.wrongText}>❌ Salah! Jawaban: {shuffledQuestions[currentQuestion].options[shuffledQuestions[currentQuestion].correctIndex]}</p>
                                )}
                                <button className={`${styles.btn} ${styles.btnNext}`} onClick={nextQuestion}>
                                    {currentQuestion + 1 >= shuffledQuestions.length ? '🏁 LIHAT HASIL' : '➡️ LANJUT'}
                                </button>
                            </div>
                        )}

                        <div className={styles.scoreDisplay}>
                            Score: <span className={styles.scoreNum}>{score}</span>
                        </div>
                    </>
                )}

                {gameState === 'result' && (
                    <div className={styles.resultScreen}>
                        <h2 className="neon-text lime">🎉 QUIZ SELESAI!</h2>
                        <div className={styles.finalScoreBox}>
                            <span className={styles.finalScoreLabel}>Skor Anda</span>
                            <span className={styles.finalScoreValue}>{score}</span>
                        </div>
                        <p className={styles.resultStats}>
                            Correct: {Math.floor(score / 15)} / {shuffledQuestions.length}
                        </p>
                        <button className={`${styles.btn} ${styles.btnRestart}`} onClick={() => setGameState('start')}>
                            🔄 MAIN LAGI
                        </button>
                    </div>
                )}

                {showTutorial && (
                    <Tutorial
                        {...GAME_TUTORIALS['quiz-game']}
                        onClose={() => setShowTutorial(false)}
                    />
                )}
            </div>
        </div>
    );
}
