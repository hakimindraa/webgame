'use client';

import React, { useEffect, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { getLeaderboard, clearLeaderboard, LeaderboardEntry } from '../lib/storage';
import {
    TrophyIcon,
    SnakeIcon,
    BlockBlastIcon,
    FlappyBirdIcon,
    DodgeIcon,
    MemoryIcon,
    QuizIcon,
    GamepadIcon
} from '../components/GameIcons';
import styles from './page.module.css';

const GAMES = [
    { id: 'snake', name: 'Snake', Icon: SnakeIcon },
    { id: 'block-blast', name: 'Block Blast', Icon: BlockBlastIcon },
    { id: 'flappy-bird', name: 'Flappy Bird', Icon: FlappyBirdIcon },
    { id: 'dodge-game', name: 'Dodge Game', Icon: DodgeIcon },
    { id: 'memory-game', name: 'Memory Game', Icon: MemoryIcon },
    { id: 'quiz-game', name: 'Quiz Game', Icon: QuizIcon },
    { id: 'all', name: 'All Games', Icon: GamepadIcon },
];

const GAME_ICONS: Record<string, React.FC<{ className?: string; size?: number }>> = {
    'snake': SnakeIcon,
    'block-blast': BlockBlastIcon,
    'flappy-bird': FlappyBirdIcon,
    'dodge-game': DodgeIcon,
    'memory-game': MemoryIcon,
    'quiz-game': QuizIcon,
};

export default function LeaderboardPage() {
    const [activeGame, setActiveGame] = useState('all');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        loadLeaderboard();
    }, [activeGame]);

    const loadLeaderboard = () => {
        const data = activeGame === 'all'
            ? getLeaderboard()
            : getLeaderboard(activeGame);
        setEntries(data.slice(0, 10));
    };

    const handleClear = () => {
        if (confirm('Hapus semua data leaderboard?')) {
            clearLeaderboard();
            loadLeaderboard();
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        const labels: Record<string, string> = {
            easy: 'Mudah',
            medium: 'Sedang',
            hard: 'Sulit',
            normal: 'Normal',
        };
        return labels[difficulty] || difficulty;
    };

    const getGameIcon = (game: string) => {
        const IconComponent = GAME_ICONS[game] || GamepadIcon;
        return <IconComponent size={20} className={styles.entryGameIcon} />;
    };

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        <TrophyIcon size={36} className={styles.titleIcon} />
                        <span className="neon-text cyan">LEADERBOARD</span>
                    </h1>
                    <p className={styles.subtitle}>Top scores from all your games</p>
                </header>

                {/* Game Filter Tabs */}
                <div className={styles.tabs}>
                    {GAMES.map((game) => (
                        <button
                            key={game.id}
                            className={`${styles.tab} ${activeGame === game.id ? styles.active : ''}`}
                            onClick={() => setActiveGame(game.id)}
                        >
                            <game.Icon size={16} className={styles.tabIcon} />
                            <span>{game.name}</span>
                        </button>
                    ))}
                </div>

                {/* Leaderboard List */}
                <div className={styles.leaderboardList}>
                    {entries.length === 0 ? (
                        <div className={styles.empty}>
                            <GamepadIcon size={48} className={styles.emptyIcon} />
                            <p>Belum ada skor tersimpan.</p>
                            <p className={styles.emptyHint}>Mainkan game untuk mulai!</p>
                        </div>
                    ) : (
                        entries.map((entry, index) => (
                            <div key={entry.id} className={styles.entry}>
                                <div className={`${styles.rank} ${styles[`rank${index + 1}`] || styles.rankOther}`}>
                                    {index + 1}
                                </div>
                                <div className={styles.gameIcon}>
                                    {getGameIcon(entry.game)}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.score}>{entry.score}</div>
                                    <div className={styles.meta}>
                                        <span>Level {entry.level}</span>
                                        <span>•</span>
                                        <span>{getDifficultyLabel(entry.difficulty)}</span>
                                        <span>•</span>
                                        <span>{new Date(entry.date).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Actions */}
                {entries.length > 0 && (
                    <div className={styles.actions}>
                        <button className={styles.clearBtn} onClick={handleClear}>
                            <TrashIcon className={styles.clearIcon} />
                            Hapus Semua Data
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
