// 部屋に置ける家具の種類。サイズは一般的な大きさ（cm）です。
// ここに 1 行足すと、編集モードで選べる家具が増えます。
export type FurnitureKind = { id: string; name: string; w: number; h: number };

export const furnitureKinds: FurnitureKind[] = [
  { id: "bed", name: "ベッド", w: 100, h: 200 },
  { id: "sofa", name: "ソファ", w: 160, h: 80 },
  { id: "desk", name: "机", w: 110, h: 60 },
  { id: "table", name: "テーブル", w: 90, h: 60 },
  { id: "shelf", name: "棚", w: 80, h: 35 },
  { id: "tv", name: "テレビ台", w: 120, h: 40 },
  { id: "closet", name: "クローゼット", w: 120, h: 60 },
  { id: "door", name: "ドア", w: 80, h: 10 },
];

export function furnitureName(id: string) {
  return furnitureKinds.find((k) => k.id === id)?.name ?? "家具";
}
