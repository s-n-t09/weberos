import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Flag, Bomb } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// --- Snake Game ---
const SnakeGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const directionRef = useRef({ dx: 1, dy: 0 });
    const startedRef = useRef(false);
    const snakeRef = useRef([{x: 10, y: 10}, {x: 9, y: 10}]);
    const foodRef = useRef({x: 15, y: 15});
    const intervalRef = useRef<any>(null);

    const handleDir = (x: number, y: number) => {
        if (!startedRef.current) startedRef.current = true;
        const { dx, dy } = directionRef.current;
        if (x !== 0 && dx !== 0) return;
        if (y !== 0 && dy !== 0) return;
        directionRef.current = { dx: x, dy: y };
    };

    const resetGame = () => {
        setScore(0);
        setGameOver(false);
        directionRef.current = { dx: 1, dy: 0 };
        startedRef.current = false;
        snakeRef.current = [{x: 10, y: 10}, {x: 9, y: 10}];
        foodRef.current = {x: 15, y: 15};
        if (intervalRef.current) clearInterval(intervalRef.current);
        startGame();
    };

    const startGame = useCallback(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const draw = () => {
            if(!ctx) return;
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(foodRef.current.x * 20, foodRef.current.y * 20, 18, 18);
            ctx.fillStyle = '#44ff44';
            snakeRef.current.forEach(part => ctx.fillRect(part.x * 20, part.y * 20, 18, 18));
            
            if (!startedRef.current || gameOver) return;

            const { dx, dy } = directionRef.current;
            const head = {x: snakeRef.current[0].x + dx, y: snakeRef.current[0].y + dy};
            
            if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
                setGameOver(true);
                clearInterval(intervalRef.current);
                return;
            }
            
            snakeRef.current.unshift(head);
            if(head.x === foodRef.current.x && head.y === foodRef.current.y) {
                setScore(s => s + 1);
                let newFood;
                do {
                    newFood = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
                } while (snakeRef.current.some(s => s.x === newFood.x && s.y === newFood.y));
                foodRef.current = newFood;
            } else snakeRef.current.pop();
        };

        intervalRef.current = setInterval(draw, 100);
    }, [gameOver]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if(e.key === 'ArrowUp') handleDir(0, -1);
            if(e.key === 'ArrowDown') handleDir(0, 1);
            if(e.key === 'ArrowLeft') handleDir(-1, 0);
            if(e.key === 'ArrowRight') handleDir(1, 0);
        };

        window.addEventListener('keydown', handleKey);
        startGame();
        return () => { window.removeEventListener('keydown', handleKey); if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startGame]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-900 text-white overflow-y-auto">
            <div className="mb-4 flex justify-between w-full max-w-[400px] items-center">
                <span className="text-xl font-bold">Snake</span>
                <div className="flex items-center gap-4">
                    <span>Score: {score}</span>
                    <button onClick={resetGame} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><RefreshCw size={16} /></button>
                </div>
            </div>
            <div className="relative">
                <canvas ref={canvasRef} width={400} height={400} className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] border border-slate-700 bg-[#111] rounded-lg shadow-lg" />
                {gameOver && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                        <div className="text-red-500 font-bold text-2xl mb-4">GAME OVER</div>
                        <button onClick={resetGame} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 font-bold">Play Again</button>
                    </div>
                )}
                {!startedRef.current && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 px-4 py-2 rounded text-slate-300">Press any arrow key to start</div>
                    </div>
                )}
            </div>
            
            {/* Mobile Controls */}
            <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
                <div />
                <button onClick={() => handleDir(0, -1)} className="p-4 bg-slate-800 rounded-lg flex items-center justify-center active:bg-slate-700"><ArrowUp /></button>
                <div />
                <button onClick={() => handleDir(-1, 0)} className="p-4 bg-slate-800 rounded-lg flex items-center justify-center active:bg-slate-700"><ArrowLeft /></button>
                <button onClick={() => handleDir(0, 1)} className="p-4 bg-slate-800 rounded-lg flex items-center justify-center active:bg-slate-700"><ArrowDown /></button>
                <button onClick={() => handleDir(1, 0)} className="p-4 bg-slate-800 rounded-lg flex items-center justify-center active:bg-slate-700"><ArrowRight /></button>
            </div>
        </div>
    );
};

// --- Minesweeper Game ---
type Cell = { isMine: boolean; isRevealed: boolean; isFlagged: boolean; neighborMines: number };
const DIFFICULTIES = {
    Easy: { rows: 9, cols: 9, mines: 10 },
    Medium: { rows: 16, cols: 16, mines: 40 },
    Hard: { rows: 16, cols: 30, mines: 99 }
};

const MinesweeperGame = () => {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [flags, setFlags] = useState(0);

    const initGrid = useCallback(() => {
        const { rows, cols, mines } = DIFFICULTIES[difficulty];
        let newGrid: Cell[][] = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
            isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
        })));

        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!newGrid[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols && newGrid[r + dr][c + dc].isMine) {
                                count++;
                            }
                        }
                    }
                    newGrid[r][c].neighborMines = count;
                }
            }
        }

        setGrid(newGrid);
        setGameOver(false);
        setWin(false);
        setFlags(0);
    }, [difficulty]);

    useEffect(() => { initGrid(); }, [initGrid]);

    const revealCell = (r: number, c: number) => {
        if (gameOver || win || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

        const newGrid = [...grid.map(row => [...row])];
        
        if (newGrid[r][c].isMine) {
            // Game Over
            newGrid.forEach(row => row.forEach(cell => { if (cell.isMine) cell.isRevealed = true; }));
            setGrid(newGrid);
            setGameOver(true);
            return;
        }

        const revealEmpty = (row: number, col: number) => {
            if (row < 0 || row >= DIFFICULTIES[difficulty].rows || col < 0 || col >= DIFFICULTIES[difficulty].cols) return;
            if (newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return;
            
            newGrid[row][col].isRevealed = true;
            
            if (newGrid[row][col].neighborMines === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        revealEmpty(row + dr, col + dc);
                    }
                }
            }
        };

        revealEmpty(r, c);
        setGrid(newGrid);

        // Check win
        let unrevealedSafe = 0;
        newGrid.forEach(row => row.forEach(cell => {
            if (!cell.isMine && !cell.isRevealed) unrevealedSafe++;
        }));
        if (unrevealedSafe === 0) {
            setWin(true);
            setGameOver(true);
        }
    };

    const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameOver || win || grid[r][c].isRevealed) return;
        
        const newGrid = [...grid.map(row => [...row])];
        newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
        setFlags(f => newGrid[r][c].isFlagged ? f + 1 : f - 1);
        setGrid(newGrid);
    };

    const getNumberColor = (n: number) => {
        const colors = ['text-transparent', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 'text-yellow-600', 'text-cyan-500', 'text-black', 'text-gray-600'];
        return colors[n] || '';
    };

    return (
        <div className="flex flex-col items-center h-full p-4 bg-slate-100 text-slate-800 overflow-y-auto">
            <div className="mb-6 flex flex-col md:flex-row justify-between w-full max-w-3xl items-center gap-4">
                <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                        <button 
                            key={d} 
                            onClick={() => setDifficulty(d)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${difficulty === d ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 font-mono text-lg font-bold">
                    <div className="flex items-center gap-2 text-red-600"><Flag size={20}/> {DIFFICULTIES[difficulty].mines - flags}</div>
                    <button onClick={initGrid} className="p-1.5 bg-slate-100 rounded hover:bg-slate-200 text-slate-700"><RefreshCw size={20} /></button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 overflow-auto max-w-full">
                {gameOver && win && <div className="text-center text-green-600 font-bold text-xl mb-4">You Win!</div>}
                {gameOver && !win && <div className="text-center text-red-600 font-bold text-xl mb-4">Game Over!</div>}
                
                <div 
                    className="grid gap-0.5 bg-slate-300 border-2 border-slate-400"
                    style={{ gridTemplateColumns: `repeat(${DIFFICULTIES[difficulty].cols}, minmax(0, 1fr))` }}
                >
                    {grid.map((row, r) => row.map((cell, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={() => revealCell(r, c)}
                            onContextMenu={(e) => toggleFlag(e, r, c)}
                            className={`w-8 h-8 flex items-center justify-center font-bold text-lg select-none
                                ${cell.isRevealed 
                                    ? 'bg-slate-100 border border-slate-200' 
                                    : 'bg-slate-300 border-t-slate-100 border-l-slate-100 border-b-slate-500 border-r-slate-500 border-2 hover:bg-slate-200 active:border-t-slate-500 active:border-l-slate-500 active:border-b-slate-100 active:border-r-slate-100'
                                }`}
                        >
                            {cell.isRevealed ? (
                                cell.isMine ? <Bomb size={20} className="text-red-600" /> : <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines > 0 ? cell.neighborMines : ''}</span>
                            ) : (
                                cell.isFlagged ? <Flag size={18} className="text-red-600" /> : ''
                            )}
                        </button>
                    )))}
                </div>
            </div>
        </div>
    );
};

// --- 2048 Game ---
const Game2048 = () => {
    const [grid, setGrid] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const addRandomTile = (currentGrid: number[][]) => {
        const emptyCells: {r: number, c: number}[] = [];
        currentGrid.forEach((row, r) => row.forEach((val, c) => { if (val === 0) emptyCells.push({r, c}); }));
        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
        return currentGrid;
    };

    const initGame = useCallback(() => {
        let newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (gameOver) return;

        let newGrid = [...grid.map(row => [...row])];
        let moved = false;
        let newScore = score;

        const slideAndMerge = (line: number[]) => {
            let filtered = line.filter(val => val !== 0);
            for (let i = 0; i < filtered.length - 1; i++) {
                if (filtered[i] === filtered[i+1]) {
                    filtered[i] *= 2;
                    newScore += filtered[i];
                    filtered.splice(i + 1, 1);
                }
            }
            while (filtered.length < 4) filtered.push(0);
            return filtered;
        };

        if (direction === 'LEFT' || direction === 'RIGHT') {
            for (let r = 0; r < 4; r++) {
                let row = newGrid[r];
                if (direction === 'RIGHT') row.reverse();
                let newRow = slideAndMerge(row);
                if (direction === 'RIGHT') newRow.reverse();
                if (newGrid[r].join(',') !== newRow.join(',')) moved = true;
                newGrid[r] = newRow;
            }
        } else {
            for (let c = 0; c < 4; c++) {
                let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
                if (direction === 'DOWN') col.reverse();
                let newCol = slideAndMerge(col);
                if (direction === 'DOWN') newCol.reverse();
                for (let r = 0; r < 4; r++) {
                    if (newGrid[r][c] !== newCol[r]) moved = true;
                    newGrid[r][c] = newCol[r];
                }
            }
        }

        if (moved) {
            newGrid = addRandomTile(newGrid);
            setGrid(newGrid);
            setScore(newScore);
            
            // Check game over
            let isGameOver = true;
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (newGrid[r][c] === 0) isGameOver = false;
                    if (c < 3 && newGrid[r][c] === newGrid[r][c+1]) isGameOver = false;
                    if (r < 3 && newGrid[r][c] === newGrid[r+1][c]) isGameOver = false;
                }
            }
            if (isGameOver) setGameOver(true);
        }
    }, [grid, score, gameOver]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                move(e.key.replace('Arrow', '').toUpperCase() as any);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    // Touch handling for mobile
    const touchStartRef = useRef<{x: number, y: number} | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            if (Math.abs(dy) > 30) move(dy > 0 ? 'DOWN' : 'UP');
        }
        touchStartRef.current = null;
    };

    const getTileColor = (val: number) => {
        const colors: Record<number, string> = {
            0: 'bg-slate-200 text-transparent',
            2: 'bg-slate-100 text-slate-700',
            4: 'bg-orange-100 text-slate-700',
            8: 'bg-orange-300 text-white',
            16: 'bg-orange-500 text-white',
            32: 'bg-red-400 text-white',
            64: 'bg-red-600 text-white',
            128: 'bg-yellow-400 text-white text-3xl',
            256: 'bg-yellow-500 text-white text-3xl',
            512: 'bg-yellow-600 text-white text-3xl',
            1024: 'bg-amber-500 text-white text-2xl',
            2048: 'bg-amber-600 text-white text-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]',
        };
        return colors[val] || 'bg-slate-800 text-white text-2xl';
    };

    return (
        <div className="flex flex-col items-center h-full p-4 bg-[#faf8ef] text-slate-800 overflow-y-auto">
            <div className="mb-8 flex justify-between w-full max-w-[400px] items-center">
                <h1 className="text-4xl font-bold text-slate-700">2048</h1>
                <div className="flex gap-2">
                    <div className="bg-slate-700 text-white px-4 py-2 rounded-lg flex flex-col items-center">
                        <span className="text-xs text-slate-300 uppercase font-bold">Score</span>
                        <span className="font-bold">{score}</span>
                    </div>
                    <button onClick={initGame} className="bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div 
                className="bg-slate-400 p-3 rounded-xl relative touch-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {gameOver && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                        <div className="text-slate-800 font-bold text-4xl mb-4">Game Over!</div>
                        <button onClick={initGame} className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">Try Again</button>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-3">
                    {grid.map((row, r) => row.map((val, c) => (
                        <div 
                            key={`${r}-${c}`} 
                            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center font-bold text-3xl sm:text-4xl transition-all duration-100 ${getTileColor(val)}`}
                        >
                            {val > 0 ? val : ''}
                        </div>
                    )))}
                </div>
            </div>
            <p className="mt-8 text-slate-500 text-center max-w-[400px]">
                <strong>How to play:</strong> Use your <strong>arrow keys</strong> or <strong>swipe</strong> to move the tiles. Tiles with the same number merge into one when they touch. Add them up to reach <strong>2048!</strong>
            </p>
        </div>
    );
};

// --- Main Games App ---
export const GamesApp = () => {
    const [activeGame, setActiveGame] = useState<'Snake' | 'Minesweeper' | '2048' | null>(null);

    if (activeGame === 'Snake') return (
        <div className="h-full flex flex-col">
            <div className="bg-slate-800 text-white p-2 flex items-center gap-2 border-b border-slate-700">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 text-sm">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><SnakeGame /></div>
        </div>
    );
    
    if (activeGame === 'Minesweeper') return (
        <div className="h-full flex flex-col">
            <div className="bg-white text-slate-800 p-2 flex items-center gap-2 border-b border-slate-200">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 text-sm font-medium">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><MinesweeperGame /></div>
        </div>
    );

    if (activeGame === '2048') return (
        <div className="h-full flex flex-col">
            <div className="bg-[#faf8ef] text-slate-800 p-2 flex items-center gap-2 border-b border-slate-200">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 text-sm font-medium">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><Game2048 /></div>
        </div>
    );

    return (
        <div className="h-full bg-slate-50 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                        <Gamepad2 size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Games Center</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Snake Card */}
                    <button 
                        onClick={() => setActiveGame('Snake')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Gamepad2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Snake</h2>
                        <p className="text-slate-500 text-sm">The classic arcade game. Eat the red apples to grow, but don't hit the walls or yourself!</p>
                    </button>

                    {/* Minesweeper Card */}
                    <button 
                        onClick={() => setActiveGame('Minesweeper')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Bomb size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Minesweeper</h2>
                        <p className="text-slate-500 text-sm">Clear the board without detonating any mines. Features Easy, Medium, and Hard difficulties.</p>
                    </button>

                    {/* 2048 Card */}
                    <button 
                        onClick={() => setActiveGame('2048')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LucideIcons.Grid2X2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">2048</h2>
                        <p className="text-slate-500 text-sm">Slide and merge tiles with the same numbers to reach the legendary 2048 tile.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};
