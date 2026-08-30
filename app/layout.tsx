import type { Metadata } from "next";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/prata/cyrillic-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Од Тойрог | Таны төрсөн мөчийн тэнгэр",
  description: "Төрсөн мөчийн тэнгэрээс өөрийн натал зураг, зан чанар, харилцааны холбоосыг нээнэ.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
