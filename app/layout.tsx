import type { Metadata } from "next";
import "./globals.css";

const appIconUrl = "https://pub-21789b8a27d5437aabd9d0ac73eba341.r2.dev/brand/logo-circle.png";

export const metadata: Metadata = {
  title: "Longtua Apartment",
  description: "ระบบบริหารหอพักสำหรับผู้ดูแล เจ้าของกิจการ และทีมงาน",
  icons: {
    icon: [{ url: appIconUrl, type: "image/png" }],
    shortcut: [{ url: appIconUrl, type: "image/png" }],
    apple: [{ url: appIconUrl, type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Noto Sans Thai is required for the Thai demo and kept external to avoid bundling font binaries. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
