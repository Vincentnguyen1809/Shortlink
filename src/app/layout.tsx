import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thinksmart Shortlink",
  description: "Hệ thống rút gọn link nội bộ Thinksmart Insurance",
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
