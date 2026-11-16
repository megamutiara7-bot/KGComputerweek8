import React from 'react';
import { ArrowLeft, MousePointerClick, Palette, Volume2 } from 'lucide-react';
import { TOOL_META } from '../data/curriculum';
import { GameMode, Language, PaintTool } from '../types/paint';
import { ToolIllustration } from './ToolIcons';

interface TeacherGuideViewProps {
  language: Language;
  onNavigate: (mode: GameMode) => void;
}

const TOOL_ORDER: PaintTool[] = ['pencil', 'brush', 'spray', 'bucket', 'eraser', 'shape'];

export const TeacherGuideView: React.FC<TeacherGuideViewProps> = ({ language, onNavigate }) => {
  const isId = language === 'id';

  return (
    <main className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-blue-600 mb-1">
            {isId ? 'Panduan Guru & Orang Tua' : 'Teacher & Parent Guide'}
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 text-balance">
            {isId
              ? 'Materi Pengenalan Paint & Alat Warna untuk TK'
              : 'Kindergarten Curriculum: Color Tools & How to Use Paint'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('TITLE_MENU')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isId ? 'Kembali' : 'Back'}</span>
        </button>
      </div>

      {/* Pedagogical goals */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <MousePointerClick className="w-6 h-6 text-blue-600 mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">
            {isId ? 'Motorik Mouse & Sentuh' : 'Mouse & Touch Control'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isId
              ? 'Melatih klik kiri (Ember Cat & Palet Warna) serta klik-dan-geser (Pensil, Kuas, Penghapus).'
              : 'Practices single clicking (Fill Bucket & Color Pots) and click-and-drag coordination (Pencil, Brush, Eraser).'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <Palette className="w-6 h-6 text-emerald-600 mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">
            {isId ? 'Mengenal Warna Dasar' : 'Color Recognition'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isId
              ? 'Anak mencocokkan nama warna (Merah, Kuning, Biru, Hijau) dan mencoba pencampuran warna sederhana.'
              : 'Helps children identify 12 primary and secondary colors and explore basic color mixing recipes.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <Volume2 className="w-6 h-6 text-amber-600 mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">
            {isId ? 'Panduan Suara Otomatis' : 'Audio Instructions'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isId
              ? 'Anak yang belum lancar membaca dapat menekan tombol Dengar untuk mendengarkan perintah suara.'
              : 'Pre-readers can tap the Listen button at any time to hear spoken step instructions.'}
          </p>
        </div>
      </section>

      {/* Tool Breakdown */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6">
          {isId ? 'Fungsi 6 Alat Utama di Paint' : 'The 6 Essential Paint Tools'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TOOL_ORDER.map((tool, index) => {
            const meta = TOOL_META[tool];
            return (
              <div
                key={tool}
                className="flex items-start gap-4 pb-5 border-b border-slate-100 last:border-b-0"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <ToolIllustration tool={tool} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    0{index + 1}. {isId ? `${meta.labelId} (${meta.labelEn})` : meta.labelEn}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {isId ? meta.descId : meta.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {isId
              ? 'Siap mencoba bersama anak? Mulai dari Mode Belajar Alat langkah 1 sampai 6.'
              : 'Ready to begin? Start with Learn Tools step 1 through 6.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('LEARN_TOOLS')}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isId ? 'Mulai Belajar Alat' : 'Start Learn Tools'}
          </button>
        </div>
      </section>
    </main>
  );
};
