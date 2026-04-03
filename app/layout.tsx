import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Home Dashboard",
  description: "Holographic Voice Suite",
  icons: {
    icon: [
      { url: "/logo16.svg", type: "image/svg+xml" },
      { url: "/logo16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: "/logo192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
