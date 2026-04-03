import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Flag, Bomb, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// --- Solitaire Game ---
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: 'red' | 'black';
  value: number;
  faceUp: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({
        id: `${suit}-${RANKS[i]}`,
        suit,
        rank: RANKS[i],
        color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
        value: i + 1,
        faceUp: false,
      });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: { [key in Suit]: Card[] };
  tableau: Card[][];
}

const SolitaireGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [drawCount, setDrawCount] = useState<1 | 3>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ source: string, index: number, card: Card } | null>(null);

  const initGame = () => {
    const deck = createDeck();
    const tableau: Card[][] = Array.from({ length: 7 }, () => []);
    
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        const card = deck.pop()!;
        if (i === j) card.faceUp = true;
        tableau[j].push(card);
      }
    }

    setGameState({
      stock: deck,
      waste: [],
      foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
      tableau,
    });
    setSelectedCard(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleStockClick = () => {
    if (!gameState) return;
    const newState = { ...gameState };
    
    if (newState.stock.length === 0) {
      if (newState.waste.length === 0) return;
      newState.stock = [...newState.waste].reverse().map(c => ({ ...c, faceUp: false }));
      newState.waste = [];
    } else {
      const drawn = newState.stock.splice(-drawCount, drawCount).reverse().map(c => ({ ...c, faceUp: true }));
      newState.waste = [...newState.waste, ...drawn];
    }
    
    setGameState(newState);
    setSelectedCard(null);
  };

  const canMoveToFoundation = (card: Card, foundation: Card[]) => {
    if (foundation.length === 0) return card.value === 1;
    const topCard = foundation[foundation.length - 1];
    return topCard.suit === card.suit && topCard.value === card.value - 1;
  };

  const canMoveToTableau = (card: Card, column: Card[]) => {
    if (column.length === 0) return card.value === 13; // Only King on empty
    const topCard = column[column.length - 1];
    return topCard.color !== card.color && topCard.value === card.value + 1;
  };

  const handleCardClick = (source: string, index: number, card: Card) => {
    if (!gameState) return;
    
    if (!card.faceUp && source.startsWith('tableau')) {
      // Only allow flipping the top card of a tableau column
      const colIndex = parseInt(source.split('-')[1]);
      if (index === gameState.tableau[colIndex].length - 1) {
        const newState = { ...gameState };
        newState.tableau[colIndex][index].faceUp = true;
        setGameState(newState);
      }
      return;
    }

    if (!selectedCard) {
      if (!card.faceUp) return;
      setSelectedCard({ source, index, card });
    } else {
      // Attempt to move
      const newState = { ...gameState };
      let moved = false;

      if (source.startsWith('foundation')) {
        const suit = source.split('-')[1] as Suit;
        if (selectedCard.index === getSourceArray(newState, selectedCard.source).length - 1 && canMoveToFoundation(selectedCard.card, newState.foundations[suit])) {
          newState.foundations[suit].push(selectedCard.card);
          removeCardFromSource(newState, selectedCard.source, selectedCard.index);
          moved = true;
        }
      } else if (source.startsWith('tableau')) {
        const colIndex = parseInt(source.split('-')[1]);
        if (canMoveToTableau(selectedCard.card, newState.tableau[colIndex])) {
          const sourceArr = getSourceArray(newState, selectedCard.source);
          if (selectedCard.source === 'waste' && selectedCard.index !== sourceArr.length - 1) {
             // Cannot move non-top card from waste
          } else if (selectedCard.source.startsWith('foundation') && selectedCard.index !== sourceArr.length - 1) {
             // Cannot move non-top card from foundation
          } else {
            const movingCards = sourceArr.splice(selectedCard.index);
            newState.tableau[colIndex].push(...movingCards);
            moved = true;
          }
        }
      }

      if (moved) {
        setGameState(newState);
      }
      setSelectedCard(null);
    }
  };

  const handleEmptyTableauClick = (colIndex: number) => {
    if (!gameState || !selectedCard) return;
    if (selectedCard.card.value === 13) { // King
      const newState = { ...gameState };
      const sourceArr = getSourceArray(newState, selectedCard.source);
      
      if (selectedCard.source === 'waste' && selectedCard.index !== sourceArr.length - 1) {
        // Cannot move non-top card from waste
      } else if (selectedCard.source.startsWith('foundation') && selectedCard.index !== sourceArr.length - 1) {
        // Cannot move non-top card from foundation
      } else {
        const movingCards = sourceArr.splice(selectedCard.index);
        newState.tableau[colIndex].push(...movingCards);
        setGameState(newState);
      }
    }
    setSelectedCard(null);
  };

  const handleEmptyFoundationClick = (suit: Suit) => {
    if (!gameState || !selectedCard) return;
    if (selectedCard.index === getSourceArray(gameState, selectedCard.source).length - 1 && selectedCard.card.value === 1 && selectedCard.card.suit === suit) {
      const newState = { ...gameState };
      newState.foundations[suit].push(selectedCard.card);
      removeCardFromSource(newState, selectedCard.source, selectedCard.index);
      setGameState(newState);
    }
    setSelectedCard(null);
  };

  const getSourceArray = (state: GameState, source: string): Card[] => {
    if (source === 'waste') return state.waste;
    if (source.startsWith('tableau')) return state.tableau[parseInt(source.split('-')[1])];
    if (source.startsWith('foundation')) return state.foundations[source.split('-')[1] as Suit];
    return [];
  };

  const removeCardFromSource = (state: GameState, source: string, index: number) => {
    if (source === 'waste') state.waste.splice(index, 1);
    else if (source.startsWith('tableau')) state.tableau[parseInt(source.split('-')[1])].splice(index, 1);
    else if (source.startsWith('foundation')) state.foundations[source.split('-')[1] as Suit].splice(index, 1);
  };

  // Auto-play logic
  useEffect(() => {
    if (!gameState || !autoPlay) return;
    
    let moved = false;
    const newState = { ...gameState };

    const tryMoveToFoundation = (card: Card, source: string, index: number) => {
      if (canMoveToFoundation(card, newState.foundations[card.suit])) {
        newState.foundations[card.suit].push(card);
        removeCardFromSource(newState, source, index);
        moved = true;
        return true;
      }
      return false;
    };

    // Check waste
    if (newState.waste.length > 0) {
      const card = newState.waste[newState.waste.length - 1];
      tryMoveToFoundation(card, 'waste', newState.waste.length - 1);
    }

    // Check tableau
    if (!moved) {
      for (let i = 0; i < 7; i++) {
        const col = newState.tableau[i];
        if (col.length > 0) {
          const card = col[col.length - 1];
          if (card.faceUp && tryMoveToFoundation(card, `tableau-${i}`, col.length - 1)) {
            break;
          }
        }
      }
    }

    if (moved) {
      setTimeout(() => setGameState(newState), 300);
    }
  }, [gameState, autoPlay]);

  if (!gameState) return null;

  const renderCard = (card: Card, source: string, index: number, isStack: boolean = false) => {
    const isSelected = selectedCard?.card.id === card.id;
    return (
      <div
        key={card.id}
        onClick={(e) => { e.stopPropagation(); handleCardClick(source, index, card); }}
        className={`w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center bg-white cursor-pointer select-none
          ${isSelected ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-slate-300 shadow-sm'}
          ${!card.faceUp ? 'bg-blue-800 border-white/20 bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMWU0MGFmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWQ0ZWQ4IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+")]' : ''}
          ${isStack ? 'absolute top-0 left-0' : ''}
        `}
        style={isStack ? { top: `${index * 20}px`, zIndex: index } : {}}
      >
        {card.faceUp && (
          <div className={`text-xl font-bold ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
            <div className="text-sm absolute top-1 left-1">{card.rank}</div>
            <div>{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
            <div className="text-sm absolute bottom-1 right-1 rotate-180">{card.rank}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-green-900 text-white p-4 overflow-auto" onClick={() => setSelectedCard(null)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Solitaire</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-green-800 rounded hover:bg-green-700">
            <Settings size={20} />
          </button>
          <button onClick={initGame} className="p-2 bg-green-800 rounded hover:bg-green-700">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-green-800 rounded-xl border border-green-700 flex gap-6 items-center">
          <div>
            <label className="block text-sm mb-1 text-green-200">Draw Count</label>
            <select 
              value={drawCount} 
              onChange={(e) => { setDrawCount(Number(e.target.value) as 1 | 3); initGame(); }}
              className="bg-green-900 border border-green-600 rounded p-1 text-white"
            >
              <option value={1}>Draw 1</option>
              <option value={3}>Draw 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-green-200">Auto-Play to Foundation</label>
            <button 
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-1 rounded ${autoPlay ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              {autoPlay ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between mb-8 min-w-[600px]">
        {/* Top Left: Stock and Waste */}
        <div className="flex gap-4">
          <div 
            className="w-16 h-24 rounded-lg border-2 border-green-700 bg-green-800 flex items-center justify-center cursor-pointer hover:bg-green-700"
            onClick={(e) => { e.stopPropagation(); handleStockClick(); }}
          >
            {gameState.stock.length > 0 ? (
              <div className="w-full h-full rounded-md bg-blue-800 border-white/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMWU0MGFmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWQ0ZWQ4IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"></div>
            ) : (
              <RefreshCw size={24} className="text-green-600" />
            )}
          </div>
          <div className="w-16 h-24 relative">
            {gameState.waste.slice(-3).map((card, i, arr) => (
              <div key={card.id} className="absolute top-0" style={{ left: `${i * 15}px`, zIndex: i }}>
                {renderCard(card, 'waste', gameState.waste.length - arr.length + i)}
              </div>
            ))}
          </div>
        </div>

        {/* Top Right: Foundations */}
        <div className="flex gap-4">
          {SUITS.map((suit) => (
            <div 
              key={suit} 
              className="w-16 h-24 rounded-lg border-2 border-green-700 bg-green-800 flex items-center justify-center relative cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handleEmptyFoundationClick(suit); }}
            >
              <div className="text-3xl opacity-20 text-green-900">
                {suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : '♠'}
              </div>
              {gameState.foundations[suit].length > 0 && (
                <div className="absolute inset-0">
                  {renderCard(gameState.foundations[suit][gameState.foundations[suit].length - 1], `foundation-${suit}`, gameState.foundations[suit].length - 1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Tableau */}
      <div className="flex gap-4 min-w-[600px] flex-1">
        {gameState.tableau.map((col, i) => (
          <div 
            key={i} 
            className="w-16 relative flex-1 min-h-[100px]"
            onClick={(e) => { e.stopPropagation(); if (col.length === 0) handleEmptyTableauClick(i); }}
          >
            {col.length === 0 ? (
              <div className="w-16 h-24 rounded-lg border-2 border-green-700 bg-green-800"></div>
            ) : (
              col.map((card, j) => renderCard(card, `tableau-${i}`, j, true))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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
    const [showArrows, setShowArrows] = useState(false);

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
                    <button onClick={() => setShowArrows(!showArrows)} className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">
                        {showArrows ? 'Hide Arrows' : 'Show Arrows'}
                    </button>
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
            
            {/* Mobile / On-Screen Controls */}
            <div className={`mt-6 grid grid-cols-3 gap-2 ${showArrows ? 'flex' : 'hidden md:hidden'}`}>
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

// --- Geometry Match Game ---
const SHAPES = [
    LucideIcons.Circle, LucideIcons.Square, LucideIcons.Triangle, LucideIcons.Star,
    LucideIcons.Hexagon, LucideIcons.Diamond, LucideIcons.Heart, LucideIcons.Cloud
];

const GeometryMatchGame = () => {
    const [cards, setCards] = useState<{id: number, shape: any, isFlipped: boolean, isMatched: boolean}[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);

    const initGame = useCallback(() => {
        const deck = [...SHAPES, ...SHAPES]
            .sort(() => Math.random() - 0.5)
            .map((shape, i) => ({ id: i, shape, isFlipped: false, isMatched: false }));
        setCards(deck);
        setFlipped([]);
        setMoves(0);
        setMatches(0);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;
            if (cards[first].shape === cards[second].shape) {
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[first].isMatched = true;
                    matchedCards[second].isMatched = true;
                    setCards(matchedCards);
                    setFlipped([]);
                    setMatches(m => m + 1);
                }, 500);
            } else {
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[first].isFlipped = false;
                    resetCards[second].isFlipped = false;
                    setCards(resetCards);
                    setFlipped([]);
                }, 1000);
            }
        }
    };

    return (
        <div className="flex flex-col items-center h-full p-4 bg-indigo-50 text-slate-800 overflow-y-auto">
            <div className="mb-6 flex justify-between w-full max-w-md items-center">
                <h1 className="text-3xl font-bold text-indigo-900">Geometry Match</h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-indigo-700">Moves: {moves}</div>
                    <button onClick={initGame} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"><RefreshCw size={16} /></button>
                </div>
            </div>
            
            {matches === 8 && (
                <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl font-bold text-xl text-center w-full max-w-md">
                    You won in {moves} moves!
                </div>
            )}

            <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-md">
                {cards.map((card, i) => {
                    const Icon = card.shape;
                    return (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(i)}
                            className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 transform ${card.isFlipped || card.isMatched ? 'bg-white shadow-md rotate-y-180' : 'bg-indigo-300 hover:bg-indigo-400 shadow-sm'}`}
                        >
                            {(card.isFlipped || card.isMatched) && <Icon size={40} className={`text-indigo-600 ${card.isMatched ? 'opacity-50' : ''}`} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- Guess the Word Game ---
const ALL_QUESTIONS = [
    { q: "Planet we live on", a: "EARTH" },
    { q: "Color of the sky", a: "BLUE" },
    { q: "Opposite of hot", a: "COLD" },
    { q: "Number of days in a week", a: "SEVEN" },
    { q: "Capital of France", a: "PARIS" },
    { q: "First letter of the alphabet", a: "A" },
    { q: "Animal that says meow", a: "CAT" },
    { q: "Water freezes at this temperature (Celsius)", a: "ZERO" },
    { q: "The star at the center of our solar system", a: "SUN" },
    { q: "A shape with three sides", a: "TRIANGLE" },
    { q: "Capital of Japan", a: "TOKYO" },
    { q: "Largest mammal on Earth", a: "WHALE" },
    { q: "The color of an emerald", a: "GREEN" },
    { q: "Opposite of up", a: "DOWN" },
    { q: "A fruit that keeps the doctor away", a: "APPLE" },
    { q: "The language spoken in Spain", a: "SPANISH" },
    { q: "The continent where Egypt is located", a: "AFRICA" },
    { q: "The chemical symbol for water", a: "H2O" },
    { q: "The planet known as the Red Planet", a: "MARS" },
    { q: "The tallest animal in the world", a: "GIRAFFE" },
    { q: "The primary ingredient in bread", a: "FLOUR" },
    { q: "The season that comes after Summer", a: "AUTUMN" },
    { q: "The currency used in the United States", a: "DOLLAR" },
    { q: "The instrument with black and white keys", a: "PIANO" },
    { q: "The opposite of day", a: "NIGHT" },
    { q: "The animal known as the king of the jungle", a: "LION" },
    { q: "The shape of a stop sign", a: "OCTAGON" },
    { q: "The largest ocean on Earth", a: "PACIFIC" },
    { q: "The hardest natural substance on Earth", a: "DIAMOND" },
    { q: "The organ that pumps blood", a: "HEART" },
    { q: "The fastest land animal", a: "CHEETAH" },
    { q: "The color of a school bus", a: "YELLOW" },
    { q: "The force that keeps us on the ground", a: "GRAVITY" },
    { q: "The closest planet to the Sun", a: "MERCURY" },
    { q: "The capital of Italy", a: "ROME" },
    { q: "The capital of England", a: "LONDON" },
    { q: "A yellow fruit that monkeys love", a: "BANANA" },
    { q: "The opposite of left", a: "RIGHT" },
    { q: "The number of months in a year", a: "TWELVE" },
    { q: "A bird that can swim but cannot fly", a: "PENGUIN" },
    { q: "The color of a strawberry", a: "RED" },
    { q: "The opposite of empty", a: "FULL" },
    { q: "The tool used to cut paper", a: "SCISSORS" },
    { q: "The largest planet in our solar system", a: "JUPITER" },
    { q: "The season when snow falls", a: "WINTER" },
    { q: "The animal that produces milk", a: "COW" },
    { q: "The opposite of fast", a: "SLOW" },
    { q: "The object used to tell time", a: "CLOCK" },
    { q: "The opposite of young", a: "OLD" },
    { q: "The animal that barks", a: "DOG" },
    { q: "The shape of a full moon", a: "CIRCLE" },
    { q: "The opposite of heavy", a: "LIGHT" },
    { q: "The vehicle that travels on tracks", a: "TRAIN" },
    { q: "The opposite of sweet", a: "SOUR" },
    { q: "The color of a lemon", a: "YELLOW" },
    { q: "The animal that has a long trunk", a: "ELEPHANT" },
    { q: "The opposite of hard", a: "SOFT" },
    { q: "The object used to write on a blackboard", a: "CHALK" },
    { q: "The season when flowers bloom", a: "SPRING" },
    { q: "The animal that has a shell and moves slowly", a: "TURTLE" }
];

const GuessTheWordGame = () => {
    const [gameQuestions, setGameQuestions] = useState<{q: string, a: string}[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [guess, setGuess] = useState('');
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);

    const initGame = useCallback(() => {
        const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
        setGameQuestions(shuffled);
        setCurrentQ(0);
        setGuess('');
        setScore(0);
        setMessage('');
        setGameOver(false);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (gameOver || gameQuestions.length === 0 || message) return;

        const isCorrect = guess.toUpperCase().trim() === gameQuestions[currentQ].a;
        
        if (isCorrect) {
            setScore(s => s + 1);
            setMessage('Correct! 🎉');
        } else {
            setMessage('Incorrect! ❌');
        }

        setTimeout(() => {
            if (currentQ < gameQuestions.length - 1) {
                setCurrentQ(q => q + 1);
                setGuess('');
                setMessage('');
            } else {
                setGameOver(true);
                setMessage(`Game Over! Final Score: ${isCorrect ? score + 1 : score}/${gameQuestions.length}`);
            }
        }, 1000);
    };

    if (gameQuestions.length === 0) return null;

    return (
        <div className="flex flex-col items-center h-full p-4 bg-emerald-50 text-slate-800 overflow-y-auto">
            <div className="mb-8 flex justify-between w-full max-w-md items-center">
                <h1 className="text-3xl font-bold text-emerald-900">Guess the Word</h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-emerald-700">Score: {score}</div>
                    <button onClick={initGame} className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"><RefreshCw size={16} /></button>
                </div>
            </div>

            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                {!gameOver ? (
                    <>
                        <div className="text-sm text-emerald-500 font-bold mb-2">Question {currentQ + 1} of {gameQuestions.length}</div>
                        <h2 className="text-xl font-medium text-slate-800 mb-6">{gameQuestions[currentQ].q}</h2>
                        
                        <form onSubmit={handleGuess} className="space-y-4">
                            <input 
                                type="text" 
                                value={guess}
                                onChange={e => setGuess(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full p-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold text-lg tracking-widest disabled:opacity-50 disabled:bg-emerald-50"
                                autoFocus
                                disabled={!!message}
                            />
                            <button type="submit" disabled={!!message} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                Submit Guess
                            </button>
                        </form>
                        
                        {message && (
                            <div className={`mt-4 p-3 rounded-lg text-center font-bold ${message.includes('Correct') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-emerald-900 mb-2">Game Complete!</h2>
                        <p className="text-emerald-600 mb-6">{message}</p>
                        <button onClick={initGame} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// --- Chess Game ---
const ChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [status, setStatus] = useState('');
    const [robotMode, setRobotMode] = useState(true);
    const [lastError, setLastError] = useState('');

    const makeAMove = useCallback((move: any) => {
        try {
            const gameCopy = new Chess();
            gameCopy.loadPgn(game.pgn());
            
            let result = null;
            try {
                result = gameCopy.move(move);
            } catch (innerError) {
                // Ignore and try without promotion below
            }

            // If the move fails (returns null or throws) and has a promotion, try without it
            if (!result && move.promotion) {
                const { promotion, ...moveWithoutPromotion } = move;
                try {
                    result = gameCopy.move(moveWithoutPromotion);
                } catch (e) {
                    // Ignore
                }
            }

            if (!result) {
                return null; // Invalid move
            }
            
            setGame(gameCopy);
            setLastError('');
            return result;
        } catch (e: any) {
            console.error("Move error:", e, move);
            setLastError(`Error: ${e.message} | Move: ${JSON.stringify(move)}`);
            return null;
        }
    }, [game]);

    const makeRandomMove = useCallback(() => {
        const possibleMoves = game.moves();
        if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) return;
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        
        try {
            const gameCopy = new Chess();
            gameCopy.loadPgn(game.pgn());
            gameCopy.move(possibleMoves[randomIndex]);
            setGame(gameCopy);
        } catch (e) {
            // ignore
        }
    }, [game]);

    const onDrop = (args: any) => {
        const { sourceSquare, targetSquare, piece } = args;
        if (!targetSquare) return false;
        
        console.log("onDrop called with:", sourceSquare, targetSquare, piece);
        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            // pieceType is like 'wP', 'bN'
            promotion: piece?.pieceType?.[1]?.toLowerCase() === 'p' && (targetSquare[1] === '1' || targetSquare[1] === '8') ? 'q' : undefined,
        });

        // illegal move
        if (move === null) return false;

        return true;
    };

    useEffect(() => {
        if (robotMode && game.turn() === 'b' && !game.isGameOver()) {
            const timer = setTimeout(makeRandomMove, 300);
            return () => clearTimeout(timer);
        }
    }, [game, robotMode, makeRandomMove]);

    useEffect(() => {
        if (game.isCheckmate()) {
            setStatus('Checkmate!');
        } else if (game.isDraw()) {
            setStatus('Draw!');
        } else if (game.isCheck()) {
            setStatus('Check!');
        } else {
            setStatus('');
        }
    }, [game]);

    return (
        <div className="flex flex-col items-center h-full p-4 bg-slate-100 text-slate-800 overflow-y-auto">
            <div className="mb-6 flex justify-between w-full max-w-md items-center">
                <h1 className="text-3xl font-bold text-slate-900">Chess</h1>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setRobotMode(!robotMode)} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${robotMode ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'}`}
                    >
                        {robotMode ? 'Robot: ON' : 'Robot: OFF'}
                    </button>
                    <button onClick={() => setGame(new Chess())} className="p-2 bg-slate-600 text-white rounded hover:bg-slate-700"><RefreshCw size={16} /></button>
                </div>
            </div>
            {status && <div className="mb-4 text-xl font-bold text-red-600">{status}</div>}
            {lastError && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm max-w-[400px] w-full break-words">{lastError}</div>}
            <div className="w-full max-w-[400px] shadow-lg rounded-md overflow-hidden">
                <Chessboard options={{ position: game.fen(), onPieceDrop: onDrop }} />
            </div>
        </div>
    );
};

// --- Main Games App ---
export const GamesApp = () => {
    const [activeGame, setActiveGame] = useState<'Snake' | 'Minesweeper' | '2048' | 'GeometryMatch' | 'GuessTheWord' | 'Chess' | null>(null);

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

    if (activeGame === 'GeometryMatch') return (
        <div className="h-full flex flex-col">
            <div className="bg-indigo-50 text-slate-800 p-2 flex items-center gap-2 border-b border-indigo-100">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-indigo-200 rounded hover:bg-indigo-300 text-sm font-medium text-indigo-900">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><GeometryMatchGame /></div>
        </div>
    );

    if (activeGame === 'GuessTheWord') return (
        <div className="h-full flex flex-col">
            <div className="bg-emerald-50 text-slate-800 p-2 flex items-center gap-2 border-b border-emerald-100">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-emerald-200 rounded hover:bg-emerald-300 text-sm font-medium text-emerald-900">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><GuessTheWordGame /></div>
        </div>
    );

    if (activeGame === 'Chess') return (
        <div className="h-full flex flex-col">
            <div className="bg-slate-100 text-slate-800 p-2 flex items-center gap-2 border-b border-slate-200">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 text-sm font-medium text-slate-900">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><ChessGame /></div>
        </div>
    );

    if (activeGame === 'Solitaire') return (
        <div className="h-full flex flex-col">
            <div className="bg-slate-100 text-slate-800 p-2 flex items-center gap-2 border-b border-slate-200">
                <button onClick={() => setActiveGame(null)} className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 text-sm font-medium text-slate-900">← Back to Games</button>
            </div>
            <div className="flex-1 overflow-hidden"><SolitaireGame /></div>
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

                    {/* Geometry Match Card */}
                    <button 
                        onClick={() => setActiveGame('GeometryMatch')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LucideIcons.Shapes size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Geometry Match</h2>
                        <p className="text-slate-500 text-sm">Test your memory by matching pairs of geometric shapes hidden behind cards.</p>
                    </button>

                    {/* Guess the Word Card */}
                    <button 
                        onClick={() => setActiveGame('GuessTheWord')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LucideIcons.MessageCircleQuestion size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Guess the Word</h2>
                        <p className="text-slate-500 text-sm">Answer easy global trivia questions and guess the correct word to win.</p>
                    </button>

                    {/* Chess Card */}
                    <button 
                        onClick={() => setActiveGame('Chess')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LucideIcons.Crown size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Chess</h2>
                        <p className="text-slate-500 text-sm">Play a classic game of Chess against the computer.</p>
                    </button>

                    {/* Solitaire Card */}
                    <button 
                        onClick={() => setActiveGame('Solitaire')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LucideIcons.Spade size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Solitaire</h2>
                        <p className="text-slate-500 text-sm">The classic card game of Klondike Solitaire. Draw 1 or Draw 3 options available.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};
