import React, { useState, useEffect, useRef } from 'react';

interface DesktopIconProps {
    id: string;
    name: string;
    icon: any;
    color: string;
    initialX: number;
    initialY: number;
    savedPosition?: { x: number, y: number };
    onDoubleClick: () => void;
    onMove: (id: string, x: number, y: number) => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ id, name, icon: Icon, color, initialX, initialY, savedPosition, onDoubleClick, onMove }) => {
    const [position, setPosition] = useState(savedPosition || { x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    useEffect(() => {
        if (savedPosition) {
            setPosition(savedPosition);
        }
    }, [savedPosition]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsDragging(true);
        hasMoved.current = false;
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        hasMoved.current = true;
        setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        if (hasMoved.current) {
            onMove(id, position.x, position.y);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (hasMoved.current) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <div
            className="absolute group flex flex-col items-center gap-1 w-20 text-white p-2 rounded transition-colors hover:bg-white/10 active:scale-95 cursor-pointer select-none touch-none"
            style={{ left: position.x, top: position.y }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleClick}
            onDoubleClick={onDoubleClick}
        >
            <div className={`w-12 h-12 ${color} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform pointer-events-none`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full truncate w-full text-center pointer-events-none">{name}</span>
        </div>
    );
};
