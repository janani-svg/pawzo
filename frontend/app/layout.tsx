import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { PawzoProvider } from "./lib/store";
import NotificationScheduler from "./components/NotificationScheduler";
import { SoundProvider } from "./components/sound-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "PAWZO — A warm hug for your pet's whole life",
  description:
    "Track health, feeding, meds, growth, and memories — and reach an emergency vet fast. PAWZO keeps everything about your pet in one happy place.",
  appleWebApp: {
    title: "Pawzo",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EC4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PawzoProvider>
          <NotificationScheduler />
          <SoundProvider />
          {children}
        </PawzoProvider>
      </body>
    </html>
  );
}
