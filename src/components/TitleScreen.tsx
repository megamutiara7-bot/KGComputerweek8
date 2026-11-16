import React, { useState } from 'react';
import { BookOpen, Brush, CheckCircle2, Palette, Sparkles } from 'lucide-react';
import { GameMode, Language } from '../types/paint';

interface TitleScreenProps {
  language: Language;
  starsEarned: number;
  onChangeLanguage: (lang: Language) => void;
  onSelectMode: (mode: GameMode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  starsEarned,
  onChangeLanguage,
  onSelectMode,
}) => {
  const [imgError, setImgError] = useState(false);
  const isId = language === 'id';

  const modeCards: {
    mode: GameMode;
    step: string;
    title: string;
    desc: string;
    cta: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      mode: 'LEARN_TOOLS',
      step: '01',
      title: isId ? 'Kenali Alat Warna & Paint' : 'Learn Color & Paint Tools',
      desc: isId
        ? '6 langkah seru mencoba Palet Warna, Pensil, Kuas, Ember Cat, Penghapus, dan Bentuk.'
        : '6 fun steps to try Color Palette, Pencil, Brush, Fill Bucket, Eraser, and Shapes.',
      cta: isId ? 'Mulai Belajar' : 'Start Lesson',
      icon: <Palette className="w-6 h-6 text-blue-600" />,
      accent: 'hover:border-blue-300',
    },
    {
      mode: 'GUIDED_PAINT',
      step: '02',
      title: isId ? 'Misi Mewarnai Gambar' : 'Guided Paint Missions',
      desc: isId
        ? 'Warnai Rumah Ceria, Kupu-Kupu, Roket, dan Pohon Apel mengikuti petunjuk warna.'
        : 'Color Sunny House, Butterfly, Rocket, and Apple Tree with step-by-step color clues.',
      cta: isId ? 'Pilih Gambar' : 'Pick Picture',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      accent: 'hover:border-emerald-300',
    },
    {
      mode: 'FREE_STUDIO',
      step: '03',
      title: isId ? 'Studio Kanvas Bebas' : 'Free Paint Studio',
      desc: isId
        ? 'Berkreasi bebas menggambar, mencampur warna, menempel bentuk, dan simpan hasil karya.'
        : 'Draw freely, mix bright colors, stamp shapes, and save your masterpiece as PNG.',
      cta: isId ? 'Buka Kanvas' : 'Open Canvas',
      icon: <Brush className="w-6 h-6 text-amber-600" />,
      accent: 'hover:border-amber-300',
    },
  ];

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Compact Workspace Language Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>{isId ? 'Materi Komputer TK' : 'Kindergarten Computer Lesson'}</span>
          <span aria-hidden="true">·</span>
          <span>Try to use color tools &amp; how to use Paint</span>
          {starsEarned > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-600 tabular-nums">
                {starsEarned} {isId ? 'Bintang Terkumpul' : 'Stars Earned'}
              </span>
            </>
          )}
        </div>

        <div
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Language switcher"
        >
          <button
            type="button"
            onClick={() => onChangeLanguage('id')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              language === 'id'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Hero Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-3">
              {isId ? 'Studio Belajar Paint untuk Anak TK' : 'Kindergarten Computer Art Studio'}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight text-balance mb-4">
              {isId
                ? 'Ayo Belajar Alat Warna & Cara Menggunakan Paint'
                : 'Try Color Tools and Learn How to Use Paint'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
              {isId
                ? 'Latih tangan si kecil menggunakan mouse atau sentuhan jari untuk memilih warna, memakai kuas, mengisi warna dengan ember cat, menghapus, dan membuat bentuk.'
                : 'Practice mouse and touch skills while picking bright colors, painting with brushes, filling shapes with the Paint Bucket, erasing, and stamping fun shapes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onSelectMode('LEARN_TOOLS')}
              className="px-6 py-3.5 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isId ? 'Mulai Belajar Alat Paint' : 'Start Tool Lessons'}
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('FREE_STUDIO')}
              className="px-6 py-3.5 text-base font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isId ? 'Langsung Menggambar' : 'Open Free Canvas'}
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('TEACHER_GUIDE')}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isId ? 'Panduan Guru & Orang Tua' : 'Teacher & Parent Guide'}</span>
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center min-h-[280px]">
          {!imgError ? (
            <img
              src="/src/assets/images/title_paint_studio_1794798388576.jpg"
              alt={
                isId
                  ? 'Beruang kecil melukis matahari tersenyum di atas papan lukis dengan cat warna-warni'
                  : 'Friendly bear painting a smiling sun on an art easel with colorful paint pots'
              }
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-12 h-12 text-amber-500 mb-3" />
              <p className="font-display text-lg font-bold text-slate-800">PaintBuddy Studio</p>
              <p className="text-sm text-slate-500 mt-1">
                {isId ? 'Siap melukis dan mengenal warna!' : 'Ready to paint and explore colors!'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Three Learning Modes */}
      <section aria-label={isId ? 'Pilihan Mode Permainan' : 'Game Modes'}>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            {isId ? 'Pilih Cara Bermain' : 'Choose Your Activity'}
          </h2>
          <span className="text-sm text-slate-500">
            {isId ? 'Cocok untuk usia 4–6 tahun' : 'Designed for ages 4–6'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modeCards.map((card) => (
            <button
              key={card.mode}
              type="button"
              onClick={() => onSelectMode(card.mode)}
              className={`group text-left bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${card.accent}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="font-display text-sm font-bold text-slate-400 tabular-nums">
                    {card.step}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{card.desc}</p>
              </div>
              <span className="inline-flex items-center text-sm font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                {card.cta} →
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};
