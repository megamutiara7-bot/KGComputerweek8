export type GameMode =
  | 'TITLE_MENU'
  | 'LEARN_TOOLS'
  | 'GUIDED_PAINT'
  | 'FREE_STUDIO'
  | 'TEACHER_GUIDE';

export type PaintTool =
  | 'pencil'
  | 'brush'
  | 'spray'
  | 'bucket'
  | 'eraser'
  | 'shape'
  | 'stamp';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star';

export type StampType = 'sun' | 'flower' | 'heart' | 'rainbow' | 'cloud' | 'butterfly';

export type BrushSizeKey = 'small' | 'medium' | 'large';

export type Language = 'id' | 'en';

export type TemplateId = 'blank' | 'house' | 'butterfly' | 'rocket' | 'apple_tree';

export interface ColorSwatch {
  id: string;
  hex: string;
  nameId: string;
  nameEn: string;
  isLight?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface LearnLesson {
  id: string;
  stepNumber: number;
  titleId: string;
  titleEn: string;
  instructionId: string;
  instructionEn: string;
  hintId: string;
  hintEn: string;
  requiredTool: PaintTool;
  requiredColorId?: string;
  requiredBrushSize?: BrushSizeKey;
  guideTarget?: {
    x: number;
    y: number;
    radius: number;
    labelId: string;
    labelEn: string;
  };
  verifyType:
    | 'paint_target_zone'
    | 'trace_path'
    | 'brush_large_zone'
    | 'bucket_fill_region'
    | 'erase_smudge'
    | 'place_shape'
    | 'place_stamp';
  samplePoints: Point[];
}

export interface MissionStep {
  id: string;
  partNameId: string;
  partNameEn: string;
  instructionId: string;
  instructionEn: string;
  recommendedTool: PaintTool;
  targetColorId: string;
  guidePoint: Point;
  samplePoints: Point[];
}

export interface GuidedMission {
  id: Exclude<TemplateId, 'blank'>;
  titleId: string;
  titleEn: string;
  subtitleId: string;
  subtitleEn: string;
  steps: MissionStep[];
}
