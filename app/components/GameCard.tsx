import Link from 'next/link';
import { PlayIcon, ArrowRightIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
import styles from './GameCard.module.css';
import React from 'react';

interface GameCardProps {
    title: string;
    description: string;
    Icon: React.FC<{ className?: string; size?: number }>;
    href: string;
    highScore?: number;
    isNew?: boolean;
    isPopular?: boolean;
    accentColor?: string;
}

export default function GameCard({
    title,
    description,
    Icon,
    href,
    highScore,
    isNew,
    isPopular,
    accentColor = 'cyan',
}: GameCardProps) {
    return (
        <Link href={href} className={styles.card} data-accent={accentColor}>
            <div className={styles.iconWrapper}>
                <Icon size={48} className={styles.icon} />
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={styles.badges}>
                        {isNew && (
                            <span className={styles.badgeNew}>
                                <SparklesIcon className={styles.badgeIcon} />
                                NEW
                            </span>
                        )}
                        {isPopular && (
                            <span className={styles.badgeHot}>
                                <FireIcon className={styles.badgeIcon} />
                                HOT
                            </span>
                        )}
                    </div>
                </div>

                <p className={styles.description}>{description}</p>

                {highScore !== undefined && highScore > 0 && (
                    <div className={styles.highScore}>
                        <span className={styles.scoreLabel}>High Score:</span>
                        <span className={styles.scoreValue}>{highScore}</span>
                    </div>
                )}
            </div>

            <div className={styles.playButton}>
                <PlayIcon className={styles.playIcon} />
                <span>PLAY</span>
                <ArrowRightIcon className={styles.arrowIcon} />
            </div>
        </Link>
    );
}
