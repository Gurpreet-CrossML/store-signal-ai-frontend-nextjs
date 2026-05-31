import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/app/main-layout";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/Sessionproviders";
import StoreProvider from "@/redux/store-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Store Signals AI Analytics",
    default: "Store Signals AI Analytics",
  },
  description: "Store Signals AI Analytics is a master dashboard for all your store's analytics needs. It provides insights into sales, customer behavior, and inventory management, helping you make informed decisions to grow your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>
          <StoreProvider>
            <TooltipProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </TooltipProvider>
            <Toaster theme="light" />
          </StoreProvider>
        </Providers>
      </body>
    </html>
  );
}
