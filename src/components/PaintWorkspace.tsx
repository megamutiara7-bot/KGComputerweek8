import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  FlaskConical,
  RotateCcw,
  SkipForward,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BRUSH_SIZES,
  GUIDED_MISSIONS,
  LEARN_LESSONS,
  mixTwoColors,
  PAINT_COLORS,
  STAMP_LIST,
  TOOL_META,
} from '../data/curriculum';
import {
  BrushSizeKey,
  GameMode,
  Language,
  PaintTool,
  Point,
  ShapeType,
  StampType,
  TemplateId,
} from '../types/paint';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clearCanvasWhite,
  drawLearnLessonCanvas,
  drawShape,
  drawStamp,
  drawTemplateOnCanvas,
  isPixelCleanWhite,
  isPixelNearColor,
  isPixelNotWhite,
  scanlineFloodFill,
} from '../utils/canvasEngine';
import {
  playBucketSound,
  playHintSound,
  playMixSwirlSound,
  playPopSound,
  playSoftPaintTick,
  playStampSound,
  playStepSuccessSound,
  playVictoryFanfare,
  speakInstruction,
  stopSpeaking,
} from '../utils/sound';
import { BuddyMascot, BuddyMood } from './BuddyMascot';
import { CelebrationOverlay } from './CelebrationOverlay';
import { ShapeIcon, StampIcon, ToolIllustration } from './ToolIcons';

interface PaintWorkspaceProps {
  mode: Extract<GameMode, 'LEARN_TOOLS' | 'GUIDED_PAINT' | 'FREE_STUDIO'>;
  language: Language;
  soundEnabled: boolean;
  onChangeLanguage: (lang: Language) => void;
  onToggleSound: () => void;
  onEarnStars: (count: number) => void;
  onNavigate: (mode: GameMode) => void;
}

interface OverlayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'dot' | 'star';
}

const TOOL_LIST: PaintTool[] = ['pencil', 'brush', 'spray', 'bucket', 'eraser', 'shape', 'stamp'];
const SHAPE_LIST: { id: ShapeType; labelId: string; labelEn: string }[] = [
  { id: 'circle', labelId: 'Lingkaran', labelEn: 'Circle' },
  { id: 'square', labelId: 'Kotak', labelEn: 'Square' },
  { id: 'triangle', labelId: 'Segitiga', labelEn: 'Triangle' },
  { id: 'star', labelId: 'Bintang', labelEn: 'Star' },
];

const MAX_UNDO = 20;

export const PaintWorkspace: React.FC<PaintWorkspaceProps> = ({
  mode,
  language,
  soundEnabled,
  onChangeLanguage,
  onToggleSound,
  onEarnStars,
  onNavigate,
}) => {
  const isId = language === 'id';

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const shapeStartRef = useRef<Point | null>(null);
  const shapePreviewEndRef = useRef<Point | null>(null);
  const particlesRef = useRef<OverlayParticle[]>([]);
  const rainbowHueRef = useRef<number>(0);

  // Studio tools state
  const [activeTool, setActiveTool] = useState<PaintTool>('brush');
  const [activeColorId, setActiveColorId] = useState<string>('red');
  const [isRainbowMode, setIsRainbowMode] = useState<boolean>(false);
  const [customMixColor, setCustomMixColor] = useState<{
    hex: string;
    nameId: string;
    nameEn: string;
  } | null>(null);
  const [brushSize, setBrushSize] = useState<BrushSizeKey>('medium');
  const [activeShape, setActiveShape] = useState<ShapeType>('star');
  const [activeStamp, setActiveStamp] = useState<StampType>('flower');
  const [undoCount, setUndoCount] = useState(0);

  // Interactive 2-pot Color Mixing Bowl state
  const [showColorMixer, setShowColorMixer] = useState(false);
  const [mixSlotA, setMixSlotA] = useState<string>('red');
  const [mixSlotB, setMixSlotB] = useState<string>('yellow');
  const [isStirring, setIsStirring] = useState(false);
  const [lastMixBanner, setLastMixBanner] = useState<string | null>(null);

  // Learn mode state
  const [learnIndex, setLearnIndex] = useState(0);
  const [completedLearnIds, setCompletedLearnIds] = useState<string[]>([]);

  // Guided mission state
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionStepIndex, setMissionStepIndex] = useState(0);

  // Free studio template state
  const [freeTemplate, setFreeTemplate] = useState<TemplateId>('blank');

  // Buddy mascot, feedback & Celebration
  const [buddyMood, setBuddyMood] = useState<BuddyMood>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{
    title: string;
    subtitle: string;
    stars: number;
    maxStars: number;
    previewUrl: string | null;
  } | null>(null);

  const activeColorObj = PAINT_COLORS.find((c) => c.id === activeColorId) || PAINT_COLORS[0];
  const currentHex = isRainbowMode
    ? '#EC4899'
    : customMixColor
    ? customMixColor.hex
    : activeColorObj.hex;
  const currentColorLabel = isRainbowMode
    ? isId
      ? 'Warna Pelangi Ajaib'
      : 'Magic Rainbow'
    : customMixColor
    ? isId
      ? customMixColor.nameId
      : customMixColor.nameEn
    : isId
    ? activeColorObj.nameId
    : activeColorObj.nameEn;

  const currentLearnLesson = LEARN_LESSONS[learnIndex];
  const currentMission = GUIDED_MISSIONS[missionIndex];
  const currentMissionStep = currentMission.steps[missionStepIndex];

  const getStrokeHex = useCallback(
    (advanceRainbow = false): string => {
      if (isRainbowMode) {
        if (advanceRainbow) {
          rainbowHueRef.current = (rainbowHueRef.current + 9) % 360;
        }
        return `hsl(${rainbowHueRef.current}, 90%, 54%)`;
      }
      return currentHex;
    },
    [currentHex, isRainbowMode]
  );

  const spawnBurst = useCallback(
    (x: number, y: number, colorList: string[], count = 16, speedScale = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = (1.6 + Math.random() * 3.6) * speedScale;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 4 + Math.random() * 4,
          color: colorList[i % colorList.length],
          life: 0,
          maxLife: 28 + Math.floor(Math.random() * 14),
          kind: i % 3 === 0 ? 'star' : 'dot',
        });
      }
    },
    []
  );

  const spawnConfettiShower = useCallback(() => {
    const confettiColors = ['#EF4444', '#FACC15', '#22C55E', '#38BDF8', '#EC4899', '#9333EA'];
    for (let i = 0; i < 42; i++) {
      particlesRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: -10 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 2.8 + Math.random() * 3.4,
        size: 5 + Math.random() * 4,
        color: confettiColors[i % confettiColors.length],
        life: 0,
        maxLife: 70 + Math.floor(Math.random() * 25),
        kind: i % 2 === 0 ? 'star' : 'dot',
      });
    }
  }, []);

  const pushUndoSnapshot = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const nextStack = [...undoStackRef.current, snap];
    if (nextStack.length > MAX_UNDO) {
      nextStack.shift();
    }
    undoStackRef.current = nextStack;
    setUndoCount(nextStack.length);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const prev = undoStackRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
      setUndoCount(undoStackRef.current.length);
      playPopSound(soundEnabled);
    }
  }, [soundEnabled]);

  // Continuous lightweight animation loop for pulsing target guide, shape drag preview, and particles
  useEffect(() => {
    let rafId = 0;

    const renderOverlayFrame = (time: number) => {
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // 1. Pulsing guide target in Learn & Guided modes
          const pulse = 1 + Math.sin(time * 0.005) * 0.06;

          if (mode === 'LEARN_TOOLS' && currentLearnLesson?.guideTarget) {
            const { x, y, radius, labelId, labelEn } = currentLearnLesson.guideTarget;
            ctx.save();
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.78)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
            const label = isId ? labelId : labelEn;
            const metrics = ctx.measureText(label);
            const pillW = metrics.width + 20;
            const pillX = Math.max(12, Math.min(CANVAS_WIDTH - pillW - 12, x - pillW / 2));
            const pillY = Math.max(12, y - radius - 36);

            ctx.fillStyle = '#2563EB';
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, 24, 6);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, pillX + pillW / 2, pillY + 12.5);
            ctx.restore();
          } else if (mode === 'GUIDED_PAINT' && currentMissionStep) {
            const { x, y } = currentMissionStep.guidePoint;
            const partName = isId ? currentMissionStep.partNameId : currentMissionStep.partNameEn;
            ctx.save();
            ctx.setLineDash([6, 5]);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(37, 99, 235, 0.14)';
            ctx.fill();

            ctx.setLineDash([]);
            ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
            const metrics = ctx.measureText(partName);
            const boxW = metrics.width + 18;
            const boxX = Math.max(10, Math.min(CANVAS_WIDTH - boxW - 10, x - boxW / 2));
            const boxY = y > 65 ? y - 48 : y + 28;

            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, 24, 6);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(partName, boxX + boxW / 2, boxY + 12.5);
            ctx.restore();
          }

          // 2. Live shape drag preview
          if (shapeStartRef.current && shapePreviewEndRef.current && activeTool === 'shape') {
            ctx.save();
            ctx.globalAlpha = 0.72;
            drawShape(
              ctx,
              activeShape,
              shapeStartRef.current,
              shapePreviewEndRef.current,
              currentHex,
              3
            );
            ctx.restore();
          }

          // 3. Tactile particles & confetti
          if (particlesRef.current.length > 0) {
            const remaining: OverlayParticle[] = [];
            for (const p of particlesRef.current) {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.12;
              p.life += 1;
              if (p.life < p.maxLife) {
                const alpha = Math.max(0, 1 - p.life / p.maxLife);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                if (p.kind === 'star') {
                  const spikes = 5;
                  const outer = p.size * 1.15;
                  const inner = outer * 0.45;
                  for (let i = 0; i < spikes * 2; i++) {
                    const ang = (Math.PI / spikes) * i - Math.PI / 2;
                    const r = i % 2 === 0 ? outer : inner;
                    const sx = p.x + Math.cos(ang) * r;
                    const sy = p.y + Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                  }
                  ctx.closePath();
                } else {
                  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.restore();
                remaining.push(p);
              }
            }
            particlesRef.current = remaining;
          }
        }
      }

      rafId = requestAnimationFrame(renderOverlayFrame);
    };

    rafId = requestAnimationFrame(renderOverlayFrame);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeShape,
    activeTool,
    currentHex,
    currentLearnLesson,
    currentMissionStep,
    isId,
    mode,
  ]);

  const resetCanvasForCurrentState = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    undoStackRef.current = [];
    setUndoCount(0);
    setFeedbackMsg(null);
    setBuddyMood('idle');

    if (mode === 'LEARN_TOOLS') {
      drawLearnLessonCanvas(ctx, currentLearnLesson.id);
    } else if (mode === 'GUIDED_PAINT') {
      drawTemplateOnCanvas(ctx, currentMission.id);
    } else {
      drawTemplateOnCanvas(ctx, freeTemplate);
    }
  }, [currentLearnLesson.id, currentMission.id, freeTemplate, mode]);

  useEffect(() => {
    resetCanvasForCurrentState();
  }, [resetCanvasForCurrentState]);

  useEffect(() => {
    if (mode === 'LEARN_TOOLS') {
      if (currentLearnLesson.id === 'lesson-color-palette') {
        setActiveTool('brush');
        setActiveColorId('blue');
        setIsRainbowMode(false);
      }
      setFeedbackMsg(null);
      setBuddyMood('idle');
    } else if (mode === 'GUIDED_PAINT') {
      setActiveTool('bucket');
      setIsRainbowMode(false);
      setFeedbackMsg(null);
      setBuddyMood('idle');
    }
  }, [mode, learnIndex, currentLearnLesson.id]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const currentPromptText = (() => {
    if (mode === 'LEARN_TOOLS') {
      return isId ? currentLearnLesson.instructionId : currentLearnLesson.instructionEn;
    }
    if (mode === 'GUIDED_PAINT') {
      return isId ? currentMissionStep.instructionId : currentMissionStep.instructionEn;
    }
    return isId
      ? 'Pilih alat, stiker, atau warna pelangi lalu gambar sesuka hati!'
      : 'Pick tools, stickers, or rainbow paint and create your masterpiece!';
  })();

  const handleSpeakCurrent = () => {
    setBuddyMood('happy');
    playPopSound(soundEnabled);
    speakInstruction(currentPromptText, language, true);
    setTimeout(() => setBuddyMood('idle'), 900);
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = mainCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const paintSprayAt = (ctx: CanvasRenderingContext2D, pt: Point) => {
    const radius = BRUSH_SIZES[brushSize].px * 1.15;
    ctx.save();
    ctx.fillStyle = getStrokeHex(true);
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const px = pt.x + Math.cos(angle) * dist;
      const py = pt.y + Math.sin(angle) * dist;
      const dotR = 1.2 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const verifyCurrentProgress = useCallback(
    (actionPoint?: Point) => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      if (mode === 'LEARN_TOOLS') {
        const lesson = currentLearnLesson;

        if (lesson.requiredTool && activeTool !== lesson.requiredTool) {
          const toolName = isId
            ? TOOL_META[lesson.requiredTool].labelId
            : TOOL_META[lesson.requiredTool].labelEn;
          setBuddyMood('hint');
          playHintSound(soundEnabled);
          setFeedbackMsg(
            isId
              ? `Coba pilih alat ${toolName} di sebelah kiri dulu ya!`
              : `Try selecting the ${toolName} tool on the left first!`
          );
          return;
        }

        if (lesson.requiredBrushSize && brushSize !== lesson.requiredBrushSize) {
          const sizeLabel = isId
            ? BRUSH_SIZES[lesson.requiredBrushSize].labelId
            : BRUSH_SIZES[lesson.requiredBrushSize].labelEn;
          setBuddyMood('hint');
          playHintSound(soundEnabled);
          setFeedbackMsg(
            isId
              ? `Pilih ukuran kuas ${sizeLabel} (titik terbesar) di panel kiri!`
              : `Pick the ${sizeLabel} brush size dot on the left!`
          );
          return;
        }

        if (
          lesson.requiredColorId &&
          (isRainbowMode || activeColorId !== lesson.requiredColorId)
        ) {
          const targetSwatch = PAINT_COLORS.find((c) => c.id === lesson.requiredColorId);
          const colorName = targetSwatch
            ? isId
              ? targetSwatch.nameId
              : targetSwatch.nameEn
            : '';
          setBuddyMood('hint');
          playHintSound(soundEnabled);
          setFeedbackMsg(
            isId
              ? `Pilih warna ${colorName} di palet bawah dulu ya!`
              : `Pick the ${colorName} color from the palette below!`
          );
          return;
        }

        let passed = false;

        if (lesson.verifyType === 'paint_target_zone') {
          const hits = lesson.samplePoints.filter((pt) =>
            isPixelNearColor(ctx, pt.x, pt.y, '#EF4444', 85)
          ).length;
          passed = hits >= 2;
        } else if (lesson.verifyType === 'trace_path') {
          const hits = lesson.samplePoints.filter((pt) => isPixelNotWhite(ctx, pt.x, pt.y)).length;
          passed = hits >= 2;
        } else if (lesson.verifyType === 'brush_large_zone') {
          const hits = lesson.samplePoints.filter((pt) =>
            isPixelNearColor(ctx, pt.x, pt.y, '#2563EB', 85)
          ).length;
          passed = hits >= 2;
        } else if (lesson.verifyType === 'bucket_fill_region') {
          const hits = lesson.samplePoints.filter((pt) =>
            isPixelNearColor(ctx, pt.x, pt.y, '#FACC15', 85)
          ).length;
          passed = hits >= 2;
        } else if (lesson.verifyType === 'erase_smudge') {
          passed = lesson.samplePoints.every((pt) => isPixelCleanWhite(ctx, pt.x, pt.y));
        } else if (lesson.verifyType === 'place_shape' || lesson.verifyType === 'place_stamp') {
          passed = true;
        }

        if (passed) {
          setFeedbackMsg(null);
          setBuddyMood('happy');
          if (actionPoint) {
            spawnBurst(actionPoint.x, actionPoint.y, ['#FACC15', '#22C55E', '#38BDF8', '#EC4899'], 22, 1.2);
          } else {
            spawnBurst(400, 260, ['#FACC15', '#22C55E', '#38BDF8', '#EC4899'], 22, 1.2);
          }

          if (!completedLearnIds.includes(lesson.id)) {
            setCompletedLearnIds((prev) => [...prev, lesson.id]);
            onEarnStars(1);
          }

          if (learnIndex < LEARN_LESSONS.length - 1) {
            playStepSuccessSound(soundEnabled);
            const successText = isId ? 'Hebat sekali! Lanjut yuk!' : 'Awesome job! Next step!';
            setFeedbackMsg(successText);
            setTimeout(() => {
              setLearnIndex((idx) => Math.min(LEARN_LESSONS.length - 1, idx + 1));
            }, 900);
          } else {
            playVictoryFanfare(soundEnabled);
            spawnConfettiShower();
            setCelebration({
              title: isId ? 'Pintar! Semua Alat Dikuasai!' : 'Awesome! All Tools Mastered!',
              subtitle: isId
                ? 'Kamu sudah bisa memilih warna, memakai Pensil, Kuas, Ember Cat, Penghapus, Bentuk, dan Stiker!'
                : 'You mastered Color Tools, Pencil, Brush, Fill Bucket, Eraser, Shapes, and Stickers!',
              stars: LEARN_LESSONS.length,
              maxStars: LEARN_LESSONS.length,
              previewUrl: canvas.toDataURL('image/png'),
            });
          }
        }
      } else if (mode === 'GUIDED_PAINT') {
        const step = currentMissionStep;
        const targetSwatch = PAINT_COLORS.find((c) => c.id === step.targetColorId);
        if (!targetSwatch) return;

        const allColored = step.samplePoints.every((pt) =>
          isPixelNearColor(ctx, pt.x, pt.y, targetSwatch.hex, 90)
        );

        if (allColored) {
          setFeedbackMsg(null);
          setBuddyMood('happy');
          spawnBurst(
            step.guidePoint.x,
            step.guidePoint.y,
            [targetSwatch.hex, '#FACC15', '#FFFFFF'],
            20,
            1.15
          );

          if (missionStepIndex < currentMission.steps.length - 1) {
            playStepSuccessSound(soundEnabled);
            setFeedbackMsg(
              isId ? 'Bagus sekali! Lanjut bagian berikutnya...' : 'Nice! Moving to next part...'
            );
            setTimeout(() => {
              setMissionStepIndex((idx) => Math.min(currentMission.steps.length - 1, idx + 1));
            }, 750);
          } else {
            playVictoryFanfare(soundEnabled);
            spawnConfettiShower();
            onEarnStars(3);
            setCelebration({
              title: isId
                ? `Karya "${currentMission.titleId}" Selesai!`
                : `"${currentMission.titleEn}" Complete!`,
              subtitle: isId
                ? 'Warna-warnanya rapi dan cerah sekali!'
                : 'Your picture looks bright and wonderful!',
              stars: 3,
              maxStars: 3,
              previewUrl: canvas.toDataURL('image/png'),
            });
          }
        } else {
          const anyNonWhite = step.samplePoints.some((pt) => isPixelNotWhite(ctx, pt.x, pt.y));
          if (anyNonWhite && (isRainbowMode || activeColorId !== step.targetColorId)) {
            const colorName = isId ? targetSwatch.nameId : targetSwatch.nameEn;
            const partName = isId ? step.partNameId : step.partNameEn;
            setBuddyMood('hint');
            playHintSound(soundEnabled);
            setFeedbackMsg(
              isId
                ? `Untuk ${partName}, coba pakai warna ${colorName} ya!`
                : `For ${partName}, try using ${colorName}!`
            );
          }
        }
      }
    },
    [
      activeColorId,
      activeTool,
      brushSize,
      completedLearnIds,
      currentLearnLesson,
      currentMission,
      currentMissionStep,
      isId,
      isRainbowMode,
      learnIndex,
      missionStepIndex,
      mode,
      onEarnStars,
      soundEnabled,
      spawnBurst,
      spawnConfettiShower,
    ]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    setFeedbackMsg(null);
    setBuddyMood('painting');

    if (activeTool === 'bucket') {
      pushUndoSnapshot();
      const fillColor = isRainbowMode ? '#EC4899' : currentHex;
      const filled = scanlineFloodFill(ctx, pt.x, pt.y, fillColor);
      if (filled > 0) {
        playBucketSound(soundEnabled);
        spawnBurst(pt.x, pt.y, [fillColor, '#FACC15', '#38BDF8'], 14, 1);
        verifyCurrentProgress(pt);
      } else {
        undoStackRef.current.pop();
        setUndoCount(undoStackRef.current.length);
        setBuddyMood('hint');
        playHintSound(soundEnabled);
        setFeedbackMsg(
          isId
            ? 'Klik di dalam area putihnya ya, bukan tepat di garis hitam.'
            : 'Click inside the white shape, not on the black outline.'
        );
      }
      return;
    }

    if (activeTool === 'stamp') {
      pushUndoSnapshot();
      const stampScale = brushSize === 'small' ? 0.8 : brushSize === 'medium' ? 1.05 : 1.35;
      drawStamp(ctx, activeStamp, pt.x, pt.y, stampScale);
      playStampSound(soundEnabled);
      spawnBurst(pt.x, pt.y, ['#FACC15', '#EC4899', '#38BDF8', '#22C55E'], 16, 1.1);
      verifyCurrentProgress(pt);
      setTimeout(() => setBuddyMood('idle'), 500);
      return;
    }

    pushUndoSnapshot();
    isDrawingRef.current = true;
    lastPointRef.current = pt;

    if (activeTool === 'shape') {
      shapeStartRef.current = pt;
      shapePreviewEndRef.current = pt;
      return;
    }

    if (activeTool === 'spray') {
      paintSprayAt(ctx, pt);
      playSoftPaintTick(soundEnabled, 3);
      return;
    }

    ctx.save();
    ctx.beginPath();
    const strokeColor = activeTool === 'eraser' ? '#FFFFFF' : getStrokeHex(true);
    const width =
      activeTool === 'pencil'
        ? brushSize === 'small'
          ? 3
          : brushSize === 'medium'
          ? 5
          : 8
        : activeTool === 'eraser'
        ? Math.max(22, BRUSH_SIZES[brushSize].px * 1.45)
        : BRUSH_SIZES[brushSize].px;

    ctx.fillStyle = strokeColor;
    ctx.arc(pt.x, pt.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    playSoftPaintTick(soundEnabled, 0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pt = getCanvasPoint(e);

    if (activeTool === 'shape' && shapeStartRef.current) {
      shapePreviewEndRef.current = pt;
      return;
    }

    if (activeTool === 'spray') {
      paintSprayAt(ctx, pt);
      lastPointRef.current = pt;
      playSoftPaintTick(soundEnabled, Math.floor(pt.x / 40));
      return;
    }

    const prev = lastPointRef.current || pt;
    const strokeColor = activeTool === 'eraser' ? '#FFFFFF' : getStrokeHex(true);
    const width =
      activeTool === 'pencil'
        ? brushSize === 'small'
          ? 3
          : brushSize === 'medium'
          ? 5
          : 8
        : activeTool === 'eraser'
        ? Math.max(22, BRUSH_SIZES[brushSize].px * 1.45)
        : BRUSH_SIZES[brushSize].px;

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    playSoftPaintTick(soundEnabled, Math.floor((pt.x + pt.y) / 50));
    lastPointRef.current = pt;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pt = getCanvasPoint(e);

    if (activeTool === 'shape' && shapeStartRef.current) {
      const shapeColor = getStrokeHex(true);
      drawShape(ctx, activeShape, shapeStartRef.current, pt, shapeColor, 3);
      shapeStartRef.current = null;
      shapePreviewEndRef.current = null;
      playStampSound(soundEnabled);
      spawnBurst(pt.x, pt.y, [shapeColor, '#FACC15'], 14, 1);
    }

    lastPointRef.current = null;
    setBuddyMood('idle');
    verifyCurrentProgress(pt);
  };

  const handleDownloadPng = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paintbuddy-karya.png';
    a.click();
    playPopSound(soundEnabled);
  };

  const handleSelectColor = (colorId: string) => {
    setIsRainbowMode(false);
    setCustomMixColor(null);
    setActiveColorId(colorId);
    setFeedbackMsg(null);
    playPopSound(soundEnabled);
  };

  const handleSelectRainbow = () => {
    setIsRainbowMode(true);
    setCustomMixColor(null);
    setFeedbackMsg(null);
    if (activeTool === 'bucket' || activeTool === 'eraser') {
      setActiveTool('brush');
    }
    playMixSwirlSound(soundEnabled);
  };

  const handleSelectTool = (tool: PaintTool) => {
    setActiveTool(tool);
    setFeedbackMsg(null);
    playPopSound(soundEnabled);
  };

  const handleStirMixColors = () => {
    setIsStirring(true);
    playMixSwirlSound(soundEnabled);
    const result = mixTwoColors(mixSlotA, mixSlotB);

    setTimeout(() => {
      setIsStirring(false);
      setIsRainbowMode(false);
      setCustomMixColor({
        hex: result.hex,
        nameId: result.nameId,
        nameEn: result.nameEn,
      });
      const mixText = isId
        ? `Ajaib! Jadi warna ${result.nameId}!`
        : `Magic! You made ${result.nameEn}!`;
      setLastMixBanner(mixText);
      speakInstruction(mixText, language, soundEnabled);
    }, 450);
  };

  const handleClearCanvas = () => {
    pushUndoSnapshot();
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    if (mode === 'LEARN_TOOLS') {
      drawLearnLessonCanvas(ctx, currentLearnLesson.id);
    } else if (mode === 'GUIDED_PAINT') {
      drawTemplateOnCanvas(ctx, currentMission.id);
    } else if (freeTemplate === 'blank') {
      clearCanvasWhite(ctx);
    } else {
      drawTemplateOnCanvas(ctx, freeTemplate);
    }
    playPopSound(soundEnabled);
  };

  const recommendedTool =
    mode === 'LEARN_TOOLS'
      ? currentLearnLesson.requiredTool
      : mode === 'GUIDED_PAINT'
      ? currentMissionStep.recommendedTool
      : null;

  const recommendedColorId =
    mode === 'LEARN_TOOLS'
      ? currentLearnLesson.requiredColorId
      : mode === 'GUIDED_PAINT'
      ? currentMissionStep.targetColorId
      : null;

  const mixColorA = PAINT_COLORS.find((c) => c.id === mixSlotA) || PAINT_COLORS[0];
  const mixColorB = PAINT_COLORS.find((c) => c.id === mixSlotB) || PAINT_COLORS[2];
  const liveMixPreview = mixTwoColors(mixSlotA, mixSlotB);

  return (
    <main className="max-w-[1360px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Studio Sub-Toolbar with Interactive Bobi Bear Mascot */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-3.5 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <BuddyMascot
            mood={buddyMood}
            beretColor={currentHex}
            onClick={handleSpeakCurrent}
            title={isId ? 'Klik Bobi untuk dengar perintah' : 'Tap Bobi to hear instructions'}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              {mode === 'LEARN_TOOLS' && (
                <>
                  <span className="text-blue-600">
                    {isId ? 'Belajar Alat Paint' : 'Learn Paint Tools'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {isId
                      ? `Langkah ${learnIndex + 1} / ${LEARN_LESSONS.length}`
                      : `Step ${learnIndex + 1} / ${LEARN_LESSONS.length}`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{isId ? currentLearnLesson.titleId : currentLearnLesson.titleEn}</span>
                </>
              )}
              {mode === 'GUIDED_PAINT' && (
                <>
                  <span className="text-emerald-600">
                    {isId ? 'Misi Mewarnai' : 'Guided Paint'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{isId ? currentMission.titleId : currentMission.titleEn}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {isId
                      ? `Bagian ${missionStepIndex + 1} / ${currentMission.steps.length}`
                      : `Part ${missionStepIndex + 1} / ${currentMission.steps.length}`}
                  </span>
                </>
              )}
              {mode === 'FREE_STUDIO' && (
                <>
                  <span className="text-amber-600">
                    {isId ? 'Studio Kanvas Bebas' : 'Free Paint Studio'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{isId ? 'Klik Bobi kapan saja!' : 'Tap Bobi anytime!'}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-display text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentPromptText}
              </p>
              <button
                type="button"
                onClick={handleSpeakCurrent}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer shrink-0"
                title={isId ? 'Bacakan perintah' : 'Read aloud'}
                aria-label={isId ? 'Bacakan perintah' : 'Read aloud'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Workspace Controls: Step Selector + Sound + Language */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {mode === 'LEARN_TOOLS' && (
            <div className="flex items-center gap-1 mr-1" aria-label="Lesson steps">
              {LEARN_LESSONS.map((lesson, idx) => {
                const done = completedLearnIds.includes(lesson.id);
                const active = idx === learnIndex;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setLearnIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold tabular-nums cursor-pointer transition-colors flex items-center justify-center ${
                      active
                        ? 'bg-blue-600 text-white'
                        : done
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={isId ? lesson.titleId : lesson.titleEn}
                  >
                    {done && !active ? <Check className="w-4 h-4" /> : idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          {mode === 'GUIDED_PAINT' && (
            <button
              type="button"
              onClick={() => {
                if (missionStepIndex < currentMission.steps.length - 1) {
                  setMissionStepIndex((s) => s + 1);
                  setFeedbackMsg(null);
                }
              }}
              disabled={missionStepIndex >= currentMission.steps.length - 1}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>{isId ? 'Lewati' : 'Skip'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            title={soundEnabled ? (isId ? 'Suara Aktif' : 'Sound On') : isId ? 'Suara Mati' : 'Sound Off'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span>{isId ? 'Suara' : 'Sound'}</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeLanguage('id')}
              className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                language === 'id' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Mission / Template Picker Strip */}
      {mode === 'GUIDED_PAINT' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {GUIDED_MISSIONS.map((mission, idx) => (
              <button
                key={mission.id}
                type="button"
                onClick={() => {
                  setMissionIndex(idx);
                  setMissionStepIndex(0);
                  setFeedbackMsg(null);
                  playPopSound(soundEnabled);
                }}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  idx === missionIndex
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isId ? mission.titleId : mission.titleEn}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="tabular-nums">
              {isId
                ? `${missionStepIndex} dari ${currentMission.steps.length} selesai`
                : `${missionStepIndex} of ${currentMission.steps.length} done`}
            </span>
          </div>
        </div>
      )}

      {mode === 'FREE_STUDIO' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(
              [
                { id: 'blank', labelId: 'Kertas Kosong', labelEn: 'Blank Paper' },
                { id: 'house', labelId: 'Rumah Ceria', labelEn: 'Sunny House' },
                { id: 'butterfly', labelId: 'Kupu-Kupu', labelEn: 'Butterfly' },
                { id: 'rocket', labelId: 'Roket', labelEn: 'Rocket' },
                { id: 'apple_tree', labelId: 'Pohon Apel', labelEn: 'Apple Tree' },
              ] as { id: TemplateId; labelId: string; labelEn: string }[]
            ).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setFreeTemplate(tpl.id);
                  playPopSound(soundEnabled);
                }}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  freeTemplate === tpl.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isId ? tpl.labelId : tpl.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Tool Dock */}
        <aside
          className="lg:col-span-3 xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col gap-4"
          aria-label={isId ? 'Kotak Alat Paint' : 'Paint Tool Box'}
        >
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2.5">
              {isId ? 'Pilih Alat Paint' : 'Paint Tools'}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-2 gap-2">
              {TOOL_LIST.map((tool) => {
                const isActive = activeTool === tool;
                const isRecommended = recommendedTool === tool && !isActive;
                const label = isId ? TOOL_META[tool].labelId : TOOL_META[tool].labelEn;

                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => handleSelectTool(tool)}
                    className={`relative flex flex-col items-center justify-center gap-1 min-h-[64px] p-2 rounded-xl border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs scale-[1.02]'
                        : isRecommended
                        ? 'bg-amber-50/70 border-amber-400 text-slate-900 hover:bg-amber-50'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95'
                    }`}
                  >
                    <ToolIllustration tool={tool} colorHex={currentHex} className="w-7 h-7" />
                    <span className="text-[11px] font-bold leading-tight text-center whitespace-nowrap">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shape Sub-Picker */}
          {activeTool === 'shape' && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-2">
                {isId ? 'Jenis Bentuk' : 'Choose Shape'}
              </p>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-1.5">
                {SHAPE_LIST.map((shp) => {
                  const active = activeShape === shp.id;
                  return (
                    <button
                      key={shp.id}
                      type="button"
                      onClick={() => {
                        setActiveShape(shp.id);
                        playPopSound(soundEnabled);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ShapeIcon shape={shp.id} className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline lg:hidden xl:inline truncate">
                        {isId ? shp.labelId : shp.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticker Stamp Sub-Picker */}
          {activeTool === 'stamp' && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-2">
                {isId ? 'Pilih Stiker Lucu' : 'Pick a Sticker'}
              </p>
              <div className="grid grid-cols-3 lg:grid-cols-2 gap-1.5">
                {STAMP_LIST.map((stp) => {
                  const active = activeStamp === stp.id;
                  return (
                    <button
                      key={stp.id}
                      type="button"
                      onClick={() => {
                        setActiveStamp(stp.id);
                        playPopSound(soundEnabled);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        active
                          ? 'bg-pink-50 border-pink-500 text-pink-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <StampIcon stamp={stp.id} className="w-5 h-5" />
                      <span className="truncate">{isId ? stp.labelId : stp.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brush / Stamp Size Picker */}
          {activeTool !== 'bucket' && activeTool !== 'shape' && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-2">
                {activeTool === 'stamp'
                  ? isId
                    ? 'Ukuran Stiker'
                    : 'Sticker Size'
                  : isId
                  ? 'Ukuran Kuas'
                  : 'Tool Size'}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(['small', 'medium', 'large'] as BrushSizeKey[]).map((sz) => {
                  const active = brushSize === sz;
                  const dotSize = sz === 'small' ? 6 : sz === 'medium' ? 12 : 18;
                  const mustBeSize =
                    mode === 'LEARN_TOOLS' &&
                    currentLearnLesson.requiredBrushSize === sz &&
                    !active;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setBrushSize(sz);
                        setFeedbackMsg(null);
                        playPopSound(soundEnabled);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        active
                          ? 'bg-blue-50 border-blue-600 text-blue-900'
                          : mustBeSize
                          ? 'bg-amber-50 border-amber-400 text-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isId ? BRUSH_SIZES[sz].labelId : BRUSH_SIZES[sz].labelEn}
                    >
                      <span
                        className="rounded-full bg-slate-800 block"
                        style={{ width: dotSize, height: dotSize }}
                      />
                      <span>{isId ? BRUSH_SIZES[sz].labelId : BRUSH_SIZES[sz].labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Canvas Actions */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 lg:grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoCount === 0}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              <span>{isId ? 'Urungkan' : 'Undo'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearCanvas}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
            >
              {mode === 'FREE_STUDIO' ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>
                {mode === 'FREE_STUDIO' ? (isId ? 'Bersihkan' : 'Clear') : isId ? 'Ulangi' : 'Reset'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isId ? 'Simpan PNG' : 'Save PNG'}</span>
            </button>
          </div>
        </aside>

        {/* Center Drawing Stage + Bottom Color Palette */}
        <section className="lg:col-span-9 xl:col-span-10 flex flex-col gap-4">
          {feedbackMsg && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-900 flex items-center justify-between gap-3"
              role="status"
            >
              <span>{feedbackMsg}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer shrink-0"
              >
                {isId ? 'Tutup' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* Paper Canvas Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-xs">
            <div
              className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white select-none"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            >
              <canvas
                ref={mainCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full block touch-none cursor-crosshair"
              />
              <canvas
                ref={overlayCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
          </div>

          {/* Bottom Color Palette Tray */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg border border-slate-300 shrink-0"
                  style={
                    isRainbowMode
                      ? {
                          background:
                            'linear-gradient(135deg, #EF4444, #FACC15, #22C55E, #38BDF8, #9333EA)',
                        }
                      : { backgroundColor: currentHex }
                  }
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <span className="text-slate-500">{isId ? 'Warna Aktif: ' : 'Active Color: '}</span>
                  <span className="font-bold text-slate-900">{currentColorLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectRainbow}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                    isRainbowMode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isId ? 'Kuas Pelangi' : 'Rainbow Paint'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowColorMixer((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    showColorMixer
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{isId ? 'Mangkuk Campur Warna' : 'Color Mixing Bowl'}</span>
                </button>
              </div>
            </div>

            {/* 12 Big Kindergarten Color Pots */}
            <div
              className="grid grid-cols-6 sm:grid-cols-12 gap-2"
              role="group"
              aria-label={isId ? 'Palet Warna' : 'Color Palette'}
            >
              {PAINT_COLORS.map((swatch) => {
                const isSelected = !isRainbowMode && !customMixColor && activeColorId === swatch.id;
                const isSuggested = recommendedColorId === swatch.id && !isSelected;

                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => handleSelectColor(swatch.id)}
                    title={isId ? swatch.nameId : swatch.nameEn}
                    aria-label={isId ? swatch.nameId : swatch.nameEn}
                    aria-pressed={isSelected}
                    className={`relative h-12 rounded-xl border-2 transition-transform cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isSelected
                        ? '-translate-y-1 border-slate-900 ring-2 ring-blue-500 ring-offset-1'
                        : isSuggested
                        ? 'border-amber-400 ring-2 ring-amber-300 ring-offset-1'
                        : 'border-slate-300 hover:-translate-y-0.5'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-5 h-5 ${swatch.isLight ? 'text-slate-900' : 'text-white'}`}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive 2-Pot Color Mixing Bowl */}
            {showColorMixer && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {isId
                      ? 'Pilih 2 warna lalu tekan Aduk untuk membuat warna baru!'
                      : 'Pick 2 colors and tap Stir to discover a new color!'}
                  </p>
                  {lastMixBanner && (
                    <span className="text-xs font-bold text-emerald-700">{lastMixBanner}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                  {/* Pot 1 selector */}
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">
                      {isId ? '1. Warna Pertama' : '1. First Color'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PAINT_COLORS.slice(0, 8).map((c) => (
                        <button
                          key={`mixA-${c.id}`}
                          type="button"
                          onClick={() => {
                            setMixSlotA(c.id);
                            playPopSound(soundEnabled);
                          }}
                          className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                            mixSlotA === c.id ? 'border-slate-900 scale-110' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={isId ? c.nameId : c.nameEn}
                          aria-label={isId ? c.nameId : c.nameEn}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pot 2 selector */}
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">
                      {isId ? '2. Warna Kedua' : '2. Second Color'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PAINT_COLORS.filter((c) => c.id !== 'black' && c.id !== 'gray').slice(0, 8).map((c) => (
                        <button
                          key={`mixB-${c.id}`}
                          type="button"
                          onClick={() => {
                            setMixSlotB(c.id);
                            playPopSound(soundEnabled);
                          }}
                          className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                            mixSlotB === c.id ? 'border-slate-900 scale-110' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={isId ? c.nameId : c.nameEn}
                          aria-label={isId ? c.nameId : c.nameEn}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stir Action & Result */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-7 h-7 rounded-full border border-slate-300"
                        style={{ backgroundColor: mixColorA.hex }}
                      />
                      <span className="font-bold text-slate-500">+</span>
                      <span
                        className="w-7 h-7 rounded-full border border-slate-300"
                        style={{ backgroundColor: mixColorB.hex }}
                      />
                      <span className="font-bold text-slate-500">=</span>
                      <span
                        className={`w-9 h-9 rounded-xl border-2 border-slate-800 transition-transform ${
                          isStirring ? 'rotate-180 scale-110' : ''
                        }`}
                        style={{ backgroundColor: liveMixPreview.hex }}
                        title={isId ? liveMixPreview.nameId : liveMixPreview.nameEn}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleStirMixColors}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isId ? 'Aduk Warna!' : 'Stir & Use!'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Celebration Modal */}
      {celebration && (
        <CelebrationOverlay
          language={language}
          title={celebration.title}
          subtitle={celebration.subtitle}
          starsEarned={celebration.stars}
          maxStars={celebration.maxStars}
          previewDataUrl={celebration.previewUrl}
          primaryActionLabel={
            mode === 'LEARN_TOOLS'
              ? isId
                ? 'Lanjut ke Misi Mewarnai'
                : 'Go to Guided Paint'
              : missionIndex < GUIDED_MISSIONS.length - 1
              ? isId
                ? 'Gambar Berikutnya'
                : 'Next Picture'
              : isId
              ? 'Buka Kanvas Bebas'
              : 'Open Free Studio'
          }
          onPrimaryAction={() => {
            setCelebration(null);
            if (mode === 'LEARN_TOOLS') {
              onNavigate('GUIDED_PAINT');
            } else if (missionIndex < GUIDED_MISSIONS.length - 1) {
              setMissionIndex((m) => m + 1);
              setMissionStepIndex(0);
            } else {
              onNavigate('FREE_STUDIO');
            }
          }}
          onReplay={() => {
            setCelebration(null);
            if (mode === 'LEARN_TOOLS') {
              setLearnIndex(0);
              setCompletedLearnIds([]);
            } else {
              setMissionStepIndex(0);
            }
            resetCanvasForCurrentState();
          }}
          onDownload={handleDownloadPng}
        />
      )}
    </main>
  );
};
