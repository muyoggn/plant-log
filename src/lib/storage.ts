"use client";
// =============================================================
// 記録の保存場所：ブラウザの localStorage
// localStorage は、ブラウザの中にある小さな「メモ帳」です。
// ページを閉じても消えませんが、そのブラウザ（その端末）の中にしか残りません。
// あとで Cloudflare D1（データベース）に移すときは、このファイルの中身を
// 書きかえるだけで済むように、保存まわりの処理をここに集めています。
// =============================================================
import { useSyncExternalStore } from "react";
import type { AppData, Plant, Point, Room } from "./types";
import { today } from "./date";

const KEY = "plant-log:v1";
// はじめて開いたときの部屋：6 畳（360cm × 270cm）、南向きの窓が 1 つ
export const defaultRoom: Room = {
  width: 360,
  depth: 270,
  topFaces: "北",
  windows: [{ id: "w1", wall: "bottom", start: 90, length: 180 }],
  furniture: [],
};
const empty: AppData = { version: 1, plants: [], place: null, room: defaultRoom };

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function read(): AppData {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...empty, ...(JSON.parse(raw) as AppData) } : empty;
  } catch {
    // プライベートモードなどで localStorage が使えないときも、アプリは動くようにする
    cache = empty;
  }
  return cache;
}

function write(next: AppData) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 保存できなくても画面の表示は続ける */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  // 別のタブで記録が変わったときも、画面を最新にする
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

// 画面から使う「フック」。保存データが変わると、自動で画面が描きなおされます。
// サーバー側（localStorage がない場所）では null を返し、「読み込み中」として扱います。
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

// ---------- データを変える操作 ----------

export function addPlant(p: Omit<Plant, "id" | "createdAt">): string {
  const id = crypto.randomUUID();
  const d = read();
  write({ ...d, plants: [...d.plants, { ...p, id, createdAt: today() }] });
  return id;
}

export function updatePlant(id: string, patch: Partial<Plant>) {
  const d = read();
  write({ ...d, plants: d.plants.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function removePlant(id: string) {
  const d = read();
  write({ ...d, plants: d.plants.filter((p) => p.id !== id) });
}

// 「水やりした」を記録する（同じ日に 2 回押しても 1 回分）
export function recordWatering(id: string, day = today()) {
  const p = read().plants.find((x) => x.id === id);
  if (!p) return;
  const days = Array.from(new Set([day, ...p.waterings])).sort().reverse();
  updatePlant(id, { waterings: days });
}

export function removeWatering(id: string, day: string) {
  const p = read().plants.find((x) => x.id === id);
  if (!p) return;
  updatePlant(id, { waterings: p.waterings.filter((d) => d !== day) });
}

export function updateRoom(patch: Partial<Room>) {
  const d = read();
  write({ ...d, room: { ...d.room, ...patch } });
}

// 植物を部屋の中に置く（null で部屋から出す）
export function movePlant(id: string, position: Point | null) {
  updatePlant(id, { position: position ?? undefined });
}

export function setPlace(place: AppData["place"]) {
  write({ ...read(), place });
}
