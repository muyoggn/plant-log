"use client";
// =============================================================
// 天気の取得：Open-Meteo（オープンメテオ）
// 無料で使える天気のサービスです。登録や API キー（合言葉）がいらず、
// 「緯度・経度」を渡すと、過去と今後の気温・湿度・雨の量を返してくれます。
// https://open-meteo.com/
// =============================================================
import { useEffect, useState } from "react";
import type { Place } from "./types";

export type DayWeather = {
  date: string; // "2026-11-24"
  tempMean: number; // 1 日の平均気温（℃）
  tempMax: number; // 最高気温（℃）
  humidity: number; // 平均湿度（%）
  rain: number; // 降水量（mm）
  code: number; // 天気の種類を表す番号（WMO コード）
};

export type Weather = { days: DayWeather[]; fetchedAt: number };

// 同じ場所の天気を何度も取りに行かないよう、30 分だけ覚えておく
const memo = new Map<string, Weather>();

export async function fetchWeather(place: Place): Promise<Weather> {
  const key = `${place.latitude},${place.longitude}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.fetchedAt < 30 * 60 * 1000) return hit;

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: [
      "temperature_2m_mean",
      "temperature_2m_max",
      "relative_humidity_2m_mean",
      "precipitation_sum",
      "weather_code",
    ].join(","),
    past_days: "60", // 過去 60 日分（前回の水やりからの天気を見るため）
    forecast_days: "7", // 今後 7 日分の予報
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`天気を取得できませんでした（${res.status}）`);
  const json = await res.json();
  const d = json.daily;
  const days: DayWeather[] = (d.time as string[]).map((date, i) => ({
    date,
    tempMean: d.temperature_2m_mean[i],
    tempMax: d.temperature_2m_max[i],
    humidity: d.relative_humidity_2m_mean[i],
    rain: d.precipitation_sum[i] ?? 0,
    code: d.weather_code[i],
  }));
  const w = { days: days.filter((x) => x.tempMean != null), fetchedAt: Date.now() };
  memo.set(key, w);
  return w;
}

// 画面から使うフック。場所が決まっていれば天気を取ってくる
export function useWeather(place: Place | null | undefined) {
  const [state, setState] = useState<{ key: string; weather?: Weather; error?: string }>({ key: "" });
  const key = place ? `${place.latitude},${place.longitude}` : "";

  useEffect(() => {
    if (!place) return;
    let alive = true;
    fetchWeather(place)
      .then((weather) => alive && setState({ key, weather }))
      .catch((e: Error) => alive && setState({ key, error: e.message }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!place) return { weather: undefined, error: undefined, loading: false };
  const fresh = state.key === key;
  return {
    weather: fresh ? state.weather : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
  };
}

// 地名から緯度・経度を探す（Open-Meteo の地名検索）
export async function searchPlaces(name: string): Promise<Place[]> {
  const params = new URLSearchParams({ name, count: "6", language: "ja", format: "json" });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error("地名を検索できませんでした");
  const json = await res.json();
  type Hit = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };
  return ((json.results ?? []) as Hit[]).map((r) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join("、"),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

// WMO の天気コードを日本語に
export function weatherLabel(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 2) return "晴れ";
  if (code === 3) return "くもり";
  if (code <= 48) return "霧";
  if (code <= 57) return "霧雨";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "にわか雨";
  if (code <= 86) return "にわか雪";
  return "雷雨";
}
