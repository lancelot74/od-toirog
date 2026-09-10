import type { Metadata } from "next";
import { Telemetry } from "@/components/telemetry";
import { asset } from "@/lib/paths";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/prata/cyrillic-400.css";
import "./globals.css";
import "./product.css";

export const metadata: Metadata = {
  title: "Од Тойрог | Таны төрсөн мөчийн тэнгэр",
  description: "Төрсөн мөчийн тэнгэрээс өөрийн натал зураг, зан чанар, харилцааны холбоосыг нээнэ.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://lancelot74.github.io'),
  openGraph: {title:'Од Тойрог',description:'Таны төрсөн мөчийн тэнгэр.',locale:'mn_MN',type:'website',images:[{url:asset('/assets/illustration/open-graph.jpg'),width:1200,height:630,alt:'Од Тойрог'}]},
  twitter: {card:'summary_large_image'},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>{children}<Telemetry/></body>
    </html>
  );
}
