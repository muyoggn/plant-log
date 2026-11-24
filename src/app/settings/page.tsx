"use client";
// =============================================================
// 場所の設定：天気を調べる地域を、地名で探して選びます
// =============================================================
import { useState } from "react";
import { useAppData, setPlace } from "@/lib/storage";
import { searchPlaces } from "@/lib/weather";
import type { Place } from "@/lib/types";

export default function Settings() {
  const data = useAppData();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Place[] | null>(null);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setError("");
    try {
      setHits(await searchPlaces(q.trim()));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">場所の設定</h1>
      <p className="text-sm text-muted">
        住んでいる市区町村を設定すると、その地域の気温・湿度・雨をもとに水やりの目安を調整します。
      </p>
      <p>
        今の設定：<span className="font-medium">{data?.place?.name ?? "未設定"}</span>
      </p>

      <form onSubmit={search} className="flex gap-2">
        <input
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例：八王子"
          aria-label="地名"
        />
        <button className="shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-background">検索</button>
      </form>
      {error && <p className="text-sm text-warn">{error}</p>}

      {hits && (
        <ul className="divide-y divide-line border-y border-line">
          {hits.length === 0 && <li className="py-3 text-sm text-muted">見つかりませんでした。</li>}
          {hits.map((p) => (
            <li key={`${p.latitude},${p.longitude}`}>
              <button
                type="button"
                className="w-full py-3 text-left hover:text-accent"
                onClick={() => {
                  setPlace(p);
                  setHits(null);
                  setQ("");
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
