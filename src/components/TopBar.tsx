import React from 'react';
import { GameMode, Language } from '../types/paint';

interface TopBarProps {
  mode: GameMode;
  language: Language;
  onNavigate: (mode: GameMode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ mode, language, onNavigate }) => {
  const isId = language === 'id';

  const navItems: { id: GameMode; label: string }[] = [
    { id: 'TITLE_MENU', label: isId ? 'Beranda' : 'Home' },
    { id: 'LEARN_TOOLS', label: isId ? 'Belajar Alat' : 'Learn Tools' },
    { id: 'GUIDED_PAINT', label: isId ? 'Misi Mewarnai' : 'Guided Paint' },
    { id: 'FREE_STUDIO', label: isId ? 'Kanvas Bebas' : 'Free Studio' },
    { id: 'TEACHER_GUIDE', label: isId ? 'Panduan' : 'Guide' },
  ];

  const handlePrimaryCta = () => {
    if (mode === 'TITLE_MENU' || mode === 'TEACHER_GUIDE') {
      onNavigate('LEARN_TOOLS');
    } else if (mode === 'LEARN_TOOLS') {
      onNavigate('GUIDED_PAINT');
    } else {
      onNavigate('FREE_STUDIO');
    }
  };

  const primaryCtaLabel =
    mode === 'TITLE_MENU' || mode === 'TEACHER_GUIDE'
      ? isId
        ? 'Mulai Belajar'
        : 'Start Learning'
      : mode === 'LEARN_TOOLS'
      ? isId
        ? 'Coba Misi'
        : 'Try Missions'
      : isId
      ? 'Kanvas Baru'
      : 'Free Canvas';

  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('TITLE_MENU')}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded"
        >
          PaintBuddy
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
                  active
                    ? 'text-blue-600 border-blue-600 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {primaryCtaLabel}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        className="flex md:hidden items-center gap-4 overflow-x-auto px-4 py-2 border-t border-slate-100 text-xs font-medium text-slate-600"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                active ? 'text-blue-600 font-semibold underline underline-offset-4' : 'hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
