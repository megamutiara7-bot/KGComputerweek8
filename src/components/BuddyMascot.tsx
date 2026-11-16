import React from 'react';

export type BuddyMood = 'idle' | 'happy' | 'hint' | 'painting';

interface BuddyMascotProps {
  mood: BuddyMood;
  beretColor: string;
  onClick: () => void;
  title: string;
}

export const BuddyMascot: React.FC<BuddyMascotProps> = ({
  mood,
  beretColor,
  onClick,
  title,
}) => {
  const isHappy = mood === 'happy';
  const isHint = mood === 'hint';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`group relative w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:border-blue-400 flex items-center justify-center shrink-0 cursor-pointer transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        isHappy ? '-translate-y-1 scale-105' : 'hover:scale-105 active:scale-95'
      }`}
    >
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        {/* Bear Ears */}
        <circle cx="17" cy="20" r="8" fill="#B45309" stroke="#1E293B" strokeWidth="2.2" />
        <circle cx="17" cy="20" r="4" fill="#FDE68A" />
        <circle cx="47" cy="20" r="8" fill="#B45309" stroke="#1E293B" strokeWidth="2.2" />
        <circle cx="47" cy="20" r="4" fill="#FDE68A" />

        {/* Bear Head */}
        <circle cx="32" cy="35" r="20" fill="#D97706" stroke="#1E293B" strokeWidth="2.2" />

        {/* Muzzle */}
        <ellipse cx="32" cy="40" rx="10" ry="7.5" fill="#FEF3C7" />
        <ellipse cx="32" cy="36.5" rx="3.8" ry="2.6" fill="#1E293B" />

        {/* Eyes */}
        {isHappy ? (
          <>
            <path
              d="M20 31c1.5-2.5 4.5-2.5 6 0"
              stroke="#1E293B"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M38 31c1.5-2.5 4.5-2.5 6 0"
              stroke="#1E293B"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            <circle cx="23" cy="30" r="2.6" fill="#1E293B" />
            <circle cx="41" cy="30" r="2.6" fill="#1E293B" />
            <circle cx="22.2" cy="29.2" r="0.9" fill="#FFFFFF" />
            <circle cx="40.2" cy="29.2" r="0.9" fill="#FFFFFF" />
          </>
        )}

        {/* Cheeks */}
        <circle cx="18.5" cy="37" r="3" fill="#FCA5A5" opacity="0.8" />
        <circle cx="45.5" cy="37" r="3" fill="#FCA5A5" opacity="0.8" />

        {/* Mouth */}
        {isHappy ? (
          <path
            d="M26 41.5c2 3.5 10 3.5 12 0Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="1.8"
          />
        ) : isHint ? (
          <circle cx="32" cy="42.5" r="2.4" fill="#1E293B" />
        ) : (
          <path
            d="M27.5 41.5c1.8 2.2 7.2 2.2 9 0"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Artist Beret matching active paint color */}
        <path
          d="M17 20c3-7 27-7 30 0-5 2-25 2-30 0Z"
          fill={beretColor === '#FFFFFF' ? '#38BDF8' : beretColor}
          stroke="#1E293B"
          strokeWidth="2"
        />
        <line x1="32" y1="12" x2="34" y2="15" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
};
