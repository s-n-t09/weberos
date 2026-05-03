import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
    onDelete?: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ id, name, icon: Icon, color, initialX, initialY, savedPosition, onDoubleClick, onMove, onDelete }) => {
    const [position, setPosition] = useState(savedPosition || { x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    useEffect(() => {
        if (isDragging) return;
        if (savedPosition) {
            setPosition(savedPosition);
        } else {
            setPosition({ x: initialX, y: initialY });
        }
    }, [savedPosition, initialX, initialY, isDragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Stop if clicking the delete button
        if ((e.target as HTMLElement).closest('.delete-btn')) return;

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
            {onDelete && (
                <button
                    className="delete-btn absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <X size={12} strokeWidth={3} />
                </button>
            )}
            <div className={`w-12 h-12 ${color} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform pointer-events-none`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full truncate w-full text-center pointer-events-none">{name}</span>
        </div>
    );
};
