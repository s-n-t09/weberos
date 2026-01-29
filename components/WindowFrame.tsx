import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { WindowState } from '../types';

interface WindowFrameProps {
    win: WindowState;
    isActive: boolean;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    onFocus: () => void;
    onMove: (x: number, y: number) => void;
    onResize: (w: number, h: number) => void;
    children: any;
    icon?: any;
}

export const WindowFrame = ({ win, isActive, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children, icon: Icon }: WindowFrameProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [startResize, setStartResize] = useState({ w: 0, h: 0, x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onFocus();
    if (win.isMaximized) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setIsDragging(true);
    setDragOffset({ x: clientX - win.position.x, y: clientY - win.position.y });
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onFocus();
    if (win.isMaximized) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setIsResizing(true);
    setStartResize({ w: win.size.w, h: win.size.h, x: clientX, y: clientY });
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging && !isResizing) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (isDragging) {
        onMove(clientX - dragOffset.x, clientY - dragOffset.y);
      } else if (isResizing) {
        onResize(Math.max(300, startResize.w + (clientX - startResize.x)), Math.max(200, startResize.h + (clientY - startResize.y)));
      }
    };

    const handleGlobalUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMove, { passive: false });
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging, isResizing, dragOffset, startResize, onMove, onResize]);

  // FIX: Do not return null here. Return a hidden div to keep component mounted and preserve state (like audio playing).
  const displayStyle = win.isMinimized ? 'none' : 'flex';

  const style: React.CSSProperties = win.isMaximized 
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)' } 
    : { top: win.position.y, left: win.position.x, width: `min(95vw, ${win.size.w}px)`, height: `min(80vh, ${win.size.h}px)` };

  return (
    <div 
      className={`absolute flex-col bg-slate-900/90 backdrop-blur-md rounded-lg shadow-2xlyb border border-slate-700 overflow-hidden transition-all duration-75 ${isActive ? 'ring-1 ring-slate-500 z-50' : 'z-10'}`}
      style={{ ...style, zIndex: win.zIndex, display: displayStyle }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      <div 
        className="h-9 bg-slate-800 flex items-center justify-between px-3 select-none cursor-default shrink-0 touch-none"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={onMaximize}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          {Icon ? <Icon size={14} className="text-slate-400" /> : (children.props.icon && <children.props.icon size={14} className="text-slate-400" />)}
          {win.title}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Square size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative bg-slate-900/50 flex flex-col">
        {children}
      </div>
      {!win.isMaximized && !win.isMinimized && (
        <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center z-50 text-slate-600 hover:text-slate-400 touch-none"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
        >
            <div className="w-0 h-0 border-b-[6px] border-r-[6px] border-l-[6px] border-l-transparent border-b-current border-r-current opacity-50 rotate-0 translate-x-[1px] translate-y-[1px]" />
        </div>
      )}
    </div>
  );
};