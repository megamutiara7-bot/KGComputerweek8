import { Point, ShapeType, StampType, TemplateId } from '../types/paint';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 520;
const OUTLINE_COLOR = '#1E293B';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function isPixelNearColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  targetHex: string,
  tolerance = 75
): boolean {
  const px = Math.max(0, Math.min(CANVAS_WIDTH - 1, Math.round(x)));
  const py = Math.max(0, Math.min(CANVAS_HEIGHT - 1, Math.round(y)));
  const data = ctx.getImageData(px, py, 1, 1).data;
  const [tr, tg, tb] = hexToRgb(targetHex);
  return colorDistance(data[0], data[1], data[2], tr, tg, tb) <= tolerance;
}

export function isPixelNotWhite(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
  const px = Math.max(0, Math.min(CANVAS_WIDTH - 1, Math.round(x)));
  const py = Math.max(0, Math.min(CANVAS_HEIGHT - 1, Math.round(y)));
  const data = ctx.getImageData(px, py, 1, 1).data;
  return data[0] < 238 || data[1] < 238 || data[2] < 238;
}

export function isPixelCleanWhite(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
  const px = Math.max(0, Math.min(CANVAS_WIDTH - 1, Math.round(x)));
  const py = Math.max(0, Math.min(CANVAS_HEIGHT - 1, Math.round(y)));
  const data = ctx.getImageData(px, py, 1, 1).data;
  return data[0] > 235 && data[1] > 235 && data[2] > 235;
}

/**
 * High-speed scanline flood fill with boundary anti-alias protection.
 * Returns number of pixels filled (0 if user clicked an outline or same color).
 */
export function scanlineFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillHex: string
): number {
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || x0 >= CANVAS_WIDTH || y0 < 0 || y0 >= CANVAS_HEIGHT) return 0;

  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;
  const [fillR, fillG, fillB] = hexToRgb(fillHex);

  const startIdx = (y0 * CANVAS_WIDTH + x0) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];

  // Do not fill dark outline strokes (#1E293B)
  if (startR < 65 && startG < 75 && startB < 90 && fillR + fillG + fillB > 180) {
    return 0;
  }

  // Already filled with nearly identical color
  if (colorDistance(startR, startG, startB, fillR, fillG, fillB) < 12) {
    return 0;
  }

  const tolerance = 48;
  const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

  const matchesStart = (pixelPos: number): boolean => {
    const idx = pixelPos * 4;
    const dr = Math.abs(data[idx] - startR);
    const dg = Math.abs(data[idx + 1] - startG);
    const db = Math.abs(data[idx + 2] - startB);
    return dr <= tolerance && dg <= tolerance && db <= tolerance;
  };

  const setColor = (pixelPos: number) => {
    const idx = pixelPos * 4;
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = 255;
  };

  const stack: number[] = [x0, y0];
  let filledCount = 0;

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;

    let lx = x;
    while (lx >= 0 && !visited[y * CANVAS_WIDTH + lx] && matchesStart(y * CANVAS_WIDTH + lx)) {
      lx--;
    }
    lx++;

    let rx = x;
    while (
      rx < CANVAS_WIDTH &&
      !visited[y * CANVAS_WIDTH + rx] &&
      matchesStart(y * CANVAS_WIDTH + rx)
    ) {
      rx++;
    }
    rx--;

    let spanAbove = false;
    let spanBelow = false;

    for (let cx = lx; cx <= rx; cx++) {
      const pos = y * CANVAS_WIDTH + cx;
      visited[pos] = 1;
      setColor(pos);
      filledCount++;

      if (y > 0) {
        const upPos = (y - 1) * CANVAS_WIDTH + cx;
        const upMatch = !visited[upPos] && matchesStart(upPos);
        if (!spanAbove && upMatch) {
          stack.push(cx, y - 1);
          spanAbove = true;
        } else if (spanAbove && !upMatch) {
          spanAbove = false;
        }
      }

      if (y < CANVAS_HEIGHT - 1) {
        const downPos = (y + 1) * CANVAS_WIDTH + cx;
        const downMatch = !visited[downPos] && matchesStart(downPos);
        if (!spanBelow && downMatch) {
          stack.push(cx, y + 1);
          spanBelow = true;
        } else if (spanBelow && !downMatch) {
          spanBelow = false;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return filledCount;
}

export function clearCanvasWhite(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  start: Point,
  end: Point,
  colorHex: string,
  lineWidth = 4
): void {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);

  // Tap-to-stamp fallback for kindergarteners who click without dragging
  let cx = (start.x + end.x) / 2;
  let cy = (start.y + end.y) / 2;
  let rx = Math.abs(dx) / 2;
  let ry = Math.abs(dy) / 2;

  if (dist < 14) {
    cx = start.x;
    cy = start.y;
    rx = 44;
    ry = 44;
  }

  ctx.save();
  ctx.fillStyle = colorHex;
  ctx.strokeStyle = colorHex === '#FFFFFF' ? '#1E293B' : colorHex;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.beginPath();

  if (shape === 'circle') {
    const r = Math.max(16, Math.max(rx, ry));
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    const w = Math.max(32, rx * 2);
    const h = Math.max(32, ry * 2);
    ctx.rect(cx - w / 2, cy - h / 2, w, h);
  } else if (shape === 'triangle') {
    const w = Math.max(36, rx * 2);
    const h = Math.max(36, ry * 2);
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy + h / 2);
    ctx.closePath();
  } else if (shape === 'star') {
    const outerR = Math.max(24, Math.max(rx, ry));
    const innerR = outerR * 0.45;
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawStamp(
  ctx: CanvasRenderingContext2D,
  stamp: StampType,
  cx: number,
  cy: number,
  scale = 1
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (stamp === 'sun') {
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
      ctx.stroke();
    }
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-8, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 2, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (stamp === 'flower') {
    const petalColors = ['#EC4899', '#F472B6', '#EC4899', '#F472B6', '#EC4899', '#F472B6'];
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.fillStyle = petalColors[i];
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (stamp === 'heart') {
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.bezierCurveTo(-36, 4, -34, -26, -12, -26);
    ctx.bezierCurveTo(-2, -26, 0, -16, 0, -12);
    ctx.bezierCurveTo(0, -16, 2, -26, 12, -26);
    ctx.bezierCurveTo(34, -26, 36, 4, 0, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stamp === 'rainbow') {
    const bands = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#38BDF8'];
    bands.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 14, 38 - i * 6, Math.PI, 0);
      ctx.stroke();
    });
  } else if (stamp === 'cloud') {
    ctx.fillStyle = '#E0F2FE';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-18, 6, 15, Math.PI * 0.5, Math.PI * 1.7);
    ctx.arc(0, -6, 19, Math.PI * 1.05, Math.PI * 1.95);
    ctx.arc(20, 4, 15, Math.PI * 1.3, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stamp === 'butterfly') {
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#A855F7';
    ctx.beginPath();
    ctx.ellipse(-18, -8, 16, 12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(18, -8, 16, 12, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.ellipse(-14, 12, 12, 9, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(14, 12, 12, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(0, 2, 4.5, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStarOutline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  fill: string
) {
  ctx.save();
  ctx.beginPath();
  const innerR = outerR * 0.45;
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

export function drawLearnLessonCanvas(ctx: CanvasRenderingContext2D, lessonId: string): void {
  clearCanvasWhite(ctx);
  ctx.save();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (lessonId === 'lesson-color-palette') {
    // Big Apple Outline in center
    ctx.beginPath();
    ctx.moveTo(400, 215);
    ctx.bezierCurveTo(335, 175, 285, 240, 305, 315);
    ctx.bezierCurveTo(320, 375, 370, 395, 400, 378);
    ctx.bezierCurveTo(430, 395, 480, 375, 495, 315);
    ctx.bezierCurveTo(515, 240, 465, 175, 400, 215);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.stroke();

    // Stem & Leaf
    ctx.beginPath();
    ctx.moveTo(400, 212);
    ctx.quadraticCurveTo(405, 175, 420, 160);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(404, 190);
    ctx.quadraticCurveTo(445, 165, 455, 198);
    ctx.quadraticCurveTo(422, 210, 404, 190);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.stroke();
  } else if (lessonId === 'lesson-pencil') {
    // Two stars connected by dashed dotted path
    ctx.save();
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(215, 260);
    ctx.lineTo(585, 260);
    ctx.stroke();
    ctx.restore();

    drawStarOutline(ctx, 185, 260, 38, '#FACC15');
    drawStarOutline(ctx, 615, 260, 38, '#FACC15');
  } else if (lessonId === 'lesson-brush-size') {
    // Big Pond Oval
    ctx.beginPath();
    ctx.ellipse(400, 290, 175, 105, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.stroke();

    // Cute Lilypad
    ctx.beginPath();
    ctx.arc(495, 265, 28, 0.3, Math.PI * 2 - 0.3);
    ctx.lineTo(495, 265);
    ctx.closePath();
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.stroke();
  } else if (lessonId === 'lesson-bucket') {
    // Closed Sun Circle + separate rays outside
    ctx.beginPath();
    ctx.arc(400, 260, 88, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      ctx.beginPath();
      ctx.moveTo(400 + Math.cos(a) * 108, 260 + Math.sin(a) * 108);
      ctx.lineTo(400 + Math.cos(a) * 136, 260 + Math.sin(a) * 136);
      ctx.stroke();
    }

    // Friendly sun face
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.beginPath();
    ctx.arc(372, 245, 6, 0, Math.PI * 2);
    ctx.arc(428, 245, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(400, 265, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (lessonId === 'lesson-eraser') {
    // Clean picture frame with messy smudge streaks in the middle to erase
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(230, 140, 340, 240);

    // Messy purple & gray scribbles inside
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(335, 225);
    ctx.lineTo(465, 295);
    ctx.moveTo(465, 225);
    ctx.lineTo(335, 295);
    ctx.stroke();

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(350, 260);
    ctx.lineTo(450, 260);
    ctx.stroke();
  } else if (lessonId === 'lesson-shapes') {
    // Light dotted stamp frame
    ctx.save();
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.strokeRect(240, 135, 320, 250);
    ctx.restore();
  } else if (lessonId === 'lesson-stamps') {
    // Grass hill for cute sticker garden
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.quadraticCurveTo(400, 385, 800, 420);
    ctx.lineTo(800, 520);
    ctx.lineTo(0, 520);
    ctx.closePath();
    ctx.fillStyle = '#DCFCE7';
    ctx.fill();
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTemplateOnCanvas(ctx: CanvasRenderingContext2D, templateId: TemplateId): void {
  clearCanvasWhite(ctx);
  if (templateId === 'blank') return;

  ctx.save();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#FFFFFF';

  if (templateId === 'house') {
    // Grass horizon line (full width so sky & grass are cleanly enclosed!)
    ctx.beginPath();
    ctx.moveTo(0, 415);
    ctx.lineTo(CANVAS_WIDTH, 415);
    ctx.stroke();

    // Sun circle (upper left)
    ctx.beginPath();
    ctx.arc(135, 105, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(135 + Math.cos(a) * 64, 105 + Math.sin(a) * 64);
      ctx.lineTo(135 + Math.cos(a) * 82, 105 + Math.sin(a) * 82);
      ctx.stroke();
    }

    // Cloud (upper right)
    ctx.beginPath();
    ctx.moveTo(585, 130);
    ctx.arc(610, 110, 28, Math.PI * 0.85, Math.PI * 1.9);
    ctx.arc(650, 100, 32, Math.PI * 1.1, Math.PI * 2.0);
    ctx.arc(688, 115, 24, Math.PI * 1.3, Math.PI * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // House Walls (closed rectangle sitting on grass line y=415)
    ctx.beginPath();
    ctx.rect(285, 245, 270, 170);
    ctx.fill();
    ctx.stroke();

    // House Roof (closed triangle)
    ctx.beginPath();
    ctx.moveTo(255, 245);
    ctx.lineTo(420, 125);
    ctx.lineTo(585, 245);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Door (closed rectangle sitting on y=415)
    ctx.beginPath();
    ctx.rect(390, 315, 60, 100);
    ctx.fill();
    ctx.stroke();

    // Door knob
    ctx.beginPath();
    ctx.arc(438, 368, 4, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.fill();

    // Window (closed square)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(315, 285, 48, 48);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(339, 285);
    ctx.lineTo(339, 333);
    ctx.moveTo(315, 309);
    ctx.lineTo(363, 309);
    ctx.stroke();
  } else if (templateId === 'butterfly') {
    // Left Top Wing
    ctx.beginPath();
    ctx.moveTo(382, 225);
    ctx.bezierCurveTo(255, 85, 145, 145, 195, 245);
    ctx.bezierCurveTo(225, 290, 330, 270, 382, 248);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Top Wing
    ctx.beginPath();
    ctx.moveTo(418, 225);
    ctx.bezierCurveTo(545, 85, 655, 145, 605, 245);
    ctx.bezierCurveTo(575, 290, 470, 270, 418, 248);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Bottom Wing
    ctx.beginPath();
    ctx.moveTo(382, 258);
    ctx.bezierCurveTo(240, 268, 215, 375, 295, 395);
    ctx.bezierCurveTo(355, 408, 378, 335, 384, 295);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Bottom Wing
    ctx.beginPath();
    ctx.moveTo(418, 258);
    ctx.bezierCurveTo(560, 268, 585, 375, 505, 395);
    ctx.bezierCurveTo(445, 408, 422, 335, 416, 295);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Decorative Wing Circles
    ctx.beginPath();
    ctx.arc(255, 180, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(545, 180, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body Oval
    ctx.beginPath();
    ctx.ellipse(400, 275, 22, 105, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head Circle
    ctx.beginPath();
    ctx.arc(400, 152, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Antennae
    ctx.beginPath();
    ctx.moveTo(388, 128);
    ctx.quadraticCurveTo(360, 82, 338, 92);
    ctx.moveTo(412, 128);
    ctx.quadraticCurveTo(440, 82, 462, 92);
    ctx.stroke();

    // Cute smile
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.beginPath();
    ctx.arc(391, 148, 3.5, 0, Math.PI * 2);
    ctx.arc(409, 148, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (templateId === 'rocket') {
    // Rocket Fins (left & right)
    ctx.beginPath();
    ctx.moveTo(335, 290);
    ctx.lineTo(265, 380);
    ctx.lineTo(338, 368);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(465, 290);
    ctx.lineTo(535, 380);
    ctx.lineTo(462, 368);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Exhaust Flame (closed shape below body)
    ctx.beginPath();
    ctx.moveTo(355, 372);
    ctx.quadraticCurveTo(360, 445, 400, 480);
    ctx.quadraticCurveTo(440, 445, 445, 372);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rocket Main Body (closed)
    ctx.beginPath();
    ctx.moveTo(338, 165);
    ctx.lineTo(462, 165);
    ctx.lineTo(462, 372);
    ctx.lineTo(338, 372);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nose Cone (closed triangle)
    ctx.beginPath();
    ctx.moveTo(338, 165);
    ctx.lineTo(400, 62);
    ctx.lineTo(462, 165);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Porthole Window
    ctx.beginPath();
    ctx.arc(400, 230, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stars & Planet in space
    drawStarOutline(ctx, 155, 130, 26, '#FFFFFF');
    drawStarOutline(ctx, 645, 155, 24, '#FFFFFF');

    ctx.beginPath();
    ctx.arc(165, 340, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (templateId === 'apple_tree') {
    // Grass Line
    ctx.beginPath();
    ctx.moveTo(0, 425);
    ctx.lineTo(CANVAS_WIDTH, 425);
    ctx.stroke();

    // Tree Trunk (closed sitting on grass)
    ctx.beginPath();
    ctx.moveTo(362, 260);
    ctx.lineTo(438, 260);
    ctx.lineTo(452, 425);
    ctx.lineTo(348, 425);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fluffy Tree Canopy (one continuous closed cloud shape)
    ctx.beginPath();
    ctx.moveTo(275, 245);
    ctx.arc(275, 195, 58, Math.PI * 0.55, Math.PI * 1.65);
    ctx.arc(345, 125, 62, Math.PI * 1.0, Math.PI * 1.9);
    ctx.arc(448, 125, 62, Math.PI * 1.1, Math.PI * 2.0);
    ctx.arc(522, 195, 58, Math.PI * 1.35, Math.PI * 0.45);
    ctx.quadraticCurveTo(400, 285, 275, 245);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Three Big Apples inside canopy
    const appleCoords = [
      { x: 335, y: 185 },
      { x: 465, y: 185 },
      { x: 400, y: 235 },
    ];
    appleCoords.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}
