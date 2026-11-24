// 「あと◯日」「今日」「◯日過ぎています」を表示する部品
export function DueLabel({ daysLeft }: { daysLeft: number }) {
  if (daysLeft > 1) return <span className="text-foreground">あと{daysLeft}日</span>;
  if (daysLeft === 1) return <span className="text-foreground">明日</span>;
  if (daysLeft === 0) return <span className="font-semibold text-warn">今日</span>;
  return <span className="font-semibold text-warn">{-daysLeft}日過ぎています</span>;
}
