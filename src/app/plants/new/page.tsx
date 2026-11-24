"use client";
// =============================================================
// 植物の登録ページ
// 「種類」は育て方データ（src/data/plants.ts）から選ぶか、
// 一覧にない植物なら名前を入れて Wikipedia で探します。
// =============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { careProfiles } from "@/data/plants";
import { addPlant } from "@/lib/storage";
import { searchWiki } from "@/lib/wiki";
import { today } from "@/lib/date";
import type { Placement } from "@/lib/types";

const OTHER = "__other";

export default function NewPlant() {
  const router = useRouter();
  const [careId, setCareId] = useState(careProfiles[0].id);
  const [otherName, setOtherName] = useState("");
  const [wikiHits, setWikiHits] = useState<string[] | null>(null);
  const [wikiTitle, setWikiTitle] = useState<string>("");
  const [nickname, setNickname] = useState("");
  const [placement, setPlacement] = useState<Placement>("indoor");
  const [lastWatered, setLastWatered] = useState(today());
  const [notes, setNotes] = useState("");

  const preset = careProfiles.find((p) => p.id === careId);
  const speciesName = preset ? preset.name : otherName.trim();

  async function lookup() {
    if (!otherName.trim()) return;
    setWikiHits(null);
    const hits = await searchWiki(otherName.trim()).catch(() => []);
    setWikiHits(hits);
    setWikiTitle(hits[0] ?? "");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!speciesName) return;
    const id = addPlant({
      nickname: nickname.trim() || speciesName,
      careId: preset?.id,
      speciesName,
      wikiTitle: preset ? preset.wikiTitle : wikiTitle || undefined,
      placement,
      waterings: lastWatered ? [lastWatered] : [],
      notes: notes.trim(),
    });
    router.push(`/plants/${id}`);
  }

  const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-2xl font-semibold">植物を登録</h1>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">種類</span>
        <select className={field} value={careId} onChange={(e) => setCareId(e.target.value)}>
          {careProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value={OTHER}>一覧にない植物…</option>
        </select>
      </label>

      {careId === OTHER && (
        <div className="space-y-2 rounded-lg border border-line p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">植物の名前</span>
            <div className="flex gap-2">
              <input
                className={field}
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="例：アグラオネマ"
              />
              <button type="button" onClick={lookup} className="shrink-0 rounded-lg border border-line px-3 text-sm hover:border-accent">
                Wikipedia で探す
              </button>
            </div>
          </label>
          {wikiHits && wikiHits.length === 0 && (
            <p className="text-sm text-muted">見つかりませんでした。名前だけで登録できます。</p>
          )}
          {wikiHits && wikiHits.length > 0 && (
            <label className="block space-y-1.5">
              <span className="text-sm text-muted">説明に使う記事</span>
              <select className={field} value={wikiTitle} onChange={(e) => setWikiTitle(e.target.value)}>
                {wikiHits.map((t) => (
                  <option key={t}>{t}</option>
                ))}
                <option value="">使わない</option>
              </select>
            </label>
          )}
          <p className="text-xs text-muted">育て方は「ふつうの観葉植物」の目安で計算します。</p>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">呼び名（なくてもOK）</span>
        <input
          className={field}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={speciesName ? `例：リビングの${speciesName.replace(/（.*）/, "")}` : ""}
        />
      </label>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">置き場所</legend>
        <div className="flex gap-3">
          {(
            [
              ["indoor", "室内"],
              ["outdoor", "ベランダ・屋外"],
            ] as const
          ).map(([v, label]) => (
            <label
              key={v}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${placement === v ? "border-accent bg-accent-soft text-accent" : "border-line"}`}
            >
              <input type="radio" className="sr-only" checked={placement === v} onChange={() => setPlacement(v)} />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted">屋外の植物は、雨がたくさん降った日を水やりの代わりとして数えます。</p>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">最後に水やりした日</span>
        <input type="date" className={field} value={lastWatered} max={today()} onChange={(e) => setLastWatered(e.target.value)} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">メモ</span>
        <textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="買った日、鉢の大きさ など" />
      </label>

      <button
        type="submit"
        disabled={!speciesName}
        className="rounded-full bg-accent px-6 py-2.5 font-medium text-background hover:opacity-90 disabled:opacity-40"
      >
        登録する
      </button>
    </form>
  );
}
