"use client";
import Link from "next/link";
import type { Place } from "@/lib/types";
import { useWeather, weatherLabel } from "@/lib/weather";
import { today, formatJa } from "@/lib/date";

// 今日の天気と、この先数日の予報を 1 行で見せる部品
export function WeatherStrip({ place }: { place: Place | null }) {
  const { weather, error, loading } = useWeather(place);

  if (!place) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">
        天気に合わせて水やり日を調整するには、
        <Link href="/settings" className="text-accent underline underline-offset-4">
          住んでいる場所を設定
        </Link>
        してください。
      </p>
    );
  }
  if (error) return <p className="text-sm text-warn">{error}</p>;
  if (loading || !weather) return <p className="text-sm text-muted">{place.name}の天気を読み込み中…</p>;

  const now = today();
  const upcoming = weather.days.filter((d) => d.date >= now).slice(0, 5);
  return (
    <section aria-label="天気" className="border-y border-line py-3">
      <p className="mb-2 text-xs text-muted">{place.name}の天気</p>
      <ol className="grid grid-cols-5 gap-2 text-center text-sm">
        {upcoming.map((d) => (
          <li key={d.date} className={d.date === now ? "font-semibold" : ""}>
            <div className="text-xs text-muted">{d.date === now ? "今日" : formatJa(d.date).replace(/^\d+月/, "")}</div>
            <div>{weatherLabel(d.code)}</div>
            <div className="tabular-nums">{Math.round(d.tempMax)}℃</div>
            <div className="text-xs tabular-nums text-muted">湿度{Math.round(d.humidity)}%</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
