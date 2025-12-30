// Sound Manager for Neon Arcade
// Handles background music and sound effects

const STORAGE_KEY = 'neonArcade_sound';

interface SoundSettings {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
}

class SoundManager {
    private audioContext: AudioContext | null = null;
    private settings: SoundSettings = {
        musicEnabled: true,
        sfxEnabled: true,
        musicVolume: 0.3,
        sfxVolume: 0.5,
    };
    private bgMusic: AudioBufferSourceNode | null = null;
    private bgMusicGain: GainNode | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadSettings();
        }
    }

    private loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load sound settings:', e);
        }
    }

    private saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save sound settings:', e);
        }
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            } catch (e) {
                console.error('Failed to create AudioContext:', e);
                return null;
            }
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        return this.audioContext;
    }

    // Play synthesized sound effects
    playSFX(type: 'click' | 'success' | 'error' | 'jump' | 'score' | 'gameover' | 'flip' | 'match' | 'correct' | 'wrong') {
        if (!this.settings.sfxEnabled) return;

        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        const volume = this.settings.sfxVolume;

        switch (type) {
            case 'click':
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                gain.gain.setValueAtTime(volume * 0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'success':
            case 'correct':
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.setValueAtTime(volume * 0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'error':
            case 'wrong':
            case 'gameover':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
                gain.gain.setValueAtTime(volume * 0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'jump':
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(volume * 0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'score':
            case 'match':
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.05);
                gain.gain.setValueAtTime(volume * 0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'flip':
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
                gain.gain.setValueAtTime(volume * 0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
        }
    }

    // Play background music (synthesized ambient)
    playBGMusic(game: 'menu' | 'snake' | 'block-blast' | 'flappy-bird' | 'dodge-game' | 'memory-game' | 'quiz-game') {
        if (!this.settings.musicEnabled) return;

        this.stopBGMusic();

        const ctx = this.getContext();
        if (!ctx) return;

        // Create a simple ambient drone for background
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        this.bgMusicGain = gain;

        // Different frequencies based on game theme
        const frequencies: Record<string, [number, number]> = {
            'menu': [110, 165],
            'snake': [130, 195],
            'block-blast': [146, 220],
            'flappy-bird': [164, 247],
            'dodge-game': [174, 261],
            'memory-game': [196, 294],
            'quiz-game': [220, 330],
        };

        const [f1, f2] = frequencies[game] || frequencies['menu'];

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(f1, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f2, ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(this.settings.musicVolume * 0.1, ctx.currentTime);

        osc1.start();
        osc2.start();

        // Store reference to stop later (simplified - in real app would need proper tracking)
    }

    stopBGMusic() {
        if (this.bgMusicGain) {
            try {
                this.bgMusicGain.gain.setValueAtTime(0, this.audioContext?.currentTime || 0);
            } catch (e) {
                // Ignore errors when stopping
            }
            this.bgMusicGain = null;
        }
    }

    // Settings getters/setters
    get isMusicEnabled(): boolean {
        return this.settings.musicEnabled;
    }

    get isSFXEnabled(): boolean {
        return this.settings.sfxEnabled;
    }

    toggleMusic(): boolean {
        this.settings.musicEnabled = !this.settings.musicEnabled;
        this.saveSettings();
        if (!this.settings.musicEnabled) {
            this.stopBGMusic();
        }
        return this.settings.musicEnabled;
    }

    toggleSFX(): boolean {
        this.settings.sfxEnabled = !this.settings.sfxEnabled;
        this.saveSettings();
        return this.settings.sfxEnabled;
    }

    setMusicVolume(volume: number) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    setSFXVolume(volume: number) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
}

// Singleton instance
export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;

// Convenience functions
export function playSFX(type: Parameters<SoundManager['playSFX']>[0]) {
    soundManager?.playSFX(type);
}

export function playBGMusic(game: Parameters<SoundManager['playBGMusic']>[0]) {
    soundManager?.playBGMusic(game);
}

export function stopBGMusic() {
    soundManager?.stopBGMusic();
}

export function toggleMusic(): boolean {
    return soundManager?.toggleMusic() ?? false;
}

export function toggleSFX(): boolean {
    return soundManager?.toggleSFX() ?? false;
}

export function isMusicEnabled(): boolean {
    return soundManager?.isMusicEnabled ?? true;
}

export function isSFXEnabled(): boolean {
    return soundManager?.isSFXEnabled ?? true;
}
