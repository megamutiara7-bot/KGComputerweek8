import React from 'react';
import { Download, RotateCcw, Star } from 'lucide-react';
import { Language } from '../types/paint';

interface CelebrationOverlayProps {
  language: Language;
  title: string;
  subtitle: string;
  starsEarned: number;
  maxStars: number;
  previewDataUrl: string | null;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onReplay: () => void;
  onDownload: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  language,
  title,
  subtitle,
  starsEarned,
  maxStars,
  previewDataUrl,
  primaryActionLabel,
  onPrimaryAction,
  onReplay,
  onDownload,
}) => {
  const isId = language === 'id';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-4" aria-label={`${starsEarned} of ${maxStars} stars`}>
          {Array.from({ length: Math.min(maxStars, 6) }).map((_, i) => (
            <Star
              key={i}
              className={`w-8 h-8 ${
                i < starsEarned ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
              }`}
            />
          ))}
        </div>

        <h2 id="celebration-title" className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mb-5">{subtitle}</p>

        {previewDataUrl && (
          <div className="mb-6 rounded-xl border border-slate-200 overflow-hidden bg-white">
            <img
              src={previewDataUrl}
              alt={isId ? 'Hasil gambar kamu' : 'Your finished artwork'}
              className="w-full h-44 object-contain bg-white"
            />
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="w-full px-5 py-3 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {primaryActionLabel}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isId ? 'Main Lagi' : 'Play Again'}</span>
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isId ? 'Simpan' : 'Save PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
