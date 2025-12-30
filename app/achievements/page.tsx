'use client';

import { useEffect, useState } from 'react';
import { getAchievements, Achievement, getStats, unlockAchievement } from '../lib/storage';
import { useTheme } from '../components/ThemeProvider';
import styles from './page.module.css';

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState({ totalGamesPlayed: 0, totalScore: 0, powerupsCollected: 0 });
    const { theme } = useTheme();

    useEffect(() => {
        loadData();
    }, []);

    // Unlock night owl achievement when viewing this page in dark mode
    useEffect(() => {
        if (theme === 'dark') {
            unlockAchievement('night_owl');
            loadData();
        }
    }, [theme]);

    const loadData = () => {
        setAchievements(getAchievements());
        setStats(getStats());
    };

    const unlockedCount = achievements.filter(a => a.unlockedAt).length;
    const totalCount = achievements.length;
    const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        <span>🔔</span>
                        <span className="neon-text magenta">ACHIEVEMENTS</span>
                    </h1>
                    <p className={styles.subtitle}>Unlock badges dan raih pencapaian!</p>
                </header>

                {/* Progress */}
                <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>Progress</span>
                        <span className={styles.progressCount}>{unlockedCount} / {totalCount}</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>🎮</span>
                        <span className={styles.statValue}>{stats.totalGamesPlayed}</span>
                        <span className={styles.statLabel}>Games Played</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>⭐</span>
                        <span className={styles.statValue}>{stats.powerupsCollected}</span>
                        <span className={styles.statLabel}>Power-ups</span>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className={styles.achievementsGrid}>
                    {achievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            className={`${styles.achievementCard} ${achievement.unlockedAt ? styles.unlocked : styles.locked}`}
                        >
                            <div className={styles.achievementIcon}>
                                {achievement.unlockedAt ? achievement.icon : '🔒'}
                            </div>
                            <div className={styles.achievementInfo}>
                                <h3 className={styles.achievementName}>{achievement.name}</h3>
                                <p className={styles.achievementDesc}>{achievement.description}</p>
                                {achievement.unlockedAt && (
                                    <span className={styles.unlockedDate}>
                                        ✓ {new Date(achievement.unlockedAt).toLocaleDateString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
