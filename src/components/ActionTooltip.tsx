'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ActionTooltipProps {
  content: string;
  children: React.ReactNode;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  content,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-flex items-center"
    >
      {children}
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
          }}
          className="pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-75"
        >
          <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap leading-tight border border-slate-700/50">
            {content}
          </div>
          <div className="w-0 h-0 border-4 border-t-slate-900 border-x-transparent border-b-transparent" />
        </div>,
        document.body
      )}
    </div>
  );
};
