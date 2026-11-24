"use client";
// =============================================================
// トップページ：登録した植物の一覧と、次の水やりの目安
// =============================================================
import Link from "next/link";
import { useAppData, recordWatering } from "@/lib/storage";
import { useWeather } from "@/lib/weather";
import { estimate } from "@/lib/watering";
import { careOf } from "@/lib/care";
import { formatJa, today } from "@/lib/date";
import { WeatherStrip } from "@/components/WeatherStrip";
import { MoistureBar } from "@/components/MoistureBar";
import { DueLabel } from "@/components/DueLabel";
import { PlantThumb } from "@/components/PlantThumb";

export default function Home() {
  const data = useAppData();
  const { weather } = useWeather(data?.place);

  if (!data) return <p className="text-muted">読み込み中…</p>;

  // 水やりが近い順に並べる
  const rows = data.plants
    .map((p) => ({ plant: p, est: estimate(p, careOf(p), weather?.days) }))
    .sort((a, b) => a.est.daysLeft - b.est.daysLeft);
  const dueCount = rows.filter((r) => r.est.daysLeft <= 0).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">{formatJa(today())}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {rows.length === 0
            ? "植物を登録しましょう"
            : dueCount > 0
              ? `今日は ${dueCount} 鉢に水やり`
              : "今日の水やりはお休み"}
        </h1>
      </div>

      <WeatherStrip place={data.place} />

      {rows.length === 0 ? (
        <div className="space-y-3 text-muted">
          <p>まだ植物が登録されていません。</p>
          <Link href="/plants/new" className="text-accent underline underline-offset-4">
            最初の 1 鉢を登録する
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map(({ plant, est }) => {
            const wateredToday = plant.waterings[0] === today();
            return (
              <li key={plant.id} className="flex items-center gap-4 py-4">
                <Link href={`/plants/${plant.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <PlantThumb title={plant.wikiTitle} name={plant.nickname} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{plant.nickname}</span>
                      <span className="shrink-0 text-sm">
                        <DueLabel daysLeft={est.daysLeft} />
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted">
                      {plant.speciesName}・{plant.placement === "indoor" ? "室内" : "屋外"}・次は{formatJa(est.dueDate)}
                    </div>
                    <MoistureBar value={est.moisture} />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => recordWatering(plant.id)}
                  disabled={wateredToday}
                  className="shrink-0 rounded-full border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent-soft disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
                >
                  {wateredToday ? "済み" : "水やりした"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
