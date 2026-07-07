import "./globals.css";
import { Montserrat, Noto_Sans_JP } from "next/font/google";

// 💡 Montserratフォントの設定
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-montserrat",
});

// 💡 Noto Sans JPの設定（エラー回避のため subsets は "latin" に指定）
const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

export const metadata = {
  title: "PAL CORE Solutions",
  description: "統合マネジメントポータル",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${montserrat.variable} ${noto.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}