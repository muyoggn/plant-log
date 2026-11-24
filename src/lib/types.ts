// アプリ全体で使う「データの形」を決めておくファイルです。
// TypeScript では、こうして形を決めておくと、書き間違いをエディタが教えてくれます。

export type Placement = "indoor" | "outdoor"; // 室内 か ベランダ・屋外 か

export type Plant = {
  id: string;
  nickname: string; // 自分でつけた呼び名（例：リビングのポトス）
  careId?: string; // 育て方データ（src/data/plants.ts）の id。一覧にない植物は空
  speciesName: string; // 種類の名前
  wikiTitle?: string; // Wikipedia の記事名
  placement: Placement;
  waterings: string[]; // 水やりした日（"2026-11-24" の形）。新しい順
  notes: string;
  createdAt: string;
};

export type Place = {
  name: string; // 表示用の地名
  latitude: number; // 緯度
  longitude: number; // 経度
};

export type AppData = {
  version: 1;
  plants: Plant[];
  place: Place | null; // 天気を調べる場所
};
