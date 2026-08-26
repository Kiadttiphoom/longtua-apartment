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
      <body>{children}</body>
    </html>
  );
}
