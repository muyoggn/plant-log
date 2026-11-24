"use client";
import { useEffect, useState } from "react";
// =============================================================
// 植物の説明と写真：Wikipedia（ウィキペディア）
// 日本語版 Wikipedia は、記事の「要約」と「写真」を取り出せる窓口（API）を
// 無料で公開しています。これを使って、植物ごとの説明を自動で表示します。
// =============================================================

export type WikiSummary = {
  title: string;
  extract: string; // 記事の最初の段落（要約）
  image?: string; // 写真の URL
  url: string; // 記事ページの URL
};

const memo = new Map<string, WikiSummary | null>();

export async function fetchSummary(title: string): Promise<WikiSummary | null> {
  if (memo.has(title)) return memo.get(title)!;
  const res = await fetch(
    `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  );
  if (!res.ok) {
    memo.set(title, null);
    return null;
  }
  const j = await res.json();
  // 「曖昧さ回避」ページ（同じ名前の記事がいくつもあるときの案内ページ）は説明に使わない
  if (j.type === "disambiguation") {
    memo.set(title, null);
    return null;
  }
  const s: WikiSummary = {
    title: j.title,
    extract: j.extract ?? "",
    image: j.thumbnail?.source,
    url: j.content_urls?.desktop?.page ?? `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
  memo.set(title, s);
  return s;
}

// 植物の名前で Wikipedia の記事を探す（一覧にない植物を登録するとき用）
export async function searchWiki(q: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: q,
    srlimit: "6",
    format: "json",
    origin: "*", // 別のサイト（このアプリ）から呼び出すときのおまじない
  });
  const res = await fetch(`https://ja.wikipedia.org/w/api.php?${params}`);
  if (!res.ok) return [];
  const j = await res.json();
  return (j.query?.search ?? []).map((x: { title: string }) => x.title);
}

// 画面から使うフック。記事名が決まっていれば要約を取ってくる

export function useWikiSummary(title: string | undefined) {
  const [state, setState] = useState<{ title?: string; data?: WikiSummary | null }>({});
  useEffect(() => {
    if (!title) return;
    let alive = true;
    fetchSummary(title)
      .catch(() => null)
      .then((data) => alive && setState({ title, data }));
    return () => {
      alive = false;
    };
  }, [title]);
  return state.title === title ? state.data : undefined;
}
