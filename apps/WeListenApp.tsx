import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { resolvePath } from '../utils/fs';

export const WelistenApp = ({ fs, launchData, openFilePicker, volume }: any) => {
    const [trackSrc, setTrackSrc] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (launchData?.file) {
            const { node } = resolvePath(fs, [], launchData.file);
            if (node && node.type === 'file' && node.content) {
                setTrackSrc(node.content);
                setFilename(launchData.file.split('/').pop());
                setIsPlaying(true);
            }
        }
    }, [launchData, fs]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    useEffect(() => {
        if(audioRef.current) {
            if(isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Autoplay prevented", e);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, trackSrc]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleOpen = () => {
        openFilePicker((path: string) => {
             const { node } = resolvePath(fs, [], path);
             if (node && node.type === 'file' && node.content) {
                setTrackSrc(node.content);
                setFilename(path.split('/').pop() || 'Track');
                setIsPlaying(true);
             }
        });
    };

    return (
        <div className="h-full bg-gradient-to-br from-rose-900 to-slate-900 flex flex-col text-white">
             <div className="bg-black/20 p-2 border-b border-white/10 flex items-center gap-2">
                <button onClick={handleOpen} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition">Open Track</button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={`w-48 h-48 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] flex items-center justify-center mb-8 transition-transform duration-700 ${isPlaying ? 'rotate-180 scale-105' : 'scale-100'}`}>
                    <Music size={64} className="text-white drop-shadow-md" />
                </div>
                
                <h2 className="text-2xl font-bold mb-1 text-center truncate w-full max-w-md">{filename || 'No Track Selected'}</h2>
                <p className="text-white/50 text-sm mb-6">Welisten Music Player</p>

                <audio 
                    ref={audioRef} 
                    src={trackSrc || ''} 
                    loop={isLooping} 
                    onEnded={() => !isLooping && setIsPlaying(false)} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                />

                {/* Timeline */}
                <div className="w-full max-w-md mb-6 flex flex-col gap-1">
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all"
                    />
                    <div className="flex justify-between text-xs text-white/50 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                     <button 
                        onClick={() => setIsLooping(!isLooping)}
                        className={`p-3 rounded-full transition ${isLooping ? 'bg-rose-500 text-white' : 'text-white/50 hover:bg-white/10'}`}
                    >
                        <Repeat size={20} />
                    </button>
                    
                    <button 
                        onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }}
                        className="text-white/70 hover:text-white transition"
                    >
                        <SkipBack size={24} />
                    </button>

                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!trackSrc}
                        className="w-16 h-16 bg-white text-rose-600 rounded-full flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:scale-100 shadow-xl shadow-rose-900/50"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button 
                        onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }}
                        className="text-white/70 hover:text-white transition"
                    >
                        <SkipForward size={24} />
                    </button>

                    <div className="w-10"></div> {/* Spacer balance for Loop button */}
                </div>
            </div>
        </div>
    );
};
