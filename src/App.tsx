import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'Neon Pulse', artist: 'AI-77 • Genesis', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Synth Horizon', artist: 'AI-77 • Vector', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Midnight Glitch', artist: 'AI-77 • Binary', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const GRID_SIZE = 20;
const TILE_COUNT = 400 / GRID_SIZE; // 20

export default function App() {
  // --- Audio State ---
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[trackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, trackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Snake State ---
  const [snake, setSnake] = useState<{x: number, y: number}[]>([{x: 10, y: 10}]);
  const [food, setFood] = useState<{x: number, y: number}>({x: 15, y: 15});
  const [dir, setDir] = useState<{x: number, y: number}>({x: 1, y: 0});
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const dirRef = useRef(dir);
  const gameOverRef = useRef(gameOver);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetGame = () => {
    setSnake([{x: 10, y: 10}]);
    snakeRef.current = [{x: 10, y: 10}];
    setFood({x: 15, y: 15});
    foodRef.current = {x: 15, y: 15};
    setDir({x: 1, y: 0});
    dirRef.current = {x: 1, y: 0};
    if (score > highScore) setHighScore(score);
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " ", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
      }
      
      const { x, y } = dirRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && y === 0) dirRef.current = {x: 0, y: -1};
      else if ((e.key === 'ArrowDown' || e.key === 's') && y === 0) dirRef.current = {x: 0, y: 1};
      else if ((e.key === 'ArrowLeft' || e.key === 'a') && x === 0) dirRef.current = {x: -1, y: 0};
      else if ((e.key === 'ArrowRight' || e.key === 'd') && x === 0) dirRef.current = {x: 1, y: 0};
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const moveSnake = () => {
      if (gameOverRef.current) return;
      
      const newSnake = [...snakeRef.current];
      const head = { ...newSnake[0] };
      
      head.x += dirRef.current.x;
      head.y += dirRef.current.y;
      
      // Check wall collision
      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        setGameOver(true);
        gameOverRef.current = true;
        return;
      }
      
      // Check self collision
      if (newSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        gameOverRef.current = true;
        return;
      }
      
      newSnake.unshift(head);
      
      // Check food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(s => s + 10);
        const newFood = {
          x: Math.floor(Math.random() * TILE_COUNT),
          y: Math.floor(Math.random() * TILE_COUNT)
        };
        setFood(newFood);
        foodRef.current = newFood;
      } else {
        newSnake.pop();
      }
      
      setSnake(newSnake);
      snakeRef.current = newSnake;
    };

    const interval = setInterval(moveSnake, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas mapped to transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Food
    ctx.fillStyle = '#ec4899'; // pink-500
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ec4899';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      if (i === 0) {
        ctx.fillStyle = '#22d3ee'; // cyan-400 (Head)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#22d3ee';
        ctx.fillRect(seg.x * GRID_SIZE, seg.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      } else {
        const opacity = Math.max(0.2, 0.8 - (i / snake.length) * 0.6);
        ctx.fillStyle = `rgba(8, 145, 178, ${opacity})`; // cyan-600
        ctx.shadowBlur = 0;
        ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      }
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="w-full h-screen bg-[#050505] text-white p-6 font-sans overflow-hidden flex flex-col select-none">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={nextTrack} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Header Section */}
      <header className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Synth<span className="text-cyan-400">Snake</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-xl hidden sm:flex items-center gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Session Time</span>
              <span className="font-mono text-cyan-400 text-lg">00:14:42</span>
            </div>
            <div className="w-px h-8 bg-[#222]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Connection</span>
              <span className="text-green-400 text-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Stable
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-6 gap-4 flex-grow min-h-0 relative">
        
        {/* Track List (Left Column) */}
        <div className="col-span-12 lg:col-span-3 row-span-4 bg-[#0a0a0a] rounded-3xl border border-white/5 p-5 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 shrink-0">Queue</h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
            {TRACKS.map((track, idx) => (
              <div 
                key={track.id} 
                onClick={() => { setTrackIndex(idx); setIsPlaying(true); }}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer border ${idx === trackIndex ? 'bg-cyan-500/10 border-cyan-500/20' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${idx === trackIndex ? 'bg-cyan-900' : 'bg-[#151515]'}`}>
                  {idx === trackIndex && isPlaying && <div className="w-1 h-4 bg-cyan-400 animate-pulse rounded-full"></div>}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-sm font-bold truncate ${idx === trackIndex ? 'text-cyan-100' : 'text-gray-300'}`}>{track.title}</p>
                  <p className={`text-[10px] truncate ${idx === trackIndex ? 'text-cyan-400/70' : 'text-gray-500'}`}>{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
            <div className="bg-[#111] p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase mb-2">Daily Challenge</p>
              <p className="text-sm font-medium">Collect 50 nodes without stopping.</p>
            </div>
          </div>
        </div>

        {/* Game Window (Center) */}
        <div className="col-span-12 lg:col-span-6 row-span-5 bg-[#000] rounded-3xl border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] flex items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="relative border border-white/5 shadow-[0_0_30px_rgba(34,211,238,0.05)] bg-[#050505]/50 backdrop-blur-sm" style={{ width: 400, height: 400 }}>
            <canvas ref={canvasRef} width={400} height={400} className="block w-full h-full" />
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded">
                <h2 className="text-4xl font-bold text-pink-500 mb-6 uppercase tracking-wider relative">
                  System Failure
                  <div className="absolute inset-0 blur-md opacity-40 mix-blend-screen bg-pink-500 pointer-events-none"></div>
                </h2>
                <button 
                  onClick={resetGame} 
                  className="px-8 py-3 border border-cyan-500/50 text-cyan-400 bg-cyan-900/20 hover:bg-cyan-500 hover:text-black transition-all font-bold text-xl tracking-widest rounded-xl z-20 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                >
                  REBOOT
                </button>
              </div>
            )}
          </div>

          <div className="absolute top-6 left-6 flex gap-4 pointer-events-none">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Current Score</span>
              <span className="text-3xl font-mono text-white tracking-tighter">{score.toString().padStart(3, '0')}0</span>
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 px-4 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 pointer-events-none">
            <span className="text-xs text-cyan-400 font-mono">NEO SNAKE OS V.2</span>
          </div>
        </div>

        {/* Player Controls (Right Column) */}
        <div className="col-span-12 lg:col-span-3 row-span-4 bg-[#0a0a0a] rounded-3xl border border-white/5 p-6 flex flex-col">
          <div className="aspect-square w-full bg-gradient-to-br from-cyan-900 to-purple-900 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div className="relative w-24 h-24 border-2 border-white/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <div className={`w-16 h-16 bg-white/10 rounded-full flex items-center justify-center transform transition-transform duration-[4000ms] ease-linear ${isPlaying ? 'animate-spin' : ''}`}>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">{currentTrack.title}</h2>
            <p className="text-xs text-gray-500">{currentTrack.artist}</p>
          </div>

          <div className="flex justify-between items-center px-4 mb-6">
            <button onClick={prevTrack} className="text-gray-400 hover:text-white transition-colors">
              <SkipBack size={24} />
            </button>
            <button onClick={togglePlay} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform">
               {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-gray-400 hover:text-white transition-colors">
              <SkipForward size={24} />
            </button>
          </div>

          <div className="mt-auto">
            <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-100 ease-linear" 
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Stats & Extras */}
        
        {/* Stats Row (Bottom Left/Middle) */}
        <div className="col-span-12 lg:col-span-3 row-span-2 lg:col-start-1 lg:row-start-5 bg-[#0a0a0a] rounded-3xl border border-white/5 p-5 flex flex-col justify-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Personal Best</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-pink-500">{Math.max(highScore, score).toString().padStart(3, '0')}0</span>
            <span className="text-[10px] text-gray-600">pts</span>
          </div>
        </div>

        {/* Center Bottom Control (Under Game) */}
        <div className="hidden lg:flex col-span-12 lg:col-span-6 row-span-1 lg:col-start-4 lg:row-start-6 bg-[#0a0a0a] rounded-3xl border border-white/5 p-5 items-center justify-between">
           <span className="text-xs font-mono text-gray-500">SYS.STATUS: <span className="text-green-400 glow-pulse">OPERATIONAL</span></span>
           
           <div className="flex items-center gap-3">
              <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-white transition-all">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={muted ? 0 : volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-1 bg-[#222] rounded-full appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #22d3ee ${(muted ? 0 : volume) * 100}%, #222 ${(muted ? 0 : volume) * 100}%)`
                }}
              />
          </div>
        </div>
        
        {/* Right Bottom 1 (New High Score) */}
        <div className="col-span-12 lg:col-span-3 row-span-1 lg:col-start-10 lg:row-start-5 bg-cyan-500 rounded-3xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)] hidden sm:flex">
            <span className="text-black font-bold uppercase text-xs tracking-wider">Session Active</span>
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
        </div>

        {/* Right Bottom 2 (Players Online) */}
        <div className="col-span-12 lg:col-span-3 row-span-1 lg:col-start-10 lg:row-start-6 bg-[#151515] rounded-3xl border border-white/5 p-5 flex items-center gap-4 hidden sm:flex">
           <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-[#151515]"></div>
              <div className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-[#151515]"></div>
              <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-[#151515]"></div>
           </div>
           <span className="text-xs font-bold decoration-slice">Online Nodes</span>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 8px #22d3ee;
        }
        input[type=range]::-moz-range-thumb {
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 8px #22d3ee;
          border: none;
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(74, 222, 128, 0.8); }
          50% { opacity: 0.6; text-shadow: 0 0 2px rgba(74, 222, 128, 0.2); }
        }
        .glow-pulse {
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

