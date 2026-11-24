"use client";
import { useWikiSummary } from "@/lib/wiki";

// 植物の小さな写真（Wikipedia の写真を使う。なければ頭文字）
export function PlantThumb({ title, name, size = 56 }: { title?: string; name: string; size?: number }) {
  const wiki = useWikiSummary(title);
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-soft text-accent"
      style={{ width: size, height: size }}
    >
      {wiki?.image ? (
        // 外部サイトの写真なので、Next.js の <Image> ではなく普通の <img> を使っています
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wiki.image} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="text-lg font-semibold">{name.slice(0, 1)}</span>
      )}
    </div>
  );
}
