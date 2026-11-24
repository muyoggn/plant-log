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
  position?: Point; // 部屋の中の位置（cm）。まだ置いていなければ空
};

export type Place = {
  name: string; // 表示用の地名
  latitude: number; // 緯度
  longitude: number; // 経度
};

// ---------- 部屋 ----------
// 部屋は「上から見た図（間取り図）」として、cm 単位の長方形で表します。
// 左上が (0, 0)。右に行くほど x が、下に行くほど y が大きくなります。

export type Point = { x: number; y: number };

export type Wall = "top" | "right" | "bottom" | "left";
export type Compass = "北" | "東" | "南" | "西";

export type RoomWindow = {
  id: string;
  wall: Wall; // どの壁にあるか
  start: number; // 壁の端から何 cm のところから始まるか
  length: number; // 窓の幅（cm）
};

export type Furniture = {
  id: string;
  kind: string; // 家具の種類（src/data/furniture.ts の id）
  x: number;
  y: number;
  w: number; // 横幅（cm）
  h: number; // 奥行き（cm）
};

export type Room = {
  width: number; // 横幅（cm）
  depth: number; // 縦の長さ（cm）
  topFaces: Compass; // 図の「上の壁」がどの方角を向いているか
  windows: RoomWindow[];
  furniture: Furniture[];
};

export type AppData = {
  version: 1;
  plants: Plant[];
  place: Place | null; // 天気を調べる場所
  room: Room;
};
