import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, FileVideo, Music, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { resolvePath } from '../utils/fs';

const AudioVisualizer = ({ audioRef, isPlaying }: { audioRef: React.RefObject<HTMLMediaElement>, isPlaying: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!audioRef.current) return;
        const mediaObj = audioRef.current as any;
        
        const initAudio = () => {
            if (!mediaObj._audioCtx) {
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    // Note: In strict mode double-mounting this may fail if we don't guard it. Guarding via mediaObj prop is safer.
                    const source = ctx.createMediaElementSource(mediaObj);
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    
                    mediaObj._audioCtx = ctx;
                    mediaObj._analyser = analyser;
                    mediaObj._source = source;
                } catch (e) {
                    console.error("Audio Context Setup failed:", e);
                }
            }
            audioCtxRef.current = mediaObj._audioCtx;
            analyserRef.current = mediaObj._analyser;
        };

        if (isPlaying || mediaObj.currentTime > 0) {
            initAudio();
        }

        if (isPlaying && audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationId: number;
        let time = 0;

        const renderFrame = () => {
            animationId = requestAnimationFrame(renderFrame);
            time++;
            
            analyser.getByteFrequencyData(dataArray);

            // Milkdrop style dark backdrop with trails
            ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate base bass
            let bassSum = 0;
            for (let i = 0; i < 5; i++) bassSum += dataArray[i];
            const avgBass = bassSum / 5;
            const basePulse = avgBass * 0.4;
            const baseRadius = Math.min(canvas.width, canvas.height) * 0.15 + basePulse;

            // Draw connecting web/kaleidoscope
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i += 2) {
                const barHeight = dataArray[i];
                if (barHeight === 0) continue;
                
                const rads = (Math.PI * 2 / (bufferLength / 2)) * (i / 2);
                const hue = (i * 2 + time * 0.5) % 360;
                
                const x = centerX + Math.cos(rads + time * 0.005) * baseRadius;
                const y = centerY + Math.sin(rads + time * 0.005) * baseRadius;
                const xEnd = centerX + Math.cos(rads - time * 0.005) * (baseRadius + barHeight * 1.5);
                const yEnd = centerY + Math.sin(rads - time * 0.005) * (baseRadius + barHeight * 1.5);
                
                ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${barHeight / 255})`;
                ctx.lineWidth = 3 + (barHeight / 100);
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                
                // Add bezier curve flare
                const cp1x = centerX + Math.cos(rads) * (baseRadius + barHeight);
                const cp1y = centerY + Math.sin(rads) * (baseRadius + barHeight);
                ctx.quadraticCurveTo(cp1x, cp1y, xEnd, yEnd);
                ctx.stroke();

                // Inner geometry connection
                if (i > 0) {
                    const innerRadsList = rads - Math.PI; // opposite side
                    const innerX = centerX + Math.cos(innerRadsList) * (baseRadius - barHeight * 0.2);
                    const innerY = centerY + Math.sin(innerRadsList) * (baseRadius - barHeight * 0.2);
                    ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 0.1)`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(innerX, innerY);
                    ctx.stroke();
                }
            }
            
            // Core pulsing aura
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${avgBass / 255})`);
            gradient.addColorStop(0.5, `hsla(${(time) % 360}, 100%, 60%, ${avgBass / 500})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
            ctx.fill();
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [audioRef, isPlaying]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundColor: '#0a0a0f' }} />;
};

export const WePlayerApp = ({ fs, launchData, openFilePicker, volume }: any) => {
    const [src, setSrc] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fileType, setFileType] = useState<'video' | 'audio' | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const mediaRef = useRef<HTMLMediaElement>(null);

    useEffect(() => {
        if (launchData?.file) {
            loadFile(launchData.file);
        }
    }, [launchData]);

    useEffect(() => {
        if (mediaRef.current) {
            mediaRef.current.volume = volume / 100;
        }
    }, [volume]);

    const loadFile = (path: string) => {
        const { node } = resolvePath(fs, [], path);
        if (node && node.type === 'file' && node.content) {
            setSrc(node.content);
            const name = path.split('/').pop() || 'Media';
            setFilename(name);
            
            // Determine type
            const ext = name.split('.').pop()?.toLowerCase();
            if (['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext || '')) {
                setFileType('video');
            } else {
                setFileType('audio');
            }
            setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        if (mediaRef.current) {
            if (isPlaying) {
                mediaRef.current.pause();
            } else {
                mediaRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const skipTime = (amount: number) => {
        if (mediaRef.current) {
            mediaRef.current.currentTime = Math.min(Math.max(0, mediaRef.current.currentTime + amount), duration);
        }
    };

    const handleTimeUpdate = () => {
        if (mediaRef.current) {
            setProgress(mediaRef.current.currentTime);
            setDuration(mediaRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (mediaRef.current) {
            mediaRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOpen = () => {
        openFilePicker((path: string) => loadFile(path));
    };

    return (
        <div ref={containerRef} className="h-full bg-black flex flex-col relative group text-white overflow-hidden">
            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 pb-8 to-transparent z-20 flex justify-between items-start transition-opacity duration-300 ${isPlaying && !src?.includes('audio') ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex flex-col">
                    <span className="text-white/60 font-semibold tracking-wider text-[10px] uppercase">Now Playing</span>
                    <span className="text-white text-md font-bold drop-shadow-md truncate max-w-sm">
                        {filename || 'WePlayer'}
                    </span>
                </div>
                <button onClick={handleOpen} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition shadow-lg border border-white/10">
                    Open Media
                </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 flex items-center justify-center relative cursor-pointer" onClick={togglePlay}>
                {!src ? (
                    <div className="text-zinc-600 flex flex-col items-center gap-4 animate-pulse">
                        <FileVideo size={64} className="opacity-50" />
                        <span className="font-medium tracking-wide">No media selected</span>
                    </div>
                ) : fileType === 'video' ? (
                    <video 
                        ref={mediaRef as any}
                        src={src}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                        autoPlay
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full relative cursor-default" onClick={(e) => e.stopPropagation()}>
                        {/* Audio Visualization Background */}
                        <AudioVisualizer audioRef={mediaRef} isPlaying={isPlaying} />
                        
                        <div className="relative z-10 flex flex-col items-center pointer-events-none mt-12">
                            {/* Floating Album Art Placeholder */}
                            <div className={`w-40 h-40 rounded-full bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all duration-[3000ms] ${isPlaying ? 'animate-[spin_10s_linear_infinite] scale-100' : 'scale-95 opacity-80'}`}>
                                <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                                    <Music size={24} className="text-white/50" />
                                </div>
                            </div>
                        </div>

                        <audio 
                            ref={mediaRef as any}
                            src={src}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            autoPlay
                            crossOrigin="anonymous" 
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ${isPlaying && fileType === 'video' ? 'translate-y-full group-hover:translate-y-0' : 'translate-y-0'}`}>
                {/* Gradient fade layer */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                
                <div className="relative z-20 px-4 pb-4 pt-8">
                    {/* Seek Bar */}
                    <div className="flex items-center gap-4 text-xs font-medium font-mono mb-2 group/seek">
                        <span className="w-10 text-right opacity-80">{formatTime(progress)}</span>
                        <div className="flex-1 relative flex items-center h-4 cursor-pointer">
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                value={progress}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            />
                            {/* Custom Track */}
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-75"
                                    style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                                />
                            </div>
                            {/* Hover Thumb */}
                            <div 
                                className="absolute h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                                style={{ left: `calc(${(progress / (duration || 1)) * 100}% - 6px)` }}
                            />
                        </div>
                        <span className="w-10 opacity-80">{formatTime(duration)}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3 opacity-60 hover:opacity-100 transition">
                            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            <div className="w-20 bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{ width: `${volume}%` }} />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <button onClick={() => skipTime(-10)} className="text-white/70 hover:text-white transition hover:-translate-x-1">
                                <SkipBack size={24} />
                            </button>
                            <button 
                                onClick={togglePlay} 
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                            </button>
                            <button onClick={() => skipTime(10)} className="text-white/70 hover:text-white transition hover:translate-x-1">
                                <SkipForward size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 flex justify-end">
                            <button onClick={handleFullscreen} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};