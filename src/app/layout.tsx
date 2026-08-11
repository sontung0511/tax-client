import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thuế Nhẹ Nhàng",
  description: "Quản lý kê khai thuế cho hộ kinh doanh"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
