import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import SyncProvider from "@/components/SyncProvider";
import QueryProvider from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#8c4f00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Trung Bắc Cạn - App Nhập Liệu & Điều Hành",
  description: "Ứng dụng quản lý hạ tầng và san lấp Trung Bắc Cạn",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trung Bắc Cạn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@400,0..1,0,24&display=swap" rel="stylesheet" />
      </head>
      <body
        className={clsx(
          inter.variable,
          "font-sans antialiased min-h-screen flex flex-col bg-background text-foreground"
        )}
      >
        <div className="fixed inset-0 z-[-1]" style={{
            backgroundColor: '#f7f9fb',
            backgroundImage: 'radial-gradient(#eceef0 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}></div>
        <QueryProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
