"use client";
// =============================================================
// 部屋を上から見た図（間取り図）
// SVG（エスブイジー）という「図形を数字で描く」しくみで描いています。
// 座標は cm 単位なので、部屋の広さを変えても自動で拡大・縮小されます。
//
// ・植物の丸はドラッグで動かせます（タップで選択）
// ・編集モードでは、家具と窓もドラッグで動かせます
// ・床の色は、窓からの光の届き方（日当たり）の目安です
// =============================================================
import { useRef, useState } from "react";
import type { Plant, Point, Room, RoomWindow, Wall } from "@/lib/types";
import { movePlant, updateRoom } from "@/lib/storage";
import { lightAt, wallFacing, windowSegment } from "@/lib/light";
import { furnitureName } from "@/data/furniture";

export type Selection = { kind: "plant" | "furniture" | "window"; id: string } | null;

type Props = {
  room: Room;
  plants: (Plant & { status: "ok" | "soon" | "due" })[];
  selected: Selection;
  onSelect: (s: Selection) => void;
  editing: boolean;
};

const PAD = 34; // 部屋の外側の余白（方角の文字を書く場所）
const CELL = 15; // 日当たりのマス目の大きさ（cm）

type Drag = {
  kind: "plant" | "furniture" | "window";
  id: string;
  grab: Point; // つかんだ位置
  orig: Point | number; // 動かす前の位置
  moved: boolean;
  cur: Point;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const wallLength = (room: Room, wall: Wall) => (wall === "top" || wall === "bottom" ? room.width : room.depth);

export function RoomView({ room, plants, selected, onSelect, editing }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  // 画面上の指・マウスの位置を、部屋の cm 座標に変換する
  function toRoom(e: React.PointerEvent): Point {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }

  function startDrag(e: React.PointerEvent, kind: Drag["kind"], id: string, orig: Point | number) {
    e.stopPropagation();
    svg.current!.setPointerCapture(e.pointerId);
    const p = toRoom(e);
    setDrag({ kind, id, grab: p, orig, moved: false, cur: p });
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = toRoom(e);
    const moved = drag.moved || Math.hypot(p.x - drag.grab.x, p.y - drag.grab.y) > 6;
    setDrag({ ...drag, cur: p, moved });
  }

  // ドラッグ中の「仮の位置」を計算する（指を離したときに保存する）
  function dragged<T extends Point | number>(kind: Drag["kind"], id: string, base: T, extra?: RoomWindow): T {
    if (!drag || !drag.moved || drag.kind !== kind || drag.id !== id) return base;
    const dx = drag.cur.x - drag.grab.x;
    const dy = drag.cur.y - drag.grab.y;
    if (kind === "window" && extra) {
      const horizontal = extra.wall === "top" || extra.wall === "bottom";
      const v = (drag.orig as number) + (horizontal ? dx : dy);
      return clamp(v, 0, wallLength(room, extra.wall) - extra.length) as T;
    }
    const o = drag.orig as Point;
    return { x: o.x + dx, y: o.y + dy } as T;
  }

  function onUp() {
    if (!drag) return;
    if (!drag.moved) {
      onSelect({ kind: drag.kind, id: drag.id });
    } else if (drag.kind === "plant") {
      const p = dragged("plant", drag.id, drag.orig as Point);
      movePlant(drag.id, { x: clamp(p.x, 12, room.width - 12), y: clamp(p.y, 12, room.depth - 12) });
      onSelect({ kind: "plant", id: drag.id });
    } else if (drag.kind === "furniture") {
      const f = room.furniture.find((x) => x.id === drag.id)!;
      const p = dragged("furniture", f.id, drag.orig as Point);
      const moved = { ...f, x: clamp(p.x, 0, room.width - f.w), y: clamp(p.y, 0, room.depth - f.h) };
      updateRoom({ furniture: room.furniture.map((x) => (x.id === f.id ? moved : x)) });
      onSelect({ kind: "furniture", id: f.id });
    } else {
      const w = room.windows.find((x) => x.id === drag.id)!;
      const start = dragged("window", w.id, w.start, w);
      updateRoom({ windows: room.windows.map((x) => (x.id === w.id ? { ...w, start: Math.round(start) } : x)) });
      onSelect({ kind: "window", id: w.id });
    }
    setDrag(null);
  }

  // 日当たりのマス目
  const cells: { x: number; y: number; level: number }[] = [];
  for (let y = 0; y < room.depth; y += CELL)
    for (let x = 0; x < room.width; x += CELL)
      cells.push({ x, y, level: lightAt(room, { x: x + CELL / 2, y: y + CELL / 2 }).level });
  const lightFill = ["", "transparent", "var(--light-2)", "var(--light-3)"];

  const isSel = (kind: string, id: string) => selected?.kind === kind && selected.id === id;
  const statusColor = { ok: "var(--accent)", soon: "var(--water)", due: "var(--warn)" };

  return (
    <svg
      ref={svg}
      viewBox={`${-PAD} ${-PAD} ${room.width + PAD * 2} ${room.depth + PAD * 2}`}
      className="w-full select-none"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      role="img"
      aria-label="部屋の間取り図"
    >
      {/* 床と日当たり */}
      <rect x={0} y={0} width={room.width} height={room.depth} fill="var(--surface)" onPointerDown={() => onSelect(null)} />
      {cells.map((c) => (
        <rect
          key={`${c.x},${c.y}`}
          x={c.x}
          y={c.y}
          width={Math.min(CELL, room.width - c.x)}
          height={Math.min(CELL, room.depth - c.y)}
          fill={lightFill[c.level]}
          pointerEvents="none"
        />
      ))}
      {/* 50cm ごとの目盛り線 */}
      {Array.from({ length: Math.floor(room.width / 50) }, (_, i) => (
        <line key={`vx${i}`} x1={(i + 1) * 50} y1={0} x2={(i + 1) * 50} y2={room.depth} stroke="var(--line)" strokeWidth={0.6} pointerEvents="none" />
      ))}
      {Array.from({ length: Math.floor(room.depth / 50) }, (_, i) => (
        <line key={`hy${i}`} x1={0} y1={(i + 1) * 50} x2={room.width} y2={(i + 1) * 50} stroke="var(--line)" strokeWidth={0.6} pointerEvents="none" />
      ))}

      {/* 壁 */}
      <rect x={0} y={0} width={room.width} height={room.depth} fill="none" stroke="var(--foreground)" strokeWidth={5} pointerEvents="none" />

      {/* 方角 */}
      {(["top", "right", "bottom", "left"] as Wall[]).map((w) => {
        const pos = {
          top: { x: room.width / 2, y: -PAD / 2 },
          bottom: { x: room.width / 2, y: room.depth + PAD / 2 },
          left: { x: -PAD / 2, y: room.depth / 2 },
          right: { x: room.width + PAD / 2, y: room.depth / 2 },
        }[w];
        return (
          <text key={w} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fill="var(--muted)">
            {wallFacing(room, w)}
          </text>
        );
      })}

      {/* 家具 */}
      {room.furniture.map((f) => {
        const p = dragged("furniture", f.id, { x: f.x, y: f.y });
        const sel = isSel("furniture", f.id);
        return (
          <g
            key={f.id}
            onPointerDown={editing ? (e) => startDrag(e, "furniture", f.id, { x: f.x, y: f.y }) : undefined}
            style={{ cursor: editing ? "move" : "default", touchAction: editing ? "none" : "auto" }}
            pointerEvents={editing ? "auto" : "none"}
          >
            <rect
              x={p.x}
              y={p.y}
              width={f.w}
              height={f.h}
              rx={4}
              fill="var(--furniture)"
              stroke={sel ? "var(--accent)" : "var(--muted)"}
              strokeWidth={sel ? 3 : 1}
            />
            {f.w >= 40 && f.h >= 20 && (
              <text x={p.x + f.w / 2} y={p.y + f.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="var(--muted)">
                {furnitureName(f.kind)}
              </text>
            )}
          </g>
        );
      })}

      {/* 窓 */}
      {room.windows.map((w) => {
        const start = dragged("window", w.id, w.start, w);
        const [a, b] = windowSegment(room, { ...w, start });
        const sel = isSel("window", w.id);
        return (
          <g
            key={w.id}
            onPointerDown={editing ? (e) => startDrag(e, "window", w.id, w.start) : undefined}
            style={{ cursor: editing ? "move" : "default", touchAction: editing ? "none" : "auto" }}
            pointerEvents={editing ? "auto" : "none"}
          >
            {/* 指でつかみやすいように、透明の太い線を下に敷く */}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={26} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={sel ? "var(--accent)" : "var(--water)"} strokeWidth={9} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--surface)" strokeWidth={2} />
          </g>
        );
      })}

      {/* 植物 */}
      {plants
        .filter((p) => p.position)
        .map((pl) => {
          const p = dragged("plant", pl.id, pl.position!);
          const sel = isSel("plant", pl.id);
          return (
            <g
              key={pl.id}
              onPointerDown={(e) => startDrag(e, "plant", pl.id, pl.position!)}
              style={{ cursor: "grab", touchAction: "none" }}
              aria-label={pl.nickname}
            >
              <circle cx={p.x} cy={p.y} r={sel ? 21 : 18} fill="var(--accent-soft)" stroke={statusColor[pl.status]} strokeWidth={sel ? 5 : 3.5} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill="var(--accent)">
                {pl.nickname.slice(0, 1)}
              </text>
              <text x={p.x} y={p.y > room.depth - 45 ? p.y - 27 : p.y + 32} textAnchor="middle" fontSize={11} fill="var(--foreground)" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}>
                {pl.nickname.length > 8 ? pl.nickname.slice(0, 8) + "…" : pl.nickname}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
