'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { saveScore, getHighScore, unlockAchievement, checkScoreAchievements } from '../../lib/storage';
import styles from './page.module.css';

// Block shapes definitions
const SHAPES = [
    // Single
    { id: 'single', blocks: [[0, 0]], color: '#00ffff' },
    // Horizontal lines
    { id: 'h2', blocks: [[0, 0], [1, 0]], color: '#39ff14' },
    { id: 'h3', blocks: [[0, 0], [1, 0], [2, 0]], color: '#ff00ff' },
    { id: 'h4', blocks: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#ff6b35' },
    // Vertical lines
    { id: 'v2', blocks: [[0, 0], [0, 1]], color: '#00bfff' },
    { id: 'v3', blocks: [[0, 0], [0, 1], [0, 2]], color: '#ffff00' },
    { id: 'v4', blocks: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#bf00ff' },
    // L shapes
    { id: 'l1', blocks: [[0, 0], [0, 1], [1, 1]], color: '#ff1493' },
    { id: 'l2', blocks: [[1, 0], [0, 1], [1, 1]], color: '#00ffff' },
    { id: 'l3', blocks: [[0, 0], [1, 0], [0, 1]], color: '#39ff14' },
    { id: 'l4', blocks: [[0, 0], [1, 0], [1, 1]], color: '#ff00ff' },
    // Big L shapes
    { id: 'bl1', blocks: [[0, 0], [0, 1], [0, 2], [1, 2]], color: '#ff6b35' },
    { id: 'bl2', blocks: [[0, 0], [1, 0], [2, 0], [0, 1]], color: '#00bfff' },
    { id: 'bl3', blocks: [[0, 0], [1, 0], [1, 1], [1, 2]], color: '#ffff00' },
    { id: 'bl4', blocks: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#bf00ff' },
    // Squares
    { id: 'sq2', blocks: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#ff1493' },
    { id: 'sq3', blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], color: '#00ffff' },
    // T shapes
    { id: 't1', blocks: [[0, 0], [1, 0], [2, 0], [1, 1]], color: '#39ff14' },
    { id: 't2', blocks: [[1, 0], [0, 1], [1, 1], [1, 2]], color: '#ff00ff' },
];

const GRID_SIZE = 8;
const CELL_SIZE = 40;

type Cell = {
    filled: boolean;
    color: string;
    clearing: boolean;
};

type Shape = {
    id: string;
    blocks: number[][];
    color: string;
};

export default function BlockBlastGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [currentShapes, setCurrentShapes] = useState<(Shape | null)[]>([]);
    const [selectedShape, setSelectedShape] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
    const [isPlacementValid, setIsPlacementValid] = useState(false);

    // Initialize game
    useEffect(() => {
        setHighScore(getHighScore('block-blast'));
        startNewGame();
    }, []);

    // Draw grid
    useEffect(() => {
        draw();
    }, [grid, hoverPosition, selectedShape, isPlacementValid]);

    const startNewGame = () => {
        // Initialize empty grid
        const newGrid: Cell[][] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                row.push({ filled: false, color: '', clearing: false });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
        setScore(0);
        setCombo(0);
        setGameOver(false);
        setSelectedShape(null);
        generateNewShapes();
        unlockAchievement('block_beginner');
    };

    const generateNewShapes = () => {
        const newShapes: Shape[] = [];
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * SHAPES.length);
            newShapes.push({ ...SHAPES[randomIndex] });
        }
        setCurrentShapes(newShapes);
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = canvas.width / GRID_SIZE;

        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = grid[y]?.[x];
                const px = x * cellSize;
                const py = y * cellSize;

                if (cell?.filled) {
                    // Draw filled cell
                    ctx.fillStyle = cell.color;
                    ctx.shadowColor = cell.color;
                    ctx.shadowBlur = cell.clearing ? 20 : 8;
                    ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                    ctx.shadowBlur = 0;
                } else {
                    // Draw empty cell
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                    ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                }

                // Draw grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, cellSize, cellSize);
            }
        }

        // Draw hover preview
        if (hoverPosition && selectedShape !== null && currentShapes[selectedShape]) {
            const shape = currentShapes[selectedShape];
            if (shape) {
                shape.blocks.forEach(([bx, by]) => {
                    const gx = hoverPosition.x + bx;
                    const gy = hoverPosition.y + by;
                    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                        const px = gx * cellSize;
                        const py = gy * cellSize;
                        ctx.fillStyle = isPlacementValid
                            ? `${shape.color}80`
                            : 'rgba(255, 0, 0, 0.3)';
                        ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                    }
                });
            }
        }
    }, [grid, hoverPosition, selectedShape, currentShapes, isPlacementValid]);

    const canPlaceShape = (shape: Shape, gridX: number, gridY: number, currentGrid: Cell[][]): boolean => {
        for (const [bx, by] of shape.blocks) {
            const gx = gridX + bx;
            const gy = gridY + by;
            if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) {
                return false;
            }
            if (currentGrid[gy]?.[gx]?.filled) {
                return false;
            }
        }
        return true;
    };

    const canPlaceAnyShape = (shapes: (Shape | null)[], currentGrid: Cell[][]): boolean => {
        for (const shape of shapes) {
            if (!shape) continue;
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (canPlaceShape(shape, x, y, currentGrid)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const placeShape = (shapeIndex: number, gridX: number, gridY: number) => {
        const shape = currentShapes[shapeIndex];
        if (!shape) return;

        if (!canPlaceShape(shape, gridX, gridY, grid)) return;

        // Place the shape
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        for (const [bx, by] of shape.blocks) {
            const gx = gridX + bx;
            const gy = gridY + by;
            newGrid[gy][gx] = { filled: true, color: shape.color, clearing: false };
        }

        // Check for completed lines
        const { clearedGrid, linesCleared } = clearLines(newGrid);

        // Calculate score
        let points = shape.blocks.length * 10;
        if (linesCleared > 0) {
            points += linesCleared * 100 * (combo + 1);
            setCombo(prev => prev + 1);
        } else {
            setCombo(0);
        }

        const newScore = score + points;
        setScore(newScore);
        setGrid(clearedGrid);

        // Remove used shape
        const newShapes = [...currentShapes];
        newShapes[shapeIndex] = null;

        // Check if all shapes are used
        if (newShapes.every(s => s === null)) {
            generateNewShapes();
        } else {
            setCurrentShapes(newShapes);

            // Check if game over
            if (!canPlaceAnyShape(newShapes, clearedGrid)) {
                handleGameOver(newScore);
            }
        }

        setSelectedShape(null);
        setHoverPosition(null);
    };

    const clearLines = (currentGrid: Cell[][]): { clearedGrid: Cell[][], linesCleared: number } => {
        const clearedGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
        let linesCleared = 0;

        // Check rows
        const rowsToClear: number[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            if (clearedGrid[y].every(cell => cell.filled)) {
                rowsToClear.push(y);
            }
        }

        // Check columns
        const columnsToClear: number[] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            let allFilled = true;
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!clearedGrid[y][x].filled) {
                    allFilled = false;
                    break;
                }
            }
            if (allFilled) {
                columnsToClear.push(x);
            }
        }

        // Clear rows
        for (const y of rowsToClear) {
            for (let x = 0; x < GRID_SIZE; x++) {
                clearedGrid[y][x] = { filled: false, color: '', clearing: false };
            }
            linesCleared++;
        }

        // Clear columns
        for (const x of columnsToClear) {
            for (let y = 0; y < GRID_SIZE; y++) {
                clearedGrid[y][x] = { filled: false, color: '', clearing: false };
            }
            linesCleared++;
        }

        return { clearedGrid, linesCleared };
    };

    const handleGameOver = (finalScore: number) => {
        setGameOver(true);
        const currentHighScore = getHighScore('block-blast');
        const isNewHigh = finalScore > currentHighScore;

        saveScore('block-blast', finalScore, Math.floor(finalScore / 500) + 1, 'normal');
        checkScoreAchievements(finalScore, 'normal');
        setHighScore(getHighScore('block-blast'));
    };

    // Canvas mouse/touch handlers
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (gameOver || selectedShape === null) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
            clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const cellSize = canvas.width / GRID_SIZE;
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        if (isPlacementValid) {
            placeShape(selectedShape, gridX, gridY);
        }
    };

    const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (gameOver || selectedShape === null) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            if (e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const cellSize = canvas.width / GRID_SIZE;
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        setHoverPosition({ x: gridX, y: gridY });

        const shape = currentShapes[selectedShape];
        if (shape) {
            setIsPlacementValid(canPlaceShape(shape, gridX, gridY, grid));
        }
    };

    const handleCanvasLeave = () => {
        setHoverPosition(null);
        setIsPlacementValid(false);
    };

    // Shape selection
    const selectShape = (index: number) => {
        if (currentShapes[index] === null) return;
        setSelectedShape(index === selectedShape ? null : index);
    };

    // Draw shape preview
    const renderShapePreview = (shape: Shape | null, index: number) => {
        if (!shape) return <div className={styles.shapeSlotEmpty}>✓</div>;

        const minX = Math.min(...shape.blocks.map(b => b[0]));
        const maxX = Math.max(...shape.blocks.map(b => b[0]));
        const minY = Math.min(...shape.blocks.map(b => b[1]));
        const maxY = Math.max(...shape.blocks.map(b => b[1]));
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        return (
            <div
                className={`${styles.shapePreview} ${selectedShape === index ? styles.selected : ''}`}
                onClick={() => selectShape(index)}
                style={{
                    gridTemplateColumns: `repeat(${width}, 1fr)`,
                    gridTemplateRows: `repeat(${height}, 1fr)`,
                }}
            >
                {Array.from({ length: height }).map((_, y) =>
                    Array.from({ length: width }).map((_, x) => {
                        const isFilled = shape.blocks.some(
                            ([bx, by]) => bx - minX === x && by - minY === y
                        );
                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`${styles.previewCell} ${isFilled ? styles.filled : ''}`}
                                style={{
                                    backgroundColor: isFilled ? shape.color : 'transparent',
                                    boxShadow: isFilled ? `0 0 10px ${shape.color}` : 'none',
                                }}
                            />
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <Link href="/" className={styles.backButton}>
                        ← Back
                    </Link>
                    <h1 className={styles.title}>
                        <span className="neon-text cyan">BLOCK</span>
                        <span className="neon-text magenta">BLAST</span>
                    </h1>
                </header>

                {/* Score Panel */}
                <div className={styles.scorePanel}>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>SCORE</span>
                        <span className={styles.scoreValue}>{score}</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>HIGH</span>
                        <span className={styles.scoreValue}>{highScore}</span>
                    </div>
                    {combo > 0 && (
                        <div className={styles.scoreItem}>
                            <span className={styles.scoreLabel}>COMBO</span>
                            <span className={`${styles.scoreValue} ${styles.comboValue}`}>x{combo + 1}</span>
                        </div>
                    )}
                </div>

                {/* Game Canvas */}
                <div className={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        width={GRID_SIZE * CELL_SIZE}
                        height={GRID_SIZE * CELL_SIZE}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMove}
                        onMouseLeave={handleCanvasLeave}
                        onTouchStart={handleCanvasMove}
                        onTouchMove={handleCanvasMove}
                        onTouchEnd={handleCanvasClick}
                    />

                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                                <h2 className={`${styles.overlayTitle} neon-text magenta`}>💥 GAME OVER</h2>
                                <div className={styles.finalScore}>
                                    <span className={styles.finalScoreLabel}>Skor Akhir</span>
                                    <span className={styles.finalScoreValue}>{score}</span>
                                </div>
                                <button className={`${styles.btn} ${styles.btnRestart}`} onClick={startNewGame}>
                                    🔄 MAIN LAGI
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shape Selection */}
                <div className={styles.shapesContainer}>
                    <p className={styles.shapesHint}>
                        {selectedShape !== null ? '👆 Tap grid untuk menempatkan' : '👇 Pilih blok untuk dimainkan'}
                    </p>
                    <div className={styles.shapesRow}>
                        {currentShapes.map((shape, index) => (
                            <div key={index} className={styles.shapeSlot}>
                                {renderShapePreview(shape, index)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className={styles.instructions}>
                    <p>🧱 Tempatkan blok untuk mengisi baris/kolom</p>
                    <p>💥 Baris/kolom penuh akan terhapus</p>
                    <p>🎯 Combo = lebih banyak poin!</p>
                </div>
            </div>
        </div>
    );
}
