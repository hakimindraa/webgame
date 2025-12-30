// Storage utility functions for Neon Arcade

const STORAGE_KEYS = {
    LEADERBOARD: 'neonArcade_leaderboard',
    ACHIEVEMENTS: 'neonArcade_achievements',
    STATS: 'neonArcade_stats',
    THEME: 'neonArcade_theme',
};

// ============ LEADERBOARD ============

export interface LeaderboardEntry {
    id: string;
    game: string;
    score: number;
    level: number;
    difficulty: string;
    date: string;
}

export function saveScore(
    game: string,
    score: number,
    level: number = 1,
    difficulty: string = 'medium'
): LeaderboardEntry {
    const leaderboard = getLeaderboard();

    const entry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        game,
        score,
        level,
        difficulty,
        date: new Date().toISOString(),
    };

    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top 100 entries
    const trimmed = leaderboard.slice(0, 100);

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(trimmed));
    }

    // Update play stats
    incrementStat('totalGamesPlayed');

    return entry;
}

export function getLeaderboard(game?: string): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
        const leaderboard: LeaderboardEntry[] = data ? JSON.parse(data) : [];

        if (game) {
            return leaderboard.filter((entry) => entry.game === game);
        }

        return leaderboard;
    } catch {
        return [];
    }
}

export function getHighScore(game: string): number {
    const leaderboard = getLeaderboard(game);
    return leaderboard.length > 0 ? leaderboard[0].score : 0;
}

export function clearLeaderboard(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
    }
}

// ============ ACHIEVEMENTS ============

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlockedAt'>[] = [
    { id: 'first_game', name: 'First Steps', description: 'Play your first game', icon: '🎮' },
    { id: 'snake_beginner', name: 'Snake Beginner', description: 'Play Snake for the first time', icon: '🐍' },
    { id: 'block_beginner', name: 'Block Beginner', description: 'Play Block Blast for the first time', icon: '🧱' },
    { id: 'flappy_beginner', name: 'Bird Watcher', description: 'Play Flappy Bird for the first time', icon: '🐦' },
    { id: 'dodge_beginner', name: 'Dodger', description: 'Play Dodge Game for the first time', icon: '🎯' },
    { id: 'memory_beginner', name: 'Memory Master', description: 'Play Memory Game for the first time', icon: '🧠' },
    { id: 'quiz_beginner', name: 'Quiz Starter', description: 'Play Quiz Game for the first time', icon: '❓' },
    { id: 'score_100', name: 'Getting Started', description: 'Score 100 points in any game', icon: '💯' },
    { id: 'score_500', name: 'On Fire', description: 'Score 500 points in any game', icon: '🔥' },
    { id: 'score_1000', name: 'Pro Gamer', description: 'Score 1000 points in any game', icon: '👑' },
    { id: 'night_owl', name: 'Night Owl', description: 'Enable dark mode', icon: '🌙' },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Win on Hard difficulty', icon: '⚡' },
    { id: 'play_10', name: 'Dedicated Player', description: 'Play 10 games', icon: '🏅' },
    { id: 'play_50', name: 'Arcade Regular', description: 'Play 50 games', icon: '🎖️' },
    { id: 'powerup_master', name: 'Power-up Master', description: 'Collect 10 power-ups', icon: '⭐' },
    { id: 'combo_master', name: 'Combo Master', description: 'Get a 3x combo in Block Blast', icon: '💥' },
];

export function getAchievements(): Achievement[] {
    if (typeof window === 'undefined') return ACHIEVEMENTS_LIST.map(a => ({ ...a }));

    try {
        const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        const unlocked: Record<string, string> = data ? JSON.parse(data) : {};

        return ACHIEVEMENTS_LIST.map((achievement) => ({
            ...achievement,
            unlockedAt: unlocked[achievement.id],
        }));
    } catch {
        return ACHIEVEMENTS_LIST.map(a => ({ ...a }));
    }
}

export function unlockAchievement(id: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        const unlocked: Record<string, string> = data ? JSON.parse(data) : {};

        // Already unlocked
        if (unlocked[id]) return false;

        unlocked[id] = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));

        return true;
    } catch {
        return false;
    }
}

export function isAchievementUnlocked(id: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        const unlocked: Record<string, string> = data ? JSON.parse(data) : {};
        return !!unlocked[id];
    } catch {
        return false;
    }
}

export function getUnlockedCount(): number {
    const achievements = getAchievements();
    return achievements.filter((a) => a.unlockedAt).length;
}

// ============ STATS ============

interface Stats {
    totalGamesPlayed: number;
    totalScore: number;
    powerupsCollected: number;
}

export function getStats(): Stats {
    if (typeof window === 'undefined') {
        return { totalGamesPlayed: 0, totalScore: 0, powerupsCollected: 0 };
    }

    try {
        const data = localStorage.getItem(STORAGE_KEYS.STATS);
        return data
            ? JSON.parse(data)
            : { totalGamesPlayed: 0, totalScore: 0, powerupsCollected: 0 };
    } catch {
        return { totalGamesPlayed: 0, totalScore: 0, powerupsCollected: 0 };
    }
}

export function incrementStat(key: keyof Stats, amount: number = 1): void {
    if (typeof window === 'undefined') return;

    const stats = getStats();
    stats[key] += amount;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));

    // Check for achievements
    if (key === 'totalGamesPlayed') {
        if (stats.totalGamesPlayed === 1) unlockAchievement('first_game');
        if (stats.totalGamesPlayed >= 10) unlockAchievement('play_10');
        if (stats.totalGamesPlayed >= 50) unlockAchievement('play_50');
    }

    if (key === 'powerupsCollected' && stats.powerupsCollected >= 10) {
        unlockAchievement('powerup_master');
    }
}

export function checkScoreAchievements(score: number, difficulty: string): void {
    if (score >= 100) unlockAchievement('score_100');
    if (score >= 500) unlockAchievement('score_500');
    if (score >= 1000) unlockAchievement('score_1000');
    if (difficulty === 'hard' && score > 0) unlockAchievement('speed_demon');
}
