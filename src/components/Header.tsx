import Link from "next/link";

// 画面の一番上に出るナビゲーション
export function Header() {
  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Plant Log
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/settings" className="text-muted hover:text-foreground">
            場所の設定
          </Link>
          <Link
            href="/plants/new"
            className="rounded-full bg-accent px-4 py-2 font-medium text-background hover:opacity-90"
          >
            植物を登録
          </Link>
        </div>
      </nav>
    </header>
  );
}
