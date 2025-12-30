// Custom Game Icons - Neon Arcade Style
// These are custom SVG icons designed for each game

import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
}

// Snake Icon - Stylized neon snake
export const SnakeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M4 12C4 8 6 6 10 6C14 6 14 10 18 10C22 10 22 6 22 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 12C4 16 6 18 10 18C14 18 14 14 18 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="3" cy="12" r="2" fill="currentColor" />
        <circle cx="19" cy="14" r="1.5" fill="currentColor" />
    </svg>
);

// Block Blast Icon - Grid blocks
export const BlockBlastIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
    </svg>
);

// Flappy Bird Icon - Stylized bird
export const FlappyBirdIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <ellipse cx="10" cy="12" rx="7" ry="6" stroke="currentColor" strokeWidth="2" />
        <path d="M17 12L21 10L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="10" r="1.5" fill="currentColor" />
        <path d="M4 15C6 17 9 18 12 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 8L2 5M5 12L1 12M5 16L2 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Dodge Game Icon - Target/Crosshair
export const DodgeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Memory Game Icon - Brain/Puzzle
export const MemoryIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 4C8 4 5 7 5 11C5 13 6 15 7 16L7 20C7 21 8 22 9 22H15C16 22 17 21 17 20L17 16C18 15 19 13 19 11C19 7 16 4 12 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M9 22V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 22V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 8C9 7 10 7 12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Quiz Game Icon - Question mark
export const QuizIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
            d="M9 9C9 7.5 10.5 6 12 6C13.5 6 15 7 15 9C15 11 12 11 12 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
);

// Home Icon
export const HomeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Trophy Icon
export const TrophyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M6 4H18V8C18 12 15 14 12 14C9 14 6 12 6 8V4Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path d="M6 6H4C3 6 2 7 2 8C2 10 4 11 6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 6H20C21 6 22 7 22 8C22 10 20 11 18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 14V17" stroke="currentColor" strokeWidth="2" />
        <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 17H15V20H9V17Z" stroke="currentColor" strokeWidth="2" />
    </svg>
);

// Achievement/Star Icon
export const AchievementIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Gamepad Icon
export const GamepadIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="10" r="1" fill="currentColor" />
        <circle cx="17" cy="14" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
);
