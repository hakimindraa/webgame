'use client';

import { useState, useEffect } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { isMusicEnabled, isSFXEnabled, toggleMusic, toggleSFX, playSFX } from '../lib/sound';
import styles from './SoundToggle.module.css';

export default function SoundToggle() {
    const [musicOn, setMusicOn] = useState(true);
    const [sfxOn, setSfxOn] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        setMusicOn(isMusicEnabled());
        setSfxOn(isSFXEnabled());
    }, []);

    const handleToggleMusic = () => {
        const newState = toggleMusic();
        setMusicOn(newState);
        playSFX('click');
    };

    const handleToggleSFX = () => {
        const newState = toggleSFX();
        setSfxOn(newState);
        if (newState) {
            playSFX('click');
        }
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.mainButton}
                onClick={() => setShowMenu(!showMenu)}
                title="Sound Settings"
            >
                {sfxOn || musicOn ? (
                    <SpeakerWaveIcon className={styles.soundIcon} />
                ) : (
                    <SpeakerXMarkIcon className={styles.soundIconMuted} />
                )}
            </button>

            {showMenu && (
                <div className={styles.menu}>
                    <div className={styles.menuItem}>
                        <span className={styles.menuLabel}>
                            <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                            Music
                        </span>
                        <button
                            className={`${styles.toggleBtn} ${musicOn ? styles.on : styles.off}`}
                            onClick={handleToggleMusic}
                        >
                            {musicOn ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <div className={styles.menuItem}>
                        <span className={styles.menuLabel}>
                            <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            SFX
                        </span>
                        <button
                            className={`${styles.toggleBtn} ${sfxOn ? styles.on : styles.off}`}
                            onClick={handleToggleSFX}
                        >
                            {sfxOn ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
