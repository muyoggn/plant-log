import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

// Google Fonts の日本語フォントを読み込みます
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plant Log | 観葉植物の水やり記録",
  description: "観葉植物の育て方と水やりを、天気に合わせて記録・管理するアプリです。",
};

// すべてのページを包む「外枠」です
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
