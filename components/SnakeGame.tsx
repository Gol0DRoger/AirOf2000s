"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 25;
const CELL_DESKTOP = 8;
const CELL_MOBILE = 12;
const CANVAS_DESKTOP = GRID * CELL_DESKTOP;
const CANVAS_MOBILE = GRID * CELL_MOBILE;
const MIN_SWIPE_DISTANCE = 30;

type Point = { x: number; y: number };

export default function SnakeGame() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([{ x: 12, y: 12 }]);
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const runningRef = useRef(false);
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cellRef = useRef(CELL_DESKTOP);
  const canvasSizeRef = useRef(CANVAS_DESKTOP);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    cellRef.current = window.innerWidth < 768 ? CELL_MOBILE : CELL_DESKTOP;
    canvasSizeRef.current = window.innerWidth < 768 ? CANVAS_MOBILE : CANVAS_DESKTOP;
  }, []);

  const randomFood = useCallback((snake: Point[]) => {
    let food: Point;
    do {
      food = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
    foodRef.current = food;
  }, []);

  const draw = useCallback(
    (message?: string, flash = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cellSize = cellRef.current;
      const canvasSize = canvasSizeRef.current;

      ctx.fillStyle = flash ? "#cc4444" : "#9ca978";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasSize, i * cellSize);
        ctx.stroke();
      }

      ctx.fillStyle = "#cc2200";
      ctx.fillRect(
        foodRef.current.x * cellSize,
        foodRef.current.y * cellSize,
        cellSize - 1,
        cellSize - 1
      );

      ctx.fillStyle = "#2d4a1e";
      snakeRef.current.forEach((seg) => {
        ctx.fillRect(seg.x * cellSize, seg.y * cellSize, cellSize - 1, cellSize - 1);
      });

      if (message) {
        ctx.fillStyle = "#333";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(message, canvasSize / 2, canvasSize / 2);
      }
    },
    []
  );

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 12, y: 12 }];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    runningRef.current = false;
    randomFood(snakeRef.current);
    draw("PRESS ANY KEY");
  }, [draw, randomFood]);

  const gameOver = useCallback(() => {
    runningRef.current = false;
    let flashes = 0;
    const flashInterval = setInterval(() => {
      draw("GAME OVER", flashes % 2 === 0);
      flashes++;
      if (flashes >= 6) {
        clearInterval(flashInterval);
        setTimeout(resetGame, 500);
      }
    }, 200);
  }, [draw, resetGame]);

  const tick = useCallback(() => {
    if (!runningRef.current) return;

    directionRef.current = { ...nextDirectionRef.current };
    const head = snakeRef.current[0];
    const newHead = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y,
    };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID ||
      newHead.y < 0 ||
      newHead.y >= GRID
    ) {
      gameOver();
      return;
    }

    if (
      snakeRef.current.some((s) => s.x === newHead.x && s.y === newHead.y)
    ) {
      gameOver();
      return;
    }

    snakeRef.current = [newHead, ...snakeRef.current];

    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      scoreRef.current++;
      setScore(scoreRef.current);
      randomFood(snakeRef.current);
    } else {
      snakeRef.current.pop();
    }

    draw();
  }, [draw, gameOver, randomFood]);

  useEffect(() => {
    if (!open) return;
    resetGame();
    intervalRef.current = setInterval(tick, 150);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, resetGame, tick]);

  const setDirection = useCallback((dx: number, dy: number) => {
    const cur = directionRef.current;
    if (cur.x + dx === 0 && cur.y + dy === 0) return;
    nextDirectionRef.current = { x: dx, y: dy };
    if (!runningRef.current) {
      runningRef.current = true;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const diffX = t.clientX - touchStartRef.current.x;
    const diffY = t.clientY - touchStartRef.current.y;

    if (Math.abs(diffX) < MIN_SWIPE_DISTANCE && Math.abs(diffY) < MIN_SWIPE_DISTANCE) {
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDirection(diffX > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, diffY > 0 ? 1 : -1);
    }

    touchStartRef.current = null;
  }, [setDirection]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          setDirection(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          setDirection(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          setDirection(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          setDirection(1, 0);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setDirection]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setPos({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pos.x, pos.y]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40
          flex flex-col items-center justify-center
          bg-xp-violet-dark border-l-2 border-t-2 border-b-2
          border-xp-violet-mid w-8 py-3 gap-2
          opacity-40 hover:opacity-100
          transition-all duration-300 hover:w-10
          cursor-pointer group"
        style={{ borderRadius: '4px 0 0 4px' }}
      >
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-xp-violet-light group-hover:text-white transition-colors">
          <rect x="1" y="1" width="14" height="22" rx="3" 
            stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="10" height="8" rx="1" 
            fill="currentColor" opacity="0.3"/>
          <rect x="5" y="5" width="2" height="2" fill="currentColor"/>
          <rect x="7" y="5" width="2" height="2" fill="currentColor"/>
          <rect x="7" y="7" width="2" height="2" fill="currentColor"/>
          <rect x="6" y="14" width="4" height="1.5" rx="0.5" 
            fill="currentColor" opacity="0.6"/>
          <rect x="7.25" y="12.5" width="1.5" height="4" rx="0.5" 
            fill="currentColor" opacity="0.6"/>
        </svg>
        <span className="font-pixel text-[5px] text-xp-violet-light 
          group-hover:text-white transition-colors"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          SNAKE
        </span>
      </button>

      {open && (
        <>
          {/* MOBILE — fullscreen overlay */}
          {isMobile ? (
            <div className="fixed inset-0 z-50 bg-[#ece9d8] flex flex-col select-none pt-safe">
              
              {/* Fixed Header Bar with clean spacing and explicit close button layer */}
              <div className="bg-xp-violet-dark border-b border-xp-violet-mid flex items-center 
                justify-between px-3 py-2 flex-shrink-0">
                <span className="font-pixel text-[9px] text-white">
                  snake.exe
                </span>
                <div className="flex items-center gap-4">
                  <span className="font-pixel text-[9px] text-white">
                    Score: {score}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Stops any parent touch bubble captures
                      setOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white 
                      font-bold rounded border border-red-700 text-[14px] leading-none
                      flex items-center justify-center shadow-sm cursor-pointer h-6 w-6"
                    title="Close Game"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Game interaction bounding container (Touches isolated strictly here) */}
              <div 
                className="flex flex-col items-center justify-center flex-1 gap-6 p-4"
                style={{ touchAction: 'none' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Canvas */}
                <div className="inset-border bg-[#9ca978] p-1 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    className="block"
                  />
                </div>

                <p className="font-pixel text-[7px] text-xp-muted animate-pulse">
                  swipe screen to control snake
                </p>
              </div>
            </div>

          ) : (
            /* DESKTOP — regular draggable window layout */
            <div
              className="fixed z-50 window-border bg-[#ece9d8]"
              style={{ left: pos.x, top: pos.y, width: 220 }}
            >
              <div
                className="violet-header flex cursor-move items-center 
                  justify-between px-2 py-1"
                onMouseDown={onHeaderMouseDown}
              >
                <span className="font-pixel text-[8px] text-white">
                  nokia.exe — Snake II
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-red-300 font-pixel text-[10px]"
                >×</button>
              </div>
              <div className="inset-border m-1 bg-[#9ca978] p-2">
                <p className="mb-1 font-pixel text-[8px] text-[#333]">
                  Score: {score}
                </p>
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={200}
                  className="block"
                />
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <div />
                  <button type="button"
                    onPointerDown={() => setDirection(0, -1)}
                    className="xp-button flex items-center 
                      justify-center h-8 w-full font-pixel text-[10px]"
                  >▲</button>
                  <div />
                  <button type="button"
                    onPointerDown={() => setDirection(-1, 0)}
                    className="xp-button flex items-center 
                      justify-center h-8 w-full font-pixel text-[10px]"
                  >◄</button>
                  <div className="flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full 
                      bg-xp-violet-dark opacity-40"/>
                  </div>
                  <button type="button"
                    onPointerDown={() => setDirection(1, 0)}
                    className="xp-button flex items-center 
                      justify-center h-8 w-full font-pixel text-[10px]"
                  >►</button>
                  <div />
                  <button type="button"
                    onPointerDown={() => setDirection(0, 1)}
                    className="xp-button flex items-center 
                      justify-center h-8 w-full font-pixel text-[10px]"
                  >▼</button>
                  <div />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}