import React from 'react';

interface VolumePopupProps {
    volume: number;
    setVolume: (v: number) => void;
}

export const VolumePopup: React.FC<VolumePopupProps> = ({ volume, setVolume }) => {
    return (
        <div 
            className={`fixed bottom-20 right-12 w-16 h-48 backdrop-blur border rounded-xl flex flex-col items-center justify-end pb-4 pt-2 z-[110] shadow-2xl transition-colors bg-slate-900/90 border-slate-700`} 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex-1 w-full flex items-center justify-center relative">
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={`absolute w-32 h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-colors bg-slate-600`}
                    style={{ transform: 'rotate(-90deg)' }}
                 />
            </div>
            <div className={`mt-4 text-xs font-bold transition-colors text-white`}>{volume}%</div>
        </div>
    );
};
