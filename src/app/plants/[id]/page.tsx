"use client";
// =============================================================
// 植物の詳しいページ：育て方・Wikipedia の説明・水やりの目安と記録
// URL の [id] の部分に、植物ごとの番号が入ります（例：/plants/abc123）
// =============================================================
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppData, recordWatering, removeWatering, removePlant, updatePlant } from "@/lib/storage";
import { useWeather } from "@/lib/weather";
import { useWikiSummary } from "@/lib/wiki";
import { estimate } from "@/lib/watering";
import { careOf } from "@/lib/care";
import { formatJa, today } from "@/lib/date";
import { MoistureBar } from "@/components/MoistureBar";
import { DueLabel } from "@/components/DueLabel";

export default function PlantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const data = useAppData();
  const { weather } = useWeather(data?.place);
  const plant = data?.plants.find((p) => p.id === id);
  const wiki = useWikiSummary(plant?.wikiTitle);
  const [pastDay, setPastDay] = useState(today());
  const [confirming, setConfirming] = useState(false);

  if (!data) return <p className="text-muted">読み込み中…</p>;
  if (!plant)
    return (
      <div className="space-y-3">
        <p>この植物は見つかりませんでした。</p>
        <Link href="/" className="text-accent underline underline-offset-4">一覧に戻る</Link>
      </div>
    );

  const care = careOf(plant);
  const est = estimate(plant, care, weather?.days);
  const wateredToday = plant.waterings[0] === today();

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Link href="/" className="text-sm text-muted hover:text-foreground">← 一覧</Link>
        <div className="flex gap-5">
          {wiki?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wiki.image} alt={plant.speciesName} className="h-28 w-28 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold">{plant.nickname}</h1>
            <p className="text-sm text-muted">
              {plant.speciesName}
              {"scientific" in care && <span className="italic">（{care.scientific}）</span>}
            </p>
            <p className="text-sm text-muted">{plant.placement === "indoor" ? "室内" : "ベランダ・屋外"}</p>
          </div>
        </div>
      </header>

      {/* ---------- 水やりの目安 ---------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted">次の水やり</h2>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-3xl font-semibold"><DueLabel daysLeft={est.daysLeft} /></span>
          <span className="text-muted">{formatJa(est.dueDate)}ごろ</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted">土の水分の目安</p>
          <MoistureBar value={est.moisture} />
        </div>
        <p className="text-sm leading-relaxed">{est.reason}</p>
        <p className="text-xs text-muted">あくまで目安です。土の表面を指でさわって、乾いていたらあげましょう。</p>
        <button
          type="button"
          onClick={() => recordWatering(plant.id)}
          disabled={wateredToday}
          className="rounded-full bg-accent px-6 py-2.5 font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          {wateredToday ? "今日は水やり済み" : "今日、水やりした"}
        </button>
      </section>

      {/* ---------- 育て方 ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">育て方の目安</h2>
        <dl className="divide-y divide-line border-y border-line text-sm">
          {[
            ["日当たり", care.light],
            ["冬の最低温度", `${care.minTemp}℃ 以上`],
            ["水やり間隔", `暖かい時期 約${care.intervalWarm}日 ／ 寒い時期 約${care.intervalCool}日`],
            ["湿度", care.humidity],
            ["ひとこと", care.tips],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {!plant.careId && <p className="text-xs text-muted">一覧にない植物なので、ふつうの観葉植物の目安を表示しています。</p>}
      </section>

      {/* ---------- Wikipedia の説明 ---------- */}
      {wiki && wiki.extract && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted">どんな植物？</h2>
          <p className="text-sm leading-relaxed">{wiki.extract}</p>
          <a href={wiki.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline underline-offset-4">
            出典：Wikipedia「{wiki.title}」
          </a>
        </section>
      )}

      {/* ---------- 水やりの記録 ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">水やりの記録</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={pastDay}
            max={today()}
            onChange={(e) => setPastDay(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
            aria-label="水やりした日"
          />
          <button
            type="button"
            onClick={() => pastDay && recordWatering(plant.id, pastDay)}
            className="rounded-lg border border-line px-3 text-sm hover:border-accent"
          >
            この日を記録
          </button>
        </div>
        {plant.waterings.length === 0 ? (
          <p className="text-sm text-muted">まだ記録がありません。</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line text-sm">
            {plant.waterings.map((d) => (
              <li key={d} className="flex items-center justify-between py-2">
                <span>{formatJa(d)}</span>
                <button type="button" onClick={() => removeWatering(plant.id, d)} className="text-xs text-muted hover:text-warn">
                  取り消す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- メモ ---------- */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">メモ</h2>
        <textarea
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          rows={3}
          defaultValue={plant.notes}
          onBlur={(e) => updatePlant(plant.id, { notes: e.target.value })}
          placeholder="植え替えた日、気づいたこと など（入力欄から離れると保存されます）"
        />
      </section>

      <div className="border-t border-line pt-6">
        {confirming ? (
          <div className="flex items-center gap-3 text-sm">
            <span>本当に削除しますか？記録も消えます。</span>
            <button
              type="button"
              className="rounded-full bg-warn px-4 py-1.5 text-background"
              onClick={() => {
                removePlant(plant.id);
                router.push("/");
              }}
            >
              削除する
            </button>
            <button type="button" className="text-muted" onClick={() => setConfirming(false)}>やめる</button>
          </div>
        ) : (
          <button type="button" className="text-sm text-muted hover:text-warn" onClick={() => setConfirming(true)}>
            この植物を削除
          </button>
        )}
      </div>
    </article>
  );
}
