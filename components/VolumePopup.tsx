import React from 'react';

interface VolumePopupProps {
    volume: number;
    setVolume: (v: number) => void;
}

export const VolumePopup = ({ volume, setVolume }: VolumePopupProps) => {
    return (
        <div 
            className="fixed bottom-20 right-12 w-16 h-48 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl flex flex-col items-center justify-end pb-4 pt-2 z-[110] shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex-1 w-full flex items-center justify-center relative">
                 {/* 
                    Rotate -90deg.
                    Standard range is horizontal. width=128px (w-32), height=8px (h-2).
                    When rotated, it becomes a 128px tall column visually.
                 */}
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="absolute w-32 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{ transform: 'rotate(-90deg)' }}
                 />
            </div>
            <div className="mt-4 text-xs font-bold text-white">{volume}%</div>
        </div>
    );
};
