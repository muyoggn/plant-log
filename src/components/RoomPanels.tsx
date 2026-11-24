"use client";
// 部屋の図の下に出す操作パネル（選んだものの情報・編集）
import Link from "next/link";
import type { Compass, Furniture, Plant, Room, RoomWindow, Wall } from "@/lib/types";
import { movePlant, recordWatering, updateRoom } from "@/lib/storage";
import { lightAdvice, lightAt, wallFacing } from "@/lib/light";
import type { Estimate } from "@/lib/watering";
import { furnitureKinds, furnitureName } from "@/data/furniture";
import { careOf } from "@/lib/care";
import { formatJa, today } from "@/lib/date";
import { MoistureBar } from "./MoistureBar";
import { DueLabel } from "./DueLabel";
import { PlantThumb } from "./PlantThumb";

const btn = "rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent";
const wallName: Record<Wall, string> = { top: "上", right: "右", bottom: "下", left: "左" };

// ---------- 選んだ植物 ----------
export function PlantPanel({ plant, est, room }: { plant: Plant; est: Estimate; room: Room }) {
  const care = careOf(plant);
  const light = plant.position ? lightAt(room, plant.position) : null;
  const advice = light ? lightAdvice(light.level, care.lightRange) : null;
  const wateredToday = plant.waterings[0] === today();
  return (
    <div className="space-y-3 border-y border-line py-4">
      <div className="flex items-center gap-4">
        <PlantThumb title={plant.wikiTitle} name={plant.nickname} size={52} />
        <div className="min-w-0 flex-1">
          <Link href={`/plants/${plant.id}`} className="font-medium underline-offset-4 hover:underline">
            {plant.nickname}
          </Link>
          <p className="truncate text-xs text-muted">{plant.speciesName}</p>
        </div>
        <span className="text-sm">
          <DueLabel daysLeft={est.daysLeft} />
        </span>
      </div>
      <MoistureBar value={est.moisture} />
      <p className="text-sm text-muted">次の水やりは{formatJa(est.dueDate)}ごろ。{est.reason}</p>
      {light && advice && (
        <p className="text-sm">
          <span className="font-medium">{light.label}</span>
          {light.nearest && light.nearest.distance < 400 && (
            <span className="text-muted">（{light.nearest.facing}向きの窓から約{(light.nearest.distance / 100).toFixed(1)}m）</span>
          )}
          <span className={advice.ok ? "text-accent" : "text-warn"}> {advice.text}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => recordWatering(plant.id)}
          disabled={wateredToday}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background disabled:opacity-40"
        >
          {wateredToday ? "今日は水やり済み" : "水やりした"}
        </button>
        <Link href={`/plants/${plant.id}`} className={btn}>
          くわしく
        </Link>
        {plant.position && (
          <button type="button" className={btn} onClick={() => movePlant(plant.id, null)}>
            部屋から出す
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- 選んだ家具 ----------
export function FurniturePanel({ f, room, onDone }: { f: Furniture; room: Room; onDone: () => void }) {
  const set = (next: Furniture | null) =>
    updateRoom({ furniture: next ? room.furniture.map((x) => (x.id === f.id ? next : x)) : room.furniture.filter((x) => x.id !== f.id) });
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-line py-3 text-sm">
      <span className="mr-2 font-medium">{furnitureName(f.kind)}</span>
      <span className="mr-2 text-muted">
        {f.w}×{f.h}cm
      </span>
      <button type="button" className={btn} onClick={() => set({ ...f, w: f.h, h: f.w, x: Math.min(f.x, room.width - f.h), y: Math.min(f.y, room.depth - f.w) })}>
        90°回す
      </button>
      <button
        type="button"
        className={`${btn} hover:text-warn`}
        onClick={() => {
          set(null);
          onDone();
        }}
      >
        削除
      </button>
    </div>
  );
}

// ---------- 選んだ窓 ----------
export function WindowPanel({ w, room, onDone }: { w: RoomWindow; room: Room; onDone: () => void }) {
  const max = w.wall === "top" || w.wall === "bottom" ? room.width : room.depth;
  const set = (next: RoomWindow | null) =>
    updateRoom({ windows: next ? room.windows.map((x) => (x.id === w.id ? next : x)) : room.windows.filter((x) => x.id !== w.id) });
  const resize = (d: number) => {
    const length = Math.max(40, Math.min(max, w.length + d));
    set({ ...w, length, start: Math.min(w.start, max - length) });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-line py-3 text-sm">
      <span className="mr-2 font-medium">{wallFacing(room, w.wall)}向きの窓</span>
      <span className="mr-2 text-muted">幅 {w.length}cm</span>
      <button type="button" className={btn} onClick={() => resize(-30)}>
        せまく
      </button>
      <button type="button" className={btn} onClick={() => resize(30)}>
        広く
      </button>
      <button
        type="button"
        className={`${btn} hover:text-warn`}
        onClick={() => {
          set(null);
          onDone();
        }}
      >
        削除
      </button>
    </div>
  );
}

// ---------- 部屋の編集（広さ・方角・窓と家具の追加） ----------
const presets = [
  { name: "4.5畳", w: 270, d: 270 },
  { name: "6畳", w: 360, d: 270 },
  { name: "8畳", w: 360, d: 360 },
  { name: "10畳", w: 450, d: 360 },
];

export function RoomEditor({ room }: { room: Room }) {
  const id = () => crypto.randomUUID().slice(0, 8);
  const addWindow = (wall: Wall) => {
    const len = wall === "top" || wall === "bottom" ? room.width : room.depth;
    const length = Math.min(120, len);
    updateRoom({ windows: [...room.windows, { id: id(), wall, start: Math.round((len - length) / 2), length }] });
  };
  const addFurniture = (kind: string) => {
    const k = furnitureKinds.find((x) => x.id === kind)!;
    const w = Math.min(k.w, room.width);
    const h = Math.min(k.h, room.depth);
    updateRoom({
      furniture: [...room.furniture, { id: id(), kind, w, h, x: Math.round((room.width - w) / 2), y: Math.round((room.depth - h) / 2) }],
    });
  };
  const setSize = (width: number, depth: number) => {
    width = Math.max(150, Math.min(1000, width));
    depth = Math.max(150, Math.min(1000, depth));
    updateRoom({
      width,
      depth,
      // はみ出した窓や家具を、新しい部屋の中に収める
      windows: room.windows.map((w) => {
        const max = w.wall === "top" || w.wall === "bottom" ? width : depth;
        const length = Math.min(w.length, max);
        return { ...w, length, start: Math.min(w.start, max - length) };
      }),
      furniture: room.furniture.map((f) => ({ ...f, x: Math.min(f.x, Math.max(0, width - f.w)), y: Math.min(f.y, Math.max(0, depth - f.h)) })),
    });
  };
  const field = "w-20 rounded-lg border border-line bg-surface px-2 py-1 text-sm";

  return (
    <div className="space-y-5 rounded-xl border border-line p-4 text-sm">
      <div className="space-y-2">
        <p className="font-medium">部屋の広さ</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.name} type="button" className={btn} onClick={() => setSize(p.w, p.d)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            横
            <input type="number" step={10} className={field} key={`w${room.width}`} defaultValue={room.width} onBlur={(e) => setSize(Number(e.target.value) || room.width, room.depth)} />
          </label>
          <label className="flex items-center gap-1">
            縦
            <input type="number" step={10} className={field} key={`d${room.depth}`} defaultValue={room.depth} onBlur={(e) => setSize(room.width, Number(e.target.value) || room.depth)} />
          </label>
          <span className="text-muted">cm</span>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="font-medium">図の上側はどの方角？</span>
        <select
          className="block rounded-lg border border-line bg-surface px-2 py-1"
          value={room.topFaces}
          onChange={(e) => updateRoom({ topFaces: e.target.value as Compass })}
        >
          {(["北", "東", "南", "西"] as Compass[]).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="block text-xs text-muted">スマホの地図アプリで、部屋の窓がどちらを向いているか確かめると正確です。</span>
      </label>

      <div className="space-y-2">
        <p className="font-medium">窓を足す</p>
        <div className="flex flex-wrap gap-2">
          {(["top", "right", "bottom", "left"] as Wall[]).map((w) => (
            <button key={w} type="button" className={btn} onClick={() => addWindow(w)}>
              {wallName[w]}の壁（{wallFacing(room, w)}）
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium">家具を足す</p>
        <div className="flex flex-wrap gap-2">
          {furnitureKinds.map((k) => (
            <button key={k.id} type="button" className={btn} onClick={() => addFurniture(k.id)}>
              {k.name}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">家具と窓は、図の上でドラッグして動かせます。選ぶと回転・削除ができます。</p>
    </div>
  );
}
