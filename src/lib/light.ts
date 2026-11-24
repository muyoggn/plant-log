// =============================================================
// 部屋の中の「明るさ」を見積もる
//
// 考え方：
//   ・窓に近いほど明るい（窓から 2.5m 離れると、ほぼ窓の光は届かないと考える）
//   ・窓の向きで光の強さが変わる：南 > 東・西 > 北
//   ・窓がいくつかあれば、明るさを足し合わせる
// 明るさを 3 段階に分けて、植物の好み（src/data/plants.ts の lightRange）と比べます。
//   3 = 日なた / 2 = 明るい日陰 / 1 = 日陰
// =============================================================
import type { Compass, Point, Room, RoomWindow, Wall } from "./types";

const walls: Wall[] = ["top", "right", "bottom", "left"];
const compass: Compass[] = ["北", "東", "南", "西"];

// その壁が外に向かってどの方角を向いているか
export function wallFacing(room: Room, wall: Wall): Compass {
  const offset = compass.indexOf(room.topFaces);
  return compass[(walls.indexOf(wall) + offset) % 4];
}

const strength: Record<Compass, number> = { 南: 1, 東: 0.8, 西: 0.8, 北: 0.5 };
const REACH = 250; // 窓の光が届く距離（cm）

// 窓（壁の上の線分）の端から端までの座標
export function windowSegment(room: Room, w: RoomWindow): [Point, Point] {
  const a = w.start;
  const b = w.start + w.length;
  switch (w.wall) {
    case "top":
      return [{ x: a, y: 0 }, { x: b, y: 0 }];
    case "bottom":
      return [{ x: a, y: room.depth }, { x: b, y: room.depth }];
    case "left":
      return [{ x: 0, y: a }, { x: 0, y: b }];
    case "right":
      return [{ x: room.width, y: a }, { x: room.width, y: b }];
  }
}

// 点から線分までのいちばん近い距離
function distToSegment(p: Point, [a, b]: [Point, Point]) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export type LightInfo = {
  value: number; // 明るさ（0〜だいたい 1.5）
  level: 1 | 2 | 3;
  label: string;
  nearest?: { facing: Compass; distance: number }; // いちばん効いている窓
};

export function lightAt(room: Room, p: Point): LightInfo {
  let value = 0;
  let best: { v: number; facing: Compass; distance: number } | undefined;
  for (const w of room.windows) {
    const d = distToSegment(p, windowSegment(room, w));
    const facing = wallFacing(room, w.wall);
    const v = strength[facing] * Math.max(0, 1 - d / REACH);
    value += v;
    if (!best || v > best.v) best = { v, facing, distance: d };
  }
  const level = value >= 0.55 ? 3 : value >= 0.25 ? 2 : 1;
  return {
    value,
    level,
    label: levelLabel(level),
    nearest: best && { facing: best.facing, distance: best.distance },
  };
}

export function levelLabel(level: number) {
  return level >= 3 ? "日なた" : level === 2 ? "明るい日陰" : "日陰";
}

// 植物の好みと比べたひとこと
export function lightAdvice(level: number, range: [number, number]) {
  if (level < range[0]) return { ok: false, text: "この植物には少し暗い場所です。窓に近づけてあげましょう。" };
  if (level > range[1]) return { ok: false, text: "この植物には明るすぎるかもしれません。窓から少し離すか、レースカーテン越しに。" };
  return { ok: true, text: "この植物に合った明るさです。" };
}
