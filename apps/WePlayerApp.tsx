import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, FileVideo, Music } from 'lucide-react';
import { resolvePath } from '../utils/fs';

export const WePlayerApp = ({ fs, launchData, openFilePicker, volume }: any) => {
    const [src, setSrc] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fileType, setFileType] = useState<'video' | 'audio' | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    
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
        <div className="h-full bg-black flex flex-col relative group">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-white text-sm font-medium drop-shadow-md">
                    {filename || 'WePlayer'}
                </div>
                <button onClick={handleOpen} className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded backdrop-blur-md transition">
                    Open Media
                </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-900" onClick={togglePlay}>
                {!src ? (
                    <div className="text-zinc-500 flex flex-col items-center gap-2">
                        <FileVideo size={48} />
                        <span>No media selected</span>
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
                    <div className="flex flex-col items-center justify-center gap-6 w-full h-full bg-gradient-to-br from-indigo-900 to-black">
                        <div className={`w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50 transition-all duration-1000 ${isPlaying ? 'animate-pulse scale-105' : 'scale-100'}`}>
                            <Music size={64} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white text-center px-4">{filename}</h2>
                        <audio 
                            ref={mediaRef as any}
                            src={src}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            autoPlay
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-zinc-900/90 backdrop-blur-md p-3 flex flex-col gap-2 border-t border-white/10">
                {/* Seek Bar */}
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span>{formatTime(progress)}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={progress}
                        onChange={handleSeek}
                        className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-6">
                    <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                    </button>
                </div>
            </div>
        </div>
    );
};