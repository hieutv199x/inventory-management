import type { Metadata } from "next";
import { Inter, Roboto, Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from "../context/authContext";

// Configure Inter font with Vietnamese subset
const inter = Inter({ 
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: 'swap',
});

// Configure Roboto as fallback with Vietnamese subset
const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ['300', '400', '500', '700'],
  variable: "--font-roboto",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "9Connect - Quản lý cửa hàng",
  description: "Hệ thống quản lý cửa hàng và phân quyền người dùng",
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${roboto.variable}`}>
      <body className={`${inter.className} antialiased`}>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
      </body>
    </html>
  );
}
