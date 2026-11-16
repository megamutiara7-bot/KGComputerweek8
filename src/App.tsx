import { useState } from 'react';
import { PaintWorkspace } from './components/PaintWorkspace';
import { TeacherGuideView } from './components/TeacherGuideView';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { GameMode, Language } from './types/paint';
import { stopSpeaking } from './utils/sound';

export default function App() {
  const [mode, setMode] = useState<GameMode>('TITLE_MENU');
  const [language, setLanguage] = useState<Language>('id');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [starsEarned, setStarsEarned] = useState<number>(0);

  const handleNavigate = (nextMode: GameMode) => {
    stopSpeaking();
    setMode(nextMode);
  };

  const handleEarnStars = (count: number) => {
    setStarsEarned((prev) => prev + count);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <TopBar mode={mode} language={language} onNavigate={handleNavigate} />

      <div className="flex-1">
        {mode === 'TITLE_MENU' && (
          <TitleScreen
            language={language}
            starsEarned={starsEarned}
            onChangeLanguage={setLanguage}
            onSelectMode={handleNavigate}
          />
        )}

        {(mode === 'LEARN_TOOLS' || mode === 'GUIDED_PAINT' || mode === 'FREE_STUDIO') && (
          <PaintWorkspace
            mode={mode}
            language={language}
            soundEnabled={soundEnabled}
            onChangeLanguage={setLanguage}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onEarnStars={handleEarnStars}
            onNavigate={handleNavigate}
          />
        )}

        {mode === 'TEACHER_GUIDE' && (
          <TeacherGuideView language={language} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}
