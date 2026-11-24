// =============================================================
// 水やりの目安を計算する（このアプリの心臓部）
//
// 考え方：鉢の土の水分を「ゲージ（100% → 0%）」として想像します。
//   ・水やりした日にゲージは 100%
//   ・毎日、その日の天気に合わせてゲージが減っていく
//       暑い日 → たくさん減る / 寒い日 → 少ししか減らない
//       乾燥した日 → 多めに減る / じめじめした日 → 少なめに減る
//   ・0% になる日が「次の水やりの目安」
//   ・ベランダ・屋外の植物は、雨がたくさん降った日に 100% に戻る
//
// 1 日にどれだけ減るか = 1 ÷（その気温での水やり間隔）× 湿度の補正
// 水やり間隔は、植物ごとの「25℃のときの間隔」と「10℃のときの間隔」の間を、
// その日の気温でなめらかにつないで決めます。
// =============================================================
import type { CareProfile } from "@/data/plants";
import type { Plant } from "./types";
import type { DayWeather } from "./weather";
import { addDays, diffDays, today as todayKey } from "./date";

type Care = Pick<CareProfile, "intervalWarm" | "intervalCool">;

// 天気がわからない日に使う、東京の月ごとの平均気温・湿度（気象庁の平年値をもとにした目安）
const climate = [
  { t: 5.4, h: 51 }, { t: 6.1, h: 52 }, { t: 9.4, h: 57 }, { t: 14.3, h: 62 },
  { t: 18.8, h: 68 }, { t: 21.9, h: 75 }, { t: 25.7, h: 77 }, { t: 26.9, h: 73 },
  { t: 23.3, h: 75 }, { t: 18.0, h: 71 }, { t: 12.5, h: 64 }, { t: 7.7, h: 56 },
];

// 室内は外より気温の上下がおだやか、と考えて外の気温をやわらげる
// （外 0℃ → 室内 10℃、外 30℃ → 室内 25℃ くらい）
function feltTemp(outside: number, plant: Plant) {
  return plant.placement === "indoor" ? 10 + outside * 0.5 : outside;
}

// その気温での「水やり間隔（日）」
export function intervalAt(temp: number, care: Care): number {
  const k = Math.min(1, Math.max(0, (temp - 10) / 15)); // 10℃→0、25℃→1
  let days = care.intervalCool + (care.intervalWarm - care.intervalCool) * k;
  if (temp > 30) days *= 0.85; // 真夏日はさらに乾きやすい
  return days;
}

// 湿度の補正（50% を基準に、乾燥していると早く乾く）
function humidityFactor(h: number) {
  return Math.min(1.25, Math.max(0.8, 1 + (55 - h) / 100));
}

export type DryDay = { date: string; temp: number; loss: number; forecast: boolean; rained: boolean };

export type Estimate = {
  lastWatered: string;
  dueDate: string; // 次の水やりの目安日
  daysLeft: number; // 今日から何日後か（マイナスなら過ぎている）
  moisture: number; // 今日の土の水分ゲージ（0〜1）
  baseInterval: number; // 天気を考えない、季節だけの目安間隔（日）
  usedWeather: boolean;
  resetByRain?: string; // 雨で水分が戻った日
  reason: string; // 画面に出す説明
};

export function estimate(
  plant: Plant,
  care: Care,
  days: DayWeather[] | undefined,
  now = todayKey(),
  light?: number, // 部屋の中の明るさ（src/lib/light.ts）。部屋に置いていなければ空
): Estimate {
  // 明るい場所ほど土が早く乾く、と考える（暗い場所 ×0.85 〜 窓ぎわ ×1.15）
  const lightFactor =
    plant.placement === "indoor" && light !== undefined ? 0.85 + 0.3 * Math.min(1, light) : 1;
  const byDate = new Map((days ?? []).map((d) => [d.date, d]));
  const lastWatered = plant.waterings[0] ?? plant.createdAt;

  const dayInfo = (date: string) => {
    const w = byDate.get(date);
    const month = Number(date.slice(5, 7)) - 1;
    const temp = feltTemp(w ? w.tempMean : climate[month].t, plant);
    const outHum = w ? w.humidity : climate[month].h;
    // 室内の湿度も、外ほどではないけれど天気につられて上下すると考える
    const hum = plant.placement === "indoor" ? 50 + (outHum - 50) * 0.5 : outHum;
    const loss = (1 / intervalAt(temp, care)) * humidityFactor(hum) * lightFactor;
    const rained = plant.placement === "outdoor" && !!w && w.rain >= 5;
    return { date, temp, loss, forecast: date > now, rained, known: !!w };
  };

  // 前回の水やりの次の日から、1 日ずつゲージを減らしていく
  let water = 1;
  let moistureToday = 1;
  let dueDate = "";
  let resetByRain: string | undefined;
  let date = lastWatered;
  for (let i = 0; i < 120 && !dueDate; i++) {
    date = addDays(date, 1);
    const d = dayInfo(date);
    if (d.rained && date <= now) {
      water = 1;
      resetByRain = date;
      continue;
    }
    water -= d.loss;
    if (date === now) moistureToday = water;
    if (water <= 0) dueDate = date;
  }
  if (lastWatered >= now) moistureToday = 1;
  if (!dueDate) dueDate = date;
  // 目安日を過ぎても記録がない場合、ゲージは 0% のまま
  if (dueDate < now) moistureToday = 0;

  const nowInfo = dayInfo(now);
  const baseInterval = Math.round(intervalAt(feltTemp(climate[Number(now.slice(5, 7)) - 1].t, plant), care));
  const actual = diffDays(resetByRain ?? lastWatered, dueDate);
  const usedWeather = !!days?.length;

  let reason: string;
  if (!usedWeather) {
    reason = `今の季節の平均的な気温で計算しています（約${baseInterval}日おき）。場所を設定すると、実際の天気で調整します。`;
  } else {
    const gap = actual - baseInterval;
    const feel = nowInfo.temp >= 25 ? "暑い" : nowInfo.temp <= 12 ? "寒い" : "過ごしやすい";
    if (Math.abs(gap) <= 0) reason = `${feel}日が多く、季節どおりのペースです（約${baseInterval}日おき）。`;
    else if (gap < 0) reason = `季節の目安は約${baseInterval}日ですが、気温が高め・空気が乾きぎみなので${-gap}日早めです。`;
    else reason = `季節の目安は約${baseInterval}日ですが、気温が低め・湿度が高めなので${gap}日ゆっくりです。`;
    if (lightFactor >= 1.08) reason += "窓ぎわの明るい場所なので、少し乾きやすくしています。";
    if (lightFactor <= 0.92) reason += "部屋の奥の暗めの場所なので、少し乾きにくくしています。";
    if (resetByRain) reason += `（${Number(resetByRain.slice(8))}日の雨で水分が戻ったと考えています）`;
  }

  return {
    lastWatered,
    dueDate,
    daysLeft: diffDays(now, dueDate),
    moisture: Math.max(0, Math.min(1, moistureToday)),
    baseInterval,
    usedWeather,
    resetByRain,
    reason,
  };
}
