import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <span className={styles.logo}>🎮</span>
                        <span className={styles.brandText}>
                            <span className="neon-text cyan">NEON</span>
                            <span className="neon-text magenta">ARCADE</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className={styles.links}>
                        <Link href="/" className={styles.link}>Home</Link>
                        <Link href="/leaderboard" className={styles.link}>Leaderboard</Link>
                        <Link href="/achievements" className={styles.link}>Achievements</Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className={styles.copyright}>
                    <p>© {currentYear} Neon Arcade. Made with 💜 for gamers.</p>
                </div>
            </div>
        </footer>
    );
}
