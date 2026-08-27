import type { Metadata } from "next";
import "./globals.css";

const publicAssetsBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Longtua Apartment",
  description: "ระบบบริหารหอพักสำหรับผู้ดูแล เจ้าของกิจการ และทีมงาน",
  icons: publicAssetsBaseUrl
    ? { icon: `${publicAssetsBaseUrl}/brand/logo-circle.png` }
    : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
