'use client';

import { useState } from 'react';
import styles from './Tutorial.module.css';

interface TutorialStep {
    title: string;
    description: string;
    icon: string;
}

interface TutorialProps {
    gameName: string;
    steps: TutorialStep[];
    tips?: string[];
    controls?: {
        desktop: string[];
        mobile: string[];
    };
    onClose: () => void;
}

export default function Tutorial({ gameName, steps, tips, controls, onClose }: TutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <h2 className={styles.title}>
                    📖 Cara Main: <span className="neon-text cyan">{gameName}</span>
                </h2>

                {/* Steps */}
                <div className={styles.stepsContainer}>
                    <div className={styles.stepIndicators}>
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`${styles.stepDot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
                                onClick={() => setCurrentStep(index)}
                            />
                        ))}
                    </div>

                    <div className={styles.stepContent}>
                        <div className={styles.stepIcon}>{steps[currentStep].icon}</div>
                        <h3 className={styles.stepTitle}>{steps[currentStep].title}</h3>
                        <p className={styles.stepDescription}>{steps[currentStep].description}</p>
                    </div>

                    <div className={styles.stepNavigation}>
                        <button
                            className={`${styles.navBtn} ${currentStep === 0 ? styles.disabled : ''}`}
                            onClick={prevStep}
                            disabled={currentStep === 0}
                        >
                            ← Sebelumnya
                        </button>
                        <span className={styles.stepCounter}>{currentStep + 1} / {steps.length}</span>
                        <button
                            className={`${styles.navBtn} ${currentStep === steps.length - 1 ? styles.disabled : ''}`}
                            onClick={nextStep}
                            disabled={currentStep === steps.length - 1}
                        >
                            Selanjutnya →
                        </button>
                    </div>
                </div>

                {/* Controls */}
                {controls && (
                    <div className={styles.controlsSection}>
                        <h4 className={styles.sectionTitle}>🎮 Kontrol</h4>
                        <div className={styles.controlsGrid}>
                            <div className={styles.controlGroup}>
                                <span className={styles.controlLabel}>💻 Desktop:</span>
                                <ul className={styles.controlList}>
                                    {controls.desktop.map((ctrl, i) => (
                                        <li key={i}>{ctrl}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className={styles.controlGroup}>
                                <span className={styles.controlLabel}>📱 Mobile:</span>
                                <ul className={styles.controlList}>
                                    {controls.mobile.map((ctrl, i) => (
                                        <li key={i}>{ctrl}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tips */}
                {tips && tips.length > 0 && (
                    <div className={styles.tipsSection}>
                        <h4 className={styles.sectionTitle}>💡 Tips & Tricks</h4>
                        <ul className={styles.tipsList}>
                            {tips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <button className={styles.startBtn} onClick={onClose}>
                    🚀 MULAI MAIN!
                </button>
            </div>
        </div>
    );
}

// Tutorial data for each game
export const GAME_TUTORIALS = {
    snake: {
        gameName: 'Neon Snake',
        steps: [
            { icon: '🐍', title: 'Kontrol Ular', description: 'Arahkan ular menggunakan Arrow Keys atau WASD. Ular akan terus bergerak ke arah yang dituju.' },
            { icon: '🍎', title: 'Makan Makanan', description: 'Makan makanan (kotak hijau) untuk menambah panjang ular dan mendapat poin.' },
            { icon: '⚡', title: 'Power-ups', description: 'Ambil power-ups untuk bonus: Speed Boost, Shield, atau Double Points!' },
            { icon: '🚧', title: 'Hindari Rintangan', description: 'Jangan tabrak dinding, tubuh sendiri, atau rintangan (kotak merah).' },
        ],
        tips: [
            'Pilih difficulty sesuai kemampuan - Easy lebih lambat',
            'Power-up Shield melindungi dari 1x tabrakan',
            'Semakin panjang ular, semakin sulit bermanuver',
        ],
        controls: {
            desktop: ['Arrow Keys / WASD = Gerak', 'P / Escape = Pause', 'Space = Start'],
            mobile: ['Swipe = Gerak', 'D-Pad = Kontrol alternatif'],
        },
    },
    'block-blast': {
        gameName: 'Block Blast',
        steps: [
            { icon: '🧱', title: 'Pilih Blok', description: 'Pilih salah satu dari 3 blok di bawah layar dengan mengkliknya.' },
            { icon: '📍', title: 'Tempatkan Blok', description: 'Klik pada grid untuk menempatkan blok. Preview akan muncul saat hover.' },
            { icon: '💥', title: 'Hapus Baris/Kolom', description: 'Jika baris atau kolom penuh, akan terhapus dan memberi poin!' },
            { icon: '🔥', title: 'Combo', description: 'Hapus beberapa baris sekaligus untuk bonus combo multiplier!' },
        ],
        tips: [
            'Selalu sisakan ruang untuk blok besar',
            'Fokus mengisi dari satu sisi grid',
            'Combo = poin lebih banyak!',
        ],
        controls: {
            desktop: ['Klik = Pilih blok & tempatkan'],
            mobile: ['Tap = Pilih blok & tempatkan'],
        },
    },
    'flappy-bird': {
        gameName: 'Flappy Bird',
        steps: [
            { icon: '🐦', title: 'Terbang', description: 'Klik atau tap layar untuk membuat burung mengepakkan sayap dan terbang ke atas.' },
            { icon: '⬇️', title: 'Gravitasi', description: 'Burung akan terus jatuh karena gravitasi. Terus tap untuk tetap terbang!' },
            { icon: '🚧', title: 'Hindari Pipa', description: 'Lewati celah antar pipa hijau. Jangan tabrak pipa atau lantai/langit-langit!' },
            { icon: '🏆', title: 'Skor', description: 'Setiap pipa yang berhasil dilewati menambah 1 poin.' },
        ],
        tips: [
            'Tap dengan ritme yang konsisten',
            'Jangan terlalu tinggi atau rendah',
            'Fokus pada celah pipa berikutnya',
        ],
        controls: {
            desktop: ['Space / Arrow Up / Klik = Terbang'],
            mobile: ['Tap layar = Terbang'],
        },
    },
    'dodge-game': {
        gameName: 'Dodge Game',
        steps: [
            { icon: '🎯', title: 'Bergerak', description: 'Gerakkan karakter (lingkaran biru) untuk menghindari rintangan.' },
            { icon: '⬇️', title: 'Rintangan', description: 'Blok warna-warni akan jatuh dari atas. Hindari semuanya!' },
            { icon: '⏱️', title: 'Bertahan', description: 'Semakin lama bertahan, semakin tinggi skor. Kecepatan akan meningkat!' },
            { icon: '💥', title: 'Game Over', description: 'Game berakhir jika tertabrak rintangan.' },
        ],
        tips: [
            'Tetap di tengah untuk opsi bergerak ke kiri/kanan',
            'Perhatikan beberapa rintangan sekaligus',
            'Gerakan kecil lebih aman dari gerakan besar',
        ],
        controls: {
            desktop: ['Arrow Keys / WASD = Gerak'],
            mobile: ['Touch & drag = Ikuti jari'],
        },
    },
    'memory-game': {
        gameName: 'Memory Game',
        steps: [
            { icon: '🃏', title: 'Buka Kartu', description: 'Klik kartu untuk membaliknya dan melihat emoji di baliknya.' },
            { icon: '🔍', title: 'Ingat Posisi', description: 'Ingat posisi setiap emoji yang sudah dibuka.' },
            { icon: '✨', title: 'Cocokkan', description: 'Buka 2 kartu dengan emoji yang sama untuk mencocokkannya.' },
            { icon: '🏆', title: 'Selesaikan', description: 'Cocokkan semua pasangan dengan moves dan waktu seminimal mungkin!' },
        ],
        tips: [
            'Buka kartu secara sistematis (baris per baris)',
            'Fokus mengingat 2-3 posisi sekaligus',
            'Jangan terburu-buru - ingatan lebih penting dari kecepatan',
        ],
        controls: {
            desktop: ['Klik = Buka kartu'],
            mobile: ['Tap = Buka kartu'],
        },
    },
    'quiz-game': {
        gameName: 'Quiz Game',
        steps: [
            { icon: '❓', title: 'Baca Pertanyaan', description: 'Baca pertanyaan dengan teliti. Ada berbagai kategori: Math, Science, dll.' },
            { icon: '🅰️', title: 'Pilih Jawaban', description: 'Pilih salah satu dari 4 opsi jawaban yang tersedia.' },
            { icon: '⏱️', title: 'Waktu', description: 'Setiap pertanyaan punya waktu 15 detik. Jawab cepat = bonus poin!' },
            { icon: '📊', title: 'Skor', description: 'Jawaban benar = 10 poin + bonus waktu tersisa.' },
        ],
        tips: [
            'Jawab cepat untuk bonus waktu',
            'Tidak yakin? Eliminasi jawaban yang pasti salah',
            'Perhatikan kategori untuk konteks pertanyaan',
        ],
        controls: {
            desktop: ['Klik = Pilih jawaban'],
            mobile: ['Tap = Pilih jawaban'],
        },
    },
};
