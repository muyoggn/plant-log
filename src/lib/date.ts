// 日付を "2026-11-24" の形の文字列で扱うための小さな道具です。
// （時刻まで入った Date をそのまま比べると、時差でずれることがあるため）

export function today(): string {
  return toKey(new Date());
}

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + n));
}

// a から b まで何日あるか（b が後なら プラス）
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function formatJa(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  const w = "日月火水木金土"[new Date(key + "T00:00:00").getDay()];
  return `${m}月${d}日（${w}）`;
}
