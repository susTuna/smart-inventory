import type { Metadata, Viewport } from "next";
import { GeistSans, GeistMono } from "geist/font";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const _geistSans = GeistSans;
const _geistMono = GeistMono;

export const metadata: Metadata = {
  title: "SmartInventory - Warehouse Management System",
  description: "Real-time warehouse management with barcode scanning and inventory tracking",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%230f172a' width='100' height='100'/><text x='50' y='60' font-size='60' font-weight='bold' fill='%2364b5f6' text-anchor='middle'>S</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
