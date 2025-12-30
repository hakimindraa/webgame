'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import SoundToggle from './SoundToggle';
import { HomeIcon, SnakeIcon, TrophyIcon, AchievementIcon, GamepadIcon } from './GameIcons';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/', label: 'Home', Icon: HomeIcon },
    { href: '/games/snake', label: 'Snake', Icon: SnakeIcon },
    { href: '/leaderboard', label: 'Leaderboard', Icon: TrophyIcon },
    { href: '/achievements', label: 'Achievements', Icon: AchievementIcon },
];

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>
                        <GamepadIcon size={28} className={styles.logoSvg} />
                    </span>
                    <span className={styles.logoText}>
                        <span className="neon-text cyan">NEON</span>
                        <span className="neon-text magenta">ARCADE</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className={styles.navLinks}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>
                                <link.Icon size={18} />
                            </span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <SoundToggle />
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className={styles.themeIcon} />
                        ) : (
                            <MoonIcon className={styles.themeIcon} />
                        )}
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        className={styles.menuButton}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`${styles.menuIcon} ${isMenuOpen ? styles.open : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span className={styles.navIcon}>
                                <link.Icon size={20} />
                            </span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
