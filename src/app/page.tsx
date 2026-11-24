"use client";
// =============================================================
// トップページ：自分の部屋の図に植物を並べて管理する
// ・植物の丸のふちの色 = 水やりの状態（緑：まだ大丈夫 / 青：もうすぐ / 赤：今日・過ぎている）
// ・床の黄色 = 日当たりの目安（濃いほど明るい）
// =============================================================
import { useState } from "react";
import Link from "next/link";
import { useAppData, movePlant } from "@/lib/storage";
import { useWeather } from "@/lib/weather";
import { estimate } from "@/lib/watering";
import { careOf } from "@/lib/care";
import { lightAt } from "@/lib/light";
import { formatJa, today } from "@/lib/date";
import type { Plant, Room } from "@/lib/types";
import { WeatherStrip } from "@/components/WeatherStrip";
import { DueLabel } from "@/components/DueLabel";
import { PlantThumb } from "@/components/PlantThumb";
import { RoomView, type Selection } from "@/components/RoomView";
import { FurniturePanel, PlantPanel, RoomEditor, WindowPanel } from "@/components/RoomPanels";

// 部屋のまだ空いている場所を探す（新しく置く植物が重ならないように）
function freeSpot(room: Room, plants: Plant[]) {
  for (let y = 60; y < room.depth; y += 60)
    for (let x = 60; x < room.width; x += 60)
      if (!plants.some((p) => p.position && Math.hypot(p.position.x - x, p.position.y - y) < 50)) return { x, y };
  return { x: room.width / 2, y: room.depth / 2 };
}

export default function Home() {
  const data = useAppData();
  const { weather } = useWeather(data?.place);
  const [selected, setSelected] = useState<Selection>(null);
  const [editing, setEditing] = useState(false);

  if (!data) return <p className="text-muted">読み込み中…</p>;
  const { room } = data;

  const rows = data.plants.map((p) => {
    const light = p.position ? lightAt(room, p.position).value : undefined;
    const est = estimate(p, careOf(p), weather?.days, undefined, light);
    const status = est.daysLeft <= 0 ? ("due" as const) : est.daysLeft <= 1 ? ("soon" as const) : ("ok" as const);
    return { plant: p, est, status };
  });
  rows.sort((a, b) => a.est.daysLeft - b.est.daysLeft);
  const dueCount = rows.filter((r) => r.est.daysLeft <= 0).length;
  const unplaced = rows.filter((r) => !r.plant.position);

  const sel = selected;
  const selPlant = sel?.kind === "plant" ? rows.find((r) => r.plant.id === sel.id) : undefined;
  const selFurniture = sel?.kind === "furniture" ? room.furniture.find((f) => f.id === sel.id) : undefined;
  const selWindow = sel?.kind === "window" ? room.windows.find((w) => w.id === sel.id) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{formatJa(today())}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {rows.length === 0 ? "植物を登録しましょう" : dueCount > 0 ? `今日は ${dueCount} 鉢に水やり` : "今日の水やりはお休み"}
        </h1>
      </div>

      <WeatherStrip place={data.place} />

      {/* ---------- 部屋 ---------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">わたしの部屋</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(!editing);
              setSelected(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm ${editing ? "border-accent bg-accent text-background" : "border-line hover:border-accent"}`}
          >
            {editing ? "編集を終わる" : "部屋を編集"}
          </button>
        </div>

        <RoomView room={room} plants={rows.map((r) => ({ ...r.plant, status: r.status }))} selected={selected} onSelect={setSelected} editing={editing} />

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-accent align-middle" />まだ大丈夫</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-water align-middle" />明日</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-warn align-middle" />今日・過ぎている</li>
          <li><span className="mr-1 inline-block h-2.5 w-4 align-middle" style={{ background: "var(--light-3)" }} />日なた</li>
          <li><span className="mr-1 inline-block h-2.5 w-4 align-middle" style={{ background: "var(--light-2)" }} />明るい日陰</li>
        </ul>

        {selPlant && <PlantPanel plant={selPlant.plant} est={selPlant.est} room={room} />}
        {selFurniture && <FurniturePanel f={selFurniture} room={room} onDone={() => setSelected(null)} />}
        {selWindow && <WindowPanel w={selWindow} room={room} onDone={() => setSelected(null)} />}
        {editing && <RoomEditor room={room} />}
        {!selected && !editing && rows.length > 0 && (
          <p className="text-xs text-muted">植物の丸をタップすると情報が出ます。ドラッグで置き場所を変えられます。</p>
        )}
      </section>

      {/* ---------- まだ部屋に置いていない植物 ---------- */}
      {unplaced.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted">まだ部屋に置いていない植物</h2>
          <ul className="divide-y divide-line border-y border-line">
            {unplaced.map(({ plant, est }) => (
              <li key={plant.id} className="flex items-center gap-3 py-3">
                <PlantThumb title={plant.wikiTitle} name={plant.nickname} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{plant.nickname}</p>
                  <p className="text-xs text-muted">
                    {plant.placement === "outdoor" ? "ベランダ・屋外" : "室内"}・水やり <DueLabel daysLeft={est.daysLeft} />
                  </p>
                </div>
                {plant.placement === "indoor" && (
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent-soft"
                    onClick={() => {
                      movePlant(plant.id, freeSpot(room, data.plants));
                      setSelected({ kind: "plant", id: plant.id });
                    }}
                  >
                    部屋に置く
                  </button>
                )}
                {plant.placement === "outdoor" && (
                  <Link href={`/plants/${plant.id}`} className="shrink-0 text-sm text-muted underline-offset-4 hover:underline">
                    くわしく
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 && (
        <p className="text-muted">
          まず部屋の広さと窓を「部屋を編集」で合わせてから、
          <Link href="/plants/new" className="text-accent underline underline-offset-4">
            植物を登録
          </Link>
          しましょう。
        </p>
      )}
    </div>
  );
}
