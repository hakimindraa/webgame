'use client';

import { useEffect, useState } from 'react';
import { TrophyIcon as Trophy, BellAlertIcon, MoonIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import GameCard from './components/GameCard';
import {
  SnakeIcon,
  BlockBlastIcon,
  FlappyBirdIcon,
  DodgeIcon,
  MemoryIcon,
  QuizIcon,
  GamepadIcon,
  TrophyIcon,
  AchievementIcon
} from './components/GameIcons';
import { getHighScore, getStats, getAchievements } from './lib/storage';
import styles from './page.module.css';

const GAMES = [
  {
    id: 'snake',
    title: 'Neon Snake',
    description: 'Klasik snake game dengan tema neon! Makan makanan, hindari rintangan.',
    Icon: SnakeIcon,
    href: '/games/snake',
    isPopular: true,
    accentColor: 'lime',
  },
  {
    id: 'block-blast',
    title: 'Block Blast',
    description: 'Puzzle game seru! Tempatkan blok untuk mengisi baris/kolom.',
    Icon: BlockBlastIcon,
    href: '/games/block-blast',
    accentColor: 'magenta',
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    description: 'Terbang melewati pipa! Tap untuk mengepakkan sayap.',
    Icon: FlappyBirdIcon,
    href: '/games/flappy-bird',
    isNew: true,
    accentColor: 'yellow',
  },
  {
    id: 'dodge-game',
    title: 'Dodge Game',
    description: 'Hindari rintangan yang jatuh sebanyak mungkin!',
    Icon: DodgeIcon,
    href: '/games/dodge-game',
    isNew: true,
    accentColor: 'cyan',
  },
  {
    id: 'memory-game',
    title: 'Memory Game',
    description: 'Cocokkan pasangan kartu dengan ingatan terbaik!',
    Icon: MemoryIcon,
    href: '/games/memory-game',
    isNew: true,
    accentColor: 'magenta',
  },
  {
    id: 'quiz-game',
    title: 'Quiz Game',
    description: 'Jawab pertanyaan dan uji pengetahuanmu!',
    Icon: QuizIcon,
    href: '/games/quiz-game',
    isNew: true,
    accentColor: 'lime',
  },
];

export default function Home() {
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ totalGamesPlayed: 0, totalScore: 0, powerupsCollected: 0 });
  const [achievementCount, setAchievementCount] = useState({ unlocked: 0, total: 0 });

  useEffect(() => {
    // Load high scores for each game
    const scores: Record<string, number> = {};
    GAMES.forEach((game) => {
      scores[game.id] = getHighScore(game.id);
    });
    setHighScores(scores);

    // Load stats
    setStats(getStats());

    // Load achievement count
    const achievements = getAchievements();
    setAchievementCount({
      unlocked: achievements.filter((a) => a.unlockedAt).length,
      total: achievements.length,
    });
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogo}>
            <GamepadIcon size={64} className={styles.heroIcon} />
          </div>
          <h1 className={styles.heroTitle}>
            <span className="neon-text cyan">NEON</span>
            <span className="neon-text magenta">ARCADE</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Platform gaming dengan gaya cyberpunk! Mainkan game-game seru dan raih skor tertinggi.
          </p>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statItem}>
              <GamepadIcon size={20} className={styles.statIcon} />
              <span className={styles.statValue}>{stats.totalGamesPlayed}</span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
            <div className={styles.statItem}>
              <AchievementIcon size={20} className={styles.statIcon} />
              <span className={styles.statValue}>{achievementCount.unlocked}/{achievementCount.total}</span>
              <span className={styles.statLabel}>Achievements</span>
            </div>
            <div className={styles.statItem}>
              <TrophyIcon size={20} className={styles.statIcon} />
              <span className={styles.statValue}>{GAMES.length}</span>
              <span className={styles.statLabel}>Games Available</span>
            </div>
          </div>
        </div>

        {/* Floating Decorations */}
        <div className={styles.floatingIcons}>
          <GamepadIcon size={32} className={`${styles.floatIcon} ${styles.floatIcon1}`} />
          <TrophyIcon size={28} className={`${styles.floatIcon} ${styles.floatIcon2}`} />
          <AchievementIcon size={26} className={`${styles.floatIcon} ${styles.floatIcon3}`} />
          <SnakeIcon size={30} className={`${styles.floatIcon} ${styles.floatIcon4}`} />
        </div>
      </section>

      {/* Games Section */}
      <section className={styles.gamesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            <GamepadIcon size={28} className={styles.sectionIcon} />
            Choose Your Game
          </h2>

          <div className="game-grid">
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                description={game.description}
                Icon={game.Icon}
                href={game.href}
                highScore={highScores[game.id]}
                isNew={game.isNew}
                isPopular={game.isPopular}
                accentColor={game.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            <AchievementIcon size={28} className={styles.sectionIcon} />
            Platform Features
          </h2>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <Trophy className={styles.featureIcon} />
              <h3>Local Leaderboard</h3>
              <p>Simpan dan lacak skor tertinggi Anda</p>
            </div>
            <div className={styles.featureCard}>
              <BellAlertIcon className={styles.featureIcon} />
              <h3>Achievements</h3>
              <p>Unlock badge dan pencapaian</p>
            </div>
            <div className={styles.featureCard}>
              <MoonIcon className={styles.featureIcon} />
              <h3>Dark/Light Mode</h3>
              <p>Pilih tema sesuai preferensi</p>
            </div>
            <div className={styles.featureCard}>
              <DevicePhoneMobileIcon className={styles.featureIcon} />
              <h3>Mobile Ready</h3>
              <p>Main di laptop atau handphone</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
