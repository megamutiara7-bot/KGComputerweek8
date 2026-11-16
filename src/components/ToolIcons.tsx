import React from 'react';
import { PaintTool, ShapeType } from '../types/paint';

interface ToolIconProps {
  tool: PaintTool;
  colorHex?: string;
  className?: string;
}

export const ToolIllustration: React.FC<ToolIconProps> = ({
  tool,
  colorHex = '#2563EB',
  className = 'w-7 h-7',
}) => {
  switch (tool) {
    case 'pencil':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M24.8 5.2a2.8 2.8 0 0 1 4 0l2 2a2.8 2.8 0 0 1 0 4L14 28l-7.5 1.5L8 22 24.8 5.2Z"
            fill="#FACC15"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M22.2 7.8l6 6" stroke="#1E293B" strokeWidth="2.2" />
          <path d="M8 22l6 6" stroke="#1E293B" strokeWidth="2.2" />
          <path d="M6.5 29.5L8 25l3 3-4.5 1.5Z" fill="#1E293B" />
        </svg>
      );
    case 'brush':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M27.5 5.5a2.5 2.5 0 0 1 3.5 3.5L18.5 21.5l-3.5-3.5L27.5 5.5Z"
            fill="#F97316"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M15 18c-3.5 0-5.5 2.4-6 5.2-.3 1.7-1.6 3.2-3.5 3.8 2.6 1.5 6.4 1.6 9.3-.3 1.9-1.3 2.8-3.2 3.7-5.2L15 18Z"
            fill={colorHex === '#FFFFFF' ? '#38BDF8' : colorHex}
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'spray':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect
            x="14"
            y="13"
            width="13"
            height="17"
            rx="3"
            fill="#E2E8F0"
            stroke="#1E293B"
            strokeWidth="2.2"
          />
          <rect
            x="17"
            y="8"
            width="7"
            height="5"
            rx="1"
            fill="#94A3B8"
            stroke="#1E293B"
            strokeWidth="2.2"
          />
          <circle cx="9" cy="10" r="1.6" fill={colorHex === '#FFFFFF' ? '#2563EB' : colorHex} />
          <circle cx="5.5" cy="14" r="1.6" fill={colorHex === '#FFFFFF' ? '#2563EB' : colorHex} />
          <circle cx="10.5" cy="15" r="1.4" fill={colorHex === '#FFFFFF' ? '#2563EB' : colorHex} />
          <circle cx="6.5" cy="8" r="1.2" fill={colorHex === '#FFFFFF' ? '#2563EB' : colorHex} />
          <circle cx="20.5" cy="21.5" r="3" fill={colorHex === '#FFFFFF' ? '#2563EB' : colorHex} />
        </svg>
      );
    case 'bucket':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M11 16L20 7l9 9-9 9-9-9Z"
            fill="#E2E8F0"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M16 11V7a3 3 0 0 1 6 0v2" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M8.5 22.5c-1.8 2.4-2.5 4.2-2.5 5.5a3 3 0 0 0 6 0c0-1.3-.7-3.1-2.5-5.5a.6.6 0 0 0-1 0Z"
            fill={colorHex === '#FFFFFF' ? '#38BDF8' : colorHex}
            stroke="#1E293B"
            strokeWidth="2"
          />
        </svg>
      );
    case 'eraser':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M17.5 8.5L28 19a2.5 2.5 0 0 1 0 3.5l-6.5 6.5H11L6.5 24.5a2.5 2.5 0 0 1 0-3.5L17.5 8.5Z"
            fill="#F472B6"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M11 29h15" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M12.5 14l9.5 9.5" stroke="#1E293B" strokeWidth="2.2" />
        </svg>
      );
    case 'shape':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <circle
            cx="13"
            cy="14"
            r="6.5"
            fill="#38BDF8"
            stroke="#1E293B"
            strokeWidth="2.2"
          />
          <rect
            x="17"
            y="17"
            width="12"
            height="12"
            rx="2"
            fill="#FACC15"
            stroke="#1E293B"
            strokeWidth="2.2"
          />
        </svg>
      );
  }
};

export const ShapeIcon: React.FC<{ shape: ShapeType; className?: string }> = ({
  shape,
  className = 'w-5 h-5',
}) => {
  switch (shape) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="2.4" />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M12 4.5L20 19H4L12 4.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3.5l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.8l6-.9L12 3.5Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};
